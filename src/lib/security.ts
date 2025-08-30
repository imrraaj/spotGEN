import { cookies } from "next/headers";

export interface SecureCookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    path?: string;
    maxAge?: number;
}

export function getSecureCookieOptions(overrides: Partial<SecureCookieOptions> = {}): SecureCookieOptions {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        ...overrides,
    };
}

export function generateSecureState(): string {
    // can not use crypto module on edge. create a manual radom string
    const hexstring = "0123456789ABCDEF";
    let state = "";
    for (let i = 0; i < 16; i++) {
        state += hexstring[Math.floor(Math.random() * hexstring.length)];
    }
    return state;
}

export async function validateState(providedState: string): Promise<boolean> {
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;

    if (!storedState || !providedState) {
        return false;
    }
    cookieStore.delete("oauth_state");
    return storedState === providedState;
}

export async function setStateToken(state: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("oauth_state", state, {
        ...getSecureCookieOptions(),
        maxAge: 60 * 10, // 10 minutes
    });
}

export interface TokenData {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type?: string;
}

export function isTokenExpired(tokenData: { expires_at?: number }): boolean {
    if (!tokenData.expires_at) return false;
    return Date.now() >= tokenData.expires_at;
}

export function calculateTokenExpiry(expiresIn: number): number {
    return Date.now() + (expiresIn * 1000);
}

export function sanitizeError(error: unknown): string {
    if (error instanceof Error) {
        // Only return safe error messages in production
        if (process.env.NODE_ENV === "production") {
            return "Authentication failed. Please try again.";
        }
        return error.message;
    }
    return "An unexpected error occurred.";
}
