// lib/rag/gemini.ts - Gemini API client for embeddings and chat

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generate embeddings for text strings
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
        const response = await ai.models.embedContent({
            model: 'gemini-embedding-001',
            contents: texts,
            config: {
                taskType: 'SEMANTIC_SIMILARITY'
            }
        });

        return response.embeddings?.map(e => e.values || []) || [];
    } catch (error) {
        console.error('Error generating embeddings:', error);
        throw error;
    }
}

// Single embedding for a query
export async function generateQueryEmbedding(text: string): Promise<number[]> {
    const embeddings = await generateEmbeddings([text]);
    return embeddings[0] || [];
}

// Generate chat response from Gemini
export async function generateChatResponse(
    systemPrompt: string,
    userMessage: string,
    context: string
): Promise<string> {
    try {
        const fullPrompt = `${systemPrompt}

## Relevant Context:
${context}

## User Question:
${userMessage}

## Your Response:`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return response.text || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error) {
        console.error('Error generating chat response:', error);
        throw error;
    }
}

/**
 * System prompt for the academic assistant
 */
export const SYSTEM_PROMPT = `You are an AI academic advisor for Penn State World Campus students. You help students with:
- Understanding course requirements and prerequisites
- Exploring major and minor options
- Planning their General Education (GenEd) requirements
- Finding courses that overlap between programs

CRITICAL INSTRUCTIONS:
1. ALWAYS use the information from the "Relevant Context" section below to answer questions
2. When the context contains specific numbers (like "40 majors" or "20 minors"), USE THOSE EXACT NUMBERS
3. If asked "how many" of something, look for summary documents in the context that list totals
4. READ ALL the context documents - important information may be in any of them
5. Do NOT say you don't have information if it's actually in the context below

Guidelines:
1. Be helpful, accurate, and concise
2. When mentioning courses, use the format "DEPT NNN" (e.g., "CMPSC 131")
3. Only say you're unsure if the information is truly not in the provided context
4. Reference specific details from the context when answering
5. If the user has shared their academic progress, personalize your advice

You have access to Penn State course catalog data, major/minor requirements, and GenEd requirements.`;
