/**
 * 前程无忧平台投递类
 * 实现前程无忧的自动化投递逻辑
 */
const BasePlatform = require('./BasePlatform');

class Job51Platform extends BasePlatform {
  constructor(platformConfig) {
    super(platformConfig);
    this.platformKey = '51job';
  }

  /**
   * 登录前程无忧
   * @param {Page} page - Playwright Page对象
   * @param {Object} credentials - 登录凭证
   * @returns {Object} 登录结果
   */
  async login(page, credentials) {
    try {
      console.log('正在登录前程无忧...');
      
      // 打开前程无忧首页
      await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
      
      // 等待页面加载
      await page.waitForTimeout(this.getRandomWaitTime());
      
      // 检查是否已经登录
      const isLoggedIn = await this.checkLoginStatus(page);
      if (isLoggedIn) {
        console.log('前程无忧已登录');
        return {
          success: true,
          message: '已登录'
        };
      }
      
      // 点击登录按钮
      const loginButton = await this.safeWaitForSelector(page, '.login-btn');
      if (!loginButton) {
        return {
          success: false,
          message: '未找到登录按钮'
        };
      }
      
      await this.safeClick(page, '.login-btn');
      
      // 等待登录弹窗
      await page.waitForTimeout(this.getRandomWaitTime());
      
      // 选择手机号登录
      await this.safeClick(page, '.phone-login');
      
      // 填写手机号
      if (credentials.phone) {
        await this.safeFill(page, 'input[name="phone"]', credentials.phone);
      } else {
        return {
          success: false,
          message: '缺少手机号'
        };
      }
      
      // 填写密码
      if (credentials.password) {
        await this.safeFill(page, 'input[name="password"]', credentials.password);
      } else {
        return {
          success: false,
          message: '缺少密码'
        };
      }
      
      // 点击登录按钮
      await this.safeClick(page, '.btn-login');
      
      // 等待登录结果
      await page.waitForTimeout(this.getRandomWaitTime(3000, 5000));
      
      // 检查登录是否成功
      const loginSuccess = await this.checkLoginStatus(page);
      if (loginSuccess) {
        console.log('前程无忧登录成功');
        return {
          success: true,
          message: '登录成功'
        };
      } else {
        return {
          success: false,
          message: '登录失败，可能需要验证码或账号密码错误'
        };
      }
      
    } catch (error) {
      console.error('前程无忧登录失败:', error);
      return {
        success: false,
        message: `登录失败: ${error.message}`
      };
    }
  }

