import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ChatService } from "../../../lib/chatService";

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

export async function GET() {
    try {
        const userId = await getUserId();
        const topics = await ChatService.getUserTopics(userId);
        const activeTopicId = await ChatService.getActiveTopicId(userId);
        
        return NextResponse.json({ 
            success: true, 
            topics,
            activeTopicId
        });
    } catch (error) {
        console.error("Error loading topics:", error);
        return NextResponse.json(
            { error: "Failed to load topics" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { title } = await request.json();
        const userId = await getUserId();
        
        const topicId = await ChatService.createNewTopic(userId, title);
        
        return NextResponse.json({ 
            success: true, 
            topicId 
        });
    } catch (error) {
        console.error("Error creating topic:", error);
        return NextResponse.json(
            { error: "Failed to create topic" },
            { status: 500 }
        );
    }
}