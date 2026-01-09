// AI Service - Generates intelligent answers from knowledge
// Uses Groq (primary) and Gemini (secondary) with retry logic for rate limits

import { retrieveKnowledge } from "./retrieval";
import { AI_SYSTEM_PROMPT } from "./ai-system-prompt";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface AIResponse {
    success: boolean;
    message: string;
    provider: "groq" | "gemini" | "fallback";
    suggestions?: string[]; // Follow-up question suggestions
}

// Sleep helper for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Summarize long conversations to fit context window
function summarizeHistory(history: ChatMessage[]): string {
    if (history.length <= 6) return "";

    const older = history.slice(0, -6);
    const topics = older.map(m => {
        const words = m.content.split(' ').slice(0, 10).join(' ');
        return `${m.role}: ${words}...`;
    }).join('\n');

    return `\n[Earlier in this conversation, you discussed:\n${topics}]\n`;
}

// Extract follow-up suggestions from response
function extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];

    // Look for "Would you like to know about" patterns
    const patterns = [
        /Would you (?:also )?like to know about[:\s]*\n?([-•*].+(?:\n[-•*].+)*)/i,
        /Related:?\s*(?:You might also be interested in:?)?\n?([-•*].+(?:\n[-•*].+)*)/i,
        /\*\*Would you like to know(?:[^*]+)\*\*/gi
    ];

    for (const pattern of patterns) {
        const match = response.match(pattern);
        if (match) {
            const items = match[1]?.split(/\n/).filter(line =>
                line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')
            ).map(line => line.replace(/^[-•*\s]+/, '').trim()).filter(Boolean);
            if (items) suggestions.push(...items);
        }
    }

    return suggestions.slice(0, 3);
}

// Generate with Groq (PRIMARY - Free, High Rate Limits, Stable)
async function generateWithGroq(userMessage: string, chatHistory: ChatMessage[]): Promise<AIResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    console.log(`[GROQ] API Key check: exists=${!!apiKey}, length=${apiKey?.length || 0}`);
    if (!apiKey || apiKey.length < 20) throw new Error("Groq API key not configured");

    // Retrieve relevant knowledge with more chunks for better context
    const retrieved = retrieveKnowledge(userMessage, 7);
    console.log(`[GROQ] RAG: Intent=${retrieved.intent}, Chunks=${retrieved.chunks.length}`);

    // Build conversation summary for long chats
    const historySummary = summarizeHistory(chatHistory);

    // Build the system prompt with knowledge context
    const systemPrompt = `${AI_SYSTEM_PROMPT}

## RELEVANT INFORMATION:
${retrieved.context}

## INSTRUCTION:
Answer the user's question using the information above. Use proper markdown formatting with **bold**, numbered lists, bullet points, and paths in backticks.`;

    // Send recent history for context
    const recentHistory = chatHistory.slice(-6);
    const messages = [
        { role: "system", content: systemPrompt },
        ...recentHistory.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage }
    ];

    // Retry logic for rate limits
    const maxRetries = 3;
    let lastError = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[GROQ] Attempt ${attempt}/${maxRetries} - calling API...`);
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                }),
            });

            console.log(`[GROQ] Response status: ${response.status}`);

            if (response.status === 429) {
                lastError = "Rate limited";
                console.log(`[GROQ] Rate limited, attempt ${attempt}/${maxRetries}, waiting...`);
                await sleep(attempt * 2000);
                continue;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log(`[GROQ] Error response:`, JSON.stringify(errorData));
                throw new Error(`Groq API ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (!text) {
                console.log(`[GROQ] Empty response data:`, JSON.stringify(data));
                throw new Error("Empty response from Groq");
            }

            console.log(`[GROQ] Success! Response length: ${text.length} chars`);
            return { success: true, message: text, provider: "groq" };
        } catch (error: any) {
            lastError = error.message;
            console.log(`[GROQ] Attempt ${attempt} failed:`, error.message);
            if (attempt < maxRetries) {
                await sleep(attempt * 1000);
            }
        }
    }

    throw new Error(`Groq failed after ${maxRetries} attempts: ${lastError}`);
}

