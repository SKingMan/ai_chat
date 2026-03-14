# AI聊天室

一个Web端的AI聊天室应用，允许用户创建包含多个AI模型的聊天群组，让不同的AI之间进行对话交流。

## 功能特性

- **多AI群聊**：支持添加多个AI模型到聊天室，让它们在群里对话
- **AI角色设定**：为每个AI设置独特的角色设定提示词，赋予它们不同的个性和特色
- **多轮对话**：可设置AI之间的对话轮数，控制对话长度
- **创新回复**：AI回答具有创新性，避免重复，会抖机灵，有趣味性
- **响应式设计**：适配不同屏幕尺寸，提供良好的用户体验
- **数据持久化**：使用Supabase云数据库，聊天记录自动保存

## 技术栈

### 前端
- React + TypeScript
- Vite
- CSS3

### 后端服务（无）
- 直接使用Supabase作为后端服务
- 使用Supabase Edge Functions调用DeepSeek API

## 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/ai-chat-room.git
   cd ai_chat
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   创建或编辑 `.env` 文件，添加以下内容：
   ```env
   # AI对话轮数设置
   VITE_AI_CHAT_ROUNDS=5

   # Supabase配置
   VITE_SUPABASE_URL=你的Supabase项目URL
   VITE_SUPABASE_ANON_KEY=你的SupabaseAnonKey
   ```

4. **配置Supabase**
   - 在Supabase中创建数据库表（参考 `supabase_schema.sql`）
   - 部署Edge Function（参考 `supabase-functions/` 目录）
   - 在Supabase Dashboard中设置环境变量 `DEEPSEEK_API_KEY`

## 启动项目

```bash
npm run dev
```

前端应用将运行在 http://localhost:5173

## 使用指南

1. **创建聊天室**
   - 在主页输入聊天室名称
   - 点击"创建聊天室"按钮

2. **发送消息**
   - 在聊天输入框中输入您的消息
   - 点击"发送"按钮
   - 观察AI之间的多轮对话

3. **添加自定义AI**
   - 在聊天室页面输入AI名称
   - 输入AI角色设定提示词
   - 点击"添加"按钮

## 项目结构

```
ai-chat-room/
├── src/                      # 前端代码
│   ├── App.tsx              # 主应用组件
│   ├── supabase.ts          # Supabase客户端
│   ├── aiPresets.ts         # 预设AI配置
│   └── main.tsx             # 应用入口
├── supabase-functions/      # Edge Functions
│   └── deepseek-chat/       # DeepSeek API调用函数
├── supabase_schema.sql       # 数据库表结构
├── .env                     # 环境变量配置
├── package.json             # 依赖配置
├── vite.config.ts           # Vite配置
└── README.md                # 项目说明
```

## 数据库表结构

需要创建以下表（参考 `supabase_schema.sql`）：

- `users` - 用户表
- `chat_rooms` - 聊天室表
- `messages` - 消息表

## 注意事项

- 本项目使用DeepSeek API，需要有效的API密钥才能获取真实的AI回复
- 为了获得更好的对话效果，请为每个AI设置独特的角色设定提示词
- AI对话会消耗API调用次数，请合理设置对话轮数

## 许可证

MIT
