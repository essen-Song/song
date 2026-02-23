const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AIInterviewCoach = require('../utils/aiInterview');
const VoiceService = require('../utils/voiceService');
const { supabase, DatabaseHelper } = require('../utils/supabase');

const router = express.Router();
const interviewCoach = new AIInterviewCoach();
const voiceService = new VoiceService();
const dbHelper = new DatabaseHelper();

// 配置文件上传（用于语音文件）
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp3', '.wav', '.m4a', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持音频文件格式'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * POST /api/interview/start
 * 开始面试会话
 */
router.post('/start', express.json(), async (req, res) => {
  try {
    const { userId, jobTitle, interviewType = '通用类' } = req.body;
    
    if (!userId || !jobTitle) {
      return res.status(400).json({
        success: false,
        error: '用户ID和职位标题不能为空'
      });
    }
    
    console.log(`开始面试会话，用户: ${userId}, 职位: ${jobTitle}`);
    
    // 开始面试会话
    const result = await interviewCoach.startInterviewSession(userId, jobTitle, interviewType);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // 保存会话信息到数据库
    const sessionData = {
      session_id: result.session.sessionId,
      user_id: userId,
      job_title: jobTitle,
      interview_type: interviewType,
      status: 'active',
      current_question: result.currentQuestion,
      questions: JSON.stringify(result.session.questions),
      start_time: result.session.startTime
    };
    
    try {
      await dbHelper.insertInterviewLog({
        user_id: userId,
        job_title: jobTitle,
        question: result.currentQuestion,
        session_id: result.session.sessionId
      });
    } catch (dbError) {
      console.error('保存面试记录失败:', dbError);
    }
    
    res.json({
      success: true,
      data: {
        sessionId: result.session.sessionId,
        currentQuestion: result.currentQuestion,
        interviewType: interviewType,
        jobTitle: jobTitle
      },
      message: '面试会话开始成功'
    });
    
  } catch (error) {
    console.error('开始面试会话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '开始面试会话失败'
    });
  }
});

/**
 * POST /api/interview/answer
 * 提交面试回答
 */
router.post('/answer', express.json(), async (req, res) => {
  try {
    const { sessionId, questionId, userAnswer, answerType = 'text' } = req.body;
    
    if (!sessionId || !questionId || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: '会话ID、问题ID和用户回答不能为空'
      });
    }
    
    console.log(`处理面试回答，会话: ${sessionId}, 问题: ${questionId}`);
    
    // 处理用户回答
    const result = await interviewCoach.processAnswer(sessionId, questionId, userAnswer, answerType);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // 保存回答记录到数据库
    const answerData = {
      session_id: sessionId,
      question: result.evaluation?.question || '用户回答',
      answer: userAnswer,
      answer_type: answerType,
      feedback: JSON.stringify(result.feedback),
      score: result.evaluation?.overallScore || 70,
      star_analysis: JSON.stringify(result.evaluation?.starAnalysis || {})
    };
    
    try {
      await dbHelper.insertInterviewLog(answerData);
    } catch (dbError) {
      console.error('保存回答记录失败:', dbError);
    }
    
    res.json({
      success: true,
      data: {
        evaluation: result.evaluation,
        feedback: result.feedback,
        nextQuestion: result.nextQuestion,
        sessionId: sessionId
      },
      message: '回答处理完成'
    });
    
  } catch (error) {
    console.error('处理面试回答失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '处理面试回答失败'
    });
  }
});

/**
 * POST /api/interview/voice-upload
 * 上传语音回答
 */
