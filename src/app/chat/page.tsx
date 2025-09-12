import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// import { ChatService } from "@/lib/chatService";
import ChatInterface from "@/components/ChatInterface";

// async function getUserId(): Promise<string> {
//     const cookieStore = await cookies();
//     const userCookie = cookieStore.get("spotify_user")?.value;
//     if (userCookie) {
//         try {
//             const user = JSON.parse(userCookie);
//             return user.id;
//         } catch {}
//     }
//     return "anonymous";
// }

export default async function ChatPage() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("spotify_user")?.value;

    if (!userCookie) {
        redirect('/');
        return null;
    }

    let user;
    try {
        user = JSON.parse(userCookie);
    } catch {
        redirect('/');
        return null;
    }
    return (
        <ChatInterface
            user={user}
            initialChatHistory={[]}
            initialActiveTopicId={null}
            initialPendingTracks={null}
            initialPendingPrompt={null}
        />
    );
}