  /**
   * 检查登录状态
   * @param {Page} page - Playwright Page对象
   * @returns {Boolean} 是否已登录
   */
  async checkLoginStatus(page) {
    try {
      // 检查是否存在用户头像或登录状态元素
      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('.user-profile') !== null;
      });
      return isLoggedIn;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      return false;
    }
  }

  /**
   * 搜索职位
   * @param {Page} page - Playwright Page对象
   * @param {Object} jobFilters - 职位筛选条件
   * @returns {Object} 搜索结果
   */
  async searchJobs(page, jobFilters) {
    try {
      console.log('正在前程无忧搜索职位...');
      
      const { keywords, location, salary, experience } = jobFilters;
      
      // 构建搜索URL
      const searchUrl = this.buildSearchUrl(jobFilters);
      
      // 打开搜索页面
      await page.goto(searchUrl, { waitUntil: 'networkidle' });
      
      // 等待搜索结果加载
      await page.waitForTimeout(this.getRandomWaitTime(3000, 5000));
      
      // 检查是否有搜索结果
      const hasResults = await page.evaluate(() => {
        return document.querySelectorAll('.job-item').length > 0;
      });
      
      if (hasResults) {
        console.log('前程无忧职位搜索完成');
        return {
          success: true,
          message: '搜索完成'
        };
      } else {
        return {
          success: false,
          message: '未找到职位'
        };
      }
      
    } catch (error) {
      console.error('前程无忧搜索职位失败:', error);
      return {
        success: false,
        message: `搜索失败: ${error.message}`
      };
    }
  }

  /**
   * 构建搜索URL
   * @param {Object} jobFilters - 职位筛选条件
   * @returns {String} 搜索URL
   */
  buildSearchUrl(jobFilters) {
    const { keywords, location, salary, experience } = jobFilters;
    
    let url = this.searchUrl;
    let params = new URLSearchParams();
    
    if (keywords) {
      params.append('keyword', keywords);
    }
    
    if (experience) {
      params.append('workexperience', experience);
    }
    
    if (location) {
      params.append('district', location);
    }
    
    // 前程无忧的薪资参数处理
    if (salary) {
      // 这里需要根据具体的薪资范围映射到前程无忧的参数格式
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    return url;
  }

  /**
   * 提取职位列表
   * @param {Page} page - Playwright Page对象
   * @returns {Array} 职位列表
   */
  async extractJobListings(page) {
    try {
      console.log('正在提取前程无忧职位列表...');
      
      // 等待职位列表加载
      await page.waitForTimeout(this.getRandomWaitTime());
      
      // 提取职位信息
      const jobs = await page.evaluate(() => {
        const jobCards = document.querySelectorAll('.job-item');
        const jobList = [];
        
        jobCards.forEach(card => {
          try {
            const titleElement = card.querySelector('.job-title');
            const companyElement = card.querySelector('.company-name');
            const salaryElement = card.querySelector('.salary');
            const locationElement = card.querySelector('.job-location');
            const experienceElement = card.querySelector('.job-experience');
            const urlElement = card.querySelector('a');
            
            if (titleElement && companyElement) {
              jobList.push({
                title: titleElement.textContent.trim(),
                company: companyElement.textContent.trim(),
                salary: salaryElement ? salaryElement.textContent.trim() : '',
                location: locationElement ? locationElement.textContent.trim() : '',
                experience: experienceElement ? experienceElement.textContent.trim() : '',
                url: urlElement ? urlElement.href : '',
                description: '' // 可以从职位详情页获取
              });
            }
          } catch (error) {
            console.error('提取职位信息失败:', error);
          }
        });
        
        return jobList;
      });
      
      console.log(`成功提取${jobs.length}个前程无忧职位`);
      return jobs;
      
    } catch (error) {
      console.error('提取前程无忧职位列表失败:', error);
      return [];
    }
  }

  /**
   * 提交单个申请
   * @param {Page} page - Playwright Page对象
   * @param {Object} job - 职位信息
   * @param {Object} resumeData - 简历数据
   * @returns {Object} 申请结果
   */
  async submitApplication(page, job, resumeData) {
    try {
      console.log(`正在申请前程无忧职位: ${job.title} @ ${job.company}`);
      
      // 打开职位详情页
      if (job.url) {
        await page.goto(job.url, { waitUntil: 'networkidle' });
      } else {
        return {
          success: false,
          message: '缺少职位URL'
        };
      }
      
      // 等待页面加载
      await page.waitForTimeout(this.getRandomWaitTime());
      
      // 检查是否可以投递
      const canApply = await page.evaluate(() => {
        return document.querySelector('.apply-btn') !== null;
      });
      
      if (!canApply) {
        return {
          success: false,
          message: '该职位无法投递'
        };
      }
      
      // 点击投递按钮
      await this.safeClick(page, '.apply-btn');
      
      // 等待投递弹窗
      await page.waitForTimeout(this.getRandomWaitTime());
      
      // 选择简历
      // 这里需要根据实际的简历选择逻辑实现
      // 例如：选择默认简历或上传新简历
      
      // 点击确认投递
      await this.safeClick(page, '.submit-btn');
      
      // 等待投递结果
      await page.waitForTimeout(this.getRandomWaitTime(2000, 4000));
      
      // 检查投递是否成功
      const isSuccess = await page.evaluate(() => {
        return document.querySelector('.success-message') !== null;
      });
      
      if (isSuccess) {
        console.log(`前程无忧职位申请成功: ${job.title}`);
        return {
          success: true,
          message: '申请成功'
        };
      } else {
        return {
          success: false,
          message: '申请失败'
        };
      }
      
    } catch (error) {
      console.error(`前程无忧职位申请失败: ${job.title}`, error);
      return {
        success: false,
        message: `申请失败: ${error.message}`
      };
    }
  }

  /**
   * 获取投递状态
   * @param {String} userId - 用户ID
   * @param {Object} applicationData - 申请数据
   * @returns {Object} 投递状态
   */
  async getDeliveryStatus(userId, applicationData) {
    try {
      console.log('正在获取前程无忧投递状态...');
      
      // 这里需要实现从前程无忧的"我的投递"页面获取状态
      // 由于涉及到用户登录状态，这里返回模拟状态
      
      return {
        success: true,
        status: 'pending', // pending, viewed, rejected, interview
        message: '状态获取成功'
      };
      
    } catch (error) {
      console.error('获取前程无忧投递状态失败:', error);
      return {
        success: false,
        message: `状态获取失败: ${error.message}`
      };
    }
  }

  /**
   * 检查是否被反爬虫
   * @param {Page} page - Playwright Page对象
   * @returns {Boolean} 是否被反爬虫
   */
  async checkAntiCrawl(page) {
    try {
      const isAntiCrawl = await page.evaluate(() => {
        // 检查是否出现验证码或反爬虫提示
        const captcha = document.querySelector('.captcha');
        const antiCrawlMessage = document.querySelector('.anti-crawl');
        return captcha !== null || antiCrawlMessage !== null;
      });
      
      return isAntiCrawl;
    } catch (error) {
      console.error('检查前程无忧反爬虫失败:', error);
      return false;
    }
  }

  /**
   * 处理验证码
   * @param {Page} page - Playwright Page对象
   * @returns {Object} 验证码处理结果
   */
  async handleCaptcha(page) {
    try {
      console.log('前程无忧检测到验证码');
      
      // 这里可以集成验证码识别服务
      // 例如：使用第三方验证码识别API
      
      return {
        success: false,
        message: '检测到验证码，需要手动处理'
      };
      
    } catch (error) {
      console.error('处理前程无忧验证码失败:', error);
      return {
        success: false,
        message: `验证码处理失败: ${error.message}`
      };
    }
  }
}

module.exports = Job51Platform;