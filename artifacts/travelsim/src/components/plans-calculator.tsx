import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Youtube, Music, MapPin, MessageCircle, Video, Smartphone, Clock, Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/lib/CurrencyContext';
import { formatData, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

type Plan = {
  id: string;
  dataGb: number;
  validityDays: number;
  sellingPriceCents: number;
  speed: string;
  [key: string]: any;
};

type UsageKey = 'light' | 'medium' | 'heavy';

type AppUsage = {
  tiktok: number;
  youtube: number;
  instagram: number;
  maps: number;
  music: number;
  messengers: number;
};

const PROFILE_DAILY_GB: Record<UsageKey, number> = {
  light: 0.3,
  medium: 0.7,
  heavy: 1.5,
};

// GB per hour per app
const APP_GB_PER_HOUR: Record<keyof AppUsage, number> = {
  tiktok: 0.2,
  youtube: 0.5,
  instagram: 0.1,
  maps: 0.05,
  music: 0.05,
  messengers: 0.02,
};

export function PlansCalculator({ plans }: { plans: Plan[] }) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [days, setDays] = useState(7);
  const [devices, setDevices] = useState(1);
  const [profile, setProfile] = useState<UsageKey>('medium');

  const [appUsage, setAppUsage] = useState<AppUsage>({
    tiktok: 0,
    youtube: 0,
    instagram: 0,
    maps: 1,
    music: 0,
    messengers: 1,
  });

  let estimatedGb = 0;

  if (mode === 'quick') {
    estimatedGb = PROFILE_DAILY_GB[profile] * days * devices;
  } else {
    const daily =
      appUsage.tiktok * APP_GB_PER_HOUR.tiktok +
      appUsage.youtube * APP_GB_PER_HOUR.youtube +
      appUsage.instagram * APP_GB_PER_HOUR.instagram +
      appUsage.maps * APP_GB_PER_HOUR.maps +
      appUsage.music * APP_GB_PER_HOUR.music +
      appUsage.messengers * APP_GB_PER_HOUR.messengers;
    estimatedGb = daily * devices;
  }

  // +20% запас
  const neededGb = Math.ceil(estimatedGb * 1.2 * 10) / 10;

  const sorted = [...plans].sort((a, b) => a.dataGb - b.dataGb);
  const recommended =
    sorted.find((p) => p.dataGb >= neededGb && p.validityDays >= days) ??
    sorted.find((p) => p.dataGb >= neededGb) ??
    sorted[sorted.length - 1];

  const apps = [
    { key: 'tiktok' as const, icon: Video, label: t('calc.app_tiktok') },
    { key: 'youtube' as const, icon: Youtube, label: t('calc.app_youtube') },
    { key: 'instagram' as const, icon: Smartphone, label: t('calc.app_instagram') },
    { key: 'maps' as const, icon: MapPin, label: t('calc.app_maps') },
    { key: 'music' as const, icon: Music, label: t('calc.app_music') },
    { key: 'messengers' as const, icon: MessageCircle, label: t('calc.app_messengers') },
  ];

  return (
    <Card className="mt-10 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="h-5 w-5 text-primary" />
         <h3 className="text-xl font-bold">{t('calc.title')}</h3>
        </div>

        {/* Mode switch */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              mode === 'quick'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {t('calc.mode_quick')}
          </button>
          <button
            type="button"
            onClick={() => setMode('detailed')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              mode === 'detailed'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {t('calc.mode_detailed')}
          </button>
        </div>

        {/* Days */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('calc.days_label')}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDays(Math.max(1, days - 1))}
              className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex-1 relative">
              <input
                type="range"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => setDays(Math.min(30, days + 1))}
              className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="w-16 text-right font-semibold">
              {days} {t('calc.days_short')}
            </span>
          </div>
        </div>

        {/* Profile (quick) */}
        {mode === 'quick' && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">{t('calc.usage_label')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['light', 'medium', 'heavy'] as UsageKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProfile(key)}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    profile === key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="font-medium text-sm">{t(`calc.profile_${key}`)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t(`calc.profile_${key}_desc`)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detailed */}
        {mode === 'detailed' && (
          <div className="mb-6 space-y-3">
            <label className="text-sm font-medium block">{t('calc.hours_label')}</label>
            {apps.map((app) => {
              const Icon = app.icon;
              const value = appUsage[app.key];
              return (
                <div key={app.key} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm flex-1 min-w-0 truncate">{app.label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAppUsage({ ...appUsage, [app.key]: Math.max(0, value - 1) })
                    }
                    className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-16 text-center text-sm font-medium">
                    {value} {t('calc.hours_short')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppUsage({ ...appUsage, [app.key]: value + 1 })}
                    className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Devices */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">{t('calc.devices_label')}</label>
          <div className="flex gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDevices(n)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                  devices === n
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {n === 3 ? '3+' : n}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-xl border-2 border-primary bg-card p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {t('calc.recommended')}
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-2xl font-bold">
                {formatData(recommended.dataGb)} · {recommended.validityDays} {t('calc.days_short')}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t('calc.you_need', { gb: neededGb.toFixed(1) })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(recommended.sellingPriceCents, currency)}
              </div>
              {recommended.dataGb >= neededGb * 1.5 && (
                <Badge variant="secondary" className="mt-1">
                  {t('calc.plenty')}
                </Badge>
              )}
            </div>
          </div>
          <Button asChild size="lg" className="w-full mt-4">
            <a href={`/plan/${recommended.id}`}>{t('calc.buy_recommended')}</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}