"use client";

import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { TrackList } from "./TrackList";
import { User } from "lucide-react";
import Image from "next/image";

interface Track {
    id: string;
    name: string;
    artist: string;
    album?: string;
    preview_url?: string;
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

interface ChatMessageProps {
    message: ChatMessage;
    onSaveToSpotify?: () => void;
    onGenerateOther?: () => void;
    isSaving?: boolean;
    isGenerating?: boolean;
}

export function ChatMessage({
    message,
    onSaveToSpotify,
    onGenerateOther,
    isSaving = false,
    isGenerating = false
}: ChatMessageProps) {
    if (message.type === "user") {
        return (
            <div className="md:flex space-y-4 items-start space-x-4">
                <Avatar className="flex-shrink-0 mt-1">
                    <AvatarFallback>
                        <User className="w-4 h-4" />
                    </AvatarFallback>
                </Avatar>
                <Card className="flex-1 p-4">
                    <CardContent className="p-0">
                        <p className="whitespace-pre-wrap">
                            <span className="text-muted-foreground text-sm">You said:</span><br />
                            {message.content}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="md:flex space-y-4 items-start space-x-4">
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
            <Card className="flex-1 p-2 md:p-4">
                <CardContent className="p-0">
                    <span className="text-muted-foreground text-sm">Agent said:</span><br />
                    <p className="mb-4">{message.content}</p>
                    {/*{message.llmPrompt && (
                        <Card className="mt-4 px-2 md:p-0">
                            <CardHeader className="p-0 md:p-4">
                                <h4 className="text-sm font-medium">AI Prompt:</h4>
                            </CardHeader>
                            <CardContent className="p-0 md:p-4">
                                <p className="text-sm font-mono whitespace-pre-wrap break-words bg-muted p-3 rounded">
                                    {message.llmPrompt}
                                </p>
                            </CardContent>
                        </Card>
                    )}*/}

                    {message.tracks && message.tracks.length > 0 && (
                        <TrackList
                            tracks={message.tracks}
                            onSaveToSpotify={onSaveToSpotify || (() => {})}
                            onGenerateOther={onGenerateOther || (() => {})}
                            isSaving={isSaving}
                            isGenerating={isGenerating}
                        />
                    )}

                    {message.playlist && (
                        <Card className="mt-4">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Saved to Spotify:
                                    </span>
                                    <Button
                                        variant="link"
                                        asChild
                                        className="h-auto p-0"
                                    >
                                        <a
                                            href={message.playlist.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm"
                                        >
                                            Open in Spotify →
                                        </a>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-hidden">
                                    <iframe
                                        src={`https://open.spotify.com/embed/playlist/${message.playlist.id}?utm_source=generator&theme=0`}
                                        width="100%"
                                        height="380"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        className="rounded-xl"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
