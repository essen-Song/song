-- 智聘AI数据库架构
-- 简历信息结构化存储系统

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user', -- user/admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    status VARCHAR(20) DEFAULT 'active'
);

-- 简历主表
CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    file_type VARCHAR(50),
    original_content TEXT,
    parsed_content TEXT,
    parse_quality INTEGER DEFAULT 0,
    parse_status VARCHAR(20) DEFAULT 'pending', -- pending/success/failed
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 个人信息表
CREATE TABLE IF NOT EXISTS personal_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    birth_date DATE,
    gender VARCHAR(10),
    marital_status VARCHAR(20),
    expected_position VARCHAR(100), -- 期望岗位
    expected_salary VARCHAR(50),
    work_location VARCHAR(100),
    self_introduction TEXT,
    confidence_score INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 教育经历表
CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    degree VARCHAR(100), -- 学位
    major VARCHAR(100), -- 专业
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    gpa DECIMAL(3,2),
    description TEXT,
    location VARCHAR(100),
    education_level VARCHAR(50), -- 学历层次
    ranking VARCHAR(50), -- 学校排名
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 工作经历表
CREATE TABLE IF NOT EXISTS work_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    salary VARCHAR(50),
    work_location VARCHAR(100),
    industry VARCHAR(100), -- 行业
    company_size VARCHAR(50), -- 公司规模
    responsibilities TEXT,
    achievements TEXT,
    skills_used TEXT,
    supervisor VARCHAR(100),
    reason_for_leaving TEXT,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 技能表
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50), -- programming/language/tool/soft
    proficiency_level VARCHAR(20), -- beginner/intermediate/advanced/expert
    years_of_experience INTEGER,
    last_used DATE,
    description TEXT,
    certification VARCHAR(100),
    confidence_score INTEGER DEFAULT 0,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 项目经验表
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    role VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    technologies TEXT,
    responsibilities TEXT,
    achievements TEXT,
    project_url VARCHAR(500),
    team_size INTEGER,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 证书表
CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    certificate_name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(100),
    credential_url VARCHAR(500),
    description TEXT,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 语言能力表
CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    language_name VARCHAR(50) NOT NULL,
    proficiency VARCHAR(20), -- basic/conversational/fluent/native
    reading_level VARCHAR(20),
    writing_level VARCHAR(20),
    speaking_level VARCHAR(20),
    certification VARCHAR(100),
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 投递记录表
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    job_title VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    job_location VARCHAR(100),
    salary_range VARCHAR(50),
    application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    application_status VARCHAR(20) DEFAULT 'applied', -- applied/interview/offered/rejected
    interview_date DATETIME,
    offer_date DATETIME,
    notes TEXT,
    job_description TEXT,
    application_url VARCHAR(500),
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_upload_date ON resumes(upload_date);
CREATE INDEX IF NOT EXISTS idx_personal_info_resume_id ON personal_info(resume_id);
CREATE INDEX IF NOT EXISTS idx_education_resume_id ON education(resume_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_resume_id ON work_experience(resume_id);
CREATE INDEX IF NOT EXISTS idx_skills_resume_id ON skills(resume_id);
CREATE INDEX IF NOT EXISTS idx_applications_resume_id ON applications(resume_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);

-- 插入默认管理员用户
INSERT OR IGNORE INTO users (email, password_hash, full_name, role) 
VALUES ('admin@zhipinai.com', '$2b$10$defaultpasswordhash', '系统管理员', 'admin');

-- 创建视图用于常用查询
CREATE VIEW IF NOT EXISTS resume_summary AS
SELECT 
    r.id,
    r.file_name,
    u.email,
    p.full_name,
    p.expected_position,
    r.parse_quality,
    r.upload_date,
    (SELECT COUNT(*) FROM education e WHERE e.resume_id = r.id) as education_count,
    (SELECT COUNT(*) FROM work_experience w WHERE w.resume_id = r.id) as work_count,
    (SELECT COUNT(*) FROM skills s WHERE s.resume_id = r.id) as skill_count
FROM resumes r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN personal_info p ON p.resume_id = r.id;