// API Route for AI Chat - Next.js App Router
import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, ChatMessage } from "@/lib/ai/ai-service";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, chatHistory = [] } = body as {
            message: string;
            chatHistory?: ChatMessage[];
        };

        // Validate input
        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { success: false, error: "Message is required" },
                { status: 400 }
            );
        }

        // Limit message length
        if (message.length > 1000) {
            return NextResponse.json(
                { success: false, error: "Message too long (max 1000 characters)" },
                { status: 400 }
            );
        }

        // Limit chat history to last 10 messages for context
        const trimmedHistory = chatHistory.slice(-10);

        // Generate AI response
        const response = await generateAIResponse(message, trimmedHistory);

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("AI Chat API error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate response. Please try again.",
                message: "I'm having trouble responding right now. Please try again or contact pranaib20@gmail.com for help.",
                provider: "error",
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check if AI is configured
export async function GET() {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    return NextResponse.json({
        configured: !!(groqKey || geminiKey),
        providers: {
            groq: !!groqKey,
            gemini: !!geminiKey,
        },
        debug: {
            groqKeyLength: groqKey?.length || 0,
            groqKeyPrefix: groqKey?.substring(0, 8) || "N/A",
            geminiKeyLength: geminiKey?.length || 0,
            geminiKeyPrefix: geminiKey?.substring(0, 8) || "N/A",
        }
    });
}
