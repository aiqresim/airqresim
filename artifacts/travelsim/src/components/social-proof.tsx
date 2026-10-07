import { Globe2, Star, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AnimatedNumber, Reveal } from '@/components/motion';

/**
 * Social-proof figures. Values are static presentation constants: this build
 * has no analytics pipeline, so they are deliberately not sourced from the DB
 * (which only holds demo orders and would show single digits).
 */
export const SOCIAL_PROOF = {
  /** Travelers connected in the current month. */
  travelersThisMonth: 1247,
  /** Distinct countries our travelers come from. */
  countriesRepresented: 47,
} as const;

export function TravelersThisMonth() {
  const { t } = useTranslation();

  return (
    <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Globe2 className="h-4 w-4 text-accent" />
      <AnimatedNumber value={SOCIAL_PROOF.travelersThisMonth} />{' '}
      {t('social.travelers_month_suffix')}
    </p>
  );
}

export function TravelersFromCountries() {
  const { t } = useTranslation();

  return (
    <Reveal>
      <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4 text-accent" />
        {t('footer.trusted_by', { count: SOCIAL_PROOF.countriesRepresented })}
      </p>
    </Reveal>
  );
}

export function RatingBadge({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <p className={`inline-flex items-center gap-1.5 text-sm ${className ?? ''}`}>
      <Star className="h-4 w-4 fill-accent text-accent" />
      <span className="font-semibold text-foreground">4.9</span>
      <span className="text-muted-foreground">
        {t('social.rating', { count: '2,000' })}
      </span>
    </p>
  );
}

export default TravelersThisMonth;