import Image from "next/image";
import React, { Dispatch, SetStateAction } from "react";

export function AuthModal({
    showModal,
    setShowModal,
}: {
    showModal: boolean;
    setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
    const handleSpotifyLogin = () => {
        window.location.href = "/api/auth/spotify";
    };

    if (!showModal) return null;
    return (
        <div className="fixed inset-0 bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-neutral-900 border-[1px] border-neutral-700 rounded-md p-8 max-w-md w-full mx-4">
                <div className="text-center mb-8">
                    <div className="flex gap-2 mb-4 items-center justify-center">
                        <Image
                            src="/logo.svg"
                            alt="Spotify Logo"
                            width={32}
                            height={32}
                            className="text-neutral-300"
                        />
                        <h2 className="text-2xl font-black text-neutral-300">
                            Connect Spotify
                        </h2>
                    </div>
                    <p className="text-neutral-500 mt-4 text-sm font-semibold">
                        Connect your Spotify account to generate personalized playlists
                    </p>
                </div>
                <div className="">
                    <button
                        onClick={handleSpotifyLogin}
                        className="w-full py-2 cursor-pointer bg-neutral-300 text-black rounded-sm font-black"
                    >
                        Continue with Spotify
                    </button>
                    <button
                        onClick={() => setShowModal(false)}
                        className="w-full py-2 font-semibold text-neutral-400 mt-4 cursor-pointer"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
