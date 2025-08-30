import {
    SpotifyApi,
    Track,
    Artist,
    UserProfile,
    PlaylistedTrack,
    Page,
    AccessToken,
} from "@spotify/web-api-ts-sdk";

interface PlaylistDetails {
    name: string;
    description: string | null;
    trackCount: number;
    tracks: Array<{
        name: string;
        artist: string;
        genres: string[];
    }>;
}

interface UserMusicProfile {
    profile: UserProfile;
    topTracks: Track[];
    topArtists: Artist[];
    recentTracks: Track[];
    mediumTermTracks: Track[];
    mediumTermArtists: Artist[];
    longTermTracks: Track[];
    longTermArtists: Artist[];
    genres: string[];
    spotifyRecommendations: Track[];
    userPlaylists: PlaylistDetails[];
    playlists: PlaylistDetails[];
}

interface TrackSearchResult {
    id: string;
    name: string;
    artist: string;
}

interface PlaylistCreateResult {
    id: string;
    external_urls: { spotify: string };
    name: string;
}

export class SpotifyFetcher {
    private spotifyApi: SpotifyApi;

    constructor(private accessToken: string) {
        const tokenInfo: AccessToken = {
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: "",
        };
        this.spotifyApi = SpotifyApi.withAccessToken(
            process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "",
            tokenInfo,
        );
    }

    async getUserPlaylists(): Promise<PlaylistDetails[]> {
        try {
            const playlists =
                await this.spotifyApi.currentUser.playlists.playlists(50);
            const playlistDetails: PlaylistDetails[] = [];
            const playlistPromises: Promise<Page<PlaylistedTrack>>[] = [];

            for (const playlist of playlists.items) {
                playlistPromises.push(
                    this.spotifyApi.playlists.getPlaylistItems(
                        playlist.id,
                        "US",
                        undefined,
                        50,
                    ),
                );
            }

            const tracksResults = await Promise.all(playlistPromises);
            for (let i = 0; i < playlists.items.length; i++) {
                const playlist = playlists.items[i];
                const tracks = tracksResults[i];
                playlistDetails.push({
                    name: playlist.name,
                    description: playlist.description,
                    trackCount: playlist.tracks?.total || 0,
                    tracks: tracks.items
                        .map((item) => {
                            if (
                                item.track &&
                                "name" in item.track &&
                                "artists" in item.track
                            ) {
                                const track = item.track as Track;
                                return {
                                    name: track.name,
                                    artist: track.artists[0]?.name || "",
                                    genres: [] as string[],
                                };
                            }
                            return null;
                        })
                        .filter(
                            (
                                track,
                            ): track is {
                                name: string;
                                artist: string;
                                genres: string[];
                            } =>
                                track !== null &&
                                Boolean(track.name) &&
                                Boolean(track.artist),
                        ),
                });
            }
            return playlistDetails;
        } catch (error) {
            console.error("Error fetching user playlists:", error);
            return [];
        }
    }

    async getUserMusicProfile(): Promise<UserMusicProfile> {
        try {
            const [
                profile,
                shortTracks,
                shortArtists,
                mediumTracks,
                mediumArtists,
                longTracks,
                longArtists,
                recentData,
            ] = await Promise.all([
                this.spotifyApi.currentUser.profile(),
                this.spotifyApi.currentUser.topItems(
                    "tracks",
                    "short_term",
                    50,
                ),
                this.spotifyApi.currentUser.topItems(
                    "artists",
                    "short_term",
                    50,
                ),
                this.spotifyApi.currentUser.topItems(
                    "tracks",
                    "medium_term",
                    50,
                ),
                this.spotifyApi.currentUser.topItems(
                    "artists",
                    "medium_term",
                    50,
                ),
                this.spotifyApi.currentUser.topItems("tracks", "long_term", 20),
                this.spotifyApi.currentUser.topItems(
                    "artists",
                    "long_term",
                    20,
                ),
                this.spotifyApi.player.getRecentlyPlayedTracks(50),
            ]);

            const recentTracks: Track[] =
                recentData.items?.map((item) => item.track) || [];
            const genreCount: Record<string, number> = {};

            [...mediumArtists.items, ...shortArtists.items].forEach(
                (artist) => {
                    artist.genres?.forEach((genre: string) => {
                        genreCount[genre] = (genreCount[genre] || 0) + 1;
                    });
                },
            );
            const userPlaylists = await this.getUserPlaylists();

            const userProfile: UserMusicProfile = {
                profile,
                topTracks: shortTracks.items,
                topArtists: shortArtists.items,
                mediumTermTracks: mediumTracks.items,
                mediumTermArtists: mediumArtists.items,
                longTermTracks: longTracks.items,
                longTermArtists: longArtists.items,
                recentTracks,
                userPlaylists,
                playlists: userPlaylists,
                genres: Object.entries(genreCount)
                    .sort(([, a], [, b]) => b - a)
                    .map(([genre]) => genre),
                spotifyRecommendations: [],
            };
            return userProfile;
        } catch (error) {
            console.error("Error fetching user music profile:", error);
            throw error;
        }
    }

