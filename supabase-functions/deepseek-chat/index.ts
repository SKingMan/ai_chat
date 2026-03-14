import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, purpose } = await req.json()
    
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
    
    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let apiMessages = []

    if (purpose === 'generate_tags') {
      apiMessages = [
        { role: 'system', content: '你是一个标签生成器，根据聊天室名称生成3-5个相关的标签。标签应该简洁，1-3个词，用逗号分隔。不要包含任何解释，只返回标签。' },
        { role: 'user', content: `为聊天室名称"${messages}"生成标签` }
      ]
    } else {
      apiMessages = messages
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: apiMessages,
        temperature: 1.0,
        top_p: 0.9,
        max_tokens: purpose === 'generate_tags' ? 50 : 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
      })
    })

    const data = await response.json()
    
    if (data.choices && data.choices[0]) {
      let reply = data.choices[0].message.content
      
      return new Response(
        JSON.stringify({ success: true, reply }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'API response error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
