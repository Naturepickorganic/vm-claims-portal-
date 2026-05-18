import { Link } from 'react-router-dom'
import VMlogo from '@/components/ui/VMlogo'

interface NavbarProps {
  crumb?:       string
  secondCrumb?: string
}

export default function Navbar({ crumb, secondCrumb }: NavbarProps) {
  return (
    <nav className="h-[60px] bg-primary-deep flex items-center justify-between px-4 md:px-7 sticky top-0 z-50"
      style={{ boxShadow:'0 2px 20px rgba(2,64,153,.3)' }}>

      <Link to="/" className="flex items-center">
        <VMlogo size="md" variant="full-light" />
      </Link>

      {crumb && (
        <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-white/40">
          {secondCrumb && (
            <><span>{secondCrumb}</span><span className="opacity-25">/</span></>
          )}
          <strong className="text-white/85 font-semibold">{crumb}</strong>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-white/35">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Secure
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-white/30">
          <span className="w-1.5 h-1.5 rounded-full bg-success-bright animate-pulse" />
          Progress saved
        </div>
        <Link to="/" className="text-[12px] text-white/40 hover:text-white/70 transition-colors">
          Save &amp; Exit
        </Link>
      </div>
    </nav>
  )
}