    generatePrompt(userProfile: UserMusicProfile, prompt: string): string {
        const genreEvolution = this.analyzeGenreEvolution(userProfile);
        const listeningPatterns = this.analyzeListeningPatterns(userProfile);

        return `Generate 25-30 song recommendations for: "${prompt}"

=== USER'S COMPREHENSIVE SPOTIFY PROFILE ===

🎵 CURRENT PREFERENCES (Recent ~4 weeks):
- Top Genres: ${userProfile.genres.slice(0, 8).join(", ")}
- Current Top Artists: ${userProfile.topArtists
            .slice(0, 8)
            .map((a) => a.name)
            .join(", ")}
- Recent Favorite Tracks: ${userProfile.topTracks
            .slice(0, 8)
            .map(
                (t) =>
                    `"${t.name}" by ${t.artists.map((a) => a.name).join(", ")}`,
            )
            .join(" | ")}

🔄 MUSICAL EVOLUTION (1-6 month context):
${genreEvolution}

📈 LISTENING PATTERNS:
${listeningPatterns}

🎯 SPOTIFY ALGORITHM RECOMMENDATIONS (for reference):
${userProfile.spotifyRecommendations
    .slice(0, 10)
    .map((t) => `"${t.name}" by ${t.artists.map((a) => a.name).join(", ")}`)
    .join(" | ")}

⭐ ESTABLISHED FAVORITES (longer term):
- Core Artists: ${userProfile.longTermArtists
            .slice(0, 5)
            .map((a) => a.name)
            .join(", ")}
- Classic Tracks: ${userProfile.longTermTracks
            .slice(0, 5)
            .map(
                (t) =>
                    `"${t.name}" by ${t.artists.map((a) => a.name).join(", ")}`,
            )
            .join(" | ")}
📋 USER'S PLAYLIST CONTEXT (curated preferences):
${this.analyzeUserPlaylists(userProfile.playlists)}
=== INSTRUCTIONS ===
1. Context: "${prompt}" - adjust energy, mood, and genre selection accordingly
2. Use the user's audio feature preferences as baseline but adapt for context
3. Balance: 60% match current taste, 25% gentle exploration, 15% discovery
4. Prioritize diversity - avoid repeats of artists, genres, and styles
5. Match the listening patterns and audio features for optimal fit
6. Return ONLY JSON array: ["Artist - Song", "Artist - Song", ...]. Do not return answer as markdown. Only return as text string that I can parse as JSON.

Focus on quality over quantity - each song should feel personally curated for this user's taste and context.`;
    }

    private analyzeUserPlaylists(playlists: PlaylistDetails[]): string {
        if (!playlists || playlists.length === 0) {
            return "- No user playlists found or accessible";
        }

        const playlistSummary = playlists.slice(0, 5).map((playlist) => {
            const artistCounts: Record<string, number> = {};
            playlist.tracks.forEach((track) => {
                if (track.artist) {
                    artistCounts[track.artist] =
                        (artistCounts[track.artist] || 0) + 1;
                }
            });

            const topArtists = Object.entries(artistCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([artist]) => artist);

            return `"${playlist.name}" (${playlist.trackCount} tracks): ${topArtists.join(", ")}`;
        });

        const totalTracks = playlists.reduce((sum, p) => sum + p.trackCount, 0);
        return `- Active playlists (${playlists.length} total, ${totalTracks} tracks): ${playlistSummary.join(" | ")}
- Shows curation style: ${playlists.length > 10 ? "meticulous curator" : playlists.length > 5 ? "organized listener" : "selective curator"}`;
    }

    async createPlaylist(
        tracks: TrackSearchResult[],
        playlistName?: string,
    ): Promise<PlaylistCreateResult> {
        try {
            const profile = await this.spotifyApi.currentUser.profile();

            const defaultName =
                tracks.length > 0 ? `${tracks[0].name} Mix` : "AI Playlist";
            const emojis = [
                "🎵",
                "🎧",
                "🎶",
                "🌟",
                "✨",
                "🎤",
                "🎸",
                "🥁",
                "🎹",
                "🎺",
            ];
            const randomEmoji =
                emojis[Math.floor(Math.random() * emojis.length)];
            const finalPlaylistName =
                playlistName || `${defaultName} ${randomEmoji}`;

            const playlistData = await this.spotifyApi.playlists.createPlaylist(
                profile.id,
                {
                    name: finalPlaylistName,
                    description:
                        "AI-curated playlist based on your music taste",
                    public: false,
                },
            );

            // Add tracks to the playlist
            const trackUris = tracks.map(
                (track) => `spotify:track:${track.id}`,
            );

            if (trackUris.length > 0) {
                try {
                    await this.spotifyApi.playlists.addItemsToPlaylist(
                        playlistData.id,
                        trackUris,
                    );
                } catch (error) {
                    console.warn(
                        "Failed to add some tracks to playlist:",
                        error,
                    );
                }
            }

            return {
                id: playlistData.id,
                external_urls: playlistData.external_urls,
                name: playlistData.name,
            };
        } catch (error) {
            console.error("Error creating playlist:", error);
            throw error;
        }
    }

