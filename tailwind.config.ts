import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nade: { ink: "#18221e", green: "#195f4a", mint: "#e2f1e9", paper: "#fcfdfb" }
      }
    }
  },
  plugins: []
};

export default config;
