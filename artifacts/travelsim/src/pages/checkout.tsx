import { useState, type FormEvent } from 'react';
import { Link, useSearch } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  useGetPlan,
  getGetPlanQueryKey,
  useCreateOrder,
  useConfirmMockPayment,
} from '@workspace/api-client-react';
import { Lock, Mail, User } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TelegramIcon } from '@/components/telegram-icon';
import { TELEGRAM_SUPPORT_HANDLE, TELEGRAM_SUPPORT_URL } from '@/lib/support';
import { PromiseBlock } from '@/components/promise-block';
import { formatData, formatPrice, errorMessage } from '@/lib/format';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

function PlanUnavailable({ message }: { message: string }) {
  const { t } = useTranslation();

  return (
    <div className="page-shell py-20 text-center">
         <h1 className="display text-3xl font-bold">{t('checkout.unavailable_title')}</h1>
         <p className="mt-3 text-muted-foreground">{t('checkout.unavailable_body')}</p>
      <Link
        href="/countries"
        className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
      >
        {t('common.browse_destinations')}
      </Link>
    </div>
  );
}

export default function Checkout() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const search = useSearch();
  const planId = new URLSearchParams(search).get('planId') ?? '';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const planQuery = useGetPlan(planId, {
    query: { queryKey: getGetPlanQueryKey(planId), enabled: planId !== '' },
  });
  const createOrder = useCreateOrder();
  const confirmPayment = useConfirmMockPayment();

  if (!planId) {
    return (
      <PlanUnavailable message={t('checkout.no_plan_body')} />
    );
  }

  if (planQuery.isPending) {
    return (
      <div className="page-shell py-12">
        <div className="mx-auto h-64 w-full max-w-md animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (planQuery.isError) {
    return (
      <PlanUnavailable
        message={errorMessage(planQuery.error, t('common.error'))}
      />
    );
  }

  const plan = planQuery.data;
  const isSubmitting = createOrder.isPending || confirmPayment.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    try {
      // The generated mutation hooks wrap the request body in a `data` field,
      // i.e. mutateAsync({ data: OrderInput }).
      // 1. Create the order (server records the plan snapshot and mock payment).
      const order = await createOrder.mutateAsync({
        data: {
          planId,
          email,
          ...(name.trim() ? { name: name.trim() } : {}),
        },
      });

      // 2. Confirm the mock payment; this provisions the eSIM server-side.
      await confirmPayment.mutateAsync({
        data: {
          orderId: order.orderId,
          accessToken: order.accessToken,
        },
      });

      // 3. Persist the token so /order/:publicId survives a reload.
      window.sessionStorage.setItem(`order:${order.publicId}`, order.accessToken);

      // A full navigation (not client-side routing) ensures the freshly
      // written sessionStorage entry is read by the order page on mount.
      window.location.assign(
        `/order/${order.publicId}?token=${encodeURIComponent(order.accessToken)}`,
      );
    } catch (error) {
      setSubmitError(errorMessage(error, t('checkout.failed')));
    }
  }
  return (
    <div className="page-shell py-12">
      <h1 className="display text-4xl font-bold">{t('checkout.title')}</h1>
      <p className="mt-2 text-muted-foreground">
        {t('checkout.subtitle')}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('checkout.email_label')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t('checkout.email_placeholder')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('checkout.email_hint')}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t('checkout.name_label')}{' '}
                  <span className="text-muted-foreground">
                    {t('checkout.name_optional')}
                  </span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder={t('checkout.name_placeholder')}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {submitError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {submitError}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={isSubmitting}
              >
                <Lock />
                {isSubmitting ? t('checkout.processing') : t('checkout.pay_button')}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t('plan.mock_note')}
              </p>

              <a
                href={TELEGRAM_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <TelegramIcon size={14} className="text-[#229ED9]" />
                {t('checkout.telegram_questions', { handle: TELEGRAM_SUPPORT_HANDLE })}
              </a>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('checkout.summary')}
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl">{plan.flagEmoji}</span>
              <div>
                <p className="font-medium">
                  {formatData(plan.dataGb)} · {t('common.days', { count: plan.validityDays })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {plan.countryName} · {plan.speed}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline justify-between border-t pt-5">
              <span className="font-semibold">{t('plan.total')}</span>
              <span className="text-2xl font-bold tnum">
               {formatPrice(plan.sellingPriceCents, currency)}
              </span>
            </div>

            <Link
              href={`/plan/${plan.id}`}
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              {t('common.change_plan')}
            </Link>
          </CardContent>
        </Card>
      </div>

      <PromiseBlock compact />
    </div>
  );
}