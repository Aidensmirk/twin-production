/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#12141C",
        "bg-elevated": "#191C27",
        "bg-inset": "#0D0F16",
        fg: "#EDEAE3",
        "fg-dim": "#A9ACB8",
        "fg-faint": "#6B6E7A",
        you: "#D8A24A",
        "you-dim": "#8A6B3A",
        twin: "#5FA8A0",
        "twin-dim": "#3E6B66",
        warn: "#C1666B",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
