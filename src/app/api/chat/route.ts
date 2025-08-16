// app/api/chat/route.ts (for App Router) or pages/api/chat.ts (for Pages Router)

import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import {searchSimilarDocuments} from "@/lib/mongodb-rag";
import fs from 'fs'
import path from 'path'

// Initialize the LLM
const llm = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
})

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface KCSEQuestion {
    id: string
    subject: string
    category: string
    year: number
    form: number
    difficulty: string
    question: string
    answer: string
    solution: string
    marks: number
    topic: string
    learning_objectives: string[]
    keywords: string[]
}

interface KCSEData {
    kcse_mock_questions: KCSEQuestion[]
    metadata: Record<string, unknown>
}

// Load KCSE questions from JSON file
let kcseData: KCSEData | null = null

function loadKCSEData(): KCSEData {
    if (!kcseData) {
        try {
            const filePath = path.join(process.cwd(), 'src', 'data', 'kcse-mock-questions.json')
            const fileContent = fs.readFileSync(filePath, 'utf8')
            kcseData = JSON.parse(fileContent)
        } catch (error) {
            console.error('Error loading KCSE data:', error)
            kcseData = { kcse_mock_questions: [], metadata: {} }
        }
    }
    return kcseData!
}

// Improved text similarity function
function calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]

    // Jaccard similarity
    const jaccard = intersection.length / union.length
    
    // Also check for exact matches in subject and topic
    const exactMatches = words1.filter(word => 
        words2.some(w2 => w2.includes(word) || word.includes(w2))
    ).length
    
    // Combine both metrics
    return Math.max(jaccard, exactMatches / Math.max(words1.length, words2.length))
}

// Detect if user is asking for specific questions
function isQuestionRequest(query: string): boolean {
    const questionKeywords = [
        'question', 'questions', 'exam', 'test', 'practice', 'mock', 'kcse', 'past paper',
        'solve', 'answer', 'solution', 'problem', 'exercise', 'quiz', 'assignment',
        'find', 'search', 'look for', 'get', 'show me', 'give me'
    ]
    
    const queryLower = query.toLowerCase()
    return questionKeywords.some(keyword => queryLower.includes(keyword))
}

// Search for relevant KCSE questions based on user query
function searchRelevantQuestions(query: string, limit: number = 3): Array<[KCSEQuestion, number]> {
    const data = loadKCSEData()
    const results: Array<[KCSEQuestion, number]> = []
    
    const queryLower = query.toLowerCase()
    
    // Check for subject-specific requests first
    const subjectKeywords = {
        'math': ['mathematics', 'math', 'algebra', 'geometry', 'calculus', 'trigonometry'],
        'english': ['english', 'language', 'writing', 'composition', 'grammar'],
        'science': ['biology', 'chemistry', 'physics', 'science'],
        'biology': ['biology', 'bio', 'photosynthesis', 'excretion'],
        'chemistry': ['chemistry', 'chem', 'molecular', 'atomic'],
        'physics': ['physics', 'motion', 'force', 'energy'],
        'history': ['history', 'historical', 'colonial', 'nationalism'],
        'geography': ['geography', 'geo', 'climate', 'weather', 'map'],
        'kiswahili': ['kiswahili', 'swahili', 'sarufi', 'fasihi'],
        'agriculture': ['agriculture', 'crop', 'farming'],
        'business': ['business', 'entrepreneurship', 'commerce']
    }
    
    // Find matching subject
    let targetSubject = null
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
        if (keywords.some(keyword => queryLower.includes(keyword))) {
            targetSubject = subject
            break
        }
    }

    for (const question of data.kcse_mock_questions) {
        let similarity = 0
        
        // Boost similarity for subject matches
        if (targetSubject) {
            const questionSubjectLower = question.subject.toLowerCase()
            if (subjectKeywords[targetSubject as keyof typeof subjectKeywords]?.some(keyword => 
                questionSubjectLower.includes(keyword) || keyword.includes(questionSubjectLower)
            )) {
                similarity += 0.5 // Boost for subject match
            }
        }
        
        // Create searchable text from question data
        const searchableText = [
            question.question,
            question.topic,
            question.subject,
            question.answer,
            question.solution,
            ...question.keywords,
            ...question.learning_objectives
        ].join(' ')

        const textSimilarity = calculateSimilarity(query, searchableText)
        similarity += textSimilarity

        if (similarity > 0.05) { // Lower threshold for better matching
            results.push([question, similarity])
        }
    }

    // Sort by similarity score (descending) and return top results
    return results
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
}

// Format question data for context
function formatQuestionContext(questions: Array<[KCSEQuestion, number]>): string {
    return questions.map(([q, score]) => {
        return `
KCSE ${q.subject} Question (${q.year} - ${q.category}):
Topic: ${q.topic}
Question: ${q.question}
Answer: ${q.answer}
Solution: ${q.solution}
Difficulty: ${q.difficulty}
Marks: ${q.marks}
Learning Objectives: ${q.learning_objectives.join(', ')}
Relevance Score: ${(score * 100).toFixed(1)}%
---`
    }).join('\n')
}

// Updated prompt template for dual data source approach
const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are Mwalimu AI, a friendly and knowledgeable Kenyan KCSE tutor. Your mission is to help Form 4 students excel in their KCSE examinations through comprehensive exam preparation.

PERSONALITY & APPROACH:
- Be warm, encouraging, and patient like a caring Kenyan teacher
- Use simple Kenyan English that students can easily understand
- Occasionally use appropriate Kiswahili terms (like "mwalimu" for teacher, "mtoto" for child)
- Focus heavily on KCSE exam preparation and success strategies
- Be motivational - help students believe they can achieve excellent grades

KNOWLEDGE PRIORITIES:
1. FIRST: Always prioritize information from the provided context
2. If the context contains KCSE questions, use them to:
   - Explain concepts with real exam examples
   - Show proper answer formats and techniques
   - Demonstrate marking schemes and expectations
   - Provide similar practice questions
3. If the context contains general educational information, use it to:
   - Explain concepts clearly and comprehensively
   - Provide accurate information about Kenyan education
   - Reference specific facts and details from the context

RESPONSE STYLE:
- Always reference relevant information from the provided context
- Explain concepts using examples when available
- Give practical tips and strategies
- Show step-by-step solutions when applicable
- Connect topics to KCSE exam preparation when relevant

