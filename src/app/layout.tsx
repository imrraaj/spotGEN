import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Spotify PlayGEN",
    description: "Generate Spotify Playlists using AI",
};
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
