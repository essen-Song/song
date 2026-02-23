/**
 * 基础平台投递类
 * 所有招聘平台的投递逻辑都继承自此类
 */
class BasePlatform {
  constructor(platformConfig) {
    this.config = platformConfig;
    this.name = platformConfig.name;
    this.baseUrl = platformConfig.baseUrl;
    this.loginUrl = platformConfig.loginUrl;
    this.searchUrl = platformConfig.searchUrl;
    this.enabled = platformConfig.enabled || false;
  }

  /**
   * 初始化平台
   */
  async init() {
    console.log(`初始化${this.name}平台`);
    // 可以在这里进行平台特定的初始化操作
  }

  /**
   * 登录平台
   * @param {Page} page - Playwright Page对象
   * @param {Object} credentials - 登录凭证
   * @returns {Object} 登录结果
   */
  async login(page, credentials) {
    throw new Error('子类必须实现login方法');
  }

  /**
   * 搜索职位
   * @param {Page} page - Playwright Page对象
   * @param {Object} jobFilters - 职位筛选条件
   * @returns {Object} 搜索结果
   */
  async searchJobs(page, jobFilters) {
    throw new Error('子类必须实现searchJobs方法');
  }

  /**
   * 提取职位列表
   * @param {Page} page - Playwright Page对象
   * @returns {Array} 职位列表
   */
  async extractJobListings(page) {
    throw new Error('子类必须实现extractJobListings方法');
  }

  /**
   * 提交单个申请
   * @param {Page} page - Playwright Page对象
   * @param {Object} job - 职位信息
   * @param {Object} resumeData - 简历数据
   * @returns {Object} 申请结果
   */
  async submitApplication(page, job, resumeData) {
    throw new Error('子类必须实现submitApplication方法');
  }

  /**
   * 获取投递状态
   * @param {String} userId - 用户ID
   * @param {Object} applicationData - 申请数据
   * @returns {Object} 投递状态
   */
  async getDeliveryStatus(userId, applicationData) {
    throw new Error('子类必须实现getDeliveryStatus方法');
  }

  /**
   * 构建搜索URL
   * @param {Object} jobFilters - 职位筛选条件
   * @returns {String} 搜索URL
   */
  buildSearchUrl(jobFilters) {
    throw new Error('子类必须实现buildSearchUrl方法');
  }

  /**
   * 计算职位匹配度
   * @param {Object} job - 职位信息
   * @param {Object} jobFilters - 筛选条件
   * @returns {Number} 匹配度分数
   */
  calculateJobMatch(job, jobFilters) {
    let score = 0;
    
    // 关键词匹配
    if (jobFilters.keywords) {
      const keywords = jobFilters.keywords.toLowerCase().split(/[,，\s]+/);
      const jobText = `${job.title} ${job.description || ''} ${job.company || ''}`.toLowerCase();
      
      const matchedKeywords = keywords.filter(keyword => 
        jobText.includes(keyword.toLowerCase())
      );
      score += (matchedKeywords.length / keywords.length) * 40;
    }
    
    // 地点匹配
    if (jobFilters.location && job.location && 
        job.location.toLowerCase().includes(jobFilters.location.toLowerCase())) {
      score += 20;
    }
    
    // 薪资匹配
    if (jobFilters.salary && job.salary) {
      score += 15;
    }
    
    // 经验匹配
    if (jobFilters.experience && job.experience) {
      score += 15;
    }
    
    // 公司规模匹配
    if (jobFilters.companySize && job.companySize) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * 生成随机等待时间
   * @param {Number} min - 最小等待时间（毫秒）
   * @param {Number} max - 最大等待时间（毫秒）
   * @returns {Number} 等待时间
   */
  getRandomWaitTime(min = 1000, max = 3000) {
    return min + Math.random() * (max - min);
  }

  /**
   * 安全点击元素
   * @param {Page} page - Playwright Page对象
   * @param {String|Locator} selector - 选择器
   * @param {Object} options - 选项
   * @returns {Boolean} 是否点击成功
   */
  async safeClick(page, selector, options = {}) {
    try {
      await page.click(selector, {
        timeout: options.timeout || 10000,
        ...options
      });
      return true;
    } catch (error) {
      console.warn(`${this.name}平台点击元素失败:`, error.message);
      return false;
    }
  }

  /**
   * 安全填写表单
   * @param {Page} page - Playwright Page对象
   * @param {String|Locator} selector - 选择器
   * @param {String} value - 填写值
   * @param {Object} options - 选项
   * @returns {Boolean} 是否填写成功
   */
  async safeFill(page, selector, value, options = {}) {
    try {
      await page.fill(selector, value, {
        timeout: options.timeout || 10000,
        ...options
      });
      return true;
    } catch (error) {
      console.warn(`${this.name}平台填写表单失败:`, error.message);
      return false;
    }
  }

  /**
   * 安全等待元素
   * @param {Page} page - Playwright Page对象
   * @param {String|Locator} selector - 选择器
   * @param {Object} options - 选项
   * @returns {Boolean} 是否等待成功
   */
  async safeWaitForSelector(page, selector, options = {}) {
    try {
      await page.waitForSelector(selector, {
        timeout: options.timeout || 15000,
        ...options
      });
      return true;
    } catch (error) {
      console.warn(`${this.name}平台等待元素失败:`, error.message);
      return false;
    }
  }

  /**
   * 处理验证码
   * @param {Page} page - Playwright Page对象
   * @returns {Object} 验证码处理结果
   */
  async handleCaptcha(page) {
    // 默认实现，子类可以重写
    console.log(`${this.name}平台检测到验证码，需要手动处理`);
    return {
      success: false,
      message: '检测到验证码，需要手动处理'
    };
  }

  /**
   * 检查是否被反爬虫
   * @param {Page} page - Playwright Page对象
   * @returns {Boolean} 是否被反爬虫
   */
  async checkAntiCrawl(page) {
    // 默认实现，子类可以重写
    return false;
  }

  /**
   * 处理反爬虫
   * @param {Page} page - Playwright Page对象
   * @returns {Object} 处理结果
   */
  async handleAntiCrawl(page) {
    // 默认实现，子类可以重写
    console.log(`${this.name}平台触发了反爬虫机制`);
    return {
      success: false,
      message: '触发了反爬虫机制'
    };
  }

  /**
   * 设置启用状态
   * @param {Boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * 获取平台配置
   * @returns {Object} 平台配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 更新平台配置
   * @param {Object} config - 新的配置
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.baseUrl = this.config.baseUrl;
    this.loginUrl = this.config.loginUrl;
    this.searchUrl = this.config.searchUrl;
  }
}

module.exports = BasePlatform;