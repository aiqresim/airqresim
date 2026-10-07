import React from 'react';
import { useCurrency } from '@/lib/CurrencyContext';

const CurrencySwitcher = () => {
  const { currency, setCurrency } = useCurrency();

  const changeCurrency = (curr) => {
    setCurrency(curr);
  };

  return (
    <div>
      <button onClick={() => changeCurrency('EUR')}>EUR</button>
      <button onClick={() => changeCurrency('RUB')}>RUB</button>
    </div>
  );
};

export default CurrencySwitcher;