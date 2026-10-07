import { Clock, Globe2, Lock, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RevealGroup, RevealItem } from '@/components/motion';

const PROMISES = [
  { icon: RotateCcw, titleKey: 'promise.money_back_title', bodyKey: 'promise.money_back_body' },
  { icon: Lock, titleKey: 'promise.ssl_title', bodyKey: 'promise.ssl_body' },
  { icon: Globe2, titleKey: 'promise.coverage_title', bodyKey: 'promise.coverage_body' },
  { icon: Clock, titleKey: 'promise.support_title', bodyKey: 'promise.support_body' },
] as const;

/** Trust block reused on the home page and on checkout. */
export function PromiseBlock({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <section className={compact ? '' : 'border-t bg-card'} aria-label={t('promise.title')}>
      <div className={compact ? '' : 'page-shell py-14'}>
        {!compact ? (
          <h2 className="display text-center text-2xl font-bold">{t('promise.title')}</h2>
        ) : null}

        <RevealGroup
          className={
            compact
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
              : 'mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'
          }
        >
          {PROMISES.map((promise) => (
            <RevealItem key={promise.titleKey}>
              <div className="flex h-full flex-col items-start gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <promise.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">{t(promise.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(promise.bodyKey)}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default PromiseBlock;