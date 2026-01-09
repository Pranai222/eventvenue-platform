"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Send, Bot, User, Loader2, Sparkles, X } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface AIChatModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const QUICK_QUESTIONS = [
    "Who created you?",
    "How do I book a venue?",
    "What technologies are used?",
    "How does the points system work?",
];

export function AIChatModal({ open, onOpenChange }: AIChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hello! 👋 I'm the EventVenue Assistant, created by **Pranai and his team**. How can I help you today?\n\nYou can ask me about booking venues, events, platform features, or the technologies we use!",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: messageText.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Prepare chat history (exclude welcome message)
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
                    chatHistory,
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
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content:
                    "I'm having trouble connecting right now. Please try again or contact pranaib20@gmail.com",
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

    // Format message content with basic markdown
    const formatContent = (content: string) => {
        return content
            .split("\n")
            .map((line, i) => {
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                // Numbered lists
                if (/^\d+\./.test(line)) {
                    return `<div class="ml-4">${line}</div>`;
                }
                // Bullet points
                if (line.startsWith("- ")) {
                    return `<div class="ml-4">• ${line.substring(2)}</div>`;
                }
                return line;
            })
            .join("<br/>");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-purple-500/10">
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-gradient-to-r from-primary to-purple-500">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <span>EventVenue Assistant</span>
                        <span className="text-xs font-normal text-muted-foreground ml-auto mr-6">
                            Powered by AI
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === "user"
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
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${message.role === "user"
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
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Quick questions */}
                {messages.length === 1 && (
                    <div className="px-4 pb-2">
                        <p className="text-xs text-muted-foreground mb-2">
                            Quick questions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleQuickQuestion(q)}
                                    className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 border-t bg-background/95 backdrop-blur"
                >
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about EventVenue..."
                            disabled={isLoading}
                            className="flex-1"
                            maxLength={1000}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AIChatModal;
