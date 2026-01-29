'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, ShoppingCart, History, Edit, ArrowLeft } from 'lucide-react';
import styles from './purchases.module.css';
import { getInventoryProducts } from '@/actions/product-actions';
import { createPurchase, getPurchases, getPurchaseDetails, updatePurchase } from '@/actions/purchase-actions';

interface PurchaseItem {
    tempId: string; // for key
    productId: number;
    name: string;
    quantity: number;
    cost: number;
    lotNumber: string;
    expirationDate: string;
}

export default function PurchasesClientPage() {
    // Mode: 'new' | 'history'
    const [mode, setMode] = useState<'new' | 'history'>('new');

    // Purchases History State
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Editing State
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<PurchaseItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load History
    useEffect(() => {
        if (mode === 'history') {
            setLoadingHistory(true);
            getPurchases().then(res => {
                if (res.success) setHistory(res.purchases || []);
                setLoadingHistory(false);
            });
        }
    }, [mode]);

    // Search Products Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length > 1) {
                getInventoryProducts(search).then(setProducts);
            } else {
                setProducts([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const addToCart = (product: any) => {
        const newItem: PurchaseItem = {
            tempId: Math.random().toString(36),
            productId: product.id,
            name: product.name,
            quantity: 1,
            cost: parseFloat(product.cost),
            lotNumber: '',
            expirationDate: ''
        };
        setCart([...cart, newItem]);
    };

    const updateItem = (tempId: string, field: keyof PurchaseItem, value: any) => {
        setCart(cart.map(item =>
            item.tempId === tempId ? { ...item, [field]: value } : item
        ));
    };

    const removeItem = (tempId: string) => {
        setCart(cart.filter(item => item.tempId !== tempId));
    };

    const handleConfirm = async () => {
        if (cart.length === 0) return;

        const msg = editingId
            ? '¿Confirmar MODIFICACIÓN de compra? (Esto revertirá y re-aplicará stocks)'
            : '¿Confirmar registro de compra e ingreso de stock?';

        if (!confirm(msg)) return;

        setIsSubmitting(true);

        const payload = {
            items: cart.map(item => ({
                productId: item.productId,
                quantity: parseInt(item.quantity.toString()),
                cost: parseFloat(item.cost.toString()),
                lotNumber: item.lotNumber,
                expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined
            }))
        };

        let result;
        if (editingId) {
            result = await updatePurchase(editingId, payload);
        } else {
            result = await createPurchase(payload);
        }

        setIsSubmitting(false);

        if (result.success) {
            alert(editingId ? 'Compra actualizada correctamente' : 'Compra registrada correctamente');
            setCart([]);
            setSearch('');
            setEditingId(null);
            if (editingId) setMode('history'); // Go back to history if editing
        } else {
            alert(result.error);
        }
    };

    const handleEdit = async (purchaseId: number) => {
        if (!confirm('¿Desea editar esta compra? Se cargarán los items para su modificación.')) return;

        setLoadingHistory(true);
        const res = await getPurchaseDetails(purchaseId);
        setLoadingHistory(false);

        if (res.success && res.purchase) {
            // Map items to cart format
            const loadedItems: PurchaseItem[] = res.purchase.items.map((item: any) => ({
                tempId: Math.random().toString(36),
                productId: item.productId,
                name: item.product.name,
                quantity: item.quantity,
                cost: Number(item.cost),
                lotNumber: item.lotNumber || '',
                expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : ''
            }));

            setCart(loadedItems);
            setEditingId(purchaseId);
            setMode('new'); // Switch to form view
        } else {
            alert('No se pudo cargar la compra.');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setCart([]);
        setMode('history');
    };

    const total = cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

    return (
        <div className={styles.container} style={{ flexDirection: 'column' }}>
            {/* Toolbar / Tabs */}
            <div className="flex gap-4 mb-4 items-center">
                <button
                    onClick={() => { setMode('new'); setEditingId(null); setCart([]); }}
                    className={`btn ${mode === 'new' && !editingId ? 'btn-primary' : 'btn-secondary'}`}
                >
                    <Plus size={18} className="mr-2" /> Nueva Compra
                </button>
                <button
                    onClick={() => setMode('history')}
                    className={`btn ${mode === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    <History size={18} className="mr-2" /> Historial de Compras
                </button>
            </div>

            {/* Mode: HISTORY */}
            {mode === 'history' && (
                <div className="bg-white rounded-lg shadow p-6 flex-1 overflow-auto">
                    <h2 className="text-xl font-bold mb-4">Historial de Compras</h2>
                    {loadingHistory ? (
                        <div className="p-4 text-center text-gray-500">Cargando...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Usuario</th>
                                    <th className="p-3">Items</th>
                                    <th className="p-3">Total (Bs)</th>
                                    <th className="p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(p => (
                                    <tr key={p.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-mono text-sm">#{p.id}</td>
                                        <td className="p-3">{new Date(p.date).toLocaleString()}</td>
                                        <td className="p-3">{p.user?.name || 'Desconocido'}</td>
                                        <td className="p-3">{p._count.items}</td>
                                        <td className="p-3 font-bold">{Number(p.total).toFixed(2)}</td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleEdit(p.id)}
                                                className="btn btn-secondary text-sm py-1 px-3"
                                            >
                                                <Edit size={14} className="mr-1" /> Modificar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Mode: NEW / EDIT */}
            {mode === 'new' && (
                <div className="flex gap-6 h-full flex-1 overflow-hidden">
                    {/* Left Box: Product Search */}
                    <div className={styles.leftPanel}>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Search className="text-primary" /> Buscar Productos
                        </h2>
                        <div className={styles.searchBox}>
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                className={styles.searchInput}
                                placeholder="Escriba nombre del producto..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className={styles.resultsList}>
                            {products.map(p => (
                                <div key={p.id} className={styles.productCard} onClick={() => addToCart(p)}>
                                    <div className="font-semibold">{p.name}</div>
                                    <div className="text-sm text-gray-500 flex justify-between">
                                        <span>Stock actual: {p.stock}</span>
                                        <span>{p.code}</span>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && search.length > 1 && (
                                <div className="text-center text-gray-400 mt-10">No se encontraron productos</div>
                            )}
                        </div>
                    </div>

                    {/* Right Box: Cart / Entry Form */}
                    <div className={styles.rightPanel}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingCart className="text-primary" />
                                {editingId ? `Editando Compra #${editingId}` : 'Ingreso de Mercadería'}
                            </h2>
                            {editingId && (
                                <button onClick={cancelEdit} className="text-sm text-red-500 hover:underline">
                                    Cancelar Edición
                                </button>
                            )}
                        </div>

                        <div className={styles.cartList}>
                            {cart.map(item => (
                                <div key={item.tempId} className={styles.cartItem}>
                                    <div className={styles.cartItemHeader}>
                                        <span>{item.name}</span>
                                        <button onClick={() => removeItem(item.tempId)} className="text-red-500 hover:bg-red-50 rounded p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Cantidad</label>
                                            <input
                                                type="number"
                                                className={styles.cartInput}
                                                value={item.quantity}
                                                min="1"
                                                onChange={e => updateItem(item.tempId, 'quantity', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Costo Unit. (Bs)</label>
                                            <input
                                                type="number"
                                                className={styles.cartInput}
                                                value={item.cost}
                                                step="0.1"
                                                onChange={e => updateItem(item.tempId, 'cost', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Lote</label>
                                            <input
                                                type="text"
                                                className={styles.cartInput}
                                                placeholder="Opcional"
                                                value={item.lotNumber}
                                                onChange={e => updateItem(item.tempId, 'lotNumber', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500">Vencimiento</label>
                                            <input
                                                type="date"
                                                className={styles.cartInput}
                                                value={item.expirationDate}
                                                onChange={e => updateItem(item.tempId, 'expirationDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="text-center text-gray-400 py-10 border-2 dashed border-gray-100 rounded-lg">
                                    Seleccione productos para ingresar stock
                                </div>
                            )}
                        </div>

                        <div className={styles.summary}>
                            <div className={styles.totalRow}>
                                <span>Total Compra:</span>
                                <span>Bs. {total.toFixed(2)}</span>
                            </div>
                            <button
                                className={styles.confirmBtn}
                                disabled={cart.length === 0 || isSubmitting}
                                onClick={handleConfirm}
                            >
                                <Save size={20} />
                                {isSubmitting ? 'Procesando...' : (editingId ? 'Actualizar Compra' : 'Confirmar Ingreso')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
