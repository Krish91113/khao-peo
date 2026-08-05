import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        /* shadcn/ui semantic tokens */
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },

        /* Stitch design system surface tokens */
        "surface":                    "#fff8f6",
        "surface-dim":                "#eed5cd",
        "surface-bright":             "#fff8f6",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#fff1ec",
        "surface-container":          "#ffe9e3",
        "surface-container-high":     "#fce3db",
        "surface-container-highest":  "#f7ddd5",
        "surface-variant":            "#f7ddd5",
        "on-surface":                 "#261814",
        "on-surface-variant":         "#594139",
        "inverse-surface":            "#3c2d28",
        "inverse-on-surface":         "#ffede8",
        "inverse-primary":            "#ffb59b",
        "outline":                    "#8d7167",
        "outline-variant":            "#e1bfb4",
        "surface-tint":               "#aa3700",

        /* Primary/container tokens */
        "primary-container":          "#cc490f",
        "on-primary-container":       "#fffbff",
        "primary-fixed":              "#ffdbcf",
        "primary-fixed-dim":          "#ffb59b",
        "on-primary-fixed":           "#380d00",
        "on-primary-fixed-variant":   "#822800",

        /* Secondary tokens */
        "secondary-container":        "#e2dfde",
        "on-secondary-container":     "#636262",
        "secondary-fixed":            "#e5e2e1",
        "secondary-fixed-dim":        "#c8c6c5",

        /* Tertiary tokens */
        "tertiary":                   "#5c5c5a",
        "tertiary-container":         "#757572",
        "on-tertiary-container":      "#fefcf9",
        "tertiary-fixed":             "#e4e2df",
        "tertiary-fixed-dim":         "#c8c6c4",

        /* Status semantic colors */
        "status-success":             "#22C55E",
        "status-warning":             "#F59E0B",
        "status-error":               "#ba1a1a",
        "error-container":            "#ffdad6",
        "on-error-container":         "#93000a",
      },

      fontFamily: {
        /* Stitch typography system */
        sora:            ["Sora", "sans-serif"],
        inter:           ["Inter", "sans-serif"],
        "jetbrains-mono": ["JetBrains Mono", "monospace"],
        /* Semantic aliases matching Stitch design tokens */
        "headline-lg":   ["Sora", "sans-serif"],
        "headline-md":   ["Sora", "sans-serif"],
        "headline-sm":   ["Sora", "sans-serif"],
        "stat-number":   ["Sora", "sans-serif"],
        "body-lg":       ["Inter", "sans-serif"],
        "body-md":       ["Inter", "sans-serif"],
        "label-caps":    ["Inter", "sans-serif"],
        "monospace-kot": ["JetBrains Mono", "monospace"],
      },

      fontSize: {
        "headline-lg":   ["32px", { lineHeight: "40px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-md":   ["24px", { lineHeight: "32px", fontWeight: "700", letterSpacing: "-0.01em" }],
        "headline-sm":   ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "stat-number":   ["28px", { lineHeight: "32px", fontWeight: "700" }],
        "body-lg":       ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md":       ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-caps":    ["11px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.06em" }],
        "monospace-kot": ["14px", { lineHeight: "20px", fontWeight: "500" }],
      },

      spacing: {
        /* Stitch 4px base grid */
        "xs":     "4px",
        "sm":     "8px",
        "md":     "16px",
        "lg":     "24px",
        "xl":     "32px",
        "gutter": "16px",
        "margin": "24px",
        "base":   "4px",
        /* Layout constants */
        "sidebar": "260px",
        "topbar":  "64px",
      },

      borderRadius: {
        lg:   "var(--radius)",              /* 12px for cards */
        md:   "calc(var(--radius) - 4px)",  /* 8px for buttons/inputs */
        sm:   "calc(var(--radius) - 8px)",  /* 4px */
        full: "9999px",
      },

      boxShadow: {
        card:  "0 2px 8px hsl(15 30% 12% / 0.04), 0 1px 2px hsl(15 30% 12% / 0.04)",
        modal: "0 8px 24px hsl(15 30% 12% / 0.08), 0 2px 8px hsl(15 30% 12% / 0.04)",
        glow:  "0 10px 40px -10px hsl(18 80% 53% / 0.35)",
        input: "0 0 0 3px hsl(18 80% 53% / 0.15)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        scroll: {
          to: { transform: "translate(calc(-50% - 0.5rem))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        scroll: "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
