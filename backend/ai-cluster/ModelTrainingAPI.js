const http = require('http');
const url = require('url');
const ModelTrainingService = require('./ModelTrainingService');

class ModelTrainingAPI {
    constructor(port = 3004) {
        this.port = port;
        this.trainingService = new ModelTrainingService();
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🤖 模型训练服务启动成功，端口: ${this.port}`);
            console.log(`📡 服务地址: http://localhost:${this.port}`);
        });

        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ 端口 ${this.port} 已被占用，尝试使用端口 ${this.port + 1}`);
                this.port += 1;
                this.start();
            } else {
                console.error('❌ 服务器启动失败:', error);
            }
        });
    }

    async handleRequest(req, res) {
        // 设置CORS头
        this.setCorsHeaders(res);

        // 处理OPTIONS请求
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method;

        try {
            // 路由处理
            if (pathname === '/api/training/status' && method === 'GET') {
                await this.handleGetStatus(req, res);
            } else if (pathname === '/api/training/train' && method === 'POST') {
                await this.handleTrainModel(req, res);
            } else if (pathname === '/api/training/train-all' && method === 'POST') {
                await this.handleTrainAllModels(req, res);
            } else if (pathname === '/api/training/data' && method === 'GET') {
                await this.handleGetTrainingData(req, res, parsedUrl.query);
            } else if (pathname === '/api/training/metrics' && method === 'GET') {
                await this.handleGetMetrics(req, res, parsedUrl.query);
            } else if (pathname === '/api/training/scenarios' && method === 'GET') {
                await this.handleGetScenarios(req, res, parsedUrl.query);
            } else {
                this.sendResponse(res, 404, { 
                    error: '接口不存在',
                    availableEndpoints: [
                        'GET /api/training/status - 获取所有模型状态',
                        'POST /api/training/train - 训练单个模型',
                        'POST /api/training/train-all - 批量训练所有模型',
                        'GET /api/training/data?module=xxx - 获取训练数据',
                        'GET /api/training/metrics?module=xxx - 获取训练指标',
                        'GET /api/training/scenarios?module=xxx - 获取训练场景'
                    ]
                });
            }
        } catch (error) {
            console.error('请求处理错误:', error);
            this.sendResponse(res, 500, { 
                error: '服务器内部错误',
                message: error.message 
            });
        }
    }

    setCorsHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode);
        res.end(JSON.stringify(data, null, 2));
    }

    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(new Error('无效的JSON数据'));
                }
            });
            req.on('error', reject);
        });
    }

    // 获取所有模型状态
    async handleGetStatus(req, res) {
        console.log('📊 获取模型训练状态...');
        
        const status = this.trainingService.getAllModelsStatus();
        
        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: status
        });
    }

    // 训练单个模型
    async handleTrainModel(req, res) {
        const body = await this.getRequestBody(req);
        
        if (!body.module) {
            this.sendResponse(res, 400, { 
                error: '缺少模块名称',
                example: { module: 'resume-parser', config: { epochs: 100 } }
            });
            return;
        }

        const validModules = ['resume-parser', 'resume-optimizer', 'interview-coach', 'job-matcher'];
        if (!validModules.includes(body.module)) {
            this.sendResponse(res, 400, { 
                error: '无效的模块名称',
                validModules: validModules
            });
            return;
        }

        console.log(`🚀 开始训练 ${body.module} 模型...`);
        
        try {
            const result = await this.trainingService.trainModel(body.module, body.config || {});
            
            this.sendResponse(res, 200, {
                success: true,
                timestamp: new Date().toISOString(),
                data: result
            });
        } catch (error) {
            this.sendResponse(res, 500, {
                success: false,
                error: error.message,
                module: body.module
            });
        }
    }

    // 批量训练所有模型
    async handleTrainAllModels(req, res) {
        console.log('🚀 开始批量训练所有模型...');
        
        try {
            const results = await this.trainingService.trainAllModels();
            
            this.sendResponse(res, 200, {
                success: true,
                timestamp: new Date().toISOString(),
                data: {
                    total: results.length,
                    completed: results.filter(r => r.status === 'completed').length,
                    failed: results.filter(r => r.status === 'failed').length,
                    results: results
                }
            });
        } catch (error) {
            this.sendResponse(res, 500, {
                success: false,
                error: error.message
            });
        }
    }

    // 获取训练数据
    async handleGetTrainingData(req, res, query) {
        if (!query.module) {
            this.sendResponse(res, 400, { 
                error: '缺少模块参数',
                example: '/api/training/data?module=resume-parser'
            });
            return;
        }

        console.log(`📋 获取 ${query.module} 训练数据...`);
        
        try {
            let trainingData;
            switch(query.module) {
                case 'resume-parser':
                    trainingData = await this.trainingService.generateResumeParserTrainingData();
                    break;
                case 'resume-optimizer':
                    trainingData = await this.trainingService.generateResumeOptimizerTrainingData();
                    break;
                case 'interview-coach':
                    trainingData = await this.trainingService.generateInterviewCoachTrainingData();
                    break;
                case 'job-matcher':
                    trainingData = await this.trainingService.generateJobMatcherTrainingData();
                    break;
                default:
                    throw new Error('无效的模块名称');
            }
            
            this.sendResponse(res, 200, {
                success: true,
                timestamp: new Date().toISOString(),
                data: trainingData
            });
        } catch (error) {
            this.sendResponse(res, 500, {
                success: false,
                error: error.message,
                module: query.module
            });
        }
    }

    // 获取训练指标
    async handleGetMetrics(req, res, query) {
        if (!query.module) {
            this.sendResponse(res, 400, { 
                error: '缺少模块参数',
                example: '/api/training/metrics?module=resume-parser'
            });
            return;
        }

        console.log(`📈 获取 ${query.module} 训练指标...`);
        
        const status = this.trainingService.getModelStatus(query.module);
        
        if (status.status !== 'completed') {
            this.sendResponse(res, 400, {
                success: false,
                error: '模型尚未完成训练',
                status: status.status
            });
            return;
        }

        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                module: query.module,
                metrics: status.metrics,
                trainingTime: status.endTime
            }
        });
    }

    // 获取训练场景
    async handleGetScenarios(req, res, query) {
        if (!query.module) {
            this.sendResponse(res, 400, { 
                error: '缺少模块参数',
                example: '/api/training/scenarios?module=resume-parser'
            });
            return;
        }

        console.log(`🎯 获取 ${query.module} 训练场景...`);
        
        try {
            // 这里可以返回模块的具体训练场景信息
            const scenarios = this.getModuleScenarios(query.module);
            
            this.sendResponse(res, 200, {
                success: true,
                timestamp: new Date().toISOString(),
                data: scenarios
            });
        } catch (error) {
            this.sendResponse(res, 500, {
                success: false,
                error: error.message,
                module: query.module
            });
        }
    }

    // 获取模块训练场景
    getModuleScenarios(moduleName) {
        const scenarios = {
            'resume-parser': [
                {
                    name: '基础信息提取',
                    description: '提取姓名、联系方式、邮箱等基础信息',
                    examples: 15,
                    difficulty: '简单'
                },
                {
                    name: '教育背景解析', 
                    description: '解析学历、学校、专业、时间等信息',
                    examples: 20,
                    difficulty: '中等'
                },
                {
                    name: '工作经历解析',
                    description: '解析公司、职位、时间、工作内容',
                    examples: 25,
                    difficulty: '中等'
                },
                {
                    name: '技能标签提取',
                    description: '提取技术栈和专业技能',
                    examples: 30,
                    difficulty: '困难'
                }
            ],
            'resume-optimizer': [
                {
                    name: 'ATS优化建议',
                    description: '针对ATS系统的优化建议',
                    examples: 12,
                    difficulty: '中等'
                },
                {
                    name: '行业定制优化',
                    description: '根据不同行业的优化建议',
                    examples: 18,
                    difficulty: '困难'
                },
                {
                    name: '技能描述优化',
                    description: '技能描述的优化和丰富',
                    examples: 22,
                    difficulty: '简单'
                }
            ],
            'interview-coach': [
                {
                    name: '技术面试问题生成',
                    description: '根据职位生成技术面试问题',
                    examples: 30,
                    difficulty: '中等'
                },
                {
                    name: '行为面试问题生成',
                    description: '基于STAR方法的行为面试问题',
                    examples: 25,
                    difficulty: '困难'
                },
                {
                    name: '回答评估和建议',
                    description: '评估面试回答并提供改进建议',
                    examples: 35,
                    difficulty: '困难'
                }
            ],
            'job-matcher': [
                {
                    name: '技能匹配度计算',
                    description: '计算简历技能与职位要求的匹配度',
                    examples: 28,
                    difficulty: '中等'
                },
                {
                    name: '薪资范围预测',
                    description: '根据经验和技能预测合理薪资范围',
                    examples: 20,
                    difficulty: '困难'
                },
                {
                    name: '职业发展建议',
                    description: '基于当前状况的职业发展路径建议',
                    examples: 15,
                    difficulty: '中等'
                }
            ]
        };

        return {
            module: moduleName,
            totalScenarios: scenarios[moduleName]?.length || 0,
            scenarios: scenarios[moduleName] || []
        };
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('🛑 模型训练服务已停止');
            });
        }
    }
}

// 启动服务
if (require.main === module) {
    const api = new ModelTrainingAPI(3004);
    api.start();
    
    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n🛑 收到关闭信号，正在停止服务...');
        api.stop();
        process.exit(0);
    });
}

module.exports = ModelTrainingAPI;