const fs = require('fs');
const path = require('path');

/**
 * 简历解析器
 * 支持PDF和Word文档解析
 */
class ResumeParser {
  constructor() {
    this.patterns = {
      // 教育背景匹配模式
      education: [
        /教育背景[：\s]*([\s\S]*?)(?=工作|实习|项目|技能|$)/i,
        /学历[：\s]*([\s\S]*?)(?=工作|实习|项目|技能|$)/i,
        /([\u4e00-\u9fa5]+大学|[\u4e00-\u9fa5]+学院)[\s\S]*?(?:本科|硕士|博士)/i
      ],
      
      // 工作经历匹配模式
      workExperience: [
        /工作经历[：\s]*([\s\S]*?)(?=项目|技能|教育|$)/i,
        /实习经历[：\s]*([\s\S]*?)(?=项目|技能|教育|$)/i,
        /工作经验[：\s]*([\s\S]*?)(?=项目|技能|教育|$)/i
      ],
      
      // 项目经验匹配模式
      projects: [
        /项目经历[：\s]*([\s\S]*?)(?=技能|教育|工作|$)/i,
        /项目经验[：\s]*([\s\S]*?)(?=技能|教育|工作|$)/i,
        /个人项目[：\s]*([\s\S]*?)(?=技能|教育|工作|$)/i
      ],
      
      // 技能匹配模式
      skills: [
        /技能[：\s]*([\s\S]*?)(?=项目|教育|工作|$)/i,
        /技术栈[：\s]*([\s\S]*?)(?=项目|教育|工作|$)/i,
        /掌握技术[：\s]*([\s\S]*?)(?=项目|教育|工作|$)/i
      ],
      
      // 姓名匹配
      name: [
        /^([\u4e00-\u9fa5]{2,4})[\s\n]/,
        /姓名[：\s]*([\u4e00-\u9fa5]{2,4})/i,
        /Name[：\s]*([\u4e00-\u9fa5]{2,4})/i
      ],
      
      // 邮箱匹配
      email: [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
      ],
      
      // 电话匹配
      phone: [
        /1[3-9]\d{9}/,
        /\d{3}-\d{4}-\d{4}/,
        /\d{4}-\d{7}/
      ]
    };
    
    // 技能关键词库
    this.skillKeywords = [
      'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Spring Boot',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'AWS', 'Azure', 'Google Cloud', '阿里云', '腾讯云', '华为云',
      'Docker', 'Kubernetes', 'Jenkins', 'Git', 'Linux', 'MacOS', 'Windows',
      '机器学习', '深度学习', 'TensorFlow', 'PyTorch', 'Scikit-learn',
      '数据分析', '数据可视化', 'Tableau', 'Power BI', 'Excel',
      '产品管理', '项目管理', '敏捷开发', 'Scrum', '用户研究'
    ];
  }
  
  /**
   * 主解析函数
   * @param {string} text - 简历文本内容
   * @returns {Object} 解析结果
   */
  parse(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('无效的简历文本内容');
    }
    
    const result = {
      name: this.extractName(text),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      education: this.extractEducation(text),
      workExperience: this.extractWorkExperience(text),
      projects: this.extractProjects(text),
      skills: this.extractSkills(text),
      rawText: text.substring(0, 1000) // 保留前1000字符用于调试
    };
    
