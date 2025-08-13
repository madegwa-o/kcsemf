// app/api/rag/categories/route.ts
import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/mongodb-rag'

export async function GET() {
    try {
        const categories = await getCategories()

        return NextResponse.json({
            success: true,
            categories,
            count: categories.length
        })
    } catch (error) {
        console.error('RAG get categories error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}