'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Sparkles, Plus, SendHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageToggle from '@/components/PageToggle';
import PageTransition from '@/components/PageTransition';
import { sendChatMessage } from '@/app/actions/chat';
import type { ChatMessage, UserContext } from '@/lib/rag/types';
import { cn } from '@/lib/utils';

/**
 * Chat Page - Matching Homepage UI Style with Hero -> Chat Transition
 */
export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Context (could be expanded later)
    const [userContext] = useState<UserContext>({});

    // Scroll handling
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom, isLoading]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Handle sending a message
    const handleSend = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        // Transition UI state immediately
        if (!hasStarted) setHasStarted(true);

        const userMessage: ChatMessage = {
            role: 'user',
            content: trimmedInput,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
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
            // Keep focus on input for rapid chatting
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    // Start a fresh chat
    const handleNewChat = () => {
        setMessages([]);
        setHasStarted(false);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Suggested prompts with icons
    const suggestedPrompts = [
        { title: "Prerequisites", text: "What are the prerequisites for CMPSC 461?", icon: "📚" },
        { title: "Minor Overlaps", text: "Which minors overlap with Software Engineering?", icon: "🔄" },
        { title: "GenEd Help", text: "Explain the GenEd requirements", icon: "🎓" },
        { title: "Course Types", text: "What is an interdomain course?", icon: "💡" }
    ];

    return (
        <PageTransition>
            <div className="flex flex-col h-screen bg-white overflow-hidden">
                {/* Fixed Top Navigation */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
                    <PageToggle />
                </div>

                {/* New Chat Button */}
                <div
                    className={cn(
                        "absolute top-6 right-6 z-50 transition-all duration-500",
                        hasStarted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                    )}
                >
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full 
                                 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 
                                 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Chat</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative w-full max-w-3xl mx-auto px-4 sm:px-6 h-full">

                    {/* Centered Hero Header */}
                    <div
                        className={cn(
                            "transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] absolute w-full text-center",
                            hasStarted
                                ? "top-0 opacity-0 pointer-events-none -translate-y-10 scale-95"
                                : "top-[15%] opacity-100 translate-y-0 scale-100"
                        )}
                    >
                        <div className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <Sparkles className="w-4 h-4 mr-2" />
                            <span className="text-sm font-semibold">AI Academic Advisor</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                            How can I help you today?
                        </h1>
                        <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
                            Ask about course requirements, explore majors, or plan your GenEds.
                        </p>
                    </div>

                    {/* Messages Scroll Area */}
                    <div
                        ref={scrollAreaRef}
                        className={cn(
                            "flex-1 overflow-y-auto no-scrollbar pt-32 pb-32 transition-opacity duration-700",
                            hasStarted ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                    >
                        <div className="space-y-8 py-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                                >
                                    {msg.role === 'user' ? (
                                        <div className="flex justify-end">
                                            <div className="max-w-[85%] bg-gray-100 rounded-2xl rounded-tr-sm px-6 py-4 text-gray-900 shadow-sm">
                                                <p className="text-base leading-relaxed">{msg.content}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4 group">
                                            <div className="flex-shrink-0 w-8 h-8 mt-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="prose prose-gray max-w-none">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ children }) => <p className="mb-4 last:mb-0 text-gray-800 leading-7">{children}</p>,
                                                            ul: ({ children }) => <ul className="list-disc ml-4 mb-4 space-y-2 marker:text-gray-400">{children}</ul>,
                                                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-4 space-y-2 marker:text-gray-400">{children}</ol>,
                                                            li: ({ children }) => <li className="text-gray-800 pl-1">{children}</li>,
                                                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                                            code: ({ children }) => (
                                                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800 border border-gray-200">{children}</code>
                                                            ),
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex-shrink-0 w-8 h-8 mt-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 py-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm font-medium">Thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div
                        className={cn(
                            "absolute w-full transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
                            hasStarted
                                ? "bottom-6 translate-y-0"
                                : "top-[50%] -translate-y-[40%]"
                        )}
                    >
                        <div className="relative group max-w-2xl mx-auto">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask follow-up questions..."
                                className={cn(
                                    "w-full pl-6 pr-14 text-lg text-gray-900 bg-white border rounded-full transition-all duration-300 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50",
                                    hasStarted
                                        ? "py-4 border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                                        : "py-5 border-gray-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_20px_-3px_rgba(0,0,0,0.1)] hover:border-gray-300"
                                )}
                                disabled={isLoading}
                            />

                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-200",
                                    input.trim() && !isLoading
                                        ? "bg-gray-900 text-white hover:bg-gray-800 shadow-md transform hover:scale-105"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-0"
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <SendHorizontal className="w-5 h-5 ml-0.5" />
                                )}
                            </button>
                        </div>

                        {/* Suggested Prompts - Fade out when started */}
                        {!hasStarted && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                {suggestedPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setInput(prompt.text);
                                            inputRef.current?.focus();
                                        }}
                                        className="text-left p-4 bg-white border border-gray-100 rounded-xl
                                                 hover:bg-gray-50 hover:border-gray-200 hover:shadow-md
                                                 transition-all duration-200 group relative overflow-hidden"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl pt-0.5 select-none grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                                                {prompt.icon}
                                            </span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-sm mb-1">{prompt.title}</h3>
                                                <p className="text-xs text-gray-500 line-clamp-1">{prompt.text}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Footer / Helper Text */}
                        <div className={cn(
                            "text-center mt-6 transition-all duration-300",
                            hasStarted ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"
                        )}>
                            <p className="text-xs font-medium text-gray-400 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                                <Sparkles className="w-3 h-3" /> Powered by Gemini AI
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