router.post('/voice-upload', upload.single('audio'), async (req, res) => {
  try {
    const { sessionId, questionId } = req.body;
    const audioFile = req.file;
    
    if (!sessionId || !questionId || !audioFile) {
      return res.status(400).json({
        success: false,
        error: '会话ID、问题ID和音频文件不能为空'
      });
    }
    
    console.log(`处理语音回答上传，会话: ${sessionId}`);
    
    // 语音识别
    const audioData = fs.readFileSync(audioFile.path);
    const sttResult = await voiceService.speechToText(audioData);
    
    if (!sttResult.success && !sttResult.mock) {
      throw new Error('语音识别失败: ' + sttResult.error);
    }
    
    const userAnswer = sttResult.text;
    const confidence = sttResult.confidence || 0.8;
    
    // 处理回答（与文本回答相同的逻辑）
    const result = await interviewCoach.processAnswer(sessionId, questionId, userAnswer, 'voice');
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // 保存语音文件到Supabase Storage
    let audioUrl = null;
    try {
      const fileName = `${sessionId}/${questionId}-${Date.now()}.mp3`;
      const { data, error } = await supabase.storage
        .from('interview-audio')
        .upload(fileName, audioData, {
          contentType: 'audio/mp3',
          upsert: false
        });
      
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('interview-audio')
          .getPublicUrl(fileName);
        audioUrl = publicUrl;
      }
    } catch (storageError) {
      console.error('保存语音文件失败:', storageError);
    }
    
    // 保存回答记录
    const answerData = {
      session_id: sessionId,
      question: result.evaluation?.question || '语音回答',
      answer: userAnswer,
      answer_type: 'voice',
      answer_audio_url: audioUrl,
      feedback: JSON.stringify(result.feedback),
      score: result.evaluation?.overallScore || 70,
      star_analysis: JSON.stringify(result.evaluation?.starAnalysis || {}),
      voice_confidence: confidence
    };
    
    try {
      await dbHelper.insertInterviewLog(answerData);
    } catch (dbError) {
      console.error('保存语音回答记录失败:', dbError);
    }
    
    // 清理临时文件
    fs.unlinkSync(audioFile.path);
    
    res.json({
      success: true,
      data: {
        evaluation: result.evaluation,
        feedback: result.feedback,
        nextQuestion: result.nextQuestion,
        sessionId: sessionId,
        voiceResult: {
          text: userAnswer,
          confidence: confidence,
          audioUrl: audioUrl
        }
      },
      message: '语音回答处理完成'
    });
    
  } catch (error) {
    console.error('处理语音回答失败:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || '处理语音回答失败'
    });
  }
});

/**
 * POST /api/interview/tts
 * 文字转语音（AI面试官语音回复）
 */
router.post('/tts', express.json(), async (req, res) => {
  try {
    const { text, voice = 'xiaoyun', options = {} } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: '合成文本不能为空'
      });
    }
    
    console.log(`生成语音回复: ${text.substring(0, 50)}...`);
    
    // 语音合成
    const ttsOptions = {
      tts: {
        voice: voice,
        ...options
      }
    };
    
    const ttsResult = await voiceService.textToSpeech(text, ttsOptions);
    
    if (!ttsResult.success && !ttsResult.mock) {
      throw new Error('语音合成失败: ' + ttsResult.error);
    }
    
    // 保存音频文件
    const fileName = `tts-${Date.now()}`;
    const saveResult = await voiceService.saveAudioFile(
      ttsResult.audioData,
      fileName,
      ttsResult.format
    );
    
    if (!saveResult.success) {
      console.warn('保存语音文件失败:', saveResult.error);
    }
    
    res.json({
      success: true,
      data: {
        audioData: ttsResult.audioData.toString('base64'),
        format: ttsResult.format,
        duration: ttsResult.duration,
        filePath: saveResult.filePath
      },
      message: '语音合成完成'
    });
    
  } catch (error) {
    console.error('语音合成失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '语音合成失败'
    });
  }
});

/**
 * POST /api/interview/end
 * 结束面试会话并生成报告
 */
