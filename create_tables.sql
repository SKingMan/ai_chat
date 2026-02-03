-- 创建聊天表
CREATE TABLE IF NOT EXISTS chat_rooms (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  chat_rounds INTEGER DEFAULT 5
);

-- 创建AI配置表
CREATE TABLE IF NOT EXISTS ai_configs (
  id VARCHAR(50) PRIMARY KEY,
  chat_room_id VARCHAR(50) REFERENCES chat_rooms(id),
  name VARCHAR(255) NOT NULL,
  model VARCHAR(100) NOT NULL,
  avatar VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  chat_room_id VARCHAR(50) REFERENCES chat_rooms(id),
  sender_id VARCHAR(50) NOT NULL,
  sender_type VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL
);

-- 查看创建的表
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
