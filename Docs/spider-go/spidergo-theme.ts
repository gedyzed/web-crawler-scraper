import { extendTheme } from "@farming-labs/docs";
import { darksharp } from "@farming-labs/theme/darksharp";

export const spidergoTheme = extendTheme(darksharp(), {
  name: "spidergo-theme",
  ui: {
    colors: {
      primary: "hsl(192 90% 42%)",
      primaryForeground: "hsl(0 0% 100%)",
      background: "hsl(216 33% 5%)",
      foreground: "hsl(0 0% 98%)",
      muted: "hsl(216 25% 12%)",
      mutedForeground: "hsl(0 0% 68%)",
      border: "hsl(216 20% 16%)",
      card: "hsl(216 30% 8%)",
      cardForeground: "hsl(0 0% 98%)",
      accent: "hsl(216 25% 14%)",
      accentForeground: "hsl(0 0% 98%)",
      secondary: "hsl(216 25% 14%)",
      secondaryForeground: "hsl(0 0% 98%)",
      ring: "hsl(192 90% 42%)",
      popover: "hsl(216 30% 8%)",
      popoverForeground: "hsl(0 0% 98%)",
    },
    radius: "0.625rem",
    sidebar: {
      style: "bordered",
    },
    card: {
      bordered: true,
    },
    layout: {
      sidebarWidth: 300,
      toc: {
        enabled: true,
        depth: 3,
        style: "default",
      },
    },
    typography: {
      font: {
        style: {
          sans: "var(--fd-font-sans, var(--font-geist-sans, system-ui, -apple-system, sans-serif))",
          mono: "var(--fd-font-mono, var(--font-geist-mono, ui-monospace, monospace))",
        },
        h1: { size: "2.65rem", weight: 750, letterSpacing: "-0.03em", lineHeight: "1.15" },
        h2: { size: "1.8rem", weight: 700, letterSpacing: "-0.02em", lineHeight: "1.2" },
        h3: { size: "1.35rem", weight: 650, lineHeight: "1.3" },
        body: { size: "1rem", lineHeight: "1.6" },
      },
    },
    codeBlock: {
      showCopyButton: true,
      showLineNumbers: false,
      theme: "github-dark",
      darkTheme: "github-dark",
    },
  },
});
