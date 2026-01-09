"use client";

import { useState } from "react";
import { Bot, Sparkles, MessageCircle } from "lucide-react";
import { AIChatPanel } from "./ai-chat-panel";

export function AIChatButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Chat Button - Hidden when panel is open */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-40 group transition-all duration-300 ${isOpen ? "opacity-0 pointer-events-none scale-75" : "opacity-100 scale-100"
                    }`}
                aria-label="Open AI Assistant"
            >
                {/* Pulse ring animation */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-ping opacity-25" />

                {/* Button */}
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                    <Bot className="h-6 w-6 text-white" />

                    {/* Sparkle decoration */}
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
                </div>

                {/* Tooltip */}
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    AI Assistant
                    <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
                </span>
            </button>

            {/* Side Panel */}
            <AIChatPanel open={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

export default AIChatButton;
