const fs = require('fs');
const path = require('path');

class TransparentParser {
    constructor() {
        this.capabilities = this.getSystemCapabilities();
    }

    // 完全透明的文件解析
    async parseFileTransparently(filePath, fileName, fileType) {
        const result = {
            success: true,
            transparency: {
                systemCapabilities: this.capabilities,
                fileType: fileType,
                canParseContent: this.canParseContent(fileType),
                limitations: this.getSpecificLimitations(fileType),
                honestAssessment: this.getHonestAssessment(fileType)
            },
            fileInfo: {
                fileName: fileName,
                fileType: fileType,
                fileSize: fs.statSync(filePath).size,
                uploadTime: new Date().toISOString()
            },
            content: {},
            suggestions: []
        };

        // 根据文件类型处理
        if (this.canParseContent(fileType)) {
            // 可以解析的内容（文本文件）
            try {
                const textContent = fs.readFileSync(filePath, 'utf8');
                result.content.rawText = textContent;
                result.content.parsedData = this.parseTextContent(textContent);
                result.transparency.note = '✅ 系统成功读取了文本文件内容';
            } catch (error) {
                result.success = false;
                result.error = `读取文件内容失败: ${error.message}`;
                result.transparency.note = '❌ 文件内容读取失败';
            }
        } else {
            // 无法解析的内容（PDF/Word等）
            result.content.rawText = '⚠️ 当前系统无法解析此文件格式的内容';
            result.content.exampleData = this.generateTransparentExample(fileName);
            result.transparency.note = '⚠️ 以下为基于文件名的示例数据，非真实解析结果';
            result.suggestions = this.getImprovementSuggestions(fileType);
        }

        return result;
    }

    // 检查是否可以解析内容
    canParseContent(fileType) {
        return fileType.includes('text') || fileType === 'application/octet-stream';
    }

    // 获取系统能力信息
    getSystemCapabilities() {
        return {
            canParsePdf: false,
            canParseWord: false,
            canParseText: true,
            requiresExternalLibraries: true,
            currentLimitations: [
                '无法安装PDF解析库（pdf-parse）',
                '无法安装Word解析库（mammoth）',
                '权限限制导致依赖安装失败',
                '只能处理纯文本文件内容'
            ],
            honestStatement: '当前系统功能有限，无法真正解析PDF和Word文件'
        };
    }

    // 获取特定文件类型的限制
    getSpecificLimitations(fileType) {
        const limitations = [
            '系统基于当前环境限制开发',
            '无法安装必要的外部依赖库'
        ];

        if (fileType.includes('pdf')) {
            limitations.push('PDF解析需要pdf-parse库，当前无法安装');
            limitations.push('只能读取文件基本信息，无法提取内容');
        }

        if (fileType.includes('word') || fileType.includes('msword')) {
            limitations.push('Word文档解析需要专门的解析库');
            limitations.push('当前只能提供文件基本信息');
        }

        return limitations;
    }

    // 诚实的评估
    getHonestAssessment(fileType) {
        if (this.canParseContent(fileType)) {
            return {
                level: 'good',
                message: '可以处理此文件类型',
                confidence: '高'
            };
        } else {
            return {
                level: 'limited',
                message: '功能受限，无法解析内容',
                confidence: '示例数据，仅供参考'
            };
        }
    }

    // 解析文本内容
    parseTextContent(text) {
        // 简单的文本解析（只能处理格式良好的文本）
        const lines = text.split('\n').filter(line => line.trim());
        
        const result = {
            name: this.extractFromText(lines, ['姓名', '名字', 'Name']),
            email: this.extractEmail(text),
            phone: this.extractPhone(text),
            education: this.extractEducation(lines),
            workExperience: this.extractWorkExperience(lines),
            rawText: text.substring(0, 500) + (text.length > 500 ? '...' : '')
        };

        return result;
    }

    // 从文本中提取信息
    extractFromText(lines, keywords) {
        for (const line of lines) {
            for (const keyword of keywords) {
                if (line.includes(keyword)) {
                    const match = line.match(new RegExp(`${keyword}[：:\s]+([^\s]+)`));
                    if (match) return match[1];
                }
            }
        }
        return null;
    }

    extractEmail(text) {
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return emailMatch ? emailMatch[0] : null;
    }

    extractPhone(text) {
        const phoneMatch = text.match(/1[3-9]\d{9}/);
        return phoneMatch ? phoneMatch[0] : null;
    }

    extractEducation(lines) {
        // 简单的教育经历提取
        const education = [];
        for (const line of lines) {
            if (line.includes('大学') || line.includes('学院') || line.includes('学校')) {
                education.push({
                    institution: line.trim(),
                    note: '从文本中识别'
                });
            }
        }
        return education.slice(0, 3);
    }

    extractWorkExperience(lines) {
        // 简单的工作经历提取
        const experiences = [];
        for (const line of lines) {
            if (line.includes('公司') || line.includes('科技') || line.includes('企业')) {
                experiences.push({
                    company: line.trim(),
                    note: '从文本中识别'
                });
            }
        }
        return experiences.slice(0, 3);
    }

    // 生成透明的示例数据
    generateTransparentExample(fileName) {
        return {
            note: '⚠️ 重要说明：这是示例数据，并非真实解析结果',
            reason: '系统无法安装PDF/Word解析库，只能提供示例',
            basedOn: '文件名和常见简历格式',
            data: {
                personalInfo: {
                    name: this.guessNameFromFileName(fileName),
                    email: 'example@email.com',
                    phone: '13800000000',
                    expectedPosition: this.guessPosition(fileName)
                },
                education: [
                    {
                        institution: '示例大学',
                        major: '相关专业',
                        degree: '学士',
                        note: '示例数据'
                    }
                ],
                workExperience: [
                    {
                        company: '示例公司',
                        position: '相关职位',
                        duration: '2020-至今',
                        note: '示例数据'
                    }
                ]
            }
        };
    }

    // 从文件名猜测信息
    guessNameFromFileName(fileName) {
        const nameMatch = fileName.match(/([\u4e00-\u9fa5]{2,4})/);
        return nameMatch ? nameMatch[1] + '（猜测）' : '未知';
    }

    guessPosition(fileName) {
        if (fileName.includes('前端')) return '前端工程师（猜测）';
        if (fileName.includes('后端')) return '后端工程师（猜测）';
        if (fileName.includes('产品')) return '产品经理（猜测）';
        if (fileName.includes('设计')) return '设计师（猜测）';
        return '相关职位（猜测）';
    }

    // 改进建议
    getImprovementSuggestions(fileType) {
        const suggestions = [
            '建议上传.txt格式的文本简历',
            '系统可以正确处理纯文本文件内容'
        ];

        if (fileType.includes('pdf')) {
            suggestions.push('如需PDF解析，需要安装pdf-parse库');
            suggestions.push('当前环境权限限制无法安装依赖');
        }

        if (fileType.includes('word')) {
            suggestions.push('如需Word解析，需要安装mammoth库');
            suggestions.push('可以考虑将Word转换为PDF或文本格式');
        }

        return suggestions;
    }

    // 获取系统状态报告
    getSystemStatus() {
        return {
            timestamp: new Date().toISOString(),
            capabilities: this.capabilities,
            honestEvaluation: '系统功能有限，但完全透明',
            recommendation: '建议使用文本格式简历获得最佳体验'
        };
    }
}

module.exports = new TransparentParser();