/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:    '#FAF7F2',
        cream: {
          100: '#FFFFFF',
          200: '#FDF9F5',
          300: '#FAF7F2',
          400: '#F5EFE5',
          500: '#EDE3D5',
          600: '#E5D9C8',
          700: '#D4C4B0',
        },
        brand: {
          50:  '#FDF3EC',
          100: '#F0E4D7',
          200: '#E0C4A0',
          300: '#D4934A',
          400: '#C4722A',
          500: '#B45A1A',
          600: '#9A4A10',
          700: '#7A3808',
        },
        leaf: {
          50:  '#F2F5EC',
          100: '#E4EBDA',
          200: '#C5D7A8',
          400: '#6B9448',
          500: '#527A38',
          600: '#3E6028',
        },
        bark: {
          50:  '#F8F2EC',
          100: '#EEE1D1',
          200: '#D4BFA5',
          300: '#B89A7A',
          400: '#9A7A58',
          500: '#7A5C3A',
          600: '#5C4428',
          700: '#4A3520',
          800: '#2D1B0E',
        },
        ink: {
          DEFAULT: '#2D1B0E',
          secondary: '#6B5744',
          muted: '#9B8474',
          faint: '#C4B4A4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
