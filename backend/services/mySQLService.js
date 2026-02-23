const mysql = require('mysql2/promise');
const path = require('path');

class MySQLService {
    constructor() {
        this.pool = null;
        this.init();
    }

    async init() {
        try {
            this.pool = mysql.createPool({
                host: process.env.MYSQL_HOST || 'localhost',
                port: process.env.MYSQL_PORT || 3306,
                user: process.env.MYSQL_USER || 'root',
                password: process.env.MYSQL_PASSWORD || '',
                database: process.env.MYSQL_DATABASE || 'resume_flow',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            
            console.log('✅ MySQL 数据库连接池初始化成功');
        } catch (error) {
            console.error('❌ MySQL 数据库初始化失败:', error);
        }
    }

    async getConfig(category = null, keyName = null) {
        try {
            let query = 'SELECT * FROM system_configs WHERE is_active = TRUE';
            const params = [];
            
            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }
            
            if (keyName) {
                query += ' AND key_name = ?';
                params.push(keyName);
            }
            
            const [rows] = await this.pool.execute(query, params);
            
            if (keyName) {
                return rows.length > 0 ? rows[0].key_value : null;
            }
            
            if (category) {
                const config = {};
                rows.forEach(row => {
                    config[row.key_name] = row.key_value;
                });
                return config;
            }
            
            const allConfigs = {};
            rows.forEach(row => {
                if (!allConfigs[row.category]) {
                    allConfigs[row.category] = {};
                }
                allConfigs[row.category][row.key_name] = row.key_value;
            });
            
            return allConfigs;
        } catch (error) {
            console.error('❌ 获取配置失败:', error);
            return {};
        }
    }

    async setConfig(category, keyName, keyValue, description = '') {
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO system_configs (category, key_name, key_value, description) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 key_value = VALUES(key_value), 
                 description = VALUES(description),
                 updated_at = CURRENT_TIMESTAMP`,
                [category, keyName, keyValue, description]
            );
            
            console.log(`✅ 配置已更新: ${category}.${keyName}`);
            return result.insertId || result.affectedRows;
        } catch (error) {
            console.error('❌ 设置配置失败:', error);
            return null;
        }
    }

    async getAITrainerConfig() {
        return await this.getConfig('ai_trainer');
    }

    async getModelPriorityOrder() {
        const priority = await this.getConfig('ai_trainer', 'model_priority_order');
        return priority ? priority.split('|') : [];
    }

    async getEvaluationMetrics() {
        const metrics = await this.getConfig('ai_trainer', 'evaluation_metrics');
        return metrics ? metrics.split('|') : [];
    }

    async getDatasetRequirements() {
        const requirements = await this.getConfig('ai_trainer', 'dataset_requirements');
        return requirements ? requirements.split('|') : [];
    }

    async getPromptOptimizationPatterns() {
        const patterns = await this.getConfig('ai_trainer', 'prompt_optimization_patterns');
        return patterns ? patterns.split('|') : [];
    }

    async getDataFlowSequence() {
        return await this.getConfig('ai_trainer', 'data_flow_sequence');
    }

    async saveTrainingDataset(datasetName, datasetData, metadata = {}) {
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO training_datasets (name, data, metadata, created_at) 
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [datasetName, JSON.stringify(datasetData), JSON.stringify(metadata)]
            );
            
            console.log(`✅ 训练数据集已保存: ${datasetName}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ 保存训练数据集失败:', error);
            return null;
        }
    }

    async getTrainingDatasets() {
        try {
            const [rows] = await this.pool.execute(
                'SELECT * FROM training_datasets ORDER BY created_at DESC'
            );
            
            return rows.map(row => ({
                ...row,
                data: JSON.parse(row.data || '{}'),
                metadata: JSON.parse(row.metadata || '{}')
            }));
        } catch (error) {
            console.error('❌ 获取训练数据集失败:', error);
            return [];
        }
    }

    async saveModelEvaluation(modelName, metrics, testResults = {}) {
        try {
            const [result] = await this.pool.execute(
                `INSERT INTO model_evaluations (model_name, metrics, test_results, created_at) 
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [modelName, JSON.stringify(metrics), JSON.stringify(testResults)]
            );
            
            console.log(`✅ 模型评估已保存: ${modelName}`);
            return result.insertId;
        } catch (error) {
            console.error('❌ 保存模型评估失败:', error);
            return null;
        }
    }

    async getModelEvaluations(modelName = null) {
        try {
            let query = 'SELECT * FROM model_evaluations';
            const params = [];
            
            if (modelName) {
                query += ' WHERE model_name = ?';
                params.push(modelName);
            }
            
            query += ' ORDER BY created_at DESC';
            
            const [rows] = await this.pool.execute(query, params);
            
            return rows.map(row => ({
                ...row,
                metrics: JSON.parse(row.metrics || '{}'),
                test_results: JSON.parse(row.test_results || '{}')
            }));
        } catch (error) {
            console.error('❌ 获取模型评估失败:', error);
            return [];
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('🔒 MySQL 数据库连接池已关闭');
        }
    }
}

module.exports = new MySQLService();