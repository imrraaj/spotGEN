import { NextRequest, NextResponse } from "next/server";
import {
    calculateTokenExpiry,
    generateSecureState,
    getSecureCookieOptions,
    setStateToken,
} from "@/lib/security";
import { cookies } from "next/headers";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const SPOTIFY_SCOPES =
    "user-read-recently-played user-top-read user-read-private playlist-modify-private playlist-modify-public playlist-read-private";

export async function GET(request: NextRequest) {
    const refreshTokenCookie = request.cookies.get("spotify_refresh_token");
    const refreshToken = refreshTokenCookie?.value;
    if (refreshToken) {
        console.warn("Refreshing Spotify access token");
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

        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (tokenData.access_token) {
                const store = await cookies();
                const tokenExpiresAt = calculateTokenExpiry(
                    tokenData.expires_in,
                );

                store.set("spotify_access_token", tokenData.access_token, {
                    ...getSecureCookieOptions(),
                    maxAge: tokenData.expires_in,
                });

                store.set(
                    "spotify_token_expires_at",
                    tokenExpiresAt.toString(),
                    {
                        ...getSecureCookieOptions(),
                        maxAge: tokenData.expires_in,
                    },
                );
            }
        }
        return NextResponse.redirect(new URL("/", NEXT_PUBLIC_BASE_URL));
    }
    const state = generateSecureState();
    await setStateToken(state);

    const params = new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID!,
        scope: SPOTIFY_SCOPES,
        redirect_uri: SPOTIFY_REDIRECT_URI!,
        state: state,
    });
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    return NextResponse.redirect(spotifyAuthUrl);
}


export async function DELETE() {
    const store = await cookies();
    store.delete("spotify_access_token");
    store.delete("spotify_refresh_token");
    store.delete("spotify_token_expires_at");
    return NextResponse.redirect(new URL("/", NEXT_PUBLIC_BASE_URL));
}
