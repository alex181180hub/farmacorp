'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, Settings, LogOut, Truck, Lock } from 'lucide-react';
import styles from './Sidebar.module.css';
import { logoutAction } from '@/actions/auth-actions';
import { getSystemSettings } from '@/actions/settings-actions';

const MENU_ITEMS = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Punto de Venta', icon: ShoppingCart, href: '/pos' },
    { name: 'Caja / Turno', icon: Lock, href: '/shift' },
    { name: 'Compras', icon: Truck, href: '/purchases' },
    { name: 'Inventario', icon: Package, href: '/inventory' },
    { name: 'Clientes', icon: Users, href: '/customers' },
    { name: 'Reportes', icon: FileText, href: '/reports' },
    { name: 'Configuración', icon: Settings, href: '/settings' },
];

export default function Sidebar({ userRole }: { userRole?: string }) {
    const pathname = usePathname();
    const [companyName, setCompanyName] = useState('FARMACORP');

    useEffect(() => {
        getSystemSettings().then(settings => {
            if (settings && settings.COMPANY_NAME) {
                // Remove existing "Sucursal" suffix if present to keep it short for sidebar, or just use full
                // Let's try to just render what user saved
                setCompanyName(settings.COMPANY_NAME);
            }
        });
    }, []);

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoArea}>
                <div className={styles.logoText}>{companyName}<span className={styles.dot}>.</span></div>
                <div className={styles.subText}>Sistema POS Bolivia</div>
            </div>

            <nav className={styles.nav}>
                {MENU_ITEMS.map((item) => {
                    const role = (userRole || '').toUpperCase();
                    // Allow settings for ADMIN, SUPERVISOR, or if role contains ADMIN/ROOT
                    if (item.href === '/settings' && role !== 'ADMIN' && role !== 'SUPERVISOR' && role !== 'ROOT') {
                        // Fallback: If we are in dev/demo and strictly want to show it, we might skip this. 
                        // But for now, fixing casing should resolve the 'Admin' vs 'ADMIN' issue.
                        return null;
                    }

                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>



            <div className={styles.footer}>
                <button className={styles.logoutBtn} onClick={() => logoutAction()}>
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