// Generate with Gemini (SECONDARY FALLBACK)
async function generateWithGemini(userMessage: string, chatHistory: ChatMessage[]): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.length < 20) throw new Error("Gemini API key not configured");

    // Retrieve relevant knowledge
    const retrieved = retrieveKnowledge(userMessage, 5);
    console.log(`RAG (Gemini fallback): Intent=${retrieved.intent}, Chunks=${retrieved.chunks.length}`);

    const prompt = `${AI_SYSTEM_PROMPT}

---

## KNOWLEDGE FROM DATABASE:
${retrieved.context}

---

USER'S QUESTION: "${userMessage}"

Generate a helpful, conversational response with beautiful formatting.`;

    const contents = chatHistory.length === 0
        ? [{ role: "user", parts: [{ text: prompt }] }]
        : [
            { role: "user", parts: [{ text: prompt }] },
            { role: "model", parts: [{ text: "I'll help you with that!" }] },
            ...chatHistory.slice(-3).map(m => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }]
            })),
            { role: "user", parts: [{ text: userMessage }] }
        ];

    // Retry logic for rate limits
    const maxRetries = 3;
    let lastError = "";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents,
                        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                    }),
                }
            );

            if (response.status === 429) {
                lastError = "Rate limited";
                console.log(`Gemini rate limited, attempt ${attempt}/${maxRetries}, waiting...`);
                await sleep(attempt * 2000);
                continue;
            }

            if (!response.ok) throw new Error(`Gemini API ${response.status}`);

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Empty response from Gemini");

            return { success: true, message: text, provider: "gemini" };
        } catch (error: any) {
            lastError = error.message;
            if (attempt < maxRetries) {
                await sleep(attempt * 1000);
            }
        }
    }

    throw new Error(`Gemini failed after ${maxRetries} attempts: ${lastError}`);
}


// Intelligent answer synthesis (when AI APIs fail)
function synthesizeAnswer(userMessage: string): AIResponse {
    const retrieved = retrieveKnowledge(userMessage, 4);
    const msg = userMessage.toLowerCase();

    // No knowledge found
    if (retrieved.chunks.length === 0) {
        return {
            success: true,
            message: `Hey there! 👋 I'm the EventVenue Assistant, created by Pranai and his team.

I'd love to help you! Here's what I can assist with:

**For Booking:**
- Finding and booking venues for any occasion
- Getting event tickets
- Using your 2000 free signup points

**For Vendors:**
- Listing your venue or event
- Managing bookings and earnings

**Need Help?**
Drop an email to pranaib20@gmail.com

What would you like to know about?`,
            provider: "fallback",
        };
    }

    // Extract key info from chunks
    const chunks = retrieved.chunks;
    const mainInfo = chunks[0];

    // Synthesize based on question type
    let response = "";

    // Greeting / Who are you
    if (msg.match(/hi|hello|hey|who are you/)) {
        response = `Hey! 👋 I'm the EventVenue AI Assistant, built by Pranai and his team! 

I'm here to help you with booking venues, getting event tickets, and managing your points. Whether you're a user looking to book something awesome or a vendor wanting to list your space - I've got you covered!

What can I help you with today?`;
    }
    // How to do something
    else if (msg.includes("how to") || msg.includes("how do") || msg.includes("how can")) {
        const steps = mainInfo.content.match(/\d\.\s.+/g) || [];
        if (steps.length > 0) {
            response = `Great question! Here's how you can do that:\n\n`;
            steps.slice(0, 6).forEach(step => {
                response += `${step}\n`;
            });
            if (mainInfo.content.includes("PATH:")) {
                const pathMatch = mainInfo.content.match(/PATH:\s*(\S+)/);
                if (pathMatch) response += `\n📍 **Go to:** ${pathMatch[1]}`;
            }
        } else {
            response = `Here's what you need to know about that:\n\n${summarizeContent(mainInfo.content)}`;
        }
    }
    // What is something
    else if (msg.includes("what is") || msg.includes("what are") || msg.includes("tell me about")) {
        response = `Let me explain that for you! 😊\n\n${summarizeContent(mainInfo.content)}`;
    }
    // Where questions
    else if (msg.includes("where")) {
        const pathMatch = mainInfo.content.match(/PATH:\s*(\S+)/);
        if (pathMatch) {
            response = `You can find that at **${pathMatch[1]}** 📍\n\n${summarizeContent(mainInfo.content)}`;
        } else {
            response = `Here's where to look:\n\n${summarizeContent(mainInfo.content)}`;
        }
    }
    // Help / Support / Contact
    else if (msg.match(/help|support|contact|issue|problem|lost/)) {
        response = `I'm here to help! 🤝\n\n`;
        if (msg.includes("lost") || msg.includes("missing")) {
            response += `**For lost/missing points:**\n`;
            response += `1. First, check your points history at /user/points-history\n`;
            response += `2. If they're really missing, email **pranaib20@gmail.com**\n`;
            response += `3. Or go to /user/credits and click "Request Free Credits"\n\n`;
            response += `The team usually responds within 24-48 hours and will investigate!`;
        } else {
            response += `**Best ways to get help:**\n`;
            response += `- 📧 Email: **pranaib20@gmail.com** (admin team responds)\n`;
            response += `- 💬 Ask me anything here!\n`;
            response += `- 📄 Check the Help page at /help\n\n`;
            response += `What specifically do you need help with?`;
        }
    }
    // Points related
    else if (msg.match(/points?|credits?|buy|purchase/)) {
        if (msg.includes("buy") || msg.includes("purchase") || msg.includes("get more")) {
            response = `Want more points? Here's how! 💰\n\n`;
            response += `1. Go to your dashboard or /user/credits\n`;
            response += `2. Click "Buy Credits"\n`;
            response += `3. Enter amount and pay via PayPal\n`;
            response += `4. Admin approves → Points added!\n\n`;
            response += `**Tip:** You already have 2000 free points from signup!`;
        } else if (msg.includes("use") || msg.includes("spend")) {
            response = `Using points is easy! At checkout, you'll see three options:\n\n`;
            response += `- **Full Points** - Pay entirely with your balance\n`;
            response += `- **Full PayPal** - Pay with card/PayPal\n`;
            response += `- **Hybrid** - Mix both! Use some points, pay rest with PayPal\n\n`;
            response += `Super flexible for any budget! 🎉`;
        } else {
            response = `Great question about points! 💰\n\n`;
            response += `${summarizeContent(mainInfo.content)}`;
        }
    }
    // Vendor related
    else if (msg.includes("vendor")) {
        if (msg.includes("become") || msg.includes("register") || msg.includes("start")) {
            response = `Want to become a vendor? Awesome! 🏪\n\n`;
            response += `1. Go to /signup and select "VENDOR"\n`;
            response += `2. Fill in your business details\n`;
            response += `3. Submit and wait for admin approval (24-48 hrs)\n`;
            response += `4. Once approved, start listing venues and events!\n\n`;
            response += `You'll have your own dashboard to manage everything.`;
        } else if (msg.includes("withdraw") || msg.includes("paid") || msg.includes("money")) {
            response = `Here's how you get your money! 💵\n\n`;
            response += `1. Check your earnings in Vendor Dashboard\n`;
            response += `2. Go to Withdrawals section\n`;
            response += `3. Click "Request Withdrawal"\n`;
            response += `4. Enter amount and submit\n`;
            response += `5. Admin approves → Money sent to your account!\n\n`;
            response += `Make sure your payment details are updated in settings!`;
        } else {
            response = `Here's what you need to know about vendors:\n\n${summarizeContent(mainInfo.content)}`;
        }
    }
    // Booking related
    else if (msg.match(/book|reserve|venue|event|ticket/)) {
        if (msg.includes("venue")) {
            response = `Booking a venue is simple! 🏠\n\n`;
            response += `1. Browse venues at /venues\n`;
            response += `2. Click one you like to see details\n`;
            response += `3. Check availability calendar\n`;
            response += `4. Select your dates and click "Book Now"\n`;
            response += `5. Choose payment (Points/PayPal/Both)\n`;
            response += `6. Confirm and you're done! 🎉\n\n`;
            response += `Remember, you have 2000 free points to use!`;
        } else if (msg.includes("event") || msg.includes("ticket")) {
            response = `Getting event tickets is easy! 🎫\n\n`;
            response += `1. Browse events at /events\n`;
            response += `2. Click on the event you want\n`;
            response += `3. Choose your seat category (VIP, General, etc.)\n`;
            response += `4. Select number of tickets\n`;
            response += `5. Pay with Points or PayPal\n`;
            response += `6. Get your confirmation! 🎉`;
        } else {
            response = `${summarizeContent(mainInfo.content)}`;
        }
    }
    // Default - synthesize from main chunk
    else {
        response = `${summarizeContent(mainInfo.content)}`;
    }

    // Add related topics if helpful
    if (chunks.length > 1 && response.length < 600) {
        response += `\n\n💡 **Related:** ${chunks.slice(1, 3).map(c => c.title).join(", ")}`;
    }

    return { success: true, message: response, provider: "fallback" };
}

