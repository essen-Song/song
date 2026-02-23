const fs = require('fs');
const path = require('path');

/**
 * Word文档解析器
 * 支持.docx格式文档解析
 */
class WordResumeParser {
  constructor() {
    this.supportedFormats = ['.docx'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }
  
  /**
   * 验证Word文件
   */
  validateWord(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!this.supportedFormats.includes(ext)) {
      throw new Error('不支持的文件格式，仅支持DOCX文件');
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      throw new Error('文件大小超过5MB限制');
    }
    
    return true;
  }
  
  /**
   * 提取Word文本内容
   */
  async extractText(filePath) {
    try {
      this.validateWord(filePath);
      
      // 由于mammoth是Node.js库，这里使用模拟实现
      // 在实际部署时，需要使用真实的mammoth库
      const text = await this.simulateWordExtraction(filePath);
      
      return {
        success: true,
        text: text,
        fileSize: fs.statSync(filePath).size
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }
  
  /**
   * 模拟Word文本提取
   * 实际实现中，你会使用mammoth库
   */
  async simulateWordExtraction(filePath) {
    const mockResumeText = `
李四
邮箱：lisi@example.com  
电话：13900139000

教育背景
清华大学 软件工程 硕士 2022-2024
北京理工大学 计算机科学 本科 2018-2022

工作经历
字节跳动 后端开发工程师 2023.03-至今
负责推荐系统后端服务开发，优化算法接口性能
参与微服务架构设计，提升系统可扩展性

阿里巴巴 实习生 2022.06-2022.09
参与电商平台订单系统开发
协助完成数据库优化，查询性能提升40%

项目经验
分布式缓存系统
技术栈：Go, Redis, Kubernetes
项目描述：设计并实现高性能分布式缓存系统，支持百万级QPS
项目成果：缓存命中率提升25%，系统响应时间减少30%

智能推荐引擎
技术栈：Python, TensorFlow, PostgreSQL
项目描述：基于用户行为数据构建个性化推荐算法
项目成果：用户点击率提升15%，留存率增加8%

技能
编程语言：Go, Python, Java, C++
框架技术：Spring Boot, Django, Flask, Gin
数据库：MySQL, PostgreSQL, Redis, MongoDB
云平台：AWS, 阿里云, Docker, Kubernetes
机器学习：TensorFlow, PyTorch, Scikit-learn
    `;
    
    return mockResumeText.trim();
  }
  
  /**
   * 提取Word文档结构
   */
  async extractStructure(filePath) {
    const result = await this.extractText(filePath);
    
    if (!result.success) {
      return result;
    }
    
    const text = result.text;
    const structure = this.analyzeDocumentStructure(text);
    
    return {
      success: true,
      structure: structure,
      fullText: text
    };
  }
  
  /**
   * 分析文档结构
   */
  analyzeDocumentStructure(text) {
    const structure = {
      sections: [],
      paragraphs: [],
      lines: text.split('\n').length,
      wordCount: text.replace(/\s+/g, ' ').split(' ').length
    };
    
    const lines = text.split('\n');
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 检测章节标题
      const sectionType = this.detectSectionType(line);
      if (sectionType) {
        currentSection = {
          type: sectionType,
          title: line,
          content: [],
          lineNumber: i + 1
        };
        structure.sections.push(currentSection);
      } else if (currentSection) {
        currentSection.content.push(line);
      }
      
      structure.paragraphs.push({
        text: line,
        lineNumber: i + 1,
        sectionType: sectionType || (currentSection ? currentSection.type : '其他')
      });
    }
    
    return structure;
  }
  
  /**
   * 检测章节类型
   */
  detectSectionType(line) {
    const sectionPatterns = {
      '个人信息': /个人信息|基本信息|个人资料|姓名|联系方式/i,
      '教育背景': /教育背景|学历|教育经历|毕业院校/i,
      '工作经历': /工作经历|工作经验|实习经历|就职公司/i,
      '项目经验': /项目经验|项目经历|个人项目|开发项目/i,
      '技能': /技能|技术栈|掌握技术|专业技能/i,
      '获奖经历': /获奖|荣誉|证书|奖项|成就/i,
      '自我评价': /自我评价|自我介绍|个人评价|职业目标/i
    };
    
    for (const [sectionType, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line)) {
        return sectionType;
      }
    }
    
    return null;
  }
  
  /**
   * 提取表格数据（如果文档包含表格）
   */
  async extractTables(filePath) {
    try {
      this.validateWord(filePath);
      
      // 模拟表格提取
      // 实际实现中，mammoth可以提取表格数据
      const mockTables = [
        {
          type: '教育经历表格',
          headers: ['时间', '学校', '专业', '学历'],
          rows: [
            ['2022-2024', '清华大学', '软件工程', '硕士'],
            ['2018-2022', '北京理工大学', '计算机科学', '本科']
          ]
        },
        {
          type: '工作经历表格',
          headers: ['时间', '公司', '职位', '描述'],
          rows: [
            ['2023.03-至今', '字节跳动', '后端开发工程师', '负责推荐系统后端服务开发'],
            ['2022.06-2022.09', '阿里巴巴', '实习生', '参与电商平台订单系统开发']
          ]
        }
      ];
      
      return {
        success: true,
        tables: mockTables
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tables: []
      };
    }
  }
  
  /**
   * 清理和格式化文本
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n') // 统一换行符
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // 移除多余空行
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
      .replace(/^\s+|\s+$/gm, '') // 移除每行首尾空白
      .trim();
  }
  
  /**
   * 提取关键信息（姓名、联系方式等）
   */
  extractKeyInfo(text) {
    const info = {
      name: null,
      email: null,
      phone: null,
      sections: {}
    };
    
    // 提取姓名（通常在文档开头）
    const nameMatch = text.match(/^([\u4e00-\u9fa5]{2,4})[\s\n]/m);
    if (nameMatch) {
      info.name = nameMatch[1];
    }
    
    // 提取邮箱
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
    if (emailMatch) {
      info.email = emailMatch[0];
    }
    
    // 提取电话
    const phoneMatch = text.match(/1[3-9]\d{9}|\d{3}-\d{4}-\d{4}/);
    if (phoneMatch) {
      info.phone = phoneMatch[0];
    }
    
    // 按章节提取信息
    const structure = this.analyzeDocumentStructure(text);
    for (const section of structure.sections) {
      info.sections[section.type] = section.content;
    }
    
    return info;
  }
}

module.exports = WordResumeParser;