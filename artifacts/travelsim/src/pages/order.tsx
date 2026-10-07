import { Link, useParams, useSearch } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useGetOrder, getGetOrderQueryKey } from '@workspace/api-client-react';
import { ArrowLeft, CheckCircle2, Copy, QrCode, Smartphone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TelegramIcon } from '@/components/telegram-icon';
import { TELEGRAM_SUPPORT_HANDLE, TELEGRAM_SUPPORT_URL } from '@/lib/support';
import { OrderTimeline } from '@/components/order-timeline';
import { CheckEsimStatusButton } from '@/components/check-esim-status';
import { TravelersThisMonth } from '@/components/social-proof';
import { formatData, formatDate, formatPrice, errorMessage } from '@/lib/format';
import { cn } from '@/lib/utils';

function CopyRow({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mono mt-1 break-all text-sm">{value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void navigator.clipboard?.writeText(value)}
      >
        <Copy />
        {t('order.copy')}
      </Button>
    </div>
  );
}

export default function OrderPage() {
  const { t } = useTranslation();
  const { publicId = '' } = useParams<{ publicId: string }>();
  const search = useSearch();

  // The token comes from the URL first (shareable link), otherwise from the
  // sessionStorage copy written during checkout.
  const token =
    new URLSearchParams(search).get('token') ??
    window.sessionStorage.getItem(`order:${publicId}`) ??
    '';

  const orderQuery = useGetOrder(
    publicId,
    { token },
    {
      query: {
        queryKey: getGetOrderQueryKey(publicId, { token }),
        enabled: publicId !== '' && token !== '',
      },
    },
  );

   if (!token) {
     return (
       <div className="page-shell py-20 text-center">
         <h1 className="display text-3xl font-bold">{t('order.token_required_title')}</h1>
         <p className="mt-3 text-muted-foreground">{t('order.token_required_body')}</p>
         <Link href="/account" className={cn(buttonVariants(), 'mt-6')}>
           {t('order.go_account')}
         </Link>
       </div>
     );
   }

  if (orderQuery.isPending) {
    return (
      <div className="page-shell py-12">
        <div className="h-64 w-full max-w-md animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="page-shell py-20 text-center">
        <h1 className="display text-3xl font-bold">{t('order.not_available_title')}</h1>
        <p className="mt-3 text-muted-foreground">
          {errorMessage(orderQuery.error, t('common.error'))}
        </p>
        <Link
          href="/account"
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
        >
          {t('order.go_account')}
        </Link>
      </div>
    );
  }

  const order = orderQuery.data;
  const isReady = order.esimStatus === 'ready' && Boolean(order.qrPayload);
  return (
    <div className="page-shell py-12">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('order.back_account')}
      </Link>

      <header className="mt-6 flex flex-wrap items-center gap-4">
        <span className="text-5xl">{order.flagEmoji}</span>
        <div>
          <h1 className="display text-4xl font-bold">{t('order.title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {order.countryName} · {formatData(order.dataGb)} ·{' '}
            {t('common.days', { count: order.validityDays })}
          </p>
        </div>
      </header>

      <OrderTimeline order={order} />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('order.qr_title')}
            </h2>

            <div className="mt-4 flex flex-col items-center">
              {isReady ? (
                <>
                  <div className="rounded-xl border bg-white p-4">
                    {/* The payload is an LPA activation string, rendered via a
                        stateless public QR endpoint. */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.qrPayload ?? '')}`}
                      alt="eSIM activation QR code"
                      width={220}
                      height={220}
                      className="block"
                    />
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('order.qr_ready')}
                  </p>
                </>
              ) : (
                <div className="flex h-52 w-full flex-col items-center justify-center rounded-xl border bg-muted/30 text-center">
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t('order.qr_generating')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: {order.esimStatus}
                  </p>
                </div>
              )}
            </div>

            {order.activationCode ? (
              <div className="mt-6 space-y-3">
                <CopyRow
                  label={t('order.activation_code')}
                  value={order.activationCode}
                />
                {order.smdpAddress ? (
                  <CopyRow label={t('order.smdp')} value={order.smdpAddress} />
                ) : null}
                {order.matchingId ? (
                  <CopyRow label={t('order.matching_id')} value={order.matchingId} />
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('order.details')}
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('order.order_id')}</dt>
                <dd className="mono break-all text-right">{order.publicId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('order.email')}</dt>
                <dd className="break-all text-right">{order.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('order.network')}</dt>
                <dd className="font-medium">
                  {order.speed} · {order.networkOperator}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('order.hotspot')}</dt>
                <dd className="font-medium">
                  {order.hotspotAllowed ? t('order.allowed') : t('order.not_allowed')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('order.placed')}</dt>
                <dd className="font-medium">{formatDate(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t('order.total')}</dt>
                <dd className="font-bold tnum">
                  {formatPrice(order.totalCents, order.currency)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {t('order.payment_status', { status: order.paymentStatus })}
              </Badge>
              <Badge variant="secondary">
                {t('order.esim_status', { status: order.esimStatus })}
              </Badge>
            </div>

            <p className="mt-6 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              {t('order.private_note')}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <CheckEsimStatusButton publicId={order.publicId} token={token} />

              <Button asChild variant="outline" className="gap-2">
                <Link href="/how-to-install">
                  <Smartphone />
                  {t('order.install_guide')}
                </Link>
              </Button>

              <a
                href={TELEGRAM_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'gap-2',
                )}
              >
                <TelegramIcon size={18} />
                {t('order.telegram_cta')}
              </a>
              <p className="text-center text-xs text-muted-foreground">
                {t('order.telegram_hint', { handle: TELEGRAM_SUPPORT_HANDLE })}
              </p>

              <div className="mt-2 border-t pt-4">
                <p className="text-center text-sm">
                  {t('social.joined', { count: '1,247' })}
                </p>
                <div className="mt-2 flex justify-center">
                  <TravelersThisMonth />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}