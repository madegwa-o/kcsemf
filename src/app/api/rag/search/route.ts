
// app/api/rag/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchSimilarDocuments } from '@/lib/mongodb-rag'

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


// // app/api/rag/delete/route.ts
// import { NextRequest, NextResponse } from 'next/server'
// import { deleteDocuments } from '@/lib/rag-setup'
//
// export async function POST(request: NextRequest) {
//     try {
//         const { ids } = await request.json()
//
//         if (!ids || !Array.isArray(ids)) {
//             return NextResponse.json(
//                 { error: 'IDs array is required' },
//                 { status: 400 }
//             )
//         }
//
//         await deleteDocuments(ids)
//
//         return NextResponse.json({
//             success: true,
//             message: `Deleted ${ids.length} documents successfully`
//         })
//     } catch (error) {
//         console.error('RAG delete documents error:', error)
//         return NextResponse.json(
//             { error: 'Failed to delete documents' },
//             { status: 500 }
//         )
//     }
// }