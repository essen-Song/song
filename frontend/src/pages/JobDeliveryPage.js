import React, { useState, useEffect } from 'react';
import { Send, Search, Settings, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const JobDeliveryPage = ({ user }) => {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [jobFilters, setJobFilters] = useState({
    keywords: '',
    location: '',
    salary: '',
    experience: '',
    maxApplications: 5,
    minMatchScore: 60
  });
  const [platforms, setPlatforms] = useState(['boss', 'zhilian', '51job']);
  const [deliveryResults, setDeliveryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deliveryHistory, setDeliveryHistory] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserResumes();
      fetchDeliveryHistory();
      fetchPlatforms();
    }
  }, [user]);

  const fetchUserResumes = async () => {
    try {
      const response = await axios.get(`/api/resume/user/${user.id}`);
      if (response.data.success) {
        setResumes(response.data.data);
      }
    } catch (error) {
      console.error('获取简历列表失败:', error);
      toast.error('获取简历列表失败');
    }
  };

  const fetchDeliveryHistory = async () => {
    try {
      const response = await axios.get(`/api/deliver/history/${user.id}?limit=10`);
      if (response.data.success) {
        setDeliveryHistory(response.data.data);
      }
    } catch (error) {
      console.error('获取投递历史失败:', error);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await axios.get('/api/deliver/platforms');
      if (response.data.success) {
        setPlatforms(response.data.data);
      }
    } catch (error) {
      console.error('获取平台信息失败:', error);
    }
  };

  const handlePlatformChange = (platformKey) => {
    setPlatforms(prev => 
      prev.includes(platformKey)
        ? prev.filter(p => p !== platformKey)
        : [...prev, platformKey]
    );
  };

  const handleAutoDeliver = async () => {
    if (!selectedResume || !jobFilters.keywords.trim()) {
      toast.error('请选择简历并输入职位关键词');
      return;
    }

    setLoading(true);
    setDeliveryResults(null);

    try {
      const response = await axios.post('/api/deliver/auto', {
        userId: user.id,
        resumeId: selectedResume.id,
        jobFilters: jobFilters,
        platforms: platforms,
        userCredentials: {} // 这里可以添加用户凭据
      });

      if (response.data.success) {
        setDeliveryResults(response.data.data);
        toast.success(`投递完成！成功${response.data.data.stats.success}个职位`);
        fetchDeliveryHistory(); // 刷新历史记录
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('自动投递失败:', error);
      toast.error(error.message || '自动投递失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'sent': { text: '已投递', className: 'status-success' },
      'viewed': { text: '已查看', className: 'status-info' },
      'interview': { text: '面试邀请', className: 'status-success' },
      'rejected': { text: '已拒绝', className: 'status-error' },
      'pending': { text: '待处理', className: 'status-pending' },
      'failed': { text: '投递失败', className: 'status-error' }
    };
    return statusMap[status] || { text: status, className: 'status-pending' };
  };

  const getPlatformName = (platformKey) => {
    const platformNames = {
      'boss': 'BOSS直聘',
      'zhilian': '智联招聘',
      '51job': '前程无忧'
    };
    return platformNames[platformKey] || platformKey;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            智能职位投递
          </h1>
          <p className="text-xl text-gray-600">
            AI自动投递简历到多个招聘平台，提升求职效率
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：投递配置 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 简历选择 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                选择要投递的简历
              </h3>
              
              {resumes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">暂无简历，请先上传简历</p>
                  <button
                    onClick={() => window.location.href = '/resume/upload'}
                    className="btn-primary"
                  >
                    上传简历
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedResume?.id === resume.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedResume(resume)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {resume.name || '未命名简历'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {resume.file_name} • {new Date(resume.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedResume?.id === resume.id && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 职位筛选条件 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                职位筛选条件
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职位关键词 *
                  </label>
                  <input
                    type="text"
                    value={jobFilters.keywords}
                    onChange={(e) => setJobFilters(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="如：前端开发、产品经理"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    工作地点
                  </label>
                  <input
                    type="text"
                    value={jobFilters.location}
                    onChange={(e) => setJobFilters(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="如：北京、上海、深圳"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    期望薪资
                  </label>
                  <input
                    type="text"
                    value={jobFilters.salary}
                    onChange={(e) => setJobFilters(prev => ({ ...prev, salary: e.target.value }))}
                    placeholder="如：15-25K"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    工作经验
                  </label>
                  <select
                    value={jobFilters.experience}
                    onChange={(e) => setJobFilters(prev => ({ ...prev, experience: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">不限</option>
                    <option value="0-1年">0-1年</option>
                    <option value="1-3年">1-3年</option>
                    <option value="3-5年">3-5年</option>
                    <option value="5-10年">5-10年</option>
                    <option value="10年以上">10年以上</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大投递数量
                  </label>
                  <input
                    type="number"
                    value={jobFilters.maxApplications}
                    onChange={(e) => setJobFilters(prev => ({ ...prev, maxApplications: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="20"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最低匹配度
                  </label>
                  <input
                    type="number"
                    value={jobFilters.minMatchScore}
                    onChange={(e) => setJobFilters(prev => ({ ...prev, minMatchScore: parseInt(e.target.value) || 60 }))}
                    min="0"
                    max="100"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* 平台选择 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                选择投递平台
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <div
                    key={platform.key}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      platforms.includes(platform.key)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePlatformChange(platform.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {platform.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {platform.description}
                        </p>
                      </div>
                      {platforms.includes(platform.key) && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 开始投递按钮 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <button
                onClick={handleAutoDeliver}
                disabled={!selectedResume || loading || platforms.length === 0}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    投递中...
                  </>
                ) : (
                  <>
                    <Send size={20} className="mr-2" />
                    开始智能投递
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧：投递结果和历史 */}
          <div className="space-y-6">
            {/* 投递结果 */}
            {deliveryResults && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  投递结果
                </h3>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">成功率</span>
                    <span className="text-lg font-bold text-green-600">
                      {deliveryResults.stats.successRate}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-green-500" 
                      style={{ width: `${deliveryResults.stats.successRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(deliveryResults.results).map(([platform, result]) => (
                    <div key={platform} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {getPlatformName(platform)}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.success ? 'status-success' : 'status-error'
                        }`}>
                          {result.success ? '成功' : '失败'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {result.message}
                      </p>
                      {result.details && (
                        <div className="mt-2 text-xs text-gray-500">
                          成功: {result.details.successCount} | 失败: {result.details.failCount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 投递历史 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  最近投递记录
                </h3>
                <button
                  onClick={fetchDeliveryHistory}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <Settings size={16} className="mr-1" />
                  刷新
                </button>
              </div>
              
              {deliveryHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">暂无投递记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryHistory.map((record) => (
                    <div key={record.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {record.job_title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusDisplay(record.status).className}`}>
                          {getStatusDisplay(record.status).text}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{record.company_name}</span>
                        <span>{getPlatformName(record.platform)}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(record.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDeliveryPage;