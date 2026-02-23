const http = require('http');
const https = require('https');

// Ollama API配置
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = '';

/**
 * 调用本地Ollama模型解析简历
 * @param {string} resumeText - 简历文本内容
 * @returns {Promise<Object>} 解析结果
 */
async function parseResumeWithOllama(resumeText) {
    return new Promise((resolve, reject) => {
        try {
            console.log('🤖 调用本地Ollama模型解析简历...');
            
            const prompt = `请解析以下简历内容，提取结构化信息：

${resumeText}

请按照以下格式输出JSON：
{
    "name": "姓名",
    "phone": "电话",
    "email": "邮箱",
    "education": [
        {
            "institution": "学校",
            "degree": "学历",
            "major": "专业",
            "duration": "时间"
        }
    ],
    "workExperience": [
        {
            "company": "公司",
            "position": "职位",
            "duration": "时间",
            "description": "描述"
        }
    ],
    "skills": ["技能1", "技能2"]
}`;
            
            const postData = JSON.stringify({
                model: DEFAULT_MODEL,
                prompt: prompt,
                stream: false
            });
            
            const options = {
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        
                        if (result.response) {
                            // 尝试解析JSON
                            try {
                                const parsedResult = JSON.parse(result.response);
                                resolve({
                                    success: true,
                                    data: parsedResult,
                                    model: DEFAULT_MODEL,
                                    responseTime: result.total_duration / 1000000
                                });
                            } catch (error) {
                                // 如果JSON解析失败，返回原始文本
                                resolve({
                                    success: true,
                                    data: {
                                        rawText: result.response
                                    },
                                    model: DEFAULT_MODEL,
                                    responseTime: result.total_duration / 1000000,
                                    note: "返回结果不是JSON格式"
                                });
                            }
                        } else {
                            resolve({
                                success: false,
                                error: "模型未返回响应"
                            });
                        }
                        
                    } catch (error) {
                        console.error('❌ 解析Ollama响应失败:', error.message);
                        resolve({
                            success: false,
                            error: error.message
                        });
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ Ollama调用失败:', error.message);
                resolve({
                    success: false,
                    error: error.message
                });
            });
            
            req.write(postData);
            req.end();
            
        } catch (error) {
            console.error('❌ Ollama调用失败:', error.message);
            resolve({
                success: false,
                error: error.message
            });
        }
    });
}

/**
 * 检查Ollama服务状态
 * @returns {Promise<boolean>} 服务是否可用
 */
async function checkOllamaStatus() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 11434,
            path: '/api/tags',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            resolve(res.statusCode === 200);
        });
        
        req.on('error', (error) => {
            resolve(false);
        });
        
        req.end();
    });
}

/**
 * 拉取模型
 * @param {string} modelName - 模型名称
 * @returns {Promise<Object>} 拉取结果
 */
async function pullModel(modelName) {
    try {
        const response = await axios.post('http://localhost:11434/api/pull', {
            name: modelName
        }, {
            responseType: 'stream'
        });
        
        return {
            success: true,
            message: `模型 ${modelName} 拉取中`
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    parseResumeWithOllama,
    checkOllamaStatus,
    pullModel
};