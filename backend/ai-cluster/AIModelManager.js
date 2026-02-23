const AIModelCluster = require('./AIModelCluster');

class AIModelManager {
    constructor() {
        // 多个专用集群
        this.clusters = {
            resumeParser: new AIModelCluster(),
            resumeOptimizer: new AIModelCluster(),
            interviewCoach: new AIModelCluster(),
            jobMatcher: new AIModelCluster()
        };
        
        // 集群配置
        this.clusterConfigs = {
            resumeParser: {
                maxConcurrentRequests: 5,
                requestTimeout: 60000,
                loadBalancingStrategy: 'performance_based'
            },
            resumeOptimizer: {
                maxConcurrentRequests: 3,
                requestTimeout: 90000,
                loadBalancingStrategy: 'weighted_round_robin'
            },
            interviewCoach: {
                maxConcurrentRequests: 10,
                requestTimeout: 120000,
                loadBalancingStrategy: 'least_connections'
            },
            jobMatcher: {
                maxConcurrentRequests: 8,
                requestTimeout: 45000,
                loadBalancingStrategy: 'weighted_round_robin'
            }
        };
        
        // 应用配置
        this.applyClusterConfigs();
        
        // 模型节点配置
        this.modelConfigs = this.getDefaultModelConfigs();
        
        // 初始化集群
        this.initializeClusters();
        
        console.log('🚀 AI大模型集群管理器已启动');
    }

    // 应用集群配置
    applyClusterConfigs() {
        Object.keys(this.clusters).forEach(clusterName => {
            const cluster = this.clusters[clusterName];
            const config = this.clusterConfigs[clusterName];
            
            Object.assign(cluster.config, config);
        });
    }

    // 获取默认模型配置
    getDefaultModelConfigs() {
        return {
            // 简历解析专用模型
            resumeParser: [
                {
                    name: 'GPT-4 Resume Expert',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    weight: 1.2,
                    maxTokens: 2000,
                    timeout: 45000,
                    specialty: '信息提取'
                },
                {
                    name: 'Claude Resume Analyzer',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '',
                    weight: 1.1,
                    maxTokens: 3000,
                    timeout: 60000,
                    specialty: '结构化分析'
                },
                {
                    name: '文心一言简历解析',
                    type: 'ernie',
                    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                    apiKey: process.env.ERNIE_API_KEY || '',
                    weight: 0.9,
                    maxTokens: 2000,
                    timeout: 40000,
                    specialty: '中文优化'
                }
            ],
            
            // 简历优化专用模型
            resumeOptimizer: [
                {
                    name: 'GPT-4 Optimizer Pro',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    weight: 1.3,
                    maxTokens: 3000,
                    timeout: 90000,
                    specialty: '语言优化'
                },
                {
                    name: 'Claude Writing Expert',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '',
                    weight: 1.0,
                    maxTokens: 4000,
                    timeout: 120000,
                    specialty: '内容优化'
                }
            ],
            
            // 面试教练专用模型
            interviewCoach: [
                {
                    name: 'GPT-4 Interview Coach',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    weight: 1.1,
                    maxTokens: 1500,
                    timeout: 30000,
                    specialty: '问题生成'
                },
                {
                    name: 'Claude STAR Expert',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '',
                    weight: 1.2,
                    maxTokens: 2000,
                    timeout: 45000,
                    specialty: 'STAR评估'
                },
                {
                    name: '文心一言面试专家',
                    type: 'ernie',
                    endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                    apiKey: process.env.ERNIE_API_KEY || '',
                    weight: 0.8,
                    maxTokens: 1800,
                    timeout: 35000,
                    specialty: '中文场景'
                }
            ],
            
            // 职位匹配专用模型
            jobMatcher: [
                {
                    name: 'GPT-4 Job Matcher',
                    type: 'openai',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    weight: 1.0,
                    maxTokens: 1200,
                    timeout: 30000,
                    specialty: '匹配算法'
                },
                {
                    name: 'Claude Career Advisor',
                    type: 'claude',
                    endpoint: 'https://api.anthropic.com/v1/messages',
                    apiKey: process.env.CLAUDE_API_KEY || '',
                    weight: 0.9,
                    maxTokens: 1500,
                    timeout: 40000,
                    specialty: '职业规划'
                }
            ]
        };
    }

    // 初始化集群
    initializeClusters() {
        Object.keys(this.clusters).forEach(clusterName => {
            const cluster = this.clusters[clusterName];
            const models = this.modelConfigs[clusterName] || [];
            
            models.forEach(modelConfig => {
                // 只有配置了API密钥的模型才添加到集群
                if (modelConfig.apiKey) {
                    cluster.addModelNode(modelConfig);
                } else {
                    console.log(`⚠️ 跳过模型 ${modelConfig.name} - 缺少API密钥`);
                }
            });
            
            console.log(`✅ ${clusterName} 集群初始化完成，节点数: ${cluster.modelNodes.size}`);
        });
    }

    // 处理简历解析请求
    async parseResume(resumeText, fileName = '') {
        const prompt = this.buildResumeParsePrompt(resumeText, fileName);
        
        const requestData = {
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的简历解析专家，请准确提取简历中的个人信息、教育背景、工作经历和技能。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };
        
        try {
            const result = await this.clusters.resumeParser.processRequest(requestData);
            
            // 解析AI响应
            const parsedResult = this.parseAIResponse(result.data);
            
            return {
                success: true,
                data: parsedResult,
                cluster: 'resumeParser',
                node: result.node,
                responseTime: result.responseTime,
                requestId: result.requestId
            };
            
        } catch (error) {
            console.error('❌ 简历解析失败:', error);
            
            return {
                success: false,
                error: error.message,
                cluster: 'resumeParser',
                fallback: this.fallbackResumeParse(resumeText, fileName)
            };
        }
    }

