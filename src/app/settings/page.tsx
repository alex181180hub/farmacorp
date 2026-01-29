'use client';

import { useState, useEffect } from 'react';
import { Users, Settings, Save, Trash2, Plus, Edit2, X, Check } from 'lucide-react';
import styles from './settings.module.css';
import { getUsers, createUser, deleteUser, updateUser, getSystemSettings, updateSystemSetting } from '@/actions/settings-actions';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<any[]>([]);

    // System Config State
    const [configForm, setConfigForm] = useState({
        companyName: 'Farmacorp - Sucursal',
        nit: '1020304050'
    });

    // User Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [userForm, setUserForm] = useState({
        name: '',
        username: '',
        role: 'CAJERO',
        password: ''
    });

    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        } else if (activeTab === 'general') {
            getSystemSettings().then(cfg => {
                if (cfg) {
                    setConfigForm({
                        companyName: cfg.COMPANY_NAME || 'Farmacorp',
                        nit: cfg.COMPANY_NIT || '0'
                    });
                }
            });
        }
    }, [activeTab]);

    const loadUsers = () => getUsers().then(setUsers);

    const resetForm = () => {
        setUserForm({ name: '', username: '', role: 'CAJERO', password: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (user: any) => {
        setUserForm({
            name: user.name,
            username: user.username,
            role: user.role,
            password: ''
        });
        setIsEditing(true);
        setEditingId(user.id);
    };

    const handleSubmitUser = async (e: React.FormEvent) => {
        e.preventDefault();
        let res;
        if (isEditing && editingId) {
            res = await updateUser(editingId, userForm);
        } else {
            if (!userForm.password) {
                alert('La contraseña es obligatoria para nuevos usuarios');
                return;
            }
            res = await createUser(userForm);
        }

        if (res.success) {
            resetForm();
            loadUsers();
        } else {
            alert(res.error);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (confirm('¿Eliminar usuario?')) {
            await deleteUser(id);
            loadUsers();
        }
    };

    const handleSaveConfig = async () => {
        await updateSystemSetting('COMPANY_NAME', configForm.companyName);
        await updateSystemSetting('COMPANY_NIT', configForm.nit);
        alert('Configuración guardada.');
    };

    return (
        <div className={styles.container}>
            <h1 className="text-2xl font-bold text-primary mb-6">Configuración del Sistema</h1>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} className="inline mr-2" /> Usuarios y Roles
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'general' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    <Settings size={18} className="inline mr-2" /> General
                </button>
            </div>

            {activeTab === 'users' && (
                <div className={styles.section}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={styles.sectionTitle}>Gestión de Personal</h2>
                    </div>

                    <form onSubmit={handleSubmitUser} className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-secondary uppercase">
                                {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                            </h3>
                            {isEditing && (
                                <button type="button" onClick={resetForm} className="text-xs text-slate-500 hover:text-red-500 flex items-center">
                                    <X size={14} className="mr-1" /> Cancelar Edición
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="w-full">
                                <label className="text-xs font-semibold block mb-1">Nombre Completo</label>
                                <input
                                    className="input w-full"
                                    required
                                    value={userForm.name}
                                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                                    placeholder="Ej: Juan Perez"
                                />
                            </div>
                            <div className="w-full">
                                <label className="text-xs font-semibold block mb-1">Usuario (Login)</label>
                                <input
                                    className="input w-full"
                                    required
                                    value={userForm.username}
                                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                                    placeholder="Ej: jperez"
                                />
                            </div>
                            <div className="w-full">
                                <label className="text-xs font-semibold block mb-1">
                                    {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                                </label>
                                <input
                                    type="password"
                                    className="input w-full"
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder={isEditing ? "Dejar vacío para mantener" : "••••••"}
                                />
                            </div>
                            <div className="w-full">
                                <label className="text-xs font-semibold block mb-1">Rol</label>
                                <select
                                    className="input w-full"
                                    value={userForm.role}
                                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                >
                                    <option value="CAJERO">Cajero</option>
                                    <option value="SUPERVISOR">Supervisor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button type="submit" className="btn btn-primary text-sm px-6 py-2">
                                {isEditing ? <Check size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                                {isEditing ? 'Guardar Cambios' : 'Agregar Usuario'}
                            </button>
                        </div>
                    </form>

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-sm text-secondary font-semibold">
                                    <th className="p-4 border-b">ID</th>
                                    <th className="p-4 border-b">Usuario</th>
                                    <th className="p-4 border-b">Nombre</th>
                                    <th className="p-4 border-b">Rol</th>
                                    <th className="p-4 border-b text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500 text-sm">#{u.id}</td>
                                        <td className="p-4 font-medium text-slate-800">{u.username}</td>
                                        <td className="p-4 text-slate-600">{u.name}</td>
                                        <td className="p-4">
                                            <span className={`badge ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(u)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No hay usuarios registrados.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'general' && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Datos de la Farmacia</h2>
                    <div className={styles.configRow}>
                        <div>
                            <div className={styles.configLabel}>Nombre Comercial</div>
                            <div className={styles.configDesc}>Aparecerá en reportes y tickets</div>
                        </div>
                        <input
                            className="input w-64"
                            value={configForm.companyName}
                            onChange={e => setConfigForm({ ...configForm, companyName: e.target.value })}
                        />
                    </div>
                    <div className={styles.configRow}>
                        <div>
                            <div className={styles.configLabel}>NIT Emisor</div>
                            <div className={styles.configDesc}>Número de Identificación Tributaria</div>
                        </div>
                        <input
                            className="input w-64"
                            value={configForm.nit}
                            onChange={e => setConfigForm({ ...configForm, nit: e.target.value })}
                        />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button className="btn btn-primary" onClick={handleSaveConfig}>
                            <Save size={18} className="mr-2" /> Guardar Cambios
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
