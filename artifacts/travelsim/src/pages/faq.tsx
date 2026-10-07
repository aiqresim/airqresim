import { useState } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, MessageCircle } from 'lucide-react';

import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FAQ_CATEGORIES } from '@/lib/faq-data';
import { cn } from '@/lib/utils';

export default function Faq() {
  const { t } = useTranslation();
  // A single category stays open at a time; null collapses everything.
  const [open, setOpen] = useState<string | null>(FAQ_CATEGORIES[0].key);

  return (
    <div className="page-shell py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-4xl font-bold">{t('faq.title')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t('faq.subtitle')}
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        {FAQ_CATEGORIES.map((category, index) => {
          const isOpen = open === category.key;

          return (
            <Reveal key={category.key} delay={index * 0.05}>
              <Card>
                <CardContent className="pt-6">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : category.key)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold">{t(category.titleKey)}</span>
                    </span>
                    <span
                      className={cn(
                        'text-sm text-muted-foreground transition-transform duration-200',
                        isOpen && 'rotate-180',
                      )}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <dl className="mt-4 space-y-4 border-t pt-4">
                          {category.items.map((item) => (
                            <div key={item.qKey}>
                              <dt className="font-medium">{t(item.qKey)}</dt>
                              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                {t(item.aKey)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-xl border bg-card p-6 text-center">
        <h2 className="font-semibold">{t('faq.not_found')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('faq.not_found_body')}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/contact" className="gap-2">
              <MessageCircle />
              {t('faq.write_us')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/how-to-install">{t('install.title')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}