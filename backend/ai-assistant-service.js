const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AIAssistantService {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.backendPath = path.join(this.projectRoot, 'backend');
        this.frontendPath = path.join(this.projectRoot, 'frontend');
        this.databasePath = path.join(this.backendPath, 'database');
        this.tasks = new Map();
        this.taskHistory = [];
    }

    // 分析项目结构
    async analyzeProject() {
        const analysis = {
            timestamp: new Date().toISOString(),
            projectStructure: {},
            fileStats: {},
            issues: [],
            recommendations: []
        };

        try {
            // 分析后端结构
            analysis.projectStructure.backend = await this.analyzeDirectory(this.backendPath);
            analysis.fileStats.backend = await this.getFileStats(this.backendPath);
            
            // 分析前端结构
            analysis.projectStructure.frontend = await this.analyzeDirectory(this.frontendPath);
            analysis.fileStats.frontend = await this.getFileStats(this.frontendPath);
            
            // 检查常见问题
            analysis.issues = await this.checkForIssues();
            
            // 生成优化建议
            analysis.recommendations = await this.generateRecommendations(analysis);
            
            return {
                success: true,
                data: analysis,
                summary: `项目分析完成：发现 ${analysis.issues.length} 个问题，${analysis.recommendations.length} 条建议`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: '项目分析失败'
            };
        }
    }

    // 分析目录结构
    async analyzeDirectory(dirPath) {
        const structure = {};
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    structure[item] = await this.analyzeDirectory(itemPath);
                } else {
                    structure[item] = {
                        type: 'file',
                        size: stats.size,
                        modified: stats.mtime,
                        extension: path.extname(item)
                    };
                }
            }
        } catch (error) {
            console.error(`分析目录失败: ${dirPath}`, error);
        }
        
        return structure;
    }

    // 获取文件统计信息
    async getFileStats(dirPath) {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            byExtension: {},
            largestFiles: []
        };

        try {
            const files = this.getAllFiles(dirPath);
            stats.totalFiles = files.length;
            
            for (const file of files) {
                const fileStats = fs.statSync(file);
                stats.totalSize += fileStats.size;
                
                const ext = path.extname(file) || '无扩展名';
                if (!stats.byExtension[ext]) {
                    stats.byExtension[ext] = { count: 0, totalSize: 0 };
                }
                stats.byExtension[ext].count++;
                stats.byExtension[ext].totalSize += fileStats.size;
                
                stats.largestFiles.push({
                    path: file,
                    size: fileStats.size
                });
            }
            
            // 按大小排序
            stats.largestFiles.sort((a, b) => b.size - a.size).slice(0, 10);
            
        } catch (error) {
            console.error('获取文件统计失败:', error);
        }
        
        return stats;
    }

    // 递归获取所有文件
    getAllFiles(dirPath) {
        let results = [];
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    results = results.concat(this.getAllFiles(itemPath));
                } else {
                    results.push(itemPath);
                }
            }
        } catch (error) {
            console.error(`获取文件列表失败: ${dirPath}`, error);
        }
        
        return results;
    }

    // 检查常见问题
    async checkForIssues() {
        const issues = [];

        try {
            // 检查配置文件
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                issues.push({
                    type: '配置问题',
                    severity: 'high',
                    message: '缺少 package.json 文件',
                    suggestion: '创建项目配置文件'
                });
            }

            // 检查数据库文件
            const dbFiles = fs.readdirSync(this.databasePath);
            if (dbFiles.length === 0) {
                issues.push({
                    type: '数据问题',
                    severity: 'medium',
                    message: '数据库目录为空',
                    suggestion: '检查数据库初始化'
                });
            }

            // 检查大文件
            const largeFiles = this.findLargeFiles(this.projectRoot, 1024 * 1024); // 1MB
            if (largeFiles.length > 0) {
                issues.push({
                    type: '性能问题',
                    severity: 'low',
                    message: `发现 ${largeFiles.length} 个大文件可能影响性能`,
                    suggestion: '考虑优化大文件存储'
                });
            }

            // 检查日志文件
            const logFiles = this.findFilesByExtension(this.projectRoot, ['.log']);
            if (logFiles.length > 10) {
                issues.push({
                    type: '维护问题',
                    severity: 'low',
                    message: '日志文件数量较多',
                    suggestion: '考虑日志轮转和清理'
                });
            }

        } catch (error) {
            console.error('检查问题失败:', error);
        }
        
        return issues;
    }

    // 查找大文件
    findLargeFiles(dirPath, minSize) {
        const largeFiles = [];
        
        try {
            const files = this.getAllFiles(dirPath);
            
            for (const file of files) {
                const stats = fs.statSync(file);
                if (stats.size > minSize) {
                    largeFiles.push({
                        path: file,
                        size: stats.size
                    });
                }
            }
        } catch (error) {
            console.error('查找大文件失败:', error);
        }
        
        return largeFiles;
    }

    // 按扩展名查找文件
    findFilesByExtension(dirPath, extensions) {
        const matchedFiles = [];
        
        try {
            const files = this.getAllFiles(dirPath);
            
            for (const file of files) {
                const ext = path.extname(file);
                if (extensions.includes(ext)) {
                    matchedFiles.push(file);
                }
            }
        } catch (error) {
            console.error('按扩展名查找文件失败:', error);
        }
        
        return matchedFiles;
    }

    // 生成优化建议
    async generateRecommendations(analysis) {
        const recommendations = [];

        // 基于分析结果生成建议
        if (analysis.fileStats.backend.totalFiles > 50) {
            recommendations.push({
                type: '代码组织',
                priority: 'medium',
                message: '后端文件数量较多，建议模块化重构',
                action: '考虑按功能拆分模块'
            });
        }

        if (analysis.fileStats.frontend.totalSize > 5 * 1024 * 1024) {
            recommendations.push({
                type: '性能优化',
                priority: 'high',
                message: '前端资源文件较大，影响加载性能',
                action: '优化图片和资源文件'
            });
        }

        // 检查是否有未使用的文件
        const unusedFiles = await this.findUnusedFiles();
        if (unusedFiles.length > 0) {
            recommendations.push({
                type: '代码清理',
                priority: 'low',
                message: `发现 ${unusedFiles.length} 个可能未使用的文件`,
                action: '清理未使用的资源'
            });
        }

        return recommendations;
    }

    // 查找可能未使用的文件
    async findUnusedFiles() {
        // 简化版本：查找一些可能未使用的文件模式
        const patterns = ['test', 'temp', 'backup', 'old'];
        const unusedFiles = [];
        
        try {
            const files = this.getAllFiles(this.projectRoot);
            
            for (const file of files) {
                const fileName = path.basename(file).toLowerCase();
                
                for (const pattern of patterns) {
                    if (fileName.includes(pattern)) {
                        unusedFiles.push(file);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('查找未使用文件失败:', error);
        }
        
        return unusedFiles;
    }

    // 运行系统测试
    async runTests() {
        return new Promise((resolve) => {
            const testProcess = exec('npm test', { cwd: this.projectRoot }, (error, stdout, stderr) => {
                const result = {
                    timestamp: new Date().toISOString(),
                    success: !error,
                    output: stdout,
                    error: stderr
                };
                
                resolve(result);
            });
            
            // 设置超时
            setTimeout(() => {
                testProcess.kill();
                resolve({
                    success: false,
                    error: '测试超时',
                    output: ''
                });
            }, 30000); // 30秒超时
        });
    }

    // 检查系统状态
    async checkSystemStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            services: {},
            resources: {},
            health: 'healthy'
        };

        try {
            // 检查后端服务
            status.services.backend = await this.checkBackendService();
            
            // 检查前端服务
            status.services.frontend = await this.checkFrontendService();
            
            // 检查数据库
            status.services.database = await this.checkDatabase();
            
            // 检查系统资源
            status.resources = await this.checkSystemResources();
            
            // 计算整体健康状态
            const allServices = Object.values(status.services);
            const failedServices = allServices.filter(s => !s.healthy);
            
            if (failedServices.length > 0) {
                status.health = failedServices.length === allServices.length ? 'critical' : 'degraded';
            }
            
        } catch (error) {
            status.health = 'unknown';
            status.error = error.message;
        }
        
        return status;
    }

    // 检查后端服务状态
    async checkBackendService() {
        try {
            // 简化检查：查看后端文件是否存在
            const serverFile = path.join(this.backendPath, 'real-server-final.js');
            const exists = fs.existsSync(serverFile);
            
            return {
                name: '后端服务',
                healthy: exists,
                status: exists ? '运行中' : '未找到',
                details: exists ? '服务器文件存在' : '服务器文件缺失'
            };
        } catch (error) {
            return {
                name: '后端服务',
                healthy: false,
                status: '检查失败',
                error: error.message
            };
        }
    }

    // 检查前端服务状态
    async checkFrontendService() {
        try {
            const indexFile = path.join(this.frontendPath, 'enterprise-app.html');
            const exists = fs.existsSync(indexFile);
            
            return {
                name: '前端服务',
                healthy: exists,
                status: exists ? '可用' : '未找到',
                details: exists ? '主界面文件存在' : '主界面文件缺失'
            };
        } catch (error) {
            return {
                name: '前端服务',
                healthy: false,
                status: '检查失败',
                error: error.message
            };
        }
    }

    // 检查数据库状态
    async checkDatabase() {
        try {
            const dbFile = path.join(this.databasePath, 'resume_data.json');
            const exists = fs.existsSync(dbFile);
            
            let recordCount = 0;
            if (exists) {
                const dbContent = fs.readFileSync(dbFile, 'utf8');
                const dbData = JSON.parse(dbContent);
                recordCount = dbData.resumes ? Object.keys(dbData.resumes).length : 0;
            }
            
            return {
                name: '数据库',
                healthy: exists,
                status: exists ? '连接正常' : '未找到',
                details: exists ? `${recordCount} 条记录` : '数据库文件缺失',
                recordCount: recordCount
            };
        } catch (error) {
            return {
                name: '数据库',
                healthy: false,
                status: '检查失败',
                error: error.message
            };
        }
    }

    // 检查系统资源
    async checkSystemResources() {
        // 简化版本：检查磁盘空间
        try {
            const stats = fs.statSync(this.projectRoot);
            
            return {
                disk: {
                    total: '未知',
                    used: '未知',
                    available: '未知'
                },
                memory: {
                    usage: '未知'
                }
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    // 执行命令任务
    async executeCommand(command, options = {}) {
        const taskId = `cmd_${Date.now()}`;
        
        return new Promise((resolve) => {
            const task = {
                id: taskId,
                command: command,
                status: 'running',
                startTime: new Date(),
                output: ''
            };
            
            this.tasks.set(taskId, task);
            
            const process = exec(command, { 
                cwd: options.cwd || this.projectRoot,
                timeout: options.timeout || 60000
            }, (error, stdout, stderr) => {
                task.endTime = new Date();
                task.duration = task.endTime - task.startTime;
                task.output = stdout + (stderr ? '\n' + stderr : '');
                task.success = !error;
                task.status = 'completed';
                
                if (error) {
                    task.error = error.message;
                }
                
                this.taskHistory.push(task);
                this.tasks.delete(taskId);
                
                resolve(task);
            });
            
            // 实时输出处理（如果需要）
            if (options.realtimeOutput) {
                process.stdout.on('data', (data) => {
                    task.output += data;
                });
                
                process.stderr.on('data', (data) => {
                    task.output += data;
                });
            }
        });
    }

    // 获取任务状态
    getTaskStatus(taskId) {
        return this.tasks.get(taskId) || this.taskHistory.find(t => t.id === taskId);
    }

    // 获取所有任务
    getAllTasks() {
        const runningTasks = Array.from(this.tasks.values());
        return {
            running: runningTasks,
            history: this.taskHistory.slice(-10) // 最近10个任务
        };
    }
}

module.exports = AIAssistantService;