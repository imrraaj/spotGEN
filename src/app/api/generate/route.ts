import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SpotifyFetcher } from "@/lib/spotifyAPI";

export async function POST(request: NextRequest) {
    try {
        const { prompt, savePlaylist = false } = await request.json();
        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 },
            );
        }

        const cookieStore = await cookies();
        const accessToken = cookieStore.get("spotify_access_token")?.value;

        if (!accessToken) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }
        
        const fetcher = new SpotifyFetcher(accessToken);
        const userProfile = await fetcher.getUserMusicProfile();
        const llmPrompt = fetcher.generatePrompt(userProfile, prompt);
        const llmResponse = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "Openai/gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: llmPrompt,
                        },
                    ],
                }),
            },
        );
        const llmData = await llmResponse.json();
        const recommendations = llmData.choices[0].message.content;
        const parsedRecommendations = JSON.parse(recommendations);
        const tracks = await fetcher.getTracksFromRecommendations(parsedRecommendations);
        
        const response: {
            success: boolean;
            prompt: string;
            recommendations: unknown;
            tracks: unknown[];
            playlist?: unknown;
        } = {
            success: true,
            prompt: llmPrompt,
            recommendations: parsedRecommendations,
            tracks,
        };

        // Only create playlist if savePlaylist is true
        if (savePlaylist) {
            const playlist = await fetcher.createPlaylist(tracks);
            response.playlist = playlist;
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error generating prompt:", error);
        return NextResponse.json(
            {
                error: "Failed to generate prompt",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
