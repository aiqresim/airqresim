export type Currency = 'EUR' | 'RUB';

export function detectCurrency(): Currency {
    const currency = localStorage.getItem('currency');
    return (currency as Currency) || 'EUR';
}