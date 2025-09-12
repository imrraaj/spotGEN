import Link from "next/link";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, MessageSquare } from "lucide-react";
import ChatSidebarClient from "./ChatSidebarClient";

interface ChatTopic {
    id: string;
    userId: string;
    title: string;
    messages: unknown[];
    createdAt: string;
    updatedAt: string;
}

interface ChatSidebarServerProps {
    topics: ChatTopic[];
    activeTopicId: string | null;
}

function formatDate(dateString: string | Date) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

export default function ChatSidebarServer({
    topics,
    activeTopicId,
}: ChatSidebarServerProps) {
    return (
        <Card className="w-full h-full flex flex-col p-0">
            <div className="p-4 border-b flex-shrink-0">
                <Link href="/chat">
                    <Button className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-2 min-h-0">
                {topics.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No chats yet</p>
                        <p className="text-sm">Start a new conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {topics.map((topic) => (
                            <div key={topic.id} className="group relative">
                                <Link
                                    href={`/chat/topic/${topic.id}`}
                                    className={`block p-3 rounded-lg transition-colors hover:bg-muted ${
                                        activeTopicId === topic.id
                                            ? "bg-primary/10 border border-primary/20"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">
                                                {topic.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {formatDate(topic.updatedAt)}
                                            </div>
                                        </div>

                                        <div className="flex gap-1 ml-2">
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {topic.messages?.length || 0}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>

                                {/* Client-side actions */}
                                <ChatSidebarClient
                                    topicId={topic.id}
                                    topicTitle={topic.title}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
