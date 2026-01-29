'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Mail, Phone, FileText } from 'lucide-react';
import styles from './customers.module.css';
import { getCustomers, createCustomer, deleteCustomer } from '@/actions/customer-actions';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // New Customer Form State
    const [formData, setFormData] = useState({
        nit: '',
        razonSocial: '',
        email: '',
        phone: ''
    });

    const loadCustomers = async () => {
        setLoading(true);
        const data = await getCustomers(query);
        setCustomers(data);
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCustomers();
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nit || !formData.razonSocial) return;

        const res = await createCustomer(formData);
        if (res.success) {
            setShowModal(false);
            setFormData({ nit: '', razonSocial: '', email: '', phone: '' });
            loadCustomers();
        } else {
            alert(res.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este cliente?')) {
            await deleteCustomer(id);
            loadCustomers();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Cartera de Clientes</h1>
                    <p className="text-secondary">Gestión de clientes para facturación computarizada</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} className="mr-2" /> Nuevo Cliente
                </button>
            </div>

            <div className={styles.card}>
                <div className={styles.searchBar}>
                    <div className="flex-1 flex items-center bg-white border rounded-md px-3">
                        <Search size={18} className="text-secondary mr-2" />
                        <input
                            className="w-full py-2 outline-none"
                            placeholder="Buscar por NIT o Razón Social..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>NIT / CI</th>
                                <th>Razón Social</th>
                                <th>Contacto</th>
                                <th>Fecha Registro</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8">Cargando...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8">No se encontraron clientes.</td></tr>
                            ) : (
                                customers.map((c) => (
                                    <tr key={c.id}>
                                        <td className="font-semibold text-primary">{c.nit}</td>
                                        <td className="font-medium">{c.razonSocial}</td>
                                        <td>
                                            <div className="flex flex-col gap-1 text-sm text-secondary">
                                                {c.email && <div className="flex items-center gap-1"><Mail size={12} /> {c.email}</div>}
                                                {c.phone && <div className="flex items-center gap-1"><Phone size={12} /> {c.phone}</div>}
                                                {!c.email && !c.phone && <span>--</span>}
                                            </div>
                                        </td>
                                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 text-secondary hover:text-red-500" onClick={() => handleDelete(c.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className={styles.formModal}>
                    <form className={styles.formCard} onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold mb-6">Registrar Cliente</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>NIT / Carnet de Identidad</label>
                            <input
                                className="input"
                                required
                                value={formData.nit}
                                onChange={e => setFormData({ ...formData, nit: e.target.value })}
                                placeholder="Ej. 123456701"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Razón Social / Nombre</label>
                            <input
                                className="input"
                                required
                                value={formData.razonSocial}
                                onChange={e => setFormData({ ...formData, razonSocial: e.target.value })}
                                placeholder="Ej. Juan Pérez"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Teléfono</label>
                                <input
                                    className="input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Guardar Cliente</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
