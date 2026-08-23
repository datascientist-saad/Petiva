/**
 * Global branding configuration for Pawly.
 * Change app name, tagline, and colors here — components consume these tokens.
 */
export const brand = {
  name: "Pawly",
  logoText: "🐾 Pawly",
  tagline: "Your pet’s health, all in one place.",
  subtitle:
    "Track care, vaccinations, meals, medications and health records — and get personalized help from Pawly AI.",
  supportEmail: "hello@pawly.app",
  colors: {
    primary: "#6B8F71",
    primaryForeground: "#FFFFFF",
    secondary: "#F3EDE4",
    secondaryForeground: "#3D3429",
    accent: "#E07A5F",
    accentForeground: "#FFFFFF",
    background: "#FAF7F2",
    foreground: "#2C2A26",
    muted: "#F0EBE3",
    mutedForeground: "#6B6560",
    card: "#FFFFFF",
    border: "#E8E0D5",
    ring: "#6B8F71",
    success: "#5A8F6B",
    warning: "#D4A373",
    danger: "#C45C4A",
  },
} as const;

export type Brand = typeof brand;
