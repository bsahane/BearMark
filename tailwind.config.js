/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts}', './extension/**/*.{html,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bear: {
          50: '#fefcf9',
          100: '#fdf8f2',
          200: '#fbeee1',
          300: '#f7ddc7',
          400: '#f2c49b',
          500: '#eba564',
          600: '#d1883f',
          700: '#b16d2d',
          800: '#8f5728',
          900: '#744925',
        },
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: '500',
            },
            code: {
              color: 'inherit',
              fontWeight: '400',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
