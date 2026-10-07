import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '@/components/admin-layout';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = ['All', 'Pending', 'Paid', 'ESIM_READY', 'Failed'] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

type AdminOrder = {
  publicId: string;
  email: string;
  customerCountry: string | null;
  status: string;
  paymentStatus: string;
  esimStatus: string;
  totalCents: number;
  createdAt: string;
};

/**
 * Maps dropdown options to order fields. There is no literal "PAID" status in
 * the DB, so "Paid" matches orders whose payment succeeded.
 */
function matchesStatusFilter(order: AdminOrder, filter: StatusOption): boolean {
  switch (filter) {
    case 'All':
      return true;
    case 'Pending':
      return order.status === 'PAYMENT_PENDING';
    case 'Paid':
      return order.paymentStatus === 'succeeded';
    case 'ESIM_READY':
      return order.status === 'ESIM_READY';
    case 'Failed':
      return order.status === 'FAILED' || order.paymentStatus === 'failed';
    default:
      return true;
  }
}

function statusBadgeClasses(value: string): string {
  const v = value.toLowerCase();
  if (v.includes('succeeded') || v.includes('ready')) {
    return 'bg-green-100 text-green-700';
  }
  if (v.includes('pending')) {
    return 'bg-gray-100 text-gray-600';
  }
  if (v.includes('failed')) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-blue-100 text-blue-700';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption>('All');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/orders?page=${page}&limit=${PAGE_SIZE}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load orders');
        }
        const data: { orders: AdminOrder[]; total: number } = await res.json();
        if (cancelled) return;
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        query === '' ||
        order.email.toLowerCase().includes(query) ||
        order.publicId.toLowerCase().includes(query);
      return matchesQuery && matchesStatusFilter(order, statusFilter);
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold text-slate-900">Orders</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by email or public ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full max-w-xs rounded-md border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusOption)}
          className="h-9 rounded-md border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <>
          {filteredOrders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No orders found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500">
                    <th className="px-4 py-3 font-medium">Public ID</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">eSIM</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.publicId} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {order.publicId.slice(0, 8)}...
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                        {order.email}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {order.customerCountry ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.paymentStatus}</td>
                      <td className="px-4 py-3 text-slate-700">{order.esimStatus}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatEuro(order.totalCents)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${order.publicId}`}
                          className="inline-block rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
        </>
      )}
    </AdminLayout>
  );
}
