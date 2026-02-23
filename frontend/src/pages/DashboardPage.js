import React, { useState, useEffect } from 'react';
import { FileText, Send, Users, TrendingUp, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import axios from 'axios';

const DashboardPage = ({ user }) => {
  const [stats, setStats] = useState({
    resumeCount: 0,
    applicationCount: 0,
    interviewCount: 0
  });
  const [recentResumes, setRecentResumes] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // 获取统计数据
      const statsResponse = await axios.get(`/api/user/stats/${user.id}`);
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // 获取最近简历
      const resumesResponse = await axios.get(`/api/resume/user/${user.id}?limit=5`);
      if (resumesResponse.data.success) {
        setRecentResumes(resumesResponse.data.data);
      }

      // 获取最近投递
      const applicationsResponse = await axios.get(`/api/deliver/history/${user.id}?limit=5`);
      if (applicationsResponse.data.success) {
        setRecentApplications(applicationsResponse.data.data);
      }
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'sent': 'bg-blue-100 text-blue-800',
      'viewed': 'bg-green-100 text-green-800',
      'interview': 'bg-purple-100 text-purple-800',
      'rejected': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'sent': '已投递',
      'viewed': '已查看',
      'interview': '面试邀请',
      'rejected': '已拒绝',
      'pending': '待处理',
      'failed': '投递失败'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎回来，{user?.name}！
          </h1>
          <p className="text-gray-600">
            这里是您的求职仪表板，查看您的简历和投递进展
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">简历总数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.resumeCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">投递总数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.applicationCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Send className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">面试次数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.interviewCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.applicationCount > 0 
                    ? Math.round((stats.interviewCount / stats.applicationCount) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 最近简历 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">最近简历</h2>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            
            {recentResumes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">暂无简历</p>
                <button
                  onClick={() => window.location.href = '/resume/upload'}
                  className="btn-primary"
                >
                  上传简历
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentResumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {resume.name || '未命名简历'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {resume.file_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 最近投递 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">最近投递</h2>
              <Send className="w-5 h-5 text-gray-400" />
            </div>
            
            {recentApplications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">暂无投递记录</p>
                <button
                  onClick={() => window.location.href = '/job/delivery'}
                  className="btn-primary"
                >
                  开始投递
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {app.job_title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {app.company_name} • {getPlatformText(app.platform)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {getStatusText(app.status)}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 快速操作 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">快速操作</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => window.location.href = '/resume/upload'}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">上传简历</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/resume/optimize'}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">优化简历</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/job/delivery'}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Send className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">职位投递</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/interview/coach'}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">面试练习</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getPlatformText = (platform) => {
  const texts = {
    'boss': 'BOSS直聘',
    'zhilian': '智联招聘',
    '51job': '前程无忧'
  };
  return texts[platform] || platform;
};

export default DashboardPage;