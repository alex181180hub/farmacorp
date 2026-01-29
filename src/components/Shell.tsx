'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function Shell({ children, header, userRole }: { children: React.ReactNode, header: React.ReactNode, userRole: string }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div id="shell-root">
            <Sidebar userRole={userRole} />
            {header}
            <main style={{ marginLeft: 'var(--sidebar-width)' }}>{children}</main>
        </div>
    );
}
