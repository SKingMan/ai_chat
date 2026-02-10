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
  primaryTag: string; // 一级标签
}

// 标签数据结构
interface TagConfig {
  primaryTag: string;
  secondaryTags: string[];
  keywords: string[]; // 用于自动分类的关键词
}

// 标签配置
const tagConfig: TagConfig[] = [
  {
    primaryTag: '动画',
    secondaryTags: ['番剧', '动画电影', '短篇动画', '动画音乐', '动画资讯'],
    keywords: ['动画', '番剧', 'anime', 'cartoon', '二次元', '动漫', '火影', '忍者', '海贼王', '龙珠', '柯南', '进击的巨人', '死神', '银魂', '妖精的尾巴', '全职猎人', '猎人', '家教', '驱魔少年', '钢之炼金术师', 'fate', '圣杯战争', '魔法少女', '美少女战士', '圣斗士星矢', '北斗神拳', '七龙珠', '哆啦a梦', '机器猫', '蜡笔小新', '樱桃小丸子', '名侦探柯南', '犬夜叉', '火影忍者', '海贼王', '进击的巨人', '我的英雄学院', '鬼灭之刃', '咒术回战', '东京复仇者', '堀与宫村', '辉夜大小姐想让我告白', '在下坂本有何贵干', '齐木楠雄的灾难', '灵能百分百', '一拳超人', '银魂', '钢之炼金术师', '死亡笔记', '进击的巨人', '东京食尸鬼', '寄生兽', '甲铁城的卡巴内瑞', 'fate zero', 'fate stay night', '魔法少女小圆', '反叛的鲁鲁修', 'clannad', 'air', 'kanon', 'angel beats', '我的青春恋爱物语果然有问题', '冰菓', '境界的彼方', '中二病也要谈恋爱', '龙与虎', '四月是你的谎言', '未闻花名', '秒速五厘米', '你的名字', '天气之子', '言叶之庭', '声之形', '可塑性记忆', '夏洛特', '樱花庄的宠物女孩', '路人女主的养成方法', '埃罗芒阿老师', '我的妹妹不可能那么可爱', '刀剑神域', '加速世界', '记录的地平线', 'overlord', '关于我转生变成史莱姆这档事', '为美好的世界献上祝福', 're：从零开始的异世界生活', '盾之勇者成名录', '平凡职业造就世界最强', '我的英雄学院', '灵能百分百', '一拳超人', '银魂', '钢之炼金术师', '死亡笔记', '进击的巨人', '东京食尸鬼', '寄生兽', '甲铁城的卡巴内瑞', 'fate zero', 'fate stay night', '魔法少女小圆', '反叛的鲁鲁修', 'clannad', 'air', 'kanon', 'angel beats', '我的青春恋爱物语果然有问题', '冰菓', '境界的彼方', '中二病也要谈恋爱', '龙与虎', '四月是你的谎言', '未闻花名', '秒速五厘米', '你的名字', '天气之子', '言叶之庭', '声之形', '可塑性记忆', '夏洛特', '樱花庄的宠物女孩', '路人女主的养成方法', '埃罗芒阿老师', '我的妹妹不可能那么可爱', '刀剑神域', '加速世界', '记录的地平线', 'overlord', '关于我转生变成史莱姆这档事', '为美好的世界献上祝福', 're：从零开始的异世界生活', '盾之勇者成名录', '平凡职业造就世界最强']
  },
  {
    primaryTag: '影视',
    secondaryTags: ['电影', '电视剧', '综艺', '纪录片', '短片', '预告片'],
    keywords: ['电影', '影视', '电视剧', '综艺', 'tv', 'movie', 'film', '复仇者联盟', '漫威', 'dc', '星球大战', '星际穿越', '盗梦空间', '阿凡达', '泰坦尼克号', '肖申克的救赎', '阿甘正传', '楚门的世界', '千与千寻', '龙猫', '魔女宅急便', '天空之城', '哈尔的移动城堡', '幽灵公主', '风之谷', '起风了', '红猪', '悬崖上的金鱼姬', '侧耳倾听', '猫的报恩', '辉夜姬物语', '你的名字', '天气之子', '言叶之庭', '声之形', '秒速五厘米', '未闻花名', '四月是你的谎言', '龙与虎', '我的青春恋爱物语果然有问题', '冰菓', '境界的彼方', '中二病也要谈恋爱', '樱花庄的宠物女孩', '路人女主的养成方法', '埃罗芒阿老师', '我的妹妹不可能那么可爱', '刀剑神域', '加速世界', '记录的地平线', 'overlord', '关于我转生变成史莱姆这档事', '为美好的世界献上祝福', 're：从零开始的异世界生活', '盾之勇者成名录', '平凡职业造就世界最强']
  },
  {
    primaryTag: '游戏',
    secondaryTags: ['单机游戏', '网络游戏', '手机游戏', '游戏攻略', '游戏资讯'],
    keywords: ['游戏', 'game', 'gaming', '手游', '端游', '电竞', '王者荣耀', '英雄联盟', 'lol', 'dota', 'csgo', 'cf', '穿越火线', '逆战', '剑灵', '魔兽世界', 'wow', '守望先锋', 'overwatch', '炉石传说', 'hearthstone', '星际争霸', 'starcraft', '暗黑破坏神', 'diablo', '流放之路', 'path of exile', '英雄联盟手游', '王者荣耀', '和平精英', 'pubg', '绝地求生', '刺激战场', '全军出击', '穿越火线手游', 'QQ飞车', '跑跑卡丁车', '梦幻西游', '大话西游', '阴阳师', '决战平安京', '楚留香', '逆水寒', '剑网3', '魔兽世界', '最终幻想', 'ff', '塞尔达传说', 'zelda', '马里奥', 'mario', '索尼克', 'sonic', '口袋妖怪', 'pokemon', '宝可梦', '守望先锋', '英雄联盟', '王者荣耀', '和平精英', '绝地求生', '刺激战场', '全军出击', '穿越火线手游', 'QQ飞车', '跑跑卡丁车', '梦幻西游', '大话西游', '阴阳师', '决战平安京', '楚留香', '逆水寒', '剑网3', '魔兽世界', '最终幻想', '塞尔达传说', '马里奥', '索尼克', '口袋妖怪', '宝可梦']
  },
  {
    primaryTag: '知识',
    secondaryTags: ['科普', '历史', '地理', '科学', '文化', '哲学'],
    keywords: ['知识', '科普', '科学', '历史', '文化', '教育']
  },
  {
    primaryTag: '音乐',
    secondaryTags: ['流行音乐', '古典音乐', '摇滚音乐', '嘻哈音乐', '电子音乐', '民谣'],
    keywords: ['音乐', '歌曲', 'music', '歌', '旋律', '节奏']
  },
  {
    primaryTag: '舞蹈',
    secondaryTags: ['街舞', '现代舞', '古典舞', '民族舞', '芭蕾', '舞蹈教学'],
    keywords: ['舞蹈', '舞', 'dance', '街舞', '芭蕾']
  },
  {
    primaryTag: '科技',
    secondaryTags: ['前沿科技', '科技资讯', '科技产品', '科技评测', '科技趋势'],
    keywords: ['科技', 'tech', 'technology', '创新', '未来', '人工智能', 'ai', '智能', '机器人', '机器学习', '深度学习', '神经网络', '算法', '编程', '代码', '开发', '工程师', '软件', '硬件', '计算机', '互联网', '网络', '数据', '大数据', '云计算', '云服务', '服务器', '数据库', '编程', 'coding', 'programming', 'software', 'hardware', 'computer', 'internet', 'network', 'data', 'big data', 'cloud', 'server', 'database']
  },
  {
    primaryTag: '美食',
    secondaryTags: ['美食制作', '美食评测', '美食探店', '烘焙', '饮品', '素食'],
    keywords: ['美食', '食物', '吃', 'cooking', 'food', '美食', '餐厅']
  },
  {
    primaryTag: '生活',
    secondaryTags: ['日常生活', '生活技巧', '生活记录', '生活感悟', '生活方式'],
    keywords: ['生活', '日常', 'life', 'living', '生活方式']
  },
  {
    primaryTag: '鬼畜',
    secondaryTags: ['鬼畜调教', '鬼畜音乐', '鬼畜视频', '鬼畜素材', '鬼畜作品'],
    keywords: ['鬼畜', '恶搞', '搞笑', 'meme']
  },
  {
    primaryTag: '时尚',
    secondaryTags: ['时尚穿搭', '时尚资讯', '时尚潮流', '时尚品牌', '时尚搭配'],
    keywords: ['时尚', 'fashion', '穿搭', '潮流', 'style']
  },
  {
    primaryTag: '资讯',
    secondaryTags: ['新闻资讯', '热点事件', '社会新闻', '国际新闻', '财经资讯'],
    keywords: ['资讯', '新闻', 'news', '热点', '事件']
  },
  {
    primaryTag: '娱乐',
    secondaryTags: ['明星', '八卦', '综艺节目', '娱乐资讯', '演唱会'],
    keywords: ['娱乐', '明星', 'celebrity', 'gossip', '综艺']
  },
  {
    primaryTag: '运动',
    secondaryTags: ['篮球', '足球', '乒乓球', '羽毛球', '游泳', '跑步', '健身'],
    keywords: ['运动', 'sports', '篮球', '足球', '健身']
  },
  {
    primaryTag: '汽车',
    secondaryTags: ['汽车评测', '汽车资讯', '汽车改装', '汽车保养', '新能源汽车'],
    keywords: ['汽车', 'car', 'auto', 'vehicle', '驾驶']
  },
  {
    primaryTag: '动物',
    secondaryTags: ['宠物', '野生动物', '动物保护', '萌宠', '动物趣事'],
    keywords: ['动物', '宠物', 'animal', 'pet', '猫', '狗']
  },
  {
    primaryTag: '手工',
    secondaryTags: ['手工制作', 'DIY', '手工艺品', '手工教程', '创意手工'],
    keywords: ['手工', 'diy', '手工制作', 'craft', '手作']
  },
  {
    primaryTag: '搞笑',
    secondaryTags: ['搞笑视频', '笑话', '幽默', '段子', '搞笑图片', '喜剧'],
    keywords: ['搞笑', '幽默', 'comedy', 'funny', '笑话', '段子']
  },
  {
    primaryTag: '国创',
    secondaryTags: ['国产动画', '国产漫画', '国产游戏', '国创资讯', '国创作品'],
    keywords: ['国创', '国产', '中国', 'china', '国产动画']
  },
  {
    primaryTag: '数码',
    secondaryTags: ['数码产品', '手机', '电脑', '相机', '数码评测', '数码资讯'],
    keywords: ['数码', 'digital', '手机', '电脑', '相机']
  },
  {
    primaryTag: '家居',
    secondaryTags: ['家居装修', '家居设计', '家居用品', '家居收纳', '智能家居'],
    keywords: ['家居', 'home', '装修', '家具', '家居设计']
  },
  {
    primaryTag: '摄影',
    secondaryTags: ['摄影技巧', '摄影作品', '风光摄影', '人像摄影', '街拍', '摄影器材'],
    keywords: ['摄影', 'photography', '拍照', '相机', '摄影作品']
  },
  {
    primaryTag: '旅行',
    secondaryTags: ['旅行攻略', '旅行记录', '景点推荐', '美食旅行', '旅行装备'],
    keywords: ['旅行', 'travel', '旅游', '景点', '游记']
  },
  {
    primaryTag: '财经',
    secondaryTags: ['股票', '基金', '理财', '投资', '财经资讯', '商业'],
    keywords: ['财经', 'finance', '理财', '投资', '股票', '经济']
  },
  {
    primaryTag: '健身',
    secondaryTags: ['健身教程', '健身计划', '健身饮食', '减脂', '增肌', '瑜伽'],
    keywords: ['健身', 'fitness', 'exercise', '瑜伽', '减脂', '增肌']
  },
  {
    primaryTag: '绘画',
    secondaryTags: ['绘画教程', '绘画作品', '素描', '水彩', '油画', '漫画'],
    keywords: ['绘画', 'draw', 'painting', 'art', '美术', '画画']
  },
  {
    primaryTag: '母婴',
    secondaryTags: ['育儿', '婴儿', '幼儿', '母婴用品', '亲子', '早教'],
    keywords: ['母婴', '育儿', 'baby', 'mother', '亲子', '早教']
  },
  {
    primaryTag: '情感',
    secondaryTags: ['爱情', '友情', '亲情', '情感故事', '情感咨询', '心理'],
    keywords: ['情感', '爱情', '友情', '亲情', 'emotion', 'relationship']
  },
  {
    primaryTag: '军事',
    secondaryTags: ['军事资讯', '武器装备', '军事历史', '军事评论', '国际军情'],
    keywords: ['军事', 'military', '武器', '战争', '国防']
  },
  {
    primaryTag: '教育',
    secondaryTags: ['学校教育', '家庭教育', '在线教育', '教育资讯', '学习方法', '考试'],
    keywords: ['教育', 'education', '学习', '学校', '考试', '教学']
  }
];

// 自动分类标签的函数
const autoCategorizeTags = (roomName: string): { primaryTag: string; secondaryTags: string[] } => {
  // 转换为小写便于匹配
  const normalizedName = roomName.toLowerCase();
  
  // 匹配一级标签
  let matchedPrimaryTag = '生活'; // 默认标签
  let matchedSecondaryTags: string[] = [];
  let highestMatchScore = 0;
  
  // 查找匹配的一级标签
  for (const config of tagConfig) {
    let matchScore = 0;
    for (const keyword of config.keywords) {
      if (normalizedName.includes(keyword.toLowerCase())) {
        // 根据关键词长度和位置计算得分
        // 关键词长度越长，得分越高
        matchScore += keyword.length * 0.5;
        // 如果关键词出现在聊天室名称的开头，得分更高
        if (normalizedName.startsWith(keyword.toLowerCase())) {
          matchScore += 2;
        }
      }
    }
    
    // 如果当前标签的得分高于最高得分，更新匹配结果
    if (matchScore > highestMatchScore) {
      highestMatchScore = matchScore;
      matchedPrimaryTag = config.primaryTag;
      // 生成相关的二级标签
      matchedSecondaryTags = config.secondaryTags.slice(0, 3); // 最多取3个二级标签
    }
  }
  
  return { primaryTag: matchedPrimaryTag, secondaryTags: matchedSecondaryTags };
}

// 通用标签显示组件
interface TagButtonProps {
  tags: string[];
  maxVisible: number;
  selectedTag: string | null;
  onTagSelect: (tag: string) => void;
  displayStyle?: 'inline' | 'block';
}

const TagButtonGroup: React.FC<TagButtonProps> = ({ tags, maxVisible, selectedTag, onTagSelect, displayStyle = 'inline' }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const visibleTags = tags.slice(0, maxVisible - 1);
  const hiddenTags = tags.slice(maxVisible - 1);
  
  const handleMoreMouseOver = () => {
    setShowDropdown(true);
  };
  
  const handleMoreMouseOut = () => {
    setShowDropdown(false);
  };
  
  const handleDropdownMouseOver = () => {
    setShowDropdown(true);
  };
  
  const handleDropdownMouseOut = () => {
    setShowDropdown(false);
  };
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: displayStyle === 'inline' ? '6px' : '12px', position: 'relative' }}>
      {visibleTags.map(tag => (
        <button 
          key={tag}
          onClick={() => onTagSelect(tag)}
          style={{
            padding: displayStyle === 'inline' ? '2px 8px' : '8px 16px',
            borderRadius: displayStyle === 'inline' ? '10px' : '16px',
            border: '1px solid #e1e1e1',
            backgroundColor: selectedTag === tag ? '#00a1d6' : displayStyle === 'inline' ? '#E3F2FD' : 'white',
            color: selectedTag === tag ? 'white' : '#00a1d6',
            fontSize: displayStyle === 'inline' ? '10px' : '14px',
            fontWeight: selectedTag === tag ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            flexShrink: 0
          }}
          onMouseOver={(e) => {
            if (selectedTag !== tag) {
              e.currentTarget.style.backgroundColor = displayStyle === 'inline' ? '#BBDEFB' : '#f5f5f5';
            }
          }}
          onMouseOut={(e) => {
            if (selectedTag !== tag) {
              e.currentTarget.style.backgroundColor = displayStyle === 'inline' ? '#E3F2FD' : 'white';
            }
          }}
        >
          {tag}
        </button>
      ))}
      {hiddenTags.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button 
            style={{
              padding: displayStyle === 'inline' ? '2px 8px' : '8px 16px',
              borderRadius: displayStyle === 'inline' ? '10px' : '16px',
              border: '1px solid #e1e1e1',
              backgroundColor: displayStyle === 'inline' ? '#E3F2FD' : 'white',
              color: '#00a1d6',
              fontSize: displayStyle === 'inline' ? '10px' : '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = displayStyle === 'inline' ? '#BBDEFB' : '#f5f5f5';
              handleMoreMouseOver();
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = displayStyle === 'inline' ? '#E3F2FD' : 'white';
              handleMoreMouseOut();
            }}
            onClick={(e) => {
              e.preventDefault();
              setShowDropdown(!showDropdown);
            }}
          >
            更多
          </button>
          {showDropdown && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                backgroundColor: 'white',
                border: '1px solid #e1e1e1',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '120px',
                zIndex: 1000
              }}
              onMouseOver={handleDropdownMouseOver}
              onMouseOut={handleDropdownMouseOut}
            >
              {hiddenTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => onTagSelect(tag)}
                  style={{
                    padding: displayStyle === 'inline' ? '2px 8px' : '6px 12px',
                    borderRadius: displayStyle === 'inline' ? '10px' : '12px',
                    border: '1px solid #e1e1e1',
                    backgroundColor: selectedTag === tag ? '#00a1d6' : displayStyle === 'inline' ? '#E3F2FD' : 'white',
                    color: selectedTag === tag ? 'white' : '#00a1d6',
                    fontSize: displayStyle === 'inline' ? '10px' : '13px',
                    fontWeight: selectedTag === tag ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    if (selectedTag !== tag) {
                      e.currentTarget.style.backgroundColor = displayStyle === 'inline' ? '#BBDEFB' : '#f5f5f5';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedTag !== tag) {
                      e.currentTarget.style.backgroundColor = displayStyle === 'inline' ? '#E3F2FD' : 'white';
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

  const [selectedTag, setSelectedTag] = useState<string | null>(null); // 当前选中的标签
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
            primaryTag: room.primary_tag || room.primaryTag || '生活',
            ais: [], // 进入聊天室时再加载
            messages: [] // 进入聊天室时再加载
          }));
          setChatRooms(rooms);
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
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0)
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
  const createChatRoom = async (roomName?: string) => {
    const nameToUse = roomName || newRoomName;
    if (!nameToUse.trim()) return;

    // 自动分类标签
    const { primaryTag, secondaryTags } = autoCategorizeTags(nameToUse);
    
    // 生成标签
    const tags = await generateTags(nameToUse);
    // 合并自动分类的二级标签和生成的标签
    const combinedTags = [...new Set([...secondaryTags, ...tags])];

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: nameToUse,
      createdAt: new Date().toISOString(),
      ais: [],
      messages: [],
      chatRounds: chatRounds,
      tags: combinedTags,
      primaryTag: primaryTag,
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
          primaryTag: newRoom.primaryTag,
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
          tags: data.chatRoom.tags || [],
          primaryTag: data.chatRoom.primaryTag || '生活',
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
                        setNewRoomName(roomName.trim()); // 仍然更新状态，保持一致性
                        createChatRoom(roomName.trim()); // 直接传递参数
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
                    创建
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
            <div style={{ position: 'relative' }}>
              {/* 标签容器 - 两行显示 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', maxHeight: '80px' }}>
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
                    textAlign: 'center',
                    flexShrink: 0
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
                {/* 一级标签 - 第一行和第二行的标签 */}
                {tagConfig.slice(0, 28).map(config => (
                  <button 
                    key={config.primaryTag}
                    onClick={() => setSelectedTag(config.primaryTag)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '16px',
                      border: '1px solid #e1e1e1',
                      backgroundColor: selectedTag === config.primaryTag ? '#00a1d6' : 'white',
                      color: selectedTag === config.primaryTag ? 'white' : '#333',
                      fontSize: '14px',
                      fontWeight: selectedTag === config.primaryTag ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => {
                      if (selectedTag !== config.primaryTag) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedTag !== config.primaryTag) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {config.primaryTag}
                  </button>
                ))}
                {/* 更多标签 */}
                {tagConfig.length > 28 && (
                  <div style={{ position: 'relative' }}>
                    <button 
                      style={{
                        padding: '8px 16px',
                        borderRadius: '16px',
                        border: '1px solid #e1e1e1',
                        backgroundColor: 'white',
                        color: '#333',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        // 显示更多标签的下拉菜单
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          dropdown.style.display = 'flex';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        // 隐藏更多标签的下拉菜单
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          dropdown.style.display = 'none';
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        // 点击时也显示下拉菜单
                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                        if (dropdown) {
                          dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
                        }
                      }}
                    >
                      更多
                    </button>
                    {/* 更多标签下拉菜单 */}
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '8px',
                        backgroundColor: 'white',
                        border: '1px solid #e1e1e1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        padding: '12px',
                        display: 'none',
                        flexDirection: 'column',
                        gap: '8px',
                        minWidth: '120px',
                        zIndex: 1000
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.display = 'flex';
                        // 同时保持更多按钮的悬停状态
                        const button = e.currentTarget.previousElementSibling as HTMLElement;
                        if (button) {
                          button.style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.display = 'none';
                        // 同时恢复更多按钮的正常状态
                        const button = e.currentTarget.previousElementSibling as HTMLElement;
                        if (button) {
                          button.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      {tagConfig.slice(28).map(config => (
                        <button 
                          key={config.primaryTag}
                          onClick={() => setSelectedTag(config.primaryTag)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            border: '1px solid #e1e1e1',
                            backgroundColor: selectedTag === config.primaryTag ? '#00a1d6' : 'white',
                            color: selectedTag === config.primaryTag ? 'white' : '#333',
                            fontSize: '13px',
                            fontWeight: selectedTag === config.primaryTag ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseOver={(e) => {
                            if (selectedTag !== config.primaryTag) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (selectedTag !== config.primaryTag) {
                              e.currentTarget.style.backgroundColor = 'white';
                            }
                          }}
                        >
                          {config.primaryTag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                  .filter(room => selectedTag === null || room.primaryTag === selectedTag)
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
                        <span style={{ marginLeft: '12px', color: '#00a1d6' }}>分类: {room.primaryTag}</span>
                      </div>
                      {/* 显示一级标签 */}
                      <div style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span 
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#00a1d6',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}
                        >
                          {room.primaryTag}
                        </span>
                      </div>
                      {/* 显示二级标签 */}
                      <div style={{ marginBottom: '16px' }}>
                        <TagButtonGroup 
                          tags={room.tags}
                          maxVisible={5} // 最多显示5个标签
                          selectedTag={null}
                          onTagSelect={() => {}}
                          displayStyle="inline"
                        />
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
            <button 
              onClick={goBackHome}
              style={{
                backgroundColor: '#00a1d6',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#00b5e5';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#00a1d6';
              }}
            >
              返回主页
            </button>
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
                <button 
                  onClick={addAI}
                  style={{
                    backgroundColor: '#00a1d6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#00b5e5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#00a1d6';
                  }}
                >
                  添加
                </button>
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
              disabled={currentChatRoom.ais.length < 2 || isLoading || !isAuthenticated}
              style={{
                opacity: currentChatRoom.ais.length < 2 || isLoading || !isAuthenticated ? 0.6 : 1,
                cursor: currentChatRoom.ais.length < 2 || isLoading || !isAuthenticated ? 'not-allowed' : 'text'
              }}
            />
            <button 
              onClick={sendMessage} 
              disabled={currentChatRoom.ais.length < 2 || !messageInput.trim() || isLoading || !isAuthenticated}
              style={{
                backgroundColor: isAuthenticated ? '#00a1d6' : '#999',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                opacity: (currentChatRoom.ais.length < 2 || !messageInput.trim() || isLoading) ? 0.6 : 1,
                cursor: (currentChatRoom.ais.length < 2 || !messageInput.trim() || isLoading || !isAuthenticated) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (isAuthenticated && !isLoading && currentChatRoom.ais.length >= 2 && messageInput.trim()) {
                  e.currentTarget.style.backgroundColor = '#00b5e5';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = isAuthenticated ? '#00a1d6' : '#999';
              }}
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </div>
          {currentChatRoom.ais.length < 2 && (
            <p style={{ marginTop: '10px', color: '#999', fontSize: '12px' }}>
              请至少添加两个AI模型才能开始聊天
            </p>
          )}
          {!isAuthenticated && (
            <p style={{ marginTop: '10px', color: '#999', fontSize: '12px' }}>
              请登录后才能发送消息
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