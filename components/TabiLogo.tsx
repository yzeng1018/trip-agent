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
      {/* Symbol mark */}
      <svg width={d} height={d} viewBox="0 0 40 40" fill="none">
        {/* Subtle globe ring */}
        <circle cx="20" cy="20" r="15.5" stroke="#C7D2FE" strokeWidth="1.2" />
        {/* Flight arc */}
        <path
          d="M 9 30 C 11 17 25 11 32 18"
          stroke="#4338CA"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Origin dot */}
        <circle cx="9" cy="30" r="2" fill="#818CF8" />
        {/* Destination dot — warm accent */}
        <circle cx="32" cy="18" r="4.5" fill="#F97316" />
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
