import { useState } from 'react';

// 类型定义
interface Message {
  id: string;
  senderId: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface AIChatConfig {
  id: string;
  name: string;
  model: string;
  avatar: string;
  provider: string;
  prompt: string;
}

interface ChatRoom {
  id: string;
  name: string;
  createdAt: string;
  ais: AIChatConfig[];
  messages: Message[];
  chatRounds: number;
}

function App() {
  // 状态管理
  const [currentPage, setCurrentPage] = useState<'home' | 'chat'>('home');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [aiName, setAiName] = useState('');
  const [aiPrompt, setAiPrompt] = useState(''); // AI角色设定提示词
  const [isLoading, setIsLoading] = useState(false);
  const [chatRounds, setChatRounds] = useState(5); // 默认聊天轮数

  // 创建新聊天室
  const createChatRoom = () => {
    if (!newRoomName.trim()) return;

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: newRoomName,
      createdAt: new Date().toISOString(),
      ais: [],
      messages: [],
      chatRounds: chatRounds,
    };

    setChatRooms([...chatRooms, newRoom]);
    setCurrentChatRoom(newRoom);
    setCurrentPage('chat');
    setNewRoomName('');
  };

  // 进入现有聊天室
  const enterChatRoom = (room: ChatRoom) => {
    setCurrentChatRoom(room);
    setChatRounds(room.chatRounds);
    setCurrentPage('chat');
  };

