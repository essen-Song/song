// 模拟后端服务器 - 用于功能验证
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// 模拟数据库
const mockDatabase = {
  users: [],
  resumes: [],
  applications: [],
  optimizations: []
};

// 模拟AI服务
const mockAIService = {
  optimizeResume: (resume, jobDescription) => {
    return {
      success: true,
      data: {
        versions: [
          {
            name: '精简版',
            content: resume.replace(/\n/g, ' ').substring(0, 200) + '...',
            keywordMatchRate: 75
          },
          {
            name: '专业版',
            content: resume + '\n\n专业技能：' + jobDescription.split(' ').slice(0, 5).join(' '),
            keywordMatchRate: 85
          },
          {
            name: '高匹配版',
            content: resume + '\n\n针对岗位要求优化：\n- ' + jobDescription.split('\n')[0],
            keywordMatchRate: 92
          }
        ],
        missingKeywords: ['AI', '机器学习', '数据分析'],
        keywordMatchRate: 84
      }
    };
  },
  
  evaluateInterview: (answer, question) => {
    return {
      score: Math.floor(Math.random() * 30) + 70,
      feedback: '回答结构清晰，建议增加具体案例',
      starAnalysis: {
        situation: 8,
        task: 7,
        action: 8,
        result: 9
      }
    };
  }
};

// 简历解析器
const mockResumeParser = {
  parse: (text) => {
    return {
      name: text.match(/姓名[：:]\s*(\S+)/)?.[1] || '未知姓名',
      email: text.match(/邮箱[：:]\s*(\S+@\S+)/)?.[1] || 'unknown@example.com',
      phone: text.match(/电话[：:]\s*(\d{11})/)?.[1] || '13800000000',
      education: [
        {
          school: '某某大学',
          degree: '本科',
          major: '计算机科学',
          year: '2018-2022'
        }
      ],
      workExperience: [
        {
          company: '某某科技公司',
          position: '前端开发工程师',
          duration: '2022-至今',
          description: '负责前端开发和维护工作'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js']
    };
  }
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`[${new Date().toISOString()}] ${method} ${parsedUrl.pathname}`);
  
  // 健康检查
  if (method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
    return;
  }
  
  // 简历上传和解析
  if (method === 'POST' && parsedUrl.pathname === '/api/resume/upload') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { filename, content } = data;
        
        // 模拟解析
        const parsedData = mockResumeParser.parse(content);
        const resumeId = 'resume_' + Date.now();
        
        // 保存到模拟数据库
        mockDatabase.resumes.push({
          id: resumeId,
          filename,
          content,
          parsedData,
          createdAt: new Date().toISOString()
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            resumeId,
            parsedData,
            message: '简历解析成功'
          }
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }
  
  // 简历优化
  if (method === 'POST' && parsedUrl.pathname === '/api/optimize/resume') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { resumeText, jobDescription } = data;
        
        // 调用AI优化
        const result = mockAIService.optimizeResume(resumeText, jobDescription);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: result.data,
          message: '简历优化成功'
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }
  
  // 自动投递
  if (method === 'POST' && parsedUrl.pathname === '/api/deliver/auto') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { userId, resumeId, jobFilters } = data;
        
        // 模拟投递结果
        const platforms = ['boss', 'zhilian', '51job'];
        const results = {};
        let totalSuccess = 0;
        
        platforms.forEach(platform => {
          const success = Math.random() > 0.3;
          results[platform] = {
            success,
            message: success ? '投递成功' : '投递失败',
            appliedJobs: success ? [
              { jobTitle: '前端工程师', company: '某某公司' },
              { jobTitle: 'React开发', company: '某某科技' }
            ] : []
          };
          if (success) totalSuccess++;
        });
        
        // 保存投递记录
        mockDatabase.applications.push({
          id: 'app_' + Date.now(),
          userId,
          resumeId,
          results,
          stats: {
            total: platforms.length,
            success: totalSuccess,
            successRate: Math.round((totalSuccess / platforms.length) * 100)
          },
          createdAt: new Date().toISOString()
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            results,
            stats: {
              total: platforms.length,
              success: totalSuccess,
              successRate: Math.round((totalSuccess / platforms.length) * 100)
            }
          },
          message: '自动投递完成'
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }
  
  // 面试评估
  if (method === 'POST' && parsedUrl.pathname === '/api/interview/evaluate') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { answer, question } = data;
        
        // 调用AI评估
        const result = mockAIService.evaluateInterview(answer, question);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: result,
          message: '面试评估完成'
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }
  
  // 获取数据库统计
  if (method === 'GET' && parsedUrl.pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        users: mockDatabase.users.length,
        resumes: mockDatabase.resumes.length,
        applications: mockDatabase.applications.length,
        optimizations: mockDatabase.optimizations.length
      }
    }));
    return;
  }
  
  // 默认响应
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: 'API 端点不存在'
  }));
});

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 ResumeFlow 模拟后端服务器启动成功！`);
  console.log(`📋 服务器地址: http://localhost:${PORT}`);
  console.log(`🔗 API 端点:`);
  console.log(`   - GET  /health - 健康检查`);
  console.log(`   - POST /api/resume/upload - 简历上传`);
  console.log(`   - POST /api/optimize/resume - 简历优化`);
  console.log(`   - POST /api/deliver/auto - 自动投递`);
  console.log(`   - POST /api/interview/evaluate - 面试评估`);
  console.log(`   - GET  /api/stats - 数据统计`);
  console.log(`\n✅ 所有核心功能已就绪！`);
});

module.exports = server;