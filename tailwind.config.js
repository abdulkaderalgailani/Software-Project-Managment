export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#FFF4ED',100:'#FFE6D5',200:'#FECDAA',300:'#FDAC74',400:'#FB8A3C',
          500:'#F26722',600:'#E14E12',700:'#BB3B11',800:'#952F15',900:'#782914',
        },
        surface:'#FAF9F7', border:'#ECE9E4', muted:'#78716C', ink:'#1C1917',
        success:'#2E7D5B', danger:'#C0392B',
      },
      borderRadius: { xl:'0.75rem', '2xl':'1rem' },
    },
  },
  plugins: [],
};
