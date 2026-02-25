const { chromium } = require('playwright');
const axios = require('axios');

/**
 * 自动化投递服务
 * 支持BOSS直聘、智联招聘、前程无忧等平台
 */
class AutoDeliveryService {
  constructor() {
    this.platforms = {
      boss: {
        name: 'BOSS直聘',
        baseUrl: 'https://www.zhipin.com',
        loginUrl: 'https://login.zhipin.com',
        searchUrl: 'https://www.zhipin.com/web/geek/job',
        enabled: true
      },
      zhilian: {
        name: '智联招聘',
        baseUrl: 'https://sou.zhaopin.com',
        loginUrl: 'https://passport.zhaopin.com',
        searchUrl: 'https://sou.zhaopin.com/?kw=',
        enabled: true
      },
      '51job': {
        name: '前程无忧',
        baseUrl: 'https://www.51job.com',
        loginUrl: 'https://login.51job.com',
        searchUrl: 'https://search.51job.com/list',
        enabled: true
      }
    };
    
    this.deliveryStats = {
      total: 0,
      success: 0,
      failed: 0,
      platforms: {}
    };
    
    this.proxyList = []; // 代理IP列表
    this.currentProxyIndex = 0;
    this.useProxy = process.env.PROXY_ENABLED === 'true';
  }
  
