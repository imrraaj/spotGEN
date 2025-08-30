import { getSpotifyUser } from '@/lib/auth';
import UnifiedPlaylistGenerator from '@/components/UnifiedPlaylistGenerator';

export default async function HomePage() {
    const user = await getSpotifyUser();
    return <UnifiedPlaylistGenerator user={user} />;
}
