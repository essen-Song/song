const https = require('https');

const data = JSON.stringify({
  model: 'doubao-1-5-lite-32k-250115',
  messages: [{role: 'user', content: '你好'}]
});

const options = {
  hostname: 'ark.cn-beijing.volces.com',
  path: '/api/v3/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer c79d7993-6bca-456d-a375-d670cad761af',
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
