'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { sendChatMessage } from '@/app/actions/chat';
import type { ChatMessage as ChatMessageType, UserContext } from '@/lib/rag/types';

interface ChatInterfaceProps {
    userContext?: UserContext;
}

/**
 * Floating chat widget component
 */
export default function ChatInterface({ userContext = {} }: ChatInterfaceProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle sending a message
    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        // Add user message
        const userMessage: ChatMessageType = {
            role: 'user',
            content: trimmedInput,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Send to server and get response
            const response = await sendChatMessage(trimmedInput, messages, userContext);
            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, something went wrong. Please try again.",
                timestamp: Date.now()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Welcome message
    const welcomeMessage: ChatMessageType = {
        role: 'assistant',
        content: "👋 Hi! I'm your Penn State academic assistant. I can help you with:\n\n• Course information and prerequisites\n• Major and minor requirements\n• General Education (GenEd) planning\n• Finding courses that overlap between programs\n\nHow can I help you today?",
        timestamp: Date.now()
    };

    // Chat window size classes
    const windowSizeClasses = isExpanded
        ? 'w-[500px] h-[600px]'
        : 'w-[380px] h-[500px]';

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`${windowSizeClasses} bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 flex flex-col mb-4 transition-all duration-200`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Academic Assistant</h3>
                                <p className="text-[10px] text-zinc-400">Powered by Gemini AI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                                aria-label={isExpanded ? 'Minimize' : 'Maximize'}
                            >
                                {isExpanded ? (
                                    <Minimize2 className="w-4 h-4 text-zinc-400" />
                                ) : (
                                    <Maximize2 className="w-4 h-4 text-zinc-400" />
                                )}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <ChatMessage message={welcomeMessage} />
                        )}

                        {/* Chat messages */}
                        {messages.map((msg, idx) => (
                            <ChatMessage key={idx} message={msg} />
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start mb-3">
                                <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-800 rounded-b-2xl">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about courses, majors, GenEd..."
                                className="flex-1 bg-zinc-700 text-white text-sm rounded-xl px-4 py-2.5 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-xl transition-colors"
                                aria-label="Send message"
                            >
                                <Send className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {/* Context indicator */}
                        {userContext.majorId && (
                            <div className="mt-2 text-[10px] text-zinc-500 truncate">
                                📚 Context: {userContext.majorName || userContext.majorId}
                                {userContext.completedCourses?.length ? ` • ${userContext.completedCourses.length} courses` : ''}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${isOpen
                        ? 'bg-zinc-700 hover:bg-zinc-600'
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                    }`}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>
        </div>
    );
}
