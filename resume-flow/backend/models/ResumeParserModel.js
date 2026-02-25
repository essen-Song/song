const fs = require('fs');
const path = require('path');

class ResumeParserModel {
    constructor() {
        this.models = {
            nameExtractor: new NameExtractorModel(),
            contactExtractor: new ContactExtractorModel(),
            educationParser: new EducationParserModel(),
            workExperienceParser: new WorkExperienceParserModel(),
            skillRecognizer: new SkillRecognizerModel(),
            qualityAssessor: new QualityAssessmentModel()
        };
        
        this.modelWeights = {
            name: 0.2,
            contact: 0.15,
            education: 0.25,
            work: 0.25,
            skills: 0.15
        };
    }

    // 主解析方法
    async parseResume(text, fileName = '') {
        const results = {
            metadata: {
                fileName: fileName,
                textLength: text.length,
                processingTime: Date.now(),
                modelVersion: '1.0.0'
            },
            predictions: {},
            confidence: {},
            modelInsights: []
        };

        try {
            // 并行执行各个模型
            const modelPromises = [
                this.models.nameExtractor.extract(text, fileName),
                this.models.contactExtractor.extract(text),
                this.models.educationParser.parse(text),
                this.models.workExperienceParser.parse(text),
                this.models.skillRecognizer.recognize(text)
            ];

            const [nameResult, contactResult, educationResult, workResult, skillsResult] = await Promise.all(modelPromises);

            // 整合结果
            results.predictions = {
                name: nameResult,
                contact: contactResult,
                education: educationResult,
                workExperience: workResult,
                skills: skillsResult
            };

            // 计算置信度
            results.confidence = this.calculateOverallConfidence(results.predictions);
            
            // 生成模型洞察
            results.modelInsights = this.generateInsights(results.predictions);

            // 质量评估
            results.quality = await this.models.qualityAssessor.assess(results.predictions, text);

        } catch (error) {
            console.error('模型解析失败:', error);
            results.error = error.message;
            results.fallbackData = this.generateFallbackData(text, fileName);
        }

        return results;
    }

    // 计算整体置信度
    calculateOverallConfidence(predictions) {
        let totalWeightedConfidence = 0;
        let totalWeight = 0;

        Object.keys(this.modelWeights).forEach(key => {
            if (predictions[key] && predictions[key].confidence) {
                totalWeightedConfidence += predictions[key].confidence * this.modelWeights[key];
                totalWeight += this.modelWeights[key];
            }
        });

        return {
            overall: totalWeight > 0 ? Math.round(totalWeightedConfidence / totalWeight) : 0,
            breakdown: {
                name: predictions.name?.confidence || 0,
                contact: predictions.contact?.confidence || 0,
                education: predictions.education?.confidence || 0,
                work: predictions.workExperience?.confidence || 0,
                skills: predictions.skills?.confidence || 0
            }
        };
    }

    // 生成模型洞察
    generateInsights(predictions) {
        const insights = [];

        // 姓名识别洞察
        if (predictions.name && predictions.name.value) {
            insights.push({
                type: 'name',
                message: `成功识别姓名: ${predictions.name.value}`,
                confidence: predictions.name.confidence,
                suggestion: predictions.name.confidence < 70 ? '建议手动验证姓名准确性' : ''
            });
        }

        // 联系方式洞察
        if (predictions.contact) {
            const contactCount = Object.values(predictions.contact).filter(val => val).length;
            insights.push({
                type: 'contact',
                message: `识别到 ${contactCount} 个联系方式`,
                confidence: predictions.contact.confidence
            });
        }

        // 教育经历洞察
        if (predictions.education && predictions.education.items) {
            insights.push({
                type: 'education',
                message: `识别到 ${predictions.education.items.length} 个教育经历`,
                confidence: predictions.education.confidence
            });
        }

        // 工作经历洞察
        if (predictions.workExperience && predictions.workExperience.items) {
            insights.push({
                type: 'work',
                message: `识别到 ${predictions.workExperience.items.length} 个工作经历`,
                confidence: predictions.workExperience.confidence
            });
        }

        // 技能洞察
        if (predictions.skills && predictions.skills.items) {
            insights.push({
                type: 'skills',
                message: `识别到 ${predictions.skills.items.length} 个技能`,
                confidence: predictions.skills.confidence
            });
        }

        return insights;
    }

