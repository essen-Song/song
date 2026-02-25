const EventEmitter = require('events');

class AIModelCluster extends EventEmitter {
    constructor() {
        super();
        
        // 集群配置
        this.config = {
            maxConcurrentRequests: 10,
            requestTimeout: 30000,
            healthCheckInterval: 30000,
            retryAttempts: 3,
            loadBalancingStrategy: 'weighted_round_robin'
        };
        
        // 模型节点池
        this.modelNodes = new Map();
        
        // 请求队列
        this.requestQueue = [];
        this.activeRequests = 0;
        
        // 性能统计
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            lastHealthCheck: Date.now()
        };
        
        // 启动健康检查
        this.startHealthChecks();
    }

    // 添加模型节点
    addModelNode(nodeConfig) {
        const nodeId = this.generateNodeId();
        
        const modelNode = {
            id: nodeId,
            name: nodeConfig.name,
            type: nodeConfig.type, // 'openai', 'claude', 'ernie', 'custom'
            endpoint: nodeConfig.endpoint,
            apiKey: nodeConfig.apiKey,
            weight: nodeConfig.weight || 1,
            maxTokens: nodeConfig.maxTokens || 4000,
            timeout: nodeConfig.timeout || 30000,
            
            // 状态管理
            status: 'active',
            lastUsed: Date.now(),
            responseTimes: [],
            errorCount: 0,
            successCount: 0,
            
            // 性能指标
            currentLoad: 0,
            healthScore: 100,
            
            // 配置
            config: nodeConfig
        };
        
        this.modelNodes.set(nodeId, modelNode);
        console.log(`✅ 添加模型节点: ${nodeConfig.name} (${nodeId})`);
        
        return nodeId;
    }

    // 生成节点ID
    generateNodeId() {
        return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 负载均衡 - 选择最优节点
    selectOptimalNode() {
        const availableNodes = Array.from(this.modelNodes.values())
            .filter(node => node.status === 'active' && node.currentLoad < 0.8);
        
        if (availableNodes.length === 0) {
            throw new Error('没有可用的模型节点');
        }
        
        // 基于权重和健康分数的加权选择
        const weightedNodes = availableNodes.map(node => ({
            node,
            weight: node.weight * (node.healthScore / 100)
        }));
        
        const totalWeight = weightedNodes.reduce((sum, w) => sum + w.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const weighted of weightedNodes) {
            random -= weighted.weight;
            if (random <= 0) {
                return weighted.node;
            }
        }
        
        return weightedNodes[0].node;
    }

    // 处理请求
    async processRequest(requestData) {
        const requestId = this.generateRequestId();
        
        return new Promise(async (resolve, reject) => {
            const request = {
                id: requestId,
                data: requestData,
                timestamp: Date.now(),
                resolve,
                reject,
                attempts: 0
            };
            
            // 检查并发限制
            if (this.activeRequests >= this.config.maxConcurrentRequests) {
                this.requestQueue.push(request);
                console.log(`⏳ 请求 ${requestId} 进入队列，当前队列长度: ${this.requestQueue.length}`);
                return;
            }
            
            await this.executeRequest(request);
        });
    }

    // 执行请求
    async executeRequest(request) {
        this.activeRequests++;
        
        try {
            const selectedNode = this.selectOptimalNode();
            selectedNode.currentLoad++;
            selectedNode.lastUsed = Date.now();
            
            console.log(`🚀 执行请求 ${request.id} 使用节点: ${selectedNode.name}`);
            
            const startTime = Date.now();
            
            // 调用模型API
            const response = await this.callModelAPI(selectedNode, request.data);
            
            const responseTime = Date.now() - startTime;
            
            // 更新节点统计
            this.updateNodeStats(selectedNode, true, responseTime);
            
            // 更新集群统计
            this.stats.totalRequests++;
            this.stats.successfulRequests++;
            this.stats.averageResponseTime = 
                (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime) / 
                this.stats.successfulRequests;
            
            request.resolve({
                success: true,
                data: response,
                node: selectedNode.name,
                responseTime: responseTime,
                requestId: request.id
            });
            
        } catch (error) {
            request.attempts++;
            
            // 记录失败
            this.stats.totalRequests++;
            this.stats.failedRequests++;
            
            if (request.attempts < this.config.retryAttempts) {
                console.log(`🔄 请求 ${request.id} 重试 (${request.attempts}/${this.config.retryAttempts})`);
                setTimeout(() => this.executeRequest(request), 1000);
            } else {
                console.error(`❌ 请求 ${request.id} 最终失败`);
                request.reject({
                    success: false,
                    error: error.message,
                    attempts: request.attempts,
                    requestId: request.id
                });
            }
        } finally {
            this.activeRequests--;
            
            // 处理队列中的下一个请求
            if (this.requestQueue.length > 0 && this.activeRequests < this.config.maxConcurrentRequests) {
                const nextRequest = this.requestQueue.shift();
                console.log(`📤 从队列中取出请求 ${nextRequest.id}`);
                this.executeRequest(nextRequest);
            }
        }
    }

    // 调用模型API
    async callModelAPI(node, requestData) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), node.timeout);
        
        try {
            let response;
            
            switch (node.type) {
                case 'openai':
                    response = await this.callOpenAI(node, requestData, controller);
                    break;
                case 'claude':
                    response = await this.callClaude(node, requestData, controller);
                    break;
                case 'ernie':
                    response = await this.callErnie(node, requestData, controller);
                    break;
                case 'custom':
                    response = await this.callCustomAPI(node, requestData, controller);
                    break;
                default:
                    throw new Error(`不支持的模型类型: ${node.type}`);
            }
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`请求超时 (${node.timeout}ms)`);
            }
            
            throw error;
        }
    }

    // 调用OpenAI API
    async callOpenAI(node, requestData, controller) {
        const response = await fetch(node.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${node.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: requestData.messages,
                max_tokens: node.maxTokens,
                temperature: 0.7
            }),
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 调用Claude API
    async callClaude(node, requestData, controller) {
        const response = await fetch(node.endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': node.apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                messages: requestData.messages,
                max_tokens: node.maxTokens
            }),
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`Claude API错误: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.content[0].text;
    }

    // 调用文心一言API
    async callErnie(node, requestData, controller) {
        const response = await fetch(node.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${node.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: requestData.messages,
                stream: false
            }),
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`文心一言API错误: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.result;
    }

    // 调用自定义API
    async callCustomAPI(node, requestData, controller) {
        const response = await fetch(node.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': node.apiKey ? `Bearer ${node.apiKey}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error(`自定义API错误: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    // 更新节点统计
    updateNodeStats(node, success, responseTime) {
        node.responseTimes.push(responseTime);
        
        // 保持最近100个响应时间
        if (node.responseTimes.length > 100) {
            node.responseTimes.shift();
        }
        
        if (success) {
            node.successCount++;
            node.errorCount = Math.max(0, node.errorCount - 0.5);
        } else {
            node.errorCount++;
        }
        
        // 计算健康分数
        const successRate = node.successCount / (node.successCount + node.errorCount);
        const avgResponseTime = node.responseTimes.reduce((a, b) => a + b, 0) / node.responseTimes.length;
        
        node.healthScore = Math.round(
            successRate * 60 + 
            (Math.max(0, 1 - avgResponseTime / 10000)) * 40
        );
        
        node.currentLoad = Math.max(0, node.currentLoad - 1);
        
        // 如果健康分数过低，标记为不健康
        if (node.healthScore < 30) {
            node.status = 'unhealthy';
            console.warn(`⚠️ 节点 ${node.name} 健康分数过低: ${node.healthScore}`);
        }
    }

    // 生成请求ID
    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 健康检查
    async performHealthCheck() {
        console.log('🔍 执行集群健康检查...');
        
        for (const [nodeId, node] of this.modelNodes) {
            try {
                // 简单的ping检查
                const startTime = Date.now();
                const response = await fetch(node.endpoint, {
                    method: 'HEAD',
                    timeout: 5000
                });
                
                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    if (node.status !== 'active') {
                        node.status = 'active';
                        console.log(`✅ 节点 ${node.name} 恢复健康`);
                    }
                    this.updateNodeStats(node, true, responseTime);
                } else {
                    node.status = 'unhealthy';
                    this.updateNodeStats(node, false, responseTime);
                }
                
            } catch (error) {
                node.status = 'unhealthy';
                this.updateNodeStats(node, false, 0);
                console.warn(`❌ 节点 ${node.name} 健康检查失败: ${error.message}`);
            }
        }
        
        this.stats.lastHealthCheck = Date.now();
    }

    // 启动健康检查
    startHealthChecks() {
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
        
        console.log('🩺 集群健康检查已启动');
    }

    // 获取集群状态
    getClusterStatus() {
        const nodes = Array.from(this.modelNodes.values()).map(node => ({
            id: node.id,
            name: node.name,
            type: node.type,
            status: node.status,
            healthScore: node.healthScore,
            currentLoad: node.currentLoad,
            successCount: node.successCount,
            errorCount: node.errorCount,
            avgResponseTime: node.responseTimes.length > 0 ? 
                node.responseTimes.reduce((a, b) => a + b, 0) / node.responseTimes.length : 0
        }));
        
        return {
            totalNodes: nodes.length,
            activeNodes: nodes.filter(n => n.status === 'active').length,
            unhealthyNodes: nodes.filter(n => n.status === 'unhealthy').length,
            nodes: nodes,
            stats: this.stats,
            queueLength: this.requestQueue.length,
            activeRequests: this.activeRequests
        };
    }

    // 移除节点
    removeNode(nodeId) {
        if (this.modelNodes.has(nodeId)) {
            this.modelNodes.delete(nodeId);
            console.log(`🗑️ 移除模型节点: ${nodeId}`);
            return true;
        }
        return false;
    }

    // 更新节点配置
    updateNode(nodeId, newConfig) {
        const node = this.modelNodes.get(nodeId);
        if (node) {
            Object.assign(node, newConfig);
            console.log(`⚙️ 更新节点配置: ${nodeId}`);
            return true;
        }
        return false;
    }
}

module.exports = AIModelCluster;