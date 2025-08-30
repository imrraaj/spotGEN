import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ChatService, ChatMessage } from "../../../lib/chatService";

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

export async function POST(request: NextRequest) {
    try {
        const { chatHistory } = await request.json();

        if (!Array.isArray(chatHistory)) {
            return NextResponse.json(
                { error: "Invalid chat history format" },
                { status: 400 },
            );
        }

        const userId = await getUserId();

        await ChatService.saveUserChat(userId, chatHistory);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving chat:", error);
        return NextResponse.json(
            { error: "Failed to save chat" },
            { status: 500 },
        );
    }
}

export async function GET() {
    try {
        const userId = await getUserId();
        
        const chatHistory = await ChatService.getUserChat(userId);
        return NextResponse.json({ success: true, chatHistory });
    } catch (error) {
        console.error("Error loading chat:", error);
        return NextResponse.json(
            { error: "Failed to load chat" },
            { status: 500 },
        );
    }
}
