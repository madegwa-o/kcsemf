// app/api/chat/route.ts (for App Router) or pages/api/chat.ts (for Pages Router)

import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import {searchSimilarDocuments} from "@/lib/mongodb-rag";

// Initialize the LLM - FIXED: Changed from 'gpt-5-nano' to valid model
const llm = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo', // Valid OpenAI model
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
})

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

// Updated prompt template to enforce RAG-only responses
const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are a specialized AI assistant that ONLY answers questions based on the provided context from the RAG knowledge base. You must follow these strict rules:

1. ONLY use information from the provided context to answer questions
2. If the context doesn't contain enough information to answer the question, say "I can only answer based on my knowledge base, and I don't have enough information about that topic."
3. Do NOT use any external knowledge or general information
4. Always cite specific information from the context when answering
5. If asked about topics not covered in the context, politely redirect to topics within your knowledge base
6. Never make up information or use knowledge outside of what's provided in the context

Remember: You are a RAG-only assistant. Your responses must be grounded in the provided context.`],
    ['placeholder', '{history}'],
    ['human', 'Context from RAG knowledge base:\n{context}\n\nUser question: {question}'],
    ['assistant', '']
])

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json()

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            )
        }

        // Search for relevant documents in RAG knowledge base
        const results = await searchSimilarDocuments(message, 4)
        const context = results.map(([doc]) => doc.pageContent).join('\n\n') // Get document content
        const relevanceScores = results.map(([, score]) => score) // FIXED: Get scores correctly

        // If no relevant context is found, inform the user
        if (!context.trim()) {
            return NextResponse.json({
                message: "I can only answer questions based on my knowledge base, and I don't have any relevant information about that topic. Please ask me about topics related to Kenyan education, curriculum, or other subjects I've been trained on.",
                context: null,
                noContext: true
            })
        }

        // Calculate average relevance score
        const avgRelevance = relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
        const relevanceIndicator = avgRelevance > 0.7 ? 'high' : avgRelevance > 0.5 ? 'medium' : 'low'

        // Convert message history to LangChain message format
        const chatHistory = history?.slice(-10).map((msg: Message) => {
            if (msg.role === 'user') {
                return new HumanMessage(msg.content)
            } else {
                return new AIMessage(msg.content)
            }
        }) || []

        // Build chain
        const chain = prompt.pipe(llm).pipe(new StringOutputParser())

        // Run chain with context
        const answer = await chain.invoke({
            context,
            history: chatHistory,
            question: message
        })

        return NextResponse.json({
            message: answer,
            context: context, // Return context for transparency
            relevance: relevanceIndicator, // Return relevance indicator
            avgScore: avgRelevance.toFixed(3) // Return average relevance score
        })

    } catch (error) {
        console.error('Chat API Error:', error)

        // Handle specific OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { error: 'OpenAI API key not configured' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Alternative example using streaming (for real-time responses)
// export async function POST_STREAMING(request: NextRequest) {
//     try {
//         const { message, history } = await request.json()
//
//         const prompt = ChatPromptTemplate.fromMessages([
//             ['system', 'You are a helpful AI assistant.'],
//             ['placeholder', '{chat_history}'],
//             ['human', '{input}']
//         ])
//
//         const chatHistory = history?.slice(-10).map((msg: Message) => {
//             return msg.role === 'user'
//                 ? new HumanMessage(msg.content)
//                 : new AIMessage(msg.content)
//         }) || []
//
//         const chain = prompt.pipe(llm)
//
//         // Create a streaming response
//         const stream = await chain.stream({
//             input: message,
//             chat_history: chatHistory
//         })
//
//         const encoder = new TextEncoder()
//         const readable = new ReadableStream({
//             async start(controller) {
//                 try {
//                     for await (const chunk of stream) {
//                         const text = chunk.content
//                         controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
//                     }
//                     controller.enqueue(encoder.encode('data: [DONE]\n\n'))
//                 } catch (error) {
//                     controller.error(error)
//                 } finally {
//                     controller.close()
//                 }
//             }
//         })
//
//         return new Response(readable, {
//             headers: {
//                 'Content-Type': 'text/event-stream',
//                 'Cache-Control': 'no-cache',
//                 'Connection': 'keep-alive',
//             },
//         })
//
//     } catch (error) {
//         console.error('Streaming Chat API Error:', error)
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         )
//     }
// }