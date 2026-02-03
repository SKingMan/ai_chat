const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟AI回复的端点（保持向后兼容）
app.post('/api/ai/reply', async (req, res) => {
  try {
    const { message, aiName } = req.body;
    
    // 模拟AI回复
    const reply = `我是${aiName}，这是一个模拟回复。你刚才说：${message}`;
    
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DeepSeek API 端点
app.post('/api/deepseek/chat', async (req, res) => {
  try {
    const { messages, model = 'deepseek-chat' } = req.body;
    
    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(400).json({ success: false, error: 'DeepSeek API key is not set' });
    }
    
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model,
        messages,
        temperature: 1.0, // 增加温度值，提高随机性
        top_p: 0.9, // 调整top_p参数，增加多样性
        max_tokens: 100, // 减少最大 tokens，确保回答简洁
        presence_penalty: 0.6, // 增加存在惩罚，减少重复内容
        frequency_penalty: 0.6, // 增加频率惩罚，减少重复词汇
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
      }
    );
    
    let reply = response.data.choices[0].message.content;
    
    // 限制回答长度在10-30字之间
    if (reply.length > 30) {
      reply = reply.substring(0, 30).trim();
      // 确保句子完整
      const lastSpaceIndex = reply.lastIndexOf(' ');
      if (lastSpaceIndex > 10) {
        reply = reply.substring(0, lastSpaceIndex);
      }
    }
    
    res.json({ success: true, reply });
  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error?.message || 'Internal server error' 
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
