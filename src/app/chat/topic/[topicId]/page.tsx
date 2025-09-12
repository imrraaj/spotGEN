import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChatService } from "@/lib/chatService";
import ChatInterface from "@/components/ChatInterface";

interface PageProps {
    params: Promise<{ topicId: string }>;
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

export default async function TopicPage({ params }: PageProps) {
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

    const { topicId } = await params;
    const userId = await getUserId();
    
    let chatHistory = [];
    let pendingTracks = null;
    let pendingPrompt = null;

    // Fetch specific topic messages
    try {
        const messages = await ChatService.getTopicMessages(topicId);
        chatHistory = messages;
        
        // Set this topic as active
        await ChatService.setActiveTopic(userId, topicId);
        
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
        // Redirect to chat home if topic doesn't exist
        redirect('/chat');
        return null;
    }

    return (
        <ChatInterface 
            user={user}
            initialChatHistory={chatHistory}
            initialActiveTopicId={topicId}
            initialPendingTracks={pendingTracks}
            initialPendingPrompt={pendingPrompt}
        />
    );
}