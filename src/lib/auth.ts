import { cookies } from "next/headers";

export interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
}

export async function getSpotifyUser(): Promise<SpotifyUser | null> {

    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("spotify_user");
    if (!userCookie) {
        return null;
    }
    try {
        return JSON.parse(userCookie.value);
    } catch (error) {
        console.error("Failed to parse user cookie:", error);
        return null;
    }
}

export async function getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("spotify_access_token");
    const tokenExpiresAt = cookieStore.get("spotify_token_expires_at");
    
    if (!accessToken) return null;
    
    // Check if token is expired
    if (tokenExpiresAt) {
        const expiresAt = parseInt(tokenExpiresAt.value);
        if (Date.now() >= expiresAt) {
            // Token is expired, clear it
            cookieStore.delete("spotify_access_token");
            cookieStore.delete("spotify_token_expires_at");
            return null;
        }
    }
    
    return accessToken.value;
}

export async function logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("spotify_access_token");
    cookieStore.delete("spotify_token_expires_at");
    cookieStore.delete("spotify_refresh_token");
    cookieStore.delete("spotify_user");
    cookieStore.delete("oauth_state");
}
