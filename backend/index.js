const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');

// 确保加载正确的.env文件
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading env file from:', envPath);
require('dotenv').config({ path: envPath });

// 打印数据库连接参数，用于调试
console.log('Database connection parameters:');
console.log('Host:', process.env.DB_HOST);
console.log('Port:', process.env.DB_PORT);
console.log('User:', process.env.DB_USER);
console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('Database:', process.env.DB_NAME);

// 验证环境变量
if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error('Missing required environment variables!');
  process.exit(1);
}

// 内存存储作为后备方案
let memoryStorage = {
  chatRooms: [],
  aiConfigs: [],
  messages: []
};

// 检查数据库是否可用
let isDatabaseAvailable = true;

const app = express();
const PORT = process.env.PORT || 3001;

// 直接使用正确的数据库名称
const dbName = 'dbchat';
console.log('Using database:', dbName);

// 数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10), // 确保port是数字类型
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbName,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // 增加连接超时时间
});

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    
    try {
      // 测试基本查询
      await client.query('SELECT 1');
      console.log('Basic database query successful');
      
      // 检查数据库版本
      const versionResult = await client.query('SELECT version()');
      console.log('Database version:', versionResult.rows[0].version.substring(0, 50));
      
      // 检查当前连接信息
      const connResult = await client.query('SELECT current_user, current_database()');
      console.log('Current connection:', connResult.rows[0]);
      
      // 检查所有可用的schema
      try {
        const schemaResult = await client.query(`
          SELECT schema_name 
          FROM information_schema.schemata 
          ORDER BY schema_name
        `);
        console.log('All available schemas:');
        schemaResult.rows.forEach(row => {
          console.log(`  ${row.schema_name}`);
        });
      } catch (error) {
        console.error('Error checking schemas:', error);
      }
      
      // 检查dbo模式中的表
      try {
        const tables = ['chat_rooms', 'ai_configs', 'messages'];
        for (const table of tables) {
          const result = await client.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = '${table}' AND table_schema = 'dbo'
          `);
          if (result.rows.length > 0) {
            console.log(`✓ Table ${table} exists in schema ${result.rows[0].table_schema}`);
          } else {
            console.log(`✗ Table ${table} does not exist in dbo schema`);
          }
        }
      } catch (error) {
        console.error('Error checking tables:', error);
      }
      
      // 设置search_path包含dbo模式
      try {
        await client.query('SET search_path TO dbo, public');
        console.log('Search path updated to include dbo schema');
        
        // 验证设置是否成功
        const pathResult = await client.query('SHOW search_path');
        console.log('Current search_path:', pathResult.rows[0].search_path);
      } catch (error) {
        console.error('Error setting search_path:', error);
      }
      
      console.log('Database initialization completed');
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
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // 测试数据库连接
      await client.query('SELECT 1');
      
      // 测试表结构
      let tablesExist = false;
      try {
        await client.query('SELECT * FROM chat_rooms LIMIT 1');
        tablesExist = true;
        console.log('Tables exist and accessible');
      } catch (error) {
        console.error('Error accessing tables:', error);
      }
      
      res.json({ 
        status: 'ok', 
        database: 'connected', 
        tablesExist 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Health check database error:', error);
    res.json({ 
      status: 'ok', 
      database: 'disconnected', 
      error: error.message 
    });
  }
});

// 数据库操作端点

// 创建聊天室
app.post('/api/chatrooms', async (req, res) => {
  try {
    const { id, name, createdAt, chatRounds = 5 } = req.body;
    
    try {
      const client = await pool.connect();
      try {
        // 确保使用dbo模式
        await client.query('SET search_path TO dbo, public');
        
        // 尝试插入数据
        await client.query(
          'INSERT INTO chat_rooms (id, name, created_at, chat_rounds) VALUES ($1, $2, $3, $4)',
          [id, name, createdAt, chatRounds]
        );
        console.log('Chat room created successfully:', id, name);
        res.json({ success: true });
      } catch (error) {
        console.error('Error creating chat room:', error);
        // 详细的错误处理
        if (error.code === '42P01') {
          res.status(500).json({ success: false, error: 'Table does not exist. Please create tables first.' });
        } else if (error.code === '42501') {
          res.status(500).json({ success: false, error: 'Permission denied. Please check database permissions.' });
        } else {
          res.status(500).json({ success: false, error: 'Database error: ' + error.message });
        }
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      res.status(500).json({ success: false, error: 'Database connection failed: ' + dbError.message });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// 获取聊天室列表
app.get('/api/chatrooms', async (req, res) => {
  try {
    try {
      const client = await pool.connect();
      try {
        // 确保使用dbo模式
        await client.query('SET search_path TO dbo, public');
        
        // 查询聊天室列表
        const result = await client.query('SELECT * FROM chat_rooms ORDER BY created_at DESC');
        console.log('Retrieved', result.rows.length, 'chat rooms');
        res.json({ success: true, chatRooms: result.rows });
      } catch (error) {
        console.error('Error getting chat rooms:', error);
        // 返回空列表，让前端正常工作
        res.json({ success: true, chatRooms: [] });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // 返回空列表，让前端正常工作
      res.json({ success: true, chatRooms: [] });
    }
  } catch (error) {
    console.error('Server error:', error);
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
        // 确保使用dbo模式
        await client.query('SET search_path TO dbo, public');
        
        // 获取聊天室信息
        const roomResult = await client.query('SELECT * FROM chat_rooms WHERE id = $1', [id]);
        if (roomResult.rows.length === 0) {
          console.log('Chat room not found:', id);
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
        
        console.log('Chat room details retrieved successfully:', id);
        res.json({ success: true, chatRoom });
      } catch (error) {
        console.error('Error getting chat room details:', error);
        // 返回空聊天室，让前端正常工作
        res.json({ success: true, chatRoom: null });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // 返回空聊天室，让前端正常工作
      res.json({ success: true, chatRoom: null });
    }
  } catch (error) {
    console.error('Server error:', error);
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
        // 确保使用dbo模式
        await client.query('SET search_path TO dbo, public');
        
        // 尝试插入数据
        await client.query(
          'INSERT INTO ai_configs (id, chat_room_id, name, model, avatar, provider, prompt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [id, chatRoomId, name, model, avatar, provider, prompt]
        );
        console.log('AI config added successfully:', id, name);
        res.json({ success: true });
      } catch (error) {
        console.error('Error adding AI config:', error);
        // 详细的错误处理
        if (error.code === '42P01') {
          res.status(500).json({ success: false, error: 'Table does not exist. Please create tables first.' });
        } else if (error.code === '42501') {
          res.status(500).json({ success: false, error: 'Permission denied. Please check database permissions.' });
        } else {
          res.status(500).json({ success: false, error: 'Database error: ' + error.message });
        }
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      res.status(500).json({ success: false, error: 'Database connection failed: ' + dbError.message });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// 保存消息
app.post('/api/messages', async (req, res) => {
  try {
    const { id, chatRoomId, senderId, senderType, content, timestamp } = req.body;
    
    try {
      const client = await pool.connect();
      try {
        // 确保使用dbo模式
        await client.query('SET search_path TO dbo, public');
        
        // 尝试插入数据
        await client.query(
          'INSERT INTO messages (id, chat_room_id, sender_id, sender_type, content, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, chatRoomId, senderId, senderType, content, timestamp]
        );
        console.log('Message saved successfully:', id);
        res.json({ success: true });
      } catch (error) {
        console.error('Error saving message:', error);
        // 详细的错误处理
        if (error.code === '42P01') {
          res.status(500).json({ success: false, error: 'Table does not exist. Please create tables first.' });
        } else if (error.code === '42501') {
          res.status(500).json({ success: false, error: 'Permission denied. Please check database permissions.' });
        } else {
          res.status(500).json({ success: false, error: 'Database error: ' + error.message });
        }
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      res.status(500).json({ success: false, error: 'Database connection failed: ' + dbError.message });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
