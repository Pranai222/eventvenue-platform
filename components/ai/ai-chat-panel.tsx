"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, X, Plus, Trash2 } from "lucide-react";
import {
    getOrCreateCurrentSession,
    addMessage,
    clearSession,
    createNewSession,
    toApiHistory,
    StoredMessage,
    isStorageAvailable
} from "@/lib/ai/chat-storage";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface AIChatPanelProps {
    open: boolean;
    onClose: () => void;
}

const WELCOME_MESSAGE: Message = {
    id: "welcome",
    role: "assistant",
    content: `Hey there! 👋 I'm the **EventVenue Assistant**, created by **Pranai and his team**.

I'm here to help you with anything about the platform! Ask me about:

- 🏠 **Booking venues** and events
- 💰 **Points system** and payments  
- 👤 **Account** and profile management
- 🏪 **Vendor** features (if you're a seller)

What would you like to know?`,
    timestamp: new Date(),
};

const QUICK_QUESTIONS = [
    "How do I book a venue?",
    "How does the points system work?",
    "How do I buy more credits?",
    "How do I become a vendor?",
];

export function AIChatPanel({ open, onClose }: AIChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Load chat history on mount
    useEffect(() => {
        if (typeof window !== "undefined" && isStorageAvailable()) {
            const session = getOrCreateCurrentSession();
            setSessionId(session.id);

            if (session.messages.length > 0) {
                const loadedMessages: Message[] = [
                    WELCOME_MESSAGE,
                    ...session.messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.timestamp)
                    }))
                ];
                setMessages(loadedMessages);
            }
        }
    }, []);

    // No auto-scroll - user can scroll manually from top to bottom

    // Focus input when panel opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    // Save message to storage
    const saveMessage = useCallback((message: Message) => {
        if (!sessionId || !isStorageAvailable()) return;

        const storedMessage: StoredMessage = {
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp.toISOString()
        };
        addMessage(sessionId, storedMessage);
    }, [sessionId]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: messageText.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        saveMessage(userMessage);
        setInput("");
        setIsLoading(true);

        try {
            const chatHistory = messages
                .filter((m) => m.id !== "welcome")
                .map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText.trim(),
                    chatHistory: toApiHistory(chatHistory as any),
                }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: data.message || "Sorry, I couldn't generate a response.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            saveMessage(assistantMessage);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: "I'm having trouble connecting right now. Please try again or contact pranaib20@gmail.com",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleQuickQuestion = (question: string) => {
        sendMessage(question);
    };

    const handleNewChat = () => {
        const newSession = createNewSession();
        setSessionId(newSession.id);
        setMessages([WELCOME_MESSAGE]);
    };

    const handleClearChat = () => {
        if (sessionId) {
            clearSession(sessionId);
            setMessages([WELCOME_MESSAGE]);
        }
    };

    // Enhanced markdown formatter with better support
    const formatContent = (content: string) => {
        let formatted = content;

        // Headers (## and ###)
        formatted = formatted.replace(/^### (.+)$/gm, '<h4 class="text-sm font-bold mt-3 mb-1 text-primary">$1</h4>');
        formatted = formatted.replace(/^## (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-2 text-foreground">$1</h3>');

        // Bold text
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

        // Italic text
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-muted/70 px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>');

        // Code blocks
        formatted = formatted.replace(/```[\w]*\n([\s\S]*?)```/g, '<pre class="bg-muted/50 p-3 rounded-lg my-2 overflow-x-auto text-xs"><code>$1</code></pre>');

        // Tables (basic support)
        formatted = formatted.replace(/\|(.+)\|/g, (match) => {
            const cells = match.split('|').filter(c => c.trim());
            if (cells.some(c => c.includes('---'))) return '';
            return `<div class="flex gap-2 text-xs py-1 border-b border-muted/50">${cells.map(c => `<span class="flex-1">${c.trim()}</span>`).join('')}</div>`;
        });

        // Split by lines and process
        formatted = formatted
            .split("\n")
            .map((line) => {
                // Skip if already processed as header
                if (line.startsWith('<h')) return line;

                // Numbered lists
                if (/^\d+\.\s/.test(line)) {
                    const match = line.match(/^(\d+)\.\s(.+)/);
                    if (match) {
                        return `<div class="flex gap-2 ml-1 my-0.5"><span class="text-primary font-medium min-w-[20px]">${match[1]}.</span><span>${match[2]}</span></div>`;
                    }
                }

                // Bullet points with various markers
                if (/^[-•*]\s/.test(line)) {
                    return `<div class="flex gap-2 ml-1 my-0.5"><span class="text-primary">•</span><span>${line.substring(2)}</span></div>`;
                }

                // Emoji bullet points (common in responses)
                if (/^[🏠💰👤🏪📧🎉💳📍✅❌💡🔐📄🎫📱🔔⚡]\s/.test(line)) {
                    const emoji = line.substring(0, 2);
                    const text = line.substring(2);
                    return `<div class="flex gap-2 ml-1 my-0.5"><span>${emoji}</span><span>${text}</span></div>`;
                }

                return line;
            })
            .join("<br/>");

        // Clean up extra line breaks
        formatted = formatted.replace(/(<br\/>){3,}/g, '<br/><br/>');

        return formatted;
    };

    return (
        <>
            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Side Panel */}
            <div
                className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-background border-l shadow-2xl z-50 transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"
                    }`}
                style={{ display: "flex", flexDirection: "column" }}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-lg">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm">EventVenue Assistant</h2>
                            <p className="text-xs text-muted-foreground">Powered by AI • ChatGPT-like</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNewChat}
                            className="h-8 w-8 hover:bg-muted"
                            title="New conversation"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearChat}
                            className="h-8 w-8 hover:bg-muted"
                            title="Clear history"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    className="flex-1 overflow-y-auto p-4"
                    style={{ minHeight: 0 }}
                >
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${message.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-gradient-to-r from-primary to-purple-500 text-white"
                                        }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <Bot className="h-4 w-4" />
                                    )}
                                </div>

                                {/* Message bubble */}
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-muted rounded-tl-sm"
                                        }`}
                                >
                                    <div
                                        className="text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: formatContent(message.content),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-sm">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                    <div className="flex gap-1.5 items-center">
                                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                                        <span className="ml-2 text-xs text-muted-foreground">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* End of messages */}
                    </div>
                </div>


                {/* Quick questions (only show at start) */}
                {messages.length === 1 && (
                    <div className="flex-shrink-0 px-4 py-3 border-t bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                            ✨ Quick questions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleQuickQuestion(q)}
                                    className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="flex-shrink-0 p-4 border-t bg-background">
                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                disabled={isLoading}
                                className="flex-1 bg-muted/50 border-muted-foreground/20"
                                maxLength={1000}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 shadow-md"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </form>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Created by Pranai and his team • Conversations are saved locally
                    </p>
                </div>
            </div>
        </>
    );
}

export default AIChatPanel;
