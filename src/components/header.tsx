import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/airqr-logo';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/language-switcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';

const NAV_ITEMS = [
  { href: '/countries', key: 'nav.destinations' },
  { href: '/account', key: 'nav.my_orders' },
] as const;

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/85 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Home" className="shrink-0">
          <Logo size={40} />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex sm:gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <CurrencySwitcher />
          <Button asChild size="sm">
            <Link href="/countries">{t('common.browse_plans') || 'Plans'}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;