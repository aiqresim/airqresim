import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useListCountries } from '@workspace/api-client-react';
import { ArrowRight, Globe2, QrCode, Smartphone, Zap } from 'lucide-react'
import { Flag } from '@/components/flag';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PromiseBlock } from '@/components/promise-block';
import { RatingBadge, TravelersThisMonth } from '@/components/social-proof';
import { Reveal } from '@/components/motion';
import { formatPrice } from '@/lib/format';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

const STEPS = [
  { icon: Globe2, titleKey: 'home.step_pick', bodyKey: 'home.step_pick_body' },
  { icon: Zap, titleKey: 'home.step_pay', bodyKey: 'home.step_pay_body' },
  { icon: QrCode, titleKey: 'home.step_scan', bodyKey: 'home.step_scan_body' },
] as const;

const HIGHLIGHT_KEYS = [
  'home.no_roaming',
  'home.instant_delivery',
  'home.ios_android',
  'home.support_24_7',
] as const;

export default function Home() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const countriesQuery = useListCountries();
  const popular = (countriesQuery.data ?? []).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="soft-grid border-b">
        <div className="page-shell grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-accent" />
              {t('home.badge')}
            </span>

              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-accent" />
                {t('home.badge')}
              </span>

              <h1 className="display mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
                {t('home.title', { highlight: t('home.highlight') })}
              </h1>

              <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
                {t('home.subtitle')}
              </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/countries" className={cn(buttonVariants({ size: 'lg' }))}>
                {t('common.browse_destinations')}
                <ArrowRight />
              </Link>
              <Link
                href="/account"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
              >
                {t('nav.my_orders')}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {HIGHLIGHT_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {t(key)}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <TravelersThisMonth />
              <RatingBadge />
            </div>
          </div>

          {/* Decorative phone card */}
          <div className="reveal flex justify-center lg:justify-end">
            <Card className="w-full max-w-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t('home.your_esim')}</span>
                  <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
                    {t('home.active')}
                  </span>
                </div>

                <div className="mt-5 flex h-40 items-center justify-center rounded-lg border bg-muted/40">
                  <QrCode className="h-24 w-24 text-foreground/70" />
                </div>

                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('home.plan')}</dt>
                    <dd className="font-medium">10 GB · 30 days</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('home.network')}</dt>
                    <dd className="font-medium">5G</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('home.price')}</dt>
                    <dd className="font-medium tnum">{formatPrice(2499, currency)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Popular destinations */}
      <section className="page-shell py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-3xl font-bold">{t('home.popular_title')}</h2>
            <p className="mt-2 text-muted-foreground">
              {t('home.popular_subtitle')}
            </p>
          </div>
          <Link
            href="/countries"
            className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
          >
            {t('common.view_all')}
            <ArrowRight />
          </Link>
        </div>

        {countriesQuery.isError ? (
          <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {t('home.load_error')}
          </p>
        ) : countriesQuery.isPending ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                  <div className="mt-4 h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-3 w-20 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((country) => (
              <Link key={country.id} href={`/country/${country.slug}`} className="group">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                  <Flag code={country.flagEmoji} size={40} />
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold group-hover:text-primary">
                          {country.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {country.region}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {country.planCount} plan{country.planCount === 1 ? '' : 's'} from{' '}
                      <span className="font-medium text-foreground tnum">
                       {formatPrice(country.minPriceCents, currency)}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t bg-card">
        <div className="page-shell py-16">
          <h2 className="display text-center text-3xl font-bold">{t('home.how_it_works')}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.titleKey} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">
                  {index + 1}. {t(step.titleKey)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(step.bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="page-shell py-16">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="display text-2xl font-bold">
                {t('home.cta_title')}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t('home.cta_subtitle')}
              </p>
            </div>
            <Link
              href="/countries"
              className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
            >
              <Smartphone />
              {t('common.get_esim')}
            </Link>
          </CardContent>
        </Card>
      </section>

      <Reveal>
        <PromiseBlock />
      </Reveal>
    </>
  );
}