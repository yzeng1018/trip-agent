interface TabiLogoProps {
  size?: 'sm' | 'md' | 'lg'
  theme?: 'dark' | 'light'
}

export function TabiLogo({ size = 'md', theme = 'dark' }: TabiLogoProps) {
  const dims = { sm: 28, md: 36, lg: 48 }
  const textSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
  const d = dims[size]
  const wordColor = theme === 'light' ? '#ffffff' : '#1e1b4b'

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Rabbit mascot */}
      <svg width={d} height={d} viewBox="0 0 40 40" fill="none">
        {/* Left ear */}
        <ellipse cx="13" cy="11" rx="4" ry="9" fill="#818CF8" />
        <ellipse cx="13" cy="11" rx="2.3" ry="6.5" fill="#C7D2FE" />
        {/* Right ear */}
        <ellipse cx="27" cy="11" rx="4" ry="9" fill="#818CF8" />
        <ellipse cx="27" cy="11" rx="2.3" ry="6.5" fill="#C7D2FE" />
        {/* Head */}
        <circle cx="20" cy="27" r="11" fill="#818CF8" />
        {/* Left eye */}
        <circle cx="16" cy="26" r="2" fill="white" />
        <circle cx="16.5" cy="26" r="1.1" fill="#1e1b4b" />
        {/* Right eye */}
        <circle cx="24" cy="26" r="2" fill="white" />
        <circle cx="24.5" cy="26" r="1.1" fill="#1e1b4b" />
        {/* Nose */}
        <ellipse cx="20" cy="30.5" rx="2" ry="1.4" fill="#F97316" />
      </svg>

      {/* Wordmark */}
      <span
        className={`${textSize[size]} font-bold tracking-tight leading-none`}
        style={{ color: wordColor, letterSpacing: '-0.03em' }}
      >
        tabi
      </span>
    </div>
  )
}
