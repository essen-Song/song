import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Download, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const InterviewCoachPage = ({ user }) => {
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [interviewType, setInterviewType] = useState('通用类');
  const [jobTitle, setJobTitle] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [allAnswers, setAllAnswers] = useState([]);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // 清理资源
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startInterview = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (!jobTitle.trim()) {
      toast.error('请输入目标职位');
      return;
    }

    try {
      const response = await axios.post('/api/interview/start', {
        userId: user.id,
        jobTitle: jobTitle,
        interviewType: interviewType
      });

      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        setCurrentQuestion(response.data.data.currentQuestion);
        setIsInterviewActive(true);
        setAllAnswers([]);
        setFeedback(null);
        setEvaluation(null);
        toast.success('面试会话开始！');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('开始面试失败:', error);
      toast.error(error.message || '开始面试失败');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('录音失败:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const submitAnswer = async (answerText) => {
    if (!sessionId || !answerText.trim()) {
      toast.error('请提供回答');
      return;
    }

    try {
      const response = await axios.post('/api/interview/answer', {
        sessionId: sessionId,
        questionId: allAnswers.length + 1,
        userAnswer: answerText,
        answerType: 'text'
      });

      if (response.data.success) {
        const newAnswer = {
          question: currentQuestion,
          answer: answerText,
          evaluation: response.data.data.evaluation,
          feedback: response.data.data.feedback
        };
        
        setAllAnswers(prev => [...prev, newAnswer]);
        setCurrentQuestion(response.data.data.nextQuestion);
        setFeedback(response.data.data.feedback);
        setEvaluation(response.data.data.evaluation);
        
        toast.success('回答提交成功！');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('提交回答失败:', error);
      toast.error(error.message || '提交回答失败');
    }
  };

  const submitVoiceAnswer = async () => {
    if (!audioBlob) {
      toast.error('请先录制语音');
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'answer.mp3');
    formData.append('sessionId', sessionId);
    formData.append('questionId', allAnswers.length + 1);

    try {
      const response = await axios.post('/api/interview/voice-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newAnswer = {
          question: currentQuestion,
          answer: response.data.data.voiceResult.text,
          evaluation: response.data.data.evaluation,
          feedback: response.data.data.feedback,
          voiceData: response.data.data.voiceResult
        };
        
        setAllAnswers(prev => [...prev, newAnswer]);
        setCurrentQuestion(response.data.data.nextQuestion);
        setFeedback(response.data.data.feedback);
        setEvaluation(response.data.data.evaluation);
        setAudioBlob(null);
        
        toast.success('语音回答提交成功！');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('提交语音回答失败:', error);
      toast.error(error.message || '提交语音回答失败');
    }
  };

  const endInterview = async () => {
    if (!sessionId) return;

    try {
      const response = await axios.post('/api/interview/end', {
        sessionId: sessionId,
        userId: user.id
      });

      if (response.data.success) {
        setIsInterviewActive(false);
        setCurrentQuestion('');
        toast.success('面试结束！报告已生成');
        
        // 可以下载报告或显示总结
        if (response.data.data.report) {
          console.log('面试报告:', response.data.data.report);
        }
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('结束面试失败:', error);
      toast.error(error.message || '结束面试失败');
    }
  };

  const playAIVoice = async (text) => {
    if (isMuted) return;

    try {
      const response = await axios.post('/api/interview/tts', {
        text: text,
        voice: 'xiaoyun'
      });

      if (response.data.success) {
        const audioData = response.data.data.audioData;
        const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
        audio.play().catch(error => {
          console.error('播放音频失败:', error);
        });
      }
    } catch (error) {
      console.error('语音合成失败:', error);
    }
  };

  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score / 20);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < fullStars ? 'star filled' : 'star'}>
          ★
        </span>
      );
    }
    
    return stars;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI面试教练
          </h1>
          <p className="text-xl text-gray-600">
            模拟真实面试场景，获得专业反馈和改进建议
          </p>
        </div>

        {/* 面试配置 */}
        {!isInterviewActive && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              面试配置
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标职位 *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="如：前端开发工程师、产品经理"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  面试类型
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="input-field"
                >
                  <option value="通用类">通用类</option>
                  <option value="技术类">技术类</option>
                  <option value="产品类">产品类</option>
                  <option value="运营类">运营类</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-lg transition-colors ${
                    isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <span className="text-sm text-gray-600">
                  {isMuted ? '已静音' : '语音播报'}
                </span>
              </div>
              
              <button
                onClick={startInterview}
                disabled={!jobTitle.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                开始面试
              </button>
            </div>
          </div>
        )}

        {/* 面试界面 */}
        {isInterviewActive && (
          <div className="interview-container">
            {/* 当前问题 */}
            <div className="interview-question">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  问题 {allAnswers.length + 1}
                </h3>
                <button
                  onClick={() => playAIVoice(currentQuestion)}
                  disabled={isMuted}
                  className="p-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">
                {currentQuestion}
              </p>
            </div>

            {/* 回答输入 */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                您的回答
              </h4>
              
              {/* 文本输入 */}
              <textarea
                placeholder="请在此输入您的回答..."
                className="textarea-field h-32 mb-4"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    submitAnswer(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={(e) => {
                    const textarea = e.target.parentElement.previousElementSibling;
                    submitAnswer(textarea.value);
                    textarea.value = '';
                  }}
                  className="btn-primary"
                >
                  提交回答
                </button>
              </div>

              {/* 语音录制 */}
              <div className="voice-recorder">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  或使用语音回答
                </h4>
                
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`record-button ${isRecording ? 'recording' : ''}`}
                >
                  {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    {isRecording ? '正在录音... 点击停止' : '点击开始录音'}
                  </p>
                  
                  {audioBlob && (
                    <div className="space-y-2">
                      <audio
                        src={URL.createObjectURL(audioBlob)}
                        controls
                        className="w-full"
                      />
                      <button
                        onClick={submitVoiceAnswer}
                        className="btn-primary"
                      >
                        提交语音回答
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 反馈和评价 */}
            {feedback && evaluation && (
              <div className="interview-feedback">
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  AI反馈
                </h4>
                
                {/* 评分 */}
                <div className="flex items-center mb-4">
                  <span className="text-sm font-medium text-gray-700 mr-3">
                    综合评分:
                  </span>
                  <div className="rating-stars mr-3">
                    {renderStars(evaluation.overallScore)}
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {evaluation.overallScore}/100
                  </span>
                </div>

                {/* STAR分析 */}
                {evaluation.starAnalysis && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      STAR模型分析
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(evaluation.starAnalysis).map(([key, analysis]) => (
                        <div key={key} className={`p-2 rounded text-center text-xs ${
                          analysis.present ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          <div className="font-medium">{key}</div>
                          <div>{analysis.present ? '✓' : '✗'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 具体反馈 */}
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-green-700 mb-1">
                      肯定亮点
                    </h5>
                    <p className="text-sm text-gray-700">
                      {feedback.strengths}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-orange-700 mb-1">
                      改进建议
                    </h5>
                    <p className="text-sm text-gray-700">
                      {feedback.improvements}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-blue-700 mb-1">
                      优化示例
                    </h5>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                      {feedback.example}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between mt-6">
              <button
                onClick={endInterview}
                className="btn-secondary flex items-center"
              >
                <RotateCcw size={16} className="mr-2" />
                结束面试
              </button>
              
              <div className="text-sm text-gray-500">
                已回答 {allAnswers.length} 个问题
              </div>
            </div>
          </div>
        )}

        {/* 历史记录 */}
        {allAnswers.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              面试记录
            </h3>
            
            <div className="space-y-6">
              {allAnswers.map((answer, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      问题 {index + 1}:
                    </span>
                    <p className="text-gray-800 mt-1">
                      {answer.question}
                    </p>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      回答:
                    </span>
                    <p className="text-gray-800 mt-1">
                      {answer.answer}
                    </p>
                  </div>
                  
                  {answer.evaluation && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>评分:</span>
                      <div className="rating-stars">
                        {renderStars(answer.evaluation.overallScore)}
                      </div>
                      <span>{answer.evaluation.overallScore}/100</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewCoachPage;