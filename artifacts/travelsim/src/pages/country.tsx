import { useCurrency } from '@/lib/CurrencyContext';
import { Link, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useGetCountry, useGetCountryStats } from '@workspace/api-client-react';
import { ArrowRight, Check, Lightbulb, MapPin, TrendingUp } from 'lucide-react';
import { Flag } from '@/components/flag';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatData, formatPrice, errorMessage } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PlansCalculator } from '@/components/plans-calculator';
export default function CountryPage() {
  const { currency } = useCurrency();
  const { t } = useTranslation();
  const { slug = '' } = useParams<{ slug: string }>();
  const countryQuery = useGetCountry(slug);
  const statsQuery = useGetCountryStats(slug);

  if (countryQuery.isPending) {
    return (
      <div className="page-shell py-12">
        <div className="h-10 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-8 w-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (countryQuery.isError) {
    return (
      <div className="page-shell py-20 text-center">
        <h1 className="display text-4xl font-bold">{t('country.not_found_title')}</h1>
        <p className="mt-3 text-muted-foreground">{errorMessage(countryQuery.error, t('common.error'))}</p>
        <Link
          href="/countries"
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-6 gap-2')}
        >
          {t('common.browse_destinations')}
        </Link>
      </div>
    );
  }

  const { country, plans } = countryQuery.data;

  return (
    <div className="page-shell py-12">
      <nav className="text-sm text-muted-foreground">
        <Link href="/countries" className="hover:text-foreground">
          {t('nav.destinations')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{country.name}</span>
      </nav>

      <header className="mt-6 flex flex-wrap items-center gap-4">
        <Flag code={country.flagEmoji} size={48} />
        <div>
          <h1 className="display text-4xl font-bold">{country.name} eSIM plans</h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {country.region}
          </p>
        </div>
      </header>

      {country.tips ? (
        <Card className="mt-10 border-accent/40 bg-accent/5">
          <CardContent className="pt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Lightbulb className="h-5 w-5 shrink-0 text-accent" />
              {t('country.tips_title', { country: country.name })}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
              {country.tips}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <h2 className="display mt-10 text-2xl font-bold">
        {t('country.plans_title', { count: plans.length })}
      </h2>

      {statsQuery.data && statsQuery.data.ordersThisMonth > 0 ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="font-semibold text-foreground tnum">
            {statsQuery.data.ordersThisMonth}
          </span>{' '}
          {t('country.orders_month', { count: statsQuery.data.ordersThisMonth })}{' '}
          {t('country.orders_month_for', { country: country.name })}
        </p>
      ) : null}

      {plans.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {t('country.no_plans', { country: country.name })}
        </p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex h-full flex-col">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{formatData(plan.dataGb)}</span>
                  <Badge variant="secondary">{plan.speed}</Badge>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {t('common.days', { count: plan.validityDays })}
                </p>

                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {plan.networkOperator}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {plan.hotspotAllowed ? t('plan.hotspot') : t('plan.no_hotspot')}
                  </li>
                </ul>

                <div className="mt-auto pt-6">
                  <p className="text-2xl font-bold tnum">
                    {formatPrice(plan.sellingPriceCents, currency)}
                  </p>
                  <Button asChild className="mt-3 w-full gap-2">
                    <Link href={`/plan/${plan.id}`}>
                      {t('country.select_plan')}
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {plans.length > 0 && <PlansCalculator plans={plans} />}
    </div>
  );
}
