import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // HubblerX: Manrope for headings, labels, buttons, branding
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // HubblerX: DM Sans for body text and general interface
        body: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // HubblerX primary: Hubbler Green
        hubbler: {
          DEFAULT: '#07573F',
          950: 'rgba(7,87,63,0.95)',
          800: 'rgba(7,87,63,0.80)',
          650: 'rgba(7,87,63,0.65)',
          350: 'rgba(7,87,63,0.35)',
          160: 'rgba(7,87,63,0.16)',
          90:  'rgba(7,87,63,0.09)',
          40:  'rgba(7,87,63,0.04)',
        },
      },
      borderRadius: {
        // Design spec radii
        btn:   '8px',
        card:  '13px',
        hero:  '17px',
        tag:   '5px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(7,87,63,0.08), 0 4px 16px rgba(7,87,63,0.06)',
        soft: '0 18px 50px rgba(7,87,63,0.10)',
      },
    },
  },
  plugins: [forms],
} satisfies Config