    async deletePlaylist(playlistId: string): Promise<void> {
        try {
            // Unfollow the playlist (which effectively deletes it if you're the owner)
            // Use the API directly for unfollowing playlist as the SDK method may not exist
            const response = await fetch(
                `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(
                    `Failed to delete playlist: ${error.error?.message || "Unknown error"}`,
                );
            }
        } catch (error) {
            console.error("Error deleting playlist:", error);
            throw error;
        }
    }

    async getTracksFromRecommendations(
        recommendations: string[],
    ): Promise<TrackSearchResult[]> {
        const searchPromises = recommendations.map(async (rec) => {
            const [artist, ...songParts] = rec.split(" - ");
            const song = songParts.join(" - ").trim();
            if (!artist || !song) return null;

            // Helper function to normalize text for matching
            const normalize = (text: string) =>
                text
                    .toLowerCase()
                    .replace(/[^\w\s]/g, " ") // Remove special chars
                    .replace(/\s+/g, " ") // Normalize spaces
                    .trim();

            const normalizedSong = normalize(song);
            const normalizedArtist = normalize(artist);

            const searchStrategies = [
                `track:"${song}" artist:"${artist}"`,
                `"${song}" "${artist}"`,
                `${song} ${artist}`,
                artist, // Just artist name for Bollywood/regional songs
                song, // Just song name
            ];

            for (const searchQuery of searchStrategies) {
                try {
                    const searchResult = await this.spotifyApi.search(
                        searchQuery,
                        ["track"],
                        undefined,
                        10,
                    );

                    for (const trackItem of searchResult.tracks.items || []) {
                        const trackName = normalize(trackItem.name);
                        const trackArtists = trackItem.artists.map((a) =>
                            normalize(a.name),
                        );

                        // More flexible matching
                        const songMatch =
                            trackName.includes(normalizedSong) ||
                            normalizedSong.includes(trackName) ||
                            this.levenshteinDistance(
                                trackName,
                                normalizedSong,
                            ) <= 3;

                        const artistMatch = trackArtists.some(
                            (ta) =>
                                ta.includes(normalizedArtist) ||
                                normalizedArtist.includes(ta) ||
                                this.levenshteinDistance(
                                    ta,
                                    normalizedArtist,
                                ) <= 2,
                        );

                        if (songMatch && artistMatch) {
                            return {
                                id: trackItem.id,
                                name: trackItem.name,
                                artist: trackItem.artists
                                    .map((a) => a.name)
                                    .join(", "),
                            };
                        }
                    }
                } catch (error) {
                    console.warn(`Search failed for "${rec}":`, error);
                }
            }
            return null;
        });

        const results = await Promise.all(searchPromises);
        const tracks = results.filter(
            (track): track is TrackSearchResult => track !== null,
        );
        console.log(`Found ${tracks.length}/${recommendations.length} tracks`);
        return tracks;
    }

    private analyzeGenreEvolution(profile: UserMusicProfile): string {
        const shortGenres = new Set(
            profile.topArtists.flatMap((a) => a.genres || []),
        );
        const mediumGenres = new Set(
            profile.mediumTermArtists.flatMap((a) => a.genres || []),
        );

        const emerging = [...shortGenres]
            .filter((g) => !mediumGenres.has(g))
            .slice(0, 3);
        const stable = [...shortGenres]
            .filter((g) => mediumGenres.has(g))
            .slice(0, 5);

        return `- Emerging interests: ${emerging.join(", ") || "Stable preferences"}
- Consistent preferences: ${stable.join(", ")}`;
    }

    private analyzeListeningPatterns(profile: UserMusicProfile): string {
        const recentArtistTracks: Record<string, string[]> = {};

        // Group tracks by artist
        profile.recentTracks.forEach((track) => {
            track.artists.forEach((artist) => {
                if (!recentArtistTracks[artist.name]) {
                    recentArtistTracks[artist.name] = [];
                }
                recentArtistTracks[artist.name].push(track.name);
            });
        });

        // Get top artists with their most played tracks
        const topRecentArtists = Object.entries(recentArtistTracks)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 5)
            .map(([artistName, tracks]) => {
                const uniqueTracks = [...new Set(tracks)].slice(0, 3); // Top 3 unique tracks
                return `${artistName}: ${uniqueTracks.join(", ")} (${tracks.length}x total)`;
            });

        return `- Recent heavy rotation: ${topRecentArtists.join(" | ")}
- Track diversity: ${profile.recentTracks.length} unique tracks in recent plays`;
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1)
            .fill(null)
            .map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const substitution =
                    matrix[j - 1][i - 1] +
                    (str1[i - 1] === str2[j - 1] ? 0 : 1);
                matrix[j][i] = Math.min(
                    matrix[j - 1][i] + 1,
                    matrix[j][i - 1] + 1,
                    substitution,
                );
            }
        }

        return matrix[str2.length][str1.length];
    }
}
