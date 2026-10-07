import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '@/components/admin-layout';

type AdminStats = {
  totalOrders: number;
  totalRevenueCents: number;
  successOrders: number;
  failedOrders: number;
};

type AdminOrder = {
  publicId: string;
  email: string;
  status: string;
  totalCents: number;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/admin/stats', { credentials: 'include' }),
          fetch('/api/admin/orders?page=1&limit=10', { credentials: 'include' }),
        ]);
        if (!statsRes.ok || !ordersRes.ok) {
          throw new Error('Failed to load dashboard data');
        }
        const statsData: AdminStats = await statsRes.json();
        const ordersData: { orders: AdminOrder[] } = await ordersRes.json();
        setStats(statsData);
        setOrders(ordersData.orders ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

      {isLoading && (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {!isLoading && !error && stats && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {stats.totalOrders}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-slate-500">Revenue</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatEuro(stats.totalRevenueCents)}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-slate-500">Success Orders</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {stats.successOrders}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-slate-500">Failed Orders</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {stats.failedOrders}
              </p>
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold text-slate-900">
            Recent orders
          </h2>

          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500">
                    <th className="px-4 py-3 font-medium">Public ID</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.publicId} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {order.publicId.slice(0, 8)}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                        {order.email}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.status}</td>
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
        </>
      )}
    </AdminLayout>
  );
}
