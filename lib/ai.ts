import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { TravelIntent, TripPlan } from './types'

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
  const provider = (process.env.AI_PROVIDER || 'qwen').trim()

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

// ── Itinerary generation ────────────────────────────────────────

const ITINERARY_SYSTEM_PROMPT = `你是 Tabi，一个专业的 AI 旅行助手。只返回 JSON，不要任何额外的解释或 markdown 代码块。

首先判断用户意图，然后返回对应的 JSON 结构：

━━ 意图 A：旅行规划（想安排行程、问去哪玩、规划几天旅游、推荐目的地、旅行灵感、随时出发）━━
当用户输入与旅行、出行、目的地相关，默认归为此类，大胆推荐并生成行程。
返回：
{
  "type": "itinerary",
  "request": {
    "destination": "目的地（简洁，如「日本东京」）",
    "duration": 天数（数字）,
    "departDate": "YYYY-MM-DD 或 null",
    "travelers": 人数,
    "budget": 总预算数字或 null,
    "currency": "CNY",
    "style": "旅行风格，如轻奢/背包/亲子/蜜月/文艺，从用户描述推断",
    "interests": ["推断出的兴趣标签，如美食、文化、自然、购物、摄影"],
    "userMessage": "用户原始输入"
  },
  "title": "行程标题，有吸引力，如「东京樱花季·7日深度游」",
  "summary": "2-3句话的行程概述，说明亮点和整体节奏",
  "destination": "目的地",
  "duration": 天数,
  "gettingThere": {
    "type": "flight/train/bus（综合价格、时长、便利性选最优一种）",
    "description": "具体描述，如「上海虹桥 → 大阪关西，直飞约2.5小时」，若无明确出发地则填最常见出发城市",
    "duration": "出行时长，如「2.5小时」",
    "priceRange": "¥XXX-XXX/人（经济舱/二等座）",
    "tips": "一句实用购票建议，如「提前2-3周购票更划算」"
  },
  "gettingAround": "当地交通一句话总结，说明最实用的出行方式，如「大阪交通便捷，建议购买大阪周游券，覆盖地铁+主要景点」",
  "hotel": {
    "name": "酒店或民宿名称（推荐最适合的一家）",
    "area": "所在商圈或区域，如「难波·心斋桥商圈」",
    "pricePerNight": "¥XXX-XXX/晚",
    "highlights": ["最多3个亮点，如「地铁直达」「步行至景点」「含早餐」"],
    "tips": "一句预订建议，如「节假日需提前2周以上预订」"
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD 或 null",
      "title": "当天主题，如「抵达·初见东京」",
      "activities": [
        {
          "time": "上午/下午/晚上",
          "title": "活动名称",
          "description": "具体描述，包括推荐理由、注意事项，2-4句话，有实质内容",
          "location": "具体地点名称",
          "type": "sightseeing/food/transport/accommodation/activity/tip",
          "estimatedCost": "大概费用，如「人均 ¥80」或 null",
          "tips": "实用贴士，可为 null"
        }
      ]
    }
  ],
  "practicalTips": ["3-5条实用出行贴士，具体有用"],
  "estimatedBudget": "整体预算估算，如「人均 ¥8000-12000（含机票）」或 null"
}
行程要求：每天安排3-5个活动，节奏合理；活动描述具体有真实地名；第一天考虑抵达，最后一天考虑离开；没说天数则根据目的地推断3-10天。

━━ 意图 B：预订需求（买机票、订酒店、买景点门票、查价格）━━
为用户提供最优推荐，每类给3个备选（从最优到次优排列）。
返回：
{
  "type": "booking",
  "query": "用户需求简述",
  "flights": [
    {
      "airline": "航空公司名",
      "flightNo": "航班号，如 CA837",
      "route": "出发城市 → 目的城市",
      "departTime": "HH:MM",
      "arriveTime": "HH:MM",
      "duration": "飞行时长，如 3h55m",
      "stops": 0,
      "priceRange": "¥XXXX-XXXX/人",
      "highlights": ["直飞", "含23kg行李", "准点率高"],
      "tips": "购票建议，如提前多少天最划算",
      "bookingUrl": "携程深链：https://flights.ctrip.com/international/search/oneway-{FROM_IATA}-{TO_IATA}?depdate=YYYY-MM-DD&cabin=y&adult=N（国内航线用 domestic/booking/oneway-{fromCity}-{toCity}）"
    }
  ],
  "hotels": [
    {
      "name": "酒店名称",
      "stars": 4,
      "area": "所在区域",
      "pricePerNight": "¥XXX-XXX/晚",
      "highlights": ["地铁直达", "含早餐", "市中心"],
      "tips": "预订建议",
      "bookingUrl": "Booking.com深链：https://www.booking.com/searchresults.html?ss={酒店名+城市}&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&group_adults=N&no_rooms=1"
    }
  ],
  "tickets": [
    {
      "attraction": "景点名称",
      "priceRange": "¥XX-XX/人",
      "highlights": ["热门项目", "省时"],
      "tips": "购票建议",
      "bookingUrl": "Klook深链：https://www.klook.com/zh-CN/search/?query={景点名称}"
    }
  ]
}
不相关的类别返回空数组 []。如果用户没提日期，bookingUrl 中日期用最近合适的时间填充。
如果用户没有指定目的地，推荐当前季节最热门的出行路线作为兜底（如三亚、东京、曼谷等），不要返回空数组。

━━ 意图 C：其他（与旅行完全无关的闲聊、测试、技术问题等）━━
有任何旅行相关性的输入都应归为意图 A 或 B，不要轻易归为 C。
返回：
{"type": "other", "message": "我是 Tabi，专注于帮你规划旅行和预订机票酒店。告诉我你想去哪里，或者需要订什么？"}`

