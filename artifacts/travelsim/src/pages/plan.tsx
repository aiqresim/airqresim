import { Link, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useGetPlan } from '@workspace/api-client-react';
import { ArrowLeft, Check, Wifi } from 'lucide-react';
import { Flag } from '@/components/flag';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatData, formatPrice, errorMessage } from '@/lib/format';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

export default function PlanPage() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { id = '' } = useParams<{ id: string }>();
  const planQuery = useGetPlan(id);

  if (planQuery.isPending) {
    return (
      <div className="page-shell py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-8 h-64 w-full max-w-md animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

   if (planQuery.isError) {
     return (
       <div className="page-shell py-20 text-center">
         <h1 className="display text-3xl font-bold">{t('plan.not_found_title')}</h1>
         <p className="mt-3 text-muted-foreground">{errorMessage(planQuery.error, t('common.error'))}</p>
         <Link
           href="/countries"
           className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
         >
           {t('common.browse_destinations')}
         </Link>
       </div>
     );
   }

  const plan = planQuery.data;

  return (
    <div className="page-shell py-12">
      <Link
        href={`/country/${plan.countrySlug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('plan.back', { country: `${plan.countryName} ${plan.flagEmoji}` })}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
                       <Flag code={plan.flagEmoji} size={40} />
            <div>
              <h1 className="display text-3xl font-bold">
                {formatData(plan.dataGb)} eSIM · {plan.countryName}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Wifi className="h-4 w-4" />
                {plan.speed} on {plan.networkOperator}
              </p>
            </div>
          </div>

          <p className="mt-6 text-muted-foreground">{plan.coverage}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge variant="secondary">{formatData(plan.dataGb)} data</Badge>
            <Badge variant="secondary">{plan.validityDays} days</Badge>
            <Badge variant="secondary">{plan.speed}</Badge>
            <Badge variant={plan.hotspotAllowed ? 'default' : 'outline'}>
              {plan.hotspotAllowed ? 'Hotspot allowed' : 'No hotspot'}
            </Badge>
          </div>

          <ul className="mt-8 space-y-2.5">
            {[
              'plan.benefit_instant',
              'plan.benefit_keep_number',
              'plan.benefit_no_physical',
              'plan.benefit_install_before',
            ].map((key) => (
              <li key={key} className="flex items-center gap-2.5 text-sm">
                <Check className="h-4 w-4 shrink-0 text-success" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('plan.summary')}</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('plan.destination')}</dt>
                <dd className="font-medium">
                  {plan.countryName} {plan.flagEmoji}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('plan.data')}</dt>
                <dd className="font-medium">{formatData(plan.dataGb)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('plan.validity')}</dt>
                <dd className="font-medium">{t('common.days', { count: plan.validityDays })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('plan.speed')}</dt>
                <dd className="font-medium">{plan.speed}</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-baseline justify-between border-t pt-5">
              <span className="font-semibold">{t('plan.total')}</span>
              <span className="text-2xl font-bold tnum">
                {formatPrice(plan.sellingPriceCents, currency)}
              </span>
            </div>

            <Button asChild size="lg" className="mt-5 w-full">
              <Link href={`/checkout?planId=${plan.id}`}>
                {t('common.continue_checkout')}
              </Link>
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t('plan.mock_note')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}