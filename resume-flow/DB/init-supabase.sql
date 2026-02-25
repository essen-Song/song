-- ResumeFlow 数据库初始化脚本
-- 创建用户简历表
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  education TEXT,
  work_experience JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  skills TEXT[] DEFAULT '{}',
  file_url TEXT,
  file_name TEXT,
  parsed_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建投递记录表
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'boss', 'zhilian', '51job'
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'viewed', 'rejected', 'interview'
  resume_data JSONB DEFAULT '{}'::jsonb,
  delivery_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建面试日志表
CREATE TABLE IF NOT EXISTS interview_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answer_audio_url TEXT,
  feedback TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  star_analysis JSONB DEFAULT '{}'::jsonb, -- STAR模型分析
  keywords_matched TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建简历优化记录表
CREATE TABLE IF NOT EXISTS resume_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  original_text TEXT NOT NULL,
  optimized_versions JSONB DEFAULT '{}'::jsonb, -- 存储三个版本
  missing_keywords TEXT[] DEFAULT '{}',
  optimization_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  preferred_platforms TEXT[] DEFAULT '{"boss", "zhilian", "51job"}',
  auto_delivery BOOLEAN DEFAULT false,
  interview_mode TEXT DEFAULT 'text', -- 'text', 'voice', 'mixed'
  notification_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_platform ON applications(platform);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_interview_logs_user_id ON interview_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_optimizations_user_id ON resume_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_resumes_updated_at 
  BEFORE UPDATE ON resumes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 插入测试数据
INSERT INTO resumes (user_id, name, email, education, skills, work_experience, projects) VALUES 
('test_user_1', '张三', 'zhangsan@example.com', '北京大学 计算机科学与技术 2020-2024', 
 ARRAY['Python', 'JavaScript', 'React', 'Node.js'], 
 '[{"company": "腾讯", "role": "前端实习生", "duration": "2023.06-2023.09", "description": "负责小程序页面开发，提升用户体验"}]'::jsonb,
 '[{"title": "智能简历系统", "role": "全栈开发", "tech": "React, Node.js, PostgreSQL", "result": "帮助1000+用户优化简历"}]'::jsonb
);

-- 创建存储过程：获取用户完整档案
CREATE OR REPLACE FUNCTION get_user_profile(user_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', user_id_param,
    'resumes', COALESCE(jsonb_agg(resumes.*), '[]'::jsonb),
    'applications', COALESCE(jsonb_agg(applications.*), '[]'::jsonb),
    'interview_logs', COALESCE(jsonb_agg(interview_logs.*), '[]'::jsonb),
    'settings', (SELECT to_jsonb(user_settings.*) FROM user_settings WHERE user_settings.user_id = user_id_param)
  ) INTO result
  FROM resumes
  LEFT JOIN applications ON resumes.user_id = applications.user_id
  LEFT JOIN interview_logs ON resumes.user_id = interview_logs.user_id
  WHERE resumes.user_id = user_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 授权（根据实际Supabase设置调整）
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;