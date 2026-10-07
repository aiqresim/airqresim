import { motion, useReducedMotion } from 'framer-motion';
import { Check, CreditCard, ShoppingCart, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ScaleIn } from '@/components/motion';
import { cn } from '@/lib/utils';

export interface TimelineOrder {
  status: string;
  paymentStatus: string;
  esimStatus: string;
  createdAt: string;
}

interface Step {
  key: string;
  labelKey: string;
  icon: typeof ShoppingCart;
  done: (order: TimelineOrder) => boolean;
}

/** Ordered lifecycle steps. `done` is derived from the order's status fields. */
const STEPS: Step[] = [
  {
    key: 'placed',
    labelKey: 'order.step_placed',
    icon: ShoppingCart,
    done: () => true, // an order row exists, so this is always reached
  },
  {
    key: 'paid',
    labelKey: 'order.step_paid',
    icon: CreditCard,
    done: (order) => order.paymentStatus === 'succeeded',
  },
  {
    key: 'ready',
    labelKey: 'order.step_ready',
    icon: Smartphone,
    done: (order) => order.esimStatus === 'ready',
  },
  {
    key: 'activated',
    labelKey: 'order.step_activated',
    icon: Check,
    done: (order) => order.esimStatus === 'activated',
  },
];

/** Translation key for the "ready X ago" line, or null when not ready yet. */
function readyMessageKey(
  order: TimelineOrder,
): { key: string; count?: number } | null {
  if (!STEPS[2].done(order)) return null;

  const readyAt = new Date(order.createdAt).getTime();
  if (Number.isNaN(readyAt)) return null;

  // The mock backend does not store a dedicated eSIM-ready timestamp, so the
  // order creation time is used as the earliest possible reference point.
  const elapsedMinutes = Math.floor((Date.now() - readyAt) / 60_000);

  if (elapsedMinutes < 1) return { key: 'order.ready_just_now' };
  if (elapsedMinutes < 60) {
    return { key: 'order.ready_minutes', count: elapsedMinutes };
  }
  return { key: 'order.ready_hours', count: Math.floor(elapsedMinutes / 60) };
}

export function OrderTimeline({ order }: { order: TimelineOrder }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const message = readyMessageKey(order);

  return (
    <section aria-label={t('order.timeline_label')} className="rounded-xl border bg-card p-6">
      <div className="relative">
        {/* Connector track sits behind the step icons. */}
        <div className="absolute left-0 right-0 top-[18px] flex">
          {STEPS.slice(0, -1).map((step, index) => {
            const reached = STEPS[index].done(order) && step.done(order);
            return (
              <div key={step.key} className="flex-1">
                <motion.div
                  className={cn(
                    'h-0.5 w-full',
                    reached ? 'bg-accent' : 'bg-border',
                  )}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.15 }}
                  style={{ originX: 0 }}
                />
              </div>
            );
          })}
        </div>

        <ol className="relative grid grid-cols-4 gap-2">
          {STEPS.map((step, index) => {
            const isDone = step.done(order);
            const Icon = step.icon;

            return (
              <li key={step.key} className="flex flex-col items-center gap-2 text-center">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 bg-card',
                    isDone ? 'border-accent' : 'border-border',
                  )}
                >
                  {isDone ? (
                    <ScaleIn delay={0.2 + index * 0.15}>
                      <Check className="h-4 w-4 text-accent" />
                    </ScaleIn>
                  ) : (
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        index === 0 ? 'text-muted-foreground' : 'text-muted-foreground/60',
                      )}
                    />
                  )}
                </div>

                <span
                  className={cn(
                    'text-xs font-medium sm:text-sm',
                    isDone ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {message ? (
        <p className="mt-5 border-t pt-4 text-center text-sm text-muted-foreground">
          {t(message.key, { count: message.count ?? 0 })}
        </p>
      ) : null}
    </section>
  );
}

export default OrderTimeline;