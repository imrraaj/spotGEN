"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Edit2, Trash2 } from "lucide-react";
import axios from "axios";

interface ChatSidebarClientProps {
    topicId: string;
    topicTitle: string;
}

export default function ChatSidebarClient({ topicId, topicTitle }: ChatSidebarClientProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(topicTitle);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this chat?")) return;

        try {
            await axios.delete(`/api/topics/${topicId}`);
            router.refresh(); // Refresh to update the sidebar
            router.push('/chat'); // Navigate away if we're on this topic
        } catch (error) {
            console.error("Error deleting topic:", error);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!editTitle.trim()) return;

        try {
            await axios.put(`/api/topics/${topicId}`, {
                title: editTitle.trim()
            });
            setIsEditing(false);
            router.refresh(); // Refresh to update the sidebar
        } catch (error) {
            console.error("Error updating topic:", error);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditTitle(topicTitle);
    };

    if (isEditing) {
        return (
            <div className="inset-0 p-3 bg-background rounded-lg border">
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                    }}
                    onBlur={handleSaveEdit}
                    autoFocus
                />
            </div>
        );
    }

    return (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleEdit}
            >
                <Edit2 className="w-3 h-3" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
            >
                <Trash2 className="w-3 h-3" />
            </Button>
        </div>
    );
}
