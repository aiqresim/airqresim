import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="page-shell flex flex-col items-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
        <Compass className="h-7 w-7 text-primary" />
      </div>

      <p className="display mt-6 text-6xl font-extrabold text-primary">404</p>

      <h1 className="display mt-2 text-2xl font-bold">{t('not_found.title')}</h1>

      <p className="mt-3 max-w-md text-muted-foreground">
        {t('not_found.body')}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={cn(buttonVariants({ size: 'lg' }))}>
          {t('common.back_home')}
        </Link>
        <Link
          href="/countries"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
        >
          {t('common.browse_destinations')}
        </Link>
      </div>
    </div>
  );
}
