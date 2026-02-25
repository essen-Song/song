const fs = require('fs');
const path = require('path');

class ClusterConfigManager {
    constructor() {
        this.configFile = path.join(__dirname, '../../config/model-clusters.json');
        this.defaultConfig = this.getDefaultConfig();
        this.currentConfig = this.loadConfig();
        
        console.log('🔧 模型集群配置管理器已启动');
    }

    // 获取默认配置
    getDefaultConfig() {
        return {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            clusters: {
                resumeParser: {
                    name: '简历解析集群',
                    description: '专门处理简历解析任务',
                    enabled: true,
                    models: [
                        {
                            id: 'gpt4-resume-1',
                            name: 'GPT-4 Resume Expert',
                            type: 'openai',
                            endpoint: 'https://api.openai.com/v1/chat/completions',
                            apiKey: '',
                            model: 'gpt-4',
                            weight: 1.2,
                            maxTokens: 2000,
                            timeout: 45000,
                            enabled: false,
                            specialty: '信息提取',
                            costPerToken: 0.03
                        },
                        {
                            id: 'claude-resume-1',
                            name: 'Claude Resume Analyzer',
                            type: 'claude',
                            endpoint: 'https://api.anthropic.com/v1/messages',
                            apiKey: '',
                            model: 'claude-3-sonnet-20240229',
                            weight: 1.1,
                            maxTokens: 3000,
                            timeout: 60000,
                            enabled: false,
                            specialty: '结构化分析',
                            costPerToken: 0.015
                        },
                        {
                            id: 'ernie-resume-1',
                            name: '文心一言简历解析',
                            type: 'ernie',
                            endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                            apiKey: '',
                            model: 'ERNIE-Bot',
                            weight: 0.9,
                            maxTokens: 2000,
                            timeout: 40000,
                            enabled: false,
                            specialty: '中文优化',
                            costPerToken: 0.02
                        }
                    ],
                    minModels: 1,
                    maxModels: 5,
                    loadBalancing: 'weighted_round_robin'
                },
                resumeOptimizer: {
                    name: '简历优化集群',
                    description: '专门处理简历优化任务',
                    enabled: true,
                    models: [
                        {
                            id: 'gpt4-optimizer-1',
                            name: 'GPT-4 Optimizer Pro',
                            type: 'openai',
                            endpoint: 'https://api.openai.com/v1/chat/completions',
                            apiKey: '',
                            model: 'gpt-4',
                            weight: 1.3,
                            maxTokens: 3000,
                            timeout: 90000,
                            enabled: false,
                            specialty: '语言优化',
                            costPerToken: 0.03
                        },
                        {
                            id: 'claude-optimizer-1',
                            name: 'Claude Writing Expert',
                            type: 'claude',
                            endpoint: 'https://api.anthropic.com/v1/messages',
                            apiKey: '',
                            model: 'claude-3-opus-20240229',
                            weight: 1.0,
                            maxTokens: 4000,
                            timeout: 120000,
                            enabled: false,
                            specialty: '内容优化',
                            costPerToken: 0.025
                        }
                    ],
                    minModels: 1,
                    maxModels: 3,
                    loadBalancing: 'performance_based'
                },
                interviewCoach: {
                    name: '面试教练集群',
                    description: '专门处理面试教练任务',
                    enabled: true,
                    models: [
                        {
                            id: 'gpt4-interview-1',
                            name: 'GPT-4 Interview Coach',
                            type: 'openai',
                            endpoint: 'https://api.openai.com/v1/chat/completions',
                            apiKey: '',
                            model: 'gpt-4',
                            weight: 1.1,
                            maxTokens: 1500,
                            timeout: 30000,
                            enabled: false,
                            specialty: '问题生成',
                            costPerToken: 0.03
                        },
                        {
                            id: 'claude-interview-1',
                            name: 'Claude STAR Expert',
                            type: 'claude',
                            endpoint: 'https://api.anthropic.com/v1/messages',
                            apiKey: '',
                            model: 'claude-3-haiku-20240307',
                            weight: 1.2,
                            maxTokens: 2000,
                            timeout: 45000,
                            enabled: false,
                            specialty: 'STAR评估',
                            costPerToken: 0.01
                        },
                        {
                            id: 'ernie-interview-1',
                            name: '文心一言面试专家',
                            type: 'ernie',
                            endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                            apiKey: '',
                            model: 'ERNIE-Bot-turbo',
                            weight: 0.8,
                            maxTokens: 1800,
                            timeout: 35000,
                            enabled: false,
                            specialty: '中文场景',
                            costPerToken: 0.015
                        }
                    ],
                    minModels: 1,
                    maxModels: 4,
                    loadBalancing: 'least_connections'
                },
                jobMatcher: {
                    name: '职位匹配集群',
                    description: '专门处理职位匹配任务',
                    enabled: true,
                    models: [
                        {
                            id: 'gpt4-matcher-1',
                            name: 'GPT-4 Job Matcher',
                            type: 'openai',
                            endpoint: 'https://api.openai.com/v1/chat/completions',
                            apiKey: '',
                            model: 'gpt-3.5-turbo',
                            weight: 1.0,
                            maxTokens: 1200,
                            timeout: 30000,
                            enabled: false,
                            specialty: '匹配算法',
                            costPerToken: 0.002
                        },
                        {
                            id: 'claude-matcher-1',
                            name: 'Claude Career Advisor',
                            type: 'claude',
                            endpoint: 'https://api.anthropic.com/v1/messages',
                            apiKey: '',
                            model: 'claude-3-sonnet-20240229',
                            weight: 0.9,
                            maxTokens: 1500,
                            timeout: 40000,
                            enabled: false,
                            specialty: '职业规划',
                            costPerToken: 0.015
                        }
                    ],
                    minModels: 1,
                    maxModels: 3,
                    loadBalancing: 'weighted_round_robin'
                }
            },
            freeModels: {
                enabled: true,
                priority: 1, // 优先级，数字越小优先级越高
                models: [
                    {
                        id: 'mock-model-1',
                        name: '模拟AI模型',
                        type: 'mock',
                        endpoint: 'mock://localhost',
                        apiKey: '',
                        model: 'mock-ai',
                        weight: 0.8,
                        maxTokens: 1500,
                        timeout: 3000,
                        enabled: true,
                        specialty: '快速演示',
                        costPerToken: 0
                    }
                ]
            },
            settings: {
                autoReload: true,
                healthCheckInterval: 30000,
                maxConcurrentRequests: 10,
                requestTimeout: 60000,
                retryAttempts: 3
            }
        };
    }

    // 加载配置
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const configData = fs.readFileSync(this.configFile, 'utf8');
                const config = JSON.parse(configData);
                
                // 合并默认配置，确保新字段被添加
                return this.mergeConfigs(this.defaultConfig, config);
            }
        } catch (error) {
            console.warn('❌ 配置文件加载失败，使用默认配置:', error.message);
        }
        
        // 保存默认配置
        this.saveConfig(this.defaultConfig);
        return this.defaultConfig;
    }

    // 合并配置
    mergeConfigs(defaultConfig, userConfig) {
        const merged = JSON.parse(JSON.stringify(defaultConfig));
        
        // 深度合并
        Object.keys(userConfig).forEach(key => {
            if (typeof userConfig[key] === 'object' && userConfig[key] !== null) {
                if (Array.isArray(userConfig[key])) {
                    merged[key] = userConfig[key];
                } else {
                    merged[key] = { ...merged[key], ...userConfig[key] };
                }
            } else {
                merged[key] = userConfig[key];
            }
        });
        
        return merged;
    }

    // 保存配置
    saveConfig(config) {
        try {
            // 确保配置目录存在
            const configDir = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            // 更新最后修改时间
            config.lastUpdated = new Date().toISOString();
            
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf8');
            console.log('✅ 配置已保存');
            return true;
        } catch (error) {
            console.error('❌ 配置保存失败:', error);
            return false;
        }
    }

    // 获取配置
    getConfig() {
        return this.currentConfig;
    }

    // 更新集群配置
    updateClusterConfig(clusterName, clusterConfig) {
        if (!this.currentConfig.clusters[clusterName]) {
            throw new Error(`集群不存在: ${clusterName}`);
        }
        
        this.currentConfig.clusters[clusterName] = {
            ...this.currentConfig.clusters[clusterName],
            ...clusterConfig
        };
        
        return this.saveConfig(this.currentConfig);
    }

    // 添加模型到集群
    addModelToCluster(clusterName, modelConfig) {
        if (!this.currentConfig.clusters[clusterName]) {
            throw new Error(`集群不存在: ${clusterName}`);
        }
        
        const cluster = this.currentConfig.clusters[clusterName];
        
        // 检查模型数量限制
        if (cluster.models.length >= cluster.maxModels) {
            throw new Error(`集群 ${clusterName} 已达到最大模型数量限制: ${cluster.maxModels}`);
        }
        
        // 生成唯一ID
        const modelId = this.generateModelId(clusterName, modelConfig.name);
        
        const newModel = {
            id: modelId,
            ...modelConfig,
            enabled: true
        };
        
        cluster.models.push(newModel);
        
        return this.saveConfig(this.currentConfig);
    }

    // 更新模型配置
    updateModelConfig(clusterName, modelId, modelConfig) {
        const cluster = this.currentConfig.clusters[clusterName];
        if (!cluster) {
            throw new Error(`集群不存在: ${clusterName}`);
        }
        
        const modelIndex = cluster.models.findIndex(m => m.id === modelId);
        if (modelIndex === -1) {
            throw new Error(`模型不存在: ${modelId}`);
        }
        
        cluster.models[modelIndex] = {
            ...cluster.models[modelIndex],
            ...modelConfig
        };
        
        return this.saveConfig(this.currentConfig);
    }

    // 删除模型
    removeModelFromCluster(clusterName, modelId) {
        const cluster = this.currentConfig.clusters[clusterName];
        if (!cluster) {
            throw new Error(`集群不存在: ${clusterName}`);
        }
        
        // 检查最小模型数量
        const enabledModels = cluster.models.filter(m => m.enabled);
        if (enabledModels.length <= cluster.minModels) {
            throw new Error(`集群 ${clusterName} 需要至少 ${cluster.minModels} 个启用模型`);
        }
        
        cluster.models = cluster.models.filter(m => m.id !== modelId);
        
        return this.saveConfig(this.currentConfig);
    }

    // 启用/禁用模型
    toggleModel(clusterName, modelId, enabled) {
        return this.updateModelConfig(clusterName, modelId, { enabled });
    }

    // 生成模型ID
    generateModelId(clusterName, modelName) {
        const baseId = `${clusterName}-${modelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        let id = baseId;
        let counter = 1;
        
        const cluster = this.currentConfig.clusters[clusterName];
        while (cluster.models.some(m => m.id === id)) {
            id = `${baseId}-${counter}`;
            counter++;
        }
        
        return id;
    }

    // 获取集群状态
    getClusterStatus(clusterName = null) {
        const status = {};
        
        if (clusterName) {
            const cluster = this.currentConfig.clusters[clusterName];
            if (!cluster) {
                throw new Error(`集群不存在: ${clusterName}`);
            }
            
            status[clusterName] = this.calculateClusterStatus(cluster);
        } else {
            Object.keys(this.currentConfig.clusters).forEach(name => {
                status[name] = this.calculateClusterStatus(this.currentConfig.clusters[name]);
            });
        }
        
        return status;
    }

    // 计算集群状态
    calculateClusterStatus(cluster) {
        const totalModels = cluster.models.length;
        const enabledModels = cluster.models.filter(m => m.enabled).length;
        const configuredModels = cluster.models.filter(m => m.enabled && m.apiKey).length;
        
        return {
            name: cluster.name,
            enabled: cluster.enabled,
            totalModels: totalModels,
            enabledModels: enabledModels,
            configuredModels: configuredModels,
            configurationRate: Math.round((configuredModels / totalModels) * 100),
            status: this.getClusterHealthStatus(cluster),
            meetsRequirements: enabledModels >= cluster.minModels
        };
    }

    // 获取集群健康状态
    getClusterHealthStatus(cluster) {
        const enabledModels = cluster.models.filter(m => m.enabled);
        const configuredModels = enabledModels.filter(m => m.apiKey);
        
        if (enabledModels.length === 0) {
            return 'disabled';
        } else if (configuredModels.length === 0) {
            return 'unconfigured';
        } else if (configuredModels.length < cluster.minModels) {
            return 'insufficient';
        } else {
            return 'healthy';
        }
    }

    // 获取系统总体状态
    getSystemStatus() {
        const clusterStatus = this.getClusterStatus();
        const totalClusters = Object.keys(clusterStatus).length;
        const healthyClusters = Object.values(clusterStatus).filter(s => s.status === 'healthy').length;
        
        return {
            version: this.currentConfig.version,
            lastUpdated: this.currentConfig.lastUpdated,
            totalClusters: totalClusters,
            healthyClusters: healthyClusters,
            healthRate: Math.round((healthyClusters / totalClusters) * 100),
            clusters: clusterStatus,
            freeModels: {
                enabled: this.currentConfig.freeModels.enabled,
                models: this.currentConfig.freeModels.models.length
            }
        };
    }

    // 验证配置
    validateConfig(config) {
        const errors = [];
        
        // 检查集群配置
        Object.keys(config.clusters).forEach(clusterName => {
            const cluster = config.clusters[clusterName];
            
            if (cluster.enabled) {
                const enabledModels = cluster.models.filter(m => m.enabled);
                
                if (enabledModels.length < cluster.minModels) {
                    errors.push(`集群 ${clusterName} 启用的模型数量不足 (${enabledModels.length}/${cluster.minModels})`);
                }
                
                if (enabledModels.length > cluster.maxModels) {
                    errors.push(`集群 ${clusterName} 启用的模型数量超过限制 (${enabledModels.length}/${cluster.maxModels})`);
                }
            }
        });
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // 导出配置
    exportConfig() {
        return {
            config: this.currentConfig,
            status: this.getSystemStatus(),
            validation: this.validateConfig(this.currentConfig)
        };
    }

    // 重置配置
    resetConfig() {
        this.currentConfig = this.defaultConfig;
        return this.saveConfig(this.currentConfig);
    }
}

module.exports = new ClusterConfigManager();