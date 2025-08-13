
// app/api/rag/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { deleteDocuments } from '@/lib/mongodb-rag'

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