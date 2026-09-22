export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          tint: 'var(--brand-tint)',
        },
        navy: 'var(--navy)',
        'page-bg': 'var(--page-bg)',
        surface: 'var(--surface)',
        'surface-nested': 'var(--surface-nested)',
        'input-bg': 'var(--input-bg)',
        'hover-bg': 'var(--hover-bg)',
        border: 'var(--border)',
        muted: 'var(--text-muted)',
        text: {
          DEFAULT: 'var(--text)',
          body: 'var(--text-body)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        'on-navy': 'var(--text-on-navy)',
        'on-navy-muted': 'var(--text-on-navy-muted)',
        success: {
          bg: 'var(--success-bg)',
          text: 'var(--success-text)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          tint: 'var(--danger-tint)',
        }
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
    },
  },
  plugins: [],
};
