-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  chat_rounds INTEGER NOT NULL DEFAULT 5,
  tags TEXT,
  primary_tag TEXT
);

-- 创建AI配置表
CREATE TABLE IF NOT EXISTS ai_configs (
  id VARCHAR(50) PRIMARY KEY,
  chat_room_id VARCHAR(50) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  avatar TEXT,
  provider VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  chat_room_id VARCHAR(50) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id VARCHAR(50) NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 为所有表创建公开读取策略（用于匿名访问）
CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON chat_rooms FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ai_configs FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON messages FOR SELECT USING (true);

-- 为所有表创建公开写入策略
CREATE POLICY "Allow public insert access" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON chat_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON ai_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access" ON messages FOR INSERT WITH CHECK (true);

-- 为chat_rooms和ai_configs创建更新策略
CREATE POLICY "Allow public update access" ON chat_rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public update access" ON ai_configs FOR UPDATE USING (true);
