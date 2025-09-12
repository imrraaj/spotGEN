"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "./LandingPage";

interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
}

interface UnifiedPlaylistGeneratorProps {
    user?: SpotifyUser | null;
}

export default function UnifiedPlaylistGenerator({
    user,
}: UnifiedPlaylistGeneratorProps) {
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/chat');
        }
    }, [user, router]);

    // Show landing page for non-authenticated users
    return <LandingPage />;
}
