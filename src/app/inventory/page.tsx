'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Filter, Edit, Trash2, Search, X } from 'lucide-react';
import styles from './inventory.module.css';
import { getInventoryProducts, createProduct, updateProduct, deleteProduct } from '@/actions/product-actions';
import { getCategories } from '@/actions/pos-actions';

export default function InventoryPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<any>({
        code: '', barcode: '', name: '', categoryId: '',
        price: '', cost: '', stock: '', minStock: '5',
        location: '', expirationDate: ''
    });

    const loadData = async () => {
        setLoading(true);
        const [prods, cats] = await Promise.all([
            getInventoryProducts(query),
            getCategories()
        ]);
        setProducts(prods);
        setCategories(cats);
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleOpenModal = (product?: any) => {
        if (product) {
            setEditingId(product.id);
            setFormData({
                ...product,
                categoryId: product.categoryId,
                expirationDate: product.expirationDate ? new Date(product.expirationDate).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingId(null);
            setFormData({
                code: '', barcode: '', name: '', categoryId: categories[0]?.id || '',
                price: '', cost: '', stock: '', minStock: '5',
                location: '', expirationDate: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = editingId
            ? await updateProduct(editingId, formData)
            : await createProduct(formData);

        if (result.success) {
            setIsModalOpen(false);
            loadData();
        } else {
            alert(result.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Eliminar producto? Esta acción no se puede deshacer.')) {
            const res = await deleteProduct(id);
            if (res.success) loadData();
            else alert(res.error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Inventario General</h1>
                    <p className="text-secondary">Gestión de productos farmacéuticos y stock</p>
                </div>
                <div className={styles.actions}>
                    <button className="btn btn-secondary">
                        <Download size={18} className="mr-2" /> Exportar
                    </button>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} className="mr-2" /> Nuevo Producto
                    </button>
                </div>
            </div>

            <div className={styles.card}>
                <div className="p-4 border-b bg-slate-50 flex gap-4">
                    <div className="flex items-center bg-white border rounded px-3 flex-1">
                        <Search size={18} className="text-slate-400 mr-2" />
                        <input
                            className="w-full py-2 outline-none"
                            placeholder="Buscar por nombre, código o barras..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Ubicación</th>
                                <th>Stock</th>
                                <th>P. Venta</th>
                                <th>Vencimiento</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="text-center p-8">Cargando...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={9} className="text-center p-8">No hay productos registrados.</td></tr>
                            ) : (
                                products.map((product) => {
                                    const isLowStock = product.stock <= product.minStock;
                                    return (
                                        <tr key={product.id}>
                                            <td className="font-semibold text-secondary text-sm">{product.code}</td>
                                            <td>
                                                <div className="font-medium text-primary">{product.name}</div>
                                                <div className="text-xs text-secondary">{product.barcode}</div>
                                            </td>
                                            <td><span className="badge">{product.category.name}</span></td>
                                            <td className="text-sm">{product.location}</td>
                                            <td className="font-bold">{product.stock}</td>
                                            <td>Bs. {parseFloat(product.price).toFixed(2)}</td>
                                            <td style={{ color: product.expirationDate && new Date(product.expirationDate) < new Date('2025-01-01') ? '#e30613' : 'inherit' }}>
                                                {product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${isLowStock ? styles.lowStock : styles.goodStock}`}>
                                                    {isLowStock ? 'Bajo' : 'OK'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-2">
                                                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" onClick={() => handleOpenModal(product)}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="p-1 text-red-500 hover:bg-red-50 rounded" onClick={() => handleDelete(product.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Código Interno *</label>
                                <input required className="input" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Código de Barras</label>
                                <input className="input" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
                            </div>

                            <div className="col-span-2">
                                <label className="text-sm font-semibold block mb-1">Nombre del Producto *</label>
                                <input required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="col-span-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm font-semibold">Categoría *</label>
                                    <button
                                        type="button"
                                        className="text-xs text-blue-600 hover:underline"
                                        onClick={() => {
                                            const newCat = prompt('Ingrese el nombre de la nueva categoría (ej. Antibióticos):');
                                            if (newCat) {
                                                // We can create it immediately via a server action, but for now let's just use a special flow or better UI.
                                                // Actually, let's create a hidden server action call here or just call backend.
                                                // Since we don't have a direct 'createCategory' import here exposed yet, let's handle via a quick fetch or ensure we import it.
                                                // For simplicity, I'll assume we can pass a special string or handle it. 
                                                // Better approach: Add createCategory to actions and call it.
                                                import('@/actions/pos-actions').then(async mod => {
                                                    const res = await mod.createCategory(newCat);
                                                    if (res.success && res.category) {
                                                        setCategories((prev: any[]) => [...prev, res.category]);
                                                        setFormData((prev: any) => ({ ...prev, categoryId: res.category.id }));
                                                    } else {
                                                        alert('Error al crear categoría.');
                                                    }
                                                });
                                            }
                                        }}
                                    >
                                        + Nueva
                                    </button>
                                </div>
                                <select required className="input" value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Ubicación</label>
                                <input className="input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Ej. Estante A-1" />
                            </div>

                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Precio Venta (Bs) *</label>
                                <input type="number" step="0.01" required className="input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Costo Compra (Bs) *</label>
                                <input type="number" step="0.01" required className="input" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
                            </div>

                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Stock Actual *</label>
                                <input type="number" required className="input" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Stock Mínimo</label>
                                <input type="number" className="input" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
                            </div>

                            <div className="col-span-1">
                                <label className="text-sm font-semibold block mb-1">Fecha Vencimiento</label>
                                <input type="date" className="input" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} />
                            </div>

                            <div className="col-span-2 mt-4 flex justify-end gap-2">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editingId ? 'Guardar Cambios' : 'Registrar Producto'}</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
