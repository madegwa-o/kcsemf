// lib/mongodb-rag.ts
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoClient } from "mongodb";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { Filter } from "mongodb";

// Initialize MongoDB client
const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");

// Get collection
const collection = client
    .db(process.env.MONGODB_ATLAS_DB_NAME)
    .collection(process.env.MONGODB_ATLAS_COLLECTION_NAME || "documents");

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small", // Cheaper than text-embedding-ada-002
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize MongoDB Atlas vector store
export const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection,
    indexName: "vector_index", // Name of your Atlas Search index
    textKey: "text", // Field containing raw content
    embeddingKey: "embedding", // Field containing embeddings
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

        // Generate unique IDs for documents
        const ids = splitDocs.map((_, index) => `doc_${Date.now()}_${index}`);

        // Add to vector store
        const addedIds = await vectorStore.addDocuments(splitDocs, { ids });
        console.log(`Added ${addedIds.length} document chunks to MongoDB Atlas`);
        return addedIds;
    } catch (error) {
        console.error("Error adding documents to MongoDB Atlas:", error);
        throw error;
    }
}

/**
 * Search for similar documents with optional filtering
 */

export async function searchSimilarDocuments(
    query: string,
    limit: number = 3,
    filter?: Filter<Document>
) {
    try {
        const mongoFilter = filter ? { preFilter: filter } : undefined;

        const results = await vectorStore.similaritySearchWithScore(
            query,
            limit,
            mongoFilter
        );
        return results;
    } catch (error) {
        console.error("Error searching documents in MongoDB Atlas:", error);
        throw error;
    }
}


/**
 * Delete documents from vector store
 */
export async function deleteDocuments(ids: string[]) {
    try {
        await vectorStore.delete({ ids });
        console.log(`Deleted ${ids.length} documents from MongoDB Atlas`);
    } catch (error) {
        console.error("Error deleting documents from MongoDB Atlas:", error);
        throw error;
    }
}

/**
 * Create sample documents for testing
 */
export function createSampleDocuments(): Document[] {
    return [
        {
            pageContent: "LangChain is a framework for developing applications powered by language models. It enables applications that are data-aware and agentic, allowing them to connect with data sources and interact with their environment.",
            metadata: {
                source: "langchain-docs",
                type: "overview",
                category: "framework",
                tags: ["ai", "llm", "framework"]
            }
        },
        {
            pageContent: "MongoDB Atlas Vector Search allows you to store and search over unstructured data using vector embeddings. It provides semantic search capabilities with built-in filtering and supports various similarity metrics.",
            metadata: {
                source: "mongodb-docs",
                type: "concept",
                category: "database",
                tags: ["database", "vector-search", "mongodb"]
            }
        },
        {
            pageContent: "Vector embeddings are high-dimensional numerical representations of data that capture semantic meaning. They enable similarity search by measuring distances between vectors in the embedding space.",
            metadata: {
                source: "ai-concepts",
                type: "definition",
                category: "embeddings",
                tags: ["ai", "embeddings", "vectors"]
            }
        },
        {
            pageContent: "RAG (Retrieval-Augmented Generation) combines information retrieval with language generation. It retrieves relevant documents from a knowledge base and uses them as context for generating more accurate and informed responses.",
            metadata: {
                source: "ai-concepts",
                type: "definition",
                category: "rag",
                tags: ["ai", "rag", "retrieval", "generation"]
            }
        },
        {
            pageContent: "OpenAI's text-embedding-3-small model provides high-quality embeddings with 1536 dimensions. It's cost-effective and suitable for most semantic search applications, offering a good balance between performance and price.",
            metadata: {
                source: "openai-docs",
                type: "technical",
                category: "embeddings",
                tags: ["openai", "embeddings", "api"]
            }
        },
        {
            pageContent: "Next.js is a React framework that provides server-side rendering, static site generation, and API routes. It's commonly used for building full-stack web applications with modern JavaScript.",
            metadata: {
                source: "nextjs-docs",
                type: "overview",
                category: "framework",
                tags: ["nextjs", "react", "web-development"]
            }
        }
    ];
}

/**
 * Initialize the RAG database with sample data
 */
export async function initializeRAGDatabase() {
    try {
        console.log("Initializing MongoDB Atlas RAG database...");

        // Create sample documents
        const sampleDocs = createSampleDocuments();

        // Add to vector store
        const ids = await addDocumentsToStore(sampleDocs);

        console.log("MongoDB Atlas RAG database initialized successfully!");
        return ids;
    } catch (error) {
        console.error("Failed to initialize MongoDB Atlas RAG database:", error);
        throw error;
    }
}

/**
 * Search documents by category
 */
export async function searchByCategory(query: string, category: string, limit: number = 3) {
    return searchSimilarDocuments(query, limit, { category: { $eq: category } });
}

/**
 * Search documents by source
 */
export async function searchBySource(query: string, source: string, limit: number = 3) {
    return searchSimilarDocuments(query, limit, { source: { $eq: source } });
}

/**
 * Get all unique categories from documents
 */
export async function getCategories(): Promise<string[]> {
    try {
        const categories = await collection.distinct("category");
        return categories;
    } catch (error) {
        console.error("Error getting categories:", error);
        return [];
    }
}

/**
 * Close MongoDB connection
 */
export async function closeConnection() {
    try {
        await client.close();
        console.log("MongoDB Atlas connection closed");
    } catch (error) {
        console.error("Error closing MongoDB Atlas connection:", error);
    }
}