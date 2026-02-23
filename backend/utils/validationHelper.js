/**
 * 输入验证工具
 * 提供各种输入验证和清理功能
 */

class ValidationHelper {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式
   */
  static isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证文件类型
   */
  static isValidFileType(fileType, allowedTypes) {
    return allowedTypes.includes(fileType);
  }

  /**
   * 验证文件大小
   */
  static isValidFileSize(fileSize, maxSize) {
    return fileSize <= maxSize;
  }

  /**
   * 清理用户输入
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/['"`;]/g, '')
      .substring(0, 10000); // 限制长度
  }

  /**
   * 验证简历数据格式
   */
  static validateResumeData(data) {
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
   * 验证岗位筛选条件
   */
  static validateJobFilters(filters) {
    const errors = [];
    
    if (!filters.keywords || filters.keywords.trim().length === 0) {
      errors.push('职位关键词不能为空');
    }
    
    if (filters.maxApplications && (filters.maxApplications < 1 || filters.maxApplications > 50)) {
      errors.push('最大投递数量应在1-50之间');
    }
    
    if (filters.minMatchScore && (filters.minMatchScore < 0 || filters.minMatchScore > 100)) {
      errors.push('最低匹配度应在0-100之间');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 验证面试配置
   */
  static validateInterviewConfig(config) {
    const errors = [];
    
    if (!config.jobTitle || config.jobTitle.trim().length === 0) {
      errors.push('职位名称不能为空');
    }
    
    if (!config.interviewType || !['通用类', '技术类', '产品类', '运营类'].includes(config.interviewType)) {
      errors.push('面试类型不正确');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 清理文件名
   */
  static sanitizeFileName(fileName) {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
      .substring(0, 255);
  }

  /**
   * 验证平台配置
   */
  static validatePlatformConfig(platforms) {
    const validPlatforms = ['boss', 'zhilian', '51job'];
    const errors = [];
    
    if (!Array.isArray(platforms) || platforms.length === 0) {
      errors.push('平台列表不能为空');
    }
    
    platforms.forEach(platform => {
      if (!validPlatforms.includes(platform)) {
        errors.push(`不支持的平台: ${platform}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 安全验证 - 防止SQL注入
   */
  static preventSQLInjection(input) {
    if (typeof input !== 'string') return input;
    
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'WHERE', 'OR', 'AND'];
    const upperInput = input.toUpperCase();
    
    // 检查是否包含SQL关键字
    const hasSQLKeywords = sqlKeywords.some(keyword => upperInput.includes(keyword));
    
    if (hasSQLKeywords) {
      throw new Error('输入包含非法字符');
    }
    
    return input.replace(/['"`;]/g, '');
  }

  /**
   * 验证用户凭据
   */
  static validateUserCredentials(credentials) {
    const errors = [];
    
    if (!credentials || typeof credentials !== 'object') {
      errors.push('用户凭据格式不正确');
      return { isValid: false, errors };
    }
    
    // 这里可以添加具体的凭据验证逻辑
    // 例如验证用户名密码格式、API密钥格式等
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = { ValidationHelper };