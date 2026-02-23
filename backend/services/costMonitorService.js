const fs = require('fs').promises;
const path = require('path');
const dingtalkService = require('./dingtalkService');
const databaseService = require('./databaseService');

class CostMonitorService {
    constructor() {
        this.configPath = path.join(__dirname, '../api-configs.json');
        this.alertCooldown = 60000;
        this.lastAlertTime = {};
    }

    async checkAndAlert(modelName, modelType, cost, usage) {
        if (cost === '收费' || cost === '付费') {
            const now = Date.now();
            const lastAlert = this.lastAlertTime[modelName] || 0;
            
            if (now - lastAlert > this.alertCooldown) {
                this.lastAlertTime[modelName] = now;
                
                const message = `⚠️ 付费模型被调用\n` +
                    `- 模型: ${modelName}\n` +
                    `- 类型: ${modelType}\n` +
                    `- Token: ${usage ? `${usage.prompt_tokens || 0} + ${usage.completion_tokens || 0}` : '未知'}\n` +
                    `- 时间: ${new Date().toLocaleString('zh-CN')}\n` +
                    `- 建议: 立即检查免费模型是否失效`;
                
                dingtalkService.sendMarkdown('付费模型告警', message).catch(() => {});
                
                console.log(`💰 [费用告警] 付费模型 ${modelName} 被调用`);
            }
            
            return true;
        }
        return false;
    }

    async disablePaidModels() {
        try {
            const configs = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            let disabled = [];
            
            for (const config of configs) {
                if (config.cost === '收费' || config.cost === '付费') {
                    if (config.enabled) {
                        config.enabled = false;
                        disabled.push(config.name);
                    }
                }
            }
            
            if (disabled.length > 0) {
                await fs.writeFile(this.configPath, JSON.stringify(configs, null, 2));
                
                const message = `🚨 已自动禁用付费模型\n` +
                    `- 模型: ${disabled.join(', ')}\n` +
                    `- 时间: ${new Date().toLocaleString('zh-CN')}`;
                
                dingtalkService.sendMarkdown('付费模型已禁用', message).catch(() => {});
                
                console.log(`🛑 [自动禁用] 已禁用付费模型: ${disabled.join(', ')}`);
            }
            
            return disabled;
        } catch (error) {
            console.error('禁用付费模型失败:', error);
            return [];
        }
    }

    logUsage(modelName, modelType, cost, usage, success) {
        const log = {
            time: new Date().toISOString(),
            model: modelName,
            type: modelType,
            cost: cost,
            usage: usage,
            success: success
        };
        
        databaseService.saveApiUsage(modelName, modelType, cost, usage, success);
        
        console.log(`📊 [使用记录] ${modelName} | ${cost} | ${success ? '成功' : '失败'}`);
        
        return log;
    }
}

module.exports = new CostMonitorService();
