import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChatService } from "@/lib/chatService";
import ChatLayoutClient from "@/components/ChatLayoutClient";

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

export default async function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("spotify_user")?.value;

    if (!userCookie) {
        redirect('/');
        return null;
    }

    const userId = await getUserId();

    // Load topics for sidebar
    let topics: {
        id: string;
        userId: string;
        title: string;
        messages: unknown[];
        createdAt: string;
        updatedAt: string;
    }[] = [];
    let activeTopicId: string | null = null;

    try {
        const rawTopics = await ChatService.getUserTopics(userId);
        // Serialize MongoDB objects to plain objects
        topics = rawTopics.map(topic => ({
            id: topic.id,
            userId: topic.userId,
            title: topic.title,
            messages: topic.messages || [],
            createdAt: topic.createdAt instanceof Date ? topic.createdAt.toISOString() : topic.createdAt,
            updatedAt: topic.updatedAt instanceof Date ? topic.updatedAt.toISOString() : topic.updatedAt
        }));
        activeTopicId = await ChatService.getActiveTopicId(userId);
    } catch (error) {
        console.error("Error loading sidebar data:", error);
    }

    return (
        <ChatLayoutClient 
            topics={topics} 
            activeTopicId={activeTopicId}
        >
            {children}
        </ChatLayoutClient>
    );
}
