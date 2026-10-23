/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sahay: {
          ivory: '#F6F5F0',
          surface: '#FFFFFF',
          charcoal: '#252B29',
          'forest-deep': '#203D35',
          'forest-action': '#376653',
          'forest-hover': '#2d5444',
          'forest-light': '#E9F0EC',
          teal: '#648C83',
          'teal-light': '#EDF4F2',
          slate: '#6B746F',
          border: '#E5E3DC',
          'border-light': '#F0EFEA',
          ochre: '#B88735',
          'ochre-light': '#FAF4EA',
          terracotta: '#B84F43',
          'terracotta-light': '#FBF0EF',
          green: '#477A5B',
          'green-light': '#EDF5F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(32, 61, 53, 0.04), 0 1px 2px -1px rgba(32, 61, 53, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(32, 61, 53, 0.07), 0 2px 4px -2px rgba(32, 61, 53, 0.05)',
        'modal': '0 10px 25px -5px rgba(32, 61, 53, 0.15), 0 8px 10px -6px rgba(32, 61, 53, 0.1)',
      },
    },
  },
  plugins: [],
}
