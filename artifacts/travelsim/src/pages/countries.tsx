import { useState } from 'react';
import { Link, useSearch } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useListCountries } from '@workspace/api-client-react';
import { Search } from 'lucide-react';
import { Flag } from '@/components/flag';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/format';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

/** Region filter values; the first entry means "no region filter". */
const REGION_VALUES = [
  '',
  'Europe',
  'Asia',
  'Americas',
  'Europe & Middle East',
] as const;

function SkeletonGrid() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Countries() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const regionParam = searchParams.get('region') ?? '';

  const [term, setTerm] = useState(searchParams.get('search') ?? '');

  const countriesQuery = useListCountries({
    ...(regionParam ? { region: regionParam } : {}),
    ...(term.trim() ? { search: term.trim() } : {}),
  });

  const countries = countriesQuery.data ?? [];

  return (
    <div className="page-shell py-12">
      <header>
         <h1 className="display text-4xl font-bold">{t('countries.title')}</h1>
             <p className="mt-2 text-muted-foreground">
               {t('countries.subtitle')}
             </p>
      </header>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t('countries.search_placeholder')}
            aria-label={t('countries.search_label')}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {REGION_VALUES.map((region) => {
            const isActive = regionParam === region;
            return (
              <button
                key={region || 'all'}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (region === '') {
                    next.delete('region');
                  } else {
                    next.set('region', region);
                  }
                  // Keep the typed search term when switching region.
                  window.history.replaceState(
                    null,
                    '',
                    next.toString() ? `/countries?${next.toString()}` : '/countries',
                  );
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'border-transparent bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {region === '' ? t('countries.all_regions') : region}
              </button>
            );
          })}
        </div>
      </div>

      {countriesQuery.isError ? (
        <p className="mt-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {t('home.load_error')}
        </p>
      ) : countriesQuery.isPending ? (
        <SkeletonGrid />
      ) : countries.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          {t('countries.no_results')}
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {t('countries.result_count', { count: countries.length })}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => (
              <Link key={country.id} href={`/country/${country.slug}`} className="group">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                       <Flag code={country.flagEmoji} size={40} />
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold group-hover:text-primary">
                          {country.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">{country.region}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {t('common.plans_count', { count: country.planCount })}{' '}
                      {t('common.from_price')}{' '}
                      <span className="font-medium text-foreground tnum">
                        {formatPrice(country.minPriceCents, currency)}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}