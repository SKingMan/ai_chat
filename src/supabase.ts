import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey 
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ChatRoom {
  id: string
  name: string
  created_at: string
  chat_rounds: number
  tags: string[]
  primary_tag: string | null
}

export interface AIConfig {
  id: string
  chat_room_id: string
  name: string
  model: string
  avatar: string | null
  provider: string
  prompt: string
}

export interface Message {
  id: string
  chat_room_id: string
  sender_id: string
  sender_type: string
  content: string
  timestamp: string
}

export const chatRooms = {
  async getAll(): Promise<ChatRoom[]> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data.map(room => ({
      ...room,
      tags: room.tags ? JSON.parse(room.tags) : []
    }))
  },

  async getById(id: string): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    
    return {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : []
    }
  },

  async create(room: Omit<ChatRoom, 'created_at' | 'chat_rounds'> & { createdAt: string; chatRounds?: number }): Promise<void> {
    console.log('Creating chat room:', {
      id: room.id,
      name: room.name,
      created_at: room.createdAt,
      chat_rounds: room.chatRounds || 5,
      tags: JSON.stringify(room.tags || []),
      primary_tag: room.primary_tag
    });
    
    const { error, data } = await supabase.from('chat_rooms').insert([{
      id: room.id,
      name: room.name,
      created_at: room.createdAt,
      chat_rounds: room.chatRounds || 5,
      tags: JSON.stringify(room.tags || []),
      primary_tag: room.primary_tag
    }])
    
    console.log('Create result:', { error, data });
    if (error) throw error
  }
}

export const aiConfigs = {
  async getByChatRoomId(chatRoomId: string): Promise<AIConfig[]> {
    const { data, error } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('chat_room_id', chatRoomId)
    
    if (error) throw error
    return data || []
  },

  async create(config: AIConfig): Promise<void> {
    const { error } = await supabase.from('ai_configs').insert([config])
    if (error) throw error
  }
}

export const messages = {
  async getByChatRoomId(chatRoomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatRoomId)
      .order('timestamp', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async create(message: Message): Promise<void> {
    const { error } = await supabase.from('messages').insert([{
      id: message.id,
      chat_room_id: message.chat_room_id,
      sender_id: message.sender_id,
      sender_type: message.sender_type,
      content: message.content,
      timestamp: message.timestamp
    }])
    
    if (error) throw error
  }
}

export const users = {
  async login(username: string, password: string): Promise<{ userId: string; username: string }> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error || !data) {
      throw new Error('Invalid username or password')
    }
    
    const bcrypt = await import('bcryptjs')
    const passwordMatch = await bcrypt.default.compare(password, data.password)
    
    if (!passwordMatch) {
      throw new Error('Invalid username or password')
    }
    
    return { userId: data.id, username: data.username }
  },

  async register(username: string, password: string): Promise<string> {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (existing) {
      throw new Error('Username already exists')
    }
    
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.default.hash(password, 10)
    const userId = Date.now().toString()
    
    const { error } = await supabase.from('users').insert([{
      id: userId,
      username,
      password: hashedPassword,
      created_at: new Date().toISOString()
    }])
    
    if (error) throw error
    
    return userId
  }
}

export const deepseek = {
  async chat(messages: { role: string; content: string }[]): Promise<string> {
    console.log('Invoking deepseek-chat function...');
    
    const { data, error } = await supabase.functions.invoke('deepseek-chat', {
      body: { messages, purpose: 'chat' }
    })
    
    console.log('Function response:', data);
    console.log('Function error:', error);
    
    if (error) {
      console.error('Function invoke error:', error);
      throw error;
    }
    if (!data || !data.success) {
      console.error('API error:', data?.error || 'Unknown error');
      throw new Error(data?.error || 'Unknown error')
    }
    return data.reply
  },

  async generateTags(roomName: string): Promise<string[]> {
    console.log('Invoking generateTags function...');
    
    const { data, error } = await supabase.functions.invoke('deepseek-chat', {
      body: { messages: roomName, purpose: 'generate_tags' }
    })
    
    console.log('GenerateTags response:', data);
    console.log('GenerateTags error:', error);
    
    if (error) {
      console.error('Function invoke error:', error);
      throw error;
    }
    if (!data || !data.success) throw new Error(data?.error || 'Unknown error')
    
    return data.reply
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0)
      .slice(0, 5)
  }
}

// 直接使用fetch调用Edge Function，绕过Supabase客户端的JWT验证
export const deepseekFetch = {
  async chat(messages: { role: string; content: string }[]): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('=== Calling Edge Function ===');
    console.log('URL:', `${supabaseUrl}/functions/v1/deepseek-chat`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        messages,
        purpose: 'chat'
      })
    })
    
    console.log('Response status:', response.status);
    const data = await response.json()
    console.log('Direct fetch response:', JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`)
    }
    
    if (!data.success) {
      throw new Error(data.error || 'API error')
    }
    return data.reply
  },

  async generateTags(roomName: string): Promise<string[]> {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        messages: roomName,
        purpose: 'generate_tags'
      })
    })
    
    const data = await response.json()
    console.log('GenerateTags direct fetch response:', data)
    
    if (!data.success) {
      throw new Error(data.error || 'API error')
    }
    
    return data.reply
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0)
      .slice(0, 5)
  }
}
