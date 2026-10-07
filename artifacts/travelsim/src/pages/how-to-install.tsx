import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Info, Smartphone } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GUIDES } from '@/lib/install-guide-data';
import { cn } from '@/lib/utils';

export default function HowToInstall() {
  const { t } = useTranslation();

  return (
    <div className="page-shell py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-4xl font-bold">{t('install.title')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t('install.subtitle')}
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl">
        <Tabs defaultValue="iphone">
          <TabsList className="grid w-full grid-cols-2 sm:w-64">
            {GUIDES.map((guide) => (
              <TabsTrigger key={guide.key} value={guide.key}>
                {guide.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {GUIDES.map((guide) => (
            <TabsContent key={guide.key} value={guide.key}>
              <Card>
                <CardContent className="pt-6">
                  <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm font-medium">
                    <Smartphone className="h-4 w-4 text-primary" />
                    {t(guide.menuKey)}
                  </p>

                  <ol className="mt-6 space-y-6">
                    {guide.steps.map((step, index) => (
                      <li key={step} className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold">
                            {t(`install.${guide.key}.${step}_t`)}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t(`install.${guide.key}.${step}_d`)}
                          </p>

                          {/* Screenshot placeholder; English copy is the
                              neutral default when no localized caption exists. */}
                          <div className="mt-3 flex h-32 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-xs text-muted-foreground">
                            {t(`install.${guide.key}.${step}_shot`, {
                              defaultValue: `Screenshot: ${t(`install.${guide.key}.${step}_t`)}`,
                            })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-6 rounded-lg border bg-muted/30 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <Info className="h-4 w-4 text-primary" />
                      {t('install.good_to_know')}
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      {guide.tips.map((tip) => (
                        <li key={tip}>• {t(`install.${guide.key}.${tip}`)}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/countries">{t('install.buy_esim')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/compatibility">{t('install.check_compatibility')}</Link>
        </Button>
      </div>
    </div>
  );
}