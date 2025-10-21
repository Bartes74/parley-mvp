import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'pl',
  localePrefix: 'as-needed',
});

export async function middleware(request: NextRequest) {
  // Handle i18n first
  const response = intlMiddleware(request);

  // Then handle Supabase auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.includes('/login') ||
                     pathname.includes('/register') ||
                     pathname.includes('/reset-password') ||
                     pathname.includes('/update-password');

  const isPublicPage = isAuthPage;

  // If user is authenticated and trying to access auth pages, redirect to home
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and trying to access protected pages, redirect to login
  if (!user && !isPublicPage && !pathname.includes('/_next') && !pathname.includes('/api')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/', '/(pl|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};
