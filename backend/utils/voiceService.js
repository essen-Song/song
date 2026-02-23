const axios = require('axios');
const fs = require('fs');

/**
 * 语音服务
 * 集成阿里云ASR(语音识别)和TTS(语音合成)
 */
class VoiceService {
  constructor() {
    this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    this.ttsAppKey = process.env.ALIYUN_TTS_APP_KEY;
    
    this.asrEndpoint = 'https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr';
    this.ttsEndpoint = 'https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts';
    
    // 语音配置
    this.voiceConfig = {
      asr: {
        format: 'pcm',
        sample_rate: 16000,
        enable_intermediate_result: false,
        enable_punctuation_prediction: true,
        enable_inverse_text_normalization: true
      },
      tts: {
        voice: 'xiaoyun', // 默认女声
        format: 'mp3',
        sample_rate: 16000,
        volume: 50,
        speech_rate: 0,
        pitch_rate: 0
      }
    };
  }
  
  /**
   * 语音识别（语音转文字）
   */
  async speechToText(audioData, options = {}) {
    try {
      if (!this.accessKeyId || !this.accessKeySecret) {
        throw new Error('阿里云语音服务配置缺失');
      }
      
      const config = { ...this.voiceConfig.asr, ...options.asr };
      
      // 构建请求参数
      const params = {
        appkey: this.ttsAppKey,
        format: config.format,
        sample_rate: config.sample_rate,
        enable_intermediate_result: config.enable_intermediate_result,
        enable_punctuation_prediction: config.enable_punctuation_prediction,
        enable_inverse_text_normalization: config.enable_inverse_text_normalization
      };
      
      // 发送语音识别请求
      const response = await this.sendASRRequest(audioData, params);
      
      if (response.status === 200 && response.data) {
        const result = response.data;
        
        if (result.status === 20000000) {
          return {
            success: true,
            text: result.result,
            confidence: result.confidence || 0.9,
            words: result.words || [],
            duration: result.duration || 0
          };
        } else {
          throw new Error(`语音识别失败: ${result.status_text || '未知错误'}`);
        }
      } else {
        throw new Error('语音识别服务响应异常');
      }
      
    } catch (error) {
      console.error('语音识别失败:', error);
      
      // 返回模拟数据（用于演示）
      return {
        success: false,
        error: error.message,
        text: this.getMockSTTResult(),
        confidence: 0.85,
        words: [],
        duration: 0,
        mock: true
      };
    }
  }
  
  /**
   * 语音合成（文字转语音）
   */
  async textToSpeech(text, options = {}) {
    try {
      if (!this.accessKeyId || !this.accessKeySecret) {
        throw new Error('阿里云语音服务配置缺失');
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('合成文本不能为空');
      }
      
      const config = { ...this.voiceConfig.tts, ...options.tts };
      
      // 构建请求参数
      const params = {
        appkey: this.ttsAppKey,
        text: text,
        voice: config.voice,
        format: config.format,
        sample_rate: config.sample_rate,
        volume: config.volume,
        speech_rate: config.speech_rate,
        pitch_rate: config.pitch_rate
      };
      
      // 发送语音合成请求
      const audioData = await this.sendTTSRequest(params);
      
      return {
        success: true,
        audioData: audioData,
        format: config.format,
        sampleRate: config.sample_rate,
        duration: this.estimateDuration(text)
      };
      
    } catch (error) {
      console.error('语音合成失败:', error);
      
      // 返回模拟数据（用于演示）
      return {
        success: false,
        error: error.message,
        audioData: this.getMockTTSData(),
        format: 'mp3',
        sampleRate: 16000,
        duration: this.estimateDuration(text),
        mock: true
      };
    }
  }
  
  /**
   * 发送ASR请求
   */
  async sendASRRequest(audioData, params) {
    // 这里实现真实的阿里云ASR API调用
    // 由于涉及复杂的签名和认证过程，这里返回模拟响应
    
    return {
      status: 200,
      data: {
        status: 20000000,
        result: '这是一个模拟的语音识别结果',
        confidence: 0.95,
        words: ['这', '是', '一个', '模拟', '的', '语音', '识别', '结果'],
        duration: 3000
      }
    };
  }
  
  /**
   * 发送TTS请求
   */
  async sendTTSRequest(params) {
    // 这里实现真实的阿里云TTS API调用
    // 返回模拟的音频数据
    
    return Buffer.from('模拟的MP3音频数据');
  }
  
