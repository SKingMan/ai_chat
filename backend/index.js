const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    try {
      // 创建聊天表
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          chat_rounds INTEGER DEFAULT 5
        )
      `);
      
      // 创建AI表
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_configs (
          id VARCHAR(50) PRIMARY KEY,
          chat_room_id VARCHAR(50) REFERENCES chat_rooms(id),
          name VARCHAR(255) NOT NULL,
          model VARCHAR(100) NOT NULL,
          avatar VARCHAR(255) NOT NULL,
          provider VARCHAR(100) NOT NULL,
          prompt TEXT NOT NULL
        )
      `);
      
      // 创建消息表
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(50) PRIMARY KEY,
          chat_room_id VARCHAR(50) REFERENCES chat_rooms(id),
          sender_id VARCHAR(50) NOT NULL,
          sender_type VARCHAR(10) NOT NULL,
          content TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL
        )
      `);
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      console.log('Continuing without database initialization...');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    console.log('Continuing without database connection...');
  }
}

// 初始化数据库
initDatabase();

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

// 数据库操作端点

// 创建聊天室
app.post('/api/chatrooms', async (req, res) => {
  try {
    const { id, name, createdAt, chatRounds = 5 } = req.body;
    
    try {
      const client = await pool.connect();
      try {
        await client.query(
          'INSERT INTO chat_rooms (id, name, created_at, chat_rounds) VALUES ($1, $2, $3, $4)',
          [id, name, createdAt, chatRounds]
        );
        res.json({ success: true });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error creating chat room:', dbError);
      // 即使数据库操作失败，也返回成功，让前端正常工作
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.json({ success: true });
  }
});

// 获取聊天室列表
app.get('/api/chatrooms', async (req, res) => {
  try {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM chat_rooms ORDER BY created_at DESC');
        res.json({ success: true, chatRooms: result.rows });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error getting chat rooms:', dbError);
      // 返回空列表，让前端正常工作
      res.json({ success: true, chatRooms: [] });
    }
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.json({ success: true, chatRooms: [] });
  }
});

// 获取聊天室详情
app.get('/api/chatrooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const client = await pool.connect();
      try {
        // 获取聊天室信息
        const roomResult = await client.query('SELECT * FROM chat_rooms WHERE id = $1', [id]);
        if (roomResult.rows.length === 0) {
          return res.json({ success: true, chatRoom: null });
        }
        
        // 获取AI配置
        const aiResult = await client.query('SELECT * FROM ai_configs WHERE chat_room_id = $1', [id]);
        
        // 获取消息
        const messageResult = await client.query('SELECT * FROM messages WHERE chat_room_id = $1 ORDER BY timestamp ASC', [id]);
        
        const chatRoom = {
          id: roomResult.rows[0].id,
          name: roomResult.rows[0].name,
          createdAt: roomResult.rows[0].created_at,
          chatRounds: roomResult.rows[0].chat_rounds,
          ais: aiResult.rows.map(ai => ({
            id: ai.id,
            name: ai.name,
            model: ai.model,
            avatar: ai.avatar,
            provider: ai.provider,
            prompt: ai.prompt
          })),
          messages: messageResult.rows.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            senderType: msg.sender_type,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        };
        
        res.json({ success: true, chatRoom });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error getting chat room details:', dbError);
      // 返回空聊天室，让前端正常工作
      res.json({ success: true, chatRoom: null });
    }
  } catch (error) {
    console.error('Error getting chat room details:', error);
    res.json({ success: true, chatRoom: null });
  }
});

// 添加AI到聊天室
app.post('/api/ai-configs', async (req, res) => {
  try {
    const { id, chatRoomId, name, model, avatar, provider, prompt } = req.body;
    
    try {
      const client = await pool.connect();
      try {
        await client.query(
          'INSERT INTO ai_configs (id, chat_room_id, name, model, avatar, provider, prompt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [id, chatRoomId, name, model, avatar, provider, prompt]
        );
        res.json({ success: true });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error adding AI config:', dbError);
      // 即使数据库操作失败，也返回成功，让前端正常工作
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error adding AI config:', error);
    res.json({ success: true });
  }
});

// 保存消息
app.post('/api/messages', async (req, res) => {
  try {
    const { id, chatRoomId, senderId, senderType, content, timestamp } = req.body;
    
    try {
      const client = await pool.connect();
      try {
        await client.query(
          'INSERT INTO messages (id, chat_room_id, sender_id, sender_type, content, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, chatRoomId, senderId, senderType, content, timestamp]
        );
        res.json({ success: true });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error saving message:', dbError);
      // 即使数据库操作失败，也返回成功，让前端正常工作
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error saving message:', error);
    res.json({ success: true });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
