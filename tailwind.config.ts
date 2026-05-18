import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {

        /* ══════════════════════════════════════════════════════
           VM BRAND — new token names (used in new pages)
           ══════════════════════════════════════════════════════ */
        primary: {
          DEFAULT: '#0254CC',   // VM Mid Blue
          deep:    '#024099',   // VM Deep Blue — nav/hero
          bright:  '#056BFC',   // VM Bright Blue
          light:   '#69A7FD',   // VM Light Blue (logo element)
          pale:    '#EBF3FF',   // pale blue backgrounds
          50:      '#F0F6FF',
        },
        success: {
          DEFAULT: '#2EB124',   // VM Green
          bright:  '#6CC04A',   // VM Light Green (logo element)
          dark:    '#1A6B14',
          light:   '#EDFAEB',
          mid:     '#A8E4A2',
        },
        accent: {
          DEFAULT: '#FABD00',   // VM Gold — CTA, progress
          dark:    '#C9970A',
          light:   '#FFF8E1',
          mid:     '#FDE68A',
        },
        danger: {
          DEFAULT: '#DC2626',
          light:   '#FEF2F2',
          mid:     '#FECACA',
          dark:    '#991B1B',
        },
        text: {
          DEFAULT:   '#1A2744',
          secondary: '#4A5568',
          muted:     '#718096',
          faint:     '#A0AEC0',
        },
        ui: {
          border: '#E2E8F2',
          bg:     '#F5F8FF',
          card:   '#FFFFFF',
        },

        /* ══════════════════════════════════════════════════════
           BACKWARD COMPAT — old token names (existing pages)
           Maps old names → VM brand values so nothing breaks
           ══════════════════════════════════════════════════════ */
        navy: {
          DEFAULT: '#024099',   // was #0A1628 → now VM Deep Blue
          mid:     '#02306B',
          light:   '#1E4080',
          border:  'rgba(255,255,255,0.08)',
        },
        red: {
          DEFAULT: '#DC2626',   // kept as error/danger red
          dark:    '#991B1B',
          light:   '#FEF2F2',
          mid:     '#FECACA',
        },
        green: {
          DEFAULT: '#2EB124',   // → VM Green
          dark:    '#1A6B14',
          light:   '#EDFAEB',
          mid:     '#A8E4A2',
          400:     '#4AE040',
          300:     '#86EFAC',
        },
        amber: {
          DEFAULT: '#D97706',
          light:   '#FFF8E1',
        },
        blue: {
          DEFAULT: '#0254CC',   // → VM Mid Blue
          light:   '#EBF3FF',
          mid:     '#BFDBFE',
          400:     '#60A5FA',
          300:     '#93C5FD',
        },
        /* These are used heavily in existing pages */
        slate:  { DEFAULT: '#4A5568' },
        muted:  { DEFAULT: '#718096' },
        faint:  { DEFAULT: '#A0AEC0' },
        border: { DEFAULT: '#E2E8F2' },
        bg:     { DEFAULT: '#F5F8FF' },
      },

      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },

      boxShadow: {
        'card':    '0 1px 4px rgba(2,64,153,.06), 0 4px 16px rgba(2,64,153,.08)',
        'card-lg': '0 4px 8px rgba(2,64,153,.08), 0 16px 40px rgba(2,64,153,.12)',
        'primary': '0 4px 16px rgba(2,84,204,.30)',
        'green':   '0 4px 16px rgba(46,177,36,.25)',
        'red':     '0 4px 12px rgba(220,38,38,.25)',
        'accent':  '0 4px 16px rgba(250,189,0,.30)',
      },

      width: { '68': '272px', '72': '288px' },
    },
  },
  plugins: [],
} satisfies Config
