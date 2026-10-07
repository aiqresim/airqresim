import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { toast } from '@/hooks/use-toast';

type AdminProduct = {
  id: string;
  dataGb: number;
  validityDays: number;
  supplierCostCents: number;
  sellingPriceCents: number;
  isActive: boolean;
  countryName: string | null;
  countryFlag: string | null;
};

const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

function marginPercent(product: AdminProduct): number {
  if (product.sellingPriceCents <= 0) return 0;
  return Math.round(
    ((product.sellingPriceCents - product.supplierCostCents) /
      product.sellingPriceCents) *
      100
  );
}

function marginClasses(margin: number): string {
  if (margin > 40) return 'text-green-600';
  if (margin >= 20) return 'text-yellow-600';
  return 'text-red-600';
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/products', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load products');
      const data: { products: AdminProduct[] } = await res.json();
      setProducts(data.products ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchPlan = async (
    id: string,
    body: { sellingPriceCents?: number; isActive?: boolean }
  ) => {
    const res = await fetch(`/api/admin/products/plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update plan');
  };

  const handleToggleActive = async (product: AdminProduct, isActive: boolean) => {
    try {
      await patchPlan(product.id, { isActive });
      toast({ title: 'Success', description: 'Plan updated' });
      await load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update plan',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setPriceInput((product.sellingPriceCents / 100).toFixed(2));
  };

  const handleSavePrice = async (product: AdminProduct) => {
    const value = Number.parseFloat(priceInput);
    if (!Number.isFinite(value) || value <= 0) {
      toast({
        title: 'Error',
        description: 'Enter a valid price',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      await patchPlan(product.id, { sellingPriceCents: Math.round(value * 100) });
      toast({ title: 'Success', description: 'Price updated' });
      setEditingId(null);
      await load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update price',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold text-slate-900">Products</h1>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
          {products.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No products found.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Validity</th>
                  <th className="px-4 py-3 font-medium">Supplier Cost</th>
                  <th className="px-4 py-3 font-medium">Selling Price</th>
                  <th className="px-4 py-3 font-medium">Margin %</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const margin = marginPercent(product);
                  return (
                    <tr key={product.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 text-slate-700">
                        <span className="mr-2">{product.countryFlag ?? '—'}</span>
                        {product.countryName ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{product.dataGb} GB</td>
                      <td className="px-4 py-3 text-slate-700">
                        {product.validityDays} days
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatEuro(product.supplierCostCents)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatEuro(product.sellingPriceCents)}
                      </td>
                      <td className={`px-4 py-3 font-medium ${marginClasses(margin)}`}>
                        {margin}%
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={(e) =>
                            void handleToggleActive(product, e.target.checked)
                          }
                          disabled={isSaving}
                          className="h-4 w-4 accent-blue-600"
                          aria-label={`Active toggle for ${
                            product.countryName ?? 'plan'
                          } ${product.dataGb}GB`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {editingId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void handleSavePrice(product);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              disabled={isSaving}
                              autoFocus
                              className="h-8 w-24 rounded-md border px-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => void handleSavePrice(product)}
                              disabled={isSaving}
                              className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={isSaving}
                              className="rounded-md border px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="rounded-md border px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            Edit price
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
