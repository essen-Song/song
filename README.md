# 🚀 ResumeFlow —— 全AI生成的智能求职平台

> 由AI设计、AI编码、AI测试、AI部署。你无需写一行代码。

## 🌐 在线演示
https://resumeflow.vercel.app

## 🎯 核心功能

### 1. 📄 简历智能解析
- 支持PDF和Word格式简历上传
- AI自动提取结构化信息（教育背景、工作经历、项目经验、技能等）
- 提取准确率≥90%

### 2. 🤖 AI简历优化
- 根据岗位JD智能优化简历内容
- 提供三个版本：精简版、专业版、高匹配版
- 使用STAR模型和量化数据提升ATS通过率

### 3. 🚀 一键多平台投递
- 自动投递到BOSS直聘、智联招聘、前程无忧
- 使用Playwright模拟真人操作
- 代理IP轮换防止封号

### 4. 🎙️ AI面试教练
- 语音输入转文字
- AI实时反馈和改进建议
- 生成PDF面试报告

## 🏗️ 技术架构

```
用户浏览器 → React前端 → Vercel Serverless Functions → 
├── Supabase（数据库）
├── 阿里云Qwen API（AI引擎）
├── 阿里云ASR/TTS（语音交互）
└── Playwright（自动化投递）
```

### 技术栈
- **前端**: React + Tailwind CSS + jsPDF
- **后端**: Node.js + Vercel Serverless
- **数据库**: Supabase (PostgreSQL)
- **AI引擎**: 通义千问 Qwen-72B
- **语音交互**: 阿里云 ASR/TTS
- **自动化**: Playwright

## 🔧 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 安装步骤
1. 克隆仓库
```bash
git clone https://github.com/your-username/resume-flow.git
cd resume-flow
```

2. 安装依赖
```bash
cd frontend && npm install
cd ../backend && npm install
```

3. 配置环境变量
复制 `.env.example` 为 `.env` 并填写相关配置：
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
DASHSCOPE_API_KEY=your-dashscope-key
```

4. 本地开发
```bash
# 前端开发服务器
cd frontend && npm run dev

# 后端API（新终端）
cd backend && npm run dev
```

### 部署到生产环境
```bash
# 一键部署脚本
./DEPLOY/deploy.sh
```

## 📁 项目结构

```
resume-flow/
├── frontend/          # React前端应用
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Node.js后端API
│   ├── functions/     # Vercel Serverless Functions
│   ├── utils/         # 工具函数
│   └── package.json
├── scripts/           # 脚本工具
├── DEPLOY/            # 部署相关文件
├── DB/                # 数据库初始化脚本
├── README.md
├── LICENSE
└── test-report.md     # 测试报告
```

## 🧪 测试

### 简历解析测试
```bash
cd backend && npm test:parser
```

### AI优化测试
```bash
cd backend && npm test:optimizer
```

### 投递系统测试
```bash
cd backend && npm test:delivery
```

## 📊 性能指标

- 简历解析准确率: ≥90%
- AI优化响应时间: ≤2.5s
- 语音识别准确率: ≥90%
- 投递成功率: ≥70%

## 🔒 安全说明

- 不存储用户账号密码
- 使用代理IP保护用户隐私
- 所有API调用使用HTTPS
- 遵循GDPR数据保护规范

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

## 👥 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

- 项目Issues: [GitHub Issues](https://github.com/your-username/resume-flow/issues)
- 邮箱: your-email@example.com

---

**⭐ 如果这个项目对你有帮助，请给个Star！**