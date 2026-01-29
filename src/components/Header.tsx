import { Search, Bell } from 'lucide-react';
import styles from './Header.module.css';

import { getSession } from '@/lib/auth';

// ...

export default async function Header() {
    const session = await getSession();
    const user = session?.user;

    return (
        <header className={styles.header}>
            <div className={styles.searchBar}>
                <Search size={18} className="text-secondary" color="#94a3b8" />
                <input
                    type="text"
                    placeholder="Buscar función, producto o cliente..."
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.rightArea}>
                <div className={styles.branchInfo}>
                    <span className={styles.branchLabel}>Sucursal Actual</span>
                    <span className={styles.branchName}>{process.env.NEXT_PUBLIC_BRANCH_NAME || 'Sucursal Principal'}</span>
                </div>

                <button className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Bell size={20} color="#64748b" />
                </button>

                <div className={styles.userArea}>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>{user?.name || 'Usuario'}</div>
                        <div className={styles.userRole}>{user?.role || 'Personal'}</div>
                    </div>
                    <div className={styles.avatar}>{user?.username?.substring(0, 2).toUpperCase() || 'US'}</div>
                </div>
            </div>
        </header>
    );
}
