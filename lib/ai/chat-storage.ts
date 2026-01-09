// Chat Storage - Persists conversations in localStorage
// Allows users to continue conversations across sessions

export interface StoredMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    messages: StoredMessage[];
    createdAt: string;
    updatedAt: string;
    title: string; // Auto-generated from first message
}

const STORAGE_KEY = "eventvenue_ai_chat";
const MAX_SESSIONS = 10;
const MAX_MESSAGES_PER_SESSION = 50;

// Get all chat sessions
export function getChatSessions(): ChatSession[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const sessions = JSON.parse(stored) as ChatSession[];
        // Sort by most recent
        return sessions.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    } catch (e) {
        console.error("Error loading chat sessions:", e);
        return [];
    }
}

// Get a specific session by ID
export function getChatSession(sessionId: string): ChatSession | null {
    const sessions = getChatSessions();
    return sessions.find(s => s.id === sessionId) || null;
}

// Get the most recent session or create new one
export function getOrCreateCurrentSession(): ChatSession {
    const sessions = getChatSessions();

    // Return most recent session if it exists and is recent (less than 1 hour old)
    if (sessions.length > 0) {
        const latest = sessions[0];
        const hourAgo = Date.now() - (60 * 60 * 1000);
        if (new Date(latest.updatedAt).getTime() > hourAgo) {
            return latest;
        }
    }

    // Create new session
    return createNewSession();
}

// Create a new chat session
export function createNewSession(): ChatSession {
    const session: ChatSession = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: "New Conversation"
    };

    saveSessions([session, ...getChatSessions().slice(0, MAX_SESSIONS - 1)]);
    return session;
}

// Add message to a session
export function addMessage(sessionId: string, message: StoredMessage): ChatSession | null {
    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return null;

    const session = sessions[sessionIndex];

    // Add message (limit to max)
    session.messages = [...session.messages.slice(-MAX_MESSAGES_PER_SESSION + 1), message];
    session.updatedAt = new Date().toISOString();

    // Auto-generate title from first user message
    if (session.title === "New Conversation" && message.role === "user") {
        session.title = message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "");
    }

    sessions[sessionIndex] = session;
    saveSessions(sessions);

    return session;
}

// Clear a session's messages
export function clearSession(sessionId: string): ChatSession | null {
    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) return null;

    const session = sessions[sessionIndex];
    session.messages = [];
    session.title = "New Conversation";
    session.updatedAt = new Date().toISOString();

    sessions[sessionIndex] = session;
    saveSessions(sessions);

    return session;
}

// Delete a session
export function deleteSession(sessionId: string): void {
    const sessions = getChatSessions().filter(s => s.id !== sessionId);
    saveSessions(sessions);
}

// Save sessions to localStorage
function saveSessions(sessions: ChatSession[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error("Error saving chat sessions:", e);
        // If storage is full, remove oldest sessions
        if (sessions.length > 1) {
            saveSessions(sessions.slice(0, Math.floor(sessions.length / 2)));
        }
    }
}

// Convert stored messages to chat history format for API
export function toApiHistory(messages: StoredMessage[]): { role: "user" | "assistant"; content: string }[] {
    return messages.map(m => ({
        role: m.role,
        content: m.content
    }));
}

// Check if storage is available
export function isStorageAvailable(): boolean {
    if (typeof window === "undefined") return false;

    try {
        const testKey = "__storage_test__";
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}
