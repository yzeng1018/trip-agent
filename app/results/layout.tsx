import type { Metadata } from 'next'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}): Promise<Metadata> {
  const params = (await searchParams) ?? {}
  const raw = params.message ? decodeURIComponent(params.message) : null

  // Try to extract a destination hint from the message for a nicer title
  let title = 'AI 行程规划 — Tabi'
  let description = '用 AI 帮你规划专属旅行行程，包含每日安排、交通、住宿和贴士。'

  if (raw) {
    const trimmed = raw.slice(0, 80)
    description = `正在为你规划：${trimmed}${raw.length > 80 ? '…' : ''}`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://www.asktabi.com/results',
      siteName: 'Tabi',
      locale: 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: 'https://www.asktabi.com/results',
    },
  }
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children
}
