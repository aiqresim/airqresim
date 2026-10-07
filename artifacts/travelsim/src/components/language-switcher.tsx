import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

import { SUPPORTED_LANGUAGES, setLanguage, type Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Compact EN/RU toggle persisted to localStorage. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language) as Language;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border p-0.5',
        className,
      )}
      role="group"
      aria-label={t('language.label')}
    >
      <Languages className="mx-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />

      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => setLanguage(language)}
          aria-pressed={current === language}
          className={cn(
            'rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
            current === language
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;