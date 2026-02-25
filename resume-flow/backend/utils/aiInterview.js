const axios = require('axios');

/**
 * AI面试教练服务
 * 提供模拟面试、语音交互、实时反馈等功能
 */
class AIInterviewCoach {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    this.model = 'qwen-72b-chat';
    
    // 面试题库
    this.interviewQuestions = {
      '技术类': [
        '请介绍一个你最有成就感的项目，你在其中承担什么角色？',
        '遇到技术难题时，你通常如何分析和解决？',
        '如何保持对新技术的学习和跟进？',
        '请描述一次团队合作中解决冲突的经历。',
        '你对代码质量是如何理解的？如何保证代码质量？'
      ],
      '产品类': [
        '如何理解用户需求？请举例说明你如何发现用户痛点。',
        '产品上线后发现数据表现不佳，你会如何分析？',
        '如何与技术团队沟通产品需求？',
        '请分析一个你常用的产品，它的优缺点是什么？',
        '如何做竞品分析？你通常关注哪些方面？'
      ],
      '运营类': [
        '如何制定用户增长策略？请分享你的思路。',
        '活动策划中最重要的因素是什么？',
        '如何评估运营活动的效果？',
        '用户留存率低，你会如何分析原因？',
        '如何做用户分层运营？'
      ],
      '通用类': [
        '请做一个简单的自我介绍。',
        '为什么选择我们公司？',
        '你的职业规划是什么？',
        '你最大的优点和缺点是什么？',
        '期望的薪资是多少？为什么？'
      ]
    };
    
