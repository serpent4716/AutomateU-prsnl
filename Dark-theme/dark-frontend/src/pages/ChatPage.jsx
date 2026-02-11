"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { SidebarNavigation } from "./SidebarNavigation"
import {
  Send,
  BookOpen,
  Trash2,
  FileText,
  Paperclip,
  Tag,
  AlertTriangle,
  CheckCircle,
  Loader,
  Copy,
  X,
  Eye,
  ChevronDown,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import api from "../services/api"

import Aurora from "../components/Aurora/Aurora.jsx"
import "../components/Aurora/Aurora.css"

const cn = (...classes) => classes.filter(Boolean).join(" ")
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-6 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">Document Viewer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white font-bold text-2xl w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white/10"
          >
            &times;
          </button>
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  )
}
const DocumentViewer = ({ docId, tag, filename }) => {
  if (!docId) return null

  const documentUrl = `http://127.0.0.1:8000/uploaded_docs/${tag}/${docId}_${filename}`

  return (
    <iframe
      src={documentUrl}
      title={`Document Viewer - ${docId}`}
      className="w-full h-full border-0 rounded-lg"
      seamless
    >
      Your browser does not support embedding this file type.
    </iframe>
  )
}

const AIBlobAvatar = () => (
  <div className="relative h-8 w-8 shrink-0">
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.8) 0%, rgba(34, 211, 238, 0.6) 40%, rgba(15, 23, 42, 0.9) 100%)",
        boxShadow: "0 0 20px rgba(96, 165, 250, 0.5), inset -2px -2px 12px rgba(0,0,0,0.5)",
      }}
    />
    <div
      className="absolute inset-1 rounded-full"
      style={{
        background: "radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4) 0%, rgba(96, 165, 250, 0.2) 100%)",
      }}
    />
  </div>
)

