import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18212f',
        mist: '#f5f7fb',
        saffron: '#d97706',
        rosewood: '#9f1239'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(24, 33, 47, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
