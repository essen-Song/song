class PromptEngineeringService {
    constructor() {
        // 提示词模板库
        this.promptTemplates = {
            // 简历解析模板
            resumeParse: {
                basic: `你是一个专业的简历解析专家。请从以下简历内容中提取结构化信息：

简历内容：
{{resumeText}}

请返回JSON格式的结果，包含以下字段：
- personalInfo: {name, email, phone, location, summary}
- education: [{institution, degree, major, duration, gpa}]
- workExperience: [{company, position, duration, description, achievements}]
- skills: {technical: [], soft: [], certifications: []}
- languages: [{language, proficiency}]
- projects: [{name, description, technologies, duration}]`,
                
                detailed: `你是一个资深HR专家，请深度解析以下简历：

文件名：{{fileName}}
简历内容：
{{resumeText}}

请提供详细的解析报告，包括：
1. 个人信息完整性评估
2. 教育背景质量分析
3. 工作经历亮点提取
4. 技能匹配度分析
5. 职业发展建议
6. 潜在问题识别

返回格式要求：JSON`
            },
            
            // 简历优化模板
            resumeOptimize: {
                basic: `你是一个专业的简历优化专家。请优化以下简历：

目标职位：{{targetPosition}}
当前简历：
{{resumeData}}

优化方向：
1. 关键词匹配度提升
2. 成就量化描述
3. 专业性语言优化
4. 结构逻辑调整
5. ATS友好性改进`,
                
                advanced: `作为资深职业顾问，请对以下简历进行深度优化：

目标职位：{{targetPosition}}
行业要求：{{industryRequirements}}
简历信息：
{{resumeData}}

请提供：
1. 逐项优化建议
2. 优化前后对比
3. 行业特定关键词
4. 量化成就示例
5. 职业故事线构建`
            },
            
            // 面试问题生成模板
            interviewQuestions: {
                technical: `作为技术面试官，请为以下候选人生成技术面试问题：

目标职位：{{position}}
候选人技能：{{skills}}
工作经历：{{workExperience}}

请生成：
1. 基础技术问题（3-5个）
2. 高级技术问题（3-5个）
3. 系统设计问题（1-2个）
4. 编码实践问题（2-3个）`,
                
                behavioral: `作为行为面试专家，请基于STAR方法生成行为面试问题：

目标职位：{{position}}
候选人经历：{{experience}}

请生成：
1. 团队合作相关问题
2. 问题解决相关问题
3. 领导力相关问题
4. 压力应对相关问题
5. 成就展示相关问题`
            },
            
            // 面试评估模板
            interviewEvaluation: {
                star: `请使用STAR方法评估以下面试回答：

问题：{{question}}
回答：{{answer}}

请评估：
1. Situation（情境）描述是否清晰
2. Task（任务）定义是否明确
3. Action（行动）描述是否具体
4. Result（结果）是否可量化
5. 整体回答质量评分（1-10分）`,
                
                comprehensive: `作为资深面试官，请全面评估以下面试表现：

候选人信息：{{candidateInfo}}
面试问题及回答：{{qaPairs}}

评估维度：
1. 技术能力匹配度
2. 沟通表达能力
3. 问题解决能力
4. 团队合作潜力
5. 文化适应性
6. 总体推荐程度`
            }
        };
        
        // 模型特定优化
        this.modelOptimizations = {
            openai: {
                temperature: 0.7,
                max_tokens: 2000,
                system_prompt: '你是一个专业的人工智能助手，请提供准确、专业的回答。'
            },
            claude: {
                temperature: 0.6,
                max_tokens: 3000,
                system_prompt: '你是一个专业的人工智能助手，请以专业、准确的方式回答问题。'
            },
            ernie: {
                temperature: 0.5,
                max_tokens: 2000,
                system_prompt: '你是一个专业的人工智能助手，请用中文提供准确、专业的回答。'
            }
        };
        
        // 上下文管理
        this.contextManager = new ContextManager();
    }

    // 构建优化提示词
    buildOptimizedPrompt(templateName, variables, modelType = 'openai') {
        const template = this.getTemplate(templateName);
        if (!template) {
            throw new Error(`提示词模板不存在: ${templateName}`);
        }
        
        // 填充变量
        let prompt = template;
        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), variables[key]);
        });
        
        // 应用模型特定优化
        const optimization = this.modelOptimizations[modelType] || this.modelOptimizations.openai;
        
        return {
            system: optimization.system_prompt,
            user: prompt,
            config: {
                temperature: optimization.temperature,
                max_tokens: optimization.max_tokens,
                model_type: modelType
            }
        };
    }

    // 获取模板
    getTemplate(templateName) {
        const parts = templateName.split('.');
        let current = this.promptTemplates;
        
        for (const part of parts) {
            if (current[part]) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return typeof current === 'string' ? current : null;
    }

    // 动态调整提示词
    adaptPromptBasedOnContext(originalPrompt, context) {
        let adaptedPrompt = originalPrompt;
        
        // 根据上下文调整提示词
        if (context.previousResponses && context.previousResponses.length > 0) {
            adaptedPrompt = this.addContextReference(adaptedPrompt, context.previousResponses);
        }
        
        if (context.userPreferences) {
            adaptedPrompt = this.applyUserPreferences(adaptedPrompt, context.userPreferences);
        }
        
        if (context.difficultyLevel) {
            adaptedPrompt = this.adjustDifficulty(adaptedPrompt, context.difficultyLevel);
        }
        
        return adaptedPrompt;
    }

    // 添加上下文引用
    addContextReference(prompt, previousResponses) {
        const contextSummary = previousResponses
            .slice(-3) // 最近3个响应
            .map((resp, index) => `之前的回答${index + 1}: ${resp.substring(0, 100)}...`)
            .join('\n');
        
        return `请参考以下上下文信息：\n${contextSummary}\n\n${prompt}`;
    }

    // 应用用户偏好
    applyUserPreferences(prompt, preferences) {
        let adjustedPrompt = prompt;
        
        if (preferences.detailLevel === 'high') {
            adjustedPrompt = adjustedPrompt.replace('请提供', '请详细提供');
        }
        
        if (preferences.format === 'bullet_points') {
            adjustedPrompt += '\n\n请使用列表格式回答，突出重点。';
        }
        
        if (preferences.language === 'chinese') {
            adjustedPrompt += '\n\n请使用中文回答。';
        }
        
        return adjustedPrompt;
    }

    // 调整难度级别
    adjustDifficulty(prompt, difficulty) {
        switch (difficulty) {
            case 'beginner':
                return prompt + '\n\n请用简单易懂的语言解释。';
            case 'advanced':
                return prompt + '\n\n请提供深入的专业分析。';
            case 'expert':
                return prompt + '\n\n请提供最前沿的技术见解。';
            default:
                return prompt;
        }
    }

    // 生成多轮对话提示词
    buildMultiTurnPrompt(conversationHistory, currentQuestion) {
        const messages = [];
        
        // 添加系统提示
        messages.push({
            role: 'system',
            content: '你是一个专业的面试教练，请根据对话历史提供连贯、专业的回答。'
        });
        
        // 添加历史对话
        conversationHistory.forEach(turn => {
            messages.push({
                role: 'user',
                content: turn.question
            });
            messages.push({
                role: 'assistant', 
                content: turn.answer
            });
        });
        
        // 添加当前问题
        messages.push({
            role: 'user',
            content: currentQuestion
        });
        
        return messages;
    }

    // 评估提示词质量
    evaluatePromptQuality(prompt) {
        const evaluation = {
            clarity: this.evaluateClarity(prompt),
            specificity: this.evaluateSpecificity(prompt),
            structure: this.evaluateStructure(prompt),
            length: prompt.length,
            suggestions: []
        };
        
        // 生成改进建议
        if (evaluation.clarity < 0.7) {
            evaluation.suggestions.push('提示词不够清晰，建议明确任务要求');
        }
        
        if (evaluation.specificity < 0.6) {
            evaluation.suggestions.push('提示词不够具体，建议添加更多细节');
        }
        
        if (prompt.length > 2000) {
            evaluation.suggestions.push('提示词过长，建议精简内容');
        }
        
        evaluation.overallScore = (evaluation.clarity + evaluation.specificity + evaluation.structure) / 3;
        
        return evaluation;
    }

    // 评估清晰度
    evaluateClarity(prompt) {
        const clarityIndicators = [
            /请/g, /要求/g, /必须/g, /确保/g,
            /明确/g, /具体/g, /详细/g
        ];
        
        let score = 0;
        clarityIndicators.forEach(indicator => {
            if (prompt.match(indicator)) {
                score += 0.1;
            }
        });
        
        return Math.min(1, score);
    }

    // 评估具体性
    evaluateSpecificity(prompt) {
        const specificityIndicators = [
            /\d+/g, // 数字
            /[\u4e00-\u9fa5]{2,4}/g, // 中文名词
            /[A-Z][a-z]+/g, // 专有名词
            /例如/g, /比如/g, /具体/g
        ];
        
        let score = 0;
        specificityIndicators.forEach(indicator => {
            const matches = prompt.match(indicator);
            if (matches) {
                score += matches.length * 0.05;
            }
        });
        
        return Math.min(1, score);
    }

    // 评估结构
    evaluateStructure(prompt) {
        const structureIndicators = [
            /\n\n/g, // 段落分隔
            /\d\./g, // 编号列表
            /-/g, // 项目符号
            /：/g, /:/g // 冒号分隔
        ];
        
        let score = 0;
        structureIndicators.forEach(indicator => {
            if (prompt.match(indicator)) {
                score += 0.2;
            }
        });
        
        return Math.min(1, score);
    }

    // 生成A/B测试提示词
    generateABTestPrompts(basePrompt, variations = 3) {
        const testPrompts = [];
        
        for (let i = 0; i < variations; i++) {
            let variant = basePrompt;
            
            switch (i) {
                case 0:
                    // 详细版本
                    variant = variant.replace('请提供', '请详细提供每一步的具体操作');
                    break;
                case 1:
                    // 简洁版本
                    variant = variant.replace(/请[^。]+。/g, '请简洁回答。');
                    break;
                case 2:
                    // 结构化版本
                    variant = variant + '\n\n请使用以下格式回答：\n1. 主要观点\n2. 详细说明\n3. 实际示例';
                    break;
            }
            
            testPrompts.push({
                id: `variant_${i + 1}`,
                prompt: variant,
                description: this.getVariantDescription(i)
            });
        }
        
        return testPrompts;
    }

    getVariantDescription(variantIndex) {
        const descriptions = [
            '详细解释版本',
            '简洁回答版本', 
            '结构化回答版本'
        ];
        return descriptions[variantIndex] || '标准版本';
    }
}

// 上下文管理器
class ContextManager {
    constructor() {
        this.conversationContexts = new Map();
        this.maxContextSize = 10;
    }

    // 添加上下文
    addContext(sessionId, context) {
        if (!this.conversationContexts.has(sessionId)) {
            this.conversationContexts.set(sessionId, []);
        }
        
        const contextList = this.conversationContexts.get(sessionId);
        contextList.push({
            timestamp: Date.now(),
            ...context
        });
        
        // 限制上下文大小
        if (contextList.length > this.maxContextSize) {
            contextList.shift();
        }
    }

    // 获取上下文
    getContext(sessionId, maxItems = 5) {
        const contextList = this.conversationContexts.get(sessionId) || [];
        return contextList.slice(-maxItems);
    }

    // 清除上下文
    clearContext(sessionId) {
        this.conversationContexts.delete(sessionId);
    }

    // 获取上下文摘要
    getContextSummary(sessionId) {
        const context = this.getContext(sessionId);
        if (context.length === 0) return '';
        
        return context
            .map((item, index) => `对话${index + 1}: ${item.content?.substring(0, 50)}...`)
            .join('\n');
    }
}

module.exports = new PromptEngineeringService();