    // 构建简历解析提示词
    buildResumeParsePrompt(resumeText, fileName) {
        return `请解析以下简历内容，提取结构化信息：

文件名：${fileName}
简历内容：
${resumeText.substring(0, 3000)}

请返回JSON格式的结果，包含以下字段：
- personalInfo: {name, email, phone, location}
- education: [{institution, degree, major, duration}]
- workExperience: [{company, position, duration, description}]
- skills: [技能列表]
- summary: 简历摘要`;
    }

    // 解析AI响应
    parseAIResponse(aiResponse) {
        try {
            // 尝试解析JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // 如果无法解析JSON，返回原始响应
            return {
                rawResponse: aiResponse,
                note: 'AI响应格式异常，需要手动解析'
            };
            
        } catch (error) {
            return {
                rawResponse: aiResponse,
                error: 'JSON解析失败',
                note: '需要改进提示词工程'
            };
        }
    }

    // 简历解析回退
    fallbackResumeParse(resumeText, fileName) {
        console.log('🔄 使用回退简历解析逻辑');
        
        // 简单的规则引擎回退
        return {
            personalInfo: {
                name: this.extractNameFallback(fileName),
                email: this.extractEmailFallback(resumeText),
                phone: this.extractPhoneFallback(resumeText)
            },
            education: this.extractEducationFallback(resumeText),
            workExperience: this.extractWorkExperienceFallback(resumeText),
            skills: this.extractSkillsFallback(resumeText),
            summary: '回退解析结果 - 建议检查AI模型配置',
            isFallback: true
        };
    }

    // 优化简历
    async optimizeResume(resumeData, targetPosition = '') {
        const prompt = this.buildOptimizePrompt(resumeData, targetPosition);
        
        const requestData = {
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的简历优化专家，请根据目标职位优化简历内容，提升匹配度和专业性。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };
        
        try {
            const result = await this.clusters.resumeOptimizer.processRequest(requestData);
            
            return {
                success: true,
                data: result.data,
                cluster: 'resumeOptimizer',
                node: result.node,
                responseTime: result.responseTime
            };
            
        } catch (error) {
            console.error('❌ 简历优化失败:', error);
            
            return {
                success: false,
                error: error.message,
                cluster: 'resumeOptimizer'
            };
        }
    }

    // 构建优化提示词
    buildOptimizePrompt(resumeData, targetPosition) {
        return `请优化以下简历，目标职位：${targetPosition}

当前简历：
${JSON.stringify(resumeData, null, 2)}

请提供优化建议和改进版本，重点关注：
1. 与目标职位的匹配度
2. 关键词优化
3. 成就量化
4. 专业性提升`;
    }

    // 生成面试问题
    async generateInterviewQuestions(resumeData, position = '') {
        const prompt = this.buildInterviewPrompt(resumeData, position);
        
        const requestData = {
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的面试官，请根据简历和目标职位生成相关的面试问题。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };
        
        try {
            const result = await this.clusters.interviewCoach.processRequest(requestData);
            
            return {
                success: true,
                data: result.data,
                cluster: 'interviewCoach',
                node: result.node,
                responseTime: result.responseTime
            };
            
        } catch (error) {
            console.error('❌ 面试问题生成失败:', error);
            
            return {
                success: false,
                error: error.message,
                cluster: 'interviewCoach'
            };
        }
    }

    // 构建面试提示词
    buildInterviewPrompt(resumeData, position) {
        return `请为以下简历生成面试问题：

目标职位：${position}
简历信息：
${JSON.stringify(resumeData, null, 2)}

请生成：
1. 技术问题（基于技能和经验）
2. 行为问题（STAR方法）
3. 情景问题（职位相关）
4. 文化匹配问题`;
    }

    // 获取集群状态
    getClusterStatus() {
        const status = {};
        
        Object.keys(this.clusters).forEach(clusterName => {
            status[clusterName] = this.clusters[clusterName].getClusterStatus();
        });
        
        return status;
    }

    // 添加模型到集群
    addModelToCluster(clusterName, modelConfig) {
        if (this.clusters[clusterName]) {
            return this.clusters[clusterName].addModelNode(modelConfig);
        }
        throw new Error(`集群不存在: ${clusterName}`);
    }

    // 回退提取方法
    extractNameFallback(fileName) {
        const match = fileName.match(/([\u4e00-\u9fa5]{2,4})/);
        return match ? match[1] : '未知';
    }

    extractEmailFallback(text) {
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return match ? match[0] : '';
    }

    extractPhoneFallback(text) {
        const match = text.match(/1[3-9]\d{9}/);
        return match ? match[0] : '';
    }

    extractEducationFallback(text) {
        const institutions = [];
        const pattern = /([\u4e00-\u9fa5]+大学|[\u4e00-\u9fa5]+学院)/g;
        let match;
        
        while ((match = pattern.exec(text)) !== null) {
            institutions.push({
                institution: match[1] || match[0],
                degree: '本科'
            });
        }
        
        return institutions.slice(0, 3);
    }

    extractWorkExperienceFallback(text) {
        const companies = [];
        const pattern = /([\u4e00-\u9fa5\w]+公司|[\u4e00-\u9fa5\w]+科技)/g;
        let match;
        
        while ((match = pattern.exec(text)) !== null) {
            companies.push({
                company: match[1] || match[0],
                position: '员工'
            });
        }
        
        return companies.slice(0, 3);
    }

    extractSkillsFallback(text) {
        const skills = new Set();
        const patterns = [
            /(JavaScript|Python|Java|React|Vue|MySQL|Docker|Kubernetes)/gi
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(skill => skills.add(skill));
            }
        });
        
        return Array.from(skills);
    }
}

module.exports = new AIModelManager();