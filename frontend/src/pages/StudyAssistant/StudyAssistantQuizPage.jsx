import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import { Upload, HelpCircle, Settings, Plus, X, Loader, CheckCircle, AlertTriangle, Trash2, ChevronDown, FileText, Tag, BookOpen, Repeat, Check, Award } from "lucide-react";
import api from "../../services/api"; // Ensure this path is correct

// Helper function for class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Re-used component from Chat page for document status
const DocumentStatusIcon = ({ status }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
};

export default function StudyAssistantQuizPage() {
    const [step, setStep] = useState(1); // 1: Upload, 2: Customize, 3: Quiz, 4: Results
    
    // --- Step 1 State ---
    const [uploadedContent, setUploadedContent] = useState("");
    const [file, setFile] = useState(null);
    const [tag, setTag] = useState("central");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // --- Step 2 State ---
    const [quizSettings, setQuizSettings] = useState({
        max_questions: 10,
        question_types: ["Multiple choice", "True or false", "Fill in the blank"],
        language: "English",
        hard_mode: false,
    });
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Step 3 State ---
    const [currentQuizSession, setCurrentQuizSession] = useState(null); // Holds {id, status, questions: []}
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // Stores {question_id: "selected_answer_string"}
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Step 4 State ---
    const [quizResults, setQuizResults] = useState(null); // Stores the full results object from /submit

    // --- Sidebar & General State ---
    const [documents, setDocuments] = useState([]);
    const [quizHistory, setQuizHistory] = useState([]);
    const [selectedDocForQuiz, setSelectedDocForQuiz] = useState(null); // {id, tag, filename}
    const [expandedTags, setExpandedTags] = useState({});
    const [error, setError] = useState(null);
    const pollingIntervals = useRef(new Map()).current;

    const allQuestionTypes = ["Multiple choice", "True or false", "Short response", "Fill in the blank", "Essay questions"];

    // --- Data Fetching & Polling ---

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

    const fetchQuizHistory = useCallback(async () => {
        try {
            const response = await api.get("/quiz/history");
            setQuizHistory(response.data);
        } catch (err) {
            console.error("Failed to fetch quiz history:", err);
            setError("Could not load quiz history.");
        }
    }, []);

    const groupedDocuments = useMemo(() => {
        return documents.reduce((acc, doc) => {
            const tag = doc.tag || 'Uncategorized';
            if (!acc[tag]) { acc[tag] = []; }
            acc[tag].push(doc);
            return acc;
        }, {});
    }, [documents]);

    useEffect(() => {
        fetchDocuments();
        fetchQuizHistory();
        return () => pollingIntervals.forEach(intervalId => clearInterval(intervalId));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // --- Reset Function ---
    const handleStartNewQuiz = () => {
        setStep(1);
        setUploadedContent("");
        setFile(null);
        setSelectedDocForQuiz(null);
        setCurrentQuizSession(null);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setQuizResults(null);
        setError(null);
    };

    // --- Sidebar Handlers ---

    const handleDeleteDocument = async (docId, e) => {
        e.stopPropagation();
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
    const handleDeleteQuiz = async (quizId, e) => {
        e.stopPropagation();
        const originalHistory = [...quizHistory];
        setQuizHistory(prev => prev.filter(q => q.id !== quizId));
        try {
            await api.delete(`/quiz/${quizId}`);
            if (pollingIntervals.has(quizId)) {
                clearInterval(pollingIntervals.get(quizId));
                pollingIntervals.delete(quizId);
            }
        } catch (err) {
            console.error("Failed to delete quiz:", err);
            setError("Could not delete quiz.");
            setQuizHistory(originalHistory);
        }
    };
    const handleSelectDocFromSidebar = (doc) => {
        if (doc.status !== 'completed') {
            setError("Please wait for the document to finish processing.");
            return;
        }
        handleStartNewQuiz(); // Reset first
        setSelectedDocForQuiz({ id: doc.id, tag: doc.tag, filename: doc.filename });
        setStep(2); // Move to customize step
    };

    const handleFetchResults = async (sessionId) => {
        try {
            handleStartNewQuiz(); // Reset state just in case
            const response = await api.get(`/quiz/results/${sessionId}`);
            setQuizResults(response.data);
            setStep(4); // Go straight to the results page
        } catch (err) {
            console.error("Failed to fetch quiz results:", err);
            setError(err.response?.data?.detail || "Could not load quiz results.");
        }
    };

    const handleSelectQuizFromSidebar = async (quizItem) => {
        // Use .toLowerCase() for a robust, case-insensitive check
        if (quizItem.status.toLowerCase() === 'completed') {
            // Instead of showing an error, call the new function
            await handleFetchResults(quizItem.id);
            
        } else {
            // Status is 'in_progress', so resume the quiz (this logic is unchanged)
            try {
                const response = await api.get(`/quiz/session/${quizItem.id}`);
                handleStartNewQuiz(); // Reset first
                setCurrentQuizSession(response.data); // This has the questions
                setStep(3); // Go to the quiz
            } catch (err) {
                console.error("Failed to fetch quiz session:", err);
                setError(err.response?.data?.detail || "Could not resume this quiz.");
            }
        }
    };

    const toggleTagExpansion = (tag) => {
        setExpandedTags(prev => ({ ...prev, [tag]: !prev[tag] }));
    };

    // --- Quiz Step Handlers ---

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadedContent(""); // Clear pasted content
            setSelectedDocForQuiz(null); // Clear doc selection
        }
    };

    const handleQuizFileUpload = async () => {
        if (!file || !tag.trim()) {
            setError("Please select a file and provide a subject tag.");
            return;
        }
        setIsUploading(true);
        setError(null);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tag", tag);

        try {
            const response = await api.post("/upload_for_quiz", formData, { headers: { "Content-Type": "multipart/form-data" } });
            const newDoc = response.data;
            
            setDocuments(prev => [newDoc, ...prev]); // Add to sidebar list
            pollDocumentStatus(newDoc.id); // Start polling
            
            // Set as the selected doc for quiz gen
            setSelectedDocForQuiz({ id: newDoc.id, tag: newDoc.tag, filename: newDoc.filename });
            setFile(null); // Clear file input
            setStep(2); // Move to customize step
        } catch (err) {
            console.error("File upload failed:", err);
            setError(err.response?.data?.detail || "File upload failed.");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handlePasteContinue = () => {
        if (!uploadedContent.trim()) {
            setError("Please paste some content to continue.");
            return;
        }
        setSelectedDocForQuiz(null); // Ensure no doc is selected
        setFile(null); // Ensure no file is selected
        setStep(2);
    };

    const handleGenerateQuiz = async () => {
        setIsGenerating(true);
        setError(null);
        const formData = new FormData();
        
        // Convert to camelCase for the alias
        const settingsForAPI = {
            maxQuestions: quizSettings.max_questions,
            questionTypes: quizSettings.question_types,
            language: quizSettings.language,
            hardMode: quizSettings.hard_mode
        }
        
        formData.append("settings_json", JSON.stringify(settingsForAPI));

        if (selectedDocForQuiz) {
            formData.append("document_id", selectedDocForQuiz.id);
            formData.append("tag", selectedDocForQuiz.tag);
        } else if (uploadedContent.trim()) {
            formData.append("text_content", uploadedContent.trim());
        } else {
            setError("No content source. Please upload a doc or paste text.");
            setIsGenerating(false);
            setStep(1); // Go back to step 1
            return;
        }

        try {
            const response = await api.post("/generate_quiz", formData);
            setCurrentQuizSession(response.data); // Save the full quiz session
            setUserAnswers({}); // Reset answers for new quiz
            setCurrentQuestionIndex(0); // Reset to first question
            fetchQuizHistory(); // Refetch history to show the new "in_progress" item
            setStep(3); // Move to quiz
        } catch (err) {
            console.error("Failed to generate quiz:", err);
            setError(err.response?.data?.detail || "Failed to generate quiz.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    // This function now works for all input types
    const handleAnswerSelect = (questionId, selectedAnswer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: selectedAnswer
        }));
    };

    // --- Quiz Navigation (Step 3) ---
    const goToNextQuestion = () => {
        if (currentQuestionIndex < currentQuizSession.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    const goToPrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };
    const handleSubmitQuiz = async () => {
        setIsSubmitting(true);
        setError(null);

        // 1. Format answers into the list required by the schema
        const payload = {
            session_id: currentQuizSession.id,
            answers: Object.entries(userAnswers).map(([qid, ans]) => ({
                question_id: parseInt(qid, 10),
                selected_answer: ans
            }))
        };
        
        // Ensure all questions have an answer (even if empty string)
        currentQuizSession.questions.forEach(q => {
            if (!payload.answers.find(a => a.question_id === q.id)) {
                payload.answers.push({ question_id: q.id, selected_answer: "" });
            }
        });

        try {
            const response = await api.post("/quiz/submit", payload);
            setQuizResults(response.data); // Save the results
            setStep(4); // Move to results page
            fetchQuizHistory(); // Update sidebar (status change to 'completed')
        } catch (err) {
            console.error("Failed to submit quiz:", err);
            setError(err.response?.data?.detail || "Failed to submit quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- UI Helpers ---
    const removeQuestionType = (typeToRemove) => {
        setQuizSettings(prev => ({
            ...prev,
            question_types: prev.question_types.filter(type => type !== typeToRemove),
        }));
    };

    const addQuestionType = (type) => {
        if (type && !quizSettings.question_types.includes(type)) {
            setQuizSettings(prev => ({
                ...prev,
                question_types: [...prev.question_types, type],
            }));
        }
    };

    // Get current question object for Step 3
    const currentQuestion = currentQuizSession?.questions[currentQuestionIndex];

    // --- NEW HELPER COMPONENT ---
    // This component renders the correct input based on the question type.
    // It's defined inside the main component to have access to `cn` and `handleAnswerSelect`.
    const QuestionInput = ({ question, userAnswer, onAnswerSelect }) => {
        // Handle cases where question might be null briefly
        if (!question) return null; 
        
        const questionType = question.question_type.toLowerCase();

        if (questionType === 'multiple choice' ) {
            if (!question.options || Object.keys(question.options).length === 0) {
                return <p className="text-red-500">Error: This multiple choice question is missing options.</p>;
            }
            
            return (
                <div className="space-y-3">
                    {Object.entries(question.options).map(([key, value]) => (
                        <label 
                            key={key} 
                            className={cn(
                                "flex items-center gap-3 p-4 border-2 rounded-xl hover:border-purple-300 cursor-pointer transition-colors",
                                userAnswer === key ? "border-purple-500 bg-purple-50" : "border-gray-200"
                            )}
                        >
                            <input 
                                type="radio" 
                                name={question.id.toString()} 
                                value={key}
                                checked={userAnswer === key}
                                onChange={() => onAnswerSelect(question.id, key)}
                                className="text-purple-600 focus:ring-purple-500"
                            />
                            <span>{value}</span>
                        </label>
                    ))}
                </div>
            );
        }
        if (questionType === 'true or false') {
            if (!question.options || Object.keys(question.options).length === 0) {
                return <p className="text-red-500">Error: This multiple choice question is missing options.</p>;
            }
            return (
                <div className="space-y-3">
                    {['True', 'False'].map((option) => (
                        <label
                            key={option}
                            className={cn(
                                "flex items-center gap-3 p-4 border-2 rounded-xl hover:border-purple-300 cursor-pointer transition-colors",
                                userAnswer === option ? "border-purple-500 bg-purple-50" : "border-gray-200"
                            )}
                        >
                            <input
                                type="radio"
                                name={question.id.toString()}
                                value={option}
                                checked={userAnswer === option}
                                onChange={() => onAnswerSelect(question.id, option)}
                                className="text-purple-600 focus:ring-purple-500"
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            );
        }
        if (questionType === 'fill in the blank') {
            return (
                <div className="space-y-2">
                    <input 
                        type="text"
                        placeholder="Type your answer here..."
                        value={userAnswer || ""}
                        onChange={(e) => onAnswerSelect(question.id, e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md"
                    />
                </div>
            );
        }

        if (questionType === 'short response' || questionType === 'essay questions') {
            return (
                <div className="space-y-2">
                    <textarea 
                        rows="4"
                        placeholder="Type your response here..."
                        value={userAnswer || ""}
                        onChange={(e) => onAnswerSelect(question.id, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md resize-y"
                    />
                </div>
            );
        }

        // Fallback for unknown question types
        return <p className="text-gray-500">Unsupported question type: {question.question_type}</p>;
    };
    // --- END OF NEW HELPER COMPONENT ---


    return (
        <div className="min-h-screen flex bg-gray-100 font-sans">
            <SidebarNavigation />

            {/* --- Sidebar (Adapted from Chat) --- */}
            <div className="w-80 border-r bg-white flex flex-col shrink-0 h-screen">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Quiz Generator</h2>
                    <button onClick={handleStartNewQuiz} className="bg-gray-100 text-gray-700 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-gray-200">
                        New Quiz
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {/* Documents Section */}
                    <div className="p-2 border-t">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">My Documents</h3>
                        <div className="space-y-2">
                            {Object.entries(groupedDocuments).map(([tag, docsInGroup]) => (
                                <div key={tag}>
                                    <button onClick={() => toggleTagExpansion(tag)} className="w-full flex justify-between items-center px-2 py-1 text-sm font-semibold text-gray-600 rounded-md hover:bg-gray-100">
                                        <span>{tag}</span>
                                        <ChevronDown className={cn("h-4 w-4 transition-transform", expandedTags[tag] ? "rotate-180" : "")} />
                                    </button>
                                    {expandedTags[tag] && (
                                        <div className="pl-2 mt-1 space-y-1">
                                            {docsInGroup.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 text-sm group">
                                                    <button onClick={() => handleSelectDocFromSidebar(doc)} className="flex items-center gap-2 truncate flex-1 text-left" title={`Use ${doc.filename} for a quiz`}>
                                                        <DocumentStatusIcon status={doc.status} />
                                                        <span className={cn("truncate", doc.status === 'completed' ? 'text-gray-600' : 'text-gray-400')}>{doc.filename}</span>
                                                    </button>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button onClick={(e) => handleDeleteDocument(doc.id, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    {/* Quiz History Section */}
                    <div className="p-2 border-t">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Quiz History</h3>
                        {quizHistory.map(quiz => (
                            <div key={quiz.id} className="w-full flex items-center justify-between p-2 rounded-lg text-sm group hover:bg-gray-100">
                                <button onClick={() => handleSelectQuizFromSidebar(quiz)} className="text-left truncate flex-1 text-gray-600" title={quiz.status === 'in_progress' ? 'Resume quiz' : 'View results'}>
                                    <span className="font-medium block">{quiz.source_document_filename}</span>
                                    <span className="text-xs text-gray-400">{new Date(quiz.created_at).toLocaleString()}</span>
                                </button>
                                <div className="text-right shrink-0">
                                    <span className={cn("font-semibold", quiz.status === 'completed' ? 'text-gray-700' : 'text-yellow-600')}>
                                        {quiz.score !== null ? `${quiz.score}%` : quiz.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <button onClick={(e) => handleDeleteQuiz(quiz.id, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <main className="flex-1 p-8 overflow-y-auto h-screen bg-gray-50">
                {/* Global Error Popup */}
                {error && (
                    <div className="max-w-4xl mx-auto mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-center">
                        {error}
                    </div>
                )}
                
                {/* Step 1: Upload View */}
                {step === 1 && (
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <HelpCircle className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Quiz Generator</h1>
                                    <p className="text-gray-600">Upload material or select from the sidebar to create a quiz</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                                    <span className="text-purple-600 font-medium">Upload</span>
                                </div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">2</div><span className="text-gray-500">Customize</span></div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">3</div><span className="text-gray-500">Quiz</span></div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">4</div><span className="text-gray-500">Results</span></div>
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* File Upload */}
                            <div className="rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors bg-white p-6 flex flex-col justify-between">
                                <div>
                                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Upload className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Upload Document</h3>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 border rounded-full py-2 px-3 bg-gray-50 w-full mb-4">
                                        <Tag className="h-5 w-5 text-gray-400" />
                                        <select value={tag} onChange={(e) => setTag(e.target.value)} className="w-full text-m outline-none bg-transparent">
                                            <option value="central">General</option><option value="CNS">CNS</option><option value="BoardGames">Board Games</option>
                                        </select>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    
                                    {!file && (
                                        <button onClick={() => fileInputRef.current.click()} className="w-full h-12 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium">
                                            Choose File
                                        </button>
                                    )}
                                    {file && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-700 border p-2 rounded-md">
                                                <FileText className="h-4 w-4 text-gray-500 shrink-0"/>
                                                <span className="truncate flex-1">{file.name}</span>
                                                <button onClick={() => setFile(null)}><X size={16} className="text-gray-500 hover:text-red-600"/></button>
                                            </div>
                                            <button 
                                                onClick={handleQuizFileUpload} 
                                                disabled={isUploading || !tag} 
                                                className="w-full h-12 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isUploading ? "Uploading..." : "Upload and Continue"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Text Input */}
                            <div className="rounded-lg border-2 border-gray-200 bg-white flex flex-col">
                                <div className="p-6 border-b"><h3 className="text-lg font-semibold">Or Paste Your Content</h3></div>
                                <div className="p-6 space-y-4 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Study Material</label>
                                        <textarea
                                            id="content"
                                            placeholder="Paste your notes or any study material here..."
                                            value={uploadedContent}
                                            onChange={(e) => { setUploadedContent(e.target.value); setFile(null); setSelectedDocForQuiz(null); }}
                                            rows="12"
                                            className="mt-2 w-full p-2 border border-gray-300 rounded-md resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePasteContinue}
                                        disabled={!uploadedContent.trim()}
                                        className="w-full h-12 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium disabled:bg-gray-400"
                                    >
                                        Continue to Customize
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Step 2: Customize View */}
                {step === 2 && (
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Settings className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Customize Quiz</h1>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div><span className="text-green-600 font-medium">Upload</span></div>
                                <div className="w-12 h-0.5 bg-green-600"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div><span className="text-purple-600 font-medium">Customize</span></div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">3</div><span className="text-gray-500">Quiz</span></div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">4</div><span className="text-gray-500">Results</span></div>
                            </div>
                        </div>
                        {/* Customization Form */}
                        <div className="rounded-lg border-2 border-gray-200 bg-white">
                            <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold">Quiz Settings</h3>
                                {selectedDocForQuiz ? (
                                    <p className="text-sm text-gray-500">Generating quiz from: <span className="font-medium text-gray-700">{selectedDocForQuiz.filename}</span></p>
                                ) : (
                                    <p className="text-sm text-gray-500">Generating quiz from: <span className="font-medium text-gray-700">Pasted Content</span></p>
                                )}
                            </div>
                            <div className="p-6 space-y-8">
                                {/* Max Questions */}
                                <div>
                                    <label htmlFor="maxQuestions" className="text-base font-medium">Maximum number of questions</label>
                                    <div className="mt-2">
                                        <input
                                            id="maxQuestions" type="number"
                                            value={quizSettings.max_questions}
                                            onChange={(e) => setQuizSettings(prev => ({ ...prev, max_questions: parseInt(e.target.value, 10) || 10 }))}
                                            className="w-24 h-10 px-3 border border-gray-300 rounded-md" min="1" max="50"
                                        />
                                    </div>
                                </div>
                                {/* Question Types */}
                                <div>
                                    <label className="text-base font-medium">Question Types</label>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {quizSettings.question_types.map(type => (
                                            <span key={type} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                                                {type}
                                                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => removeQuestionType(type)} />
                                            </span>
                                        ))}
                                    </div>
                                    <select onChange={(e) => addQuestionType(e.target.value)} className="w-48 mt-3 h-10 px-3 border border-gray-300 rounded-md bg-white text-sm">
                                        <option value="">Add question type</option>
                                        {allQuestionTypes
                                            .filter(type => !quizSettings.question_types.includes(type))
                                            .map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex justify-between pt-6 border-t">
                                    <button onClick={() => setStep(1)} className="h-10 px-6 rounded-xl border font-medium text-sm">Back</button>
                                    <button onClick={handleGenerateQuiz} disabled={isGenerating} className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm disabled:bg-purple-300">
                                        {isGenerating ? "Generating..." : "Generate Quiz"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Quiz View */}
                {step === 3 && currentQuizSession && currentQuestion && (
                    <div className="max-w-4xl mx-auto">
                        {/* Quiz Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Quiz in Progress</h1>
                                    <p className="text-gray-600">Question {currentQuestionIndex + 1} of {currentQuizSession.questions.length}</p>
                                </div>
                                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 h-10 px-4 border rounded-xl text-sm font-medium"><Settings className="h-4 w-4" />Settings</button>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / currentQuizSession.questions.length) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="rounded-lg border-2 border-gray-200 bg-white mb-8">
                            <div className="p-8">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-purple-600 font-medium">{currentQuestionIndex + 1}</span></div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-gray-900 mb-6">{currentQuestion.question_text}</h3>
                                        
                                        {/* --- UPDATED THIS SECTION --- */}
                                        {/* This now renders the correct input based on question type */}
                                        <QuestionInput
                                            question={currentQuestion}
                                            userAnswer={userAnswers[currentQuestion.id]}
                                            onAnswerSelect={handleAnswerSelect}
                                        />
                                        {/* --- END OF UPDATE --- */}
                                        
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between">
                            <button onClick={goToPrevQuestion} disabled={currentQuestionIndex === 0} className="h-10 px-6 rounded-xl border font-medium text-sm disabled:opacity-50">Previous</button>
                            <div className="flex gap-3">
                                {currentQuestionIndex < currentQuizSession.questions.length - 1 ? (
                                    <button onClick={goToNextQuestion} className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm">Next Question</button>
                                ) : (
                                    <button onClick={handleSubmitQuiz} disabled={isSubmitting} className="h-10 px-8 bg-green-600 text-white rounded-xl font-medium text-sm disabled:bg-green-300">
                                        {isSubmitting ? "Submitting..." : "Finish Quiz"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Loading state for Step 3 */}
                {step === 3 && !currentQuizSession && (
                    <div className="text-center text-gray-500 pt-20">
                        <Loader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Loading Quiz</h3>
                        <p className="mt-1 text-sm text-gray-500">This may take a moment...</p>
                    </div>
                )}

                {/* Step 4: Results View */}
                {step === 4 && quizResults && (
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Award className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Quiz Results</h1>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div><span className="text-green-600 font-medium">Upload</span></div>
                                <div className="w-12 h-0.5 bg-green-600"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div><span className="text-green-600 font-medium">Customize</span></div>
                                <div className="w-12 h-0.5 bg-green-600"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div><span className="text-green-600 font-medium">Quiz</span></div>
                                <div className="w-12 h-0.5 bg-green-600"></div>
                                <div className="flex items-center gap-2"><div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div><span className="text-purple-600 font-medium">Results</span></div>
                            </div>
                        </div>

                        {/* Score Summary */}
                        <div className="text-center bg-white p-8 rounded-lg border-2 border-gray-200 mb-8">
                            <h2 className="text-lg font-medium text-gray-500">Your Score</h2>
                            <p className="text-7xl font-bold text-purple-600 my-2">{quizResults.score}%</p>
                            <button onClick={handleStartNewQuiz} className="mt-4 h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm inline-flex items-center gap-2">
                                <Repeat className="h-4 w-4" /> Take New Quiz
                            </button>
                        </div>
                        
                        {/* Graded Questions */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-800">Review Your Answers</h3>
                            {quizResults.results.map((res, index) => (
                                <div key={index} className="bg-white p-6 rounded-lg border-2 border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
                                            res.is_correct ? "bg-green-500" : "bg-red-500"
                                        )}>
                                            {res.is_correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-4">{res.question_text}</h4>
                                            <div className="space-y-2">
                                                <p className={cn(
                                                    "text-sm p-2 rounded-md",
                                                    res.is_correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                )}>
                                                    <strong>Your Answer: </strong>{res.your_answer || (<i>No answer provided</i>)}
                                                </p>
                                                {!res.is_correct && (
                                                    <p className="text-sm p-2 rounded-md bg-green-100 text-green-800">
                                                        <strong>Correct Answer: </strong>{res.correct_answer}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}