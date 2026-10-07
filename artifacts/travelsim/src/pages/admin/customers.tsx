import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { formatDate } from '@/lib/format';

const PAGE_SIZE = 20;

type AdminCustomer = {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  createdAt: string;
  ordersCount: number;
  totalCents: number;
};

const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/admin/customers', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load customers');
        }
        const data: { customers: AdminCustomer[] } = await res.json();
        if (cancelled) return;
        setCustomers(data.customers ?? []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load customers'
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === '') return customers;
    return customers.filter((customer) =>
      customer.email.toLowerCase().includes(query)
    );
  }, [customers, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE)
  );
  const pageCustomers = filteredCustomers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold text-slate-900">Customers</h1>

      <div className="mt-4">
        <input
          type="search"
          placeholder="Search by email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full max-w-xs rounded-md border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <>
          {pageCustomers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No customers found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Orders Count</th>
                    <th className="px-4 py-3 font-medium">Total Spent</th>
                    <th className="px-4 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {pageCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className={`border-b last:border-b-0 ${
                        customer.ordersCount > 0 ? '' : 'text-slate-400'
                      }`}
                    >
                      <td className="max-w-[220px] truncate px-4 py-3">
                        {customer.email}
                      </td>
                      <td className="px-4 py-3">{customer.name ?? '—'}</td>
                      <td className="px-4 py-3">{customer.country ?? '—'}</td>
                      <td className="px-4 py-3">{customer.ordersCount}</td>
                      <td className="px-4 py-3">
                        {formatEuro(customer.totalCents)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(customer.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
