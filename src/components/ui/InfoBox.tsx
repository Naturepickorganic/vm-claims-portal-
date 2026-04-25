import { clsx } from 'clsx'

type InfoType = 'blue' | 'green' | 'amber' | 'red' | 'neutral' | 'teal'

const STYLES: Record<InfoType, string> = {
  blue:    'info-blue',
  green:   'info-green',
  amber:   'info-amber',
  red:     'info-red',
  neutral: 'info-neutral',
  teal:    'info-teal',
}

interface InfoBoxProps {
  type?:      InfoType
  icon?:      string
  children:   React.ReactNode
  className?: string
}

export default function InfoBox({ type = 'blue', icon, children, className }: InfoBoxProps) {
  return (
    <div className={clsx('info-box', STYLES[type], className)}>
      {icon && <span className="text-[15px] flex-shrink-0 mt-px">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}
