'use client';

import { useActionState } from 'react';
import { loginAction } from '@/actions/auth-actions';
import styles from './login.module.css';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const [state, action, isPending] = useActionState(loginAction, undefined);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>FARMACORP</h1>
                    <p>Sistema POS Bolivia</p>
                </div>

                <form action={action} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Usuario</label>
                        <input type="text" name="username" id="username" required placeholder="admin" autoComplete="username" />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Contraseña</label>
                        <input type="password" name="password" id="password" required placeholder="••••••" autoComplete="current-password" />
                    </div>

                    {state?.error && <p className={styles.error}>{state.error}</p>}

                    <button type="submit" className={styles.button} disabled={isPending}>
                        {isPending ? 'Ingresando...' : 'Iniciar Sesión'}
                        {!isPending && <LogIn size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
