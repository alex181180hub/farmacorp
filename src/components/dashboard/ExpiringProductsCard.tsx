'use client';

import { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { getExpiringProductsList, removeExpiredProduct } from '@/actions/product-actions';
import styles from '@/app/page.module.css';

interface StatCardProps {
    count: number;
}

export default function ExpiringProductsCard({ count }: StatCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setIsOpen(true);
        loadProducts();
    };

    const loadProducts = async () => {
        setLoading(true);
        const list = await getExpiringProductsList();
        setProducts(list);
        setLoading(false);
    };

    const handleRemove = async (product: any) => {
        if (!confirm(`¿Está seguro de dar de baja ${product.stock} unidades de ${product.name} por vencimiento? Esta acción quedará registrada en el historial.`)) return;

        // Optimistic update or just reload
        const res = await removeExpiredProduct(product.id, product.stock, 'Baja desde Dashboard (Vencidos)');
        if (res.success) {
            alert('Producto dado de baja correctamente');
            loadProducts();
        } else {
            alert(res.error || 'Error al dar de baja');
        }
    };

    return (
        <>
            <div className={`${styles.statCard} cursor-pointer hover:shadow-md transition-shadow`} onClick={handleClick}>
                <div className={styles.statHeader}>
                    <div className={`${styles.iconBox} ${styles.redIcon}`}>
                        <AlertTriangle size={20} />
                    </div>
                    <span className={styles.statTitle}>Alertas Stock</span>
                </div>
                <div className={styles.statValue} style={{ color: 'var(--secondary)' }}>{count}</div>
                <div className={styles.statTrend}>
                    <span className={styles.trendDown}>Productos por vencer (3 meses)</span>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                <AlertTriangle size={24} />
                                Productos Por Vencer / Vencidos (Gestión)
                            </h3>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className={styles.closeButton}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            {loading ? (
                                <div className="text-center py-8 text-secondary">Cargando inventario...</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="text-secondary font-semibold uppercase text-xs sticky top-0 bg-white border-b">
                                        <tr>
                                            <th className="p-3">Código</th>
                                            <th className="p-3">Producto</th>
                                            <th className="p-3 text-right">Stock</th>
                                            <th className="p-3 text-right">Vencimiento</th>
                                            <th className="p-3 text-center">Estado</th>
                                            <th className="p-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {products.length === 0 ? (
                                            <tr><td colSpan={6} className="p-8 text-center text-secondary">No hay productos con alertas de vencimiento.</td></tr>
                                        ) : (
                                            products.map(p => {
                                                const expDate = new Date(p.expirationDate);
                                                const today = new Date();
                                                const isExpired = expDate < today;
                                                const diffTime = Math.abs(expDate.getTime() - today.getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                const isNear = !isExpired && diffDays <= 30;

                                                const statusStyle = isExpired
                                                    ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                                                    : isNear
                                                        ? { backgroundColor: '#ffedd5', color: '#9a3412' }
                                                        : { backgroundColor: '#fef9c3', color: '#854d0e' };

                                                return (
                                                    <tr key={p.id} className="border-b transition-colors hover:bg-gray-50" style={isExpired ? { backgroundColor: '#fef2f2' } : {}}>
                                                        <td className="p-3 font-mono text-secondary font-medium">{p.code}</td>
                                                        <td className="p-3 font-medium text-primary">{p.name}</td>
                                                        <td className="p-3 text-right font-bold">{p.stock}</td>
                                                        <td className="p-3 text-right">
                                                            {expDate.toLocaleDateString()}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span style={{
                                                                ...statusStyle,
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'inline-block'
                                                            }}>
                                                                {isExpired ? 'Vencido' : isNear ? `Por Vencer (${diffDays}d)` : 'Alerta'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {p.stock > 0 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleRemove(p); }}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                                    title="Dar de baja stock (Vencido o Por Vencer)"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="btn btn-secondary text-sm">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
