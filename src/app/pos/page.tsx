'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, CreditCard, User, Box, Lock, Loader2 } from 'lucide-react';
import styles from './pos.module.css';
import { CartItem } from '@/lib/types';
import { getProducts, getCategories } from '@/actions/pos-actions';
import { processSale } from '@/actions/sale-actions';
import { getOpenShift } from '@/actions/shift-actions';
import { getCurrentUserSession } from '@/actions/report-actions';
import InvoiceModal from '@/components/InvoiceModal';
import CustomerSearchModal from '@/components/CustomerSearchModal';
import CheckoutTypeModal from '@/components/CheckoutTypeModal';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

export default function POSPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [cart, setCart] = useState<CartItem[]>([]);

    // Cutomer & Checkout State
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Checkout Process State
    const [processing, setProcessing] = useState(false);
    const [showCheckoutType, setShowCheckoutType] = useState(false);
    const [lastSale, setLastSale] = useState<{ sale: any, qr: string } | null>(null);

    // Shift Blocking Check
    const [checkingShift, setCheckingShift] = useState(true);
    const [shiftBlocked, setShiftBlocked] = useState(false);

    // Load Categories on mount and Check Shift
    useEffect(() => {
        getCategories().then(setCategories);
        checkShiftStatus();
    }, []);

    async function checkShiftStatus() {
        try {
            const user = await getCurrentUserSession();
            if (!user) {
                // Not logged in or session invalid
                setShiftBlocked(true);
                return;
            }

            const shift = await getOpenShift(user.id);
            if (!shift) {
                setShiftBlocked(true);
            } else {
                setShiftBlocked(false);
            }
        } catch (error) {
            console.error(error);
            setShiftBlocked(true);
        } finally {
            setCheckingShift(false);
        }
    }

    // Fetch Products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProducts(debouncedQuery, selectedCategoryId);
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, selectedCategoryId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            // Maps backend product to frontend CartItem
            const cartItem: CartItem = {
                id: product.id,
                code: product.code,
                barcode: product.barcode || '',
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                minStock: product.minStock,
                requiresPrescription: product.requiresPrescription,
                expirationDate: product.expirationDate,
                location: product.location || '',
                quantity: 1,
                discount: 0
            };
            return [...prev, cartItem];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal;

    const handleInitCheckout = () => {
        if (shiftBlocked) return alert('Debe abrir caja para realizar ventas.');
        if (cart.length === 0) return;
        setShowCheckoutType(true);
    };

    const handleProcessSale = async (type: 'FACTURA' | 'RECIBO', method: 'EFECTIVO' | 'QR' = 'EFECTIVO') => {
        setShowCheckoutType(false);
        setProcessing(true);

        const saleData = {
            customerNit: selectedCustomer?.nit || '0',
            customerName: selectedCustomer?.razonSocial || 'SIN NOMBRE',
            items: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price, discount: i.discount })),
            total: total,
            invoiceType: type,
            paymentMethod: method
        };

        const result = await processSale(saleData);

        setProcessing(false);
        if (result.success) {
            setLastSale({ sale: result.sale, qr: result.qr! });
            setCart([]);
            setSelectedCustomer(null);
        } else {
            alert('Error en la venta: ' + result.error);
        }
    };

    if (checkingShift) return <div className="flex h-screen items-center justify-center text-slate-500 font-bold animate-pulse"><Loader2 className="animate-spin mr-2" /> Verificando Estado de Caja...</div>;

    if (shiftBlocked) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-6">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center border border-red-100">
                    <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Caja Cerrada</h2>
                    <p className="text-gray-500 mb-6">No es posible realizar ventas sin una caja abierta. Por favor, inicie su turno.</p>
                    <button
                        onClick={() => router.push('/shift')}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        IR A APERTURA DE CAJA
                    </button>
                    {/* Optional Bypass for Admin Debugging if needed later */}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {lastSale && (
                <InvoiceModal
                    sale={lastSale.sale}
                    qrContent={lastSale.qr}
                    onClose={() => setLastSale(null)}
                />
            )}

            {showCheckoutType && (
                <CheckoutTypeModal
                    total={total}
                    onSelect={handleProcessSale}
                    onCancel={() => setShowCheckoutType(false)}
                />
            )}

            {showCustomerModal && (
                <CustomerSearchModal
                    onClose={() => setShowCustomerModal(false)}
                    onSelect={(c) => {
                        setSelectedCustomer(c);
                        setShowCustomerModal(false);
                    }}
                />
            )}

            {/* Left: Catalog */}
            <div className={styles.catalogSection}>
                {/* Search & Categories */}
                <div className={styles.searchArea}>
                    <input
                        className="input mb-4"
                        placeholder="Buscar producto por nombre o código (F1)..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className={styles.categoryFilter}>
                        <button
                            className={`${styles.categoryBtn} ${selectedCategoryId === null ? styles.categoryBtnActive : ''}`}
                            onClick={() => setSelectedCategoryId(null)}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`${styles.categoryBtn} ${selectedCategoryId === cat.id ? styles.categoryBtnActive : ''}`}
                                onClick={() => setSelectedCategoryId(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className={styles.productGrid}>
                    {loading ? (
                        <div className="col-span-3 text-center p-8 text-secondary">Cargando productos...</div>
                    ) : products.length === 0 ? (
                        <div className="col-span-3 text-center p-8 text-secondary">No se encontraron productos.</div>
                    ) : (
                        products.map(product => (
                            <div key={product.id} className={styles.productCard} onClick={() => addToCart(product)}>
                                <div>
                                    <div className={styles.productName}>{product.name}</div>
                                    <div className={styles.productCode}>{product.code}</div>
                                </div>
                                <div>
                                    <div className={styles.productStock}>Stock: {product.stock}</div>
                                    <div className={styles.productPrice}>Bs. {product.price.toFixed(2)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Cart */}
            <div className={styles.cartSection}>
                <div className={styles.cartHeader}>
                    <span className={styles.cartTitle}>Carrito de Compra</span>
                    <button className={styles.clearBtn} onClick={() => setCart([])}>Limpiar</button>
                </div>

                <div className="p-4 bg-white border-b">
                    <div className={styles.customerSelector} onClick={() => setShowCustomerModal(true)}>
                        <div className="flex items-center gap-2">
                            <User size={18} />
                            <span>{selectedCustomer ? selectedCustomer.razonSocial : 'Seleccionar Cliente (F3)'}</span>
                        </div>
                        <span className="text-sm text-secondary">Cambiar</span>
                    </div>
                </div>

                <div className={styles.cartItems}>
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-secondary">
                            <Box size={48} className="mb-2 opacity-20" />
                            <p>No hay productos</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className={styles.cartItem}>
                                <div className={styles.cartItemInfo}>
                                    <div className={styles.cartItemTitle}>{item.name}</div>
                                    <div className={styles.cartItemPrice}>Bs. {item.price.toFixed(2)} x {item.quantity}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={styles.quantityControls}>
                                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                                        <div className={styles.qtyVal}>{item.quantity}</div>
                                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-secondary hover:text-red-500 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.cartFooter}>
                    <div className={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>Bs. {subtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Descuento</span>
                        <span>Bs. 0.00</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>Total a Pagar</span>
                        <span>Bs. {total.toFixed(2)}</span>
                    </div>
                    <button
                        className={styles.checkoutBtn}
                        disabled={cart.length === 0 || processing || shiftBlocked}
                        onClick={handleInitCheckout}
                    >
                        <CreditCard size={20} />
                        {processing ? 'Procesando...' : 'Cobrar (F2)'}
                    </button>
                </div>
            </div>
        </div>
    );
}
