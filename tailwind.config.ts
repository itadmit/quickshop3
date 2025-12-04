import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#10B981',
          'green-light': '#15B981',
          'green-hover': '#059669',
          'green-bg': '#D1FAE5',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #15b981 0%, #10b981 100%)',
      },
      fontFamily: {
        sans: ['Noto Sans Hebrew', 'sans-serif'],
        logo: ['Pacifico', 'cursive'],
      },
    },
  },
  plugins: [],
}

export default config

