"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LandingClientProps {
    isLoggedIn: boolean;
}

export default function LandingClient({ isLoggedIn }: LandingClientProps) {
    const [prompt, setPrompt] = useState("");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        if (isLoggedIn) {
            router.push(`/generate?prompt=${encodeURIComponent(prompt)}`);
        } else {
            setShowLoginModal(true);
        }
    };

    const handleSpotifyLogin = () => {
        localStorage.setItem("pendingPrompt", prompt);
        window.location.href = "/api/auth/spotify";
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-8 py-12">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-16">
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 1024 1024"
                    className="text-white flex-shrink-0"
                    fill="currentColor"
                >
                    <path d="M512 0C229.3 0 0 229.3 0 512s229.3 512 512 512 512-229.3 512-512S794.7 0 512 0zm235.4 738.6c-9.4 15.4-27.6 20.4-40.8 11.2-112.2-68.8-253.4-84.5-419.8-46.3-16.1 3.7-32.2-7.1-36-23.2-3.8-16.1 7.1-32.2 23.2-36 180.6-41.6 328.8-23.7 449.8 53.1 13.2 8.4 17.2 26.9 23.6 41.2zm58.2-129.4c-11.8 19.2-37 25.4-56.4 12.2-128.4-79-324.8-102.2-477.2-55.9-19.2 5.8-39.5-4.8-45.3-24-5.8-19.2 4.8-39.5 24-45.3 174.4-53 390.8-26.4 534.2 63.7 19.4 11.8 25.6 37 20.7 49.3zm5-134.6c-154.1-91.5-408.5-100.1-555.5-55.4-23.1 7-47.6-6.2-54.6-29.3-7-23.1 6.2-47.6 29.3-54.6 168.1-51 450.2-41.1 628.9 63.7 22.1 13 29.4 41.4 16.4 63.6-13 22.1-41.4 29.4-63.6 16.4z"/>
                </svg>
                <h1 className="text-3xl font-semibold text-white tracking-tight">PlayGEN</h1>
            </div>

            {/* Text Input */}
            <div className="w-full max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your ideal playlist..."
                            className="w-full h-40 px-6 py-5 pr-24 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-400 resize-none focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 text-lg leading-relaxed"
                        />
                        <button
                            type="submit"
                            disabled={!prompt.trim()}
                            className="absolute bottom-4 right-4 px-6 py-2.5 bg-white text-black rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 transition-all duration-200"
                        >
                            Generate
                        </button>
                    </div>
                </form>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-semibold text-white">
                                Connect Spotify
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <button
                                onClick={handleSpotifyLogin}
                                className="w-full py-4 px-6 bg-white text-black rounded-xl font-semibold hover:bg-neutral-100 transition-colors duration-200"
                            >
                                Continue with Spotify
                            </button>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="w-full py-3 text-neutral-400 hover:text-white transition-colors duration-200"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
