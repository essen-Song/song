const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

/**
 * AI简历优化服务
 * 基于阿里云通义千问API
 */
class AIOptimizer {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    this.model = 'qwen-72b-chat';
    
    if (!this.apiKey) {
      console.warn('DASHSCOPE_API_KEY 未配置，将使用模拟数据');
    }
  }
  
  /**
   * 优化简历内容
   * @param {string} originalText - 原始简历文本
   * @param {string} jobDescription - 岗位JD
   * @param {string} type - 优化类型: 'self_evaluation' | 'project_description' | 'work_experience'
   * @returns {Promise<Object>} 优化结果
   */
  async optimizeResume(originalText, jobDescription, type = 'self_evaluation') {
    try {
      if (!originalText || !jobDescription) {
        throw new Error('原始文本和岗位JD不能为空');
      }
      
      // 构建优化提示词
      const prompt = this.buildOptimizationPrompt(originalText, jobDescription, type);
      
      // 调用AI API
      const aiResult = await this.callAIAPI(prompt);
      
      // 解析AI响应
      const optimizedContent = this.parseAIResponse(aiResult, jobDescription);
      
      return {
        success: true,
        data: optimizedContent,
        originalText: originalText,
        jobDescription: jobDescription,
        type: type
      };
      
    } catch (error) {
      console.error('AI优化失败:', error);
      
      // 如果AI调用失败，返回模拟数据
      return {
        success: false,
        error: error.message,
        data: this.getMockOptimization(originalText, jobDescription, type)
      };
    }
  }
  
  /**
   * 构建优化提示词
   */
  buildOptimizationPrompt(originalText, jobDescription, type) {
    const typeDescriptions = {
      self_evaluation: '自我评价',
      project_description: '项目描述',
      work_experience: '工作经历'
    };
    
    const typeDescription = typeDescriptions[type] || '内容';
    
    return `你是一个资深HR和职业发展顾问，擅长帮助求职者优化简历，提升ATS（自动筛选系统）通过率。

任务：根据用户的原始${typeDescription}和目标岗位JD，改写${typeDescription}，使其更匹配招聘要求。

要求：
1. 使用STAR模型（情境-任务-行动-结果）
2. 加入量化数据（如“提升35%”“覆盖1000人”“节省20%成本”）
3. 嵌入JD中的关键词和技能要求
4. 语言简洁专业，不超过200字
5. 输出3个版本：精简版（<100字）、专业版（<150字）、高匹配版（含关键词+STAR）
6. 分析缺失的关键词

用户原始${typeDescription}：
"""
${originalText}
"""

目标岗位JD：
"""
${jobDescription}
"""

请输出JSON格式：
{
  "version1": "精简版内容",
  "version2": "专业版内容", 
  "version3": "高匹配版内容",
  "missing_keywords": ["关键词1", "关键词2"],
  "optimization_reason": "优化理由说明"
}

注意：
- 不要编造虚假信息，基于用户真实经历进行优化
- 突出与JD最相关的经验和技能
- 使用主动语态和强有力的动词
- 确保内容真实可信，不夸大其词`;
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
            content: '你是一个专业的HR和简历优化专家。请严格按照用户要求输出JSON格式内容。'
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
        timeout: 30000 // 30秒超时
      });
      
      if (response.data && response.data.output && response.data.output.choices) {
        return response.data.output.choices[0].message.content;
      } else {
        throw new Error('AI API响应格式异常');
      }
      
    } catch (error) {
      if (error.response) {
        console.error('AI API错误:', error.response.data);
        throw new Error(`AI服务错误: ${error.response.data.message || '未知错误'}`);
      } else if (error.request) {
        console.error('AI API请求超时');
        throw new Error('AI服务请求超时，请稍后重试');
      } else {
        console.error('AI API调用失败:', error.message);
        throw new Error('AI服务调用失败');
      }
    }
  }
  
  /**
   * 解析AI响应
   */
  parseAIResponse(aiResponse, jobDescription) {
    try {
      // 尝试解析JSON响应
      let parsedContent;
      
      // 提取JSON部分（如果AI返回了额外文本）
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = JSON.parse(aiResponse);
      }
      
      // 验证必要字段
      const requiredFields = ['version1', 'version2', 'version3', 'missing_keywords'];
      for (const field of requiredFields) {
        if (!parsedContent[field]) {
          throw new Error(`AI响应缺少必要字段: ${field}`);
        }
      }
      
      // 提取JD关键词（用于验证）
      const jdKeywords = this.extractKeywords(jobDescription);
      
      return {
        versions: {
          concise: parsedContent.version1,
          professional: parsedContent.version2,
          optimized: parsedContent.version3
        },
        missingKeywords: parsedContent.missing_keywords,
        optimizationReason: parsedContent.optimization_reason || '',
        jdKeywords: jdKeywords,
        keywordMatchRate: this.calculateKeywordMatchRate(parsedContent.version3, jdKeywords)
      };
      
    } catch (error) {
      console.error('解析AI响应失败:', error);
      throw new Error('AI响应格式错误');
    }
  }
  
  /**
   * 提取关键词
   */
  extractKeywords(text) {
    // 简化的关键词提取
    const keywords = [];
    const skillPatterns = [
      /数据分析/gi, /用户增长/gi, /A\/B测试/gi, /产品管理/gi, /项目管理/gi,
      /机器学习/gi, /深度学习/gi, /Python/gi, /SQL/gi, /Excel/gi,
      /React/gi, /Vue/gi, /Node\.js/gi, /Java/gi, /Spring/gi,
      /沟通/gi, /协调/gi, /团队/gi, /领导/gi, /创新/gi
    ];
    
    for (const pattern of skillPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.map(m => m.toLowerCase()));
      }
    }
    
    return [...new Set(keywords)];
  }
  
  /**
   * 计算关键词匹配率
   */
  calculateKeywordMatchRate(text, keywords) {
    if (!keywords.length) return 0;
    
    const lowerText = text.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    return Math.round((matchedKeywords.length / keywords.length) * 100);
  }
  
  /**
   * 获取模拟优化数据（当AI服务不可用时）
   */
  getMockOptimization(originalText, jobDescription, type) {
    const mockData = {
      self_evaluation: {
        versions: {
          concise: '具备扎实的技术背景和优秀的团队协作能力，善于解决复杂问题。',
          professional: '拥有3年软件开发经验，精通前端技术栈，具备良好的产品思维和用户导向意识。',
          optimized: '作为全栈开发工程师，我具备扎实的技术背景和丰富的项目经验。在上一家公司，我主导开发了用户增长系统，通过A/B测试优化注册流程，将用户转化率提升35%。我熟练掌握React、Node.js等技术栈，具备良好的数据分析能力和团队协作精神。'
        },
        missingKeywords: ['数据分析', 'A/B测试', '用户增长'],
        optimizationReason: '突出技术能力和项目成果，加入量化数据',
        jdKeywords: ['数据分析', '用户增长', 'A/B测试', '团队协作'],
        keywordMatchRate: 85
      },
      project_description: {
        versions: {
          concise: '开发了智能推荐系统，提升用户体验。',
          professional: '设计并实现基于机器学习的智能推荐算法，显著提升用户满意度和平台粘性。',
          optimized: '负责智能推荐系统的设计与开发，运用机器学习算法分析用户行为数据，构建个性化推荐模型。通过A/B测试持续优化算法，将用户点击率提升25%，平均停留时间增加40%，显著改善了用户体验和平台粘性。'
        },
        missingKeywords: ['机器学习', '个性化推荐', '用户行为分析'],
        optimizationReason: '使用STAR模型，加入技术细节和量化成果',
        jdKeywords: ['机器学习', '数据分析', 'A/B测试', '用户体验'],
        keywordMatchRate: 90
      },
      work_experience: {
        versions: {
          concise: '负责产品功能开发和用户反馈处理。',
          professional: '作为核心开发成员，参与产品全生命周期管理，从需求分析到上线部署。',
          optimized: '在XX公司担任产品经理期间，负责用户增长产品的规划和落地。通过深入的用户调研和数据分析，识别关键用户痛点，设计解决方案。主导A/B测试流程，优化产品功能，实现月活跃用户增长50%，用户留存率提升30%的显著成果。'
        },
        missingKeywords: ['用户调研', '数据分析', 'A/B测试'],
        optimizationReason: '突出产品管理经验和数据驱动决策能力',
        jdKeywords: ['产品管理', '用户调研', '数据分析', 'A/B测试'],
        keywordMatchRate: 88
      }
    };
    
    return mockData[type] || mockData.self_evaluation;
  }
  
  /**
   * 批量优化多个文本段
   */
  async optimizeMultiple(originalTexts, jobDescription) {
    const results = {};
    
    for (const [key, text] of Object.entries(originalTexts)) {
      try {
        const result = await this.optimizeResume(text, jobDescription, key);
        results[key] = result;
      } catch (error) {
        results[key] = {
          success: false,
          error: error.message,
          data: this.getMockOptimization(text, jobDescription, key)
        };
      }
    }
    
    return results;
  }
  
  /**
   * 获取优化建议
   */
  async getOptimizationSuggestions(resumeText, jobDescription) {
    try {
      const prompt = `你是一个专业的HR，请分析以下简历与目标岗位的匹配度，并提供优化建议。

简历内容：
"""
${resumeText}
"""

目标岗位JD：
"""
${jobDescription}
"""

请提供：
1. 匹配度评分（0-100分）
2. 主要优势
3. 需要改进的地方
4. 具体的优化建议

输出JSON格式。`;
      
      const aiResult = await this.callAIAPI(prompt);
      
      // 解析建议内容
      const suggestions = JSON.parse(aiResult);
      
      return {
        success: true,
        data: suggestions
      };
      
    } catch (error) {
      console.error('获取优化建议失败:', error);
      return {
        success: false,
        error: error.message,
        data: {
          score: 75,
          strengths: ['技术能力扎实', '项目经验丰富'],
          improvements: ['需要突出数据分析能力', '加入更多量化成果'],
          suggestions: ['使用STAR模型描述项目', '增加与JD相关的关键词']
        }
      };
    }
  }
}

module.exports = AIOptimizer;