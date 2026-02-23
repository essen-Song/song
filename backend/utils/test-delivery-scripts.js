/**
 * 投递脚本测试文件
 * 用于测试和验证所有投递脚本的功能
 */

const BasePlatform = require('./platforms/BasePlatform');
const BossPlatform = require('./platforms/BossPlatform');
const ZhiLianPlatform = require('./platforms/ZhiLianPlatform');
const Job51Platform = require('./platforms/Job51Platform');
const DeliveryStatusManager = require('./DeliveryStatusManager');

// 测试配置
const testConfig = {
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

// 测试数据
const testData = {
  resumeData: {
    name: '张三',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    education: '本科',
    experience: '3-5年',
    skills: ['JavaScript', 'React', 'Node.js'],
    workExperience: [
      {
        company: 'ABC公司',
        position: '前端开发工程师',
        period: '2020-2023',
        description: '负责公司网站前端开发'
      }
    ]
  },
  jobFilters: {
    keywords: '前端开发',
    location: '北京',
    salary: '20-30K',
    experience: '3-5年'
  },
  userCredentials: {
    boss: {
      phone: '13800138000',
      password: 'test123'
    },
    zhilian: {
      phone: '13800138000',
      password: 'test123'
    },
    '51job': {
      phone: '13800138000',
      password: 'test123'
    }
  }
};

// 测试类
class DeliveryScriptsTester {
  constructor() {
    this.statusManager = new DeliveryStatusManager();
    this.platforms = {};
    this.testResults = [];
  }

  /**
   * 初始化测试
   */
  async init() {
    console.log('开始测试投递脚本...');
    
    // 初始化各个平台
    this.platforms.boss = new BossPlatform(testConfig.boss);
    this.platforms.zhilian = new ZhiLianPlatform(testConfig.zhilian);
    this.platforms['51job'] = new Job51Platform(testConfig['51job']);

    // 初始化平台
    for (const [key, platform] of Object.entries(this.platforms)) {
      await platform.init();
    }

    // 注册错误处理器
    this.registerErrorHandlers();

    console.log('测试初始化完成');
  }

  /**
   * 注册错误处理器
   */
  registerErrorHandlers() {
    this.statusManager.registerErrorHandler('boss', (error, context) => {
      console.log('BOSS直聘错误处理:', error.message);
    });

    this.statusManager.registerErrorHandler('zhilian', (error, context) => {
      console.log('智联招聘错误处理:', error.message);
    });

    this.statusManager.registerErrorHandler('51job', (error, context) => {
      console.log('前程无忧错误处理:', error.message);
    });
  }

  /**
   * 测试BasePlatform基类
   */
  testBasePlatform() {
    console.log('\n=== 测试BasePlatform基类 ===');
    
    try {
      const basePlatform = new BasePlatform(testConfig.boss);
      
      // 测试计算职位匹配度
      const job = {
        title: '前端开发工程师',
        company: 'ABC公司',
        location: '北京',
        experience: '3-5年',
        description: '需要JavaScript、React等技能'
      };
      
      const matchScore = basePlatform.calculateJobMatch(job, testData.jobFilters);
      console.log('职位匹配度计算:', matchScore);
      
      // 测试随机等待时间
      const waitTime = basePlatform.getRandomWaitTime();
      console.log('随机等待时间:', waitTime);
      
      // 测试配置管理
      basePlatform.setEnabled(true);
      console.log('平台启用状态:', basePlatform.enabled);
      
      this.testResults.push({
        test: 'BasePlatform基类测试',
        status: 'success',
        message: 'BasePlatform基类测试通过'
      });
    } catch (error) {
      console.error('BasePlatform测试失败:', error);
      this.testResults.push({
        test: 'BasePlatform基类测试',
        status: 'failed',
        message: error.message
      });
    }
  }

  /**
   * 测试平台投递脚本
   */
  async testPlatforms() {
    console.log('\n=== 测试平台投递脚本 ===');

    for (const [key, platform] of Object.entries(this.platforms)) {
      console.log(`\n测试${platform.name}平台...`);
      
      try {
        // 测试平台初始化
        await platform.init();
        
        // 测试构建搜索URL
        const searchUrl = platform.buildSearchUrl(testData.jobFilters);
        console.log(`${platform.name}搜索URL:`, searchUrl);
        
        // 测试计算职位匹配度
        const job = {
          title: '前端开发工程师',
          company: 'ABC公司',
          location: '北京',
          experience: '3-5年',
          description: '需要JavaScript、React等技能'
        };
        
        const matchScore = platform.calculateJobMatch(job, testData.jobFilters);
        console.log(`${platform.name}职位匹配度:`, matchScore);
        
        this.testResults.push({
          test: `${platform.name}平台测试`,
          status: 'success',
          message: `${platform.name}平台测试通过`
        });
      } catch (error) {
        console.error(`${platform.name}测试失败:`, error);
        this.testResults.push({
          test: `${platform.name}平台测试`,
          status: 'failed',
          message: error.message
        });
      }
    }
  }

  /**
   * 测试投递状态管理
   */
  testStatusManager() {
    console.log('\n=== 测试投递状态管理 ===');
    
    try {
      const deliveryId = 'test-delivery-' + Date.now();
      
      // 初始化投递状态
      this.statusManager.initDeliveryStatus(deliveryId, {
        totalJobs: 10,
        platforms: ['boss', 'zhilian', '51job']
      });
      
      // 更新投递状态
      this.statusManager.updateDeliveryStatus(deliveryId, 'processing', {
        progress: 20
      });
      
      // 更新平台状态
      this.statusManager.updatePlatformStatus(deliveryId, 'boss', 'processing', {
        totalJobs: 3,
        completedJobs: 1,
        progress: 33
      });
      
      // 记录错误
      this.statusManager.recordError(deliveryId, 'zhilian', '测试错误', {
        jobId: '123',
        retryable: true
      });
      
      // 记录警告
      this.statusManager.recordWarning(deliveryId, '51job', '测试警告');
      
      // 获取投递状态
      const status = this.statusManager.getDeliveryStatus(deliveryId);
      console.log('投递状态:', status.status);
      console.log('投递进度:', status.progress);
      
      // 获取统计信息
      const stats = this.statusManager.getStatistics();
      console.log('投递统计:', stats.totalDeliveries);
      
      this.testResults.push({
        test: '投递状态管理测试',
        status: 'success',
        message: '投递状态管理测试通过'
      });
    } catch (error) {
      console.error('投递状态管理测试失败:', error);
      this.testResults.push({
        test: '投递状态管理测试',
        status: 'failed',
        message: error.message
      });
    }
  }

  /**
   * 测试完整投递流程
   */
  async testDeliveryFlow() {
    console.log('\n=== 测试完整投递流程 ===');
    
    try {
      const deliveryId = 'test-flow-' + Date.now();
      
      // 初始化投递状态
      this.statusManager.initDeliveryStatus(deliveryId, {
        totalJobs: 5,
        platforms: ['boss', 'zhilian', '51job']
      });
      
      // 模拟投递过程
      console.log('开始模拟投递过程...');
      
      for (const [key, platform] of Object.entries(this.platforms)) {
        console.log(`处理${platform.name}平台...`);
        
        // 更新平台状态
        this.statusManager.updatePlatformStatus(deliveryId, key, 'processing', {
          totalJobs: 2,
          completedJobs: 0
        });
        
        // 模拟职位处理
        for (let i = 0; i < 2; i++) {
          console.log(`处理${platform.name}职位 ${i+1}/2`);
          
          // 模拟成功
          this.statusManager.updatePlatformStatus(deliveryId, key, 'processing', {
            completedJobs: i + 1,
            progress: ((i + 1) / 2) * 100
          });
          
          // 模拟延迟
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 完成平台投递
        this.statusManager.updatePlatformStatus(deliveryId, key, 'success', {
          completedJobs: 2,
          progress: 100
        });
      }
      
      // 获取最终状态
      const finalStatus = this.statusManager.getDeliveryStatus(deliveryId);
      console.log('最终投递状态:', finalStatus.status);
      console.log('最终投递进度:', finalStatus.progress);
      
      this.testResults.push({
        test: '完整投递流程测试',
        status: 'success',
        message: '完整投递流程测试通过'
      });
    } catch (error) {
      console.error('完整投递流程测试失败:', error);
      this.testResults.push({
        test: '完整投递流程测试',
        status: 'failed',
        message: error.message
      });
    }
  }

  /**
   * 生成测试报告
   */
  generateTestReport() {
    console.log('\n=== 测试报告 ===');
    
    let successCount = 0;
    let failedCount = 0;
    
    this.testResults.forEach(result => {
      console.log(`${result.test}: ${result.status}`);
      if (result.message) {
        console.log(`  ${result.message}`);
      }
      
      if (result.status === 'success') {
        successCount++;
      } else {
        failedCount++;
      }
    });
    
    console.log('\n=== 测试统计 ===');
    console.log(`总测试数: ${this.testResults.length}`);
    console.log(`通过: ${successCount}`);
    console.log(`失败: ${failedCount}`);
    console.log(`成功率: ${((successCount / this.testResults.length) * 100).toFixed(2)}%`);
    
    if (failedCount === 0) {
      console.log('\n🎉 所有测试通过！');
    } else {
      console.log('\n⚠️  有测试失败，需要检查');
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('开始运行所有测试...');
    
    await this.init();
    this.testBasePlatform();
    await this.testPlatforms();
    this.testStatusManager();
    await this.testDeliveryFlow();
    this.generateTestReport();
    
    console.log('\n测试完成！');
  }
}

// 运行测试
if (require.main === module) {
  const tester = new DeliveryScriptsTester();
  tester.runAllTests().catch(error => {
    console.error('测试运行失败:', error);
  });
}

module.exports = DeliveryScriptsTester;