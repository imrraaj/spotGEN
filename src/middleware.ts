import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTokenExpired, getSecureCookieOptions, calculateTokenExpiry } from "@/lib/security";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export async function middleware(request: NextRequest) {
    const nonLoggedinResponse = NextResponse.redirect(
        new URL("/", request.url),
    );
    const requireAuth = ["/generate"];
    if (requireAuth.some((path) => request.nextUrl.pathname.startsWith(path))) {
        const accessTokenCookie = request.cookies.get("spotify_access_token");
        const refreshTokenCookie = request.cookies.get("spotify_refresh_token");
        const tokenExpiresAtCookie = request.cookies.get("spotify_token_expires_at");
        const accessTokenHeader = request.headers.get("Authorization");

        const accessToken =
            accessTokenCookie?.value ||
            accessTokenHeader?.replace("Bearer ", "");
        const refreshToken = refreshTokenCookie?.value;
        const tokenExpiresAt = tokenExpiresAtCookie?.value ? parseInt(tokenExpiresAtCookie.value) : null;

        if (!accessToken && !refreshToken) return nonLoggedinResponse;
        if (accessToken && tokenExpiresAt && isTokenExpired({ expires_at: tokenExpiresAt })) {
            const response = NextResponse.next();
            response.cookies.delete("spotify_access_token");
            response.cookies.delete("spotify_token_expires_at");
        }

        // we have a refresh token, but no access token (or expired) - refresh the token
        if ((!accessToken || (tokenExpiresAt && isTokenExpired({ expires_at: tokenExpiresAt }))) && refreshToken) {
            const tokenResponse = await fetch(
                "https://accounts.spotify.com/api/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
                    },
                    body: new URLSearchParams({
                        grant_type: "refresh_token",
                        refresh_token: refreshToken,
                    }),
                },
            );

            if (!tokenResponse.ok) {
                console.error("Token refresh failed:", tokenResponse.status);
                return nonLoggedinResponse;
            }
            const tokenData = await tokenResponse.json();
            if (!tokenData.access_token) {
                console.error("No access token received");
                return nonLoggedinResponse;
            }
            const store = await cookies();
            const tokenExpiresAt = calculateTokenExpiry(tokenData.expires_in);

            store.set("spotify_access_token", tokenData.access_token, {
                ...getSecureCookieOptions(),
                maxAge: tokenData.expires_in,
            });

            store.set("spotify_token_expires_at", tokenExpiresAt.toString(), {
                ...getSecureCookieOptions(),
                maxAge: tokenData.expires_in,
            });
        } else {
            const verify = await fetch("https://api.spotify.com/v1/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!verify.ok) return nonLoggedinResponse;
        }
    }

    // Add security headers to all responses
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // CSP header - adjust based on your needs
    const cspHeader = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' blob: data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "frame-src 'self' https://open.spotify.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "connect-src 'self' https://accounts.spotify.com https://api.spotify.com https://openrouter.ai",
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspHeader);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
