const ClusterConfigManager = require('./ClusterConfigManager');

class ConfigAPI {
    constructor() {
        this.configManager = ClusterConfigManager;
    }

    // 处理配置API请求
    handleRequest(req, res) {
        const urlParts = req.url.split('/').filter(part => part);
        
        // API路由: /api/config/*
        if (urlParts.length < 3 || urlParts[0] !== 'api' || urlParts[1] !== 'config') {
            return this.sendError(res, 404, 'API端点不存在');
        }

        const endpoint = urlParts[2];
        
        try {
            switch (endpoint) {
                case 'status':
                    this.handleStatus(req, res);
                    break;
                case 'clusters':
                    this.handleClusters(req, res, urlParts);
                    break;
                case 'models':
                    this.handleModels(req, res, urlParts);
                    break;
                case 'export':
                    this.handleExport(req, res);
                    break;
                case 'reset':
                    this.handleReset(req, res);
                    break;
                default:
                    this.sendError(res, 404, '未知的配置端点');
            }
        } catch (error) {
            this.sendError(res, 500, error.message);
        }
    }

    // 获取系统状态
    handleStatus(req, res) {
        if (req.method !== 'GET') {
            return this.sendError(res, 405, '只支持GET请求');
        }

        const status = this.configManager.getSystemStatus();
        this.sendSuccess(res, {
            system: status,
            timestamp: new Date().toISOString()
        });
    }

    // 处理集群相关请求
    handleClusters(req, res, urlParts) {
        const clusterName = urlParts[3];
        
        switch (req.method) {
            case 'GET':
                if (clusterName) {
                    this.handleGetCluster(req, res, clusterName);
                } else {
                    this.handleGetAllClusters(req, res);
                }
                break;
            case 'PUT':
                if (clusterName) {
                    this.handleUpdateCluster(req, res, clusterName);
                } else {
                    this.sendError(res, 400, '需要指定集群名称');
                }
                break;
            default:
                this.sendError(res, 405, '不支持的HTTP方法');
        }
    }

    // 获取所有集群
    handleGetAllClusters(req, res) {
        const config = this.configManager.getConfig();
        this.sendSuccess(res, {
            clusters: config.clusters,
            total: Object.keys(config.clusters).length
        });
    }

    // 获取特定集群
    handleGetCluster(req, res, clusterName) {
        const config = this.configManager.getConfig();
        
        if (!config.clusters[clusterName]) {
            return this.sendError(res, 404, `集群不存在: ${clusterName}`);
        }

        this.sendSuccess(res, {
            cluster: config.clusters[clusterName],
            status: this.configManager.getClusterStatus(clusterName)[clusterName]
        });
    }

    // 更新集群配置
    handleUpdateCluster(req, res, clusterName) {
        this.parseRequestBody(req).then(clusterConfig => {
            const success = this.configManager.updateClusterConfig(clusterName, clusterConfig);
            
            if (success) {
                this.sendSuccess(res, {
                    message: '集群配置更新成功',
                    cluster: clusterName,
                    status: this.configManager.getClusterStatus(clusterName)[clusterName]
                });
            } else {
                this.sendError(res, 500, '集群配置更新失败');
            }
        }).catch(error => {
            this.sendError(res, 400, error.message);
        });
    }

    // 处理模型相关请求
    handleModels(req, res, urlParts) {
        const clusterName = urlParts[3];
        const modelId = urlParts[4];
        
        if (!clusterName) {
            return this.sendError(res, 400, '需要指定集群名称');
        }

        switch (req.method) {
            case 'GET':
                if (modelId) {
                    this.handleGetModel(req, res, clusterName, modelId);
                } else {
                    this.handleGetClusterModels(req, res, clusterName);
                }
                break;
            case 'POST':
                this.handleAddModel(req, res, clusterName);
                break;
            case 'PUT':
                if (modelId) {
                    this.handleUpdateModel(req, res, clusterName, modelId);
                } else {
                    this.sendError(res, 400, '需要指定模型ID');
                }
                break;
            case 'DELETE':
                if (modelId) {
                    this.handleDeleteModel(req, res, clusterName, modelId);
                } else {
                    this.sendError(res, 400, '需要指定模型ID');
                }
                break;
            default:
                this.sendError(res, 405, '不支持的HTTP方法');
        }
    }