    // 生成回退数据
    generateFallbackData(text, fileName) {
        return {
            note: '模型解析失败，使用规则引擎回退',
            data: {
                name: this.extractNameFallback(fileName),
                email: this.extractEmailFallback(text),
                phone: this.extractPhoneFallback(text),
                rawText: text.substring(0, 500)
            },
            confidence: 30
        };
    }

    // 回退方法
    extractNameFallback(fileName) {
        const match = fileName.match(/([\u4e00-\u9fa5]{2,4})/);
        return match ? { value: match[1], confidence: 40 } : { value: '', confidence: 0 };
    }

    extractEmailFallback(text) {
        const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return match ? { value: match[0], confidence: 60 } : { value: '', confidence: 0 };
    }

    extractPhoneFallback(text) {
        const match = text.match(/1[3-9]\d{9}/);
        return match ? { value: match[0], confidence: 60 } : { value: '', confidence: 0 };
    }

    // 模型状态报告
    getModelStatus() {
        const status = {};
        Object.keys(this.models).forEach(modelName => {
            status[modelName] = {
                version: this.models[modelName].version || '1.0.0',
                status: 'active',
                lastTraining: '2026-02-17'
            };
        });
        return status;
    }
}

// 基础模型类
class BaseModel {
    constructor() {
        this.version = '1.0.0';
        this.trainingDataSize = 0;
    }

    // 计算置信度
    calculateConfidence(matches, totalPatterns) {
        if (totalPatterns === 0) return 0;
        return Math.min(100, Math.round((matches / totalPatterns) * 100));
    }

    // 验证结果
    validateResult(result, minConfidence = 50) {
        return result && result.confidence >= minConfidence;
    }
}

// 姓名提取模型
class NameExtractorModel extends BaseModel {
    async extract(text, fileName = '') {
        const patterns = [
            /(?:姓名|名字|Name)[:：\s]*([\u4e00-\u9fa5]{2,4})/i,
            /个人简历[\s\-\_]*([\u4e00-\u9fa5]{2,4})/i,
            /^[\s]*([\u4e00-\u9fa5]{2,4})[\s\n]/m
        ];

        let bestMatch = { value: '', confidence: 0 };

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const confidence = this.calculateNameConfidence(match[1]);
                if (confidence > bestMatch.confidence) {
                    bestMatch = { value: match[1], confidence };
                }
            }
        }

        // 从文件名提取回退
        if (bestMatch.confidence < 50 && fileName) {
            const fileNameMatch = fileName.match(/([\u4e00-\u9fa5]{2,4})[\s\-_]*(简历|resume)?/i);
            if (fileNameMatch && fileNameMatch[1]) {
                bestMatch = { 
                    value: fileNameMatch[1], 
                    confidence: 40,
                    source: 'filename'
                };
            }
        }

        return bestMatch;
    }

    calculateNameConfidence(name) {
        const commonSurnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
        let confidence = 50; // 基础置信度
        
        if (commonSurnames.some(surname => name.startsWith(surname))) {
            confidence += 30;
        }
        
        if (name.length >= 2 && name.length <= 4) {
            confidence += 20;
        }
        
        return Math.min(100, confidence);
    }
}

// 联系方式提取模型
class ContactExtractorModel extends BaseModel {
    async extract(text) {
        const email = this.extractEmail(text);
        const phone = this.extractPhone(text);
        
        const contactCount = [email, phone].filter(c => c.value).length;
        const confidence = this.calculateConfidence(contactCount, 2);

        return {
            email: email,
            phone: phone,
            confidence: confidence
        };
    }

    extractEmail(text) {
        const patterns = [
            /(?:邮箱|Email|E-mail)[:：\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const email = match[1] || match[0];
                return { value: email, confidence: 80 };
            }
        }

        return { value: '', confidence: 0 };
    }

    extractPhone(text) {
        const patterns = [
            /(?:手机|电话|Phone)[:：\s]*(1[3-9]\d{9})/i,
            /1[3-9]\d{9}/g
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const phone = match[1] || match[0];
                return { value: phone, confidence: 85 };
            }
        }

