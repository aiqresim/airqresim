import React from 'react';
import { useCurrency } from '@/lib/CurrencyContext';
const CurrencySwitcher: React.FC = () => {
    const { currency, setCurrency } = useCurrency();

    return (
        <div>
            <button onClick={() => setCurrency('EUR')}>€ EUR</button>
            <button onClick={() => setCurrency('RUB')}>₽ RUB</button>
        </div>
    );
};

export default CurrencySwitcher;