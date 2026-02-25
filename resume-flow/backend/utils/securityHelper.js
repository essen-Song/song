/**
 * 安全工具
 * 提供安全相关的辅助功能
 */

const crypto = require('crypto');

class SecurityHelper {
  /**
   * 生成安全的随机字符串
   */
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 哈希敏感数据
   */
  static hashData(data, salt = '') {
    return crypto.createHash('sha256').update(data + salt).digest('hex');
  }

  /**
   * 验证API密钥格式
   */
  static isValidApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return false;
    return apiKey.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(apiKey);
  }

  /**
   * 清理敏感信息
   */
  static sanitizeSensitiveData(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const sensitiveKeys = ['password', 'apiKey', 'secret', 'token', 'auth'];
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * 生成安全的文件名
   */
  static generateSecureFileName(originalName) {
    const timestamp = Date.now();
    const randomString = this.generateSecureToken(8);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * 验证文件上传安全性
   */
  static validateFileUpload(file) {
    const errors = [];
    
    // 检查文件大小
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push('文件大小超过5MB限制');
    }
    
    // 检查文件类型
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('不支持的文件类型');
    }
    
    // 检查文件名
    const dangerousExtensions = ['.exe', '.js', '.php', '.sh', '.bat'];
    const hasDangerousExtension = dangerousExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasDangerousExtension) {
      errors.push('文件包含危险扩展名');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 创建安全的错误响应
   */
  static createSafeErrorResponse(error, environment = 'production') {
    const safeError = {
      success: false,
      error: '操作失败',
      timestamp: new Date().toISOString()
    };
    
    if (environment === 'development') {
      safeError.error = error.message || '未知错误';
      safeError.stack = error.stack;
    }
    
    return safeError;
  }

  /**
   * 验证请求来源
   */
  static validateRequestOrigin(origin, allowedOrigins) {
    if (!origin) return false;
    
    return allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });
  }

  /**
   * 限流检查
   */
  static checkRateLimit(clientId, limit = 100, windowMs = 60000) {
    // 这里可以实现基于内存或Redis的限流逻辑
    // 简化实现，实际项目中应该使用专业的限流库
    return {
      allowed: true,
      remaining: limit,
      resetTime: Date.now() + windowMs
    };
  }

  /**
   * 加密敏感数据
   */
  static encryptSensitiveData(data, key) {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('加密失败:', error);
      return null;
    }
  }

  /**
   * 解密敏感数据
   */
  static decryptSensitiveData(encryptedData, key) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      return null;
    }
  }
}

module.exports = { SecurityHelper };