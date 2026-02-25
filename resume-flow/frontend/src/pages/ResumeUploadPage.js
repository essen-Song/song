import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ResumeUploadPage = ({ user }) => {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('仅支持PDF和Word文档格式');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('userId', user.id);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await axios.post('/api/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        setParsing(true);
        setParsedData(response.data.data);
        toast.success('简历上传成功，正在解析...');
        
        // 模拟解析过程
        setTimeout(() => {
          setParsing(false);
          toast.success('简历解析完成！');
        }, 2000);
      } else {
        throw new Error(response.data.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error(error.message || '上传失败，请重试');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const renderParsedData = () => {
    if (!parsedData) return null;

    return (
      <div className="resume-preview fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">解析结果</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">准确率:</span>
            <span className="text-sm font-medium text-green-600">
              {parsedData.accuracy}%
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {parsedData.parsedData.name && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">姓名</h4>
              <p className="text-gray-800">{parsedData.parsedData.name}</p>
            </div>
          )}

          {parsedData.parsedData.email && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">邮箱</h4>
              <p className="text-gray-800">{parsedData.parsedData.email}</p>
            </div>
          )}

          {parsedData.parsedData.phone && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">电话</h4>
              <p className="text-gray-800">{parsedData.parsedData.phone}</p>
            </div>
          )}

          {parsedData.parsedData.skills && parsedData.parsedData.skills.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">技能</h4>
              <div className="flex flex-wrap gap-2">
                {parsedData.parsedData.skills.map((skill, index) => (
                  <span key={index} className="tag tag-blue">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsedData.parsedData.education && parsedData.parsedData.education.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">教育背景</h4>
              <div className="space-y-2">
                {parsedData.parsedData.education.map((edu, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {edu.school} {edu.major} {edu.degree}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => window.location.href = '/resume/optimize'}
            className="btn-primary"
          >
            优化这份简历
          </button>
          <button
            onClick={() => setParsedData(null)}
            className="btn-secondary"
          >
            重新上传
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            智能简历上传
          </h1>
          <p className="text-xl text-gray-600">
            上传您的简历，AI将自动解析并提取关键信息
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div
            {...getRootProps()}
            className={`upload-area ${isDragActive ? 'dragover' : ''} ${uploading ? 'opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive ? '释放文件以上传' : '拖拽简历文件到此处'}
            </p>
            <p className="text-gray-500 mb-4">
              或者点击选择文件
            </p>
            <p className="text-sm text-gray-400">
              支持 PDF、Word 格式，文件大小不超过 5MB
            </p>
          </div>

          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">上传进度</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {parsing && (
            <div className="mt-6 flex items-center justify-center">
              <Loader className="w-6 h-6 text-blue-600 animate-spin mr-2" />
              <span className="text-gray-600">正在解析简历...</span>
            </div>
          )}
        </div>

        {renderParsedData()}

        {/* 功能说明 */}
        {!parsedData && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                智能解析
              </h3>
              <p className="text-gray-600">
                自动识别简历中的姓名、联系方式、教育背景、工作经历等关键信息
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                高准确率
              </h3>
              <p className="text-gray-600">
                采用先进的AI技术，简历解析准确率达到90%以上
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                隐私保护
              </h3>
              <p className="text-gray-600">
                严格保护用户隐私，简历数据加密存储，仅用于求职服务
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadPage;