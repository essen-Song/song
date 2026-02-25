class ModelConfigService {
    constructor() {
        this.modelConfigs = {
            // 简历解析专用模型配置
            resumeParser: [
                {
                    name: 'GPT-4 Resume Expert',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '未配置',
                    weight: 1.2,
                    maxTokens: 2000,
                    timeout: 45000,
                    specialty: '信息提取',
                    status: process.env.OPENAI_API_KEY ? '就绪' : '未配置',
                    model: 'gpt-4'
                },
                {
                    name: 'Claude Resume Analyzer',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '未配置',
                    weight: 1.1,
                    maxTokens: 3000,
                    timeout: 60000,
                    specialty: '结构化分析',
                    status: process.env.CLAUDE_API_KEY ? '就绪' : '未配置',
                    model: 'claude-3-sonnet-20240229'
                },
                {
                    name: '文心一言简历解析',
                    type: 'ernie',
                    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                    apiKey: process.env.ERNIE_API_KEY || '未配置',
                    weight: 0.9,
                    maxTokens: 2000,
                    timeout: 40000,
                    specialty: '中文优化',
                    status: process.env.ERNIE_API_KEY ? '就绪' : '未配置',
                    model: 'ERNIE-Bot'
                }
            ],
            
            // 简历优化专用模型配置
            resumeOptimizer: [
                {
                    name: 'GPT-4 Optimizer Pro',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '未配置',
                    weight: 1.3,
                    maxTokens: 3000,
                    timeout: 90000,
                    specialty: '语言优化',
                    status: process.env.OPENAI_API_KEY ? '就绪' : '未配置',
                    model: 'gpt-4'
                },
                {
                    name: 'Claude Writing Expert',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '未配置',
                    weight: 1.0,
                    maxTokens: 4000,
                    timeout: 120000,
                    specialty: '内容优化',
                    status: process.env.CLAUDE_API_KEY ? '就绪' : '未配置',
                    model: 'claude-3-opus-20240229'
                }
            ],
            
            // 面试教练专用模型配置
            interviewCoach: [
                {
                    name: 'GPT-4 Interview Coach',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '未配置',
                    weight: 1.1,
                    maxTokens: 1500,
                    timeout: 30000,
                    specialty: '问题生成',
                    status: process.env.OPENAI_API_KEY ? '就绪' : '未配置',
                    model: 'gpt-4'
                },
                {
                    name: 'Claude STAR Expert',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '未配置',
                    weight: 1.2,
                    maxTokens: 2000,
                    timeout: 45000,
                    specialty: 'STAR评估',
                    status: process.env.CLAUDE_API_KEY ? '就绪' : '未配置',
                    model: 'claude-3-haiku-20240307'
                },
                {
                    name: '文心一言面试专家',
                    type: 'ernie',
                    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                    apiKey: process.env.ERNIE_API_KEY || '未配置',
                    weight: 0.8,
                    maxTokens: 1800,
                    timeout: 35000,
                    specialty: '中文场景',
                    status: process.env.ERNIE_API_KEY ? '就绪' : '未配置',
                    model: 'ERNIE-Bot-turbo'
                }
            ],
            
            // 职位匹配专用模型配置
            jobMatcher: [
                {
                    name: 'GPT-4 Job Matcher',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '未配置',
                    weight: 1.0,
                    maxTokens: 1200,
                    timeout: 30000,
                    specialty: '匹配算法',
                    status: process.env.OPENAI_API_KEY ? '就绪' : '未配置',
                    model: 'gpt-3.5-turbo'
                },
                {
                    name: 'Claude Career Advisor',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '未配置',
                    weight: 0.9,
                    maxTokens: 1500,
                    timeout: 40000,
                    specialty: '职业规划',
                    status: process.env.CLAUDE_API_KEY ? '就绪' : '未配置',
                    model: 'claude-3-sonnet-20240229'
                }
            ]
        };
    }

    // 获取所有模型配置
    getAllModelConfigs() {
        const configs = {};
        
        Object.keys(this.modelConfigs).forEach(clusterName => {
            configs[clusterName] = this.modelConfigs[clusterName].map(model => ({
                name: model.name,
                type: model.type,
                model: model.model,
                status: model.status,
                specialty: model.specialty,
                weight: model.weight,
                maxTokens: model.maxTokens,
                timeout: model.timeout,
                apiKeyConfigured: model.apiKey !== '未配置'
            }));
        });
        
        return configs;
    }

    // 获取集群统计
    getClusterStats() {
        const stats = {};
        
        Object.keys(this.modelConfigs).forEach(clusterName => {
            const models = this.modelConfigs[clusterName];
            const totalModels = models.length;
            const configuredModels = models.filter(m => m.apiKey !== '未配置').length;
            
            stats[clusterName] = {
                totalModels: totalModels,
                configuredModels: configuredModels,
                configurationRate: Math.round((configuredModels / totalModels) * 100),
                status: configuredModels > 0 ? '部分就绪' : '未配置',
                models: models.map(m => ({
                    name: m.name,
                    status: m.status,
                    apiKeyConfigured: m.apiKey !== '未配置'
                }))
            };
        });
        
        return stats;
    }

    // 获取系统总体状态
    getSystemStatus() {
        const clusterStats = this.getClusterStats();
        const totalClusters = Object.keys(clusterStats).length;
        const configuredClusters = Object.values(clusterStats).filter(s => s.configuredModels > 0).length;
        const totalModels = Object.values(clusterStats).reduce((sum, s) => sum + s.totalModels, 0);
        const configuredModels = Object.values(clusterStats).reduce((sum, s) => sum + s.configuredModels, 0);
        
        return {
            system: {
                totalClusters: totalClusters,
                configuredClusters: configuredClusters,
                totalModels: totalModels,
                configuredModels: configuredModels,
                overallStatus: configuredModels > 0 ? '部分就绪' : '未配置',
                configurationRate: Math.round((configuredModels / totalModels) * 100)
            },
            clusters: clusterStats,
            environment: {
                openaiConfigured: !!process.env.OPENAI_API_KEY,
                claudeConfigured: !!process.env.CLAUDE_API_KEY,
                ernieConfigured: !!process.env.ERNIE_API_KEY,
                nodeEnv: process.env.NODE_ENV || 'development'
            }
        };
    }

    // 获取配置指南
    getConfigurationGuide() {
        return {
            openai: {
                description: 'OpenAI GPT系列模型',
                supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                configuration: '在环境变量中设置 OPENAI_API_KEY=your_api_key',
                usage: '适用于通用文本理解和生成任务'
            },
            claude: {
                description: 'Anthropic Claude系列模型',
                supportedModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                configuration: '在环境变量中设置 CLAUDE_API_KEY=your_api_key',
                usage: '擅长长文本分析和复杂推理任务'
            },
            ernie: {
                description: '百度文心一言模型',
                supportedModels: ['ERNIE-Bot', 'ERNIE-Bot-turbo'],
                configuration: '在环境变量中设置 ERNIE_API_KEY=your_api_key',
                usage: '专为中文优化，适合中文内容处理'
            }
        };
    }
}

module.exports = new ModelConfigService();