// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 80's Neon Palette
        primary: "#FF1493", // Hot Pink
        secondary: "#00FFFF", // Cyan
        accent: "#FF69B4", // Hot Pink variant
        neon: {
          pink: "#FF1493",
          cyan: "#00FFFF",
          purple: "#9932CC",
          green: "#39FF14",
          yellow: "#FFFF00",
          orange: "#FF4500",
          blue: "#0080FF",
          magenta: "#FF00FF",
        },
        retro: {
          dark: "#0D0D0D",
          darker: "#050505",
          grid: "#1A1A2E",
          glow: "#16213E",
        },
        "bg-dark": "#0D0D0D",
        "glass-bg": "rgba(255, 255, 255, 0.05)",
        "glass-border": "rgba(255, 255, 255, 0.1)",
      },
      fontFamily: {
        retro: ["Orbitron", "Space Grotesk", "monospace"],
        cyber: ["Chakra Petch", "Roboto Mono", "monospace"],
      },
      animation: {
        "neon-pulse": "neon-pulse 2s ease-in-out infinite alternate",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 3s ease-in-out infinite",
        scan: "scan 2s linear infinite",
        flicker: "flicker 0.15s infinite linear alternate",
        "slide-in": "slide-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "zoom-in": "zoom-in 0.3s ease-out",
        "gradient-shift": "gradient-shift 3s ease-in-out infinite",
      },
      keyframes: {
        "neon-pulse": {
          "0%": {
            textShadow:
              "0 0 5px #FF1493, 0 0 10px #FF1493, 0 0 15px #FF1493, 0 0 20px #FF1493",
          },
          "100%": {
            textShadow:
              "0 0 10px #FF1493, 0 0 20px #FF1493, 0 0 30px #FF1493, 0 0 40px #FF1493",
          },
        },
        glow: {
          "0%": {
            boxShadow: "0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00FFFF",
          },
          "100%": {
            boxShadow:
              "0 0 30px #00FFFF, 0 0 40px #00FFFF, 0 0 50px #00FFFF, 0 0 60px #00FFFF",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        flicker: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0.8" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "zoom-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      boxShadow: {
        neon: "0 0 20px #FF1493, 0 0 30px #FF1493, 0 0 40px #FF1493",
        "neon-cyan": "0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00FFFF",
        "neon-purple": "0 0 20px #9932CC, 0 0 30px #9932CC, 0 0 40px #9932CC",
        "retro-inset": "inset 0 2px 4px rgba(255, 255, 255, 0.1)",
        "retro-glow":
          "0 0 30px rgba(255, 20, 147, 0.3), 0 0 60px rgba(255, 20, 147, 0.1)",
      },
      backdropBlur: {
        xs: "2px",
        retro: "10px",
      },
      backgroundImage: {
        "retro-grid":
          "linear-gradient(rgba(255, 20, 147, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 20, 147, 0.1) 1px, transparent 1px)",
        "cyber-gradient":
          "linear-gradient(135deg, #FF1493 0%, #00FFFF 50%, #9932CC 100%)",
        "neon-gradient":
          "linear-gradient(45deg, #FF1493, #00FFFF, #9932CC, #39FF14)",
        "retro-scan":
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 20, 147, 0.1) 2px, rgba(255, 20, 147, 0.1) 4px)",
      },
      backgroundSize: {
        grid: "50px 50px",
        scan: "100% 4px",
      },
    },
  },
  plugins: [],
};
