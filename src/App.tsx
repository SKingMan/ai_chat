import React, { useState } from 'react';

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
  tags: string[];
}

function App() {
  // 状态管理
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'login' | 'register'>('home');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [aiName, setAiName] = useState('');
  const [aiPrompt, setAiPrompt] = useState(''); // AI角色设定提示词
  const [isLoading, setIsLoading] = useState(false);
  const [chatRounds, setChatRounds] = useState(5); // 默认聊天轮数
  const [newRoomTags, setNewRoomTags] = useState(''); // 新聊天室标签，用逗号分隔
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // 当前选中的标签
  const [allTags, setAllTags] = useState<string[]>([]); // 所有可用标签
  // 用户认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 加载聊天室列表
  React.useEffect(() => {
    const loadChatRooms = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/chatrooms');
        const data = await response.json();
        if (data.success) {
          // 转换数据格式以匹配前端类型定义
          const rooms: ChatRoom[] = data.chatRooms.map((room: any) => ({
            id: room.id,
            name: room.name,
            createdAt: room.created_at,
            chatRounds: room.chat_rounds,
            tags: room.tags ? room.tags : [],
            ais: [], // 进入聊天室时再加载
            messages: [] // 进入聊天室时再加载
          }));
          setChatRooms(rooms);
          
          // 提取所有标签
          const tags = new Set<string>();
          rooms.forEach(room => {
            room.tags.forEach(tag => tags.add(tag));
          });
          setAllTags(Array.from(tags));
        }
      } catch (error) {
        console.error('Error loading chat rooms:', error);
      }
    };

    loadChatRooms();
  }, []);

  // 生成标签的函数
  const generateTags = async (roomName: string): Promise<string[]> => {
    try {
      console.log('Generating tags for room:', roomName);
      
      // 使用DeepSeek API生成标签
      const response = await fetch('http://localhost:3001/api/deepseek/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一个标签生成器，根据聊天室名称生成3-5个相关的标签。标签应该简洁，1-3个词，用逗号分隔。不要包含任何解释，只返回标签。',
            },
            {
              role: 'user',
              content: `为聊天室名称"${roomName}"生成标签`,
            },
          ],
        }),
      });
      
      const data = await response.json();
      console.log('Tag generation API response:', data);
      
      if (data.success && data.reply) {
        // 解析标签
        const tags = data.reply
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
          .slice(0, 5); // 最多5个标签
        console.log('Generated tags:', tags);
        return tags;
      }
    } catch (error) {
      console.error('Error generating tags:', error);
    }
    
    // 默认标签
    return ['通用'];
  };

  // 创建新聊天室
  const createChatRoom = async () => {
    if (!newRoomName.trim()) return;

    // 生成标签
    const tags = await generateTags(newRoomName);

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: newRoomName,
      createdAt: new Date().toISOString(),
      ais: [],
      messages: [],
      chatRounds: chatRounds,
      tags: tags,
    };

    // 自动添加预设的AI角色
    const presetAIs = [
      {
        id: (Date.now() + 1).toString(),
        name: '赛博阿呆',
        model: 'deepseek-chat',
        avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20tech%20enthusiast%20avatar&image_size=square`,
        provider: 'DeepSeek',
        prompt: '你是一个科技畅想者，对未来科技充满了期待，对于未来科技充满了好奇与期待，期望AGI快点到了，你完全不担心科技会对人民有坏的影响，是一个坚定的科技拥护者。',
      },
      {
        id: (Date.now() + 2).toString(),
        name: '远古小春子',
        model: 'deepseek-chat',
        avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20rural%20person%20avatar&image_size=square`,
        provider: 'DeepSeek',
        prompt: '你是一个保守的人，害怕变化，希望一直保持着现在的生活，每天放牛，吃饭，长大结婚，生小孩，孩子依然放牛。你对未来科技始终保持谨慎态度。',
      },
    ];

    // 添加预设AI到聊天室
    newRoom.ais = presetAIs;

    try {
      // 保存到数据库
      const chatRoomResponse = await fetch('http://localhost:3001/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newRoom.id,
          name: newRoom.name,
          createdAt: newRoom.createdAt,
          chatRounds: newRoom.chatRounds,
          tags: newRoom.tags,
        }),
      });

      const chatRoomData = await chatRoomResponse.json();
      if (!chatRoomData.success) {
        console.error('Error creating chat room:', chatRoomData.error);
        alert('创建聊天室失败: ' + chatRoomData.error);
        return;
      }

      // 保存预设AI到数据库
      for (const ai of presetAIs) {
        const aiResponse = await fetch('http://localhost:3001/api/ai-configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: ai.id,
            chatRoomId: newRoom.id,
            name: ai.name,
            model: ai.model,
            avatar: ai.avatar,
            provider: ai.provider,
            prompt: ai.prompt,
          }),
        });

        const aiData = await aiResponse.json();
        if (!aiData.success) {
          console.error('Error saving AI config:', aiData.error);
          alert('保存AI配置失败: ' + aiData.error);
          return;
        }
      }

      setChatRooms([...chatRooms, newRoom]);
      setCurrentChatRoom(newRoom);
      setCurrentPage('chat');
      setNewRoomName('');
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('创建聊天室失败: ' + (error as Error).message);
      // 即使API调用失败，也允许本地创建聊天室
      setChatRooms([...chatRooms, newRoom]);
      setCurrentChatRoom(newRoom);
      setCurrentPage('chat');
      setNewRoomName('');
    }
  };

  // 进入现有聊天室
  const enterChatRoom = async (room: ChatRoom) => {
    try {
      // 从数据库加载聊天室详情
      const response = await fetch(`http://localhost:3001/api/chatrooms/${room.id}`);
      const data = await response.json();
      
      if (data.success) {
        // 使用从数据库加载的数据
        const loadedRoom: ChatRoom = {
          id: data.chatRoom.id,
          name: data.chatRoom.name,
          createdAt: data.chatRoom.createdAt,
          chatRounds: data.chatRoom.chatRounds,
          ais: data.chatRoom.ais,
          messages: data.chatRoom.messages,
        };
        setCurrentChatRoom(loadedRoom);
        setChatRounds(loadedRoom.chatRounds);
      } else {
        // 如果加载失败，使用本地数据
        setCurrentChatRoom(room);
        setChatRounds(room.chatRounds);
      }
    } catch (error) {
      console.error('Error loading chat room details:', error);
      // 如果加载失败，使用本地数据
      setCurrentChatRoom(room);
      setChatRounds(room.chatRounds);
    }
    setCurrentPage('chat');
  };

  // 添加AI到聊天室
  const addAI = async () => {
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

    try {
      // 保存到数据库
      await fetch('http://localhost:3001/api/ai-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: newAI.id,
          chatRoomId: currentChatRoom.id,
          name: newAI.name,
          model: newAI.model,
          avatar: newAI.avatar,
          provider: newAI.provider,
          prompt: newAI.prompt,
        }),
      });
    } catch (error) {
      console.error('Error saving AI config:', error);
    }

    setCurrentChatRoom(updatedRoom);
    setChatRooms(chatRooms.map(room => room.id === currentChatRoom.id ? updatedRoom : room));
    setAiName('');
    setAiPrompt('');
  };

  // 调用DeepSeek API获取AI回复
  const getAIReply = async (message: string, aiName: string, context?: Message[], aiPrompt?: string) => {
    try {
      console.log('=== getAIReply Called ===');
      console.log('Message:', message);
      console.log('AI Name:', aiName);
      console.log('AI Prompt:', aiPrompt);
      console.log('Context length:', context?.length || 0);
      
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
      console.log('Messages to API:', JSON.stringify(messages, null, 2));

      console.log('Making API call to http://localhost:3001/api/deepseek/chat...');
      const response = await fetch('http://localhost:3001/api/deepseek/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
        }),
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Status Text:', response.statusText);
      
      const data = await response.json();
      console.log('API Response Data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('API Call Success, Reply:', data.reply);
        return data.reply;
      } else {
        console.error('API Call Failed, Error:', data.error);
        return `我是${aiName}，这是一个默认回复。你刚才说：${message}`;
      }
    } catch (error) {
      console.error('=== Error in getAIReply ===');
      console.error('Error message:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);
      return `我是${aiName}，这是一个默认回复。你刚才说：${message}`;
    }
  };

  // 用户登录
  const login = async () => {
    if (!username || !password) {
      setAuthError('请输入用户名和密码');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        setCurrentPage('home');
        // 保存登录状态到localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', username);
      } else {
        setAuthError(data.error || '登录失败');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setAuthError('登录失败，请稍后重试');
    } finally {
      setAuthLoading(false);
    }
  };

  // 用户注册
  const register = async () => {
    if (!registerUsername || !registerPassword) {
      setAuthError('请输入用户名和密码');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: registerUsername, password: registerPassword }),
      });

      const data = await response.json();
      if (data.success) {
        // 注册成功后自动登录
        setIsAuthenticated(true);
        setCurrentPage('home');
        // 保存登录状态到localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', registerUsername);
      } else {
        setAuthError(data.error || '注册失败');
      }
    } catch (error) {
      console.error('Error registering:', error);
      setAuthError('注册失败，请稍后重试');
    } finally {
      setAuthLoading(false);
    }
  };

  // 用户登出
  const logout = () => {
    setIsAuthenticated(false);
    // 清除localStorage中的登录状态
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    setCurrentPage('home');
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

    // 保存用户消息到数据库
    try {
      await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userMessage.id,
          chatRoomId: currentChatRoom.id,
          senderId: userMessage.senderId,
          senderType: userMessage.senderType,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
        }),
      });
    } catch (error) {
      console.error('Error saving user message:', error);
    }

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

          // 保存AI消息到数据库
          try {
            await fetch('http://localhost:3001/api/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: aiMessage.id,
                chatRoomId: currentChatRoom.id,
                senderId: aiMessage.senderId,
                senderType: aiMessage.senderType,
                content: aiMessage.content,
                timestamp: aiMessage.timestamp,
              }),
            });
          } catch (error) {
            console.error('Error saving AI message:', error);
          }

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

  // 检查登录状态
  React.useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUsername = localStorage.getItem('username');
    if (savedAuth === 'true' && savedUsername) {
      setIsAuthenticated(true);
    }
  }, []);

  // 主页
  if (currentPage === 'home') {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* 顶部导航栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ margin: '0', fontSize: '24px', color: '#333', fontWeight: '700' }}>AI聊天室</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#999' }}>创建一个新的聊天室，添加多个AI模型让它们对话</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isAuthenticated ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#333' }}>欢迎，{localStorage.getItem('username')}</span>
                  <button 
                    onClick={() => {
                      // 弹出创建聊天室的对话框或模态框
                      const roomName = prompt('请输入聊天室名称:');
                      if (roomName && roomName.trim()) {
                        setNewRoomName(roomName.trim());
                        createChatRoom();
                      }
                    }} 
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      backgroundColor: '#00a1d6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#00b5e5';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#00a1d6';
                    }}
                  >
                    创建聊天室
                  </button>
                  <button 
                    onClick={logout} 
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#333',
                      border: '1px solid #e1e1e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    登出
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setCurrentPage('login')} 
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#333',
                      border: '1px solid #e1e1e1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    登录
                  </button>
                  <button 
                    onClick={() => setCurrentPage('register')} 
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      backgroundColor: '#00a1d6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#00b5e5';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#00a1d6';
                    }}
                  >
                    注册
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 标签板块 - 类似B站的标签导航 */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e1e1e1', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>标签板块</h3>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin', scrollbarColor: '#e1e1e1 #f5f5f5' }}>
              {/* 全部标签 */}
              <button 
                onClick={() => setSelectedTag(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '16px',
                  border: '1px solid #e1e1e1',
                  backgroundColor: selectedTag === null ? '#00a1d6' : 'white',
                  color: selectedTag === null ? 'white' : '#333',
                  fontSize: '14px',
                  fontWeight: selectedTag === null ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => {
                  if (selectedTag !== null) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedTag !== null) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                全部
              </button>
              {/* 其他标签 */}
              {allTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '16px',
                    border: '1px solid #e1e1e1',
                    backgroundColor: selectedTag === tag ? '#00a1d6' : 'white',
                    color: selectedTag === tag ? 'white' : '#333',
                    fontSize: '14px',
                    fontWeight: selectedTag === tag ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={(e) => {
                    if (selectedTag !== tag) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedTag !== tag) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          


          {/* 历史聊天室 */}
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e1e1e1', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333', fontWeight: '600' }}>历史聊天室</h2>
            
            {/* 聊天室卡片列表 */}
            {chatRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <p style={{ margin: '0', color: '#999' }}>暂无历史聊天室</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {chatRooms
                  .filter(room => selectedTag === null || room.tags.includes(selectedTag))
                  .map(room => (
                    <div 
                      key={room.id} 
                      style={{
                        padding: '16px',
                        border: '1px solid #e1e1e1',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => enterChatRoom(room)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333', fontWeight: '600' }}>{room.name}</h3>
                      <div style={{ marginBottom: '12px', fontSize: '12px', color: '#999' }}>
                        <span style={{ marginRight: '12px' }}>{new Date(room.createdAt).toLocaleString()}</span>
                        <span>轮数: {room.chatRounds}</span>
                      </div>
                      {/* 显示标签 */}
                      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {room.tags.map(tag => (
                          <span 
                            key={tag}
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              backgroundColor: '#E3F2FD',
                              color: '#00a1d6',
                              fontSize: '10px',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          enterChatRoom(room);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '14px',
                          backgroundColor: '#00a1d6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#00b5e5';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#00a1d6';
                        }}
                      >
                        进入聊天室
                      </button>
                    </div>
                  ))}
              </div>
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
            {isAuthenticated ? (
              <>
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
              </>
            ) : (
              <p style={{ color: '#999' }}>请登录后添加AI</p>
            )}
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

  // 登录页面
  if (currentPage === 'login') {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%', padding: '32px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e1e1e1', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333', fontWeight: '700', textAlign: 'center' }}>登录</h1>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#999', textAlign: 'center' }}>请登录后创建聊天室和添加AI</p>
          
          {authError && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#FFF2F0', border: '1px solid #FFCCC7', borderRadius: '4px' }}>
              <p style={{ margin: '0', color: '#F5222D', fontSize: '14px' }}>{authError}</p>
            </div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' }}>用户名</label>
            <input
              type="text"
              placeholder="输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e1e1e1',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' }}>密码</label>
            <input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e1e1e1',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={login} 
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#00a1d6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                if (!authLoading) {
                  e.currentTarget.style.backgroundColor = '#00b5e5';
                }
              }}
              onMouseOut={(e) => {
                if (!authLoading) {
                  e.currentTarget.style.backgroundColor = '#00a1d6';
                }
              }}
            >
              {authLoading ? '登录中...' : '登录'}
            </button>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
              还没有账号？ <button onClick={() => setCurrentPage('register')} style={{ background: 'none', border: 'none', color: '#00a1d6', cursor: 'pointer', fontSize: '14px' }}>立即注册</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 注册页面
  if (currentPage === 'register') {
    return (
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%', padding: '32px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e1e1e1', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333', fontWeight: '700', textAlign: 'center' }}>注册</h1>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#999', textAlign: 'center' }}>注册后可以创建聊天室和添加AI</p>
          
          {authError && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#FFF2F0', border: '1px solid #FFCCC7', borderRadius: '4px' }}>
              <p style={{ margin: '0', color: '#F5222D', fontSize: '14px' }}>{authError}</p>
            </div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' }}>用户名</label>
            <input
              type="text"
              placeholder="输入用户名"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e1e1e1',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' }}>密码</label>
            <input
              type="password"
              placeholder="输入密码"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid #e1e1e1',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={register} 
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#00a1d6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                if (!authLoading) {
                  e.currentTarget.style.backgroundColor = '#00b5e5';
                }
              }}
              onMouseOut={(e) => {
                if (!authLoading) {
                  e.currentTarget.style.backgroundColor = '#00a1d6';
                }
              }}
            >
              {authLoading ? '注册中...' : '注册'}
            </button>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
              已有账号？ <button onClick={() => setCurrentPage('login')} style={{ background: 'none', border: 'none', color: '#00a1d6', cursor: 'pointer', fontSize: '14px' }}>立即登录</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;