async function callAI(systemPrompt: string, userMessage: string, temperature = 0.7): Promise<string> {
  const provider = (process.env.AI_PROVIDER || 'qwen').trim()

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
    })
    return res.choices[0].message.content || '{}'
  } else if (provider === 'deepseek') {
    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })
    const res = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
    })
    return res.choices[0].message.content || '{}'
  } else if (provider === 'qwen') {
    const qwen = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
    const res = await qwen.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
    })
    return res.choices[0].message.content || '{}'
  } else {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    return res.content[0].type === 'text' ? res.content[0].text : '{}'
  }
}

// ── Skeleton generation ──────────────────────────────────────────

const SKELETON_PROMPT = `你是旅行规划专家。根据用户需求，快速制定行程骨架。只返回 JSON，不要任何额外说明或 markdown 代码块。

JSON 结构：
{
  "destination": "目的地",
  "duration": 天数（数字）,
  "days": [
    {
      "day": 1,
      "theme": "当天主题，简短有吸引力，如「抵达·道顿堀初探」",
      "area": "主要活动区域，如「难波·心斋桥」",
      "morning": "上午安排方向",
      "afternoon": "下午安排方向",
      "evening": "晚上安排方向"
    }
  ]
}

要求：每天主题各异不重复；区域集中，不在同一天安排跨城景点；第一天考虑抵达，最后一天考虑离开；节奏合理。`

// ── Itinerary checker ────────────────────────────────────────────

const CHECKER_PROMPT = `你是旅行行程审查员。根据用户原始需求，审查行程是否存在明显问题。只检查两类问题：

1. 预算问题：用户明确说了预算，但行程估算明显超出（超出50%以上才报）
2. 节奏问题：某天活动超过5个（轻松/亲子/老人出行超过4个）算过多

如果没有问题，返回：{"ok": true}

如果有问题，返回：
{
  "ok": false,
  "warnings": ["具体问题描述，一句话，给用户看的，语气友好"]
}

规则：
- 用户没提预算就不检查预算
- warnings 最多3条，只说真实存在的问题
- 只返回 JSON，不要任何额外说明`