  /**
   * 获取模拟语音识别结果
   */
  getMockSTTResult() {
    const mockTexts = [
      '我在上一家公司主要负责用户增长相关工作，通过数据分析发现了用户流失的关键节点。',
      '我们团队有5个人，我主要负责前端开发和用户界面设计，项目最终获得了用户的好评。',
      '我具备扎实的技术基础，熟悉React、Vue等前端框架，也有后端开发经验。',
      '在上个项目中，我通过优化算法将系统响应时间从3秒缩短到1秒，用户体验大幅提升。',
      '我善于团队协作，能够与不同背景的同事有效沟通，共同推进项目进展。'
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  }
  
  /**
   * 获取模拟语音合成数据
   */
  getMockTTSData() {
    // 返回一个小的MP3文件头 + 模拟数据
    const mp3Header = Buffer.from([0xFF, 0xFB, 0x90, 0x00]);
    const mockData = Buffer.concat([
      mp3Header,
      Buffer.from('模拟语音数据')
    ]);
    
    return mockData;
  }
  
  /**
   * 估算语音时长（毫秒）
   */
  estimateDuration(text) {
    // 假设平均语速每分钟200字
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    
    // 中文字符按1.5倍时长计算，英文单词按1倍计算
    const totalUnits = chineseChars * 1.5 + englishWords;
    const durationMs = (totalUnits / 200) * 60 * 1000; // 转换为毫秒
    
    return Math.max(Math.round(durationMs), 1000); // 最少1秒
  }
  
  /**
   * 保存音频文件
   */
  async saveAudioFile(audioData, fileName, format = 'mp3') {
    try {
      const filePath = `./temp/${fileName}.${format}`;
      
      // 确保目录存在
      const fs = require('fs').promises;
      await fs.mkdir('./temp', { recursive: true }).catch(() => {});
      
      // 保存文件
      await fs.writeFile(filePath, audioData);
      
      return {
        success: true,
        filePath: filePath,
        fileName: `${fileName}.${format}`,
        fileSize: audioData.length
      };
      
    } catch (error) {
      console.error('保存音频文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 获取支持的语音列表
   */
  getSupportedVoices() {
    return [
      { voice: 'xiaoyun', name: '小云', gender: '女声', language: '中文' },
      { voice: 'xiaogang', name: '小刚', gender: '男声', language: '中文' },
      { voice: 'xiaomei', name: '小美', gender: '女声', language: '中文' },
      { voice: 'xiaoming', name: '小明', gender: '男声', language: '中文' },
      { voice: 'xiaoxue', name: '小雪', gender: '女声', language: '中文' }
    ];
  }
  
  /**
   * 音频格式转换
   */
  async convertAudioFormat(audioData, fromFormat, toFormat) {
    try {
      // 这里可以实现音频格式转换
      // 由于需要额外的音频处理库，这里返回原数据
      
      console.log(`音频格式转换: ${fromFormat} -> ${toFormat}`);
      
      return {
        success: true,
        audioData: audioData,
        fromFormat: fromFormat,
        toFormat: toFormat
      };
      
    } catch (error) {
      console.error('音频格式转换失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 音频质量检测
   */
  async analyzeAudioQuality(audioData) {
    try {
      // 模拟音频质量分析
      const quality = {
        volume: 0.7 + Math.random() * 0.3, // 0.7-1.0
        clarity: 0.8 + Math.random() * 0.2, // 0.8-1.0
        noiseLevel: 0.1 + Math.random() * 0.2, // 0.1-0.3
        overallScore: 0.75 + Math.random() * 0.25 // 0.75-1.0
      };
      
      return {
        success: true,
        quality: quality,
        recommendations: this.getAudioRecommendations(quality)
      };
      
    } catch (error) {
      console.error('音频质量分析失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 获取音频改进建议
   */
  getAudioRecommendations(quality) {
    const recommendations = [];
    
    if (quality.volume < 0.6) {
      recommendations.push('音量偏低，建议提高录音音量');
    }
    
    if (quality.clarity < 0.7) {
      recommendations.push('音频清晰度有待提高，建议使用更好的录音设备');
    }
    
    if (quality.noiseLevel > 0.4) {
      recommendations.push('背景噪音较大，建议在安静环境中录音');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('音频质量良好，继续保持');
    }
    
    return recommendations;
  }
}

module.exports = VoiceService;