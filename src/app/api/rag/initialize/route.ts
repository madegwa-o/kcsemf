// app/api/rag/initialize/route.ts
import { NextResponse } from 'next/server'
import { initializeRAGDatabase } from '@/lib/superbase-rag'

export async function POST() {
    try {
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

// app/api/rag/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchSimilarDocuments } from '@/lib/superbase-rag'

export async function POST(request: NextRequest) {
    try {
        const { query, limit = 5, filter } = await request.json()

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            )
        }

        const results = await searchSimilarDocuments(query, limit, filter)

        // Format results for frontend
        const formattedResults = results.map(([document, score]) => ({
            document,
            score
        }))

        return NextResponse.json({
            success: true,
            results: formattedResults,
            count: results.length
        })
    } catch (error) {
        console.error('RAG search error:', error)
        return NextResponse.json(
            { error: 'Failed to search documents' },
            { status: 500 }
        )
    }
}

// app/api/rag/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { addDocumentsToStore } from '@/lib/rag-setup'
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

// app/api/rag/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { deleteDocuments } from '@/lib/rag-setup'

export async function POST(request: NextRequest) {
    try {
        const { ids } = await request.json()

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json(
                { error: 'IDs array is required' },
                { status: 400 }
            )
        }

        await deleteDocuments(ids)

        return NextResponse.json({
            success: true,
            message: `Deleted ${ids.length} documents successfully`
        })
    } catch (error) {
        console.error('RAG delete documents error:', error)
        return NextResponse.json(
            { error: 'Failed to delete documents' },
            { status: 500 }
        )
    }
}