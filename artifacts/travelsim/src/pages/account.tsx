import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import {
  useListAccountOrders,
  getListAccountOrdersQueryKey,
  useRequestAccountLink,
} from '@workspace/api-client-react';
import { CheckCircle2, Package, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatData, formatDate, formatPrice, errorMessage } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Maps server status strings onto the three customer-facing states. */
function orderState(order: { status: string; esimStatus: string; createdAt: string }) {
  if (order.esimStatus === 'ready' || order.esimStatus === 'activated') {
    return {
      key: 'ready',
      label: 'Ready',
      className: 'border-transparent bg-primary/10 text-primary',
    };
  }

  // "Expired" once the plan's validity window has passed.
  const createdAt = new Date(order.createdAt).getTime();
  const olderThan30Days = !Number.isNaN(createdAt) && Date.now() - createdAt > 30 * 86_400_000;
  if (olderThan30Days) {
    return {
      key: 'expired',
      label: 'Expired',
      className: 'border-transparent bg-muted text-muted-foreground',
    };
  }

  return {
    key: 'active',
    label: 'Active',
    className: 'border-transparent bg-success/10 text-success',
  };
}

/** Compact 3-dot progress indicator mirroring the full order timeline. */
function MiniTimeline({ order }: { order: { status: string; paymentStatus: string; esimStatus: string } }) {
  const steps = [
    order.paymentStatus === 'succeeded',
    order.esimStatus === 'ready' || order.esimStatus === 'activated',
    order.esimStatus === 'activated',
  ];

  return (
    <span className="flex items-center gap-1" aria-hidden>
      {steps.map((done, index) => (
        <span key={index} className="flex items-center gap-1">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              done ? 'bg-accent' : 'bg-border',
            )}
          />
          {index < steps.length - 1 ? (
            <span className={cn('h-0.5 w-4', done ? 'bg-accent' : 'bg-border')} />
          ) : null}
        </span>
      ))}
    </span>
  );
}

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();
  
  // Для совместимости со старым кодом - если пользователь есть, считаем его авторизованным
  const isSignedIn = !!user;
  
  // Старый механизм для аутентификации по email
  const [email, setEmail] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const requestLink = useRequestAccountLink();
  const ordersQuery = useListAccountOrders({
    query: {
      queryKey: getListAccountOrdersQueryKey(),
      enabled: isSignedIn,
      retry: false,
    },
  });

  // Старая функция для аутентификации по email
  async function handleOldSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLinkError(null);
    try {
      await requestLink.mutateAsync({ data: { email } });
      // Обновляем состояние авторизации
      window.location.reload();
    } catch (error) {
      setLinkError(errorMessage(error, t('account.sign_in_failed')));
    }
  }

  const orders = ordersQuery.data ?? [];

  // Если загружается или нужно показать старую форму аутентификации
  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold">{t('nav.my_orders')}</h1>
      <p className="text-muted-foreground mt-2">
        {isSignedIn ? t('account.your_orders') : t('account.see_your_orders')}
      </p>

      {!isSignedIn ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">{t('account.sign_in_title')}</h2>
          <p className="text-muted-foreground mt-1">{t('account.sign_in_description')}</p>

          <form onSubmit={handleOldSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder={t('account.email_placeholder')}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:max-w-xs"
            />
            <Button type="submit" disabled={requestLink.isPending}>
              {requestLink.isPending ? t('common.loading') : t('account.request_link')}
            </Button>
          </form>

          {linkError ? (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {linkError}
            </p>
          ) : null}

          {/* Добавляем кнопки входа через новую систему */}
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">{t('account.or_use_account')}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/login">{t('auth.login')}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/register">{t('auth.create_account')}</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-8">
          {/* Информация о пользователе */}
          <div className="mb-6 rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold">{t('account.your_profile')}</h2>
            <div className="mt-3 space-y-2">
              <p><span className="font-medium">{t('auth.name')}:</span> {user?.name || t('account.not_specified')}</p>
              <p><span className="font-medium">{t('auth.email')}:</span> {user?.email}</p>
              <p><span className="font-medium">{t('auth.country')}:</span> {user?.country || t('account.not_specified')}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => logout()}>
                {t('auth.logout')}
              </Button>
            </div>
          </div>

          {/* Список заказов */}
          <h2 className="text-xl font-semibold">{t('account.your_orders')}</h2>
          <h2 className="display text-2xl font-bold">
            {t('account.your_esims', { count: orders.length })}
          </h2>

          {ordersQuery.isPending ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : ordersQuery.isError ? (
            <p className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage(ordersQuery.error, t('account.load_failed'))}
            </p>
            ) : orders.length === 0 ? (
              <div className="mt-5 rounded-lg border border-dashed p-10 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">{t('account.empty_title')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('account.empty_body')}</p>
                <Link href="/countries" className={cn(buttonVariants(), 'mt-5')}>
                  {t('common.browse_destinations')}
                </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {orders.map((order) => {
                const state = orderState(order);
                return (
                  <Card key={order.publicId}>
                    <CardContent className="pt-6">
                       <div className="flex flex-wrap items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                           <span className="text-3xl">{order.flagEmoji}</span>
                           <div>
                             <p className="font-medium">
                               {order.countryName} ·{' '}
                               {formatData(order.dataGb)} ·{' '}
                               {t('common.days', { count: order.validityDays })}
                             </p>
                             <p className="text-xs text-muted-foreground">
                               Placed {formatDate(order.createdAt)}
                             </p>
                             <div className="mt-2 flex items-center gap-3">
                               <MiniTimeline order={order} />
                               <span
                                 className={cn(
                                   'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
                                   state.className,
                                 )}
                                 >
                                 {state.key === 'ready' ? (
                                   <CheckCircle2 className="h-3 w-3" />
                                 ) : null}
                                 {state.label}
                               </span>
                             </div>
                           </div>
                         </div>

                         <div className="flex items-center gap-3">
                           <p className="font-bold tnum">
                             {formatPrice(order.totalCents, order.currency)}
                           </p>
                           <Button asChild size="sm" className="gap-2">
                             <Link
                               href={`/order/${order.publicId}?token=${encodeURIComponent(order.accessToken)}`}
                             >
                               <Smartphone />
                               {t('account.open_esim')}
                             </Link>
                           </Button>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
        )}
    </div>
  );
}