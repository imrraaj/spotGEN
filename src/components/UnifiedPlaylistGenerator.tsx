"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthModal } from "./authModal";
import axios from "axios";
interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
}

interface UnifiedPlaylistGeneratorProps {
    user?: SpotifyUser | null;
}

interface Track {
    id: string;
    name: string;
    artist: string;
    album?: string;
    preview_url?: string;
}

interface GenerateResponse {
    success: boolean;
    prompt: string;
    recommendations: { id: string; name: string, artist: string }[];
    tracks: Track[];
    playlist: {
        id: string;
        external_urls: {
            spotify: string;
        };
        name: string;
    };
    error?: string;
}
interface PlaylistData {
    id: string;
    name: string;
    url: string;
}

interface ChatMessage {
    id: string;
    type: "user" | "assistant";
    content: string;
    llmPrompt?: string;
    tracks?: Track[];
    playlist?: PlaylistData;
    timestamp: number;
}

export default function UnifiedPlaylistGenerator({
    user,
}: UnifiedPlaylistGeneratorProps) {
    const [prompt, setPrompt] = useState("Gimme the coolest playlist ever");
    const [isGenerating, setIsGenerating] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLoggedIn = !!user;

    const loadChatHistory = useCallback(async () => {
        if (!isLoggedIn) return;
        try {
            const response = await axios.get('/api/chat');
            if (response.data.success && response.data.chatHistory.length > 0) {
                setChatHistory(response.data.chatHistory);
            }
        } catch (error) {
            console.warn('Failed to load chat history:', error);
        }
    },[isLoggedIn]);

    const saveChatHistory = useCallback(async (history: ChatMessage[]) => {
        if (!isLoggedIn || history.length === 0) return;
        try {
            await axios.post('/api/chat', { chatHistory: history });
        } catch (error) {
            console.warn('Failed to save chat history:', error);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn) {
            const pendingPrompt = localStorage.getItem("pendingPrompt");
            if (pendingPrompt) {
                setPrompt(pendingPrompt);
                localStorage.removeItem("pendingPrompt");
            }
            loadChatHistory();
        }
    }, [isLoggedIn, loadChatHistory]);

    useEffect(() => {
        if (chatHistory.length > 0) {
            saveChatHistory(chatHistory);
        }
    }, [chatHistory, isLoggedIn, saveChatHistory]);

    const logout = async () => {
        const res = await axios.delete("/api/auth/spotify");
        if (res.status === 200) {
            window.location.href = "/";
        }
    };

    const generateLLMResponse = async (userPrompt: string): Promise<GenerateResponse> => {
        const { data } = await axios.post("/api/generate", { prompt: userPrompt });
        if (!data.success) {
            throw new Error(data.error || "Failed to generate playlist");
        }
        return data as GenerateResponse;
    };


    const generatePlaylist = async (userPrompt: string) => {
        const userMessageId = Date.now().toString();
        const userMessage: ChatMessage = {
            id: userMessageId,
            type: "user",
            content: userPrompt,
            timestamp: Date.now(),
        };
        setChatHistory((prev) => [...prev, userMessage]);

        try {
            setError(null);
            const llmResponse = await generateLLMResponse(userPrompt);
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessage: ChatMessage = {
                id: assistantMessageId,
                type: "assistant",
                content: `Created playlist "${llmResponse.playlist.name}" with ${llmResponse.tracks.length} tracks`,
                llmPrompt: llmResponse.prompt,
                tracks: llmResponse.tracks,
                playlist: {
                    id: llmResponse.playlist.id,
                    name: llmResponse.playlist.name,
                    url: llmResponse.playlist.external_urls.spotify,
                },
                timestamp: Date.now(),
            };
            setChatHistory((prev) => [...prev, assistantMessage]);
            setPrompt("");
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred";
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        await generatePlaylist(prompt.trim());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        if (isLoggedIn) {
            handleGenerate();
        } else {
            setShowLoginModal(true);
        }
    };
    const showPromptInput = true;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <div className="flex-1 overflow-auto">
                <main className={`max-w-4xl mx-auto px-6 ${isLoggedIn ? "py-8" : "py-12 flex flex-col items-center justify-center min-h-full"}`}>
                <div className="flex items-center gap-4 mb-16">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 1024 1024"
                        className="text-white flex-shrink-0"
                        fill="currentColor"
                    >
                        <path d="M512 0C229.3 0 0 229.3 0 512s229.3 512 512 512 512-229.3 512-512S794.7 0 512 0zm235.4 738.6c-9.4 15.4-27.6 20.4-40.8 11.2-112.2-68.8-253.4-84.5-419.8-46.3-16.1 3.7-32.2-7.1-36-23.2-3.8-16.1 7.1-32.2 23.2-36 180.6-41.6 328.8-23.7 449.8 53.1 13.2 8.4 17.2 26.9 23.6 41.2zm58.2-129.4c-11.8 19.2-37 25.4-56.4 12.2-128.4-79-324.8-102.2-477.2-55.9-19.2 5.8-39.5-4.8-45.3-24-5.8-19.2 4.8-39.5 24-45.3 174.4-53 390.8-26.4 534.2 63.7 19.4 11.8 25.6 37 20.7 49.3zm5-134.6c-154.1-91.5-408.5-100.1-555.5-55.4-23.1 7-47.6-6.2-54.6-29.3-7-23.1 6.2-47.6 29.3-54.6 168.1-51 450.2-41.1 628.9 63.7 22.1 13 29.4 41.4 16.4 63.6-13 22.1-41.4 29.4-63.6 16.4z" />
                    </svg>
                    <h1 className="text-3xl font-semibold text-white tracking-tight">
                        {isLoggedIn
                            ? `Welcome back, ${user.display_name}!`
                            : "PlayGEN"}
                    </h1>

                    {isLoggedIn && (
                        <button
                            onClick={logout}
                            className="ml-auto cursor-pointer px-4 py-2 bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 transition-all duration-200"
                        >
                            Logout
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-8 animate-fade-in">
                        <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1 bg-neutral-900 rounded-2xl p-6 border border-neutral-700">
                                <p className="text-neutral-300">{error}</p>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setError(null)}
                                        className="px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-neutral-200 transition-all duration-200"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat History */}
                <div className="space-y-6 mb-8">
                    {chatHistory.map((message) => (
                        <div key={message.id} className="animate-fade-in">
                            {message.type === "user" ? (
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg
                                            className="w-4 h-4 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1 bg-neutral-900 rounded-2xl p-6 border border-neutral-700">
                                        <p className="text-white">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start space-x-4">
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg
                                            className="w-4 h-4 text-black"
                                            viewBox="0 0 1024 1024"
                                            fill="currentColor"
                                        >
                                            <path d="M512 0C229.3 0 0 229.3 0 512s229.3 512 512 512 512-229.3 512-512S794.7 0 512 0zm235.4 738.6c-9.4 15.4-27.6 20.4-40.8 11.2-112.2-68.8-253.4-84.5-419.8-46.3-16.1 3.7-32.2-7.1-36-23.2-3.8-16.1 7.1-32.2 23.2-36 180.6-41.6 328.8-23.7 449.8 53.1 13.2 8.4 17.2 26.9 23.6 41.2zm58.2-129.4c-11.8 19.2-37 25.4-56.4 12.2-128.4-79-324.8-102.2-477.2-55.9-19.2 5.8-39.5-4.8-45.3-24-5.8-19.2 4.8-39.5 24-45.3 174.4-53 390.8-26.4 534.2 63.7 19.4 11.8 25.6 37 20.7 49.3zm5-134.6c-154.1-91.5-408.5-100.1-555.5-55.4-23.1 7-47.6-6.2-54.6-29.3-7-23.1 6.2-47.6 29.3-54.6 168.1-51 450.2-41.1 628.9 63.7 22.1 13 29.4 41.4 16.4 63.6-13 22.1-41.4 29.4-63.6 16.4z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-700">
                                            <p className="text-white mb-4">
                                                {message.content}
                                            </p>

                                            {message.llmPrompt && (
                                                <div className="mt-4 p-4 bg-neutral-800 rounded-xl border border-neutral-600">
                                                    <h4 className="text-sm font-medium text-neutral-400 mb-2">LLM Prompt:</h4>
                                                    <p className="text-white text-sm font-mono whitespace-pre-wrap break-words">
                                                        {message.llmPrompt}
                                                    </p>
                                                </div>
                                            )}

                                            {message.playlist && (
                                                <div className="mt-4">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <span className="text-sm text-neutral-400">
                                                            Spotify Playlist:
                                                        </span>
                                                        <a
                                                            href={message.playlist.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-white hover:text-neutral-300 transition-colors"
                                                        >
                                                            Open in Spotify →
                                                        </a>
                                                    </div>
                                                    <div className="bg-neutral-900 rounded-xl overflow-hidden">
                                                        <iframe
                                                            src={`https://open.spotify.com/embed/playlist/${message.playlist.id}?utm_source=generator&theme=0`}
                                                            width="100%"
                                                            height="380"
                                                            frameBorder="0"
                                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                            loading="lazy"
                                                            className="rounded-xl"
                                                        ></iframe>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Loading State */}
                {isGenerating && (
                    <div className="mb-8 animate-fade-in">
                        <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg
                                    className="w-4 h-4 text-black"
                                    viewBox="0 0 1024 1024"
                                    fill="currentColor"
                                >
                                    <path d="M512 0C229.3 0 0 229.3 0 512s229.3 512 512 512 512-229.3 512-512S794.7 0 512 0zm235.4 738.6c-9.4 15.4-27.6 20.4-40.8 11.2-112.2-68.8-253.4-84.5-419.8-46.3-16.1 3.7-32.2-7.1-36-23.2-3.8-16.1 7.1-32.2 23.2-36 180.6-41.6 328.8-23.7 449.8 53.1 13.2 8.4 17.2 26.9 23.6 41.2zm58.2-129.4c-11.8 19.2-37 25.4-56.4 12.2-128.4-79-324.8-102.2-477.2-55.9-19.2 5.8-39.5-4.8-45.3-24-5.8-19.2 4.8-39.5 24-45.3 174.4-53 390.8-26.4 534.2 63.7 19.4 11.8 25.6 37 20.7 49.3zm5-134.6c-154.1-91.5-408.5-100.1-555.5-55.4-23.1 7-47.6-6.2-54.6-29.3-7-23.1 6.2-47.6 29.3-54.6 168.1-51 450.2-41.1 628.9 63.7 22.1 13 29.4 41.4 16.4 63.6-13 22.1-41.4 29.4-63.6 16.4z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-700">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-white">
                                            Generating LLM prompt...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                </main>
            </div>

            {/* Fixed Input at Bottom */}
            {showPromptInput && (
                <div className="sticky bottom-0 bg-black border-t border-neutral-800 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-neutral-400 text-sm">
                                {chatHistory.length > 0 && `${Math.floor(chatHistory.length/2)} conversations saved`}
                            </span>
                            {chatHistory.length > 0 && (
                                <button
                                    onClick={() => {
                                        setChatHistory([]);
                                        saveChatHistory([]);
                                    }}
                                    className="text-neutral-400 hover:text-white text-sm transition-colors"
                                >
                                    Clear History
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={isLoggedIn ? "Describe your perfect playlist..." : "Describe your ideal playlist..."}
                                    className="w-full px-6 py-4 pr-24 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-400 resize-none focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 text-lg leading-relaxed min-h-[60px] max-h-[120px]"
                                    rows={2}
                                    disabled={isGenerating}
                                    autoFocus={isLoggedIn}
                                />
                                <button
                                    type="submit"
                                    disabled={!prompt.trim() || isGenerating}
                                    className="absolute bottom-3 right-3 px-4 py-2 bg-white text-black rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 transition-all duration-200"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            <span>Generating...</span>
                                        </div>
                                    ) : (
                                        "Generate"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AuthModal
                showModal={showLoginModal}
                setShowModal={setShowLoginModal}
            />
        </div>
    );
}