    // 获取集群所有模型
    handleGetClusterModels(req, res, clusterName) {
        const config = this.configManager.getConfig();
        
        if (!config.clusters[clusterName]) {
            return this.sendError(res, 404, `集群不存在: ${clusterName}`);
        }

        this.sendSuccess(res, {
            cluster: clusterName,
            models: config.clusters[clusterName].models,
            total: config.clusters[clusterName].models.length
        });
    }

    // 获取特定模型
    handleGetModel(req, res, clusterName, modelId) {
        const config = this.configManager.getConfig();
        
        if (!config.clusters[clusterName]) {
            return this.sendError(res, 404, `集群不存在: ${clusterName}`);
        }

        const model = config.clusters[clusterName].models.find(m => m.id === modelId);
        if (!model) {
            return this.sendError(res, 404, `模型不存在: ${modelId}`);
        }

        this.sendSuccess(res, { model });
    }

    // 添加模型到集群
    handleAddModel(req, res, clusterName) {
        this.parseRequestBody(req).then(modelConfig => {
            const success = this.configManager.addModelToCluster(clusterName, modelConfig);
            
            if (success) {
                this.sendSuccess(res, {
                    message: '模型添加成功',
                    cluster: clusterName,
                    model: modelConfig
                });
            } else {
                this.sendError(res, 500, '模型添加失败');
            }
        }).catch(error => {
            this.sendError(res, 400, error.message);
        });
    }

    // 更新模型配置
    handleUpdateModel(req, res, clusterName, modelId) {
        this.parseRequestBody(req).then(modelConfig => {
            const success = this.configManager.updateModelConfig(clusterName, modelId, modelConfig);
            
            if (success) {
                this.sendSuccess(res, {
                    message: '模型配置更新成功',
                    cluster: clusterName,
                    modelId: modelId
                });
            } else {
                this.sendError(res, 500, '模型配置更新失败');
            }
        }).catch(error => {
            this.sendError(res, 400, error.message);
        });
    }

    // 删除模型
    handleDeleteModel(req, res, clusterName, modelId) {
        try {
            const success = this.configManager.removeModelFromCluster(clusterName, modelId);
            
            if (success) {
                this.sendSuccess(res, {
                    message: '模型删除成功',
                    cluster: clusterName,
                    modelId: modelId
                });
            } else {
                this.sendError(res, 500, '模型删除失败');
            }
        } catch (error) {
            this.sendError(res, 400, error.message);
        }
    }

    // 导出配置
    handleExport(req, res) {
        if (req.method !== 'GET') {
            return this.sendError(res, 405, '只支持GET请求');
        }

        const exportData = this.configManager.exportConfig();
        this.sendSuccess(res, exportData);
    }

    // 重置配置
    handleReset(req, res) {
        if (req.method !== 'POST') {
            return this.sendError(res, 405, '只支持POST请求');
        }

        try {
            const success = this.configManager.resetConfig();
            
            if (success) {
                this.sendSuccess(res, {
                    message: '配置重置成功',
                    config: this.configManager.getConfig()
                });
            } else {
                this.sendError(res, 500, '配置重置失败');
            }
        } catch (error) {
            this.sendError(res, 500, error.message);
        }
    }

    // 解析请求体
    parseRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    if (!body) {
                        reject(new Error('请求体为空'));
                        return;
                    }
                    
                    const data = JSON.parse(body);
                    resolve(data);
                } catch (error) {
                    reject(new Error('JSON解析失败: ' + error.message));
                }
            });
            
            req.on('error', error => {
                reject(new Error('请求读取失败: ' + error.message));
            });
        });
    }

    // 发送成功响应
    sendSuccess(res, data) {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        res.end(JSON.stringify({
            success: true,
            ...data
        }));
    }

    // 发送错误响应
    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        res.end(JSON.stringify({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        }));
    }

    // 处理OPTIONS请求 (CORS预检)
    handleOptions(req, res) {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
    }
}

module.exports = new ConfigAPI();