/**
 * Global branding configuration for Animivo.
 * Change app name, tagline, and colors here — components consume these tokens.
 */
export const brand = {
  name: "Animivo",
  logoText: "Animivo",
  tagline: "Every pet. One smarter care plan.",
  subtitle:
    "Personalized nutrition, health and preventive care for every kind of pet.",
  positioning:
    "Animivo creates an evolving nutrition, health and preventive-care plan for every pet.",
  supportEmail: "hello@animivo.app",
  aiName: "Animivo AI",
  colors: {
    primary: "#5B7C6B",
    primaryForeground: "#FFFFFF",
    secondary: "#EEF2ED",
    secondaryForeground: "#2C3A32",
    accent: "#C47A5A",
    accentForeground: "#FFFFFF",
    background: "#F8F7F4",
    foreground: "#1F2421",
    muted: "#ECEAE6",
    mutedForeground: "#5C6560",
    card: "#FFFFFF",
    border: "#DDE3DC",
    ring: "#5B7C6B",
    success: "#4F8A6B",
    warning: "#C49A5A",
    danger: "#B85C4A",
  },
} as const;

export type Brand = typeof brand;
