const fs = require('fs');
const path = require('path');
const costMonitor = require('./costMonitorService');

const API_CONFIGS_FILE = path.join(__dirname, '../api-configs.json');

const DEFAULT_API_CONFIGS = [
  {
    id: 1,
    name: 'Ollama本地',
    type: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5:7b',
    enabled: true,
    priority: 1,
    cost: '免费'
  },
  {
    id: 2,
    name: 'aihubmix免费',
    type: 'aihubmix',
    baseUrl: 'https://aihubmix.com/v1',
    apiKey: '',
    model: 'step-3.5-flash-free',
    enabled: true,
    priority: 2,
    cost: '免费'
  },
  {
    id: 3,
    name: '豆包',
    type: 'doubao',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: '',
    endpointId: '',
    model: '',
    enabled: false,
    priority: 3,
    cost: '收费'
  }
];

function initFile() {
  if (!fs.existsSync(API_CONFIGS_FILE)) {
    fs.writeFileSync(API_CONFIGS_FILE, JSON.stringify(DEFAULT_API_CONFIGS, null, 2));
  }
}
initFile();

function readConfigs() {
  try {
    const data = fs.readFileSync(API_CONFIGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_API_CONFIGS;
  }
}

function saveConfigs(configs) {
  fs.writeFileSync(API_CONFIGS_FILE, JSON.stringify(configs, null, 2));
}

class APIConfigService {
  getConfigs() {
    return readConfigs();
  }

  getConfig(id) {
    const configs = readConfigs();
    return configs.find(c => c.id === parseInt(id));
  }

  getConfigByType(type) {
    const configs = readConfigs();
    return configs.find(c => c.type === type && c.enabled);
  }

  getEnabledConfigs() {
    const configs = readConfigs();
    return configs.filter(c => c.enabled);
  }

  addConfig(config) {
    const configs = readConfigs();
    const maxId = configs.reduce((max, c) => Math.max(max, c.id), 0);
    
    const newConfig = {
      id: maxId + 1,
      name: config.name,
      type: config.type || 'custom',
      baseUrl: config.baseUrl || '',
      apiKey: config.apiKey || '',
      model: config.model || '',
      enabled: config.enabled !== false
    };
    
    configs.push(newConfig);
    saveConfigs(configs);
    
    return { success: true, config: newConfig };
  }

  updateConfig(id, updates) {
    const configs = readConfigs();
    const config = configs.find(c => c.id === parseInt(id));
    
    if (config) {
      if (updates.apiKey !== undefined) config.apiKey = updates.apiKey;
      if (updates.baseUrl !== undefined) config.baseUrl = updates.baseUrl;
      if (updates.model !== undefined) config.model = updates.model;
      if (updates.enabled !== undefined) config.enabled = updates.enabled;
      if (updates.name !== undefined) config.name = updates.name;
      if (updates.endpointId !== undefined) config.endpointId = updates.endpointId;
      
      saveConfigs(configs);
      return { success: true, config };
    }
    
    return { success: false, error: '配置不存在' };
  }

  deleteConfig(id) {
    const configs = readConfigs();
    const index = configs.findIndex(c => c.id === parseInt(id));
    
    if (index > -1) {
      configs.splice(index, 1);
      saveConfigs(configs);
      return { success: true };
    }
    
    return { success: false, error: '配置不存在' };
  }

  async callAPI(configId, messages, options = {}) {
    const config = this.getConfig(configId);
    
    if (!config) {
      return { success: false, error: 'API配置不存在' };
    }
    
    if (!config.enabled) {
      return { success: false, error: 'API未启用' };
    }
    
    try {
      let response;
      
      if (config.type === 'ollama') {
        response = await this.callOllama(config, messages, options);
      } else if (config.type === 'deepseek') {
        response = await this.callDeepSeek(config, messages, options);
      } else if (config.type === 'doubao') {
        response = await this.callDoubao(config, messages, options);
      } else if (config.type === 'aihubmix') {
        response = await this.callAihubmix(config, messages, options);
      } else if (config.type === 'siliconflow') {
        response = await this.callSiliconflow(config, messages, options);
      } else {
        response = await this.callOpenAICompatible(config, messages, options);
      }
      
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async callAihubmix(config, messages, options) {
    if (!config.apiKey) {
      return { success: false, error: 'aihubmix API Key未配置' };
    }
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'step-3.5-flash-free',
        messages: messages,
        temperature: options.temperature || 0.7
      })
    });
    
    const data = await response.json();
    return { success: true, content: data.choices?.[0]?.message?.content || '' };
  }

  async callSiliconflow(config, messages, options) {
    if (!config.apiKey) {
      return { success: false, error: '硅基流动 API Key未配置' };
    }
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
        messages: messages,
        temperature: options.temperature || 0.7
      })
    });
    
    const data = await response.json();
    return { success: true, content: data.choices?.[0]?.message?.content || '' };
  }

  async callWithFallback(messages, options = {}) {
    const configs = this.getEnabledConfigs();
    const sortedConfigs = configs.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    
    const errors = [];
    
    for (const config of sortedConfigs) {
      console.log(`🔄 尝试使用模型: ${config.name} (优先级: ${config.priority}, 费用: ${config.cost || '未知'})`);
      
      try {
        const result = await this.callAPI(config.id, messages, options);
        
        if (result.success) {
          console.log(`✅ 模型调用成功: ${config.name}`);
          
          costMonitor.checkAndAlert(config.name, config.type, config.cost, result.usage);
          costMonitor.logUsage(config.name, config.type, config.cost, result.usage, true);
          
          return {
            ...result,
            usedModel: config.name,
            modelType: config.type,
            cost: config.cost || '未知'
          };
        } else {
          errors.push({ model: config.name, error: result.error });
          console.log(`⚠️ 模型调用失败: ${config.name} - ${result.error}`);
          costMonitor.logUsage(config.name, config.type, config.cost, null, false);
        }
      } catch (error) {
        errors.push({ model: config.name, error: error.message });
        console.log(`❌ 模型调用异常: ${config.name} - ${error.message}`);
        costMonitor.logUsage(config.name, config.type, config.cost, null, false);
      }
    }
    
    return {
      success: false,
      error: '所有模型调用失败',
      errors: errors
    };
  }

  async callOllama(config, messages, options) {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'qwen2.5:7b',
        messages: messages,
        stream: false
      })
    });
    
    const data = await response.json();
    return { success: true, content: data.message?.content || '' };
  }

  async callDeepSeek(config, messages, options) {
    if (!config.apiKey) {
      return { success: false, error: 'DeepSeek API Key未配置' };
    }
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: messages,
        temperature: options.temperature || 0.7
      })
    });
    
    const data = await response.json();
    return { success: true, content: data.choices?.[0]?.message?.content || '' };
  }

  async callDoubao(config, messages, options) {
    if (!config.apiKey || !config.endpointId) {
      return { success: false, error: '豆包API配置不完整' };
    }
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.endpointId,
        messages: messages
      })
    });
    
    const data = await response.json();
    return { success: true, content: data.choices?.[0]?.message?.content || '' };
  }

  async callOpenAICompatible(config, messages, options) {
    if (!config.apiKey) {
      return { success: false, error: 'API Key未配置' };
    }
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: options.temperature || 0.7
      })
    });
    
    const data = await response.json();
    return { success: true, content: data.choices?.[0]?.message?.content || '' };
  }
}

module.exports = new APIConfigService();
