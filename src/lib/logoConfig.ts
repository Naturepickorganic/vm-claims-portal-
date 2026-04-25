import { useState, useEffect } from 'react'

export interface LogoConfig {
  type:     'text' | 'image'
  name:     string
  initials: string
  src?:     string
  primaryColor?:  string
  accentColor?:   string
}

export const LOGO_PRESETS: Record<string, LogoConfig> = {
  vm: {
    type: 'text', name: 'ValueMomentum', initials: 'VM',
    primaryColor: '#C8102E', accentColor: '#FF8099',
  },
  country_financial: {
    type: 'text', name: 'Country Financial', initials: 'CF',
    primaryColor: '#003087', accentColor: '#0052CC',
  },
  society: {
    type: 'text', name: 'Society Insurance', initials: 'SI',
    primaryColor: '#1A5C38', accentColor: '#2E8B57',
  },
  pekin: {
    type: 'text', name: 'Pekin Insurance', initials: 'PI',
    primaryColor: '#8B0000', accentColor: '#CC0000',
  },
  idfb: {
    type: 'text', name: 'IDFB Insurance', initials: 'IB',
    primaryColor: '#1A237E', accentColor: '#3949AB',
  },
  custom: {
    type: 'text', name: 'Your Company', initials: 'YC',
    primaryColor: '#C8102E', accentColor: '#FF8099',
  },
}

const STORAGE_KEY = 'vm_portal_logo'

export function useLogo() {
  const [logoKey, setLogoKey] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEY) ?? 'vm'
  )

  const logo = LOGO_PRESETS[logoKey] ?? LOGO_PRESETS.vm

  const setLogo = (key: string) => {
    setLogoKey(key)
    localStorage.setItem(STORAGE_KEY, key)
  }

  return { logo, logoKey, setLogo, presets: LOGO_PRESETS }
}
