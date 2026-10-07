import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CurrencyProvider } from './lib/CurrencyContext';
import { AuthProvider } from './lib/AuthContext';
import { AdminProvider } from './lib/AdminContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurrencyProvider>
      <AuthProvider>
        <AdminProvider>
          <App />
        </AdminProvider>
      </AuthProvider>
    </CurrencyProvider>
  </React.StrictMode>
);