// "use client";
//
// import { useState, useEffect } from "react";
// import { Database, Upload, Search, Trash2, Plus, Filter } from "lucide-react";
// import ThemeToggle from "../../components/ThemeToggle";
//
// export default function RAGAdmin() {
//     const [status, setStatus] = useState("");
//     const [searchResults, setSearchResults] = useState([]);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [selectedCategory, setSelectedCategory] = useState("");
//     const [selectedSource, setSelectedSource] = useState("");
//     const [categories, setCategories] = useState([]);
//     const [newDocument, setNewDocument] = useState({
//         content: "",
//         metadata: '{"source": "custom", "category": "general", "type": "note"}',
//     });
//
//     useEffect(() => {
//         loadCategories();
//     }, []);
//
//     const loadCategories = async () => {
//         try {
//             const res = await fetch("/api/rag/categories");
//             const data = await res.json();
//             setCategories(data.categories || []);
//         } catch (error) {
//             console.error("Error loading categories:", error);
//         }
//     };
//
//     const initializeDatabase = async () => {
//         setStatus("Initializing MongoDB Atlas RAG database...");
//         try {
//             const res = await fetch("/api/rag/initialize", { method: "POST" });
//             const data = await res.json();
//             setStatus(`✅ Database initialized! Added ${data.count} documents.`);
//             loadCategories();
//         } catch (error) {
//             setStatus(`❌ Error: ${error.message}`);
//         }
//     };
//
//     const searchDocuments = async () => {
//         if (!searchQuery.trim()) return;
//         setStatus("Searching documents...");
//         try {
//             const searchParams = {
//                 query: searchQuery,
//                 limit: 5,
//                 category: selectedCategory || undefined,
//                 source: selectedSource || undefined,
//             };
//
//             const res = await fetch("/api/rag/search", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(searchParams),
//             });
//             const data = await res.json();
//             setSearchResults(data.results || []);
//             setStatus(`Found ${data.results?.length || 0} relevant documents`);
//         } catch (error) {
//             setStatus(`❌ Search error: ${error.message}`);
//         }
//     };
//
//     const addDocument = async () => {
//         if (!newDocument.content.trim()) return;
//         setStatus("Adding document...");
//         try {
//             let metadata = {};
//             if (newDocument.metadata.trim()) {
//                 metadata = JSON.parse(newDocument.metadata);
//             }
//
//             const res = await fetch("/api/rag/add", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     documents: [
//                         {
//                             pageContent: newDocument.content,
//                             metadata: metadata,
//                         },
//                     ],
//                 }),
//             });
//             const data = await res.json();
//             setStatus(`✅ Document added! ID: ${data.ids[0]}`);
//             setNewDocument({
//                 content: "",
//                 metadata:
//                     '{"source": "custom", "category": "general", "type": "note"}',
//             });
//             loadCategories();
//         } catch (error) {
//             setStatus(`❌ Add error: ${error.message}`);
//         }
//     };
//
//     const clearResults = () => {
//         setSearchResults([]);
//         setSearchQuery("");
//         setSelectedCategory("");
//         setSelectedSource("");
//     };
//
//     return (
//         <div className="max-w-5xl mx-auto p-6 bg-background text-foreground rounded-lg border shadow-sm">
//             {/* Header */}
//             <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center gap-3">
//                     <Database className="w-8 h-8 text-accent-foreground" />
//                     <h1 className="text-2xl font-bold">MongoDB Atlas RAG Admin</h1>
//                 </div>
//                 <ThemeToggle />
//             </div>
//
//             {/* Status */}
//             {status && (
//                 <div className="mb-4 p-3 bg-muted border-l-4 border-accent text-sm text-muted-foreground">
//                     {status}
//                 </div>
//             )}
//
//             {/* Initialize Database */}
//             <section className="mb-6 p-4 rounded-lg border bg-muted">
//                 <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
//                     <Upload className="w-5 h-5" /> Initialize Database
//                 </h2>
//                 <p className="text-sm text-muted-foreground mb-3">
//                     Set up the MongoDB Atlas RAG database with sample documents for
//                     testing.
//                 </p>
//                 <button
//                     onClick={initializeDatabase}
//                     className="bg-accent text-accent-foreground px-4 py-2 rounded hover:opacity-80 transition-colors"
//                 >
//                     Initialize with Sample Data
//                 </button>
//             </section>
//
//             {/* Add Document */}
//             <section className="mb-6 p-4 rounded-lg border bg-muted">
//                 <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
//                     <Plus className="w-5 h-5" /> Add New Document
//                 </h2>
//                 <div className="space-y-3">
//                     <div>
//                         <label className="block text-sm font-medium mb-1">Content</label>
//                         <textarea
//                             value={newDocument.content}
//                             onChange={(e) =>
//                                 setNewDocument((prev) => ({
//                                     ...prev,
//                                     content: e.target.value,
//                                 }))
//                             }
//                             placeholder="Enter document content..."
//                             className="w-full p-2 border rounded bg-background focus:ring-2 focus:ring-accent"
//                             rows={3}
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-sm font-medium mb-1">
//                             Metadata (JSON format)
//                         </label>
//                         <input
//                             type="text"
//                             value={newDocument.metadata}
//                             onChange={(e) =>
//                                 setNewDocument((prev) => ({
//                                     ...prev,
//                                     metadata: e.target.value,
//                                 }))
//                             }
//                             placeholder='{"source": "example", "category": "test"}'
//                             className="w-full p-2 border rounded bg-background focus:ring-2 focus:ring-accent"
//                         />
//                     </div>
//                     <button
//                         onClick={addDocument}
//                         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
//                     >
//                         Add Document
//                     </button>
//                 </div>
//             </section>
//
//             {/* Search Documents */}
//             <section className="mb-6 p-4 rounded-lg border bg-muted">
//                 <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
//                     <Search className="w-5 h-5" /> Search Documents
//                 </h2>
//
//                 <div className="flex gap-2 mb-3">
//                     <input
//                         type="text"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         placeholder="Enter search query..."
//                         className="flex-1 p-2 border rounded bg-background focus:ring-2 focus:ring-accent"
//                         onKeyDown={(e) => e.key === "Enter" && searchDocuments()}
//                     />
//                     <button
//                         onClick={searchDocuments}
//                         className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
//                     >
//                         Search
//                     </button>
//                     {searchResults.length > 0 && (
//                         <button
//                             onClick={clearResults}
//                             className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition-colors"
//                         >
//                             <Trash2 className="w-4 h-4" />
//                         </button>
//                     )}
//                 </div>
//
//                 {/* Filters */}
//                 <div className="flex gap-3 mb-4">
//                     <div className="flex items-center gap-2">
//                         <Filter className="w-4 h-4 text-muted-foreground" />
//                         <span className="text-sm text-muted-foreground">Filters:</span>
//                     </div>
//                     <select
//                         value={selectedCategory}
//                         onChange={(e) => setSelectedCategory(e.target.value)}
//                         className="px-3 py-1 border rounded text-sm bg-background focus:ring-2 focus:ring-accent"
//                     >
//                         <option value="">All Categories</option>
//                         {categories.map((cat) => (
//                             <option key={cat} value={cat}>
//                                 {cat}
//                             </option>
//                         ))}
//                     </select>
//                     <input
//                         type="text"
//                         value={selectedSource}
//                         onChange={(e) => setSelectedSource(e.target.value)}
//                         placeholder="Filter by source..."
//                         className="px-3 py-1 border rounded text-sm bg-background focus:ring-2 focus:ring-accent"
//                     />
//                 </div>
//
//                 {/* Search Results */}
//                 {searchResults.length > 0 && (
//                     <div className="space-y-3">
//                         <h3 className="font-medium">Search Results:</h3>
//                         {searchResults.map((result, i) => (
//                             <div
//                                 key={i}
//                                 className="p-4 bg-background rounded border-l-4 border-purple-500"
//                             >
//                                 <div className="flex justify-between items-start mb-2">
//                   <span className="text-xs font-medium text-purple-600">
//                     Similarity: {result.score?.toFixed(3) || "N/A"}
//                   </span>
//                                     {result.document?.metadata && (
//                                         <div className="flex gap-2 text-xs">
//                       <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                         {result.document.metadata.category}
//                       </span>
//                                             <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
//                         {result.document.metadata.source}
//                       </span>
//                                         </div>
//                                     )}
//                                 </div>
//                                 <p className="text-sm">
//                                     {result.document?.pageContent || result.content}
//                                 </p>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </section>
//
//             {/* Footer */}
//             <div className="text-xs text-muted-foreground text-center">
//                 Powered by MongoDB Atlas Vector Search
//             </div>
//         </div>
//     );
// }
