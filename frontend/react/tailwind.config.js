// Alquimia DS: cores e raios vêm das variáveis de src/index.css.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        system: { 50: "var(--system-050)", 100: "var(--system-100)", 200: "var(--system-200)", 500: "var(--system-500)", 600: "var(--system-600)", 700: "var(--system-700)" },
        ink: { 900: "var(--ink-900)", 700: "var(--ink-700)", 500: "var(--ink-500)", 300: "var(--ink-300)" },
        surface: { page: "var(--surface-page)", card: "var(--surface-card)", subtle: "var(--surface-subtle)" },
        line: "var(--border-subtle)",
        error: { 50: "var(--error-050)", 500: "var(--error-500)", 600: "var(--error-600)" },
        success: { 50: "var(--success-050)", 500: "var(--success-500)", 600: "var(--success-600)" },
        attention: { 50: "var(--attention-050)", 700: "var(--attention-700)" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: { card: "var(--shadow-0)", pop: "var(--shadow-2)" },
      borderRadius: { card: "var(--radius-card)", input: "var(--radius-input)", btn: "var(--radius-button)" },
    },
  },
  plugins: [],
};
