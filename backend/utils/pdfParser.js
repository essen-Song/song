const fs = require('fs');
const path = require('path');

/**
 * PDF简历解析器
 * 使用pdfplumber提取PDF文本内容
 */
class PDFResumeParser {
  constructor() {
    this.supportedFormats = ['.pdf'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }
  
  /**
   * 验证PDF文件
   */
  validatePDF(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!this.supportedFormats.includes(ext)) {
      throw new Error('不支持的文件格式，仅支持PDF文件');
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      throw new Error('文件大小超过5MB限制');
    }
    
    return true;
  }
  
  /**
   * 提取PDF文本内容
   */
  async extractText(filePath) {
    try {
      this.validatePDF(filePath);
      
      // 由于pdfplumber是Python库，这里使用模拟实现
      // 在实际部署时，需要调用Python服务或使用其他Node.js PDF库
      const text = await this.simulatePDFExtraction(filePath);
      
      return {
        success: true,
        text: text,
        pageCount: Math.ceil(text.length / 1000), // 估算页数
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
   * 模拟PDF文本提取
   * 在实际应用中，这里应该调用真实的PDF解析库
   */
  async simulatePDFExtraction(filePath) {
    // 这里模拟从PDF中提取文本
    // 实际实现中，你会使用pdfplumber或其他PDF库
    
    const mockResumeText = `
张三
邮箱：zhangsan@example.com  
电话：13800138000

教育背景
北京大学 计算机科学与技术 本科 2020-2024

工作经历
腾讯科技 前端开发实习生 2023.06-2023.09
负责微信小程序前端开发，参与用户界面设计和功能实现
优化页面加载速度，提升用户体验

项目经验
校园二手交易平台
技术栈：React, Node.js, MongoDB
项目描述：开发校园二手物品交易平台，支持商品发布、搜索、聊天功能
项目成果：用户量达到2000+，日活跃用户300+

技能
前端：React, Vue, JavaScript, HTML/CSS
后端：Node.js, Python, MySQL
其他：Git, Linux, Docker
    `;
    
    return mockResumeText.trim();
  }
  
  /**
   * 提取PDF元数据
   */
  async extractMetadata(filePath) {
    try {
      this.validatePDF(filePath);
      const stats = fs.statSync(filePath);
      
      return {
        fileName: path.basename(filePath),
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        pageCount: 1, // 实际应该从PDF元数据获取
        title: '',
        author: '',
        subject: ''
      };
    } catch (error) {
      throw new Error(`提取PDF元数据失败: ${error.message}`);
    }
  }
  
  /**
   * 清理和预处理文本
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n') // 统一换行符
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // 移除多余空行
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
      .trim();
  }
  
  /**
   * 分段提取（按页或章节）
   */
  async extractSections(filePath) {
    const result = await this.extractText(filePath);
    
    if (!result.success) {
      return result;
    }
    
    const text = result.text;
    const sections = this.identifySections(text);
    
    return {
      success: true,
      sections: sections,
      fullText: text
    };
  }
  
  /**
   * 识别简历章节
   */
  identifySections(text) {
    const sections = {};
    const sectionPatterns = {
      '个人信息': /个人信息|基本信息|个人资料/i,
      '教育背景': /教育背景|学历|教育经历/i,
      '工作经历': /工作经历|工作经验|实习经历/i,
      '项目经验': /项目经验|项目经历|个人项目/i,
      '技能': /技能|技术栈|掌握技术/i,
      '获奖经历': /获奖|荣誉|证书/i,
      '自我评价': /自我评价|自我介绍|个人评价/i
    };
    
    const lines = text.split('\n');
    let currentSection = '其他';
    let currentContent = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // 检查是否是新的章节标题
      let foundSection = false;
      for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(trimmedLine)) {
          // 保存当前章节
          if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
          }
          
          // 开始新章节
          currentSection = sectionName;
          currentContent = [];
          foundSection = true;
          break;
        }
      }
      
      if (!foundSection && currentSection) {
        currentContent.push(trimmedLine);
      }
    }
    
    // 保存最后一个章节
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
  }
}

module.exports = PDFResumeParser;