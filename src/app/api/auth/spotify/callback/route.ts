import { NextResponse } from "next/server";
import { validateState, getSecureCookieOptions, calculateTokenExpiry, sanitizeError } from "@/lib/security";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state");

    if (error) {
        return NextResponse.redirect(
            new URL("/?error=access_denied", request.url),
        );
    }

    if (!code) {
        return NextResponse.redirect(new URL("/?error=no_code", request.url));
    }

    // Validate CSRF state
    if (!state || !(await validateState(state))) {
        return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
    }
    try {
        const tokenResponse = await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: SPOTIFY_REDIRECT_URI!,
                }),
            },
        );

        if (!tokenResponse.ok) {
            console.error("Token exchange failed:", tokenResponse.status);
            throw new Error("Failed to exchange code for token");
        }

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            throw new Error("No access token received");
        }
        const userResponse = await fetch("https://api.spotify.com/v1/me", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            throw new Error("Failed to fetch user profile");
        }

        const userData = await userResponse.json();
        // Get the correct redirect URL (convert localhost to 127.0.0.1 if needed)
        const requestUrl = new URL(request.url);
        const baseUrl = requestUrl.origin.replace("localhost", "127.0.0.1");
        const redirectUrl = new URL("/", baseUrl);

        const response = NextResponse.redirect(redirectUrl);

        // Calculate token expiry
        const tokenExpiresAt = calculateTokenExpiry(tokenData.expires_in);

        // Set secure cookies
        response.cookies.set("spotify_access_token", tokenData.access_token, {
            ...getSecureCookieOptions(),
            maxAge: tokenData.expires_in,
        });

        response.cookies.set("spotify_token_expires_at", tokenExpiresAt.toString(), {
            ...getSecureCookieOptions(),
            maxAge: tokenData.expires_in,
        });

        response.cookies.set(
            "spotify_refresh_token",
            tokenData.refresh_token || "",
            {
                ...getSecureCookieOptions(),
                maxAge: 60 * 60 * 24 * 30, // 30 days
            },
        );

        response.cookies.set(
            "spotify_user",
            JSON.stringify({
                id: userData.id,
                display_name: userData.display_name,
                email: userData.email,
            }),
            {
                ...getSecureCookieOptions({ httpOnly: false }), // User data can be client accessible
                maxAge: 60 * 60 * 24 * 30, // 30 days
            }
        );
        return response;
    } catch (error) {
        console.error("Spotify OAuth error:", sanitizeError(error));
        return NextResponse.redirect(
            new URL("/?error=oauth_failed", request.url),
        );
    }
}
