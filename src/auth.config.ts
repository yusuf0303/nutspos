import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/pos') || nextUrl.pathname.startsWith('/warehouse');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                if (nextUrl.pathname === '/login') {
                    return Response.redirect(new URL('/pos', nextUrl));
                }
            }
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.branchId = (user as any).branchId;
            }
            return token;
        },
        session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                (session.user as any).role = token.role;
                (session.user as any).branchId = token.branchId;
            }
            return session;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