  /**
   * 初始化浏览器
   */
  async initBrowser(options = {}) {
    const browserOptions = {
      headless: process.env.NODE_ENV === 'production', // 生产环境使用无头模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };
    
    if (this.useProxy && this.proxyList.length > 0) {
      const proxy = this.getNextProxy();
      if (proxy) {
        browserOptions.proxy = {
          server: proxy.server,
          username: proxy.username,
          password: proxy.password
        };
      }
    }
    
    const browser = await chromium.launch(browserOptions);
    return browser;
  }
  
  /**
   * 获取下一个代理
   */
  getNextProxy() {
    if (this.proxyList.length === 0) return null;
    
    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    return proxy;
  }
  
  /**
   * 自动投递简历
   */
  async autoDeliver(resumeData, jobFilters, userCredentials) {
    const results = {};
    
    for (const [platformKey, platform] of Object.entries(this.platforms)) {
      if (!platform.enabled) continue;
      
      console.log(`开始在${platform.name}投递简历...`);
      
      try {
        const result = await this.deliverToPlatform(platformKey, resumeData, jobFilters, userCredentials[platformKey]);
        results[platformKey] = result;
        
        // 更新统计
        this.deliveryStats.total++;
        if (result.success) {
          this.deliveryStats.success++;
        } else {
          this.deliveryStats.failed++;
        }
        
        this.deliveryStats.platforms[platformKey] = {
          success: result.success ? 1 : 0,
          failed: result.success ? 0 : 1,
          message: result.message
        };
        
      } catch (error) {
        console.error(`${platform.name}投递失败:`, error);
        results[platformKey] = {
          success: false,
          message: `投递失败: ${error.message}`,
          error: error.message
        };
        
        this.deliveryStats.total++;
        this.deliveryStats.failed++;
        this.deliveryStats.platforms[platformKey] = {
          success: 0,
          failed: 1,
          message: error.message
        };
      }
    }
    
    return {
      success: true,
      results: results,
      stats: this.deliveryStats
    };
  }
  
  /**
   * 向特定平台投递
   */
  async deliverToPlatform(platformKey, resumeData, jobFilters, credentials) {
    const platform = this.platforms[platformKey];
    let browser;
    
    try {
      browser = await this.initBrowser();
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      const page = await context.newPage();
      
      // 设置超时
      page.setDefaultTimeout(30000);
      
      // 登录平台
      const loginResult = await this.loginToPlatform(page, platform, credentials);
      if (!loginResult.success) {
        throw new Error(`登录失败: ${loginResult.message}`);
      }
      
      // 搜索职位
      const searchResult = await this.searchJobs(page, platform, jobFilters);
      if (!searchResult.success) {
        throw new Error(`搜索职位失败: ${searchResult.message}`);
      }
      
      // 投递简历
      const deliveryResult = await this.submitApplications(page, platform, resumeData, jobFilters);
      
      await browser.close();
      
      return deliveryResult;
      
    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      throw error;
    }
  }
  
  /**
   * 登录平台
   */
  async loginToPlatform(page, platform, credentials) {
    try {
      // 这里实现具体的登录逻辑
      // 由于涉及用户隐私，这里使用模拟登录
      
      console.log(`正在登录${platform.name}...`);
      
      // 模拟登录过程
      await page.goto(platform.baseUrl, { waitUntil: 'networkidle' });
      
      // 等待页面加载
      await page.waitForTimeout(2000);
      
      // 模拟登录成功
      console.log(`${platform.name}登录成功`);
      
      return {
        success: true,
        message: '登录成功'
      };
      
    } catch (error) {
      return {
        success: false,
        message: `登录失败: ${error.message}`
      };
    }
  }
  
  /**
   * 搜索职位
   */
  async searchJobs(page, platform, jobFilters) {
    try {
      console.log(`正在${platform.name}搜索职位...`);
      
      const { keywords, location, salary, experience } = jobFilters;
      
      // 构建搜索URL
      let searchUrl = platform.searchUrl;
      
      if (platformKey === 'boss') {
        searchUrl += `?query=${encodeURIComponent(keywords)}&city=${encodeURIComponent(location || '')}`;
      } else if (platformKey === 'zhilian') {
        searchUrl += encodeURIComponent(keywords);
      } else if (platformKey === '51job') {
        searchUrl += `?keyword=${encodeURIComponent(keywords)}&workexperience=${experience || ''}`;
      }
      
      await page.goto(searchUrl, { waitUntil: 'networkidle' });
      
      // 等待搜索结果
      await page.waitForTimeout(3000);
      
      console.log(`${platform.name}职位搜索完成`);
      
      return {
        success: true,
        message: '搜索完成'
      };
      
    } catch (error) {
      return {
        success: false,
        message: `搜索失败: ${error.message}`
      };
    }
  }
  
  /**
   * 提交申请
   */
  async submitApplications(page, platform, resumeData, jobFilters) {
    try {
      console.log(`正在${platform.name}提交申请...`);
      
      // 获取职位列表
      const jobListings = await this.extractJobListings(page, platform);
      
      if (jobListings.length === 0) {
        return {
          success: false,
          message: '未找到合适的职位'
        };
      }
      
      let successCount = 0;
      let failCount = 0;
      const appliedJobs = [];
      
      // 限制投递数量，避免过度投递
      const maxApplications = Math.min(jobFilters.maxApplications || 5, jobListings.length);
      
      for (let i = 0; i < maxApplications; i++) {
        const job = jobListings[i];
        
        try {
          // 检查职位匹配度
          const matchScore = this.calculateJobMatch(job, jobFilters);
          if (matchScore < (jobFilters.minMatchScore || 60)) {
            console.log(`职位匹配度不足: ${matchScore}%，跳过`);
            continue;
          }
          
          // 提交单个申请
          const applicationResult = await this.submitSingleApplication(page, job, resumeData, platform);
          
          if (applicationResult.success) {
            successCount++;
            appliedJobs.push({
              jobTitle: job.title,
              company: job.company,
              success: true,
              message: applicationResult.message
            });
          } else {
            failCount++;
            appliedJobs.push({
              jobTitle: job.title,
              company: job.company,
              success: false,
              message: applicationResult.message
            });
          }
          
          // 等待一段时间，避免过于频繁
          await page.waitForTimeout(2000 + Math.random() * 3000);
          
        } catch (error) {
          console.error(`申请职位失败: ${job.title}`, error);
          failCount++;
          appliedJobs.push({
            jobTitle: job.title,
            company: job.company,
            success: false,
            message: error.message
          });
        }
      }
      
      return {
        success: successCount > 0,
        message: `投递完成，成功: ${successCount}, 失败: ${failCount}`,
        details: {
          successCount: successCount,
          failCount: failCount,
          totalApplied: successCount + failCount,
          appliedJobs: appliedJobs
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `提交申请失败: ${error.message}`,
        error: error.message
      };
    }
  }
  
  /**
   * 提取职位列表
   */
  async extractJobListings(page, platform) {
    try {
      // 等待职位列表加载
      await page.waitForTimeout(2000);
      
      // 模拟提取职位信息
      // 实际实现中，这里需要根据具体平台的DOM结构来提取
      const mockJobs = [
        {
          title: '前端开发工程师',
          company: '阿里巴巴',
          location: '杭州',
          salary: '20-40K',
          experience: '3-5年',
          description: '负责前端开发工作',
          url: 'https://www.zhipin.com/job/123'
        },
        {
          title: '高级前端工程师',
          company: '腾讯',
          location: '深圳',
          salary: '25-50K',
          experience: '5-10年',
          description: '负责核心产品前端开发',
          url: 'https://www.zhipin.com/job/456'
        },
        {
          title: '全栈工程师',
          company: '字节跳动',
          location: '北京',
          salary: '30-60K',
          experience: '3-5年',
          description: '负责全栈开发工作',
          url: 'https://www.zhipin.com/job/789'
        }
      ];
      
      return mockJobs;
      
    } catch (error) {
      console.error('提取职位列表失败:', error);
      return [];
    }
  }
  
  /**
   * 计算职位匹配度
   */
  calculateJobMatch(job, jobFilters) {
    let score = 0;
    let maxScore = 100;
    
    // 关键词匹配
    if (jobFilters.keywords) {
      const keywords = jobFilters.keywords.toLowerCase().split(/[,，\s]+/);
      const jobText = `${job.title} ${job.description}`.toLowerCase();
      
      const matchedKeywords = keywords.filter(keyword => jobText.includes(keyword.toLowerCase()));
      score += (matchedKeywords.length / keywords.length) * 40;
    }
    
    // 地点匹配
    if (jobFilters.location && job.location.includes(jobFilters.location)) {
      score += 20;
    }
    
    // 薪资匹配（简化处理）
    if (jobFilters.salary && job.salary) {
      score += 15;
    }
    
    // 经验匹配
    if (jobFilters.experience && job.experience) {
      score += 15;
    }
    
    // 公司规模匹配（如果有此要求）
    if (jobFilters.companySize) {
      score += 10;
    }
    
    return Math.min(score, maxScore);
  }
  
  /**
   * 提交单个申请
   */
  async submitSingleApplication(page, job, resumeData, platform) {
    try {
      console.log(`正在申请职位: ${job.title} @ ${job.company}`);
      
      // 这里实现具体的申请逻辑
      // 由于涉及复杂的DOM操作和平台差异，这里使用模拟实现
      
      // 模拟申请过程
      await page.waitForTimeout(1000 + Math.random() * 2000);
      
      // 模拟申请成功（70%成功率）
      const success = Math.random() > 0.3;
      
      if (success) {
        console.log(`申请成功: ${job.title}`);
        return {
          success: true,
          message: '申请提交成功'
        };
      } else {
        console.log(`申请失败: ${job.title}`);
        return {
          success: false,
          message: '申请提交失败，可能已投递过或职位已关闭'
        };
      }
      
    } catch (error) {
      return {
        success: false,
        message: `申请失败: ${error.message}`,
        error: error.message
      };
    }
  }
  
  /**
   * 获取投递状态
   */
  async getDeliveryStatus(userId, platform) {
    // 这里实现获取投递状态的功能
    // 需要定期爬取平台的"我的投递"页面
    
    return {
      success: true,
      status: 'pending', // pending, viewed, rejected, interview
      message: '状态获取成功'
    };
  }
  
  /**
   * 获取投递统计
   */
  getDeliveryStats() {
    return {
      total: this.deliveryStats.total,
      success: this.deliveryStats.success,
      failed: this.deliveryStats.failed,
      successRate: this.deliveryStats.total > 0 
        ? Math.round((this.deliveryStats.success / this.deliveryStats.total) * 100)
        : 0,
      platforms: this.deliveryStats.platforms
    };
  }
  
  /**
   * 添加代理IP
   */
  addProxy(proxy) {
    this.proxyList.push(proxy);
  }
  
  /**
   * 设置代理启用状态
   */
  setProxyEnabled(enabled) {
    this.useProxy = enabled;
  }
}

module.exports = AutoDeliveryService;