'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content:
                "Hello! I'm your AI assistant powered by LangChain. How can I help you today?",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: input.trim(),
                    history: messages.slice(-10)
                })
            })

            if (!response.ok) throw new Error('Failed to get response')

            const data = await response.json()

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message || 'Sorry, I encountered an error.',
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date()
                }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background text-foreground border-b border-border p-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-background border-b border-border p-4">

            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg shadow-sm ${
                                message.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-card text-card-foreground rounded-bl-none border border-border'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                {message.role === 'assistant' && (
                                    <Bot className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                                )}
                                {message.role === 'user' && (
                                    <User className="w-4 h-4 mt-1 flex-shrink-0 text-primary-foreground/80" />
                                )}
                                <div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 ${
                                            message.role === 'user'
                                                ? 'text-primary-foreground/70'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-card text-card-foreground rounded-lg rounded-bl-none border border-border px-4 py-2 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-primary" />
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border bg-background p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 border border-border rounded-lg px-4 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Send
                    </button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    Powered by MadegwaTech • LangChain
                </p>
            </div>
        </div>
    )
}
