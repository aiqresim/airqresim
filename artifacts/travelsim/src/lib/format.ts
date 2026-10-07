export function convertPrice(cents: number, from: string, to: string): number {
  if (from === to) return cents;
  if (from === 'EUR' && to === 'RUB') return cents; // цена в БД уже в "копейках рубля", используем как есть
  return cents;
}
/**
 * Small display helpers shared by the storefront pages. The API always
 * transports money as integer cents plus an ISO currency code.
 */

export function formatPrice(cents: number, currency = 'EUR'): string {
  // RUB: цена в БД хранится как "условные рубли" (999 = 999 ₽)
  // EUR: цена в БД хранится в евро-центах (999 = €9.99)
  if (currency === 'RUB') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(cents);
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export function formatData(dataGb: number): string {
  return Number.isInteger(dataGb) ? `${dataGb} GB` : `${dataGb} GB`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
}

/**
 * Pulls a human-readable message out of the generated client's ApiError, which
 * carries the parsed JSON error body under `data` (e.g. `{ error: "..." }`).
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'error' in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === 'string' && message.trim() !== '') {
        return message;
      }
    }
  }
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }
  return fallback;
}