import Image from "next/image";
import React, { Dispatch, SetStateAction } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

    return (
        <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
                        <Image
                            src="/logo.png"
                            alt="Spotify Logo"
                            width={32}
                            height={32}
                        />
                        Connect Spotify
                    </DialogTitle>
                    <DialogDescription className="text-base mt-2 mx-auto text-center">
                        Connect your Spotify account to generate personalized
                        playlists
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-6 space-y-2 mx-auto">
                    <Button
                        onClick={handleSpotifyLogin}
                        size="lg"
                        className="w-full cursor-pointer"
                    >
                        Continue with Spotify
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setShowModal(false)}
                        className="w-full cursor-pointer"
                    >
                        Maybe later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
