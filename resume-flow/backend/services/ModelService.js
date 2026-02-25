const ResumeParserModel = require('../models/ResumeParserModel');

class ModelService {
    constructor() {
        this.parserModel = new ResumeParserModel();
        this.modelCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    // 使用模型解析简历
    async parseResumeWithModel(text, fileName = '') {
        const cacheKey = this.generateCacheKey(text, fileName);
        
        // 检查缓存
        if (this.modelCache.has(cacheKey)) {
            const cached = this.modelCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 使用缓存模型结果');
                return cached.result;
            }
        }

        try {
            console.log('🧠 开始模型解析...');
            const startTime = Date.now();
            
            // 使用模型解析
            const modelResult = await this.parserModel.parseResume(text, fileName);
            
            const processingTime = Date.now() - startTime;
            modelResult.metadata.processingTime = processingTime;
            
            console.log(`✅ 模型解析完成，耗时: ${processingTime}ms`);
            
            // 缓存结果
            this.modelCache.set(cacheKey, {
                result: modelResult,
                timestamp: Date.now()
            });
            
            return modelResult;
            
        } catch (error) {
            console.error('❌ 模型解析失败:', error);
            
            // 返回错误但可用的回退结果
            return {
                error: error.message,
                fallback: this.generateFallbackResult(text, fileName),
                metadata: {
                    fileName: fileName,
                    textLength: text.length,
                    processingTime: 0,
                    modelVersion: '1.0.0',
                    status: 'error'
                }
            };
        }
    }

    // 生成缓存键
    generateCacheKey(text, fileName) {
        const textHash = this.simpleHash(text.substring(0, 100) + text.length);
        return `${fileName}_${textHash}`;
    }

    // 简单哈希函数
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }

    // 生成回退结果
    generateFallbackResult(text, fileName) {
        console.log('🔄 使用回退解析逻辑');
        
        // 简单的规则引擎回退
        const name = this.extractNameFallback(fileName);
        const email = this.extractEmailFallback(text);
        const phone = this.extractPhoneFallback(text);
        const education = this.extractEducationFallback(text);
        const workExperience = this.extractWorkExperienceFallback(text);
        const skills = this.extractSkillsFallback(text);
        
        return {
            predictions: {
                name: name,
                contact: { email, phone, confidence: 30 },
                education: { items: education, count: education.length, confidence: 25 },
                workExperience: { items: workExperience, count: workExperience.length, confidence: 25 },
                skills: { items: skills, count: skills.length, confidence: 20 }
            },
            confidence: { overall: 25, breakdown: { name: 30, contact: 30, education: 25, work: 25, skills: 20 } },
            quality: { score: 25, completeness: '不完整' },
            modelInsights: [
                { type: 'system', message: '模型解析失败，使用规则引擎回退', confidence: 0 }
            ]
        };
    }

    // 回退提取方法
    extractNameFallback(fileName) {
        const match = fileName.match(/([\u4e00-\u9fa5]{2,4})/);
        return {
            value: match ? match[1] : '',
            confidence: match ? 40 : 0,
            source: 'filename_fallback'
        };
    }

    extractEmailFallback(text) {
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return {
            value: match ? match[0] : '',
            confidence: match ? 60 : 0
        };
    }

    extractPhoneFallback(text) {
        const match = text.match(/1[3-9]\d{9}/);
        return {
            value: match ? match[0] : '',
            confidence: match ? 60 : 0
        };
    }

    extractEducationFallback(text) {
        const education = [];
        const patterns = [
            /([\u4e00-\u9fa5]+大学|[\u4e00-\u9fa5]+学院)/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                education.push({
                    institution: match[1] || match[0],
                    confidence: 50
                });
            }
        });
        
        return education.slice(0, 3);
    }

    extractWorkExperienceFallback(text) {
        const experiences = [];
        const patterns = [
            /([\u4e00-\u9fa5\w]+公司|[\u4e00-\u9fa5\w]+科技)/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                experiences.push({
                    company: match[1] || match[0],
                    confidence: 50
                });
            }
        });
        
        return experiences.slice(0, 3);
    }

    extractSkillsFallback(text) {
        const skills = new Set();
        const patterns = [
            /(JavaScript|Python|Java|React|Vue|MySQL|Docker)/gi
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(skill => skills.add(skill));
            }
        });
        
        return Array.from(skills);
    }

    // 获取模型状态
    getModelStatus() {
        return {
            status: 'active',
            version: '1.0.0',
            cacheSize: this.modelCache.size,
            cacheTimeout: this.cacheTimeout,
            models: this.parserModel.getModelStatus()
        };
    }

    // 清理缓存
    clearCache() {
        const beforeSize = this.modelCache.size;
        this.modelCache.clear();
        console.log(`🗑️ 清理模型缓存，释放 ${beforeSize} 个条目`);
        return beforeSize;
    }

    // 预热模型（可选）
    async warmUpModel() {
        console.log('🔥 预热模型...');
        
        // 使用简单文本预热
        const warmUpText = '姓名：张三\n邮箱：zhangsan@example.com\n电话：13800000000';
        
        try {
            await this.parseResumeWithModel(warmUpText, 'warmup.txt');
            console.log('✅ 模型预热完成');
        } catch (error) {
            console.warn('⚠️ 模型预热失败:', error.message);
        }
    }
}

module.exports = new ModelService();