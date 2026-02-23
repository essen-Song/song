const https = require('https');

const DINGTALK_WEBHOOK = 'https://oapi.dingtalk.com/robot/send?access_token=c584b8b3a71fe25f05f9b380be2bd196bd8eae5d44e52663bbf9dfdea934f169';

class DingTalkService {
    async sendText(content) {
        const message = {
            msgtype: 'text',
            text: {
                content: `通知：${content}`
            }
        };
        
        return this.send(message);
    }

    async sendMarkdown(title, content) {
        const message = {
            msgtype: 'markdown',
            markdown: {
                title: title,
                text: content
            }
        };
        
        return this.send(message);
    }

    async send(message) {
        return new Promise((resolve, reject) => {
            const url = new URL(DINGTALK_WEBHOOK);
            const data = JSON.stringify(message);
            
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };
            
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (result.errcode === 0) {
                            resolve({ success: true });
                        } else {
                            resolve({ success: false, error: result.errmsg });
                        }
                    } catch (e) {
                        resolve({ success: false, error: e.message });
                    }
                });
            });
            
            req.on('error', (e) => {
                resolve({ success: false, error: e.message });
            });
            
            req.write(data);
            req.end();
        });
    }

    async notifyResumeParsed(fileName, model, success) {
        const status = success ? '✅ 成功' : '❌ 失败';
        const title = '简历解析通知';
        const content = `## 简历解析${status}\n\n` +
            `- **文件**: ${fileName}\n` +
            `- **模型**: ${model}\n` +
            `- **时间**: ${new Date().toLocaleString('zh-CN')}\n`;
        
        return this.sendMarkdown(title, content);
    }

    async notifyError(module, error) {
        const title = '系统异常告警';
        const content = `## ⚠️ 系统异常\n\n` +
            `- **模块**: ${module}\n` +
            `- **错误**: ${error}\n` +
            `- **时间**: ${new Date().toLocaleString('zh-CN')}\n`;
        
        return this.sendMarkdown(title, content);
    }

    async notifySystemStatus(status, details) {
        const title = '系统状态通知';
        const content = `## 系统状态\n\n` +
            `- **状态**: ${status}\n` +
            `- **详情**: ${details}\n` +
            `- **时间**: ${new Date().toLocaleString('zh-CN')}\n`;
        
        return this.sendMarkdown(title, content);
    }
}

module.exports = new DingTalkService();
