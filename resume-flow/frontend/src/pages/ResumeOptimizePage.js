import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, Edit3, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ResumeOptimizePage = ({ user }) => {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedVersion, setCopiedVersion] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserResumes();
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

  const handleOptimize = async () => {
    if (!selectedResume || !jobDescription.trim()) {
      toast.error('请选择简历并输入岗位JD');
      return;
    }

    setLoading(true);
    setOptimizationResult(null);

    try {
      const response = await axios.post('/api/optimize/resume', {
        userId: user.id,
        resumeId: selectedResume.id,
        originalText: selectedResume.parsed_data?.rawText || '请基于简历内容生成优化版本',
        jobDescription: jobDescription,
        type: 'self_evaluation'
      });

      if (response.data.success) {
        setOptimizationResult(response.data.data.optimizationResult);
        toast.success('简历优化完成！');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('优化失败:', error);
      toast.error(error.message || '简历优化失败');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, version) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVersion(version);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopiedVersion(null), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const downloadOptimizedResume = () => {
    if (!optimizationResult) return;

    const content = `
优化后的简历内容
================

【精简版】
${optimizationResult.versions.concise}

【专业版】
${optimizationResult.versions.professional}

【高匹配版】
${optimizationResult.versions.optimized}

【缺失关键词】
${optimizationResult.missingKeywords.join(', ')}

【优化理由】
${optimizationResult.optimizationReason}

【关键词匹配率】
${optimizationResult.keywordMatchRate}%
    `;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `优化简历_${selectedResume.name || '未命名'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI简历优化
          </h1>
          <p className="text-xl text-gray-600">
            基于目标岗位JD，AI智能优化简历内容，提升通过率
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左侧：简历选择和JD输入 */}
          <div className="space-y-6">
            {/* 简历选择 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                选择要优化的简历
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
                          ? 'border-blue-500 bg-blue-50'
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(resume.file_url, '_blank');
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 岗位JD输入 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                目标岗位JD
              </h3>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="请粘贴目标岗位的职位描述(JD)..."
                className="textarea-field h-40"
              />
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  建议包含：职位要求、技能要求、工作内容等
                </span>
                <button
                  onClick={handleOptimize}
                  disabled={!selectedResume || !jobDescription.trim() || loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      优化中...
                    </>
                  ) : (
                    <>
                      <Search size={16} className="mr-2" />
                      开始优化
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：优化结果 */}
          <div className="space-y-6">
            {loading && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">AI正在分析并优化您的简历...</p>
                </div>
              </div>
            )}

            {optimizationResult && (
              <div className="space-y-6">
                {/* 优化概览 */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      优化结果
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">匹配率:</span>
                      <span className="text-lg font-bold text-green-600">
                        {optimizationResult.keywordMatchRate}%
                      </span>
                    </div>
                  </div>

                  {optimizationResult.missingKeywords.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        缺失关键词
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {optimizationResult.missingKeywords.map((keyword, index) => (
                          <span key={index} className="tag tag-yellow">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      优化理由
                    </h4>
                    <p className="text-sm text-gray-600">
                      {optimizationResult.optimizationReason}
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={downloadOptimizedResume}
                      className="btn-secondary flex items-center"
                    >
                      <Download size={16} className="mr-2" />
                      下载优化版本
                    </button>
                  </div>
                </div>

                {/* 三个版本对比 */}
                {Object.entries(optimizationResult.versions).map(([version, content]) => {
                  const versionNames = {
                    concise: '精简版',
                    professional: '专业版',
                    optimized: '高匹配版'
                  };

                  return (
                    <div key={version} className="bg-white rounded-lg shadow-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {versionNames[version]}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(content, version)}
                          className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {copiedVersion === version ? (
                            <>
                              <Check size={16} />
                              <span>已复制</span>
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              <span>复制</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800 leading-relaxed">
                          {content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!optimizationResult && !loading && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    开始优化您的简历
                  </h3>
                  <p className="text-gray-600">
                    选择简历并输入目标岗位JD，AI将为您生成三个优化版本
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizePage;