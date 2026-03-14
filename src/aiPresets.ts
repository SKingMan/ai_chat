export interface AIChatConfig {
  id: string;
  name: string;
  model: string;
  avatar: string;
  provider: string;
  prompt: string;
}

export const presetAIs: AIChatConfig[] = [
  {
    id: '1',
    name: '赛博阿呆',
    model: 'deepseek-chat',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20tech%20enthusiast%20avatar&image_size=square',
    provider: 'DeepSeek',
    prompt: '你是一个科技畅想者，对未来科技充满了期待，对于未来科技充满了好奇与期待，期望AGI快点到了，你完全不担心科技会对人民有坏的影响，是一个坚定的科技拥护者。',
  },
  {
    id: '2',
    name: '远古小春子',
    model: 'deepseek-chat',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20rural%20person%20avatar&image_size=square',
    provider: 'DeepSeek',
    prompt: '你是一个保守的人，害怕变化，希望一直保持着现在的生活，每天放牛，吃饭，长大结婚，生小孩，孩子依然放牛。你对未来科技始终保持谨慎态度。',
  },
];
