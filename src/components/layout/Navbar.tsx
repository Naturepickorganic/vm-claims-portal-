import { Link } from 'react-router-dom'

interface NavbarProps {
  crumb?:       string
  secondCrumb?: string
}

export default function Navbar({ crumb, secondCrumb }: NavbarProps) {
  return (
    <nav className="h-[60px] bg-navy flex items-center justify-between px-4 md:px-7 sticky top-0 z-50 shadow-[0_2px_20px_rgba(0,0,0,.3)]">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display text-[15px] font-black text-white shadow-[0_2px_8px_rgba(200,16,46,.4)]">
          VM
        </div>
        <span className="font-display text-[15px] font-bold text-white hidden sm:block">
          ValueMomentum <span className="text-[#FF8099]">Claims</span>
        </span>
      </Link>

      {crumb && (
        <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-white/40">
          {secondCrumb && <><span>{secondCrumb}</span><span className="opacity-25">/</span></>}
          <strong className="text-white/85 font-semibold">{crumb}</strong>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-white/40">
          🔒 Secure &amp; Encrypted
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-white/35">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Progress saved
        </div>
        <Link to="/" className="text-[12px] text-white/40 hover:text-white/80 transition-colors">
          Save &amp; Exit
        </Link>
      </div>
    </nav>
  )
}
