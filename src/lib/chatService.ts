import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

export interface ChatMessage {
    id: string;
    type: "user" | "assistant";
    content: string;
    llmPrompt?: string;
    tracks?: Array<{
        id: string;
        name: string;
        artist: string;
        album?: string;
        preview_url?: string;
    }>;
    playlist?: {
        id: string;
        name: string;
        url: string;
    };
    timestamp: number;
}

export interface UserChat {
    _id?: ObjectId;
    userId: string;
    chatHistory: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export class ChatService {
    private static async getCollection() {
        const db = await getDatabase();
        return db.collection<UserChat>("user_chats");
    }

    static async saveUserChat(
        userId: string,
        chatHistory: ChatMessage[],
    ): Promise<void> {
        const collection = await this.getCollection();

        const now = new Date();
        const chatData: Omit<UserChat, "_id"> = {
            userId,
            chatHistory,
            createdAt: now,
            updatedAt: now,
        };

        await collection.replaceOne({ userId }, chatData, { upsert: true });
    }

    static async getUserChat(userId: string): Promise<ChatMessage[]> {
        const collection = await this.getCollection();

        const userChat = await collection.findOne({ userId });
        return userChat?.chatHistory || [];
    }

    static async deleteUserChat(userId: string): Promise<void> {
        const collection = await this.getCollection();
        await collection.deleteOne({ userId });
    }
}
