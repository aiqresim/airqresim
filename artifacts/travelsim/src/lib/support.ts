/**
 * Support channel links. Telegram is configurable via VITE_TELEGRAM_SUPPORT_URL
 * and falls back to the public channel.
 */

const DEFAULT_TELEGRAM_SUPPORT_URL = 'https://t.me/airqr_support';

export const TELEGRAM_SUPPORT_URL: string =
  (import.meta.env.VITE_TELEGRAM_SUPPORT_URL as string | undefined)?.trim() ||
  DEFAULT_TELEGRAM_SUPPORT_URL;

/** Display handle derived from the URL so the text matches the link target. */
export const TELEGRAM_SUPPORT_HANDLE = (() => {
  try {
    const url = new URL(TELEGRAM_SUPPORT_URL);
    return url.pathname.replace(/^\//, '') || 'airqr_support';
  } catch {
    return 'airqr_support';
  }
})();

/** @airqr_support → https://t.me/airqr_support */
export function telegramLinkFor(handle: string): string {
  return `https://t.me/${handle.replace(/^@/, '')}`;
}