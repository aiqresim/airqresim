import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { useAdmin } from '@/lib/AdminContext';
import { cn } from '@/lib/utils';

export type AdminLayoutProps = { children: React.ReactNode };

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/customers', label: 'Customers' },
] as const;

export function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, isLoading, logout } = useAdmin();

  useEffect(() => {
    if (!admin && !isLoading) {
      window.location.href = '/admin/login';
    }
  }, [admin, isLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <p className="text-sm text-slate-300">Loading...</p>
      </div>
    );
  }

  // Not authenticated: redirect is triggered by the effect above.
  if (!admin) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-[240px] shrink-0 flex-col bg-[#0F172A]">
        <div className="px-4 py-5 text-lg font-semibold text-white">
          AirQr Admin
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={(isActive) =>
                cn(
                  'block rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white',
                  isActive && 'bg-blue-600 text-white hover:bg-blue-600'
                )
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-[#F8FAFF] p-6">{children}</main>
    </div>
  );
}

export default AdminLayout;
