import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#141413',
        paper: '#faf9f5',
        muted: '#b0aea5',
        orange: '#d97757',
        blue: '#6a9bcc',
        green: '#788c5d'
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        card: '14px'
      }
    }
  },
  plugins: []
};

export default config;
