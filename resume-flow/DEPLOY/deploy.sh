#!/bin/bash

# ResumeFlow 部署脚本
# 一键部署到 Vercel

set -e

echo "🚀 开始部署 ResumeFlow..."

# 检查依赖
echo "📋 检查依赖..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 检查环境变量
echo "🔧 检查环境变量..."
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  警告: SUPABASE_URL 或 SUPABASE_ANON_KEY 未设置"
    echo "   请在部署前设置这些环境变量"
fi

if [ -z "$DASHSCOPE_API_KEY" ]; then
    echo "⚠️  警告: DASHSCOPE_API_KEY 未设置"
    echo "   AI功能将使用模拟数据"
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install
npm run build
cd ..

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
npm install
cd ..

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p uploads/resumes
mkdir -p uploads/audio
mkdir -p logs

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
if [ "$1" == "prod" ]; then
    echo "🌟 生产环境部署..."
    vercel --prod
else
    echo "🔧 开发环境部署..."
    vercel
fi

echo "✅ 部署完成！"
echo ""
echo "📊 部署信息:"
echo "   - 前端: React + Tailwind CSS"
echo "   - 后端: Node.js + Express"
echo "   - 数据库: Supabase (PostgreSQL)"
echo "   - AI服务: 阿里云 DashScope"
echo "   - 部署平台: Vercel"
echo ""
echo "🎯 主要功能:"
echo "   - 智能简历解析 (PDF/Word)"
echo "   - AI简历优化 (多版本)"
echo "   - 自动职位投递 (多平台)"
echo "   - AI面试教练 (语音交互)"
echo ""
echo "🔗 访问地址将在 Vercel 部署完成后显示"