import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';

import { Logo } from '@/components/airqr-logo';
import { TelegramIcon } from '@/components/telegram-icon';
import { TravelersFromCountries } from '@/components/social-proof';
import { TELEGRAM_SUPPORT_HANDLE, TELEGRAM_SUPPORT_URL } from '@/lib/support';

const LINK_GROUPS = [
  {
    title: 'nav.browse',
    links: [
      { href: '/countries', key: 'common.browse_destinations' },
      { href: '/countries?region=Europe', key: 'footer.europe' },
      { href: '/countries?region=Asia', key: 'footer.asia' },
    ],
  },
  {
    title: 'nav.help',
    links: [
      { href: '/faq', key: 'nav.faq' },
      { href: '/compatibility', key: 'nav.compatibility' },
      { href: '/how-to-install', key: 'nav.how_to_install' },
      { href: '/contact', key: 'nav.contact' },
      { href: '/account', key: 'nav.my_orders' },
    ],
  },
] as const;

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t bg-card">
      <div className="page-shell grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo size={30} />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            {t('footer.tagline')}
          </p>

          <a
            href={TELEGRAM_SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <TelegramIcon size={18} className="text-[#229ED9]" />
            {t('footer.support', { handle: TELEGRAM_SUPPORT_HANDLE })}
          </a>
        </div>

        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-foreground">
              {t(group.title)}
            </h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.key}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="page-shell py-5 text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <span>
              © {new Date().getFullYear()} {t('footer.copyright')}
            </span>
            <TravelersFromCountries />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;