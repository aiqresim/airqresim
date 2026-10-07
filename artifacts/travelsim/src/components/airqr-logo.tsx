type AirQrMarkProps = {
  size?: number;
  className?: string;
};

export function AirQrMark({ size = 32, className = '' }: AirQrMarkProps) {
  return (
    <img
      src="/logo.png"
      alt="AirQr"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

export function Logo({
  size = 32,
  showWordmark = true,
  className = '',
  wordmarkClassName = '',
}: LogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      data-testid="brand-logo"
    >
      <AirQrMark size={size} />
      {showWordmark && (
        <span
          className={`text-foreground ${wordmarkClassName}`}
          style={{
            fontFamily: 'var(--app-font-display)',
            fontWeight: 700,
            fontSize: size * 0.6,
            letterSpacing: '-0.5px',
          }}
        >
          AirQr
        </span>
      )}
    </span>
  );
}

export default Logo;