  // 添加AI到聊天室
  const addAI = () => {
    if (!currentChatRoom || !aiName.trim()) return;

    const newAI: AIChatConfig = {
      id: Date.now().toString(),
      name: aiName,
      model: 'deepseek-chat',
      avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20AI%20assistant%20avatar&image_size=square`,
      provider: 'DeepSeek',
      prompt: aiPrompt || `你是${aiName}，一个智能AI助手。`,
    };

    const updatedRoom = {
      ...currentChatRoom,
      ais: [...currentChatRoom.ais, newAI],
    };

    setCurrentChatRoom(updatedRoom);
    setChatRooms(chatRooms.map(room => room.id === currentChatRoom.id ? updatedRoom : room));
    setAiName('');
    setAiPrompt('');
  };

  // 调用DeepSeek API获取AI回复
  const getAIReply = async (message: string, aiName: string, context?: Message[], aiPrompt?: string) => {
    try {
      const systemPrompt = `${aiPrompt || `你是${aiName}，一个智能AI助手。`} 回答要简短，10-30字之间。要具有创新精神，会抖机灵，有趣一点，同时保持你的特色。避免重复之前的回答，尝试从不同角度思考问题。`;
      const messages = [
        { role: 'system', content: systemPrompt },
      ];

      // 添加上下文信息，只保留最近的2-3条消息，避免上下文过长导致重复
      if (context && context.length > 0) {
        const recentMessages = context.slice(-3);
        recentMessages.forEach(msg => {
          // 对于AI消息，添加发送者信息
          if (msg.senderType === 'ai') {
            const aiSender = currentChatRoom?.ais.find(a => a.id === msg.senderId);
            if (aiSender) {
              messages.push({ role: 'assistant', content: `[${aiSender.name}] ${msg.content}` });
            } else {
              messages.push({ role: 'assistant', content: msg.content });
            }
          } else {
            messages.push({ role: 'user', content: msg.content });
          }
        });
      }

      messages.push({ role: 'user', content: message });

      const response = await fetch('http://localhost:3001/api/deepseek/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
        }),
      });

      const data = await response.json();
      return data.success ? data.reply : `我是${aiName}，这是一个默认回复。你刚才说：${message}`;
    } catch (error) {
      console.error('Error calling AI API:', error);
      return `我是${aiName}，这是一个默认回复。你刚才说：${message}`;
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!currentChatRoom || !messageInput.trim() || isLoading) return;

    setIsLoading(true);

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      senderType: 'user',
      content: messageInput,
      timestamp: new Date().toISOString(),
    };

    const updatedRoomWithUserMessage = {
      ...currentChatRoom,
      messages: [...currentChatRoom.messages, userMessage],
    };

    setCurrentChatRoom(updatedRoomWithUserMessage);
    setChatRooms(chatRooms.map(room => room.id === currentChatRoom.id ? updatedRoomWithUserMessage : room));
    setMessageInput('');

    // 执行多轮对话
    let currentMessages = [...updatedRoomWithUserMessage.messages];
    let roundsCompleted = 0;

    while (roundsCompleted < currentChatRoom.chatRounds) {
      // 逐个获取AI回复
      for (let i = 0; i < currentChatRoom.ais.length; i++) {
        const ai = currentChatRoom.ais[i];
        try {
          // 确定对话上下文
          const context = currentMessages;
          // 获取上一个发言者的消息
          const lastMessage = currentMessages[currentMessages.length - 1];
          
          let reply;
          if (lastMessage.senderType === 'user') {
            // 对用户消息的回复
            reply = await getAIReply(lastMessage.content, ai.name, context, ai.prompt);
          } else {
            // 对另一个AI消息的回复
            const lastAiName = currentChatRoom.ais.find(a => a.id === lastMessage.senderId)?.name || 'AI';
            reply = await getAIReply(`${lastAiName}说：${lastMessage.content}`, ai.name, context, ai.prompt);
          }
          
          const aiMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            senderId: ai.id,
            senderType: 'ai',
            content: reply,
            timestamp: new Date().toISOString(),
          };

          currentMessages = [...currentMessages, aiMessage];

          const updatedRoomWithAiMessage = {
            ...updatedRoomWithUserMessage,
            messages: currentMessages,
          };

          setCurrentChatRoom(updatedRoomWithAiMessage);
          setChatRooms(chatRooms.map(room => room.id === currentChatRoom.id ? updatedRoomWithAiMessage : room));

          // 等待2秒后再获取下一个AI的回复，模拟真实对话
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Error getting AI reply:', error);
        }
      }

      roundsCompleted++;
    }

    setIsLoading(false);
  };

  // 返回主页
  const goBackHome = () => {
    setCurrentPage('home');
    setCurrentChatRoom(null);
  };

  // 更新聊天轮数
  const updateChatRounds = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rounds = parseInt(e.target.value) || 1;
    setChatRounds(Math.min(Math.max(1, rounds), 10)); // 限制在1-10轮之间

    if (currentChatRoom) {
      const updatedRoom = {
        ...currentChatRoom,
        chatRounds: Math.min(Math.max(1, rounds), 10),
      };
      setCurrentChatRoom(updatedRoom);
      setChatRooms(chatRooms.map(room => room.id === currentChatRoom.id ? updatedRoom : room));
    }
  };

  // 主页
  if (currentPage === 'home') {
    return (
      <div className="container">
        <div className="card">
          <h1>AI聊天室</h1>
          <p>创建一个新的聊天室，添加多个AI模型让它们对话</p>
          
          <div style={{ marginBottom: '20px' }}>
            <h2>创建新聊天室</h2>
            <input
              type="text"
              placeholder="输入聊天室名称"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
            />
            <div style={{ marginBottom: '10px', marginTop: '10px' }}>
              <label>聊天轮数：</label>
              <input
                type="number"
                min="1"
                max="10"
                value={chatRounds}
                onChange={updateChatRounds}
                style={{ width: '60px', marginLeft: '10px' }}
              />
            </div>
            <button onClick={createChatRoom}>创建聊天室</button>
          </div>

          <div>
            <h2>历史聊天室</h2>
            {chatRooms.length === 0 ? (
              <p>暂无历史聊天室</p>
            ) : (
              <ul>
                {chatRooms.map(room => (
                  <li key={room.id}>
                    <div>
                      <strong>{room.name}</strong>
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                        {new Date(room.createdAt).toLocaleString()}
                      </span>
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                        轮数: {room.chatRounds}
                      </span>
                    </div>
                    <button 
                      onClick={() => enterChatRoom(room)}
                      style={{ marginTop: '5px', padding: '5px 10px', fontSize: '12px' }}
                    >
                      进入聊天室
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 聊天室页面
  if (currentPage === 'chat' && currentChatRoom) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1>{currentChatRoom.name}</h1>
            <button onClick={goBackHome}>返回主页</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>添加AI</h2>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="输入AI名称"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <textarea
                placeholder="输入AI角色设定提示词（例如：你是一个幽默的助手，擅长讲笑话）"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                style={{ width: '100%', height: '80px' }}
              />
            </div>
            <button onClick={addAI}>添加</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>已添加的AI</h2>
            {currentChatRoom.ais.length === 0 ? (
              <p>暂无添加的AI，请至少添加两个AI模型</p>
            ) : (
              <ul>
                {currentChatRoom.ais.map(ai => (
                  <li key={ai.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <img src={ai.avatar} alt={ai.name} className="message-avatar" />
                      <span style={{ fontWeight: '600' }}>{ai.name} ({ai.provider})</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginLeft: '50px' }}>
                      <strong>角色设定：</strong>{ai.prompt}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>聊天设置</h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label>聊天轮数：</label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentChatRoom.chatRounds}
                onChange={updateChatRounds}
                style={{ width: '60px', marginLeft: '10px' }}
              />
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                （AI之间将对话{currentChatRoom.chatRounds}轮）
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h2>聊天记录</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}>
              {currentChatRoom.messages.length === 0 ? (
                <p>暂无聊天记录</p>
              ) : (
                currentChatRoom.messages.map(message => {
                  const sender = message.senderType === 'user' 
                    ? { name: '我', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square' }
                    : currentChatRoom.ais.find(ai => ai.id === message.senderId) || { name: 'AI', avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ai%20avatar&image_size=square' };

                  return (
                    <div key={message.id} className="message">
                      <img src={sender.avatar} alt={sender.name} className="message-avatar" />
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-sender">{sender.name}</span>
                          <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="message-text">{message.content}</div>
                      </div>
                    </div>
                  );
                })
              )}
              {isLoading && (
                <div style={{ marginTop: '10px', color: '#999', fontSize: '14px' }}>
                  AI正在回复中...
                </div>
              )}
            </div>
          </div>

          <div className="chat-input">
            <textarea
              placeholder="输入消息..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={currentChatRoom.ais.length < 2 || isLoading}
            />
            <button 
              onClick={sendMessage} 
              disabled={currentChatRoom.ais.length < 2 || !messageInput.trim() || isLoading}
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </div>
          {currentChatRoom.ais.length < 2 && (
            <p style={{ marginTop: '10px', color: '#999', fontSize: '12px' }}>
              请至少添加两个AI模型才能开始聊天
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default App;