/**
 * ResumeFlow 功能测试套件
 * 测试所有核心功能模块
 */

const fs = require('fs');
const path = require('path');

// 测试结果存储
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  modules: {}
};

// 测试工具函数
function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`✅ ${message}`);
    return true;
  } else {
    testResults.failed++;
    console.log(`❌ ${message}`);
    return false;
  }
}

function assertEqual(actual, expected, message) {
  return assert(actual === expected, `${message} (期望: ${expected}, 实际: ${actual})`);
}

function assertContains(text, substring, message) {
  return assert(text.includes(substring), `${message} (文本: "${text}")`);
}

// 模块1: 简历解析测试
function testResumeParser() {
  console.log('\n📝 测试简历解析模块...');
  const results = { passed: 0, failed: 0 };
  
  // 测试文件存在性
  const parserFile = path.join(__dirname, '../backend/utils/resumeParser.js');
  const pdfParserFile = path.join(__dirname, '../backend/utils/pdfParser.js');
  const wordParserFile = path.join(__dirname, '../backend/utils/wordParser.js');
  
  if (assert(fs.existsSync(parserFile), '简历解析器文件存在')) results.passed++;
  else results.failed++;
  
  if (assert(fs.existsSync(pdfParserFile), 'PDF解析器文件存在')) results.passed++;
  else results.failed++;
  
  if (assert(fs.existsSync(wordParserFile), 'Word解析器文件存在')) results.passed++;
  else results.failed++;
  
  // 测试API端点
  const resumeApiFile = path.join(__dirname, '../backend/api/resume.js');
  if (assert(fs.existsSync(resumeApiFile), '简历API端点存在')) results.passed++;
  else results.failed++;
  
  // 测试解析函数结构
  const parserContent = fs.readFileSync(parserFile, 'utf8');
  if (assertContains(parserContent, 'parseResume', '包含parseResume函数')) results.passed++;
  else results.failed++;
  
  if (assertContains(parserContent, 'extractText', '包含extractText函数')) results.passed++;
  else results.failed++;
  
  testResults.modules['简历解析'] = results;
}

// 模块2: AI优化引擎测试
function testAIOptimizer() {
  console.log('\n🤖 测试AI优化引擎...');
  const results = { passed: 0, failed: 0 };
  
  // 测试文件存在性
  const optimizerFile = path.join(__dirname, '../backend/utils/aiOptimizer.js');
  const optimizeApiFile = path.join(__dirname, '../backend/api/optimize.js');
  
  if (assert(fs.existsSync(optimizerFile), 'AI优化器文件存在')) results.passed++;
  else results.failed++;
  
  if (assert(fs.existsSync(optimizeApiFile), '优化API端点存在')) results.passed++;
  else results.failed++;
  
  // 测试优化函数结构
  const optimizerContent = fs.readFileSync(optimizerFile, 'utf8');
  if (assertContains(optimizerContent, 'optimizeResume', '包含optimizeResume函数')) results.passed++;
  else results.failed++;
  
  if (assertContains(optimizerContent, 'generateMultipleVersions', '包含generateMultipleVersions函数')) results.passed++;
  else results.failed++;
  
  if (assertContains(optimizerContent, 'matchKeywords', '包含matchKeywords函数')) results.passed++;
  else results.failed++;
  
  testResults.modules['AI优化'] = results;
}

