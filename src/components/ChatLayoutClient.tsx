"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import ChatSidebarServer from "./ChatSidebarServer";

interface ChatTopic {
    id: string;
    userId: string;
    title: string;
    messages: unknown[];
    createdAt: string;
    updatedAt: string;
}

interface ChatLayoutClientProps {
    children: React.ReactNode;
    topics: ChatTopic[];
    activeTopicId: string | null;
}

export default function ChatLayoutClient({ children, topics, activeTopicId }: ChatLayoutClientProps) {
    const [sidebarVisible, setSidebarVisible] = useState(false);

    return (
        <div className="min-h-screen bg-background md:flex relative">
            {/* Mobile Toggle Button */}
            <Button
                variant="outline"
                size="icon"
                className="fixed top-4 left-4 z-30 md:hidden"
                onClick={() => setSidebarVisible(!sidebarVisible)}
            >
                {sidebarVisible ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>

            {/* Mobile Backdrop */}
            {sidebarVisible && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setSidebarVisible(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed h-screen min-w-1/5 z-20
                transition-transform duration-200
                ${sidebarVisible ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0
            `}>
                <div className="md:py-4 h-full w-full">
                    <ChatSidebarServer
                        topics={topics}
                        activeTopicId={activeTopicId}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-[20%] relative">
                <div className="pt-16 md:pt-4 px-4 md:px-4 pb-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
