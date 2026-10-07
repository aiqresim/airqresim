import { useState } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ChevronDown, HelpCircle, Search, XCircle } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PLATFORMS,
  UNSUPPORTED,
  matchesSearch,
  type PlatformData,
} from '@/lib/compatibility-data';
import { cn } from '@/lib/utils';

function PlatformList({ platform, term }: { platform: PlatformData; term: string }) {
  const { t } = useTranslation();
  const needle = term.trim().toLowerCase();
  const groups = platform.groups.filter(
    (group) =>
      matchesSearch({ ...platform, groups: [group] }, term),
  );

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No {platform.label} models match “{term}”.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('compatibility.intro')}</p>

      {groups.map((group) => {
        const models = needle
          ? group.models.filter((model) => model.toLowerCase().includes(needle))
          : group.models;
        if (models.length === 0) return null;

        return (
          <Card key={group.family}>
            <CardContent className="pt-6">
              <h3 className="font-semibold">{group.family}</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {models.map((model) => (
                  <li key={model} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    {model}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
export default function Compatibility() {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const [isCheckOpen, setIsCheckOpen] = useState(false);

  return (
    <div className="page-shell py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-4xl font-bold">
          {t('compatibility.title')}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t('compatibility.subtitle')}
        </p>
      </header>

      <div className="mx-auto mt-8 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t('compatibility.search_placeholder')}
            aria-label={t('compatibility.search_label')}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-4xl">
        <Tabs defaultValue="iphone">
          <TabsList className="grid w-full grid-cols-2 sm:w-64">
            {PLATFORMS.map((platform) => (
              <TabsTrigger key={platform.key} value={platform.key}>
                {platform.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PLATFORMS.map((platform) => (
            <TabsContent key={platform.key} value={platform.key}>
              <PlatformList platform={platform} term={term} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="mx-auto mt-12 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <button
              type="button"
              onClick={() => setIsCheckOpen((open) => !open)}
              aria-expanded={isCheckOpen}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t('compatibility.how_to_check')}</span>
              </span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                  isCheckOpen && 'rotate-180',
                )}
              />
            </button>

            {isCheckOpen ? (
              <div className="mt-5 space-y-5 border-t pt-5">
                {PLATFORMS.map((platform) => (
                  <div key={platform.key}>
                    <h4 className="text-sm font-semibold">{platform.label}</h4>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {platform.checkSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {platform.checkHint}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto mt-6 max-w-4xl">
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <h2 className="flex items-center gap-2 font-semibold text-destructive">
              <XCircle className="h-5 w-5" />
              {t('compatibility.unsupported')}
            </h2>
            <ul className="mt-3 space-y-2">
              {UNSUPPORTED.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/how-to-install">{t('compatibility.install_guide')}</Link>
              </Button>
              <Button asChild>
                <Link href="/countries">{t('compatibility.browse_plans')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}