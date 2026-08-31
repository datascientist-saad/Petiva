export type Locale = "en" | "ar";

export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: Locale[] = ["ar"];

export function isRtlLocale(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export type MessageKey =
  | "app.name"
  | "app.tagline"
  | "app.subtitle"
  | "nav.today"
  | "nav.nutrition"
  | "nav.health"
  | "nav.carePlan"
  | "nav.records"
  | "nav.ai"
  | "nav.profile"
  | "nav.more"
  | "auth.signIn"
  | "auth.signUp"
  | "onboarding.welcome.title"
  | "onboarding.welcome.cta"
  | "safety.vetDisclaimer"
  | "safety.emergency"
  | "dashboard.today"
  | "dashboard.nutrition"
  | "dashboard.comingUp"
  | "dashboard.insight"
  | "species.cat"
  | "species.dog"
  | "species.bird";

type Messages = Record<MessageKey, string>;

const en: Messages = {
  "app.name": "Animivo",
  "app.tagline": "Every pet. One smarter care plan.",
  "app.subtitle": "Personalized nutrition, health and preventive care for every kind of pet.",
  "nav.today": "Today",
  "nav.nutrition": "Nutrition",
  "nav.health": "Health",
  "nav.carePlan": "Care Plan",
  "nav.records": "Records",
  "nav.ai": "Animivo AI",
  "nav.profile": "Profile",
  "nav.more": "More",
  "auth.signIn": "Sign in",
  "auth.signUp": "Create account",
  "onboarding.welcome.title": "Better care starts with knowing your pet",
  "onboarding.welcome.cta": "Create my pet's plan",
  "safety.vetDisclaimer":
    "Animivo provides educational guidance and does not replace advice from a qualified veterinarian.",
  "safety.emergency": "This may need urgent veterinary care. Contact a veterinarian immediately.",
  "dashboard.today": "Today",
  "dashboard.nutrition": "Nutrition",
  "dashboard.comingUp": "Coming up",
  "dashboard.insight": "Important insight",
  "species.cat": "Cat",
  "species.dog": "Dog",
  "species.bird": "Bird",
};

const ar: Partial<Messages> = {
  "app.name": "أنيميفو",
  "app.tagline": "كل حيوان أليف. خطة رعاية أذكى.",
  "nav.today": "اليوم",
  "nav.nutrition": "التغذية",
  "nav.health": "الصحة",
  "nav.carePlan": "خطة الرعاية",
  "nav.ai": "ذكاء أنيميفو",
  "auth.signIn": "تسجيل الدخول",
  "auth.signUp": "إنشاء حساب",
};

const catalogs: Record<Locale, Messages> = {
  en,
  ar: { ...en, ...ar } as Messages,
};

export function t(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key;
}
