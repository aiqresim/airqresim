import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

export const STORAGE_KEY = 'airqr.language';
export const SUPPORTED_LANGUAGES = ['en', 'ru'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
};

/** Narrows anything to a supported language, defaulting to English. */
export function toLanguage(value: unknown): Language | null {
  return typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
    ? (value as Language)
    : null;
}

/** localStorage wins, then the browser language (`ru-*` → ru), then English. */
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  const stored = toLanguage(window.localStorage?.getItem(STORAGE_KEY));
  if (stored) return stored;

  const navigatorLang = window.navigator?.language;
  if (navigatorLang?.toLowerCase().startsWith('ru')) return 'ru';

  return 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  // The app renders React nodes, not raw HTML strings.
  interpolation: { escapeValue: false },
});

/** Persists the choice so it survives a reload. */
export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language);
  try {
    window.localStorage?.setItem(STORAGE_KEY, language);
  } catch {
    // Private mode / storage disabled — the in-memory switch still works.
  }
}

export default i18n;