export async function checkItinerary(
  userMessage: string,
  plan: object
): Promise<{ ok: boolean; warnings?: string[] }> {
  try {
    const input = `用户需求：${userMessage}\n\n行程：${JSON.stringify(plan)}`
    const raw = await callAI(CHECKER_PROMPT, input, 0.1)
    const start = raw.search(/\{\s*"/)
    if (start === -1) return { ok: true }
    const result = JSON.parse(raw.slice(start))
    return result
  } catch {
    return { ok: true } // checker failure is non-fatal
  }
}

// ── Form intent parsing ──────────────────────────────────────────

const FORM_INTENT_PROMPT = `根据用户旅行需求，提取结构化信息。只返回 JSON，不要任何额外说明。

{
  "destination": "目的地，如「日本大阪」，没有则为 null",
  "origin": "出发地，如「上海」，没有则为 null",
  "duration": "天数，只能是以下之一：3/5/7/10+，根据用户说的天数映射，没有则为 null",
  "travelers": "人数，只能是以下之一：1/2/3+，根据用户说的人数映射，没有则为 \"1\"",
  "budget": "总预算，只能是以下之一：不限/5千/1万/2万/5万+，根据用户说的总预算映射，没有则为「不限」",
  "styles": ["旅行风格数组，从以下选择：美食/摄影/文化/购物/自然/亲子/蜜月/背包，没有则为空数组"]
}`

export async function parseFormIntent(userMessage: string): Promise<{
  destination?: string | null
  origin?: string | null
  duration?: string | null
  travelers?: string
  budget?: string
  styles?: string[]
}> {
  try {
    const raw = await callAI(FORM_INTENT_PROMPT, userMessage, 0)
    const start = raw.search(/\{\s*"/)
    if (start === -1) return {}
    return JSON.parse(raw.slice(start))
  } catch {
    return {}
  }
}

export async function generateSkeleton(userMessage: string): Promise<string> {
  try {
    const raw = await callAI(SKELETON_PROMPT, userMessage, 0.1)
    // Quick validate it looks like JSON
    const start = raw.search(/\{\s*"/)
    if (start === -1) return ''
    return raw.slice(start)
  } catch {
    return '' // Skeleton failure is non-fatal — caller will fall back to single-step
  }
}

export async function generateItinerary(userMessage: string): Promise<TripPlan> {
  const content = await callAI(ITINERARY_SYSTEM_PROMPT, userMessage)
  try {
    return JSON.parse(content) as TripPlan
  } catch {
    throw new Error('行程生成失败，请重新描述你的出行需求')
  }
}

export function generateItineraryStream(userMessage: string, skeleton?: string): ReadableStream {
  const provider = (process.env.AI_PROVIDER || 'qwen').trim()
  const encoder = new TextEncoder()

  // Inject skeleton into user message if available
  const enrichedMessage = skeleton
    ? `用户需求：${userMessage}\n\n请严格按照以下行程骨架展开，每天主题和区域不要改动，填充具体景点、餐厅、交通和费用细节：\n${skeleton}`
    : userMessage

  return new ReadableStream({
    async start(controller) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let stream: AsyncIterable<any>

        if (provider === 'qwen') {
          const qwen = new OpenAI({
            apiKey: process.env.DASHSCOPE_API_KEY,
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          })
          stream = await qwen.chat.completions.create({
            model: 'qwen-plus',
            messages: [
              { role: 'system', content: ITINERARY_SYSTEM_PROMPT },
              { role: 'user', content: enrichedMessage },
            ],
            temperature: 0.7,
            stream: true,
          })
        } else if (provider === 'openai') {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
          stream = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: ITINERARY_SYSTEM_PROMPT },
              { role: 'user', content: enrichedMessage },
            ],
            temperature: 0.7,
            stream: true,
          })
        } else if (provider === 'deepseek') {
          const deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com',
          })
          stream = await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: ITINERARY_SYSTEM_PROMPT },
              { role: 'user', content: enrichedMessage },
            ],
            temperature: 0.7,
            stream: true,
          })
        } else {
          // Claude streaming
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
          const claudeStream = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: ITINERARY_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: enrichedMessage }],
            stream: true,
          })
          for await (const event of claudeStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          return  // finally will close the controller
        }

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) controller.enqueue(encoder.encode(text))
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '生成失败'
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg })))
      } finally {
        controller.close()
      }
    },
  })
}
