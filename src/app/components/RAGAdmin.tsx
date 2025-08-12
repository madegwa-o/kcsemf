import { useState, useEffect } from 'react'
import { Database, Upload, Search, Trash2, Plus, Filter } from 'lucide-react'

export default function RAGAdmin() {
    const [status, setStatus] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedSource, setSelectedSource] = useState('')
    const [categories, setCategories] = useState([])
    const [newDocument, setNewDocument] = useState({
        content: '',
        metadata: '{"source": "custom", "category": "general", "type": "note"}'
    })

    // Load categories on component mount
    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/rag/categories')
            const data = await response.json()
            setCategories(data.categories || [])
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const initializeDatabase = async () => {
        setStatus('Initializing MongoDB Atlas RAG database...')
        try {
            const response = await fetch('/api/rag/initialize', { method: 'POST' })
            const data = await response.json()
            setStatus(`✅ Database initialized! Added ${data.count} documents.`)
            loadCategories() // Refresh categories after initialization
        } catch (error) {
            setStatus(`❌ Error: ${error.message}`)
        }
    }

    const searchDocuments = async () => {
        if (!searchQuery.trim()) return

        setStatus('Searching documents in MongoDB Atlas...')
        try {
            const searchParams = {
                query: searchQuery,
                limit: 5,
                category: selectedCategory || undefined,
                source: selectedSource || undefined
            }

            const response = await fetch('/api/rag/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchParams)
            })
            const data = await response.json()
            setSearchResults(data.results || [])
            setStatus(`Found ${data.results?.length || 0} relevant documents`)
        } catch (error) {
            setStatus(`❌ Search error: ${error.message}`)
        }
    }

    const addDocument = async () => {
        if (!newDocument.content.trim()) return

        setStatus('Adding document to MongoDB Atlas...')
        try {
            let metadata = {}
            if (newDocument.metadata.trim()) {
                metadata = JSON.parse(newDocument.metadata)
            }

            const response = await fetch('/api/rag/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documents: [{
                        pageContent: newDocument.content,
                        metadata: metadata
                    }]
                })
            })
            const data = await response.json()
            setStatus(`✅ Document added! ID: ${data.ids[0]}`)
            setNewDocument({
                content: '',
                metadata: '{"source": "custom", "category": "general", "type": "note"}'
            })
            loadCategories() // Refresh categories
        } catch (error) {
            setStatus(`❌ Add error: ${error.message}`)
        }
    }

    const clearResults = () => {
        setSearchResults([])
        setSearchQuery('')
        setSelectedCategory('')
        setSelectedSource('')
    }

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <Database className="w-8 h-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-800">MongoDB Atlas RAG Admin</h1>
            </div>

            {/* Status Display */}
            {status && (
                <div className="mb-4 p-3 bg-gray-50 border-l-4 border-green-500 text-sm text-gray-700">
                    {status}
                </div>
            )}

            {/* Initialize Database */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Initialize Database
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                    Set up the MongoDB Atlas RAG database with sample documents for testing.
                </p>
                <button
                    onClick={initializeDatabase}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                    Initialize with Sample Data
                </button>
            </div>

            {/* Add Document */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Document
                </h2>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Content</label>
                        <textarea
                            value={newDocument.content}
                            onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Enter document content..."
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Metadata (JSON format)
                        </label>
                        <input
                            type="text"
                            value={newDocument.metadata}
                            onChange={(e) => setNewDocument(prev => ({ ...prev, metadata: e.target.value }))}
                            placeholder='{"source": "example", "category": "test", "type": "note"}'
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={addDocument}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        Add Document
                    </button>
                </div>
            </div>

            {/* Search Documents */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search Documents
                </h2>

                {/* Search Input */}
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter search query..."
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                    />
                    <button
                        onClick={searchDocuments}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                    >
                        Search
                    </button>
                    {searchResults.length > 0 && (
                        <button
                            onClick={clearResults}
                            className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Filters:</span>
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={selectedSource}
                        onChange={(e) => setSelectedSource(e.target.value)}
                        placeholder="Filter by source..."
                        className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-700">Search Results:</h3>
                        {searchResults.map((result, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded border-l-4 border-purple-500">
                                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-purple-600">
                    Similarity: {result.score?.toFixed(3) || 'N/A'}
                  </span>
                                    {result.document?.metadata && (
                                        <div className="flex gap-2 text-xs">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {result.document.metadata.category}
                      </span>
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {result.document.metadata.source}
                      </span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-800 mb-2">
                                    {result.document?.pageContent || result.content}
                                </p>
                                {result.document?.metadata?.tags && (
                                    <div className="flex gap-1 flex-wrap">
                                        {result.document.metadata.tags.map((tag, tagIndex) => (
                                            <span key={tagIndex} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {tag}
                      </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-500 text-center">
                Powered by MongoDB Atlas Vector Search with pgvector-like capabilities
            </div>
        </div>
    )import { useState } from 'react'
    import { Database, Upload, Search, Trash2, Plus } from 'lucide-react'

    export default function RAGAdmin() {
        const [status, setStatus] = useState('')
        const [searchResults, setSearchResults] = useState([])
        const [searchQuery, setSearchQuery] = useState('')
        const [newDocument, setNewDocument] = useState({ content: '', metadata: '' })

        const initializeDatabase = async () => {
            setStatus('Initializing RAG database...')
            try {
                const response = await fetch('/api/rag/initialize', { method: 'POST' })
                const data = await response.json()
                setStatus(`✅ Database initialized! Added ${data.count} documents.`)
            } catch (error) {
                setStatus(`❌ Error: ${error.message}`)
            }
        }

        const searchDocuments = async () => {
            if (!searchQuery.trim()) return

            setStatus('Searching documents...')
            try {
                const response = await fetch('/api/rag/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, limit: 5 })
                })
                const data = await response.json()
                setSearchResults(data.results || [])
                setStatus(`Found ${data.results?.length || 0} relevant documents`)
            } catch (error) {
                setStatus(`❌ Search error: ${error.message}`)
            }
        }

        const addDocument = async () => {
            if (!newDocument.content.trim()) return

            setStatus('Adding document...')
            try {
                let metadata = {}
                if (newDocument.metadata.trim()) {
                    metadata = JSON.parse(newDocument.metadata)
                }

                const response = await fetch('/api/rag/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        documents: [{
                            pageContent: newDocument.content,
                            metadata: metadata
                        }]
                    })
                })
                const data = await response.json()
                setStatus(`✅ Document added! ID: ${data.ids[0]}`)
                setNewDocument({ content: '', metadata: '' })
            } catch (error) {
                setStatus(`❌ Add error: ${error.message}`)
            }
        }

        const clearResults = () => {
            setSearchResults([])
            setSearchQuery('')
        }

        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <Database className="w-8 h-8 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">RAG Database Admin</h1>
                </div>

                {/* Status Display */}
                {status && (
                    <div className="mb-4 p-3 bg-gray-50 border-l-4 border-blue-500 text-sm text-gray-700">
                        {status}
                    </div>
                )}

                {/* Initialize Database */}
                <div className="mb-6 p-4 border rounded-lg">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Initialize Database
                    </h2>
                    <p className="text-sm text-gray-600 mb-3">
                        Set up the RAG database with sample documents for testing.
                    </p>
                    <button
                        onClick={initializeDatabase}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        Initialize with Sample Data
                    </button>
                </div>

                {/* Add Document */}
                <div className="mb-6 p-4 border rounded-lg">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add New Document
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Content</label>
                            <textarea
                                value={newDocument.content}
                                onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Enter document content..."
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Metadata (JSON format, optional)
                            </label>
                            <input
                                type="text"
                                value={newDocument.metadata}
                                onChange={(e) => setNewDocument(prev => ({ ...prev, metadata: e.target.value }))}
                                placeholder='{"source": "example", "category": "test"}'
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={addDocument}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        >
                            Add Document
                        </button>
                    </div>
                </div>

                {/* Search Documents */}
                <div className="mb-6 p-4 border rounded-lg">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Search Documents
                    </h2>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter search query..."
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                        />
                        <button
                            onClick={searchDocuments}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                        >
                            Search
                        </button>
                        {searchResults.length > 0 && (
                            <button
                                onClick={clearResults}
                                className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-medium text-gray-700">Search Results:</h3>
                            {searchResults.map((result, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-purple-500">
                                    <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-purple-600">
                    Similarity: {result.score?.toFixed(3) || 'N/A'}
                  </span>
                                        {result.document?.metadata && (
                                            <span className="text-xs text-gray-500">
                      {JSON.stringify(result.document.metadata)}
                    </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-800">
                                        {result.document?.pageContent || result.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }