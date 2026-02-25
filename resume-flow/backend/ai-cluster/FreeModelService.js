const EventEmitter = require('events');

class FreeModelService extends EventEmitter {
    constructor() {
        super();
        
        // 免费模型配置
        this.freeModels = {
            // 本地模型 (完全免费)
            local: {
                name: '本地模型 (Ollama/LocalAI)',
                type: 'local',
                endpoint: process.env.LOCAL_MODEL_URL || 'http://localhost:11434/v1/chat/completions',
                apiKey: '', // 本地模型通常不需要API密钥
                weight: 1.0,
                maxTokens: 2000,
                timeout: 60000,
                specialty: '完全免费，数据本地处理',
                status: 'available',
                model: process.env.LOCAL_MODEL_NAME || 'qwen:7b',
                cost: '免费',
                setupRequired: true
            },
            
            // 模拟AI模型 (用于演示)
            mock: {
                name: '模拟AI模型 (演示用)',
                type: 'mock',
                endpoint: 'mock://localhost',
                apiKey: '',
                weight: 0.8,
                maxTokens: 1500,
                timeout: 3000,
                specialty: '快速演示，无需配置',
                status: 'available',
                model: 'mock-ai',
                cost: '免费',
                setupRequired: false
            },
            
            // 开源模型API (如HuggingFace免费额度)
            huggingface: {
                name: 'HuggingFace 开源模型',
                type: 'huggingface',
                endpoint: process.env.HF_API_URL || 'https://api-inference.huggingface.co/models/',
                apiKey: process.env.HF_API_KEY || '',
                weight: 0.9,
                maxTokens: 1000,
                timeout: 45000,
                specialty: '开源模型，社区支持',
                status: process.env.HF_API_KEY ? 'available' : '需要配置',
                model: 'microsoft/DialoGPT-large',
                cost: '免费额度',
                setupRequired: true
            }
        };
        
        // 当前激活的免费模型
        this.activeModel = null;
        
        // 初始化
        this.initializeFreeModels();
    }

    // 初始化免费模型
    initializeFreeModels() {
        console.log('🔧 初始化免费AI模型服务...');
        
        // 检查可用的免费模型
        const availableModels = this.getAvailableModels();
        
        if (availableModels.length > 0) {
            // 选择第一个可用的模型
            this.activeModel = availableModels[0];
            console.log(`✅ 激活免费模型: ${this.activeModel.name}`);
        } else {
            // 使用模拟模型作为回退
            this.activeModel = this.freeModels.mock;
            console.log('⚠️ 未找到可用的免费模型，使用模拟模型');
        }
    }

    // 获取可用的免费模型
    getAvailableModels() {
        const available = [];
        
        Object.values(this.freeModels).forEach(model => {
            if (model.status === 'available' || !model.setupRequired) {
                available.push(model);
            }
        });
        
        return available;
    }

    // 处理简历解析请求
    async parseResume(resumeText, fileName = '') {
        const model = this.activeModel;
        
        console.log(`🧠 使用免费模型解析: ${model.name}`);
        
        try {
            let result;
            
            switch (model.type) {
                case 'local':
                    result = await this.callLocalModel(model, resumeText, fileName);
                    break;
                case 'mock':
                    result = await this.callMockModel(model, resumeText, fileName);
                    break;
                case 'huggingface':
                    result = await this.callHuggingFace(model, resumeText, fileName);
                    break;
                default:
                    throw new Error(`不支持的免费模型类型: ${model.type}`);
            }
            
            return {
                success: true,
                data: result,
                model: model.name,
                modelType: model.type,
                cost: model.cost,
                responseTime: result.responseTime || 0
            };
            
        } catch (error) {
            console.error('❌ 免费模型解析失败:', error);
            
            // 使用模拟模型作为回退
            const fallbackResult = await this.callMockModel(this.freeModels.mock, resumeText, fileName);
            
            return {
                success: false,
                error: error.message,
                fallback: fallbackResult,
                model: model.name,
                modelType: 'fallback'
            };
        }
    }

