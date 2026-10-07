import { AnimatePresence, motion } from 'framer-motion';
import {
  useGetEsimStatus,
  getGetEsimStatusQueryKey,
} from '@workspace/api-client-react';
import { RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ScaleIn } from '@/components/motion';
import { errorMessage } from '@/lib/format';

/**
 * "Check eSIM status" control. Calls GET /api/esim/status (mock provider) and
 * shows the reading in a small modal.
 */
export function CheckEsimStatusButton({
  publicId,
  token,
}: {
  publicId: string;
  token: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const statusQuery = useGetEsimStatus(
    { publicId, token },
    {
      query: {
        queryKey: getGetEsimStatusQueryKey({ publicId, token }),
        enabled: false, // only fetched when the user presses the button
        retry: false,
      },
    },
  );

  const status = statusQuery.data;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => {
          setIsOpen(true);
          void statusQuery.refetch();
        }}
        disabled={statusQuery.isFetching}
      >
        <RefreshCw className={statusQuery.isFetching ? 'animate-spin' : ''} />
        {statusQuery.isFetching ? t('order.checking') : t('order.check_status')}
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40"
            />

            <ScaleIn className="relative w-full max-w-sm">
              <div
                role="dialog"
                aria-modal="true"
                aria-label={t('order.status_title')}
                className="rounded-2xl border bg-card p-6 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold">{t('order.status_title')}</h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label={t('common.close')}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {statusQuery.isFetching ? (
                  <div className="mt-5 space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </div>
                ) : statusQuery.isError ? (
                  <p className="mt-4 text-sm text-destructive">
                    {errorMessage(statusQuery.error, t('common.error'))}
                  </p>
                ) : status ? (
                  <div className="mt-4 space-y-3">
                    <p className="flex items-center gap-2 text-sm">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          status.state === 'active'
                            ? 'bg-success'
                            : 'bg-muted-foreground'
                        }`}
                      />
                      <span className="font-medium capitalize">{status.state}</span>
                    </p>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t('order.data_remaining')}</dt>
                        <dd className="font-medium tnum">
                          {status.dataRemainingGb} GB
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t('order.validity_left')}</dt>
                        <dd className="font-medium tnum">
                          {status.validityRemainingDays} days
                        </dd>
                      </div>
                    </dl>
                    <p className="text-xs text-muted-foreground">
                      {t('order.mock_reading')}
                    </p>
                  </div>
                ) : null}
              </div>
            </ScaleIn>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default CheckEsimStatusButton;