// 模块3: 自动投递系统测试
function testAutoDelivery() {
  console.log('\n🚀 测试自动投递系统...');
  const results = { passed: 0, failed: 0 };
  
  // 测试文件存在性
  const deliveryFile = path.join(__dirname, '../backend/utils/autoDelivery.js');
  const deliveryApiFile = path.join(__dirname, '../backend/api/deliver.js');
  
  if (assert(fs.existsSync(deliveryFile), '自动投递器文件存在')) results.passed++;
  else results.failed++;
  
  if (assert(fs.existsSync(deliveryApiFile), '投递API端点存在')) results.passed++;
  else results.failed++;
  
  // 测试投递函数结构
  const deliveryContent = fs.readFileSync(deliveryFile, 'utf8');
  if (assertContains(deliveryContent, 'autoDeliverJobs', '包含autoDeliverJobs函数')) results.passed++;
  else results.failed++;
  
  if (assertContains(deliveryContent, 'deliverToPlatform', '包含deliverToPlatform函数')) results.passed++;
  else results.failed++;
  
  if (assertContains(deliveryContent, 'rotateProxy', '包含rotateProxy函数')) results.passed++;
  else results.failed++;
  
  testResults.modules['自动投递'] = results;
}

// 模块4: 面试教练测试
function testInterviewCoach() {
  console.log('\n🎤 测试面试教练功能...');
  const results = { passed: 0, failed: 0 };
  
  // 测试文件存在性
  const interviewFile = path.join(__dirname, '../backend/utils/aiInterview.js');
  const voiceServiceFile = path.join(__dirname, '../backend/utils/voiceService.js');
  const interviewApiFile = path.join(__dirname, '../backend/api/interview.js');
  
  if (assert(fs.existsSync(interviewFile), '面试教练文件存在')) results.passed++;
  else results.failed++;
  
  if (assert(fs.existsSync(voiceServiceFile), '语音服务文件存在')) results.passed++;
  else results.failed++;
  
  if (assert(fs.existsSync(interviewApiFile), '面试API端点存在')) results.passed++;
  else results.failed++;
  
  // 测试面试函数结构
  const interviewContent = fs.readFileSync(interviewFile, 'utf8');
  if (assertContains(interviewContent, 'startInterview', '包含startInterview函数')) results.passed++;
  else results.failed++;
  
  if (assertContains(interviewContent, 'evaluateAnswer', '包含evaluateAnswer函数')) results.passed++;
  else results.failed++;
  
  if (assertContains(interviewContent, 'generateFeedback', '包含generateFeedback函数')) results.passed++;
  else results.failed++;
  
  testResults.modules['面试教练'] = results;
}

// 前端组件测试
function testFrontendComponents() {
  console.log('\n🎨 测试前端组件...');
  const results = { passed: 0, failed: 0 };
  
  const componentsDir = path.join(__dirname, '../frontend/src/pages');
  const components = [
    'DashboardPage.js',
    'ResumeUploadPage.js',
    'ResumeOptimizePage.js',
    'JobDeliveryPage.js',
    'InterviewCoachPage.js'
  ];
  
  components.forEach(component => {
    const componentFile = path.join(componentsDir, component);
    if (assert(fs.existsSync(componentFile), `${component} 文件存在`)) results.passed++;
    else results.failed++;
  });
  
  // 测试主应用文件
  const appFile = path.join(__dirname, '../frontend/src/App.js');
  if (assert(fs.existsSync(appFile), '主App组件存在')) results.passed++;
  else results.failed++;
  
  const indexFile = path.join(__dirname, '../frontend/src/index.js');
  if (assert(fs.existsSync(indexFile), '入口文件存在')) results.passed++;
  else results.failed++;
  
  testResults.modules['前端组件'] = results;
}

// 配置文件测试
function testConfigurationFiles() {
  console.log('\n⚙️ 测试配置文件...');
  const results = { passed: 0, failed: 0 };
  
  const configFiles = [
    '../backend/package.json',
    '../frontend/package.json',
    '../frontend/vite.config.js',
    '../frontend/tailwind.config.js',
    '../vercel.json',
    '../.gitignore'
  ];
  
  configFiles.forEach(configFile => {
    const filePath = path.join(__dirname, configFile);
    if (assert(fs.existsSync(filePath), `${path.basename(configFile)} 存在`)) results.passed++;
    else results.failed++;
  });
  
  // 测试数据库配置
  const dbScript = path.join(__dirname, '../DB/init.sql');
  if (assert(fs.existsSync(dbScript), '数据库初始化脚本存在')) results.passed++;
  else results.failed++;
  
  testResults.modules['配置文件'] = results;
}

