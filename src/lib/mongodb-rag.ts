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
            pageContent: "The Kenyan education system follows the 8-4-4 structure, consisting of 8 years of primary education, 4 years of secondary education, and 4 years of university education. Primary education starts at age 6 and is free and compulsory for all children. The Kenya Certificate of Primary Education (KCPE) exam is taken at the end of primary school.",
            metadata: {
                source: "kenya-education-overview",
                type: "system-structure",
                category: "primary-education",
                tags: ["kenya", "8-4-4", "primary-school", "kcpe", "education-system"]
            }
        },
        {
            pageContent: "Secondary education in Kenya is divided into two cycles: Form 1-2 (lower secondary) and Form 3-4 (upper secondary). Students take the Kenya Certificate of Secondary Education (KCSE) examination at the end of Form 4. Performance in KCSE determines university admission and career pathways. The curriculum includes core subjects like Mathematics, English, Kiswahili, and Sciences.",
            metadata: {
                source: "kenya-secondary-education",
                type: "system-structure",
                category: "secondary-education",
                tags: ["kenya", "secondary-school", "kcse", "form-1-4", "curriculum"]
            }
        },
        {
            pageContent: "The Competency-Based Curriculum (CBC) was introduced in Kenya in 2017 to replace the 8-4-4 system. CBC follows a 2-6-3-3-3 structure: 2 years pre-primary, 6 years primary, 3 years junior secondary, 3 years senior secondary, and 3 years university. It focuses on developing learners' competencies, values, and skills rather than just academic knowledge.",
            metadata: {
                source: "kenya-cbc-reform",
                type: "curriculum-reform",
                category: "cbc",
                tags: ["kenya", "cbc", "competency-based", "2-6-3-3-3", "education-reform"]
            }
        },
        {
            pageContent: "Kenya has both public and private universities. Major public universities include the University of Nairobi, Kenyatta University, Moi University, and Egerton University. Private institutions like Strathmore University, United States International University (USIU), and Africa Nazarene University also offer quality higher education. Admission is based on KCSE performance and university entrance requirements.",
            metadata: {
                source: "kenya-higher-education",
                type: "institutions",
                category: "university-education",
                tags: ["kenya", "universities", "higher-education", "public-universities", "private-universities"]
            }
        },
        {
            pageContent: "Technical and Vocational Education and Training (TVET) in Kenya provides practical skills training through polytechnics, technical institutes, and vocational training centers. TVET institutions offer certificates and diplomas in various fields including engineering, business, agriculture, and hospitality. The Kenya National Qualifications Authority (KNQA) oversees quality assurance in TVET.",
            metadata: {
                source: "kenya-tvet",
                type: "vocational-training",
                category: "tvet",
                tags: ["kenya", "tvet", "technical-education", "polytechnics", "vocational-training"]
            }
        },
        {
            pageContent: "Education challenges in Kenya include inadequate infrastructure, teacher shortages, high dropout rates especially in arid and semi-arid regions, and gender disparities in education access. The government has implemented various initiatives including the Free Primary Education (FPE) policy, school feeding programs, and infrastructure development to address these challenges.",
            metadata: {
                source: "kenya-education-challenges",
                type: "policy-challenges",
                category: "education-challenges",
                tags: ["kenya", "education-challenges", "dropout-rates", "infrastructure", "gender-parity"]
            }
        },
        {
            pageContent: "The Kenya Institute of Curriculum Development (KICD) is responsible for developing and reviewing educational curricula in Kenya. It conducts research, develops learning materials, and provides guidance on curriculum implementation. KICD works closely with the Ministry of Education to ensure curricula meet national development needs and international standards.",
            metadata: {
                source: "kenya-kicd",
                type: "curriculum-development",
                category: "education-governance",
                tags: ["kenya", "kicd", "curriculum-development", "ministry-of-education", "learning-materials"]
            }
        },
        {
            pageContent: "Kenya's education language policy emphasizes the use of mother tongue or local languages in early primary education (Classes 1-3), followed by the introduction of English and Kiswahili. English serves as the medium of instruction from Class 4 onwards, while Kiswahili is taught as a compulsory subject and serves as the national language.",
            metadata: {
                source: "kenya-language-policy",
                type: "language-policy",
                category: "education-policy",
                tags: ["kenya", "language-policy", "english", "kiswahili", "mother-tongue", "medium-of-instruction"]
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