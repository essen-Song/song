// 使用knex和sqlite3替代better-sqlite3
const path = require('path');
const knex = require('knex');
const sqlite3 = require('sqlite3');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/app.db');
        this.db = null;
        this.init();
    }

    init() {
        try {
            // 创建数据目录
            const fs = require('fs');
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // 初始化knex连接
            this.db = knex({
                client: 'sqlite3',
                connection: {
                    filename: this.dbPath
                },
                useNullAsDefault: true
            });

            this.createTables();
            console.log('✅ SQLite 数据库初始化成功');
        } catch (error) {
            console.error('❌ SQLite 数据库初始化失败:', error);
        }
    }

    async createTables() {
        try {
            // 创建用户表
            await this.db.schema.hasTable('users').then(exists => {
                if (!exists) {
                    return this.db.schema.createTable('users', table => {
                        table.increments('id').primary();
                        table.string('email').unique().notNullable();
                        table.string('name');
                        table.datetime('created_at').defaultTo(this.db.fn.now());
                    });
                }
            });

            // 创建简历表
            await this.db.schema.hasTable('resumes').then(exists => {
                if (!exists) {
                    return this.db.schema.createTable('resumes', table => {
                        table.increments('id').primary();
                        table.integer('user_id');
                        table.string('filename').notNullable();
                        table.text('content');
                        table.text('parsed_data');
                        table.datetime('created_at').defaultTo(this.db.fn.now());
                        table.foreign('user_id').references('id').inTable('users');
                    });
                }
            });

            // 创建API使用记录表
            await this.db.schema.hasTable('api_usage').then(exists => {
                if (!exists) {
                    return this.db.schema.createTable('api_usage', table => {
                        table.increments('id').primary();
                        table.string('model_name').notNullable();
                        table.string('model_type');
                        table.string('cost');
                        table.text('usage_data');
                        table.boolean('success');
                        table.datetime('created_at').defaultTo(this.db.fn.now());
                    });
                }
            });

            // 创建求职申请表
            await this.db.schema.hasTable('job_applications').then(exists => {
                if (!exists) {
                    return this.db.schema.createTable('job_applications', table => {
                        table.increments('id').primary();
                        table.integer('user_id');
                        table.integer('resume_id');
                        table.string('company');
                        table.string('position');
                        table.string('status').defaultTo('pending');
                        table.datetime('created_at').defaultTo(this.db.fn.now());
                        table.foreign('user_id').references('id').inTable('users');
                        table.foreign('resume_id').references('id').inTable('resumes');
                    });
                }
            });

            console.log('✅ 数据表创建完成');
        } catch (error) {
            console.error('❌ 创建表失败:', error);
        }
    }

    async saveUser(email, name = '') {
        try {
            // 检查用户是否已存在
            const existingUser = await this.db('users').where({ email }).first();
            if (existingUser) {
                return existingUser.id;
            }

            // 创建新用户
            const [userId] = await this.db('users').insert({ email, name });
            return userId;
        } catch (error) {
            console.error('❌ 保存用户失败:', error);
            return null;
        }
    }

    async getUserId(email) {
        try {
            const user = await this.db('users').where({ email }).first();
            return user ? user.id : null;
        } catch (error) {
            console.error('❌ 获取用户ID失败:', error);
            return null;
        }
    }

    async saveResume(userId, filename, content, parsedData) {
        try {
            const [resumeId] = await this.db('resumes').insert({
                user_id: userId,
                filename,
                content,
                parsed_data: JSON.stringify(parsedData)
            });
            return resumeId;
        } catch (error) {
            console.error('❌ 保存简历失败:', error);
            return null;
        }
    }

    async getResumes(userId) {
        try {
            const resumes = await this.db('resumes')
                .where({ user_id: userId })
                .orderBy('created_at', 'desc')
                .select('id', 'filename', 'created_at', 'parsed_data');

            return resumes.map(resume => ({
                ...resume,
                parsed_data: JSON.parse(resume.parsed_data || '{}')
            }));
        } catch (error) {
            console.error('❌ 获取简历列表失败:', error);
            return [];
        }
    }

    async saveApiUsage(modelName, modelType, cost, usageData, success) {
        try {
            await this.db('api_usage').insert({
                model_name: modelName,
                model_type: modelType,
                cost,
                usage_data: JSON.stringify(usageData),
                success
            });
        } catch (error) {
            console.error('❌ 保存API使用记录失败:', error);
        }
    }

    async getApiUsage(limit = 100) {
        try {
            const usage = await this.db('api_usage')
                .orderBy('created_at', 'desc')
                .limit(limit);

            return usage.map(record => ({
                ...record,
                usage_data: JSON.parse(record.usage_data || '{}')
            }));
        } catch (error) {
            console.error('❌ 获取API使用记录失败:', error);
            return [];
        }
    }

    async saveJobApplication(userId, resumeId, company, position, status = 'pending') {
        try {
            const [applicationId] = await this.db('job_applications').insert({
                user_id: userId,
                resume_id: resumeId,
                company,
                position,
                status
            });
            return applicationId;
        } catch (error) {
            console.error('❌ 保存求职申请失败:', error);
            return null;
        }
    }

    async getJobApplications(userId) {
        try {
            return await this.db('job_applications')
                .where({ user_id: userId })
                .leftJoin('resumes', 'job_applications.resume_id', 'resumes.id')
                .select('job_applications.*', 'resumes.filename')
                .orderBy('job_applications.created_at', 'desc');
        } catch (error) {
            console.error('❌ 获取求职申请列表失败:', error);
            return [];
        }
    }

    async close() {
        if (this.db) {
            await this.db.destroy();
            console.log('🔒 SQLite 数据库连接已关闭');
        }
    }
}

module.exports = new DatabaseService();