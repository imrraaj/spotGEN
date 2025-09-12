"use client";

import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Music, ExternalLink, RefreshCw, Save } from "lucide-react";

interface Track {
    id: string;
    name: string;
    artist: string;
    album?: string;
    preview_url?: string;
}

interface TrackListProps {
    tracks: Track[];
    onSaveToSpotify: () => void;
    onGenerateOther: () => void;
    isGenerating?: boolean;
    isSaving?: boolean;
}

export function TrackList({
    tracks,
    onSaveToSpotify,
    onGenerateOther,
    isGenerating = false,
    isSaving = false
}: TrackListProps) {
    return (
        <Card className="p-0 m-0 gap-4">
            <div className="border-b p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span className="font-medium">Generated Tracks ({tracks.length})</span>
                    </div>
                    <Badge variant="secondary">{tracks.length} songs</Badge>
                </div>
            </div>
            <CardContent className="p-2 md:py-4">
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {tracks.map((track, index) => (
                        <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <span className="text-xs text-muted-foreground w-6 text-center">
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                    {track.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {track.artist}{track.album && ` • ${track.album}`}
                                </div>
                            </div>
                            {track.preview_url && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    asChild
                                >
                                    <a
                                        href={track.preview_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Preview track"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={onSaveToSpotify}
                        disabled={isSaving || isGenerating}
                        className=""
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save to Spotify
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onGenerateOther}
                        variant="outline"
                        disabled={isSaving || isGenerating}
                        className=""
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Generate Other
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