    // STAR模型评估标准
    this.starCriteria = {
      'S': {
        name: '情境(Situation)',
        description: '是否清晰描述了背景和情境？',
        keywords: ['背景', '情况', '当时', '面临']
      },
      'T': {
        name: '任务(Task)',
        description: '是否明确说明了任务目标？',
        keywords: ['负责', '任务', '目标', '需要']
      },
      'A': {
        name: '行动(Action)',
        description: '是否详细描述了采取的行动？',
        keywords: ['采取', '行动', '解决', '协调', '分析']
      },
      'R': {
        name: '结果(Result)',
        description: '是否量化了最终结果？',
        keywords: ['结果', '提升', '降低', '增加', '节省', '完成']
      }
    };
  }
  
  /**
   * 开始面试会话
   */
  async startInterviewSession(userId, jobTitle, interviewType = '通用类') {
    try {
      const sessionId = this.generateSessionId();
      
      // 获取初始问题
      const initialQuestion = await this.generateInitialQuestion(jobTitle, interviewType);
      
      const session = {
        sessionId: sessionId,
        userId: userId,
        jobTitle: jobTitle,
        interviewType: interviewType,
        startTime: new Date().toISOString(),
        questions: [{
          id: 1,
          question: initialQuestion,
          timestamp: new Date().toISOString()
        }],
        currentQuestionId: 1,
        status: 'active'
      };
      
      return {
        success: true,
        session: session,
        currentQuestion: initialQuestion
      };
      
    } catch (error) {
      console.error('开始面试会话失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 生成初始问题
   */
  async generateInitialQuestion(jobTitle, interviewType) {
    // 根据职位类型生成定制化问题
    const jobType = this.categorizeJobType(jobTitle);
    const questions = this.interviewQuestions[jobType] || this.interviewQuestions['通用类'];
    
    // 选择第一个问题或随机选择
    return questions[0];
  }
  
  /**
   * 分类职位类型
   */
  categorizeJobType(jobTitle) {
    const title = jobTitle.toLowerCase();
    
    if (title.includes('前端') || title.includes('后端') || title.includes('开发') || title.includes('工程师')) {
      return '技术类';
    } else if (title.includes('产品') || title.includes('pm')) {
      return '产品类';
    } else if (title.includes('运营')) {
      return '运营类';
    } else {
      return '通用类';
    }
  }
  
  /**
   * 处理用户回答
   */
  async processAnswer(sessionId, questionId, userAnswer, answerType = 'text') {
    try {
      if (!userAnswer || userAnswer.trim().length < 10) {
        return {
          success: false,
          error: '回答内容太短，请提供更详细的回答'
        };
      }
      
      // 获取当前会话信息（这里简化处理，实际应该从数据库获取）
      const session = {
        sessionId: sessionId,
        jobTitle: '软件工程师',
        interviewType: '技术类'
      };
      
      // 评估回答
      const evaluation = await this.evaluateAnswer(userAnswer, session);
      
      // 生成下一个问题
      const nextQuestion = await this.generateNextQuestion(userAnswer, evaluation, session);
      
      // 生成反馈
      const feedback = await this.generateFeedback(userAnswer, evaluation);
      
      return {
        success: true,
        evaluation: evaluation,
        feedback: feedback,
        nextQuestion: nextQuestion,
        sessionId: sessionId
      };
      
    } catch (error) {
      console.error('处理回答失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 评估用户回答
   */
  async evaluateAnswer(userAnswer, session) {
    try {
      const prompt = `你是一个有10年经验的面试官，请根据以下标准评估应聘者的回答：

回答内容：
"""
${userAnswer}
"""

评估标准：
1. STAR模型完整性（情境-任务-行动-结果）
2. 内容的具体性和可信度
3. 与职位相关的技能展示
4. 逻辑清晰度和表达能力
5. 是否包含量化成果

职位类型：${session.jobTitle}

请提供详细的评估结果，包括：
- 总体评分（0-100分）
- STAR模型各维度评分
- 具体优点
- 改进建议
- 关键词匹配情况

输出JSON格式。`;
      
      const aiResponse = await this.callAIAPI(prompt);
      const evaluation = this.parseEvaluationResponse(aiResponse);
      
      // 补充STAR分析
      evaluation.starAnalysis = this.analyzeSTAR(userAnswer);
      
      return evaluation;
      
    } catch (error) {
      console.error('评估回答失败:', error);
      return this.getMockEvaluation(userAnswer);
    }
  }
  
  /**
   * 分析STAR模型
   */
  analyzeSTAR(text) {
    const analysis = {};
    const lowerText = text.toLowerCase();
    
    for (const [key, criteria] of Object.entries(this.starCriteria)) {
      const matchedKeywords = criteria.keywords.filter(keyword => 
        lowerText.includes(keyword)
      );
      
      analysis[key] = {
        present: matchedKeywords.length > 0,
        score: matchedKeywords.length > 0 ? 25 : 0,
        matchedKeywords: matchedKeywords,
        suggestion: matchedKeywords.length === 0 ? `建议加入${criteria.name}相关内容` : '表现良好'
      };
    }
    
    return analysis;
  }
  
  /**
   * 生成下一个问题
   */
  async generateNextQuestion(userAnswer, evaluation, session) {
    try {
      // 根据当前回答的深度和质量决定下一个问题
      const score = evaluation.overallScore || 70;
      
      let nextQuestion;
      
      if (score < 60) {
        // 如果回答不够好，追问细节
        nextQuestion = await this.generateFollowUpQuestion(userAnswer, 'detail');
      } else if (score > 85) {
        // 如果回答很好，问一个更有挑战性的问题
        nextQuestion = await this.generateFollowUpQuestion(userAnswer, 'challenge');
      } else {
        // 正常流程，问下一个标准问题
        nextQuestion = await this.getNextStandardQuestion(session);
      }
      
      return nextQuestion;
      
    } catch (error) {
      console.error('生成下一个问题失败:', error);
      return '请分享另一个相关的经历或案例。';
    }
  }
  
  /**
   * 生成追问问题
   */
  async generateFollowUpQuestion(userAnswer, type) {
    const followUpPrompts = {
      detail: '请更详细地描述一下你提到的具体情况，包括背景、你面临的具体挑战是什么？',
      challenge: '在这个经历中，你遇到的最大困难是什么？你是如何克服的？',
      result: '你提到取得了一些成果，能否用具体的数据来说明这些成果？',
      learning: '从这个经历中，你学到了什么？如果再来一次，你会怎么做？'
    };
    
    if (type === 'detail') {
      return followUpPrompts.detail;
    } else if (type === 'challenge') {
      return followUpPrompts.challenge;
    }
    
    // 使用AI生成更个性化的问题
    const prompt = `基于这个回答："${userAnswer}"，生成一个追问问题来了解更多细节。`;
    
    try {
      const aiResponse = await this.callAIAPI(prompt);
      return aiResponse.trim() || followUpPrompts.detail;
    } catch (error) {
      return followUpPrompts.detail;
    }
  }
  
  /**
   * 获取下一个标准问题
   */
  async getNextStandardQuestion(session) {
    const questions = this.interviewQuestions[session.interviewType] || this.interviewQuestions['通用类'];
    
    // 简化的逻辑：选择下一个问题
    // 实际应该基于已回答的问题和会话状态
    const nextIndex = Math.floor(Math.random() * questions.length);
    return questions[nextIndex];
  }
  
  /**
   * 生成反馈
   */
  async generateFeedback(userAnswer, evaluation) {
    try {
      const prompt = `基于以下评估结果，为应聘者生成三段式反馈：

评估结果：${JSON.stringify(evaluation, null, 2)}

原始回答：${userAnswer}

请输出：
【肯定亮点】指出回答中的优点
【改进建议】提供具体的改进建议
【优化示例】给出一个更好的回答示例

语气要专业但温和，避免使用负面词汇。`;
      
      const feedback = await this.callAIAPI(prompt);
      return this.parseFeedbackResponse(feedback);
      
    } catch (error) {
      console.error('生成反馈失败:', error);
      return this.getMockFeedback(evaluation);
    }
  }
  
  /**
   * 生成面试报告
   */
  async generateInterviewReport(sessionId, allAnswers) {
    try {
      const totalScore = allAnswers.reduce((sum, answer) => 
        sum + (answer.evaluation?.overallScore || 70), 0
      ) / allAnswers.length;
      
      const report = {
        sessionId: sessionId,
        overallScore: Math.round(totalScore),
        totalQuestions: allAnswers.length,
        averageScore: Math.round(totalScore),
        strengths: this.extractStrengths(allAnswers),
        improvements: this.extractImprovements(allAnswers),
        starAnalysis: this.aggregateSTARAnalysis(allAnswers),
        recommendations: await this.generateRecommendations(allAnswers),
        generatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        report: report
      };
      
    } catch (error) {
      console.error('生成面试报告失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 提取优势
   */
  extractStrengths(allAnswers) {
    const strengths = [];
    
    allAnswers.forEach(answer => {
      if (answer.evaluation?.strengths) {
        strengths.push(...answer.evaluation.strengths);
      }
    });
    
    return [...new Set(strengths)].slice(0, 5); // 去重并限制数量
  }
  
  /**
   * 提取改进点
   */
  extractImprovements(allAnswers) {
    const improvements = [];
    
    allAnswers.forEach(answer => {
      if (answer.evaluation?.improvements) {
        improvements.push(...answer.evaluation.improvements);
      }
    });
    
    return [...new Set(improvements)].slice(0, 5);
  }
  
  /**
   * 聚合STAR分析
   */
  aggregateSTARAnalysis(allAnswers) {
    const aggregated = {
      S: { total: 0, present: 0 },
      T: { total: 0, present: 0 },
      A: { total: 0, present: 0 },
      R: { total: 0, present: 0 }
    };
    
    allAnswers.forEach(answer => {
      if (answer.evaluation?.starAnalysis) {
        Object.entries(answer.evaluation.starAnalysis).forEach(([key, analysis]) => {
          aggregated[key].total++;
          if (analysis.present) {
            aggregated[key].present++;
          }
        });
      }
    });
    
    return aggregated;
  }
  
  /**
   * 生成建议
   */
  async generateRecommendations(allAnswers) {
    const starAnalysis = this.aggregateSTARAnalysis(allAnswers);
    const recommendations = [];
    
    // 基于STAR分析生成建议
    Object.entries(starAnalysis).forEach(([key, data]) => {
      const percentage = data.total > 0 ? (data.present / data.total) * 100 : 0;
      
      if (percentage < 50) {
        const criteria = this.starCriteria[key];
        recommendations.push(`加强${criteria.name}部分的描述，${criteria.description}`);
      }
    });
    
    return recommendations;
  }
  
  /**
   * 调用AI API
   */
  async callAIAPI(prompt) {
    if (!this.apiKey) {
      throw new Error('API密钥未配置');
    }
    
    const requestData = {
      model: this.model,
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一个专业的HR面试官，请提供详细、专业的评估和建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        result_format: 'message',
        temperature: 0.7,
        max_tokens: 1500
      }
    };
    
    try {
      const response = await axios.post(this.baseURL, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (response.data && response.data.output && response.data.output.choices) {
        return response.data.output.choices[0].message.content;
      } else {
        throw new Error('AI API响应格式异常');
      }
      
    } catch (error) {
      console.error('AI API调用失败:', error);
      throw new Error('AI服务调用失败');
    }
  }
  
  /**
   * 解析评估响应
   */
  parseEvaluationResponse(response) {
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果无法解析JSON，返回模拟数据
      return this.getMockEvaluation();
      
    } catch (error) {
      return this.getMockEvaluation();
    }
  }
  
  /**
   * 解析反馈响应
   */
  parseFeedbackResponse(response) {
    const sections = {
      strengths: '',
      improvements: '',
      example: ''
    };
    
    // 简单的文本解析
    const lines = response.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.includes('肯定亮点') || line.includes('优点')) {
        currentSection = 'strengths';
      } else if (line.includes('改进建议') || line.includes('建议')) {
        currentSection = 'improvements';
      } else if (line.includes('优化示例') || line.includes('示例')) {
        currentSection = 'example';
      } else if (currentSection && line.trim()) {
        sections[currentSection] += line.trim() + ' ';
      }
    }
    
    return {
      strengths: sections.strengths.trim(),
      improvements: sections.improvements.trim(),
      example: sections.example.trim()
    };
  }
  
  /**
   * 获取模拟评估数据
   */
  getMockEvaluation(userAnswer) {
    return {
      overallScore: 75,
      starScore: {
        S: 20,
        T: 18,
        A: 22,
        R: 15
      },
      strengths: [
        '回答结构清晰，有条理性',
        '能够结合具体经历进行说明',
        '表达了积极的学习态度'
      ],
      improvements: [
        '可以增加更多量化的成果数据',
        '建议更详细描述具体的行动步骤',
        '可以强调结果的影响和意义'
      ],
      starAnalysis: this.analyzeSTAR(userAnswer || ''),
      keywordMatch: 80
    };
  }
  
  /**
   * 获取模拟反馈
   */
  getMockFeedback(evaluation) {
    return {
      strengths: '你的回答思路清晰，能够结合具体经历，这是很宝贵的。',
      improvements: '建议加入更多量化的数据来支撑你的成果，这样更有说服力。',
      example: '比如你可以说："通过优化流程，我们将处理时间从3天缩短到1天，效率提升了200%，每月为团队节省约40个工时。"'
    };
  }
  
  /**
   * 生成会话ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = AIInterviewCoach;