// Helper to summarize content naturally
function summarizeContent(content: string): string {
    // Remove PATH and technical markers
    let clean = content
        .replace(/PATH:\s*\S+/g, '')
        .replace(/STEPS?:/g, '')
        .replace(/WHAT YOU'LL SEE:/g, 'You\'ll see:')
        .replace(/HOW IT WORKS:/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Keep it reasonable length
    if (clean.length > 500) {
        const sentences = clean.split(/[.!?\n]/).filter(s => s.trim());
        clean = sentences.slice(0, 6).join('. ').trim();
        if (!clean.endsWith('.') && !clean.endsWith('!') && !clean.endsWith('?')) {
            clean += '.';
        }
    }

    return clean;
}

// Main export - Groq PRIMARY, Gemini SECONDARY
export async function generateAIResponse(
    userMessage: string,
    chatHistory: ChatMessage[] = []
): Promise<AIResponse> {
    console.log(`AI Request: "${userMessage}"`);

    // Try Groq first (FREE, HIGH RATE LIMITS, STABLE)
    try {
        return await generateWithGroq(userMessage, chatHistory);
    } catch (e1: any) {
        console.log("Groq failed:", e1.message);

        // Try Gemini as fallback
        try {
            return await generateWithGemini(userMessage, chatHistory);
        } catch (e2: any) {
            console.log("Gemini failed:", e2.message);

            // Last resort: synthesize from knowledge base
            return synthesizeAnswer(userMessage);
        }
    }
}

export default generateAIResponse;
