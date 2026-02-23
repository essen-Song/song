const https = require('https');

const data = JSON.stringify({
  model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  messages: [{role: 'user', content: '你好'}]
});

const options = {
  hostname: 'api.siliconflow.cn',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-xhshgjgyhqaahkefpdfohzmaulqjawmhvrrljqsubktpnkjs',
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', body);
  });
});

req.on('error', e => console.error('错误:', e));
req.write(data);
req.end();