    // 调用本地模型 (Ollama/LocalAI)
    async callLocalModel(model, resumeText, fileName) {
        const startTime = Date.now();
        
        // 构建提示词
        const prompt = this.buildResumeParsePrompt(resumeText, fileName);
        
        try {
            const response = await fetch(model.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model.model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的简历解析专家，请准确提取简历中的结构化信息。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: model.maxTokens,
                    temperature: 0.3
                }),
                timeout: model.timeout
            });
            
            if (!response.ok) {
                throw new Error(`本地模型API错误: ${response.status}`);
            }
            
            const data = await response.json();
            const responseTime = Date.now() - startTime;
            
            // 解析响应
            const parsedResult = this.parseAIResponse(data.choices?.[0]?.message?.content || data.response || '');
            
            return {
                ...parsedResult,
                responseTime: responseTime,
                rawResponse: data
            };
            
        } catch (error) {
            if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
                throw new Error('本地模型服务未启动，请先启动Ollama或LocalAI服务');
            }
            throw error;
        }
    }

    // 调用模拟模型 (用于演示)
    async callMockModel(model, resumeText, fileName) {
        const startTime = Date.now();
        
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const responseTime = Date.now() - startTime;
        
        // 生成模拟的AI响应
        const mockResponse = this.generateMockResponse(resumeText, fileName);
        
        return {
            ...mockResponse,
            responseTime: responseTime,
            isMock: true,
            note: '这是模拟AI生成的结果，用于演示目的'
        };
    }

    // 调用HuggingFace模型
    async callHuggingFace(model, resumeText, fileName) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${model.endpoint}${model.model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${model.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: resumeText.substring(0, 1000),
                    parameters: {
                        max_length: model.maxTokens,
                        temperature: 0.7
                    }
                }),
                timeout: model.timeout
            });
            
            if (!response.ok) {
                throw new Error(`HuggingFace API错误: ${response.status}`);
            }
            
            const data = await response.json();
            const responseTime = Date.now() - startTime;
            
            return {
                personalInfo: this.extractBasicInfo(resumeText),
                education: this.extractEducation(resumeText),
                workExperience: this.extractWorkExperience(resumeText),
                skills: this.extractSkills(resumeText),
                summary: 'HuggingFace模型解析结果',
                responseTime: responseTime,
                rawResponse: data
            };
            
        } catch (error) {
            throw new Error(`HuggingFace模型调用失败: ${error.message}`);
        }
    }

    // 构建简历解析提示词
    buildResumeParsePrompt(resumeText, fileName) {
        return `请解析以下简历内容，提取结构化信息：

文件名：${fileName}
简历内容：
${resumeText.substring(0, 2000)}

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
            
            // 如果无法解析JSON，使用基础提取
            return this.extractBasicInfoFromText(aiResponse);
            
        } catch (error) {
            console.warn('AI响应JSON解析失败，使用基础提取');
            return this.extractBasicInfoFromText(aiResponse);
        }
    }

    // 从文本中提取基础信息
    extractBasicInfoFromText(text) {
        return {
            personalInfo: {
                name: this.extractName(text),
                email: this.extractEmail(text),
                phone: this.extractPhone(text)
            },
            education: this.extractEducation(text),
            workExperience: this.extractWorkExperience(text),
            skills: this.extractSkills(text),
            summary: 'AI模型解析结果',
            rawText: text.substring(0, 500)
        };
    }

    // 生成模拟响应
    generateMockResponse(resumeText, fileName) {
        const name = this.extractName(fileName) || '张三';
        const email = this.extractEmail(resumeText) || 'example@email.com';
        
        return {
            personalInfo: {
                name: name,
                email: email,
                phone: '13800000000',
                location: '北京'
            },
            education: [
                {
                    institution: '清华大学',
                    degree: '本科',
                    major: '计算机科学',
                    duration: '2018-2022'
                }
            ],
            workExperience: [
                {
                    company: '示例科技有限公司',
                    position: '软件工程师',
                    duration: '2022-至今',
                    description: '负责后端系统开发和维护'
                }
            ],
            skills: ['JavaScript', 'Python', 'React', 'Node.js'],
            summary: `${name}的简历解析结果 - 模拟AI生成`
        };
    }

    // 基础信息提取方法
    extractName(text) {
        const match = text.match(/(?:姓名|名字)[:：\s]*([\u4e00-\u9fa5]{2,4})/i);
        return match ? match[1] : '';
    }

    extractEmail(text) {
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return match ? match[0] : '';
    }

    extractPhone(text) {
        const match = text.match(/1[3-9]\d{9}/);
        return match ? match[0] : '';
    }

    extractEducation(text) {
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

    extractWorkExperience(text) {
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

    extractSkills(text) {
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

    // 获取免费模型状态
    getFreeModelStatus() {
        const availableModels = this.getAvailableModels();
        
        return {
            activeModel: this.activeModel ? {
                name: this.activeModel.name,
                type: this.activeModel.type,
                cost: this.activeModel.cost,
                status: this.activeModel.status
            } : null,
            availableModels: availableModels.map(model => ({
                name: model.name,
                type: model.type,
                cost: model.cost,
                status: model.status,
                setupRequired: model.setupRequired
            })),
            totalAvailable: availableModels.length
        };
    }

    // 切换免费模型
    switchModel(modelType) {
        if (this.freeModels[modelType]) {
            const model = this.freeModels[modelType];
            
            if (model.status === 'available' || !model.setupRequired) {
                this.activeModel = model;
                console.log(`✅ 切换到免费模型: ${model.name}`);
                return true;
            }
        }
        
        console.warn(`⚠️ 无法切换到模型: ${modelType}`);
        return false;
    }
}

module.exports = new FreeModelService();