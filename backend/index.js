const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

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

// 首先创建数据库连接（不指定数据库）
const createPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10), // 确保port是数字类型
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

// 数据库连接池（稍后会更新为使用dbName）
let pool;

// 创建数据库（如果不存在）
async function createDatabase() {
  try {
    const client = await createPool.getConnection();
    try {
      // 尝试创建数据库
      await client.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
      console.log(`✓ Database ${dbName} created or already exists`);
    } catch (error) {
      console.error('Error creating database:', error);
    } finally {
      client.release();
    }
    
    // 关闭临时连接池
    await createPool.end();
    
    // 创建使用指定数据库的连接池
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0
    });
    
    console.log('✓ Database connection pool created');
  } catch (error) {
    console.error('Error in createDatabase:', error);
  }
}

// 先创建数据库，然后初始化
async function setupDatabase() {
  await createDatabase();
  // 等待一段时间，确保连接池创建完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  await initDatabase();
}

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
async function initDatabase() {
  try {
    if (!pool) {
      console.error('Database pool not initialized');
      return;
    }
    
    const client = await pool.getConnection();
    console.log('Database connected successfully');
    
    try {
      // 测试基本查询
      await client.query('SELECT 1');
      console.log('Basic database query successful');
      
      // 检查数据库版本
      const versionResult = await client.query('SELECT VERSION() as version');
      console.log('Database version:', versionResult[0][0].version.substring(0, 50));
      
      // 检查当前连接信息
      const connResult = await client.query('SELECT USER() as user, DATABASE() as `database`');
      console.log('Current connection:', connResult[0][0]);
      
      // 检查并创建表
      const tables = ['users', 'chat_rooms', 'ai_configs', 'messages'];
      for (const table of tables) {
        try {
          // 检查表是否存在
          const result = await client.query(`
            SHOW TABLES LIKE '${table}'
          `);
          
          if (result[0].length > 0) {
            console.log(`✓ Table ${table} exists`);
          } else {
            console.log(`✗ Table ${table} does not exist, creating...`);
            
            // 创建表
            if (table === 'users') {
              await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                  id VARCHAR(50) PRIMARY KEY,
                  username VARCHAR(100) NOT NULL UNIQUE,
                  password VARCHAR(255) NOT NULL,
                  created_at TIMESTAMP NOT NULL
                )
              `);
              console.log('✓ Created users table');
            } else if (table === 'chat_rooms') {
              await client.query(`
                CREATE TABLE IF NOT EXISTS chat_rooms (
                  id VARCHAR(50) PRIMARY KEY,
                  name VARCHAR(255) NOT NULL,
                  created_at TIMESTAMP NOT NULL,
                  chat_rounds INTEGER NOT NULL DEFAULT 5,
                  tags TEXT,
                  primary_tag TEXT
                )
              `);
              console.log('✓ Created chat_rooms table');
            } else if (table === 'ai_configs') {
              await client.query(`
                CREATE TABLE IF NOT EXISTS ai_configs (
                  id VARCHAR(50) PRIMARY KEY,
                  chat_room_id VARCHAR(50) NOT NULL,
                  name VARCHAR(100) NOT NULL,
                  model VARCHAR(100) NOT NULL,
                  avatar TEXT,
                  provider VARCHAR(100) NOT NULL,
                  prompt TEXT NOT NULL,
                  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
                )
              `);
              console.log('✓ Created ai_configs table');
            } else if (table === 'messages') {
              await client.query(`
                CREATE TABLE IF NOT EXISTS messages (
                  id VARCHAR(50) PRIMARY KEY,
                  chat_room_id VARCHAR(50) NOT NULL,
                  sender_id VARCHAR(50) NOT NULL,
                  sender_type VARCHAR(20) NOT NULL,
                  content TEXT NOT NULL,
                  timestamp TIMESTAMP NOT NULL,
                  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
                )
              `);
              console.log('✓ Created messages table');
            }
          }
        } catch (error) {
          console.error(`Error checking/creating ${table} table:`, error);
        }
      }
      
      // 检查并添加缺少的字段
      try {
        // 检查 chat_rooms 表是否缺少字段
        const chatRoomsColumns = await client.query(`
          SHOW COLUMNS FROM chat_rooms
        `);
        const chatRoomsColumnNames = chatRoomsColumns[0].map(row => row.Field);
        
        if (!chatRoomsColumnNames.includes('tags')) {
          await client.query(`ALTER TABLE chat_rooms ADD COLUMN tags TEXT`);
          console.log('✓ Added tags column to chat_rooms table');
        } else {
          console.log('✓ tags column already exists in chat_rooms table');
        }
        
        if (!chatRoomsColumnNames.includes('primary_tag')) {
          await client.query(`ALTER TABLE chat_rooms ADD COLUMN primary_tag TEXT`);
          console.log('✓ Added primary_tag column to chat_rooms table');
        } else {
          console.log('✓ primary_tag column already exists in chat_rooms table');
        }
      } catch (error) {
        console.error('Error checking/adding columns:', error);
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
setupDatabase();

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
    console.log('=== DeepSeek API Request ===');
    console.log('Received messages:', JSON.stringify(req.body.messages, null, 2));
    
    const { messages, model = 'deepseek-chat' } = req.body;
    
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('DeepSeek API key is not set');
      return res.status(400).json({ success: false, error: 'DeepSeek API key is not set' });
    }
    
    console.log('API Key configured:', process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No');
    console.log('API Key length:', process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.length : 0);
    
    console.log('Making request to DeepSeek API...');
    
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
        timeout: 30000, // 添加超时设置
      }
    );
    
    console.log('=== DeepSeek API Response ===');
    console.log('Response status:', response.status);
    console.log('Full response data:', JSON.stringify(response.data, null, 2));
    
    let reply = response.data.choices[0].message.content;
    console.log('Generated reply:', reply);
    
    // 限制回答长度在10-30字之间
    if (reply.length > 30) {
      reply = reply.substring(0, 30).trim();
      // 确保句子完整
      const lastSpaceIndex = reply.lastIndexOf(' ');
      if (lastSpaceIndex > 10) {
        reply = reply.substring(0, lastSpaceIndex);
      }
      console.log('Truncated reply:', reply);
    }
    
    res.json({ success: true, reply });
  } catch (error) {
    console.error('=== DeepSeek API Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('Request made but no response received:', error.request);
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error?.message || error.message || 'Internal server error' 
    });
  }
});

// 健康检查端点
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.getConnection();
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
    const { id, name, createdAt, chatRounds = 5, tags = [], primaryTag } = req.body;
    console.log('Creating chat room with tags:', tags, 'primaryTag:', primaryTag);
    
    // 转换日期时间格式为MySQL可接受的格式
    const formattedCreatedAt = new Date(createdAt).toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      const client = await pool.getConnection();
      try {
        // 尝试插入数据
        await client.query(
          'INSERT INTO chat_rooms (id, name, created_at, chat_rounds, tags, primary_tag) VALUES (?, ?, ?, ?, ?, ?)',
          [id, name, formattedCreatedAt, chatRounds, JSON.stringify(tags), primaryTag]
        );
        console.log('Chat room created successfully:', id, name, 'with tags:', tags);
        res.json({ success: true });
      } catch (error) {
        console.error('Error creating chat room:', error);
        // 详细的错误处理
        if (error.code === 'ER_NO_SUCH_TABLE') {
          res.status(500).json({ success: false, error: 'Table does not exist. Please create tables first.' });
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
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
      const client = await pool.getConnection();
      try {
        // 查询聊天室列表
        const [result] = await client.query('SELECT * FROM chat_rooms ORDER BY created_at DESC');
        console.log('Retrieved', result.length, 'chat rooms');
        
        // 处理tags字段，从JSON字符串解析为数组
        const chatRoomsWithParsedTags = result.map(room => {
          try {
            return {
              ...room,
              tags: room.tags ? JSON.parse(room.tags) : []
            };
          } catch (error) {
            console.error('Error parsing tags for room', room.id, error);
            return {
              ...room,
              tags: []
            };
          }
        });
        
        res.json({ success: true, chatRooms: chatRoomsWithParsedTags });
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
      const client = await pool.getConnection();
      try {
        // 获取聊天室信息
        const [roomResult] = await client.query('SELECT * FROM chat_rooms WHERE id = ?', [id]);
        if (roomResult.length === 0) {
          console.log('Chat room not found:', id);
          return res.json({ success: true, chatRoom: null });
        }
        
        // 获取AI配置
        const [aiResult] = await client.query('SELECT * FROM ai_configs WHERE chat_room_id = ?', [id]);
        
        // 获取消息
        const [messageResult] = await client.query('SELECT * FROM messages WHERE chat_room_id = ? ORDER BY timestamp ASC', [id]);
        
        const chatRoom = {
          id: roomResult[0].id,
          name: roomResult[0].name,
          createdAt: roomResult[0].created_at,
          chatRounds: roomResult[0].chat_rounds,
          ais: aiResult.map(ai => ({
            id: ai.id,
            name: ai.name,
            model: ai.model,
            avatar: ai.avatar,
            provider: ai.provider,
            prompt: ai.prompt
          })),
          messages: messageResult.map(msg => ({
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
      const client = await pool.getConnection();
      try {
        // 尝试插入数据
        await client.query(
          'INSERT INTO ai_configs (id, chat_room_id, name, model, avatar, provider, prompt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, chatRoomId, name, model, avatar, provider, prompt]
        );
        console.log('AI config added successfully:', id, name);
        res.json({ success: true });
      } catch (error) {
        console.error('Error adding AI config:', error);
        // 详细的错误处理
        if (error.code === 'ER_NO_SUCH_TABLE') {
          res.status(500).json({ success: false, error: 'Table does not exist. Please create tables first.' });
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
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
    
    // 转换日期时间格式为MySQL可接受的格式
    const formattedTimestamp = new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
    
    try {
      const client = await pool.getConnection();
      try {
        // 尝试插入数据
        await client.query(
          'INSERT INTO messages (id, chat_room_id, sender_id, sender_type, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
          [id, chatRoomId, senderId, senderType, content, formattedTimestamp]
        );
        console.log('Message saved successfully:', id);
        res.json({ success: true });
      } catch (error) {
        console.error('Error saving message:', error);
        // 详细的错误处理
        if (error.code === 'ER_NO_SUCH_TABLE') {
          res.status(500).json({ success: false, error: 'Table does not exist. Please create tables first.' });
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
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

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    
    try {
      const client = await pool.getConnection();
      try {
        // 检查用户名是否已存在
        const [existingUser] = await client.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
          return res.status(400).json({ success: false, error: 'Username already exists' });
        }
        
        // 哈希密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // 创建用户
        const userId = Date.now().toString();
        const now = new Date();
        // 转换为MySQL可接受的日期时间格式
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
        await client.query(
          'INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)',
          [userId, username, hashedPassword, formattedDate]
        );
        
        console.log('User registered successfully:', username);
        res.json({ success: true, userId });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error registering user:', dbError);
      res.status(500).json({ success: false, error: 'Database error' });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    
    try {
      const client = await pool.getConnection();
      try {
        // 查找用户
        const [userResult] = await client.query('SELECT * FROM users WHERE username = ?', [username]);
        if (userResult.length === 0) {
          return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
        
        const user = userResult[0];
        
        // 验证密码
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
        
        console.log('User logged in successfully:', username);
        res.json({ success: true, userId: user.id, username: user.username });
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Database error logging in:', dbError);
      res.status(500).json({ success: false, error: 'Database error' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
