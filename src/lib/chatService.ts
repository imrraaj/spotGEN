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

export interface ChatTopic {
    _id?: ObjectId;
    id: string;
    userId: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export interface UserChat {
    _id?: ObjectId;
    userId: string;
    activeTopicId?: string;
    topics: string[];
    createdAt: Date;
    updatedAt: Date;
}

export class ChatService {
    private static async getUserChatsCollection() {
        const db = await getDatabase();
        return db.collection<UserChat>("user_chats");
    }

    private static async getTopicsCollection() {
        const db = await getDatabase();
        return db.collection<ChatTopic>("chat_topics");
    }

    static async createNewTopic(userId: string, title?: string): Promise<string> {
        const topicsCollection = await this.getTopicsCollection();
        const userChatsCollection = await this.getUserChatsCollection();

        const topicId = new ObjectId().toHexString();
        const now = new Date();

        const topic: Omit<ChatTopic, "_id"> = {
            id: topicId,
            userId,
            title: title || `New Chat ${new Date().toLocaleString()}`,
            messages: [],
            createdAt: now,
            updatedAt: now,
        };

        await topicsCollection.insertOne(topic);

        await userChatsCollection.updateOne(
            { userId },
            {
                $set: {
                    activeTopicId: topicId,
                    updatedAt: now
                },
                $addToSet: { topics: topicId },
                $setOnInsert: {
                    userId,
                    createdAt: now
                }
            },
            { upsert: true }
        );

        return topicId;
    }

    static async getUserTopics(userId: string): Promise<ChatTopic[]> {
        const topicsCollection = await this.getTopicsCollection();

        const topics = await topicsCollection
            .find({ userId })
            .sort({ updatedAt: -1 })
            .toArray();
        
        return topics;
    }

    static async getActiveTopicId(userId: string): Promise<string | null> {
        const userChatsCollection = await this.getUserChatsCollection();
        const userChat = await userChatsCollection.findOne({ userId });
        return userChat?.activeTopicId || null;
    }

    static async setActiveTopic(userId: string, topicId: string): Promise<void> {
        const userChatsCollection = await this.getUserChatsCollection();

        await userChatsCollection.updateOne(
            { userId },
            {
                $set: {
                    activeTopicId: topicId,
                    updatedAt: new Date()
                }
            }
        );
    }

    static async getTopicMessages(topicId: string): Promise<ChatMessage[]> {
        const topicsCollection = await this.getTopicsCollection();

        const topic = await topicsCollection.findOne({ id: topicId });
        return topic?.messages || [];
    }

    static async saveTopicMessages(topicId: string, messages: ChatMessage[]): Promise<void> {
        const topicsCollection = await this.getTopicsCollection();

        await topicsCollection.updateOne(
            { id: topicId },
            {
                $set: {
                    messages,
                    updatedAt: new Date()
                }
            }
        );
    }

    static async deleteTopic(userId: string, topicId: string): Promise<void> {
        const topicsCollection = await this.getTopicsCollection();
        const userChatsCollection = await this.getUserChatsCollection();

        await topicsCollection.deleteOne({ id: topicId, userId });

        const userChat = await userChatsCollection.findOne({ userId });
        if (userChat?.activeTopicId === topicId) {
            const remainingTopics = await this.getUserTopics(userId);
            const newActiveTopicId = remainingTopics.length > 0 ? remainingTopics[0].id : null;

            await userChatsCollection.updateOne(
                { userId },
                {
                    $set: { activeTopicId: newActiveTopicId || undefined },
                    $pull: { topics: topicId }
                }
            );
        } else {
            await userChatsCollection.updateOne(
                { userId },
                { $pull: { topics: topicId } }
            );
        }
    }

    static async updateTopicTitle(topicId: string, title: string): Promise<void> {
        const topicsCollection = await this.getTopicsCollection();

        await topicsCollection.updateOne(
            { id: topicId },
            {
                $set: {
                    title,
                    updatedAt: new Date()
                }
            }
        );
    }

    // Legacy methods for backward compatibility
    static async saveUserChat(userId: string, chatHistory: ChatMessage[]): Promise<void> {
        let activeTopicId = await this.getActiveTopicId(userId);

        if (!activeTopicId) {
            activeTopicId = await this.createNewTopic(userId);
        }

        await this.saveTopicMessages(activeTopicId, chatHistory);
    }

    static async getUserChat(userId: string): Promise<ChatMessage[]> {
        const activeTopicId = await this.getActiveTopicId(userId);

        if (!activeTopicId) {
            return [];
        }

        return await this.getTopicMessages(activeTopicId);
    }

    static async deleteUserChat(userId: string): Promise<void> {
        const userChatsCollection = await this.getUserChatsCollection();
        const topicsCollection = await this.getTopicsCollection();

        await topicsCollection.deleteMany({ userId });
        await userChatsCollection.deleteOne({ userId });
    }
}
