// // app/api/rag/initialize/route.ts
import { NextResponse } from 'next/server'
import { initializeRAGDatabase } from '@/lib/mongodb-rag'

export async function POST() {
    try {

        console.log('trying to initialize.....')
        const ids = await initializeRAGDatabase()
        return NextResponse.json({
            success: true,
            count: ids.length,
            message: 'RAG database initialized successfully'
        })
    } catch (error) {
        console.error('RAG initialization error:', error)
        return NextResponse.json(
            { error: 'Failed to initialize RAG database' },
            { status: 500 }
        )
    }
}
