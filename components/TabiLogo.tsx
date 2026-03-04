interface TabiLogoProps {
  size?: 'sm' | 'md' | 'lg'
  theme?: 'dark' | 'light'
}

export function TabiLogo({ size = 'md', theme = 'dark' }: TabiLogoProps) {
  const heights = { sm: 48, md: 68, lg: 88 }
  const textSize = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-5xl' }
  const h = heights[size]
  const w = Math.round(h * 44 / 60)
  const wordColor = theme === 'light' ? '#ffffff' : '#1e1b4b'

  return (
    <div className="flex items-center gap-3 select-none">
      <svg width={w} height={h} viewBox="0 0 44 60" fill="none">

        {/* Tail (behind body, right side) */}
        <circle cx="35" cy="44" r="4.5" fill="#C7D2FE" />

        {/* Body */}
        <ellipse cx="22" cy="42" rx="13" ry="13" fill="#818CF8" />
        {/* Tummy */}
        <ellipse cx="22" cy="44" rx="8" ry="9" fill="#C7D2FE" />

        {/* Arms */}
        <ellipse cx="7" cy="37" rx="6.5" ry="3" fill="#818CF8" transform="rotate(-28 7 37)" />
        <ellipse cx="37" cy="37" rx="6.5" ry="3" fill="#818CF8" transform="rotate(28 37 37)" />

        {/* Feet (drawn after body so they appear in front) */}
        <ellipse cx="14" cy="57" rx="10" ry="3.5" fill="#818CF8" />
        <ellipse cx="30" cy="57" rx="10" ry="3.5" fill="#818CF8" />

        {/* Ears (behind head) */}
        <ellipse cx="15" cy="11" rx="5.2" ry="11" fill="#818CF8" />
        <ellipse cx="15" cy="11" rx="2.9" ry="7.8" fill="#FCA5A5" />
        <ellipse cx="29" cy="11" rx="5.2" ry="11" fill="#818CF8" />
        <ellipse cx="29" cy="11" rx="2.9" ry="7.8" fill="#FCA5A5" />

        {/* Head */}
        <circle cx="22" cy="21" r="13" fill="#818CF8" />

        {/* Left eye */}
        <circle cx="16" cy="19" r="3.8" fill="white" />
        <circle cx="16.5" cy="19.5" r="2.3" fill="#1e1b4b" />
        <circle cx="17.8" cy="18.1" r="1.1" fill="white" />

        {/* Right eye */}
        <circle cx="28" cy="19" r="3.8" fill="white" />
        <circle cx="28.5" cy="19.5" r="2.3" fill="#1e1b4b" />
        <circle cx="29.8" cy="18.1" r="1.1" fill="white" />

        {/* Blush */}
        <ellipse cx="10.5" cy="23.5" rx="3.5" ry="2.2" fill="#FCA5A5" opacity="0.55" />
        <ellipse cx="33.5" cy="23.5" rx="3.5" ry="2.2" fill="#FCA5A5" opacity="0.55" />

        {/* Nose */}
        <ellipse cx="22" cy="25.5" rx="2.2" ry="1.5" fill="#F97316" />

        {/* Smile */}
        <path d="M 19.8 27.5 Q 22 29.8 24.2 27.5" stroke="#F97316" strokeWidth="1.1" strokeLinecap="round" fill="none" />

      </svg>

      <span
        className={`${textSize[size]} font-bold leading-none`}
        style={{ color: wordColor, letterSpacing: '-0.04em' }}
      >
        tabi
      </span>
    </div>
  )
}
