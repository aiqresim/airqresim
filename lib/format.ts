export function formatPrice(cents: number, currency: 'EUR' | 'RUB'): string {
    const options = { style: 'currency', currency: currency };
    return new Intl.NumberFormat('en-US', options).format(cents / 100);
}