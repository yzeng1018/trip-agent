import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { TravelIntent } from './types'

const SYSTEM_PROMPT = `你是一个旅行意图解析助手。用户会用自然语言描述他们的出行需求，你需要从中提取结构化信息并以 JSON 格式返回。

只返回 JSON，不要任何额外的解释或 markdown 代码块。

JSON 结构如下：
{
  "from": "出发城市（中文）",
  "to": "目的地城市（中文）",
  "departDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD 或 null（单程）",
  "passengers": 1,
  "airlines": ["航空公司名称（可以是中文或英文）"],
  "maxBudget": null 或 数字（每人单程机票预算，人民币）,
  "currency": "CNY",
  "hotelStars": null 或 数字（最低星级）,
  "hotelLocation": null 或 "描述（如市中心）",
  "tripType": "roundtrip 或 oneway",
  "needsHotel": true 或 false（用户是否明确提到需要酒店/住宿；只查机票时为 false）
}

如果某项信息用户没有提及，用 null 填充（passengers 默认为 1）。
needsHotel：用户只提机票/航班时为 false，提到酒店/住宿/行程时为 true。
日期如果用户只说了月日，默认年份为 2026。`

export async function parseIntent(userMessage: string): Promise<TravelIntent> {
  const provider = process.env.AI_PROVIDER || 'claude'

  let content: string

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0,
    })
    content = res.choices[0].message.content || '{}'
  } else if (provider === 'deepseek') {
    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })
    const res = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0,
    })
    content = res.choices[0].message.content || '{}'
  } else if (provider === 'qwen') {
    const qwen = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
    const res = await qwen.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0,
    })
    content = res.choices[0].message.content || '{}'
  } else {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    content = res.content[0].type === 'text' ? res.content[0].text : '{}'
  }

  try {
    return JSON.parse(content) as TravelIntent
  } catch {
    throw new Error('AI 解析失败，请重新描述你的出行需求')
  }
}
