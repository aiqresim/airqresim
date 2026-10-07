type FlagProps = {
  code?: string;
  size?: number;
  className?: string;
};

const COLORS: Record<string, [string, string]> = {
  TR: ['#E30A17', '#A60810'],
  AE: ['#00732F', '#000000'],
  IT: ['#009246', '#CE2B37'],
  CN: ['#DE2910', '#A61E0C'],
  US: ['#3C3B6E', '#B22234'],
  TH: ['#A51931', '#2D2A4A'],
  FR: ['#002395', '#ED2939'],
  DE: ['#DD0000', '#000000'],
  ES: ['#AA151B', '#F1BF00'],
  JP: ['#BC002D', '#FFFFFF'],
  GB: ['#012169', '#C8102E'],
  RU: ['#0039A6', '#D52B1E'],
  KZ: ['#00AFCA', '#FEC50C'],
};

export function Flag({ code, size = 40, className }: FlagProps) {
  const c = String(code ?? '').toUpperCase().trim().slice(0, 2);
  const colors = COLORS[c] ?? ['#2563EB', '#1E40AF'];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
        color: '#FFFFFF',
        fontSize: size * 0.32,
        fontWeight: 800,
        letterSpacing: '0.5px',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        flexShrink: 0,
      }}
    >
      {c || '??'}
    </span>
  );
}

export default Flag;