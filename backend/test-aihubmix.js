const https = require('https');

const data = JSON.stringify({
  model: 'glm-4.7-flash-free',
  messages: [{role: 'user', content: '你好'}]
});

const options = {
  hostname: 'aihubmix.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-1bpnWwpJzTINuIUg17833c9bB1Fe4eF5916664Af37C529Ee',
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
