import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Public paths
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isNextInternal = request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname === '/favicon.ico';

    if (isNextInternal) {
        return NextResponse.next();
    }

    if (isLoginPage) {
        if (session) {
            const payload = await decrypt(session);
            if (payload) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
        return NextResponse.next();
    }

    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await decrypt(session);
    if (!payload) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
    }

    // Role-based Access Control
    if (request.nextUrl.pathname.startsWith('/settings')) {
        const userRole = (payload.user.role || '').toUpperCase();
        if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR' && userRole !== 'ROOT') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