        return { value: '', confidence: 0 };
    }
}

// 教育经历解析模型
class EducationParserModel extends BaseModel {
    async parse(text) {
        const patterns = [
            /([\u4e00-\u9fa5]+大学|[\u4e00-\u9fa5]+学院)\s*([\u4e00-\u9fa5]+专业)?\s*(本科|硕士|博士)?/gi,
            /(清华大学|北京大学|复旦大学|上海交通大学|浙江大学)/gi
        ];

        const items = [];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                items.push({
                    institution: match[1] || match[0],
                    major: match[2] || '',
                    degree: match[3] || '本科',
                    confidence: 70
                });
            }
        });

        // 去重
        const uniqueItems = this.removeDuplicates(items);
        const confidence = this.calculateConfidence(uniqueItems.length, 5);

        return {
            items: uniqueItems.slice(0, 5),
            count: uniqueItems.length,
            confidence: confidence
        };
    }

    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = item.institution;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

// 工作经历解析模型
class WorkExperienceParserModel extends BaseModel {
    async parse(text) {
        const patterns = [
            /([\u4e00-\u9fa5\w]+公司|[\u4e00-\u9fa5\w]+科技)\s*([\u4e00-\u9fa5\w]+职位|[\u4e00-\u9fa5\w]+工程师)?/gi,
            /(阿里巴巴|腾讯|百度|字节跳动|美团|京东)/gi
        ];

        const items = [];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                items.push({
                    company: match[1] || match[0],
                    position: match[2] || '员工',
                    confidence: 65
                });
            }
        });

        const uniqueItems = this.removeDuplicates(items);
        const confidence = this.calculateConfidence(uniqueItems.length, 5);

        return {
            items: uniqueItems.slice(0, 5),
            count: uniqueItems.length,
            confidence: confidence
        };
    }

    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = item.company + '|' + item.position;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

// 技能识别模型
class SkillRecognizerModel extends BaseModel {
    async recognize(text) {
        const skillPatterns = [
            /(JavaScript|Python|Java|Go|C\+\+|C#|PHP|Ruby|Swift|Kotlin)/gi,
            /(React|Vue\.js|Angular|Node\.js|Spring|Django|Flask|Express)/gi,
            /(MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|Oracle)/gi,
            /(Docker|Kubernetes|Jenkins|Git|AWS|Azure|GCP)/gi
        ];

        const skills = new Set();
        
        skillPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(skill => skills.add(skill));
            }
        });

        const skillArray = Array.from(skills);
        const confidence = this.calculateConfidence(skillArray.length, 20);

        return {
            items: skillArray,
            count: skillArray.length,
            confidence: confidence
        };
    }
}

// 质量评估模型
class QualityAssessmentModel extends BaseModel {
    async assess(predictions, text) {
        let score = 0;
        let maxScore = 0;

        // 姓名评分
        if (predictions.name && predictions.name.value) {
            score += 20;
            maxScore += 20;
        }

        // 联系方式评分
        if (predictions.contact) {
            const contactCount = Object.values(predictions.contact).filter(val => val && val.value).length;
            score += Math.min(15, contactCount * 7.5);
            maxScore += 15;
        }

        // 教育经历评分
        if (predictions.education && predictions.education.items.length > 0) {
            score += Math.min(25, predictions.education.items.length * 8);
            maxScore += 25;
        }

        // 工作经历评分
        if (predictions.workExperience && predictions.workExperience.items.length > 0) {
            score += Math.min(25, predictions.workExperience.items.length * 8);
            maxScore += 25;
        }

        // 技能评分
        if (predictions.skills && predictions.skills.items.length > 0) {
            score += Math.min(15, predictions.skills.items.length * 3);
            maxScore += 15;
        }

        const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

        return {
            score: finalScore,
            breakdown: {
                name: predictions.name ? 20 : 0,
                contact: predictions.contact ? 15 : 0,
                education: predictions.education ? 25 : 0,
                work: predictions.workExperience ? 25 : 0,
                skills: predictions.skills ? 15 : 0
            },
            completeness: finalScore >= 70 ? '完整' : finalScore >= 40 ? '一般' : '不完整'
        };
    }
}

module.exports = ResumeParserModel;