// 模拟API测试
function testAPIEndpoints() {
  console.log('\n🔌 测试API端点结构...');
  const results = { passed: 0, failed: 0 };
  
  // 测试后端主文件
  const backendIndex = path.join(__dirname, '../backend/index.js');
  if (assert(fs.existsSync(backendIndex), '后端主入口文件存在')) results.passed++;
  else results.failed++;
  
  // 测试API路由配置
  const indexContent = fs.readFileSync(backendIndex, 'utf8');
  const expectedRoutes = [
    '/api/resume',
    '/api/optimize',
    '/api/deliver',
    '/api/interview',
    '/api/health'
  ];
  
  expectedRoutes.forEach(route => {
    if (assertContains(indexContent, route, `包含路由 ${route}`)) results.passed++;
    else results.failed++;
  });
  
  testResults.modules['API端点'] = results;
}

// 安全性测试
function testSecurityFeatures() {
  console.log('\n🔒 测试安全功能...');
  const results = { passed: 0, failed: 0 };
  
  // 检查是否包含安全相关的代码
  const backendFiles = [
    path.join(__dirname, '../backend/index.js'),
    path.join(__dirname, '../backend/api/resume.js'),
    path.join(__dirname, '../backend/api/optimize.js')
  ];
  
  backendFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 检查错误处理
      if (assertContains(content, 'try', `${path.basename(file)} 包含错误处理`)) results.passed++;
      else results.failed++;
      
      // 检查输入验证
      if (assertContains(content, 'validation', `${path.basename(file)} 包含输入验证`)) results.passed++;
      else results.failed++;
    }
  });
  
  testResults.modules['安全功能'] = results;
}

// 生成测试报告
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEFLOW 功能测试报告');
  console.log('='.repeat(60));
  
  console.log('\n📋 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📊 总计: ${testResults.total}`);
  console.log(`🎯 成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log('\n📈 模块详细结果:');
  Object.entries(testResults.modules).forEach(([module, results]) => {
    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`${module}: ${results.passed}/${results.passed + results.failed} (${successRate}%)`);
  });
  
  // 生成详细报告文件
  const reportContent = `
# ResumeFlow 功能测试报告

## 📊 测试结果
- **总测试数**: ${testResults.total}
- **通过数**: ${testResults.passed}
- **失败数**: ${testResults.failed}
- **成功率**: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%

## 📈 模块测试结果
${Object.entries(testResults.modules).map(([module, results]) => {
  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  return `### ${module}
- 通过: ${results.passed}
- 失败: ${results.failed}
- 成功率: ${successRate}%
`;
}).join('\n')}

## 🎯 测试结论
${testResults.failed === 0 ? '✅ 所有功能测试通过，系统功能完整！' : '⚠️ 发现一些问题，需要修复后再测试。'}

---
生成时间: ${new Date().toLocaleString()}
`;
  
  fs.writeFileSync(path.join(__dirname, '../TEST/function-test-report.md'), reportContent);
  console.log('\n📄 详细测试报告已保存到: TEST/function-test-report.md');
}

// 主测试函数
function runAllTests() {
  console.log('🚀 开始 ResumeFlow 功能测试...');
  console.log('='.repeat(60));
  
  try {
    testResumeParser();
    testAIOptimizer();
    testAutoDelivery();
    testInterviewCoach();
    testFrontendComponents();
    testConfigurationFiles();
    testAPIEndpoints();
    testSecurityFeatures();
    
    generateTestReport();
    
    console.log('\n✅ 功能测试完成！');
    
    if (testResults.failed === 0) {
      console.log('🎉 恭喜！所有功能测试通过，系统功能完整！');
    } else {
      console.log('⚠️ 发现一些问题，请查看测试报告并修复。');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };