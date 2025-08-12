// app/api/chat/route.ts (for App Router) or pages/api/chat.ts (for Pages Router)



// import { BufferMemory } from 'langchain/memory'
// import { ConversationChain } from 'langchain/chains'
//
// const memory = new BufferMemory()
// const conversation = new ConversationChain({
//     llm,
//     memory,
// })

// // Using Anthropic Claude
// import { ChatAnthropic } from '@langchain/anthropic'
//
// const llm = new ChatAnthropic({
//     anthropicApiKey: process.env.ANTHROPIC_API_KEY,
//     modelName: 'claude-3-sonnet-20240229',
// })
//
// // Using Google Gemini
// import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
//
// const llm = new ChatGoogleGenerativeAI({
//     apiKey: process.env.GOOGLE_API_KEY,
//     modelName: 'gemini-pro',
// })


//
// // Using Groq (very fast and cheap)
// import { ChatGroq } from '@langchain/groq'
//
// const llm = new ChatGroq({
//     apiKey: process.env.GROQ_API_KEY,
//     modelName: 'llama3-8b-8192', // Often free or very cheap
// })
//
// // Using Together AI
// import { ChatTogetherAI } from '@langchain/community/chat_models/togetherai'
//
// const llm = new ChatTogetherAI({
//     apiKey: process.env.TOGETHER_AI_API_KEY,
//     modelName: 'meta-llama/Llama-2-7b-chat-hf', // Very cheap
// })

// Using Ollama (completely free, runs locally)
// import { ChatOllama } from '@langchain/community/chat_models/ollama'
//
// const llm = new ChatOllama({
//     baseUrl: 'http://localhost:11434',
//     model: 'mistral:latest', // Free local model
// })




// // Initialize the LLM (you can also use other providers like Anthropic, Google, etc.)
// const llm = new ChatOpenAI({
//     modelName: 'gpt-3.5-turbo', // or 'gpt-4' for better responses
//     temperature: 0.7,
//     openAIApiKey: process.env.OPENAI_API_KEY,
// })


import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import {searchSimilarDocuments} from "@/lib/mongodb-rag";

// Initialize the LLM (you can also use other providers like Anthropic, Google, etc.)
const llm = new ChatOpenAI({
    modelName: 'gpt-5-nano',
    openAIApiKey: process.env.OPENAI_API_KEY,
})

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

// Prompt template for RAG
const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful AI assistant. Use the following retrieved context to answer the user's question.

Context:
{context}

Conversation history:
{history}

User: {question}
AI:
`)

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json()

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            )
        }

        const results = await searchSimilarDocuments(message, 4)
        const context = results.map(([doc]) => doc.pageContent).join('\n\n')


        // Convert message history to LangChain message format
        const chatHistory = history?.slice(-10).map((msg: Message) => {
            if (msg.role === 'user') {
                return new HumanMessage(msg.content)
            } else {
                return new AIMessage(msg.content)
            }
        }) || []

        // 3. Build chain
        const chain = prompt.pipe(llm).pipe(new StringOutputParser())

        // 4. Run chain
        const answer = await chain.invoke({
            context,
            history: chatHistory,
            question: message
        })

        return NextResponse.json({ message: answer })

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