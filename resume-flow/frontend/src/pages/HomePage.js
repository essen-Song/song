import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Brain, 
  Send, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';

const HomePage = ({ user, onLogin }) => {
  const handleQuickStart = () => {
    if (user) {
      // 跳转到简历上传页面
      window.location.href = '/resume/upload';
    } else {
      // 显示登录提示或跳转到登录
      const userId = prompt('请输入用户ID（仅用于演示）:');
      if (userId) {
        onLogin({ id: userId, name: '用户' });
        window.location.href = '/resume/upload';
      }
    }
  };

  const features = [
    {
      icon: <Upload className="w-8 h-8 text-blue-600" />,
      title: '智能简历解析',
      description: '支持PDF和Word格式，AI自动提取关键信息，准确率高达90%以上',
      color: 'blue'
    },
    {
      icon: <Brain className="w-8 h-8 text-purple-600" />,
      title: 'AI简历优化',
      description: '基于岗位JD智能优化简历内容，提供多版本选择，提升ATS通过率',
      color: 'purple'
    },
    {
      icon: <Send className="w-8 h-8 text-green-600" />,
      title: '一键多平台投递',
      description: '自动投递到BOSS直聘、智联、前程无忧等主流招聘平台',
      color: 'green'
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: 'AI面试教练',
      description: '模拟真实面试场景，提供实时反馈和改进建议，提升面试成功率',
      color: 'orange'
    }
  ];

  const stats = [
    { number: '10,000+', label: '用户信赖', icon: <Users className="w-5 h-5" /> },
    { number: '95%', label: '简历解析准确率', icon: <CheckCircle className="w-5 h-5" /> },
    { number: '80%', label: '面试通过率提升', icon: <TrendingUp className="w-5 h-5" /> },
    { number: '4.9/5', label: '用户满意度', icon: <Star className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              AI驱动的
              <span className="text-blue-200">智能求职平台</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              一份简历，AI帮你投遍全网；一次对话，AI教你稳过面试
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleQuickStart}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
              >
                立即开始
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <Link
                to="/dashboard"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                查看演示
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              四大核心功能
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              基于AI技术的全流程求职解决方案，让找工作变得更简单高效
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card text-center">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full bg-${feature.color}-100`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            准备好提升你的求职成功率了吗？
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            加入数千名求职者的行列，使用AI技术让求职过程更高效、更智能
          </p>
          <button
            onClick={handleQuickStart}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
          >
            免费开始使用
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ResumeFlow</h3>
              <p className="text-gray-400">
                AI驱动的智能求职平台，让找工作变得更简单。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">产品功能</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/resume/upload" className="hover:text-white">简历解析</Link></li>
                <li><Link to="/resume/optimize" className="hover:text-white">简历优化</Link></li>
                <li><Link to="/job/delivery" className="hover:text-white">职位投递</Link></li>
                <li><Link to="/interview/coach" className="hover:text-white">面试教练</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">帮助支持</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">使用指南</a></li>
                <li><a href="#" className="hover:text-white">常见问题</a></li>
                <li><a href="#" className="hover:text-white">联系我们</a></li>
                <li><a href="#" className="hover:text-white">隐私政策</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-gray-400">
                <li>邮箱: 2402096574@qq.com</li>
                <li>电话: 400-123-4567</li>
                <li>工作时间: 9:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ResumeFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;