'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '@/lib/rag/types';

interface ChatMessageProps {
    message: ChatMessageType;
}

/**
 * Individual chat message bubble component
 */
export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    // Format timestamp
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Detect and linkify course codes (e.g., "CMPSC 131")
    const processContent = (content: string) => {
        // Replace course codes with markdown links
        return content.replace(
            /\b([A-Z]{2,6})\s+(\d{1,3}[A-Z]?[WY]?)\b/g,
            '**$1 $2**'
        );
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                    }`}
            >
                {/* Message content */}
                <div className="text-sm leading-relaxed">
                    {isUser ? (
                        <p>{message.content}</p>
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                strong: ({ children }) => (
                                    <strong className="font-semibold text-blue-300">{children}</strong>
                                ),
                                code: ({ children }) => (
                                    <code className="bg-zinc-700 px-1 py-0.5 rounded text-xs">{children}</code>
                                ),
                                a: ({ href, children }) => (
                                    <a
                                        href={href}
                                        className="text-blue-400 hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {children}
                                    </a>
                                ),
                            }}
                        >
                            {processContent(message.content)}
                        </ReactMarkdown>
                    )}
                </div>

                {/* Timestamp */}
                <div
                    className={`text-[10px] mt-1 ${isUser ? 'text-blue-200' : 'text-zinc-500'
                        }`}
                >
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
}
