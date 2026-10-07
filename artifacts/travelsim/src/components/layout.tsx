import type { ReactNode } from 'react';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export interface LayoutProps {
  children: ReactNode;
}

/**
 * Chrome shared by every route: sticky header, page content, sticky footer.
 * Pages render inside <main> and own their own container width.
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;