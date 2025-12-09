'use server'

import { processQuery, processSimpleQuery, isRAGReady } from '@/lib/rag/ragEngine';
import type { ChatMessage, UserContext } from '@/lib/rag/types';

// Re-export types for client components
export type { ChatMessage, UserContext };

/**
 * Send a chat message and get a response from the AI assistant
 * @param message User's message
 * @param history Previous messages in the conversation
 * @param context User's academic context
 * @returns Assistant's response message
 */
export async function sendChatMessage(
    message: string,
    history: ChatMessage[],
    context: UserContext
): Promise<ChatMessage> {
    try {
        // Check if RAG is available
        const ragReady = await isRAGReady();

        let responseText: string;

        if (ragReady) {
            // Use full RAG pipeline
            const result = await processQuery(message, context);
            responseText = result.answer;
        } else {
            // Fallback to simple Gemini query
            console.log('RAG not ready, using simple query mode');
            responseText = await processSimpleQuery(message, context);
        }

        return {
            role: 'assistant',
            content: responseText,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('Error in sendChatMessage:', error);

        return {
            role: 'assistant',
            content: "I'm sorry, I encountered an error processing your request. Please try again.",
            timestamp: Date.now()
        };
    }
}

/**
 * Check if the chat system is ready
 */
export async function checkChatHealth(): Promise<{
    ready: boolean;
    ragEnabled: boolean;
    message: string;
}> {
    try {
        const ragReady = await isRAGReady();

        return {
            ready: true,
            ragEnabled: ragReady,
            message: ragReady
                ? 'Chat is ready with full RAG capabilities'
                : 'Chat is ready in simple mode (Pinecone not initialized)'
        };
    } catch (error) {
        return {
            ready: false,
            ragEnabled: false,
            message: 'Chat system is not available'
        };
    }
}
