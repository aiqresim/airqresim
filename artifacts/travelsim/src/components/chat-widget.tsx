import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Mail, MessageCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TelegramIcon } from '@/components/telegram-icon';
import { TELEGRAM_SUPPORT_HANDLE, TELEGRAM_SUPPORT_URL } from '@/lib/support';
import { cn } from '@/lib/utils';

const QUICK_QUESTIONS = [
  { q: 'chat.q_install', a: 'chat.a_install' },
  { q: 'chat.q_start', a: 'chat.a_start' },
  { q: 'chat.q_physical', a: 'chat.a_physical' },
  { q: 'chat.q_refund', a: 'chat.a_refund' },
  { q: 'chat.q_whatsapp', a: 'chat.a_whatsapp' },
] as const;

function PanelLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      {icon}
      {children}
    </Link>
  );
}
export function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xl"
            role="dialog"
            aria-label="Support chat"
          >
            <div className="flex items-center justify-between gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
              <div>
                <p className="text-sm font-semibold">{t('chat.title')}</p>
                <p className="text-xs opacity-90">{t('chat.greeting')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t('common.close')}
                className="rounded-md p-1 transition-colors hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[22rem] overflow-y-auto p-3">
              <ul className="space-y-2">
                {QUICK_QUESTIONS.map((item, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <li key={item.q}>
                      <button
                        type="button"
                        onClick={() => setActiveIndex(isActive ? null : index)}
                        aria-expanded={isActive}
                        className="flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        {t(item.q)}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                            isActive && 'rotate-180',
                          )}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isActive ? (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden text-sm leading-relaxed text-muted-foreground"
                          >
                            <span className="block px-1 py-2">{t(item.a)}</span>
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col gap-2 border-t p-3">
              <a
                href={TELEGRAM_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#229ED9] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <TelegramIcon size={16} />
                {t('chat.telegram', { handle: TELEGRAM_SUPPORT_HANDLE })}
              </a>
              <PanelLink href="/contact" icon={<Mail className="h-4 w-4" />}>
                {t('chat.send_email')}
              </PanelLink>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? t('common.close') : t('chat.open')}
        aria-expanded={isOpen}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}

export default ChatWidget;