import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#0A1628', mid: '#162035', light: '#1E2D47' },
        red:    { DEFAULT: '#C8102E', dark: '#9B0C22', light: '#FDF1F3', mid: '#FECDD3' },
        green:  { DEFAULT: '#059669', dark: '#047857', light: '#ECFDF5', mid: '#A7F3D0' },
        amber:  { DEFAULT: '#D97706', light: '#FFFBEB' },
        blue:   { DEFAULT: '#2563EB', light: '#EFF6FF', mid: '#BFDBFE' },
        slate:  { DEFAULT: '#4A5568' },
        muted:  { DEFAULT: '#718096' },
        faint:  { DEFAULT: '#A0AEC0' },
        border: { DEFAULT: '#E8EDF5' },
        bg:     { DEFAULT: '#F5F7FB' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'card':  '0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)',
        'red':   '0 4px 16px rgba(200,16,46,.25)',
        'green': '0 4px 16px rgba(5,150,105,.25)',
      },
      width: { '68': '272px' },
    },
  },
  plugins: [],
} satisfies Config
