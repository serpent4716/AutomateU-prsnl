import React, { useState, useEffect, useRef, useCallback, useMemo} from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import { Send, BookOpen, Trash2, FileText, Paperclip, Tag, AlertTriangle, CheckCircle, Loader, Copy, Bot, X , Eye, ChevronDown, Menu} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import api from "../../services/api";

const cn = (...classes) => classes.filter(Boolean).join(' ');
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <h2 className="text-xl font-semibold text-gray-700">Document Viewer</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 font-bold text-2xl w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                        &times;
                    </button>
                </div>
                <div className="flex-grow">
                    {children}
                </div>
            </div>
        </div>
    );
};
const DocumentViewer = ({ docId }) => {
    if (!docId) return null;
    const src = `${api.defaults.baseURL}/document/${docId}`;

    return (
      <iframe
        src={src}
        title={`Document Viewer - ${docId}`}
        className="w-full h-full border-0"
      >
        Your browser does not support embedding this file type.
      </iframe>
    );
};
function StudyAssistantChatPageContent({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [tag, setTag] = useState("central");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const pollingIntervals = useRef(new Map()).current;

  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [viewingDocId, setViewingDocId] = useState(null);
  const [viewingTag, setViewingTag] = useState("central");
  const [viewingDocName, setViewingDocName] = useState("");
  const [expandedTags, setExpandedTags] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  // --- THE FIX: Moved function definitions out of useEffect ---
  // We wrap them in useCallback to prevent them from being recreated on every render.
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get("/conversations");
      setConversations(response.data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      setError("Could not load conversations.");
    }
  }, []); // Empty dependency array means this function is created only once.

  const pollDocumentStatus = useCallback((docId) => {
    if (pollingIntervals.has(docId)) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await api.get(`/documents/${docId}/status`);
        const updatedDoc = response.data;
        setDocuments(prevDocs => prevDocs.map(d => d.id === docId ? updatedDoc : d));

        if (updatedDoc.status === 'completed' || updatedDoc.status === 'failed') {
          clearInterval(pollingIntervals.get(docId));
          pollingIntervals.delete(docId);
        }
      } catch (err) {
        console.error(`Failed to poll status for doc ${docId}:`, err);
        clearInterval(pollingIntervals.get(docId));
        pollingIntervals.delete(docId);
      }
    }, 5000);

    pollingIntervals.set(docId, intervalId);
  }, [pollingIntervals]);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
      response.data.forEach(doc => {
        if (doc.status === 'processing') {
          pollDocumentStatus(doc.id);
        }
      });
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  }, [pollDocumentStatus]);
  const groupedDocuments = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const tag = doc.tag || 'Uncategorized';
      if (!acc[tag]) {
        acc[tag] = [];
      }
      acc[tag].push(doc);
      return acc;
    }, {});
  }, [documents]);
  const availableTags = useMemo(() => {
    const tags = new Set(["central"]);
    documents.forEach((doc) => {
      if (doc.tag && doc.tag.trim()) tags.add(doc.tag.trim());
    });
    return Array.from(tags);
  }, [documents]);
  // This useEffect now just CALLS the functions on initial load.
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchDocuments();
    }
    
    return () => pollingIntervals.forEach(intervalId => clearInterval(intervalId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchConversations, fetchDocuments]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tag", tag.trim() || "central");

    try {
      const response = await api.post("/upload_doc", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const newDoc = response.data;
      setDocuments(prev => [newDoc, ...prev]);
      pollDocumentStatus(newDoc.id);
      setFile(null);
    } catch (err) {
      console.error("File upload failed:", err);
      setError(err.response?.data?.detail || "File upload failed.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteDocument = async (docId) => {
    const originalDocuments = [...documents];
    setDocuments(prev => prev.filter(d => d.id !== docId));
    try {
      await api.delete(`/documents/${docId}`);
      if (pollingIntervals.has(docId)) {
        clearInterval(pollingIntervals.get(docId));
        pollingIntervals.delete(docId);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
      setError("Could not delete document.");
      setDocuments(originalDocuments);
    }
  };

const handleViewDocument = (docId, docName, tag) => {
        console.log(`Requesting to view document with ID: ${docId}`);
        setViewingDocId(docId);
        setViewingDocName(docName);
        setViewingTag(tag);
        setIsSidebarOpen(false);
    };

    const handleCloseModal = () => {
        setViewingDocId(null);
        setViewingDocName("");
        setViewingTag("central");
    };

  const handleDeleteConversation = async (convId, e) => {
    // This stops the click from also selecting the conversation.
    e.stopPropagation();

    // Optimistically remove the conversation from the sidebar list.
    const originalConversations = [...conversations];
    setConversations(prev => prev.filter(c => c.id !== convId));

    // If the deleted conversation was the one being viewed, clear the chat window.
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
    }

    try {
      // Call the backend API to delete the conversation from the database.
      await api.delete(`/conversations/${convId}`);
      // On success, do nothing as the UI is already updated.
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      setError("Could not delete conversation.");
      // If the API call fails, revert the UI to its original state.
      setConversations(originalConversations);
    }
  };
  const selectConversation = async (convId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/conversations/${convId}`);
      setSelectedConversation(response.data);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Could not load conversation details.");
    } finally {
      setIsLoading(false);
    }
  };

  // This function can now correctly call `fetchConversations`
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      setError("Please enter a question.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const userMessage = { role: 'user', content: newMessage, id: Date.now() };
    
    // Optimistically update the UI with the user's message
    setSelectedConversation(prev => ({
        ...prev,
        messages: prev ? [...prev.messages, userMessage] : [userMessage]
    }));
    setNewMessage("");
    setIsLlmLoading(true); // Show the typing indicator

    try {
      const payload = {
        question: newMessage,
        tag: tag.trim() || "central",
        conversation_id: selectedConversation?.id || null,
      };
      const response = await api.post("/ask", payload);
      
      // THE FIX: Correctly destructure and handle the `sources` array from the response.
      const { answer, sources, conversation_id } = response.data;
      
      // Create the new assistant message object, now including the sources.
      const assistantMessage = { role: 'assistant', content: answer, sources: sources || [], id: Date.now() + 1 };

      if (selectedConversation && selectedConversation.id === conversation_id) {
         // If it's an existing conversation, just add the new message.
         setSelectedConversation(prev => ({ ...prev, messages: [...prev.messages, assistantMessage] }));
      } else {
         // If it's a NEW conversation, we need to handle it differently.
         await fetchConversations(); // Update the sidebar list
         // Instead of re-fetching (which would lose the sources), we construct the new conversation state
         // using the data we just received.
         const newConvResponse = await api.get(`/conversations/${conversation_id}`);
         setSelectedConversation({
             ...newConvResponse.data,
             messages: [...newConvResponse.data.messages, assistantMessage]
         });
      }
    } catch (err) {
      console.error("Failed to ask question:", err);
      setError(err.response?.data?.detail || "Failed to get a response from the assistant.");
      setTimeout(() => setError(null), 3000);
      // Revert the optimistic UI update on failure
      setSelectedConversation(prev => ({...prev, messages: prev.messages.slice(0, -1)}));
    } finally {
      setIsLlmLoading(false); // Hide the typing indicator
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  const handleCopyToClipboard = (text, messageId) => {
    if (document.execCommand) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 500);
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 500);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };
  
  const DocumentStatusIcon = ({ status }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  // This is the new component for the loading animation.
  const TypingIndicator = () => (
    <div className="flex gap-4 items-center">
      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0"><Bot size={20} /></div>
      <div className="p-4 rounded-xl bg-white shadow-sm">
        <div className="typing-indicator">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
  const toggleTagExpansion = (tag) => {
    setExpandedTags(prev => ({ ...prev, [tag]: !prev[tag] }));
  };
  // This CSS creates the bouncing dots animation.
  const animationStyles = `
    .typing-indicator span {
      height: 8px;
      width: 8px;
      background-color: #9E9EA1;
      border-radius: 50%;
      display: inline-block;
      margin: 0 2px;
      animation: bounce 1.2s infinite ease-in-out;
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
      }
      40% {
        transform: scale(1.0);
      }
    }
  `;
  
  return (
    <div className="min-h-screen flex bg-gray-100 font-sans dark:bg-slate-950">
      <SidebarNavigation />
      <main className="flex-1 flex flex-col h-screen">
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div
            className={cn(
              "w-72 md:w-80 border-r bg-white flex flex-col shrink-0 z-30",
              "fixed md:static inset-y-0 left-0 transform transition-transform duration-200",
              "dark:bg-gray-900 dark:border-gray-800",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">History</h2>
              <button onClick={() => setSelectedConversation(null)} className="bg-gray-100 text-gray-700 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">New Chat</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 border-t">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Documents</h3>
                <div className="space-y-2">
                  {Object.entries(groupedDocuments).map(([tag, docsInGroup]) => (
                    <div key={tag}>
                      <button onClick={() => toggleTagExpansion(tag)} className="w-full flex justify-between items-center px-2 py-1 text-sm font-semibold text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                        <span>{tag}</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedTags[tag] ? "rotate-180" : "")} />
                      </button>
                      {expandedTags[tag] && (
                        <div className="pl-2 mt-1 space-y-1">
                          {docsInGroup.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm group">
                              <div className="flex items-center gap-2 truncate">
                                <DocumentStatusIcon status={doc.status} />
                                <span className="truncate text-gray-600 dark:text-gray-300" title={doc.filename}>{doc.filename}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => handleViewDocument(doc.id, doc.filename, tag)} className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Conversations</h3>
                {conversations.map(conv => (
                  <div key={conv.id} className={cn(
                    "w-full flex items-center justify-between p-2 rounded-lg text-sm group",
                    selectedConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}>
                    <button onClick={() => selectConversation(conv.id)} className={cn(
                        "text-left truncate flex-1",
                        selectedConversation?.id === conv.id ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-gray-600 dark:text-gray-300'
                    )}>
                      {conv.title}
                    </button>
                    <button 
                      onClick={(e) => handleDeleteConversation(conv.id, e)} 
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
            </div>
          </div>
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
          )}

          {/* Main Chat Window */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950">
            {/* Add the style tag here */}
            <style>{animationStyles}</style>

            <div className="px-3 md:px-6 pt-3 md:pt-6">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border bg-white text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200"
              >
                <Menu className="h-4 w-4" />
                Menu
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">
              {selectedConversation?.messages?.map((msg, index) => (
                <div key={index} className={cn("flex gap-4", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0"><Bot size={20} /></div>}
                  
                  <div className={cn(
                    "max-w-2xl p-3 md:p-4 rounded-xl relative group prose prose-sm max-w-none", 
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none dark:bg-gray-900 dark:text-gray-100 dark:border dark:border-gray-800'
                  )}>
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>

                    {/* THE FIX: This block now correctly renders the sources array as a list of strings. */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 border-t pt-2">
                        <h4 className="font-semibold text-gray-500 mb-1 not-prose">Sources:</h4>
                        <ol className="list-decimal list-inside spacey-1  text-gray-700 not-prose">
                          {msg.sources.map((sourceText, i) => (
                            <li key={i}>{sourceText}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    {msg.role === 'assistant' && (
                      <>
                        <button onClick={() => handleCopyToClipboard(msg.content, msg.id || index)} className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy size={14} />
                        </button>
                        {copiedMessageId === (msg.id || index) && (
                          <div className="absolute -top-10 right-0 px-2 py-1 rounded-md text-xs bg-gray-900 text-white shadow-lg animate-pulse">
                            Copied
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {msg.role === 'user' && <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm shrink-0" title={user.name}>{getInitials(user.name)}</div>}
                </div>
              ))}

              {/* This line renders the typing indicator when active */}
              {isLlmLoading && <TypingIndicator />}

              {!selectedConversation && 
                <div className="text-center text-gray-500 pt-20">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Study Assistant</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload a document or start a new conversation.</p>
                </div>
              }
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-3 md:p-4 bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 dark:border-gray-800">
              <div className="max-w-3xl mx-auto">
                {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                  {/* Resized Tag Input */}
                  <div className="flex items-center gap-2 border rounded-full py-2 px-3 bg-white dark:bg-gray-900 dark:border-gray-800 w-full md:w-64">
                    <Tag className="h-5 w-5 text-gray-400" />
                    <input
                      list="subject-tags"
                      placeholder="General (optional)"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full text-sm outline-none bg-transparent dark:text-gray-200"
                    />
                    <datalist id="subject-tags">
                      {availableTags.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  
                  {/* Styled Upload Button */}
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FileText className="h-4 w-4"/>
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button onClick={() => setFile(null)}><X size={16} className="text-gray-500 hover:text-red-600"/></button>
                        <button 
                          onClick={handleFileUpload} 
                          disabled={isLoading} 
                          className="bg-blue-600 text-white text-xs font-semibold rounded-md px-3 py-1 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? "Uploading..." : "Upload"}
                        </button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAskQuestion} className="flex items-center gap-2 relative">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  
                  <textarea
                    placeholder="Ask a question about the subject..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskQuestion(e); } }}
                    rows={1}
                    className="w-full py-3 pl-12 pr-12 text-sm border rounded-full resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  <button type="submit" disabled={isLoading || !newMessage.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
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
  );
}

// This wrapper component handles the loading state before the user prop is available.
export default function StudyAssistantChatPage({ user }) {
    if (!user) {
        return (
            <div className="min-h-screen flex bg-gray-100 font-sans">
                <SidebarNavigation />
                <main className="flex-1 flex items-center justify-center">
                    <Loader className="h-8 w-8 animate-spin text-gray-400" />
                </main>
            </div>
        );
    }
    return <StudyAssistantChatPageContent user={user} />;
}

