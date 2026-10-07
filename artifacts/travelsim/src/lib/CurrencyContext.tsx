import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, detectCurrency } from './currency';

const CurrencyContext = createContext<{ currency: Currency; setCurrency: (currency: Currency) => void } | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<Currency>(detectCurrency());

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};