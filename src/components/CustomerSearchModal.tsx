'use client';

import { useState, useEffect } from 'react';
import { Search, User, X, Plus, Save, ArrowLeft } from 'lucide-react';
import { getCustomers, createCustomer } from '@/actions/customer-actions';
// import styles from '../app/pos/pos.module.css';

interface CustomerSearchModalProps {
    onSelect: (customer: any) => void;
    onClose: () => void;
}

export default function CustomerSearchModal({ onSelect, onClose }: CustomerSearchModalProps) {
    const [view, setView] = useState<'search' | 'create'>('search');
    const [query, setQuery] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Form State
    const [newData, setNewData] = useState({ nit: '', razonSocial: '', email: '', phone: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (view !== 'search') return;

        const search = async () => {
            setLoading(true);
            const data = await getCustomers(query);
            setCustomers(data);
            setLoading(false);
        };

        const timer = setTimeout(search, 400);
        return () => clearTimeout(timer);
    }, [query, view]);

    const handleCreate = async () => {
        if (!newData.razonSocial || !newData.nit) {
            alert('Razón Social y NIT son obligatorios.');
            return;
        }

        setCreating(true);
        const result = await createCustomer({
            nit: newData.nit,
            razonSocial: newData.razonSocial,
            email: newData.email || undefined,
            phone: newData.phone || undefined
        });

        setCreating(false);

        if (result.success) {
            // Find the newly created customer (or just mock it to return immediately)
            // It's safer to just return the object we attempted to save if we trust it, 
            // but ideally the action returns the full object. 
            // For now, let's just select what we sent + success.
            onSelect({ ...newData, id: Date.now() }); // Temporary ID until refresh, but works for POS sale
        } else {
            alert(result.error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[550px] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {view === 'search' ? 'Seleccionar Cliente' : 'Nuevo Cliente'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {view === 'search' ? (
                    <>
                        <div className="p-4 border-b space-y-3">
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                <Search size={18} className="text-gray-400 mr-2" />
                                <input
                                    autoFocus
                                    className="w-full outline-none text-gray-700 placeholder:text-gray-400"
                                    placeholder="Buscar por NIT o Razón Social..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setNewData({ ...newData, nit: query }); // Pre-fill search query as potential NIT/Name
                                    setView('create');
                                }}
                                className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Crear Nuevo Cliente
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                                    <p>Buscando...</p>
                                </div>
                            ) : customers.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <User size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>No se encontraron clientes.</p>
                                    <p className="text-sm">Intenta buscar con otro término o crea uno nuevo.</p>
                                </div>
                            ) : (
                                customers.map(c => (
                                    <div
                                        key={c.id}
                                        className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg border-b border-gray-100 last:border-0 group transition-colors"
                                        onClick={() => onSelect(c)}
                                    >
                                        <div className="font-bold text-gray-800 group-hover:text-blue-700">{c.razonSocial}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono font-medium text-gray-600">NIT: {c.nit}</span>
                                            {c.email && <span className="truncate max-w-[150px]">• {c.email}</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col p-6">
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIT / CI *</label>
                                <input
                                    className="input w-full p-2 border rounded-md"
                                    value={newData.nit}
                                    onChange={e => setNewData({ ...newData, nit: e.target.value })}
                                    placeholder="Número de documento"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social / Nombre *</label>
                                <input
                                    className="input w-full p-2 border rounded-md"
                                    value={newData.razonSocial}
                                    onChange={e => setNewData({ ...newData, razonSocial: e.target.value })}
                                    placeholder="Nombre completo o Razón Social"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        className="input w-full p-2 border rounded-md"
                                        value={newData.phone}
                                        onChange={e => setNewData({ ...newData, phone: e.target.value })}
                                        placeholder="Opcional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        className="input w-full p-2 border rounded-md"
                                        value={newData.email}
                                        onChange={e => setNewData({ ...newData, email: e.target.value })}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 pt-4 border-t">
                            <button
                                onClick={() => setView('search')}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Volver
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--primary)' }}
                            >
                                {creating ? (
                                    <span>Guardando...</span>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Guardar Cliente
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
