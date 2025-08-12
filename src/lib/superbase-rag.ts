// lib/rag-setup.ts
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Initialize Supabase client
const supabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PRIVATE_KEY!
);

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small", // Cheaper than text-embedding-ada-002
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize vector store
export const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
});

// Text splitter for breaking down large documents
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

/**
 * Add documents to the vector store
 */
export async function addDocumentsToStore(documents: Document[]) {
    try {
        // Split documents into chunks
        const splitDocs = await textSplitter.splitDocuments(documents);

        // Add to vector store
        const ids = await vectorStore.addDocuments(splitDocs);
        console.log(`Added ${ids.length} document chunks to vector store`);
        return ids;
    } catch (error) {
        console.error("Error adding documents:", error);
        throw error;
    }
}

/**
 * Search for similar documents
 */
export async function searchSimilarDocuments(
    query: string,
    limit: number = 3,
    filter?: Record<string, any>
) {
    try {
        const results = await vectorStore.similaritySearchWithScore(
            query,
            limit,
            filter
        );
        return results;
    } catch (error) {
        console.error("Error searching documents:", error);
        throw error;
    }
}

/**
 * Delete documents from vector store
 */
export async function deleteDocuments(ids: string[]) {
    try {
        await vectorStore.delete({ ids });
        console.log(`Deleted ${ids.length} documents`);
    } catch (error) {
        console.error("Error deleting documents:", error);
        throw error;
    }
}

/**
 * Create sample documents for testing
 */
export function createSampleDocuments(): Document[] {
    return [
        {
            pageContent: "LangChain is a framework for developing applications powered by language models. It enables applications that are data-aware and agentic.",
            metadata: { source: "langchain-docs", type: "overview", category: "framework" }
        },
        {
            pageContent: "Vector stores allow you to store and search over unstructured data by creating embeddings and enabling semantic search.",
            metadata: { source: "langchain-docs", type: "concept", category: "vectorstore" }
        },
        {
            pageContent: "Supabase is an open-source Firebase alternative built on PostgreSQL with pgvector support for similarity search.",
            metadata: { source: "supabase-docs", type: "overview", category: "database" }
        },
        {
            pageContent: "RAG (Retrieval-Augmented Generation) combines retrieval of relevant documents with language model generation for more accurate responses.",
            metadata: { source: "ai-concepts", type: "definition", category: "rag" }
        },
        {
            pageContent: "OpenAI embeddings convert text into high-dimensional vectors that capture semantic meaning for similarity comparisons.",
            metadata: { source: "openai-docs", type: "technical", category: "embeddings" }
        }
    ];
}

/**
 * Initialize the RAG database with sample data
 */
export async function initializeRAGDatabase() {
    try {
        console.log("Initializing RAG database...");

        // Create sample documents
        const sampleDocs = createSampleDocuments();

        // Add to vector store
        const ids = await addDocumentsToStore(sampleDocs);

        console.log("RAG database initialized successfully!");
        return ids;
    } catch (error) {
        console.error("Failed to initialize RAG database:", error);
        throw error;
    }
}