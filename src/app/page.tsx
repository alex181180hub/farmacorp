export const dynamic = 'force-dynamic';
import styles from './page.module.css';
import { DollarSign, Archive, TrendingUp, Users, TrendingDown } from 'lucide-react';
import { getExpiringProducts } from '@/actions/product-actions';
import { getDashboardChartData, getDashboardStats, getDashboardTopProducts } from '@/actions/dashboard-actions';
import ExpiringProductsCard from '@/components/dashboard/ExpiringProductsCard';
import SalesAreaChart from '@/components/dashboard/SalesAreaChart';

export default async function Dashboard() {
  const [expiringCount, stats, chartData, topProducts] = await Promise.all([
    getExpiringProducts(),
    getDashboardStats(),
    getDashboardChartData(),
    getDashboardTopProducts()
  ]);

  console.log('Chart Data:', JSON.stringify(chartData, null, 2));

  // Use (max of data OR 1) to avoid division by zero, but let the highest bar define 100% height
  const maxChartValue = chartData && chartData.length > 0
    ? Math.max(...chartData.map(d => d.value), 1)
    : 1;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <h1>Panel de Control</h1>
        <p className="text-secondary">Bienvenido al sistema. Resumen de hoy, {new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}. <span className="text-red-500 font-bold ml-2">(v3.5 ACTUALIZADO)</span></p>
      </div>

      <div className={styles.statsGrid}>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.iconBox} ${styles.blueIcon}`}>
              <DollarSign size={20} />
            </div>
            <span className={styles.statTitle}>Ventas Netas</span>
          </div>
          <div className={styles.statValue}>Bs. {stats?.sales.amount.toFixed(2) ?? '0.00'}</div>
          <div className={styles.statTrend}>
            {stats && stats.sales.growth >= 0 ? (
              <>
                <TrendingUp size={14} className={styles.trendUp} />
                <span className={styles.trendUp}>+{stats.sales.growth.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown size={14} className={styles.trendDown} />
                <span className={styles.trendDown}>{stats?.sales.growth.toFixed(1)}%</span>
              </>
            )}
            <span className="ml-1 text-secondary">vs ayer</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.iconBox} ${styles.greenIcon}`}>
              <Users size={20} />
            </div>
            <span className={styles.statTitle}>Clientes Atendidos</span>
          </div>
          <div className={styles.statValue}>{stats?.customers.count ?? 0}</div>
          <div className={styles.statTrend}>
            <span className="text-secondary">Transacciones hoy</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.iconBox} ${styles.purpleIcon}`}>
              <Archive size={20} />
            </div>
            <span className={styles.statTitle}>Kardex Diario</span>
          </div>
          <div className={styles.statValue}>{stats?.kardex.count ?? 0}</div>
          <div className={styles.statTrend}>
            <span className="text-secondary">Movimientos detectados</span>
          </div>
        </div>

        <ExpiringProductsCard count={expiringCount} />
      </div>

      <div className={styles.sectionGrid}>
        <div className={styles.chartCard}>
          <SalesAreaChart data={chartData} />
        </div>

        <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="mb-4 font-bold text-gray-800">Productos Más Vendidos</h2>
          <div className="overflow-y-auto flex-1 pr-2">
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No hay datos de ventas aún.</p>
            ) : (
              <ul className="space-y-4">
                {topProducts.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate" title={p.name}>{p.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{p.code}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-gray-800">{p.sold}</span>
                      <span className="text-xs text-gray-500">unid.</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
