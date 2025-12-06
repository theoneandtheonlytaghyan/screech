/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Screech owl theme colors
        screech: {
          dark: '#1C1410',
          darker: '#0F0A08',
          card: '#2D2419',
          border: '#3D3329',
          hover: '#4D4339',
          accent: '#D4A574',
          accentHover: '#C49464',
          text: '#F5E6D3',
          textMuted: '#9C8170',
          textDark: '#6B5A4A'
        },
        clan: {
          owl: '#8B7355',
          wolf: '#6B7B8C',
          hawk: '#C19A6B',
          fox: '#D2691E',
          bear: '#8B4513',
          raven: '#2F2F2F'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif'
        ]
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      boxShadow: {
        'screech': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'screech-lg': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'screech-xl': '0 8px 24px rgba(0, 0, 0, 0.5)'
      }
    }
  },
  plugins: []
};