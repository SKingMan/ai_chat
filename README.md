# AI聊天室

一个Web端的AI聊天室应用，允许用户创建包含多个AI模型的聊天群组，让不同的AI之间进行对话交流。

## 功能特性

- **多AI群聊**：支持添加多个AI模型到聊天室，让它们在群里对话
- **AI角色设定**：为每个AI设置独特的角色设定提示词，赋予它们不同的个性和特色
- **多轮对话**：可设置AI之间的对话轮数，控制对话长度
- **创新回复**：AI回答具有创新性，避免重复，会抖机灵，有趣味性
- **响应式设计**：适配不同屏幕尺寸，提供良好的用户体验

## 技术栈

### 前端
- React + TypeScript
- Vite
- CSS3

### 后端
- Node.js + Express
- DeepSeek API
- Axios

## 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/ai-chat-room.git
   cd ai_chat
   ```

2. **安装前端依赖**
   ```bash
   npm install
   ```

3. **安装后端依赖**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **配置API密钥**
   - 打开 `backend/.env` 文件
   - 将 `your_deepseek_api_key_here` 替换为您的真实DeepSeek API密钥

## 启动项目

1. **启动后端服务**
   ```bash
   cd backend
   npm run dev
   # 后端服务将运行在 http://localhost:3001
   ```

2. **启动前端应用**
   ```bash
   # 在另一个终端中运行
   npm run dev
   # 前端应用将运行在 http://localhost:5173
   ```

3. **访问应用**
   打开浏览器，访问 http://localhost:5173 开始使用AI聊天室

## 使用指南

1. **创建聊天室**
   - 在主页输入聊天室名称
   - 设置聊天轮数（默认为5轮）
   - 点击"创建聊天室"按钮

2. **添加AI模型**
   - 在聊天室页面输入AI名称
   - 输入AI角色设定提示词（例如："你是一个幽默的助手，擅长讲笑话"）
   - 点击"添加"按钮
   - 请至少添加两个AI模型，以便它们可以在群里对话

3. **发送消息**
   - 在聊天输入框中输入您的消息
   - 点击"发送"按钮
   - 观察AI之间的多轮对话

4. **查看聊天记录**
   - 聊天记录会显示在"聊天记录"区域
   - 每条消息都会显示发送者的头像、名称和时间戳

## 项目结构

```
ai-chat-room/
├── src/              # 前端代码
│   ├── App.tsx       # 主应用组件
│   ├── main.tsx      # 应用入口
│   └── index.css     # 全局样式
├── backend/          # 后端代码
│   ├── index.js      # 后端主文件
│   ├── package.json  # 后端依赖
│   └── .env          # 环境变量配置
├── package.json      # 前端依赖
├── vite.config.ts    # Vite配置
├── tsconfig.json     # TypeScript配置
└── README.md         # 项目说明
```

## 注意事项

- 本项目使用DeepSeek API，需要有效的API密钥才能获取真实的AI回复
- 为了获得更好的对话效果，请为每个AI设置独特的角色设定提示词
- AI对话会消耗API调用次数，请合理设置对话轮数

## 许可证

MIT
