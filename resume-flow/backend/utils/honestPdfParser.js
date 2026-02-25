const fs = require('fs');
const path = require('path');

class HonestPdfParser {
    constructor() {
        this.supportedFormats = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    }

    // 诚实的文件解析 - 明确说明限制
    async parseFileHonestly(filePath, fileName, fileType) {
        try {
            // 读取文件基本信息
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            
            // 诚实地说明系统限制
            const limitations = this.getLimitations(fileType);
            
            // 尝试读取文件内容（对于文本文件）
            let textContent = '';
            let canReadContent = false;
            
            if (fileType.includes('text') || fileName.endsWith('.txt')) {
                try {
                    textContent = fs.readFileSync(filePath, 'utf8');
                    canReadContent = true;
                } catch (error) {
                    textContent = '无法读取文件内容';
                }
            } else {
                textContent = `由于技术限制，当前系统无法解析${fileType}格式的文件内容。`;
            }
            
            // 基于文件名生成示例数据（明确说明是示例）
            const exampleData = this.generateExampleData(fileName);
            
            return {
                success: true,
                honesty: {
                    canParseRealContent: canReadContent,
                    limitations: limitations,
                    isExampleData: !canReadContent,
                    note: canReadContent ? 
                        '系统成功读取了文本文件内容' : 
                        '以下数据是基于文件名的示例，并非真实解析结果'
                },
                fileInfo: {
                    fileName: fileName,
                    fileSize: fileSize,
                    fileType: fileType,
                    canRead: canReadContent
                },
                content: {
                    rawText: textContent,
                    exampleData: exampleData
                },
                metadata: {
                    title: fileName.replace(/\.[^\.]+$/, ''),
                    uploadTime: new Date().toISOString()
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                honesty: {
                    canParseRealContent: false,
                    limitations: ['文件处理过程中发生错误'],
                    note: '文件处理失败'
                }
            };
        }
    }

    // 明确说明系统限制
    getLimitations(fileType) {
        const limitations = [
            '当前系统无法安装PDF解析库',
            '只能处理纯文本文件的内容',
            'PDF和Word文件只能读取基本信息'
        ];
        
        if (fileType.includes('pdf')) {
            limitations.push('PDF文件内容解析需要外部库支持');
            limitations.push('当前只能根据文件名生成示例数据');
        }
        
        if (fileType.includes('word') || fileType.includes('msword')) {
            limitations.push('Word文档解析需要专门的解析库');
            limitations.push('当前只能读取文件基本信息');
        }
        
        return limitations;
    }

    // 生成明确的示例数据
    generateExampleData(fileName) {
        // 从文件名提取可能的姓名
        const nameMatch = fileName.match(/([\u4e00-\u9fa5]{2,4})[\s\-_]*(简历|resume)?/i);
        const possibleName = nameMatch && nameMatch[1] ? nameMatch[1] : '示例用户';
        
        return {
            note: '⚠️ 这是基于文件名的示例数据，并非真实解析结果',
            personalInfo: {
                name: possibleName,
                email: `${possibleName.toLowerCase()}@example.com`,
                phone: '13800000000',
                expectedPosition: this.guessPosition(fileName)
            },
            education: [
                {
                    institution: '示例大学',
                    major: '计算机科学',
                    degree: '本科',
                    duration: '2018-2022'
                }
            ],
            workExperience: [
                {
                    company: '示例公司',
                    position: '软件工程师',
                    duration: '2022-至今',
                    description: '这是示例工作经历描述'
                }
            ],
            skills: ['示例技能1', '示例技能2', '示例技能3']
        };
    }

    // 根据文件名猜测岗位
    guessPosition(fileName) {
        if (fileName.includes('前端') || fileName.includes('UI') || fileName.includes('UX')) {
            return '前端工程师';
        } else if (fileName.includes('后端') || fileName.includes('Java') || fileName.includes('Python')) {
            return '后端工程师';
        } else if (fileName.includes('产品') || fileName.includes('PM')) {
            return '产品经理';
        } else if (fileName.includes('设计') || fileName.includes('设计师')) {
            return 'UI/UX设计师';
        } else if (fileName.includes('测试') || fileName.includes('QA')) {
            return '测试工程师';
        } else {
            return '软件工程师';
        }
    }

    // 检查是否支持的文件格式
    isSupportedFormat(fileType) {
        return this.supportedFormats.includes(fileType);
    }

    // 获取系统能力信息
    getSystemCapabilities() {
        return {
            canParsePdf: false,
            canParseWord: false,
            canParseText: true,
            requiresExternalLibraries: true,
            limitations: [
                '需要pdf-parse库来解析PDF文件',
                '需要mammoth或类似库来解析Word文档',
                '当前环境无法安装这些依赖库'
            ],
            honestNote: '当前系统只能处理文本文件，其他格式只能提供示例数据'
        };
    }
}

module.exports = new HonestPdfParser();