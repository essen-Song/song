const http = require('http');
const url = require('url');
const querystring = require('querystring');
const AIAssistantService = require('./ai-assistant-service');

class AIAssistantServer {
    constructor(port = 3003) {
        this.port = port;
        this.assistant = new AIAssistantService();
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🤖 AI助手服务启动成功，端口: ${this.port}`);
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
            if (pathname === '/api/assistant/analyze' && method === 'GET') {
                await this.handleAnalyze(req, res);
            } else if (pathname === '/api/assistant/status' && method === 'GET') {
                await this.handleStatus(req, res);
            } else if (pathname === '/api/assistant/test' && method === 'POST') {
                await this.handleTest(req, res);
            } else if (pathname === '/api/assistant/command' && method === 'POST') {
                await this.handleCommand(req, res);
            } else if (pathname === '/api/assistant/tasks' && method === 'GET') {
                await this.handleGetTasks(req, res);
            } else if (pathname === '/api/assistant/task' && method === 'GET') {
                await this.handleGetTask(req, res, parsedUrl.query);
            } else if (pathname === '/api/assistant/chat' && method === 'POST') {
                await this.handleChat(req, res);
            } else {
                this.sendResponse(res, 404, { 
                    error: '接口不存在',
                    availableEndpoints: [
                        'GET /api/assistant/analyze - 分析项目',
                        'GET /api/assistant/status - 系统状态',
                        'POST /api/assistant/test - 运行测试',
                        'POST /api/assistant/command - 执行命令',
                        'GET /api/assistant/tasks - 任务列表',
                        'GET /api/assistant/task?id=xxx - 任务详情',
                        'POST /api/assistant/chat - 智能对话'
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

    // 处理项目分析请求
    async handleAnalyze(req, res) {
        console.log('🔍 开始分析项目...');
        
        const analysis = await this.assistant.analyzeProject();
        
        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: analysis
        });
    }

    // 处理系统状态检查
    async handleStatus(req, res) {
        console.log('📊 检查系统状态...');
        
        const status = await this.assistant.checkSystemStatus();
        
        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: status
        });
    }

    // 处理测试请求
    async handleTest(req, res) {
        console.log('🧪 开始运行测试...');
        
        const testResult = await this.assistant.runTests();
        
        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: testResult
        });
    }

    // 处理命令执行
    async handleCommand(req, res) {
        const body = await this.getRequestBody(req);
        
        if (!body.command) {
            this.sendResponse(res, 400, { 
                error: '缺少命令参数',
                example: { command: 'ls -la', cwd: './backend' }
            });
            return;
        }

        console.log(`💻 执行命令: ${body.command}`);
        
        const task = await this.assistant.executeCommand(body.command, {
            cwd: body.cwd,
            timeout: body.timeout,
            realtimeOutput: body.realtimeOutput
        });

        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: task
        });
    }

    // 处理获取任务列表
    async handleGetTasks(req, res) {
        const tasks = this.assistant.getAllTasks();
        
        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: tasks
        });
    }

    // 处理获取单个任务
    async handleGetTask(req, res, query) {
        if (!query.id) {
            this.sendResponse(res, 400, { 
                error: '缺少任务ID参数',
                example: '/api/assistant/task?id=cmd_1234567890'
            });
            return;
        }

        const task = this.assistant.getTaskStatus(query.id);
        
        if (!task) {
            this.sendResponse(res, 404, { 
                error: '任务不存在',
                taskId: query.id
            });
            return;
        }

        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: task
        });
    }

    // 处理智能对话
    async handleChat(req, res) {
        const body = await this.getRequestBody(req);
        
        if (!body.message) {
            this.sendResponse(res, 400, { 
                error: '缺少消息内容',
                example: { message: '分析一下项目结构' }
            });
            return;
        }

        console.log(`💬 处理消息: ${body.message}`);
        
        // 智能消息处理
        const response = await this.processChatMessage(body.message);
        
        this.sendResponse(res, 200, {
            success: true,
            timestamp: new Date().toISOString(),
            data: response
        });
    }

    // 智能消息处理逻辑
    async processChatMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // 分析项目相关
        if (lowerMessage.includes('分析') || lowerMessage.includes('analyze')) {
            const analysis = await this.assistant.analyzeProject();
            return {
                type: 'analysis',
                message: analysis.success ? 
                    `🔍 项目分析完成！\n📊 ${analysis.summary}` :
                    `❌ 分析失败: ${analysis.error}`,
                data: analysis
            };
        }
        
        // 状态检查相关
        if (lowerMessage.includes('状态') || lowerMessage.includes('status')) {
            const status = await this.assistant.checkSystemStatus();
            return {
                type: 'status',
                message: `📊 系统状态检查完成！\n🏥 健康状态: ${status.health}`,
                data: status
            };
        }
        
        // 测试相关
        if (lowerMessage.includes('测试') || lowerMessage.includes('test')) {
            const testResult = await this.assistant.runTests();
            return {
                type: 'test',
                message: testResult.success ?
                    `🧪 测试运行完成！\n✅ 所有测试通过` :
                    `❌ 测试失败: ${testResult.error}`,
                data: testResult
            };
        }
        
        // 部署相关
        if (lowerMessage.includes('部署') || lowerMessage.includes('deploy')) {
            return {
                type: 'deployment',
                message: '🚀 部署功能开发中...\n📋 当前支持：\n• 项目分析\n• 系统测试\n• 状态监控',
                action: '请使用具体命令进行部署操作'
            };
        }
        
        // 默认响应
        return {
            type: 'general',
            message: `🤖 收到您的消息："${message}"\n\n我可以帮您：\n• 🔍 分析项目结构和问题\n• 📊 检查系统状态和健康度\n• 🧪 运行测试和验证功能\n• 💻 执行系统命令和任务\n\n请告诉我具体需要什么帮助！`,
            suggestions: [
                '分析项目结构',
                '检查系统状态', 
                '运行系统测试',
                '查看任务列表'
            ]
        };
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('🛑 AI助手服务已停止');
            });
        }
    }
}

// 启动服务
if (require.main === module) {
    const server = new AIAssistantServer(3003);
    server.start();
    
    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n🛑 收到关闭信号，正在停止服务...');
        server.stop();
        process.exit(0);
    });
}

module.exports = AIAssistantServer;