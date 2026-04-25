import { useState } from 'react'

interface TipProps { title?: string; children: React.ReactNode }

export default function Tip({ title, children }: TipProps) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex align-middle ml-0.5">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-4 h-4 rounded-full bg-blue/10 border border-blue/20 text-blue text-[9px] font-black cursor-help inline-flex items-center justify-center hover:bg-blue hover:text-white transition-colors">
        i
      </button>
      {open && (
        <span className="absolute left-5 top-[-4px] z-50 bg-navy text-slate-300 text-[11.5px] leading-relaxed p-3 rounded-xl w-[230px] shadow-[0_10px_30px_rgba(0,0,0,.3)] whitespace-normal font-normal">
          <span className="absolute left-[-5px] top-[9px] w-2.5 h-2.5 bg-navy rotate-45 rounded-sm" />
          {title && <span className="block text-yellow-300 font-bold text-[10.5px] uppercase tracking-wide mb-1">{title}</span>}
          {children}
        </span>
      )}
    </span>
  )
}
