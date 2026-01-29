'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

export async function loginAction(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: 'Por favor ingrese usuario y contraseña' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            console.log(`User not found: ${username}`);
            return { error: 'Credenciales inválidas' };
        }

        const isValid = bcrypt.compareSync(password, user.password);
        console.log(`Login attempt for ${username}: isValid=${isValid}`);

        if (!isValid) {
            return { error: 'Credenciales inválidas' };
        }

        // Create session
        const sessionPayload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        };
        const sessionToken = await encrypt(sessionPayload);

        (await cookies()).set(SESSION_COOKIE_NAME, sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
            path: '/',
            sameSite: 'lax',
        });
    } catch (e: any) {
        console.error('CRITICAL LOGIN ERROR:', e);
        console.error('Error stack:', e.stack);
        if (e.code === 'P2002') console.error('Prisma Constraint Error');
        if (e.code === 'P2025') console.error('Prisma Not Found Error');

        // Return the actual error message for debugging purposes (temporary)
        return { error: `Error técnico: ${e.message}` };
    }

    redirect('/');
}

export async function logoutAction() {
    (await cookies()).delete(SESSION_COOKIE_NAME);
    redirect('/login');
}
