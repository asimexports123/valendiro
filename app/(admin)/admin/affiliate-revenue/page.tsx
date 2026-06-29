import { MetricCard } from "@/components/admin/MetricCard";
import { getAffiliateRevenue } from "@/services/admin/dashboardData";

export default async function AffiliateRevenuePage() {
  const { total, byProduct, error } = await getAffiliateRevenue(30);
  const topProducts = Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Affiliate Revenue Tracking</h1>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard title="Est. Revenue (30d)" value={`$${total.toFixed(2)}`} />
        <MetricCard title="Active Products" value={Object.keys(byProduct).length} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-background shadow-[var(--shadow)] overflow-hidden">
        <h2 className="px-5 py-4 font-semibold text-foreground border-b border-border/60">Top Products</h2>
        <ul className="divide-y divide-border/60">
          {topProducts.map(([productId, revenue]) => (
            <li key={productId} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="text-foreground/80">{productId}</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                ${revenue.toFixed(2)}
              </span>
            </li>
          ))}
          {topProducts.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">No affiliate data yet</li>}
        </ul>
      </div>
    </div>
  );
}
