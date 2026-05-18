interface VMlogoProps {
  size?:    'sm' | 'md' | 'lg'
  variant?: 'mark-only' | 'full' | 'full-light'
}

const SIZES = {
  sm: { w: 28, h: 19 },
  md: { w: 40, h: 27 },
  lg: { w: 60, h: 40 },
}

/**
 * ValueMomentum geometric logo mark — SVG recreation
 * Exact proportions from the official VM logo:
 * - Light blue triangle  (left outer)   #69A7FD
 * - Dark cobalt triangle (left inner)   #2563EB
 * - Gold diamond         (center)       #FABD00
 * - Dark green triangle  (right inner)  #2EB124
 * - Light green triangle (right outer)  #6CC04A
 */
export default function VMlogo({ size = 'md', variant = 'mark-only' }: VMlogoProps) {
  const { w, h } = SIZES[size]

  const mark = (
    <svg width={w} height={h} viewBox="0 0 66 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left outer — light blue */}
      <polygon points="0,0 22,0 11,22" fill="#69A7FD" />
      {/* Left inner — dark cobalt blue */}
      <polygon points="11,22 22,0 33,22" fill="#2563EB" />
      {/* Center — gold diamond */}
      <rect
        x="30" y="17" width="8" height="8"
        transform="rotate(45 33 22)"
        fill="#FABD00"
      />
      {/* Right inner — dark green */}
      <polygon points="33,22 44,0 55,22" fill="#2EB124" />
      {/* Right outer — light green */}
      <polygon points="44,0 66,0 55,22" fill="#6CC04A" />
    </svg>
  )

  if (variant === 'mark-only') return mark

  return (
    <div className="flex items-center gap-2.5">
      {mark}
      <div className="flex flex-col leading-none">
        <span className={`font-bold text-[14px] tracking-[-0.01em] ${variant === 'full-light' ? 'text-white' : 'text-[#1A2744]'}`}>
          ValueMomentum
        </span>
        <span className={`text-[10.5px] mt-0.5 ${variant === 'full-light' ? 'text-white/50' : 'text-[#718096]'}`}>
          Claims Portal
        </span>
      </div>
    </div>
  )
}
