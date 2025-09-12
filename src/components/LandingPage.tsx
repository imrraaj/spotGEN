"use client";

import { useState } from "react";
import { AuthModal } from "./authModal";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import Image from "next/image";

export default function LandingPage() {
    const [prompt, setPrompt] = useState("Gimme the coolest playlist ever");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        localStorage.setItem("pendingPrompt", prompt);
        setShowLoginModal(true);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <main className="min-w-4xl max-w-4xl mx-auto text-center flex flex-col">
                <Card className="mb-8 px-4 py-2 flex-1">
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-4">
                        <div className="flex items-center justify-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="Spotify Logo"
                                width={32}
                                height={32}
                                className="self-center"
                            />
                            <h1 className="text-4xl font-bold tracking-tight self-center">
                                PlayGEN
                            </h1>
                        </div>
                        <div>
                            <p className="text-lg text-muted-foreground">
                                Create personalized Spotify playlists with AI
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                    <div className="relative mb-6">
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="text-2xl p-4 resize-none border-none"
                            rows={5}
                            placeholder="Describe your mood here..."
                        />
                        <Button
                            type="submit"
                            disabled={!prompt.trim()}
                            className="absolute right-2 bottom-2"
                        >
                            Get Started
                        </Button>
                    </div>
                </form>
            </main>

            <AuthModal
                showModal={showLoginModal}
                setShowModal={setShowLoginModal}
            />
        </div>
    );
}
