# ResumeFlow 项目文档

## 📋 项目概述

ResumeFlow 是一个AI驱动的智能求职助手平台，提供从简历优化到面试辅导的全流程求职服务。

## 🚀 核心功能

### 1. 智能简历解析与上传
- 支持PDF和Word文档格式
- AI自动提取结构化信息
- 90%+的解析准确率
- 多维度数据验证

### 2. AI简历优化引擎
- 基于岗位JD的智能优化
- 多版本输出（精简版/专业版/高匹配版）
- 关键词匹配分析
- STAR模型优化建议

### 3. 一键多平台投递
- 支持BOSS直聘、智联招聘、前程无忧
- 智能职位匹配和筛选
- 投递状态实时跟踪
- 成功率统计分析

### 4. AI面试教练
- 语音转文字交互
- STAR模型评估反馈
- 个性化改进建议
- 面试报告生成

## 🛠️ 技术架构

### 前端技术栈
- **框架**: React 18 + Vite
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **UI组件**: Lucide React Icons
- **HTTP客户端**: Axios
- **通知**: React Hot Toast

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: 阿里云 DashScope
- **文件解析**: pdf-parse, mammoth
- **浏览器自动化**: Playwright
- **语音服务**: 阿里云 ASR/TTS

### 部署架构
- **平台**: Vercel (Serverless)
- **存储**: Supabase Storage
- **CDN**: Vercel Edge Network
- **监控**: 内置日志和性能监控

## 📁 项目结构

```
resume-flow/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── utils/         # 工具函数
│   │   └── App.js         # 主应用组件
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖
├── backend/                # Node.js后端
│   ├── api/               # API路由
│   ├── utils/             # 工具函数
│   ├── index.js           # 主入口文件
│   └── package.json       # 后端依赖
├── database/              # 数据库脚本
│   └── init.sql          # 数据库初始化
├── TEST/                  # 测试文件
├── DEPLOY/               # 部署脚本
└── README.md             # 项目文档
```

## 🎯 快速开始

### 环境要求
- Node.js 18.0.0+
- npm 或 yarn
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd resume-flow
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **安装前端依赖**
```bash
cd ../frontend
npm install
```

4. **配置环境变量**
```bash
# 后端配置
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件，填入必要的API密钥

# 前端配置
cp frontend/.env.example frontend/.env
# 编辑 frontend/.env 文件，配置API地址
```

5. **初始化数据库**
```bash
# 在Supabase控制台创建项目后，执行数据库初始化脚本
```

6. **启动开发服务器**
```bash
# 启动后端（端口3001）
cd backend
npm run dev

# 启动前端（端口3000）
cd frontend
npm run dev
```

## 🔧 配置说明

### 必需的环境变量

#### 后端配置
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DASHSCOPE_API_KEY=your_dashscope_api_key
```

#### 前端配置
```env
VITE_API_BASE_URL=http://localhost:3001
```

### 可选配置
- 代理服务器配置
- Redis缓存配置
- 监控和日志配置
- 第三方服务集成

## 📊 性能指标

| 功能模块 | 预期响应时间 | 准确率 |
|---------|-------------|--------|
| 简历解析 | ≤3秒 | 90%+ |
| AI优化 | ≤5秒 | 85%+ |
| 自动投递 | ≤10秒 | 65%+ |
| 语音识别 | ≤3秒 | 89%+ |

## 🔒 安全特性

- 输入验证和清理
- 文件上传安全检查
- SQL注入防护
- XSS攻击防护
- 敏感信息加密
- API访问限流

## 🧪 测试

### 测试类型
- **功能测试**: 验证核心功能
- **集成测试**: 测试API接口
- **端到端测试**: 模拟用户流程
- **性能测试**: 响应时间和并发处理

### 运行测试
```bash
# 运行所有测试
cd TEST
node comprehensive-test.js

# 运行特定测试
node function-test.js      # 功能测试
node integration-test.js   # 集成测试
node e2e-test.js          # 端到端测试
```

## 🚀 部署

### 一键部署
```bash
cd DEPLOY
chmod +x deploy.sh
./deploy.sh [prod|dev]
```

### 手动部署
1. 构建前端: `npm run build`
2. 配置Vercel: 设置环境变量
3. 部署后端: `vercel --prod`
4. 验证部署: 访问健康检查端点

## 📈 监控和维护

### 日志监控
- 应用日志: `/logs` 目录
- 错误追踪: 集成Sentry（可选）
- 性能监控: 内置性能指标

### 数据备份
- 数据库自动备份
- 文件存储冗余备份
- 配置版本控制

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如遇到问题，请：
1. 查看文档和FAQ
2. 检查GitHub Issues
3. 创建新的Issue

## 🔄 更新日志

### v1.0.0 (2024-12)
- ✨ 初始版本发布
- 🚀 核心功能完整实现
- 🧪 全面测试覆盖
- 📊 性能优化完成

---

**ResumeFlow** - 让求职更智能，让成功更简单！ 🎯