const fs = require('fs');
const path = require('path');

class JsonDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, 'resume_data.json');
        this.data = this.loadData();
    }

    // 加载数据
    loadData() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const content = fs.readFileSync(this.dbPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('❌ 加载数据库失败:', error);
        }
        
        // 初始化数据结构
        return {
            users: {},
            resumes: {},
            personal_info: {},
            education: {},
            work_experience: {},
            skills: {},
            applications: {},
            nextId: {
                users: 1,
                resumes: 1,
                personal_info: 1,
                education: 1,
                work_experience: 1,
                skills: 1,
                applications: 1
            }
        };
    }

    // 保存数据
    saveData() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('❌ 保存数据库失败:', error);
            return false;
        }
    }

    // 生成唯一ID
    generateId(table) {
        const id = this.data.nextId[table];
        this.data.nextId[table]++;
        return id;
    }

    // 插入数据
    insert(table, record) {
        if (!this.data[table]) {
            this.data[table] = {};
        }
        
        const id = this.generateId(table);
        const recordWithId = {
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...record
        };
        
        this.data[table][id] = recordWithId;
        this.saveData();
        
        return id;
    }

    // 查询数据
    select(table, conditions = {}) {
        if (!this.data[table]) {
            return [];
        }
        
        const records = Object.values(this.data[table]);
        
        if (Object.keys(conditions).length === 0) {
            return records;
        }
        
        return records.filter(record => {
            return Object.entries(conditions).every(([key, value]) => {
                return record[key] === value;
            });
        });
    }

    // 获取单条记录
    get(table, id) {
        if (!this.data[table] || !this.data[table][id]) {
            return null;
        }
        return this.data[table][id];
    }

    // 更新数据
    update(table, id, updates) {
        if (!this.data[table] || !this.data[table][id]) {
            return false;
        }
        
        this.data[table][id] = {
            ...this.data[table][id],
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        return this.saveData();
    }

    // 删除数据
    delete(table, id) {
        if (!this.data[table] || !this.data[table][id]) {
            return false;
        }
        
        delete this.data[table][id];
        return this.saveData();
    }

    // 获取统计数据
    getStats() {
        return {
            users: Object.keys(this.data.users || {}).length,
            resumes: Object.keys(this.data.resumes || {}).length,
            education: Object.keys(this.data.education || {}).length,
            work_experience: Object.keys(this.data.work_experience || {}).length,
            skills: Object.keys(this.data.skills || {}).length,
            applications: Object.keys(this.data.applications || {}).length
        };
    }

    // 搜索数据
    search(table, field, keyword) {
        if (!this.data[table]) {
            return [];
        }
        
        const records = Object.values(this.data[table]);
        return records.filter(record => {
            const value = record[field];
            return value && value.toString().toLowerCase().includes(keyword.toLowerCase());
        });
    }

    // 备份数据库
    backup(backupPath) {
        try {
            fs.writeFileSync(backupPath, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('❌ 备份数据库失败:', error);
            return false;
        }
    }

    // 恢复数据库
    restore(backupPath) {
        try {
            if (fs.existsSync(backupPath)) {
                const content = fs.readFileSync(backupPath, 'utf8');
                this.data = JSON.parse(content);
                return this.saveData();
            }
            return false;
        } catch (error) {
            console.error('❌ 恢复数据库失败:', error);
            return false;
        }
    }
}

// 创建全局数据库实例
const database = new JsonDatabase();

module.exports = database;