    return result;
  }
  
  /**
   * 提取姓名
   */
  extractName(text) {
    for (const pattern of this.patterns.name) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }
  
  /**
   * 提取邮箱
   */
  extractEmail(text) {
    for (const pattern of this.patterns.email) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    return null;
  }
  
  /**
   * 提取电话
   */
  extractPhone(text) {
    for (const pattern of this.patterns.phone) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    return null;
  }
  
  /**
   * 提取教育背景
   */
  extractEducation(text) {
    for (const pattern of this.patterns.education) {
      const match = text.match(pattern);
      if (match) {
        const educationText = match[1] || match[0];
        return this.parseEducationDetails(educationText.trim());
      }
    }
    return [];
  }
  
  /**
   * 解析教育详情
   */
  parseEducationDetails(text) {
    const educations = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const education = {};
      
      // 匹配学校名称
      const schoolMatch = line.match(/([\u4e00-\u9fa5]+大学|[\u4e00-\u9fa5]+学院)/);
      if (schoolMatch) {
        education.school = schoolMatch[1];
      }
      
      // 匹配专业
      const majorMatch = line.match(/(计算机|软件|电子|通信|数学|物理|化学|生物|医学|法学|经济|管理|市场营销|人力资源)/i);
      if (majorMatch) {
        education.major = majorMatch[1];
      }
      
      // 匹配学历
      const degreeMatch = line.match(/(本科|学士|硕士|研究生|博士|MBA|EMBA)/i);
      if (degreeMatch) {
        education.degree = degreeMatch[1];
      }
      
      // 匹配时间
      const timeMatch = line.match(/(20\d{2})[\.\-年](\s*(20\d{2}|至今|Present))/i);
      if (timeMatch) {
        education.startTime = timeMatch[1];
        education.endTime = timeMatch[2].includes('至今') || timeMatch[2].includes('Present') ? '至今' : timeMatch[2];
      }
      
      if (Object.keys(education).length > 0) {
        educations.push(education);
      }
    }
    
    return educations;
  }
  
  /**
   * 提取工作经历
   */
  extractWorkExperience(text) {
    for (const pattern of this.patterns.workExperience) {
      const match = text.match(pattern);
      if (match) {
        const workText = match[1] || match[0];
        return this.parseWorkDetails(workText.trim());
      }
    }
    return [];
  }
  
  /**
   * 解析工作详情
   */
  parseWorkDetails(text) {
    const works = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentWork = null;
    
    for (const line of lines) {
      // 检测新的工作条目（通常包含公司名和职位）
      const workHeaderMatch = line.match(/([\u4e00-\u9fa5\w\s]+公司|[\u4e00-\u9fa5\w\s]+科技|[\u4e00-\u9fa5\w\s]+集团).*?(产品经理|工程师|开发|运营|设计|销售|市场|HR|人力资源)/i);
      
      if (workHeaderMatch) {
        if (currentWork) {
          works.push(currentWork);
        }
        
        currentWork = {
          company: workHeaderMatch[1].trim(),
          position: workHeaderMatch[2].trim(),
          description: '',
          achievements: []
        };
        
        // 提取时间信息
        const timeMatch = line.match(/(20\d{2})[\.\-年]\s*(\d{1,2}月)?.*?((20\d{2})[\.\-年]\s*(\d{1,2}月)?|至今)/i);
        if (timeMatch) {
          currentWork.startTime = timeMatch[1] + (timeMatch[2] || '');
          currentWork.endTime = timeMatch[3].includes('至今') ? '至今' : (timeMatch[4] + (timeMatch[5] || ''));
        }
      } else if (currentWork) {
        // 累加描述信息
        if (line.length > 10) {
          currentWork.description += line.trim() + ' ';
          
          // 提取成就（包含数字的描述）
          const achievementMatch = line.match(/(\d+%?|\d+万|\d+千|\d+个|\d+次).*?(提升|增长|减少|节省|完成|实现)/i);
          if (achievementMatch) {
            currentWork.achievements.push(line.trim());
          }
        }
      }
    }
    
    if (currentWork) {
      works.push(currentWork);
    }
    
    return works;
  }
  
  /**
   * 提取项目经验
   */
  extractProjects(text) {
    for (const pattern of this.patterns.projects) {
      const match = text.match(pattern);
      if (match) {
        const projectText = match[1] || match[0];
        return this.parseProjectDetails(projectText.trim());
      }
    }
    return [];
  }
  
  /**
   * 解析项目详情
   */
  parseProjectDetails(text) {
    const projects = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentProject = null;
    
    for (const line of lines) {
      // 检测新的项目条目
      const projectHeaderMatch = line.match(/(项目|作品|产品)[：\s]*([\u4e00-\u9fa5\w\s]+)/i);
      
      if (projectHeaderMatch) {
        if (currentProject) {
          projects.push(currentProject);
        }
        
        currentProject = {
          name: projectHeaderMatch[2].trim(),
          description: '',
          technologies: [],
          results: []
        };
        
        // 提取时间信息
        const timeMatch = line.match(/(20\d{2})[\.\-年]/i);
        if (timeMatch) {
          currentProject.time = timeMatch[1];
        }
      } else if (currentProject) {
        // 累加描述信息
        if (line.length > 5) {
          currentProject.description += line.trim() + ' ';
          
          // 提取技术栈
          const techMatches = line.match(/(React|Vue|Angular|Node\.js|Python|Java|MySQL|MongoDB|Docker|Kubernetes)/gi);
          if (techMatches) {
            currentProject.technologies.push(...techMatches);
          }
          
          // 提取结果（包含数字的描述）
          const resultMatch = line.match(/(\d+%?|\d+万|\d+千|\d+个|\d+次).*?(提升|增长|减少|节省|完成|实现)/i);
          if (resultMatch) {
            currentProject.results.push(line.trim());
          }
        }
      }
    }
    
    if (currentProject) {
      projects.push(currentProject);
    }
    
    // 去重技术栈
    projects.forEach(project => {
      if (project.technologies) {
        project.technologies = [...new Set(project.technologies.map(t => t.toLowerCase()))];
      }
    });
    
    return projects;
  }
  
  /**
   * 提取技能
   */
  extractSkills(text) {
    const foundSkills = [];
    const lowerText = text.toLowerCase();
    
    // 使用关键词库匹配
    for (const skill of this.skillKeywords) {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }
    
    // 额外从技能部分提取
    for (const pattern of this.patterns.skills) {
      const match = text.match(pattern);
      if (match) {
        const skillText = match[1] || match[0];
        const lines = skillText.split(/[,，、\n]/);
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 1 && trimmed.length < 20) {
            foundSkills.push(trimmed);
          }
        }
      }
    }
    
    // 去重并排序
    return [...new Set(foundSkills)].sort();
  }
  
  /**
   * 验证解析结果
   */
  validateResult(result) {
    const requiredFields = ['name'];
    const optionalFields = ['email', 'phone', 'education', 'workExperience', 'projects', 'skills'];
    
    let score = 0;
    let totalFields = requiredFields.length;
    
    // 检查必需字段
    for (const field of requiredFields) {
      if (result[field] && result[field].length > 0) {
        score++;
      }
    }
    
    // 检查可选字段
    for (const field of optionalFields) {
      if (result[field] && result[field].length > 0) {
        totalFields++;
        score++;
      }
    }
    
    const accuracy = Math.round((score / totalFields) * 100);
    
    return {
      isValid: accuracy >= 50, // 50%以上字段提取成功即认为有效
      accuracy: accuracy,
      missingFields: requiredFields.filter(field => !result[field] || result[field].length === 0)
    };
  }

  /**
   * 提取文本（兼容旧接口）
   */
  extractText(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        success: true,
        text: content,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        text: null,
        error: error.message
      };
    }
  }

  /**
   * 解析简历（兼容旧接口）
   */
  parseResume(text) {
    return this.parse(text);
  }

  /**
   * 验证简历数据格式
   */
  validateResumeData(data) {
    const errors = [];
    
    if (!data.name || data.name.length < 2) {
      errors.push('姓名长度至少2个字符');
    }
    
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('邮箱格式不正确');
    }
    
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('手机号格式不正确');
    }
    
    if (!Array.isArray(data.education)) {
      errors.push('教育背景格式不正确');
    }
    
    if (!Array.isArray(data.workExperience)) {
      errors.push('工作经历格式不正确');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 验证邮箱格式
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式
   */
  isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 清理用户输入
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/['"`;]/g, '')
      .substring(0, 10000); // 限制长度
  }
}

module.exports = ResumeParser;