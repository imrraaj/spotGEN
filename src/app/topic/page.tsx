import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChatService } from "@/lib/chatService";
import ChatInterface from "@/components/ChatInterface";

interface PageProps {
    searchParams: Promise<{ topic?: string }>;
}

async function getUserId(): Promise<string> {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("spotify_user")?.value;
    if (userCookie) {
        try {
            const user = JSON.parse(userCookie);
            return user.id;
        } catch {}
    }
    return "anonymous";
}

export default async function ChatPage({ searchParams }: PageProps) {
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

    const { topic } = await searchParams;
    const userId = await getUserId();
    
    let chatHistory: unknown[] = [];
    let activeTopicId: string | null = null;
    let pendingTracks: unknown = null;
    let pendingPrompt: string | null = null;

    if (topic) {
        // Fetch specific topic messages
        try {
            const messages = await ChatService.getTopicMessages(topic);
            chatHistory = messages;
            activeTopicId = topic;
            
            // Check if the last message has pending tracks
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.tracks && !lastMessage.playlist) {
                pendingTracks = lastMessage.tracks;
                // Find the user prompt that generated these tracks
                const userMessage = messages[messages.length - 2];
                if (userMessage?.type === "user") {
                    pendingPrompt = userMessage.content;
                }
            }
        } catch (error) {
            console.error("Error loading topic:", error);
        }
    } else {
        // No specific topic, load the active topic or start fresh
        try {
            const activeId = await ChatService.getActiveTopicId(userId);
            if (activeId) {
                // Redirect to the active topic URL
                redirect(`/chat?topic=${activeId}`);
                return null;
            }
            // No active topic, start with empty chat
        } catch (error) {
            console.error("Error loading active topic:", error);
        }
    }

    return (
        <ChatInterface 
            user={user}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialChatHistory={chatHistory as any}
            initialActiveTopicId={activeTopicId}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialPendingTracks={pendingTracks as any}
            initialPendingPrompt={pendingPrompt}
        />
    );
}