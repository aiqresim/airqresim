/**
 * Telegram glyph drawn inline so the app does not need an extra icon
 * dependency. Fills with `currentColor` and inherits text colour from the parent.
 */
export function TelegramIcon({
  size = 20,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Telegram"
    >
      <path d="M21.94 4.6 19.2 19.2c-.2 1.05-.83 1.3-1.7.81l-4.6-3.4-2.25 2.17c-.25.25-.46.46-.95.46l.34-4.86L18.3 6.2c.38-.34-.08-.53-.59-.19L6.9 12.44l-4.7-1.47c-1.03-.32-1.05-1.03.21-1.52L20.5 3.2c.86-.31 1.62.2 1.44 1.4Z" />
    </svg>
  );
}

export default TelegramIcon;