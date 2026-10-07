import { useState } from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Layout } from '@/components/layout';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { ChatWidget } from '@/components/chat-widget';
import { PageTransition } from '@/components/motion';

import Home from '@/pages/home';
import Countries from '@/pages/countries';
import CountryPage from '@/pages/country';
import PlanPage from '@/pages/plan';
import Checkout from '@/pages/checkout';
import OrderPage from '@/pages/order';
import AccountPage from '@/pages/account';
import NotFound from '@/pages/not-found';
import Compatibility from '@/pages/compatibility';
import HowToInstall from '@/pages/how-to-install';
import Faq from '@/pages/faq';
import Contact from '@/pages/contact';
import RegisterPage from './pages/register';
import LoginPage from './pages/login';
import AdminLoginPage from './pages/admin/login';
import AdminDashboardPage from './pages/admin/dashboard';
import AdminOrdersPage from './pages/admin/orders';
import AdminProductsPage from './pages/admin/products';
import AdminCustomersPage from './pages/admin/customers';
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

/**
 * Route table. `Switch` renders the first matching `Route`, so the trailing
 * `*` route acts as the 404 catch-all.
 */
function AppRoutes() {
  return (
    <Layout>
      <ErrorBoundary>
        <PageTransition>
          <Switch>
          <Route path="/" component={Home} />
          <Route path="/countries" component={Countries} />
          <Route path="/country/:slug" component={CountryPage} />
          <Route path="/plan/:id" component={PlanPage} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order/:publicId" component={OrderPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/compatibility" component={Compatibility} />
          <Route path="/how-to-install" component={HowToInstall} />
          <Route path="/faq" component={Faq} />
          <Route path="/contact" component={Contact} />
          <Route path="/register" component={RegisterPage} />
<Route path="/login" component={LoginPage} />
<Route path="/admin/login" component={AdminLoginPage} />
<Route path="/admin" component={AdminDashboardPage} />
<Route path="/admin/orders" component={AdminOrdersPage} />
<Route path="/admin/products" component={AdminProductsPage} />
<Route path="/admin/customers" component={AdminCustomersPage} />
          <Route component={NotFound} />
          </Switch>
        </PageTransition>
      </ErrorBoundary>

      <ChatWidget />
      <Toaster />
    </Layout>
  );
}

export default function App() {
  // Created lazily so each mount gets its own cache.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
      </Router>
    </QueryClientProvider>
  );
}