const database = require('../database/jsonDatabase');
const fs = require('fs');
const path = require('path');

class JsonResumeStorageService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads');
        this.ensureUploadsDir();
    }

    // 确保上传目录存在
    ensureUploadsDir() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    // 保存简历文件
    async saveResumeFile(userId, fileName, fileContent, fileType) {
        try {
            // 生成唯一文件名
            const fileExt = path.extname(fileName) || this.getFileExtension(fileType);
            const uniqueFileName = `${Date.now()}_${userId}_${path.basename(fileName, fileExt)}${fileExt}`;
            const filePath = path.join(this.uploadsDir, uniqueFileName);

            // 保存文件到磁盘
            const buffer = Buffer.from(fileContent, 'base64');
            fs.writeFileSync(filePath, buffer);

            return {
                fileName: uniqueFileName,
                filePath: filePath,
                fileSize: buffer.length
            };
        } catch (error) {
            console.error('❌ 保存简历文件失败:', error);
            throw error;
        }
    }

    // 根据文件类型获取扩展名
    getFileExtension(fileType) {
        const extensions = {
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
        };
        return extensions[fileType] || '.txt';
    }

    // 存储简历信息到数据库
    async storeResumeData(userId, fileInfo, parsedData) {
        try {
            // 1. 插入简历主记录
            const resumeId = database.insert('resumes', {
                user_id: userId,
                file_name: fileInfo.fileName,
                file_path: fileInfo.filePath,
                file_size: fileInfo.fileSize,
                file_type: fileInfo.fileType,
                original_content: parsedData.rawText || '',
                parsed_content: JSON.stringify(parsedData),
                parse_quality: parsedData.parseQuality?.score || 0,
                parse_status: 'success'
            });

            // 2. 存储个人信息
            if (parsedData.name || parsedData.email || parsedData.phone) {
                database.insert('personal_info', {
                    resume_id: resumeId,
                    full_name: parsedData.name,
                    email: parsedData.email,
                    phone: parsedData.phone,
                    expected_position: parsedData.expectedPosition || '待确认'
                });
            }

            // 3. 存储教育经历
            if (Array.isArray(parsedData.education)) {
                for (const edu of parsedData.education) {
                    database.insert('education', {
                        resume_id: resumeId,
                        institution_name: edu.institution || edu.school,
                        degree: edu.degree,
                        major: edu.major,
                        start_date: edu.startDate,
                        end_date: edu.endDate,
                        education_level: edu.level
                    });
                }
            }

            // 4. 存储工作经历
            if (Array.isArray(parsedData.workExperience)) {
                for (const work of parsedData.workExperience) {
                    database.insert('work_experience', {
                        resume_id: resumeId,
                        company_name: work.company,
                        position: work.position,
                        department: work.department,
                        start_date: work.startDate,
                        end_date: work.endDate,
                        responsibilities: work.description
                    });
                }
            }

            // 5. 存储技能
            if (Array.isArray(parsedData.skills)) {
                for (const skill of parsedData.skills) {
                    database.insert('skills', {
                        resume_id: resumeId,
                        skill_name: skill.name,
                        skill_category: skill.category,
                        proficiency_level: skill.level
                    });
                }
            }

            console.log(`✅ 简历数据存储成功，简历ID: ${resumeId}`);
            return resumeId;

        } catch (error) {
            console.error('❌ 存储简历数据失败:', error);
            throw error;
        }
    }

    // 获取用户的所有简历
    async getUserResumes(userId) {
        try {
            const resumes = database.select('resumes', { user_id: userId });
            
            return resumes.map(resume => {
                const personalInfo = database.select('personal_info', { resume_id: resume.id })[0] || {};
                const educationCount = database.select('education', { resume_id: resume.id }).length;
                const workCount = database.select('work_experience', { resume_id: resume.id }).length;
                const skillCount = database.select('skills', { resume_id: resume.id }).length;

                return {
                    id: resume.id,
                    file_name: resume.file_name,
                    file_size: resume.file_size,
                    parse_quality: resume.parse_quality,
                    upload_date: resume.created_at,
                    parse_status: resume.parse_status,
                    full_name: personalInfo.full_name,
                    expected_position: personalInfo.expected_position,
                    education_count: educationCount,
                    work_count: workCount,
                    skill_count: skillCount
                };
            }).sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));

        } catch (error) {
            console.error('❌ 获取用户简历失败:', error);
            throw error;
        }
    }

    // 获取简历详细信息
    async getResumeDetails(resumeId) {
        try {
            const resume = database.get('resumes', resumeId);

            if (!resume) {
                return null;
            }

            // 获取关联信息
            const personalInfo = database.select('personal_info', { resume_id: resumeId })[0] || {};
            const education = database.select('education', { resume_id: resumeId });
            const workExperience = database.select('work_experience', { resume_id: resumeId });
            const skills = database.select('skills', { resume_id: resumeId });
            const applications = database.select('applications', { resume_id: resumeId });

            return {
                ...resume,
                personalInfo: personalInfo,
                education: education,
                workExperience: workExperience,
                skills: skills,
                applications: applications
            };

        } catch (error) {
            console.error('❌ 获取简历详情失败:', error);
            throw error;
        }
    }

    // 更新简历信息
    async updateResume(resumeId, updates) {
        try {
            const allowedFields = ['expected_position', 'parse_quality', 'parse_status'];
            const validUpdates = {};

            for (const [field, value] of Object.entries(updates)) {
                if (allowedFields.includes(field)) {
                    validUpdates[field] = value;
                }
            }

            if (Object.keys(validUpdates).length === 0) {
                throw new Error('没有有效的更新字段');
            }

            return database.update('resumes', resumeId, validUpdates);
        } catch (error) {
            console.error('❌ 更新简历失败:', error);
            throw error;
        }
    }

    // 删除简历
    async deleteResume(resumeId) {
        try {
            // 先获取文件路径
            const resume = database.get('resumes', resumeId);
            
            if (resume && resume.file_path) {
                // 删除文件
                try {
                    fs.unlinkSync(resume.file_path);
                } catch (fileError) {
                    console.warn('⚠️ 删除文件失败:', fileError.message);
                }
            }

            // 删除关联记录
            const tables = ['personal_info', 'education', 'work_experience', 'skills', 'applications'];
            for (const table of tables) {
                const records = database.select(table, { resume_id: resumeId });
                for (const record of records) {
                    database.delete(table, record.id);
                }
            }

            // 删除主记录
            return database.delete('resumes', resumeId);
        } catch (error) {
            console.error('❌ 删除简历失败:', error);
            throw error;
        }
    }

    // 搜索简历
    async searchResumes(userId, searchCriteria) {
        try {
            const userResumes = database.select('resumes', { user_id: userId });
            const results = [];

            for (const resume of userResumes) {
                const personalInfo = database.select('personal_info', { resume_id: resume.id })[0] || {};
                
                let match = true;

                if (searchCriteria.keyword) {
                    const keyword = searchCriteria.keyword.toLowerCase();
                    const fieldsToSearch = [
                        personalInfo.full_name,
                        personalInfo.expected_position,
                        resume.file_name
                    ];
                    
                    match = fieldsToSearch.some(field => 
                        field && field.toLowerCase().includes(keyword)
                    );
                }

                if (match && searchCriteria.position) {
                    const position = searchCriteria.position.toLowerCase();
                    match = personalInfo.expected_position && 
                           personalInfo.expected_position.toLowerCase().includes(position);
                }

                if (match) {
                    results.push({
                        id: resume.id,
                        file_name: resume.file_name,
                        parse_quality: resume.parse_quality,
                        upload_date: resume.created_at,
                        full_name: personalInfo.full_name,
                        expected_position: personalInfo.expected_position
                    });
                }
            }

            return results.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
        } catch (error) {
            console.error('❌ 搜索简历失败:', error);
            throw error;
        }
    }

    // 获取统计数据
    async getResumeStats(userId) {
        try {
            const userResumes = database.select('resumes', { user_id: userId });
            
            if (userResumes.length === 0) {
                return {
                    total_resumes: 0,
                    avg_quality: 0,
                    best_quality: 0,
                    first_upload: null,
                    last_upload: null
                };
            }

            const qualities = userResumes.map(r => r.parse_quality).filter(q => q > 0);
            const uploadDates = userResumes.map(r => new Date(r.created_at));

            return {
                total_resumes: userResumes.length,
                avg_quality: qualities.length > 0 ? 
                    Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length) : 0,
                best_quality: qualities.length > 0 ? Math.max(...qualities) : 0,
                first_upload: new Date(Math.min(...uploadDates)).toISOString(),
                last_upload: new Date(Math.max(...uploadDates)).toISOString()
            };
        } catch (error) {
            console.error('❌ 获取统计数据失败:', error);
            throw error;
        }
    }

    // 获取数据库统计
    async getDatabaseStats() {
        return database.getStats();
    }
}

module.exports = new JsonResumeStorageService();