Remember: You are Mwalimu AI - a dedicated KCSE tutor who helps students achieve their best possible grades! 🇰🇪📚`],
    ['placeholder', '{history}'],
    ['human', 'Data Source: {dataSource}\n\nContext:\n{context}\n\nStudent Question: {question}'],
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

        // Determine if user is asking for specific questions or general knowledge
        const isAskingForQuestions = isQuestionRequest(message)
        
        console.log('User message:', message)
        console.log('Is asking for questions:', isAskingForQuestions)
        
        let context = ''
        let dataSource = ''
        let relevanceIndicator = 'low'
        let avgRelevance = 0
        let subjects: string[] = []
        let questionDetails: Array<{
            id: string;
            subject: string;
            topic: string;
            year: number;
            difficulty: string;
            marks: number;
            relevanceScore: string;
        }> = []

        if (isAskingForQuestions) {
            // User wants specific questions - search KCSE mock questions
            const relevantQuestions = searchRelevantQuestions(message, 3)
            dataSource = 'KCSE Mock Questions'
            
            console.log('Found relevant questions:', relevantQuestions.length)
            console.log('Relevant questions:', relevantQuestions.map(([q, score]) => ({ subject: q.subject, topic: q.topic, score })))
            
            if (relevantQuestions.length > 0) {
                context = formatQuestionContext(relevantQuestions)
                avgRelevance = relevantQuestions.reduce((sum, [, score]) => sum + score, 0) / relevantQuestions.length
                subjects = [...new Set(relevantQuestions.map(([q]) => q.subject))]
                questionDetails = relevantQuestions.map(([q, score]) => ({
                    id: q.id,
                    subject: q.subject,
                    topic: q.topic,
                    year: q.year,
                    difficulty: q.difficulty,
                    marks: q.marks,
                    relevanceScore: (score * 100).toFixed(1)
                }))
            } else {
                // Fallback: provide a random question if no specific match found
                const data = loadKCSEData()
                const randomQuestion = data.kcse_mock_questions[Math.floor(Math.random() * data.kcse_mock_questions.length)]
                context = formatQuestionContext([[randomQuestion, 0.5]])
                avgRelevance = 0.5
                subjects = [randomQuestion.subject]
                questionDetails = [{
                    id: randomQuestion.id,
                    subject: randomQuestion.subject,
                    topic: randomQuestion.topic,
                    year: randomQuestion.year,
                    difficulty: randomQuestion.difficulty,
                    marks: randomQuestion.marks,
                    relevanceScore: '50.0'
                }]
            }
        } else {
            // User wants general knowledge - search RAG knowledge base
            const results = await searchSimilarDocuments(message, 4)
            context = results.map(([doc]) => doc.pageContent).join('\n\n')
            dataSource = 'RAG Knowledge Base'
            
            if (results.length > 0) {
                const relevanceScores = results.map(([, score]) => score)
                avgRelevance = relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
            }
        }

        // If no relevant context found, inform the user
        if (!context.trim()) {
            return NextResponse.json({
                message: isAskingForQuestions 
                    ? `I don't have specific KCSE questions matching your query right now. Try asking about different subjects, topics, or years.`
                    : `I can only answer based on my knowledge base, and I don't have any relevant information about that topic. Please ask me about topics related to Kenyan education, curriculum, or other subjects I've been trained on.`,
                context: null,
                dataSource: dataSource,
                noContext: true
            })
        }

        // Calculate relevance indicator
        relevanceIndicator = avgRelevance > 0.7 ? 'high' : avgRelevance > 0.5 ? 'medium' : 'low'

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
            question: message,
            dataSource
        })

        return NextResponse.json({
            message: answer,
            context: context,
            dataSource: dataSource,
            relevance: relevanceIndicator,
            avgRelevance: avgRelevance.toFixed(3),
            subjects: subjects,
            questionDetails: questionDetails
        })

    } catch (error) {
        console.error('Chat API Error:', error)

        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { error: 'OpenAI API key not configured' },
                    { status: 500 }
                )
            }
            if (error.message.includes('ENOENT')) {
                return NextResponse.json(
                    { error: 'KCSE questions data file not found. Please ensure kcse-mock-questions.json exists in /data folder' },
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

// Utility endpoint to get available questions by subject (optional)
export async function GET() {
    try {
        const data = loadKCSEData()
        console.log('KCSE data loaded:', data.kcse_mock_questions.length, 'questions')
        
        const subjects = [...new Set(data.kcse_mock_questions.map(q => q.subject))]
        const questionsBySubject = subjects.map(subject => {
            const subjectQuestions = data.kcse_mock_questions.filter(q => q.subject === subject)
            return {
                subject,
                count: subjectQuestions.length,
                topics: [...new Set(subjectQuestions.map(q => q.topic))],
                years: [...new Set(subjectQuestions.map(q => q.year))].sort(),
                difficulties: [...new Set(subjectQuestions.map(q => q.difficulty))]
            }
        })

        return NextResponse.json({
            totalQuestions: data.kcse_mock_questions.length,
            subjects: questionsBySubject,
            metadata: data.metadata
        })
    } catch {
        return NextResponse.json(
            { error: 'Failed to load KCSE data' },
            { status: 500 }
        )
    }
}