router.post('/end', express.json(), async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    
    if (!sessionId || !userId) {
      return res.status(400).json({
        success: false,
        error: '会话ID和用户ID不能为空'
      });
    }
    
    console.log(`结束面试会话: ${sessionId}`);
    
    // 获取会话的所有回答记录
    const { data: interviewLogs, error } = await supabase
      .from('interview_logs')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new Error('获取面试记录失败');
    }
    
    if (!interviewLogs || interviewLogs.length === 0) {
      return res.status(404).json({
        success: false,
        error: '未找到面试记录'
      });
    }
    
    // 生成面试报告
    const reportResult = await interviewCoach.generateInterviewReport(sessionId, interviewLogs);
    
    if (!reportResult.success) {
      throw new Error(reportResult.error);
    }
    
    // 保存报告到数据库
    const reportData = {
      session_id: sessionId,
      user_id: userId,
      overall_score: reportResult.report.overallScore,
      total_questions: reportResult.report.totalQuestions,
      strengths: JSON.stringify(reportResult.report.strengths),
      improvements: JSON.stringify(reportResult.report.improvements),
      star_analysis: JSON.stringify(reportResult.report.starAnalysis),
      recommendations: JSON.stringify(reportResult.report.recommendations),
      end_time: new Date().toISOString()
    };
    
    try {
      // 这里可以创建专门的面试报告表
      console.log('面试报告生成完成:', reportData);
    } catch (dbError) {
      console.error('保存面试报告失败:', dbError);
    }
    
    res.json({
      success: true,
      data: {
        report: reportResult.report,
        sessionId: sessionId,
        totalQuestions: interviewLogs.length
      },
      message: '面试报告生成完成'
    });
    
  } catch (error) {
    console.error('结束面试会话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '结束面试会话失败'
    });
  }
});

/**
 * GET /api/interview/history/:userId
 * 获取面试历史记录
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '用户ID不能为空'
      });
    }
    
    // 获取面试记录
    const { data, error } = await supabase
      .from('interview_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error('获取面试历史失败');
    }
    
    // 按会话分组
    const sessions = {};
    data.forEach(log => {
      if (!sessions[log.session_id]) {
        sessions[log.session_id] = {
          sessionId: log.session_id,
          jobTitle: log.job_title,
          startTime: log.created_at,
          questions: []
        };
      }
      
      sessions[log.session_id].questions.push({
        question: log.question,
        answer: log.answer,
        score: log.score,
        feedback: log.feedback ? JSON.parse(log.feedback) : null,
        starAnalysis: log.star_analysis ? JSON.parse(log.star_analysis) : null
      });
    });
    
    const sessionList = Object.values(sessions);
    
    res.json({
      success: true,
      data: sessionList,
      count: sessionList.length,
      hasMore: data.length === limit
    });
    
  } catch (error) {
    console.error('获取面试历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取面试历史失败'
    });
  }
});

/**
 * GET /api/interview/questions
 * 获取面试问题类型和示例
 */
router.get('/questions', (req, res) => {
  try {
    const questionTypes = {
      '技术类': [
        '请介绍一个你最有成就感的项目，你在其中承担什么角色？',
        '遇到技术难题时，你通常如何分析和解决？',
        '如何保持对新技术的学习和跟进？'
      ],
      '产品类': [
        '如何理解用户需求？请举例说明你如何发现用户痛点。',
        '产品上线后发现数据表现不佳，你会如何分析？',
        '如何与技术团队沟通产品需求？'
      ],
      '运营类': [
        '如何制定用户增长策略？请分享你的思路。',
        '活动策划中最重要的因素是什么？',
        '如何评估运营活动的效果？'
      ],
      '通用类': [
        '请做一个简单的自我介绍。',
        '为什么选择我们公司？',
        '你的职业规划是什么？'
      ]
    };
    
    res.json({
      success: true,
      data: questionTypes,
      message: '面试问题类型获取成功'
    });
    
  } catch (error) {
    console.error('获取面试问题失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取面试问题失败'
    });
  }
});

module.exports = router;