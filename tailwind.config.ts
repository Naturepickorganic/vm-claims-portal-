import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── VM Brand Blues ───────────────────────────── */
        primary: {
          DEFAULT: '#0254CC',   // VM Mid Blue — buttons, active states
          deep:    '#024099',   // VM Deep Blue — nav, dark backgrounds
          bright:  '#056BFC',   // VM Bright Blue — links, highlights
          light:   '#69A7FD',   // VM Light Blue — logo element
          pale:    '#EBF3FF',   // VM Pale Blue — card backgrounds
          50:      '#F0F6FF',
        },
        /* ── VM Brand Greens ──────────────────────────── */
        success: {
          DEFAULT: '#2EB124',   // VM Green — success, positive
          bright:  '#6CC04A',   // VM Light Green — logo element
          dark:    '#1A6B14',
          light:   '#EDFAEB',
          mid:     '#A8E4A2',
        },
        /* ── VM Gold ──────────────────────────────────── */
        accent: {
          DEFAULT: '#FABD00',   // VM Gold — CTAs, progress, premium
          dark:    '#C9970A',
          light:   '#FFF8E1',
          mid:     '#FDE68A',
        },
        /* ── Semantic ─────────────────────────────────── */
        danger: {
          DEFAULT: '#DC2626',
          light:   '#FEF2F2',
          mid:     '#FECACA',
          dark:    '#991B1B',
        },
        /* ── Neutrals ─────────────────────────────────── */
        text: {
          DEFAULT: '#1A2744',   // primary text
          secondary: '#4A5568',
          muted:     '#718096',
          faint:     '#A0AEC0',
        },
        ui: {
          border:  '#E2E8F2',
          bg:      '#F5F8FF',   // page background — slightly blue tinted
          card:    '#FFFFFF',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 4px rgba(2,64,153,.06), 0 4px 16px rgba(2,64,153,.08)',
        'card-lg': '0 4px 8px rgba(2,64,153,.08), 0 16px 40px rgba(2,64,153,.12)',
        'primary': '0 4px 16px rgba(2,84,204,.30)',
        'success': '0 4px 16px rgba(46,177,36,.25)',
        'accent':  '0 4px 16px rgba(250,189,0,.30)',
        'danger':  '0 4px 12px rgba(220,38,38,.25)',
      },
      borderRadius: {
        'xl':  '10px',
        '2xl': '14px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
} satisfies Config
