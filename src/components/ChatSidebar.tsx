"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
// import { Separator } from "./ui/separator";
import axios from "axios";
import { Trash2, Edit2, Plus, MessageSquare } from "lucide-react";

interface ChatTopic {
    id: string;
    title: string;
    updatedAt: string;
}

interface ChatSidebarProps {
    activeTopicId: string | null;
    onTopicChange: (topicId: string) => void;
    onNewTopic: () => void;
}

export function ChatSidebar({
    activeTopicId,
    onTopicChange,
    onNewTopic,
}: ChatSidebarProps) {
    const [topics, setTopics] = useState<ChatTopic[]>([]);
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [loading, setLoading] = useState(true);

    const loadTopics = async () => {
        try {
            const response = await axios.get("/api/topics");
            if (response.data.success) {
                setTopics(response.data.topics);
            }
        } catch (error) {
            console.error("Error loading topics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTopics();
    }, []);

    useEffect(() => {
        // Reload topics when active topic changes to keep sidebar in sync
        loadTopics();
    }, [activeTopicId]);

    const handleCreateTopic = async () => {
        try {
            const response = await axios.post("/api/topics", {
                title: "New Chat",
            });
            if (response.data.success) {
                await loadTopics();
                onNewTopic();
                onTopicChange(response.data.topicId);
            }
        } catch (error) {
            console.error("Error creating topic:", error);
        }
    };

    const handleDeleteTopic = async (topicId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat?")) return;

        try {
            await axios.delete(`/api/topics/${topicId}`);
            await loadTopics();
            if (activeTopicId === topicId) {
                const remainingTopics = topics.filter((t) => t.id !== topicId);
                if (remainingTopics.length > 0) {
                    onTopicChange(remainingTopics[0].id);
                } else {
                    handleCreateTopic();
                }
            }
        } catch (error) {
            console.error("Error deleting topic:", error);
        }
    };

    const handleEditTopic = (topic: ChatTopic, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTopicId(topic.id);
        setEditTitle(topic.title);
    };

    const handleSaveEdit = async () => {
        if (!editingTopicId || !editTitle.trim()) return;

        try {
            await axios.put(`/api/topics/${editingTopicId}`, {
                title: editTitle.trim(),
            });
            await loadTopics();
            setEditingTopicId(null);
            setEditTitle("");
        } catch (error) {
            console.error("Error updating topic:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingTopicId(null);
        setEditTitle("");
    };

    const formatDate = (dateString: string) => {
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
    };

    if (loading) {
        return (
            <Card className="w-80 h-full px-4 flex items-center justify-center">
                Loading chats...
            </Card>
        );
    }

    return (
        <Card className="w-80 h-full flex flex-col p-0">
            <div className="p-4 border-b">
                <Button
                    onClick={handleCreateTopic}
                    className="w-full"
                    variant="outline"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {topics.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No chats yet</p>
                        <p className="text-sm">Start a new conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {topics.map((topic) => (
                            <div
                                key={topic.id}
                                className={`group p-3 cursor-pointer transition-colors hover:bg-muted ${
                                    activeTopicId === topic.id
                                        ? "bg-primary/10 border border-primary/20"
                                        : ""
                                }`}
                                onClick={() => onTopicChange(topic.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        {editingTopicId === topic.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) =>
                                                        setEditTitle(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="flex-1 px-2 py-1 text-sm border"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter")
                                                            handleSaveEdit();
                                                        if (e.key === "Escape")
                                                            handleCancelEdit();
                                                    }}
                                                    onBlur={handleSaveEdit}
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="font-medium text-sm truncate">
                                                    {topic.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(
                                                        topic.updatedAt,
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {editingTopicId !== topic.id && (
                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={(e) =>
                                                    handleEditTopic(topic, e)
                                                }
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                onClick={(e) =>
                                                    handleDeleteTopic(
                                                        topic.id,
                                                        e,
                                                    )
                                                }
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
