const database = require('../database/db');
const fs = require('fs');
const path = require('path');

class ResumeStorageService {
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
        let transaction = null;
        
        try {
            // 开始事务
            await database.beginTransaction();
            
            // 1. 插入简历主记录
            const resumeResult = await database.run(`
                INSERT INTO resumes (
                    user_id, file_name, file_path, file_size, file_type,
                    original_content, parsed_content, parse_quality, parse_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, fileInfo.fileName, fileInfo.filePath, fileInfo.fileSize, 
                fileInfo.fileType, parsedData.rawText || '', JSON.stringify(parsedData),
                parsedData.parseQuality?.score || 0, 'success'
            ]);

            const resumeId = resumeResult.id;

            // 2. 存储个人信息
            if (parsedData.name || parsedData.email || parsedData.phone) {
                await database.run(`
                    INSERT INTO personal_info (
                        resume_id, full_name, email, phone, expected_position
                    ) VALUES (?, ?, ?, ?, ?)
                `, [
                    resumeId, parsedData.name, parsedData.email, parsedData.phone,
                    parsedData.expectedPosition || '待确认'
                ]);
            }

            // 3. 存储教育经历
            if (Array.isArray(parsedData.education)) {
                for (const edu of parsedData.education) {
                    await database.run(`
                        INSERT INTO education (
                            resume_id, institution_name, degree, major, 
                            start_date, end_date, education_level
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        resumeId, edu.institution || edu.school, edu.degree,
                        edu.major, edu.startDate, edu.endDate, edu.level
                    ]);
                }
            }

            // 4. 存储工作经历
            if (Array.isArray(parsedData.workExperience)) {
                for (const work of parsedData.workExperience) {
                    await database.run(`
                        INSERT INTO work_experience (
                            resume_id, company_name, position, department,
                            start_date, end_date, responsibilities
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [
                        resumeId, work.company, work.position, work.department,
                        work.startDate, work.endDate, work.description
                    ]);
                }
            }

            // 5. 存储技能
            if (Array.isArray(parsedData.skills)) {
                for (const skill of parsedData.skills) {
                    await database.run(`
                        INSERT INTO skills (
                            resume_id, skill_name, skill_category, proficiency_level
                        ) VALUES (?, ?, ?, ?)
                    `, [
                        resumeId, skill.name, skill.category, skill.level
                    ]);
                }
            }

            // 提交事务
            await database.commit();

            console.log(`✅ 简历数据存储成功，简历ID: ${resumeId}`);
            return resumeId;

        } catch (error) {
            // 回滚事务
            if (transaction) {
                await database.rollback();
            }
            console.error('❌ 存储简历数据失败:', error);
            throw error;
        }
    }

    // 获取用户的所有简历
    async getUserResumes(userId) {
        try {
            const resumes = await database.query(`
                SELECT 
                    r.id, r.file_name, r.file_size, r.parse_quality, 
                    r.upload_date, r.parse_status,
                    p.full_name, p.expected_position,
                    (SELECT COUNT(*) FROM education e WHERE e.resume_id = r.id) as education_count,
                    (SELECT COUNT(*) FROM work_experience w WHERE w.resume_id = r.id) as work_count,
                    (SELECT COUNT(*) FROM skills s WHERE s.resume_id = r.id) as skill_count
                FROM resumes r
                LEFT JOIN personal_info p ON p.resume_id = r.id
                WHERE r.user_id = ?
                ORDER BY r.upload_date DESC
            `, [userId]);

            return resumes;
        } catch (error) {
            console.error('❌ 获取用户简历失败:', error);
            throw error;
        }
    }

    // 获取简历详细信息
    async getResumeDetails(resumeId) {
        try {
            const resume = await database.get(`
                SELECT * FROM resumes WHERE id = ?
            `, [resumeId]);

            if (!resume) {
                return null;
            }

            // 获取关联信息
            const [personalInfo, education, workExperience, skills, applications] = await Promise.all([
                database.query('SELECT * FROM personal_info WHERE resume_id = ?', [resumeId]),
                database.query('SELECT * FROM education WHERE resume_id = ? ORDER BY start_date DESC', [resumeId]),
                database.query('SELECT * FROM work_experience WHERE resume_id = ? ORDER BY start_date DESC', [resumeId]),
                database.query('SELECT * FROM skills WHERE resume_id = ?', [resumeId]),
                database.query('SELECT * FROM applications WHERE resume_id = ? ORDER BY application_date DESC', [resumeId])
            ]);

            return {
                ...resume,
                personalInfo: personalInfo[0] || {},
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
            const setClause = [];
            const values = [];

            for (const [field, value] of Object.entries(updates)) {
                if (allowedFields.includes(field)) {
                    setClause.push(`${field} = ?`);
                    values.push(value);
                }
            }

            if (setClause.length === 0) {
                throw new Error('没有有效的更新字段');
            }

            setClause.push('last_modified = CURRENT_TIMESTAMP');
            values.push(resumeId);

            const result = await database.run(`
                UPDATE resumes SET ${setClause.join(', ')} WHERE id = ?
            `, values);

            return result;
        } catch (error) {
            console.error('❌ 更新简历失败:', error);
            throw error;
        }
    }

    // 删除简历
    async deleteResume(resumeId) {
        try {
            // 先获取文件路径
            const resume = await database.get('SELECT file_path FROM resumes WHERE id = ?', [resumeId]);
            
            if (resume && resume.file_path) {
                // 删除文件
                try {
                    fs.unlinkSync(resume.file_path);
                } catch (fileError) {
                    console.warn('⚠️ 删除文件失败:', fileError.message);
                }
            }

            // 删除数据库记录（外键约束会自动删除关联记录）
            const result = await database.run('DELETE FROM resumes WHERE id = ?', [resumeId]);
            
            return result;
        } catch (error) {
            console.error('❌ 删除简历失败:', error);
            throw error;
        }
    }

    // 搜索简历
    async searchResumes(userId, searchCriteria) {
        try {
            let whereClause = 'r.user_id = ?';
            const params = [userId];

            if (searchCriteria.keyword) {
                whereClause += ` AND (
                    p.full_name LIKE ? OR 
                    p.expected_position LIKE ? OR
                    e.institution_name LIKE ? OR
                    w.company_name LIKE ? OR
                    s.skill_name LIKE ?
                )`;
                const keyword = `%${searchCriteria.keyword}%`;
                params.push(keyword, keyword, keyword, keyword, keyword);
            }

            if (searchCriteria.position) {
                whereClause += ' AND p.expected_position LIKE ?';
                params.push(`%${searchCriteria.position}%`);
            }

            const resumes = await database.query(`
                SELECT DISTINCT
                    r.id, r.file_name, r.parse_quality, r.upload_date,
                    p.full_name, p.expected_position
                FROM resumes r
                LEFT JOIN personal_info p ON p.resume_id = r.id
                LEFT JOIN education e ON e.resume_id = r.id
                LEFT JOIN work_experience w ON w.resume_id = r.id
                LEFT JOIN skills s ON s.resume_id = r.id
                WHERE ${whereClause}
                ORDER BY r.upload_date DESC
            `, params);

            return resumes;
        } catch (error) {
            console.error('❌ 搜索简历失败:', error);
            throw error;
        }
    }

    // 获取统计数据
    async getResumeStats(userId) {
        try {
            const stats = await database.query(`
                SELECT 
                    COUNT(*) as total_resumes,
                    AVG(parse_quality) as avg_quality,
                    MAX(parse_quality) as best_quality,
                    MIN(upload_date) as first_upload,
                    MAX(upload_date) as last_upload
                FROM resumes 
                WHERE user_id = ?
            `, [userId]);

            return stats[0];
        } catch (error) {
            console.error('❌ 获取统计数据失败:', error);
            throw error;
        }
    }
}

module.exports = new ResumeStorageService();