function StudyAssistantChatPageContent({ user }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [documents, setDocuments] = useState([])

  const [newMessage, setNewMessage] = useState("")
  const [file, setFile] = useState(null)
  const [tag, setTag] = useState("central")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fileInputRef = useRef(null)
  const chatEndRef = useRef(null)
  const pollingIntervals = useRef(new Map()).current

  const [isLlmLoading, setIsLlmLoading] = useState(false)
  const [viewingDocId, setViewingDocId] = useState(null)
  const [viewingTag, setViewingTag] = useState("central")
  const [viewingDocName, setViewingDocName] = useState("")
  const [expandedTags, setExpandedTags] = useState({})
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get("/conversations")
      setConversations(response.data)
    } catch (err) {
      console.error("Failed to fetch conversations:", err)
      setError("Could not load conversations.")
    }
  }, [])

  const pollDocumentStatus = useCallback(
    (docId) => {
      if (pollingIntervals.has(docId)) return

      const intervalId = setInterval(async () => {
        try {
          const response = await api.get(`/documents/${docId}/status`)
          const updatedDoc = response.data
          setDocuments((prevDocs) => prevDocs.map((d) => (d.id === docId ? updatedDoc : d)))

          if (updatedDoc.status === "completed" || updatedDoc.status === "failed") {
            clearInterval(pollingIntervals.get(docId))
            pollingIntervals.delete(docId)
          }
        } catch (err) {
          console.error(`Failed to poll status for doc ${docId}:`, err)
          clearInterval(pollingIntervals.get(docId))
          pollingIntervals.delete(docId)
        }
      }, 5000)

      pollingIntervals.set(docId, intervalId)
    },
    [pollingIntervals],
  )

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get("/documents")
      setDocuments(response.data)
      response.data.forEach((doc) => {
        if (doc.status === "processing") {
          pollDocumentStatus(doc.id)
        }
      })
    } catch (err) {
      console.error("Failed to fetch documents:", err)
    }
  }, [pollDocumentStatus])
  const groupedDocuments = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const tag = doc.tag || "Uncategorized"
      if (!acc[tag]) {
        acc[tag] = []
      }
      acc[tag].push(doc)
      return acc
    }, {})
  }, [documents])
  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchDocuments()
    }

    return () => pollingIntervals.forEach((intervalId) => clearInterval(intervalId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchConversations, fetchDocuments])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedConversation?.messages])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) setFile(selectedFile)
  }

  const handleFileUpload = async () => {
    if (!file || !tag.trim()) {
      setError("Please select a file and provide a subject tag to upload.")
      setTimeout(() => setError(null), 3000)
      return
    }
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("tag", tag)

    try {
      const response = await api.post("/upload_doc", formData, { headers: { "Content-Type": "multipart/form-data" } })
      const newDoc = response.data
      setDocuments((prev) => [newDoc, ...prev])
      pollDocumentStatus(newDoc.id)
      setFile(null)
    } catch (err) {
      console.error("File upload failed:", err)
      setError(err.response?.data?.detail || "File upload failed.")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async (docId) => {
    const originalDocuments = [...documents]
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
    try {
      await api.delete(`/documents/${docId}`)
      if (pollingIntervals.has(docId)) {
        clearInterval(pollingIntervals.get(docId))
        pollingIntervals.delete(docId)
      }
    } catch (err) {
      console.error("Failed to delete document:", err)
      setError("Could not delete document.")
      setDocuments(originalDocuments)
    }
  }

  const handleViewDocument = (docId, docName, tag) => {
    console.log(`Requesting to view document with ID: ${docId}`)
    setViewingDocId(docId)
    setViewingDocName(docName)
    setViewingTag(tag)
  }

  const handleCloseModal = () => {
    setViewingDocId(null)
    setViewingDocName("")
    setViewingTag("central")
  }

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation()

    const originalConversations = [...conversations]
    setConversations((prev) => prev.filter((c) => c.id !== convId))

    if (selectedConversation?.id === convId) {
      setSelectedConversation(null)
    }

    try {
      await api.delete(`/conversations/${convId}`)
    } catch (err) {
      console.error("Failed to delete conversation:", err)
      setError("Could not delete conversation.")
      setConversations(originalConversations)
    }
  }
  const selectConversation = async (convId) => {
    setIsLoading(true)
    try {
      const response = await api.get(`/conversations/${convId}`)
      setSelectedConversation(response.data)
    } catch (err) {
      console.error("Failed to load conversation:", err)
      setError("Could not load conversation details.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskQuestion = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !tag.trim()) {
      setError("Please enter a question and a subject tag.")
      setTimeout(() => setError(null), 3000)
      return
    }

    const userMessage = { role: "user", content: newMessage, id: Date.now() }

    setSelectedConversation((prev) => ({
      ...prev,
      messages: prev ? [...prev.messages, userMessage] : [userMessage],
    }))
    setNewMessage("")
    setIsLlmLoading(true)

    try {
      const payload = {
        question: newMessage,
        tag: tag,
        conversation_id: selectedConversation?.id || null,
      }
      const response = await api.post("/ask", payload)

      const { answer, sources, conversation_id } = response.data

      const assistantMessage = { role: "assistant", content: answer, sources: sources || [], id: Date.now() + 1 }

      if (selectedConversation && selectedConversation.id === conversation_id) {
        setSelectedConversation((prev) => ({ ...prev, messages: [...prev.messages, assistantMessage] }))
      } else {
        await fetchConversations()
        const newConvResponse = await api.get(`/conversations/${conversation_id}`)
        setSelectedConversation({
          ...newConvResponse.data,
          messages: [...newConvResponse.data.messages, assistantMessage],
        })
      }
    } catch (err) {
      console.error("Failed to ask question:", err)
      setError("Failed to get a response from the assistant.")
      setTimeout(() => setError(null), 3000)
      setSelectedConversation((prev) => ({ ...prev, messages: prev.messages.slice(0, -1) }))
    } finally {
      setIsLlmLoading(false)
    }
  }

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?"
  const handleCopyToClipboard = (text) => {
    if (document.execCommand) {
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand("copy")
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err)
      }
      document.body.removeChild(textArea)
      return
    }
    navigator.clipboard.writeText(text).catch((err) => console.error("Failed to copy text: ", err))
  }

  const DocumentStatusIcon = ({ status }) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case "processing":
        return <Loader className="h-4 w-4 text-cyan-400 animate-spin" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      default:
        return null
    }
  }

  const TypingIndicator = () => (
    <div className="flex gap-4 items-end">
      <AIBlobAvatar />
      <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-lg">
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
  const toggleTagExpansion = (tag) => {
    setExpandedTags((prev) => ({ ...prev, [tag]: !prev[tag] }))
  }
  const animationStyles = `
    .typing-indicator span {
      height: 8px;
      width: 8px;
      background: linear-gradient(135deg, rgba(96, 165, 250, 0.8) 0%, rgba(34, 211, 238, 0.8) 100%);
      border-radius: 50%;
      display: inline-block;
      margin: 0 2px;
      animation: bounce 1.2s infinite ease-in-out;
      box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
    }
    .typing-indicator span:nth-of-type(1) {
      animation-delay: -0.32s;
    }
    .typing-indicator span:nth-of-type(2) {
      animation-delay: -0.16s;
    }
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1.0);
        opacity: 1;
      }
    }
  `

  return (
    <div className="relative min-h-screen flex bg-black font-sans overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora colorStops={["#3b82f6", "#06b6d4", "#8b5cf6"]} amplitude={0.0006} blend={0.7} />
      </div>
      <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/50" />

      <SidebarNavigation />
      <main className="flex-1 flex flex-col h-screen relative z-10">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-white/10 bg-gradient-to-b from-gray-900/60 to-black/80 backdrop-blur-lg flex flex-col shrink-0">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">History</h2>
              <button
                onClick={() => setSelectedConversation(null)}
                className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs font-semibold rounded-lg px-3 py-1.5 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 transition-all duration-200"
              >
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 border-t border-white/10">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-3">Documents</h3>
                <div className="space-y-2">
                  {Object.entries(groupedDocuments).map(([tag, docsInGroup]) => (
                    <div key={tag}>
                      <button
                        onClick={() => toggleTagExpansion(tag)}
                        className="w-full flex justify-between items-center px-2 py-2 text-sm font-semibold text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span>{tag}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform text-gray-400",
                            expandedTags[tag] ? "rotate-180" : "",
                          )}
                        />
                      </button>
                      {expandedTags[tag] && (
                        <div className="pl-2 mt-1 space-y-1">
                          {docsInGroup.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-sm group transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <DocumentStatusIcon status={doc.status} />
                                <span className="truncate text-gray-400 text-xs" title={doc.filename}>
                                  {doc.filename}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleViewDocument(doc.id, doc.filename, tag)}
                                  className="text-gray-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-3">Conversations</h3>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg text-sm group transition-all",
                      selectedConversation?.id === conv.id
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                        : "hover:bg-white/5",
                    )}
                  >
                    <button
                      onClick={() => selectConversation(conv.id)}
                      className={cn(
                        "text-left truncate flex-1 transition-colors",
                        selectedConversation?.id === conv.id
                          ? "text-cyan-300 font-semibold"
                          : "text-gray-400 hover:text-gray-300",
                      )}
                    >
                      {conv.title}
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-gradient-to-b from-black/40 via-black/20 to-black/60 backdrop-blur-sm">
            <style>{animationStyles}</style>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedConversation?.messages?.map((msg, index) => (
                <div
                  key={index}
                  className={cn("flex gap-4 animate-in", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && <AIBlobAvatar />}

                  <div
                    className={cn(
                      "max-w-2xl p-4 rounded-2xl backdrop-blur-lg relative group",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-white rounded-br-none border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                        : "bg-gradient-to-br from-white/10 to-white/5 text-gray-100 rounded-bl-none border border-white/10 shadow-lg shadow-black/20",
                    )}
                  >
                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 border-t border-white/10 pt-3">
                        <h4 className="font-semibold text-cyan-300 mb-2 text-sm">Sources:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                          {msg.sources.map((sourceText, i) => (
                            <li key={i} className="text-xs">
                              {sourceText}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleCopyToClipboard(msg.content)}
                        className="absolute -top-2 -right-2 p-2 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 border border-purple-400/30"
                      title={user.name}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
              ))}

              {isLlmLoading && <TypingIndicator />}

              {!selectedConversation && (
                <div className="text-center text-gray-400 pt-20 flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-2xl" />
                    <BookOpen className="relative h-16 w-16 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Study Assistant</h3>
                  <p className="text-sm text-gray-400">Upload a document or start a new conversation to begin.</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-white/10 p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
              <div className="max-w-4xl mx-auto">
                {error && <p className="text-red-400 text-sm mb-3 text-center font-medium">{error}</p>}

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2 border border-white/20 rounded-full py-2 px-4 bg-white/5 backdrop-blur-lg hover:border-cyan-500/50 focus-within:border-cyan-500/50 transition-all w-72">
                    <Tag className="h-5 w-5 text-cyan-400" />
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full text-sm outline-none bg-transparent text-gray-200"
                    >
                      <option value="central" className="bg-gray-900">
                        General
                      </option>
                      <option value="CNS" className="bg-gray-900">
                        CNS
                      </option>
                      <option value="AISC" className="bg-gray-900">
                        AISC
                      </option>
                      <option value="SE" className="bg-gray-900">
                        SE
                      </option>
                      <option value="BoardGames" className="bg-gray-900">
                        Board Games
                      </option>
                    </select>
                  </div>

                  {file && (
                    <div className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-lg">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => setFile(null)}>
                        <X size={16} className="text-gray-500 hover:text-red-400 transition-colors" />
                      </button>
                      <button
                        onClick={handleFileUpload}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full px-4 py-1 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all ml-2"
                      >
                        {isLoading ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAskQuestion} className="flex items-end gap-3 relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-cyan-400"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                  <textarea
                    placeholder="Ask a question about the subject..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleAskQuestion(e)
                      }
                    }}
                    rows={1}
                    className="flex-1 py-3 px-4 text-sm border border-white/20 rounded-2xl resize-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 bg-white/5 backdrop-blur-lg text-white placeholder-gray-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !newMessage.trim() || !tag.trim()}
                    className="p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Modal isOpen={!!viewingDocId} onClose={handleCloseModal}>
        <DocumentViewer docId={viewingDocId} tag={viewingTag} filename={viewingDocName} />
      </Modal>
    </div>
  )
}

export default function StudyAssistantChatPage({ user }) {
  if (!user) {
    return (
      <div className="min-h-screen flex bg-black font-sans relative">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Aurora colorStops={["#3b82f6", "#06b6d4", "#8b5cf6"]} amplitude={0.0006} blend={0.7} />
        </div>
        <SidebarNavigation />
        <main className="flex-1 flex items-center justify-center relative z-10">
          <Loader className="h-8 w-8 animate-spin text-cyan-400" />
        </main>
      </div>
    )
  }
  return <StudyAssistantChatPageContent user={user} />
}
