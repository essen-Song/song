const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'resume_ai.db');
        this.init();
    }

    // 初始化数据库
    async init() {
        try {
            // 确保数据库目录存在
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // 创建数据库连接
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ 数据库连接失败:', err.message);
                    return;
                }
                console.log('✅ 数据库连接成功');
                
                // 初始化表结构
                this.createTables();
            });

            // 启用外键约束
            this.db.run('PRAGMA foreign_keys = ON');
            
        } catch (error) {
            console.error('❌ 数据库初始化失败:', error);
        }
    }

    // 创建数据表
    async createTables() {
        return new Promise((resolve, reject) => {
            const schemaPath = path.join(__dirname, 'schema.sql');
            
            if (!fs.existsSync(schemaPath)) {
                console.error('❌ 数据库架构文件不存在');
                reject(new Error('数据库架构文件不存在'));
                return;
            }

            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('❌ 创建数据表失败:', err);
                    reject(err);
                } else {
                    console.log('✅ 数据表创建成功');
                    resolve();
                }
            });
        });
    }

    // 执行查询
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ 查询失败:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 执行单条SQL语句
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ 执行SQL失败:', err);
                    reject(err);
                } else {
                    resolve({ 
                        id: this.lastID, 
                        changes: this.changes 
                    });
                }
            });
        });
    }

    // 获取单条记录
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ 获取记录失败:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 开始事务
    async beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    // 提交事务
    async commit() {
        return this.run('COMMIT');
    }

    // 回滚事务
    async rollback() {
        return this.run('ROLLBACK');
    }

    // 关闭数据库连接
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ 关闭数据库失败:', err);
                        reject(err);
                    } else {
                        console.log('✅ 数据库连接已关闭');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // 备份数据库
    async backup(backupPath) {
        return new Promise((resolve, reject) => {
            const backupDb = new sqlite3.Database(backupPath);
            this.db.backup(backupDb, (err) => {
                if (err) {
                    console.error('❌ 数据库备份失败:', err);
                    reject(err);
                } else {
                    console.log('✅ 数据库备份成功');
                    backupDb.close();
                    resolve();
                }
            });
        });
    }

    // 获取数据库统计信息
    async getStats() {
        const stats = await this.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as user_count,
                (SELECT COUNT(*) FROM resumes) as resume_count,
                (SELECT COUNT(*) FROM applications) as application_count,
                (SELECT COUNT(*) FROM education) as education_count,
                (SELECT COUNT(*) FROM work_experience) as work_count,
                (SELECT COUNT(*) FROM skills) as skill_count
        `);
        return stats[0];
    }
}

// 创建全局数据库实例
const database = new Database();

module.exports = database;