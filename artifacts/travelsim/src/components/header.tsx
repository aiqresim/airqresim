import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { User, LogOut, Package } from 'lucide-react';
import { Logo } from '@/components/airqr-logo';
import { Button, buttonVariants } from '@/components/ui/button';
import LanguageSwitcher from '@/components/language-switcher';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/countries', key: 'nav.destinations' },
  { href: '/account', key: 'nav.my_orders' },
] as const;

export function Header() {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/85 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between">
        <Link href="/" aria-label={t('common.back_home')} className="shrink-0">
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

          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/account"
                    className="hidden items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted sm:flex"
                  >
                    <Package className="h-4 w-4" />
                    {t('auth.my_orders')}
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                    title={user.email}
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden max-w-[120px] truncate sm:inline">
                      {user.name || user.email}
                    </span>
                    <LogOut className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  >
                    {t('auth.sign_in')}
                  </Link>
                  <Link
                    href="/register"
                    className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
                  >
                    {t('auth.sign_up')}
                  </Link>
                </div>
              )}
            </>
          )}

          <Button asChild size="sm" className="hidden lg:inline-flex">
            <Link href="/countries">{t('common.browse_plans') || 'Plans'}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
