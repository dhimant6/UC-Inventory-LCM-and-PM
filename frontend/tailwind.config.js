/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)' },
        ink: { 1: 'var(--ink-1)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
        line: { DEFAULT: 'var(--line)', 2: 'var(--line-2)' },
        accent: { DEFAULT: 'var(--accent)', soft: 'var(--accent-soft)' },
        'on-accent': 'var(--on-accent)',
        s1: 'var(--s1)',
        s2: 'var(--s2)',
        s3: 'var(--s3)',
        s4: 'var(--s4)',
        s5: 'var(--s5)',
        s6: 'var(--s6)',
        ok: { DEFAULT: 'var(--ok)', ink: 'var(--ok-ink)' },
        warn: { DEFAULT: 'var(--warn)', ink: 'var(--warn-ink)' },
        serious: { DEFAULT: 'var(--serious)', ink: 'var(--serious-ink)' },
        crit: { DEFAULT: 'var(--crit)', ink: 'var(--crit-ink)' },
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
      },
    },
  },
  plugins: [],
};
