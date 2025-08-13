

// app/api/rag/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { addDocumentsToStore } from '@/lib/mongodb-rag'
import { Document } from '@langchain/core/documents'

export async function POST(request: NextRequest) {
    try {
        const { documents } = await request.json()

        if (!documents || !Array.isArray(documents)) {
            return NextResponse.json(
                { error: 'Documents array is required' },
                { status: 400 }
            )
        }

        // Convert to Document format
        const langchainDocs: Document[] = documents.map(doc => ({
            pageContent: doc.pageContent || doc.content,
            metadata: doc.metadata || {}
        }))

        const ids = await addDocumentsToStore(langchainDocs)

        return NextResponse.json({
            success: true,
            ids,
            count: ids.length,
            message: `Added ${ids.length} documents successfully`
        })
    } catch (error) {
        console.error('RAG add documents error:', error)
        return NextResponse.json(
            { error: 'Failed to add documents' },
            { status: 500 }
        )
    }
}