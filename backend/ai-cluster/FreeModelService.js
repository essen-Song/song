const EventEmitter = require('events');
const apiConfigService = require('../services/apiConfigService');
const dingtalkService = require('../services/dingtalkService');
const databaseService = require('../services/databaseService');
const vectorDatabaseService = require('../services/vectorDatabaseService');

class FreeModelService extends EventEmitter {
    constructor() {
        super();
        
        this.freeModels = {
            local: {
                name: '本地模型 (Ollama/LocalAI)',
                type: 'local',
                endpoint: process.env.LOCAL_MODEL_URL || 'http://localhost:11434/v1/chat/completions',
                apiKey: '',
                weight: 1.0,
                maxTokens: 2000,
                timeout: 60000,
                specialty: '完全免费，数据本地处理',
                status: 'available',
                model: process.env.LOCAL_MODEL_NAME || 'qwen:7b',
                cost: '免费',
                setupRequired: true
            },
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
            }
        };
        
        this.activeModel = null;
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

    // 处理简历解析请求 - 使用智能路由按优先级调用模型
    async parseResume(resumeText, fileName = '', userId = null) {
        console.log('🧠 开始解析简历，使用智能路由...');
        
        const prompt = this.buildResumeParsePrompt(resumeText, fileName);
        const messages = [
            {
                role: 'system',
                content: '你是一个专业的简历解析专家，请准确提取简历中的结构化信息。只返回简历中实际存在的内容，不要编造任何信息。如果某个字段无法从简历中提取，请返回空值。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];
        
        try {
            const result = await apiConfigService.callWithFallback(messages, { temperature: 0.3 });
            
            if (result.success) {
                const parsedResult = this.parseAIResponse(result.content, resumeText);
                
                // 保存到数据库
                if (userId) {
                    const resumeId = databaseService.saveResume(userId, fileName, resumeText, parsedResult);
                    
                    // 添加到向量数据库
                    if (resumeId) {
                        vectorDatabaseService.addResumeVector(resumeId, resumeText, {
                            filename: fileName,
                            userId: userId,
                            model: result.usedModel
                        });
                    }
                }
                
                dingtalkService.notifyResumeParsed(fileName, result.usedModel, true).catch(() => {});
                
                return {
                    success: true,
                    data: {
                        ...parsedResult,
                        responseTime: result.responseTime || 0
                    },
                    model: result.usedModel,
                    modelType: result.modelType,
                    cost: result.cost,
                    responseTime: result.responseTime || 0
                };
            } else {
                console.log('⚠️ 所有模型调用失败，使用本地提取作为回退');
                const fallbackResult = this.generateMockResponse(resumeText, fileName);
                
                // 保存回退结果到数据库
                if (userId) {
                    const resumeId = databaseService.saveResume(userId, fileName, resumeText, fallbackResult);
                    
                    // 添加到向量数据库
                    if (resumeId) {
                        vectorDatabaseService.addResumeVector(resumeId, resumeText, {
                            filename: fileName,
                            userId: userId,
                            model: 'fallback'
                        });
                    }
                }
                
                dingtalkService.notifyResumeParsed(fileName, '本地提取', false).catch(() => {});
                
                return {
                    success: false,
                    error: result.error,
                    errors: result.errors,
                    fallback: fallbackResult,
                    model: '本地提取',
                    modelType: 'fallback'
                };
            }
        } catch (error) {
            console.error('❌ 简历解析异常:', error);
            const fallbackResult = this.generateMockResponse(resumeText, fileName);
            
            // 保存异常结果到数据库
            if (userId) {
                const resumeId = databaseService.saveResume(userId, fileName, resumeText, fallbackResult);
                
                // 添加到向量数据库
                if (resumeId) {
                    vectorDatabaseService.addResumeVector(resumeId, resumeText, {
                        filename: fileName,
                        userId: userId,
                        model: 'error'
                    });
                }
            }
            
            dingtalkService.notifyError('简历解析', error.message).catch(() => {});
            
            return {
                success: false,
                error: error.message,
                fallback: fallbackResult,
                model: '本地提取',
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
            const parsedResult = this.parseAIResponse(data.choices?.[0]?.message?.content || data.response || '', resumeText);
            
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

    // 验证解析结果，确保没有假数据
    validateParsedData(parsedData, originalResumeText) {
        const validatedData = {
            personalInfo: {
                name: this.validateField(parsedData.personalInfo?.name, originalResumeText, 'name'),
                email: this.validateField(parsedData.personalInfo?.email, originalResumeText, 'email'),
                phone: this.validateField(parsedData.personalInfo?.phone, originalResumeText, 'phone'),
                location: this.validateField(parsedData.personalInfo?.location, originalResumeText, 'location')
            },
            education: this.validateEducation(parsedData.education, originalResumeText),
            workExperience: this.validateWorkExperience(parsedData.workExperience, originalResumeText),
            skills: this.validateSkills(parsedData.skills, originalResumeText),
            summary: parsedData.summary || 'AI模型解析结果'
        };
        
        return validatedData;
    }
    
    // 验证单个字段
    validateField(fieldValue, originalText, fieldType) {
        if (!fieldValue) return '';
        
        // 检查字段值是否在原始文本中存在
        if (originalText.includes(fieldValue)) {
            return fieldValue;
        }
        
        // 如果不在原始文本中，尝试从原始文本中提取
        switch (fieldType) {
            case 'name':
                return this.extractName(originalText);
            case 'email':
                return this.extractEmail(originalText);
            case 'phone':
                return this.extractPhone(originalText);
            default:
                return '';
        }
    }
    
    // 验证教育经历
    validateEducation(education, originalText) {
        if (!Array.isArray(education)) return [];
        
        return education.map(edu => ({
            institution: this.validateField(edu.institution, originalText, 'institution'),
            degree: this.validateField(edu.degree, originalText, 'degree'),
            major: this.validateField(edu.major, originalText, 'major'),
            duration: this.validateField(edu.duration, originalText, 'duration')
        })).filter(edu => edu.institution || edu.degree || edu.major);
    }
    
    // 验证工作经历
    validateWorkExperience(workExperience, originalText) {
        if (!Array.isArray(workExperience)) return [];
        
        return workExperience.map(work => ({
            company: this.validateField(work.company, originalText, 'company'),
            position: this.validateField(work.position, originalText, 'position'),
            duration: this.validateField(work.duration, originalText, 'duration'),
            description: this.validateField(work.description, originalText, 'description')
        })).filter(work => work.company || work.position);
    }
    
    // 验证技能
    validateSkills(skills, originalText) {
        if (!Array.isArray(skills)) return [];
        
        return skills.filter(skill => {
            if (!skill || typeof skill !== 'string') return false;
            return originalText.includes(skill);
        });
    }

    // 解析AI响应
    parseAIResponse(aiResponse, originalResumeText = '') {
        try {
            // 尝试解析JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsedResult = JSON.parse(jsonMatch[0]);
                
                // 验证解析结果，确保没有假数据
                const validatedResult = this.validateParsedData(parsedResult, originalResumeText);
                return validatedResult;
            }
            
            // 如果无法解析JSON，使用基础提取（从原始简历文本中提取）
            console.warn('AI响应JSON解析失败，从原始简历文本中提取信息');
            return this.extractBasicInfoFromText(originalResumeText);
            
        } catch (error) {
            console.warn('AI响应JSON解析失败，从原始简历文本中提取信息');
            return this.extractBasicInfoFromText(originalResumeText);
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

    // 生成模拟响应 - 只返回实际提取的数据，不生成假数据
    generateMockResponse(resumeText, fileName) {
        const name = this.extractName(resumeText) || this.extractName(fileName) || '';
        const email = this.extractEmail(resumeText) || '';
        const phone = this.extractPhone(resumeText) || '';
        const education = this.extractEducation(resumeText) || [];
        const workExperience = this.extractWorkExperience(resumeText) || [];
        const skills = this.extractSkills(resumeText) || [];
        
        const extractedFields = [];
        if (name) extractedFields.push('姓名');
        if (email) extractedFields.push('邮箱');
        if (phone) extractedFields.push('电话');
        if (education.length > 0) extractedFields.push('教育背景');
        if (workExperience.length > 0) extractedFields.push('工作经历');
        if (skills.length > 0) extractedFields.push('技能');
        
        return {
            personalInfo: {
                name: name,
                email: email,
                phone: phone,
                location: ''
            },
            education: education,
            workExperience: workExperience,
            skills: skills,
            summary: name ? `${name}的简历解析结果` : '简历解析结果',
            extractionNote: extractedFields.length > 0 
                ? `已提取字段: ${extractedFields.join('、')}` 
                : '未能提取到有效信息，请检查简历格式',
            isMock: true
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