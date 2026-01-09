// Advanced Retrieval System for RAG
// Smart keyword matching with synonym expansion and intent detection

import { KNOWLEDGE_BASE, KnowledgeChunk } from "./knowledge-base";

interface RetrievalResult {
    chunks: KnowledgeChunk[];
    context: string;
    intent: string;
}

// Synonym mapping for better matching
const SYNONYMS: Record<string, string[]> = {
    "book": ["reserve", "booking", "reservation", "schedule"],
    "buy": ["purchase", "get", "acquire", "order"],
    "points": ["credits", "balance", "currency", "money"],
    "venue": ["location", "place", "hall", "space", "room"],
    "event": ["show", "concert", "party", "gathering", "function"],
    "ticket": ["pass", "entry", "admission", "seat"],
    "help": ["support", "assist", "contact", "issue", "problem"],
    "vendor": ["seller", "owner", "host", "organizer", "business"],
    "admin": ["administrator", "management", "support team"],
    "login": ["sign in", "log in", "access", "enter"],
    "signup": ["register", "sign up", "create account", "join"],
    "withdraw": ["payout", "cash out", "get paid", "withdrawal"],
    "lost": ["missing", "gone", "disappeared", "not showing"],
    "cancel": ["cancellation", "refund", "return"],
};

// Intent patterns for better context
const INTENT_PATTERNS: Array<{ pattern: RegExp; intent: string; boostCategories: string[] }> = [
    { pattern: /how (do|can|to|should) i/i, intent: "how-to", boostCategories: ["user", "vendor", "faq"] },
    { pattern: /what (is|are|does|do)/i, intent: "explanation", boostCategories: ["about", "faq", "points"] },
    { pattern: /where (is|can|do)/i, intent: "navigation", boostCategories: ["navigation"] },
    { pattern: /(help|support|issue|problem|error|contact)/i, intent: "support", boostCategories: ["support", "faq"] },
    { pattern: /(lost|missing|gone|disappeared)/i, intent: "issue", boostCategories: ["support"] },
    { pattern: /vendor|sell|list|host|business/i, intent: "vendor", boostCategories: ["vendor"] },
    { pattern: /admin|approve|manage|setting/i, intent: "admin", boostCategories: ["admin"] },
    { pattern: /(book|reserve|attend)/i, intent: "booking", boostCategories: ["venue", "events", "user"] },
    { pattern: /(points?|credits?|balance|buy|purchase)/i, intent: "points", boostCategories: ["points", "user"] },
];

// Expand query with synonyms
function expandQuery(query: string): string[] {
    const words = query.toLowerCase().split(/\s+/);
    const expanded = new Set(words);

    for (const word of words) {
        // Add synonyms
        for (const [key, synonyms] of Object.entries(SYNONYMS)) {
            if (word.includes(key) || synonyms.some(s => word.includes(s))) {
                expanded.add(key);
                synonyms.forEach(s => expanded.add(s));
            }
        }
    }

    return Array.from(expanded);
}

// Detect query intent
function detectIntent(query: string): { intent: string; boostCategories: string[] } {
    for (const { pattern, intent, boostCategories } of INTENT_PATTERNS) {
        if (pattern.test(query)) {
            return { intent, boostCategories };
        }
    }
    return { intent: "general", boostCategories: [] };
}

// Calculate relevance score
function calculateScore(query: string, chunk: KnowledgeChunk, expandedWords: string[], boostCategories: string[]): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Keyword match (high weight)
    for (const keyword of chunk.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (queryLower.includes(keywordLower)) {
            score += 20; // Exact phrase match
        }
        for (const word of expandedWords) {
            if (keywordLower.includes(word) || word.includes(keywordLower)) {
                score += 8;
            }
        }
    }

    // Title match (medium weight)
    const titleLower = chunk.title.toLowerCase();
    for (const word of expandedWords) {
        if (word.length > 2 && titleLower.includes(word)) {
            score += 5;
        }
    }

    // Content match (lower weight)
    const contentLower = chunk.content.toLowerCase();
    for (const word of expandedWords) {
        if (word.length > 3 && contentLower.includes(word)) {
            score += 2;
        }
    }

    // Category boost based on intent
    if (boostCategories.includes(chunk.category)) {
        score *= 1.5;
    }

    // Exact query in content bonus
    if (contentLower.includes(queryLower)) {
        score += 25;
    }

    return score;
}

// Main retrieval function
export function retrieveKnowledge(query: string, maxChunks: number = 5): RetrievalResult {
    const expandedWords = expandQuery(query);
    const { intent, boostCategories } = detectIntent(query);

    // Score all chunks
    const scoredChunks = KNOWLEDGE_BASE.map(chunk => ({
        chunk,
        score: calculateScore(query, chunk, expandedWords, boostCategories)
    }));

    // Sort by score
    scoredChunks.sort((a, b) => b.score - a.score);

    // Get top relevant chunks
    const relevantChunks = scoredChunks
        .filter(sc => sc.score > 0)
        .slice(0, maxChunks)
        .map(sc => sc.chunk);

    // If no relevant chunks, get default ones based on intent
    if (relevantChunks.length === 0) {
        const defaults = getDefaultChunks(intent);
        return {
            chunks: defaults,
            context: buildContext(defaults),
            intent
        };
    }

    return {
        chunks: relevantChunks,
        context: buildContext(relevantChunks),
        intent
    };
}

// Get default chunks for unknown questions
function getDefaultChunks(intent: string): KnowledgeChunk[] {
    switch (intent) {
        case "support":
            return KNOWLEDGE_BASE.filter(c => c.id.includes("support"));
        case "vendor":
            return KNOWLEDGE_BASE.filter(c => c.id === "vendor-become" || c.id === "vendor-dashboard");
        case "admin":
            return KNOWLEDGE_BASE.filter(c => c.id === "admin-dashboard");
        case "points":
            return KNOWLEDGE_BASE.filter(c => c.id === "points-what" || c.id === "points-buy");
        default:
            return KNOWLEDGE_BASE.filter(c =>
                c.id === "about-platform" ||
                c.id === "faq-how-it-works" ||
                c.id === "support-contact"
            );
    }
}

// Build context string
function buildContext(chunks: KnowledgeChunk[]): string {
    if (chunks.length === 0) {
        return "No specific information found.";
    }

    let context = "RELEVANT KNOWLEDGE:\n\n";
    for (const chunk of chunks) {
        context += `### ${chunk.title}\n${chunk.content}\n\n`;
    }
    return context;
}

// Get category functions
export function getCategories(): string[] {
    return [...new Set(KNOWLEDGE_BASE.map(c => c.category))];
}

export function getChunksByCategory(category: string): KnowledgeChunk[] {
    return KNOWLEDGE_BASE.filter(c => c.category === category);
}

export default retrieveKnowledge;
