# Spotify PlayGEN

AI-powered playlist generator that analyzes your Spotify listening history and creates personalized playlists using LLM recommendations.

## Features

- **Spotify Integration**: Connects to your Spotify account to analyze listening habits
- **AI Recommendations**: Uses OpenRouter LLM to generate personalized song recommendations
- **Smart Search**: Advanced track matching algorithm with fuzzy search and multiple strategies
- **Playlist Creation**: Automatically creates Spotify playlists with embed previews
- **Chat History**: Persistent conversation history saved per user
- **Clean UI**: Black and white minimalist design

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenRouter API (GPT-4o-mini)
- **Music**: Spotify Web API
- **Storage**: JSON file storage (ready for MongoDB migration)

## Environment Variables

Create a `.env.local` file with:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENROUTER_API=your_openrouter_api_key
```

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Spotify App:**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add redirect URI: `http://localhost:3000/api/auth/spotify/callback`
   - Copy Client ID and Client Secret to `.env.local`

3. **Set up OpenRouter:**
   - Sign up at [OpenRouter](https://openrouter.ai)
   - Get API key and add to `.env.local`

4. **Run the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment

The app is ready for deployment on platforms like Vercel, Netlify, or any Node.js hosting service.

### Environment Variables for Production:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET` 
- `OPENROUTER_API`

Make sure to update Spotify app redirect URIs for your production domain.

## API Endpoints

- `POST /api/generate` - Generate LLM prompt and create playlist
- `GET/POST /api/chat` - Load/save chat history
- `GET/DELETE /api/auth/spotify` - Spotify authentication
- `GET /api/auth/spotify/callback` - Spotify OAuth callback

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── page.tsx      # Main page
│   └── layout.tsx    # App layout
├── components/
│   ├── UnifiedPlaylistGenerator.tsx  # Main component
│   └── authModal.tsx                 # Login modal
├── lib/
│   ├── spotifyAPI.ts # Spotify API integration
│   ├── auth.ts       # Authentication utilities
│   └── security.ts   # Security utilities
└── middleware.ts     # Security headers and auth
```
