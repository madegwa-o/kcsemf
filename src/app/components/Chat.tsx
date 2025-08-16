'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Search, Info, HelpCircle } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    context?: string // Add context field for RAG information
    noContext?: boolean // Flag for when no context is found
    relevance?: string // Relevance indicator (high/medium/low)
    avgScore?: string // Average relevance score
    dataSource?: string // Data source used (KCSE Mock Questions or RAG Knowledge Base)
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content:
                "Hello!",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [showContext, setShowContext] = useState<{[key: string]: boolean}>({})
    const [showHelp, setShowHelp] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const toggleContext = (messageId: string) => {
        setShowContext(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }))
    }

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
        setIsSearching(true)

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
                timestamp: new Date(),
                context: data.context, // Store context if provided
                noContext: data.noContext, // Store noContext flag
                relevance: data.relevance, // Store relevance indicator
                avgScore: data.avgScore, // Store average relevance score
                dataSource: data.dataSource // Store data source
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
            setIsSearching(false)
        }
    }

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-background text-foreground border-b border-border p-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-background border-b border-border p-4">
                <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-primary" />
                    <h1 className="text-lg font-semibold">RAG Knowledge Assistant</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" />
                        Available Topics
                    </button>
                    <div className="text-sm text-muted-foreground">
                        Powered by MadegwaTech • LangChain
                    </div>
                </div>
            </div>

            {/* Help Panel */}
            {showHelp && (
                <div className="bg-muted/50 border-b border-border p-4">
                    <h3 className="font-medium mb-2">Available Data Sources:</h3>
                    
                    <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2 text-blue-600">📚 KCSE Mock Questions</h4>
                        <p className="text-xs text-muted-foreground mb-2">Ask for specific questions, practice problems, or exam materials</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div className="bg-background p-2 rounded border">• Mathematics Questions</div>
                            <div className="bg-background p-2 rounded border">• English Questions</div>
                            <div className="bg-background p-2 rounded border">• Science Questions</div>
                            <div className="bg-background p-2 rounded border">• History Questions</div>
                            <div className="bg-background p-2 rounded border">• Geography Questions</div>
                            <div className="bg-background p-2 rounded border">• Business Questions</div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-sm mb-2 text-green-600">🎓 RAG Knowledge Base</h4>
                        <p className="text-xs text-muted-foreground mb-2">Ask about general Kenyan education topics and concepts</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div className="bg-background p-2 rounded border">• Kenyan Education System (8-4-4)</div>
                            <div className="bg-background p-2 rounded border">• Competency-Based Curriculum (CBC)</div>
                            <div className="bg-background p-2 rounded border">• Primary Education (KCPE)</div>
                            <div className="bg-background p-2 rounded border">• Secondary Education (KCSE)</div>
                            <div className="bg-background p-2 rounded border">• University Education</div>
                            <div className="bg-background p-2 rounded border">• TVET & Technical Education</div>
                        </div>
                    </div>
                </div>
            )}

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
                                    : message.noContext 
                                        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-bl-none'
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
                                <div className="flex-1">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                    
                                    {/* Show context toggle for assistant messages */}
                                    {message.role === 'assistant' && message.context && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => toggleContext(message.id)}
                                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                                            >
                                                <Info className="w-3 h-3" />
                                                {showContext[message.id] ? 'Hide' : 'Show'} knowledge source
                                            </button>
                                            {message.dataSource && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                    {message.dataSource}
                                                </span>
                                            )}
                                            {message.relevance && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    message.relevance === 'high' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : message.relevance === 'medium'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {message.relevance} relevance
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Display context when expanded */}
                                    {message.role === 'assistant' && message.context && showContext[message.id] && (
                                        <div className="mt-3 p-3 bg-muted/50 rounded border-l-2 border-primary/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Knowledge source:
                                                </p>
                                                {message.avgScore && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Score: {message.avgScore}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {message.context}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <p
                                        className={`text-xs mt-2 ${
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

                {isSearching && (
                    <div className="flex justify-start">
                        <div className="bg-card text-card-foreground rounded-lg rounded-bl-none border border-border px-4 py-2 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-primary" />
                                <span className="text-sm text-muted-foreground">
                                    Searching knowledge base...
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-card text-card-foreground rounded-lg rounded-bl-none border border-border px-4 py-2 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-primary" />
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">
                                    Generating response...
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
                        placeholder="Ask about Kenyan education, curriculum, or other topics in my knowledge base..."
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
                    This assistant only answers based on its RAG knowledge base
                </p>
            </div>
        </div>
    )
}
