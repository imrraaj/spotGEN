import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ChatService } from "../../../../lib/chatService";

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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ topicId: string }> }
) {
    try {
        const { topicId } = await params;
        const messages = await ChatService.getTopicMessages(topicId);
        
        return NextResponse.json({ 
            success: true, 
            messages 
        });
    } catch (error) {
        console.error("Error loading topic messages:", error);
        return NextResponse.json(
            { error: "Failed to load topic messages" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ topicId: string }> }
) {
    try {
        const { topicId } = await params;
        const body = await request.json();
        const userId = await getUserId();
        
        if (body.messages) {
            await ChatService.saveTopicMessages(topicId, body.messages);
        }
        
        if (body.title) {
            await ChatService.updateTopicTitle(topicId, body.title);
        }
        
        if (body.setActive) {
            await ChatService.setActiveTopic(userId, topicId);
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating topic:", error);
        return NextResponse.json(
            { error: "Failed to update topic" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ topicId: string }> }
) {
    try {
        const { topicId } = await params;
        const userId = await getUserId();
        
        await ChatService.deleteTopic(userId, topicId);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting topic:", error);
        return NextResponse.json(
            { error: "Failed to delete topic" },
            { status: 500 }
        );
    }
}