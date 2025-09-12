"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatMessage } from "./ChatMessage";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Info } from "lucide-react";
import Image from "next/image";

interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
}

interface ChatInterfaceProps {
    user: SpotifyUser;
    initialChatHistory?: ChatMessage[];
    initialActiveTopicId?: string | null;
    initialPendingTracks?: Track[] | null;
    initialPendingPrompt?: string | null;
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
    recommendations: { id: string; name: string; artist: string }[];
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

export default function ChatInterface({
    user,
    initialChatHistory = [],
    initialActiveTopicId = null,
    initialPendingTracks = null,
    initialPendingPrompt = null
}: ChatInterfaceProps) {
    const router = useRouter();
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialChatHistory);
    const [error, setError] = useState<string | null>(null);
    const [activeTopicId] = useState<string | null>(initialActiveTopicId);
    const [pendingTracks, setPendingTracks] = useState<Track[] | null>(initialPendingTracks);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(initialPendingPrompt);

    const saveChatHistory = useCallback(
        async (history: ChatMessage[]) => {
            if (history.length === 0) return;
            try {
                if (activeTopicId) {
                    await axios.put(`/api/topics/${activeTopicId}`, {
                        messages: history,
                    });
                } else {
                    await axios.post("/api/chat", { chatHistory: history });
                }
            } catch (error) {
                console.warn("Failed to save chat history:", error);
            }
        },
        [activeTopicId],
    );

    useEffect(() => {
        const pendingPromptFromStorage = localStorage.getItem("pendingPrompt");
        if (pendingPromptFromStorage) {
            setPrompt(pendingPromptFromStorage);
            localStorage.removeItem("pendingPrompt");
        }
    }, []);

    useEffect(() => {
        if (chatHistory.length > 0 && activeTopicId) {
            saveChatHistory(chatHistory);
        }
    }, [chatHistory, saveChatHistory, activeTopicId]);

    const logout = async () => {
        const res = await axios.delete("/api/auth/spotify");
        if (res.status === 200) {
            window.location.href = "/";
        }
    };

    const generateLLMResponse = async (userPrompt: string): Promise<GenerateResponse> => {
        const { data } = await axios.post("/api/generate", {
            prompt: userPrompt,
        });
        if (!data.success) {
            throw new Error(data.error || "Failed to generate playlist");
        }
        return data as GenerateResponse;
    };

    const generateTracks = async (userPrompt: string) => {
        // Create new topic if we don't have an active one
        let topicId = activeTopicId;
        if (!topicId) {
            try {
                const response = await axios.post("/api/topics", {
                    title: userPrompt.length > 50 ? userPrompt.substring(0, 50) + "..." : userPrompt
                });
                if (response.data.success) {
                    topicId = response.data.topicId;
                    // Navigate to the new topic URL
                    router.push(`/chat/topic/${topicId}`);
                    return; // Exit early, page will reload with new topic
                }
            } catch (error) {
                console.error("Failed to create topic:", error);
            }
        }

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
                content: `Here are ${llmResponse.tracks.length} tracks for your playlist:`,
                llmPrompt: llmResponse.prompt,
                tracks: llmResponse.tracks,
                timestamp: Date.now(),
            };
            setChatHistory((prev) => [...prev, assistantMessage]);
            setPendingTracks(llmResponse.tracks);
            setPendingPrompt(userPrompt);
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

    const saveToSpotify = async () => {
        if (!pendingTracks || !pendingPrompt) return;

        setIsSaving(true);
        try {
            const response = await axios.post("/api/generate", {
                prompt: pendingPrompt,
                savePlaylist: true
            });

            if (response.data.success) {
                const playlistMessageId = Date.now().toString();
                const playlistMessage: ChatMessage = {
                    id: playlistMessageId,
                    type: "assistant",
                    content: `Saved playlist "${response.data.playlist.name}" to your Spotify account!`,
                    playlist: {
                        id: response.data.playlist.id,
                        name: response.data.playlist.name,
                        url: response.data.playlist.external_urls.spotify,
                    },
                    timestamp: Date.now(),
                };
                setChatHistory((prev) => [...prev, playlistMessage]);
                setPendingTracks(null);
                setPendingPrompt(null);
            }
        } catch {
            setError("Failed to save playlist to Spotify");
        } finally {
            setIsSaving(false);
        }
    };

    const generateOther = async () => {
        if (!pendingPrompt) return;
        setIsGenerating(true);
        try {
            await generateTracks(pendingPrompt);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        await generateTracks(prompt.trim());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        handleGenerate();
    };

    let ErrorAlert = null;
    if (error) {
        ErrorAlert = (
            <Alert variant="destructive" className="mb-4 rounded">
                <AlertDescription className="flex items-start justify-center">
                    <div className="self-center">
                        <Info />
                    </div>
                    <p className="flex-1 font-bold md:text-lg self-center">
                        {error}
                    </p>
                    <Button
                        onClick={() => setError(null)}
                        variant="outline"
                        size="sm"
                    >
                        Try Again
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    let LoadingState = null;
    if (isGenerating) {
        LoadingState = (
            <div className="animate-fade-in">
                <div className="flex items-start space-x-4">
                    <Avatar className="flex-shrink-0 mt-1">
                        <AvatarFallback className="text-primary-foreground">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={16}
                                height={16}
                                className="rounded"
                            />
                        </AvatarFallback>
                    </Avatar>
                    <Card className="flex-1 p-4">
                        <CardContent className="p-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating playlist...</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-2rem)]">
            {/* Header */}
            <Card className="mb-4 p-0">
                <CardContent className="flex items-center justify-between p-2 md:p-4">
                    <div className="flex-1 min-w-0 mr-2">
                        <h1 className="text-lg md:text-2xl font-bold tracking-tight break-words">
                            Welcome back, {user.display_name}!
                        </h1>
                    </div>
                    <Button
                        onClick={logout}
                        variant="outline"
                        size="sm"
                    >
                        Logout
                    </Button>
                </CardContent>
            </Card>


            {/* Chat History */}
            <div className="flex-1 overflow-y-auto mb-4">
                <div className="space-y-4 md:space-y-6">
                    {chatHistory.map((message, index) => {
                        // Only show save/generate buttons for the last message with tracks that has pending tracks
                        const isLastTrackMessage = message.tracks &&
                            pendingTracks &&
                            index === chatHistory.length - 1;

                        return (
                            <div key={message.id} className="animate-fade-in">
                                <ChatMessage
                                    message={message}
                                    onSaveToSpotify={isLastTrackMessage ? saveToSpotify : undefined}
                                    onGenerateOther={isLastTrackMessage ? generateOther : undefined}
                                    isSaving={isSaving}
                                    isGenerating={isGenerating}
                                />
                            </div>
                        );
                    })}
                </div>
                {isGenerating && LoadingState}
            </div>
            {error && ErrorAlert}


            {/* Fixed Input at Bottom */}
            <div className="flex-shrink-0 sticky bottom-0 py-4">
                <form onSubmit={handleSubmit}>
                    <Card className="p-0">
                        <CardContent className="p-4">
                            <div className="flex items-end gap-2">
                                <Textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="flex-1 resize-none"
                                    disabled={isGenerating}
                                    placeholder="Describe your perfect playlist..."
                                    rows={1}
                                />
                                <Button
                                    type="submit"
                                    disabled={!prompt.trim() || isGenerating}
                                    size="sm"
                                >
                                    {isGenerating ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            <span className="hidden sm:inline">Generating...</span>
                                        </div>
                                    ) : (
                                        "Generate"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
}
