import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import {
  Upload,
  HelpCircle,
  Settings,
  Plus,
  X,
  Loader,
  CheckCircle,
  AlertTriangle,
  Trash2,
  ChevronDown,
  FileText,
  Tag,
  BookOpen,
  Repeat,
  Check,
  Award,
  Menu,
} from "lucide-react";
import api from "../../services/api"; // Ensure this path is correct

// Helper function for class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Re-used component from Chat page for document status
const DocumentStatusIcon = ({ status }) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "processing":
      return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return null;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const allQuestionTypes = [
    "Multiple choice",
    "True or false",
    "Short response",
    "Fill in the blank",
    "Essay questions",
  ];

  // --- Data Fetching & Polling ---

  const pollDocumentStatus = useCallback(
    (docId) => {
      if (pollingIntervals.has(docId)) return;
      const intervalId = setInterval(async () => {
        try {
          const response = await api.get(`/documents/${docId}/status`);
          const updatedDoc = response.data;
          setDocuments((prevDocs) => prevDocs.map((d) => (d.id === docId ? updatedDoc : d)));
          if (updatedDoc.status === "completed" || updatedDoc.status === "failed") {
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
    },
    [pollingIntervals]
  );

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
      response.data.forEach((doc) => {
        if (doc.status === "processing") {
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
      const tag = doc.tag || "Uncategorized";
      if (!acc[tag]) {
        acc[tag] = [];
      }
      acc[tag].push(doc);
      return acc;
    }, {});
  }, [documents]);

  useEffect(() => {
    fetchDocuments();
    fetchQuizHistory();
    return () => pollingIntervals.forEach((intervalId) => clearInterval(intervalId));
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
    setIsSidebarOpen(false);
  };

  // --- Sidebar Handlers ---

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    const originalDocuments = [...documents];
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
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
    setQuizHistory((prev) => prev.filter((q) => q.id !== quizId));
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
    if (doc.status !== "completed") {
      setError("Please wait for the document to finish processing.");
      return;
    }
    handleStartNewQuiz(); // Reset first
    setSelectedDocForQuiz({ id: doc.id, tag: doc.tag, filename: doc.filename });
    setStep(2); // Move to customize step
    setIsSidebarOpen(false);
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
    if (quizItem.status.toLowerCase() === "completed") {
      await handleFetchResults(quizItem.id);
      setIsSidebarOpen(false);
    } else {
      try {
        const response = await api.get(`/quiz/session/${quizItem.id}`);
        handleStartNewQuiz(); // Reset first
        setCurrentQuizSession(response.data); // This has the questions
        setStep(3); // Go to the quiz
        setIsSidebarOpen(false);
      } catch (err) {
        console.error("Failed to fetch quiz session:", err);
        setError(err.response?.data?.detail || "Could not resume this quiz.");
      }
    }
  };

  const toggleTagExpansion = (tag) => {
    setExpandedTags((prev) => ({ ...prev, [tag]: !prev[tag] }));
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
      const response = await api.post("/upload_for_quiz", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newDoc = response.data;

      setDocuments((prev) => [newDoc, ...prev]); // Add to sidebar list
      pollDocumentStatus(newDoc.id); // Start polling

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

    const settingsForAPI = {
      maxQuestions: quizSettings.max_questions,
      questionTypes: quizSettings.question_types,
      language: quizSettings.language,
      hardMode: quizSettings.hard_mode,
    };

    formData.append("settings_json", JSON.stringify(settingsForAPI));

    if (selectedDocForQuiz) {
      formData.append("document_id", selectedDocForQuiz.id);
      formData.append("tag", selectedDocForQuiz.tag);
    } else if (uploadedContent.trim()) {
      formData.append("text_content", uploadedContent.trim());
    } else {
      setError("No content source. Please upload a doc or paste text.");
      setIsGenerating(false);
      setStep(1);
      return;
    }

    try {
      const response = await api.post("/generate_quiz", formData);
      setCurrentQuizSession(response.data); // Save the full quiz session
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      fetchQuizHistory(); // Refetch history
      setStep(3);
    } catch (err) {
      console.error("Failed to generate quiz:", err);
      setError(err.response?.data?.detail || "Failed to generate quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (questionId, selectedAnswer) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswer,
    }));
  };

  // --- Quiz Navigation (Step 3) ---
  const goToNextQuestion = () => {
    if (currentQuestionIndex < currentQuizSession.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };
  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
        session_id: currentQuizSession.id,
        answers: currentQuizSession.questions.map(q => ({
          question_id: q.id,
          selected_answer: userAnswers[q.id] ?? "",
        })),
      };
    // const payload = {
    //   session_id: currentQuizSession.id,
    //   answers: Object.entries(userAnswers).map(([qid, ans]) => ({
    //     question_id: parseInt(qid, 10),
    //     selected_answer: ans,
    //   })),
    // };
    
    // currentQuizSession.questions.forEach((q) => {
    //   if (!payload.answers.find((a) => a.question_id === q.id)) {
    //     payload.answers.push({ question_id: q.id, selected_answer: "" });
    //   }
    // });

    try {
      const response = await api.post("/quiz/submit", payload);
      setQuizResults(response.data);
      setStep(4);
      fetchQuizHistory();
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setError(err.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI Helpers ---
  const removeQuestionType = (typeToRemove) => {
    setQuizSettings((prev) => ({
      ...prev,
      question_types: prev.question_types.filter((type) => type !== typeToRemove),
    }));
  };

  const addQuestionType = (type) => {
    if (type && !quizSettings.question_types.includes(type)) {
      setQuizSettings((prev) => ({
        ...prev,
        question_types: [...prev.question_types, type],
      }));
    }
  };

  const currentQuestion = currentQuizSession?.questions[currentQuestionIndex];

  const QuestionInput = ({ question, userAnswer, onAnswerSelect }) => {
    if (!question) return null;

    const questionType = question.question_type.toLowerCase();

    if (questionType === "multiple choice") {
      if (!question.options || Object.keys(question.options).length === 0) {
        return <p className="text-red-500">Error: This multiple choice question is missing options.</p>;
      }

      return (
        <div className="space-y-3">
          {Object.entries(question.options).map(([key, value]) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors",
                userAnswer === key
                  ? "border-purple-500 bg-purple-50 dark:border-pink-400 dark:bg-pink-500/10"
                  : "border-gray-200 hover:border-purple-300 dark:border-white/10 dark:hover:border-pink-400/70 dark:bg-white/5"
              )}
            >
              <input
                type="radio"
                name={question.id.toString()}
                value={key}
                checked={userAnswer === key}
                onChange={() => onAnswerSelect(question.id, key)}
                className="text-purple-600 focus:ring-purple-500 dark:text-pink-400 dark:focus:ring-pink-500"
              />
              <span className="text-gray-800 dark:text-gray-100">{value}</span>
            </label>
          ))}
        </div>
      );
    }

    if (questionType === "true or false") {
      if (!question.options || Object.keys(question.options).length === 0) {
        return <p className="text-red-500">Error: This multiple choice question is missing options.</p>;
      }
      return (
        <div className="space-y-3">
          {["True", "False"].map((option) => (
            <label
              key={option}
              className={cn(
                "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors",
                userAnswer === option
                  ? "border-purple-500 bg-purple-50 dark:border-pink-400 dark:bg-pink-500/10"
                  : "border-gray-200 hover:border-purple-300 dark:border-white/10 dark:hover:border-pink-400/70 dark:bg-white/5"
              )}
            >
              <input
                type="radio"
                name={question.id.toString()}
                value={option}
                checked={userAnswer === option}
                onChange={() => onAnswerSelect(question.id, option)}
                className="text-purple-600 focus:ring-purple-500 dark:text-pink-400 dark:focus:ring-pink-500"
              />
              <span className="text-gray-800 dark:text-gray-100">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (questionType === "fill in the blank") {
      return (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Type your answer here..."
            value={userAnswer || ""}
            onChange={(e) => onAnswerSelect(question.id, e.target.value)}
            className="w-full h-10 px-3 border border-gray-300 rounded-md dark:bg-white/5 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
      );
    }

    if (questionType === "short response" || questionType === "essay questions") {
      return (
        <div className="space-y-2">
          <textarea
            rows="4"
            placeholder="Type your response here..."
            value={userAnswer || ""}
            onChange={(e) => onAnswerSelect(question.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md resize-y dark:bg-white/5 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
      );
    }

    return <p className="text-gray-500 dark:text-gray-400">Unsupported question type: {question.question_type}</p>;
  };

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans dark:bg-gradient-to-br dark:from-black dark:via-slate-950 dark:to-black dark:text-gray-100 dark:relative overflow-hidden">
      {/* Liquid Ether / Spotlight */}
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <SidebarNavigation />
      </div>

      {/* --- Sidebar (Adapted from Chat) --- */}
      <div
        className={cn(
          "w-72 md:w-80 border-r bg-white flex flex-col shrink-0 h-screen dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl z-30",
          "fixed md:relative inset-y-0 left-0 transform transition-transform duration-200",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-4 border-b flex justify-between items-center dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Quiz Generator</h2>
          <button
            onClick={handleStartNewQuiz}
            className="bg-gray-100 text-gray-700 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20"
          >
            New Quiz
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Documents Section */}
          <div className="p-2 border-t dark:border-white/10">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1 dark:text-gray-500">
              My Documents
            </h3>
            <div className="space-y-2">
              {Object.entries(groupedDocuments).map(([tag, docsInGroup]) => (
                <div key={tag}>
                  <button
                    onClick={() => toggleTagExpansion(tag)}
                    className="w-full flex justify-between items-center px-2 py-1 text-sm font-semibold text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    <span>{tag}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform text-gray-400 dark:text-gray-300",
                        expandedTags[tag] ? "rotate-180" : ""
                      )}
                    />
                  </button>
                  {expandedTags[tag] && (
                    <div className="pl-2 mt-1 space-y-1">
                      {docsInGroup.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 text-sm group dark:hover:bg-white/10"
                        >
                          <button
                            onClick={() => handleSelectDocFromSidebar(doc)}
                            className="flex items-center gap-2 truncate flex-1 text-left"
                            title={`Use ${doc.filename} for a quiz`}
                          >
                            <DocumentStatusIcon status={doc.status} />
                            <span
                              className={cn(
                                "truncate",
                                doc.status === "completed"
                                  ? "text-gray-600 dark:text-gray-100"
                                  : "text-gray-400 dark:text-gray-500"
                              )}
                            >
                              {doc.filename}
                            </span>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => handleDeleteDocument(doc.id, e)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-500 dark:hover:text-red-400"
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
          {/* Quiz History Section */}
          <div className="p-2 border-t dark:border-white/10">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1 dark:text-gray-500">
              Quiz History
            </h3>
            {quizHistory.map((quiz) => (
              <div
                key={quiz.id}
                className="w-full flex items-center justify-between p-2 rounded-lg text-sm group hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <button
                  onClick={() => handleSelectQuizFromSidebar(quiz)}
                  className="text-left truncate flex-1 text-gray-600 dark:text-gray-100"
                  title={quiz.status === "in_progress" ? "Resume quiz" : "View results"}
                >
                  <span className="font-medium block">{quiz.source_document_filename}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(quiz.created_at).toLocaleString()}
                  </span>
                </button>
                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      "font-semibold",
                      quiz.status === "completed"
                        ? "text-gray-700 dark:text-gray-100"
                        : "text-yellow-600 dark:text-yellow-400"
                    )}
                  >
                    {quiz.score !== null ? `${quiz.score}%` : quiz.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 p-3 md:p-8 overflow-y-auto h-screen bg-gray-50 dark:bg-transparent relative z-10">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden inline-flex items-center gap-2 text-sm px-3 py-1.5 mb-3 rounded-md border bg-white text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200"
        >
          <Menu className="h-4 w-4" />
          Menu
        </button>
        {error && (
          <div className="max-w-4xl mx-auto mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-center dark:bg-red-900/20 dark:border-red-500/40 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Step 1: Upload View */}
        {step === 1 && (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center dark:bg-purple-900 dark:border dark:border-purple-600 dark:shadow-lg dark:shadow-purple-500/30">
                    <HelpCircle className="h-5 w-5 text-purple-600 dark:text-purple-100" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-purple-400 dark:to-pink-400">
                        Quiz Generator
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Upload material or select from the sidebar to create a quiz
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40">
                        1
                    </div>
                    <span className="text-purple-600 font-medium dark:text-purple-200">Upload</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200 dark:bg-purple-900" /> {/* Updated */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium dark:bg-gray-800 dark:text-gray-400">
                        2
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">Customize</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium dark:bg-gray-800 dark:text-gray-400">
                        3
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">Quiz</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium dark:bg-gray-800 dark:text-gray-400">
                        4
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">Results</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload */}
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-6 flex flex-col justify-between hover:border-purple-300 transition-colors dark:border-purple-500 dark:bg-gray-900 dark:hover:border-purple-400 dark:shadow-lg dark:shadow-purple-500/20">
                <div>
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 dark:bg-purple-900 dark:border dark:border-purple-600 dark:shadow-lg dark:shadow-purple-500/30">
                        <Upload className="h-8 w-8 text-purple-600 dark:text-purple-100" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center dark:text-white">
                        Upload Document
                    </h3>
                </div>

                <div>
                    <div className="flex items-center gap-2 border rounded-full py-2 px-3 bg-gray-50 w-full mb-4 dark:bg-gray-800 dark:border-gray-700">
                        <Tag className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                        <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            className="w-full text-m outline-none bg-transparent text-gray-700 dark:text-gray-100"
                        >
                            <option value="central">General</option>
                            <option value="CNS">CNS</option>
                            <option value="BoardGames">Board Games</option>
                        </select>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                    {!file && (
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="w-full h-12 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40"
                        >
                            Choose File
                        </button>
                    )}
                    {file && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700 border p-2 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                <FileText className="h-4 w-4 text-gray-500 shrink-0 dark:text-gray-300" />
                                <span className="truncate flex-1">{file.name}</span>
                                <button onClick={() => setFile(null)}>
                                    <X size={16} className="text-gray-500 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400" />
                                </button>
                            </div>
                            <button
                                onClick={handleQuizFileUpload}
                                disabled={isUploading || !tag}
                                className="w-full h-12 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40"
                            >
                                {isUploading ? "Uploading..." : "Upload and Continue"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Input */}
            <div className="rounded-lg border-2 border-gray-200 bg-white flex flex-col dark:border-purple-500 dark:bg-gray-900 dark:shadow-lg dark:shadow-purple-500/20">
                <div className="p-6 border-b dark:border-purple-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Or Paste Your Content</h3>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                        <label
                            htmlFor="content"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                        >
                            Study Material
                        </label>
                        <textarea
                            id="content"
                            placeholder="Paste your notes or any study material here..."
                            value={uploadedContent}
                            onChange={(e) => {
                                setUploadedContent(e.target.value);
                                setFile(null);
                                setSelectedDocForQuiz(null);
                            }}
                            rows="12"
                            className="mt-2 w-full p-2 border border-gray-300 rounded-md resize-none dark:bg-gray-800 dark:border-purple-700 dark:text-gray-100 dark:placeholder-gray-500"
                        />
                    </div>
                    <button
                        onClick={handlePasteContinue}
                        disabled={!uploadedContent.trim()}
                        className="w-full h-12 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium disabled:bg-gray-400 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40"
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
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center dark:bg-purple-900 dark:border dark:border-purple-600 dark:shadow-lg dark:shadow-purple-500/30">
                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-100" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-purple-400 dark:to-pink-400">
                        Customize Quiz
                    </h1>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium dark:shadow-lg dark:shadow-green-500/40">
                        ✓
                    </div>
                    <span className="text-green-600 font-medium dark:text-green-300">Upload</span>
                </div>
                <div className="w-12 h-0.5 bg-green-600 dark:bg-green-700" /> {/* Updated */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40">
                        2
                    </div>
                    <span className="text-purple-600 font-medium dark:text-purple-200">Customize</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium dark:bg-gray-800 dark:text-gray-400">
                        3
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">Quiz</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium dark:bg-gray-800 dark:text-gray-400">
                        4
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">Results</span>
                </div>
            </div>
        </div>

        <div className="rounded-lg border-2 border-gray-200 bg-white dark:border-purple-500 dark:bg-gray-900 dark:shadow-lg dark:shadow-purple-500/20">
            <div className="p-6 border-b border-gray-200 dark:border-purple-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Settings</h3>
                {selectedDocForQuiz ? (
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                        Generating quiz from:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-100">
                            {selectedDocForQuiz.filename}
                        </span>
                    </p>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                        Generating quiz from:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-100">Pasted Content</span>
                    </p>
                )}
            </div>
            <div className="p-6 space-y-8">
                <div>
                    <label htmlFor="maxQuestions" className="text-base font-medium text-gray-900 dark:text-white">
                        Maximum number of questions
                    </label>
                    <div className="mt-2">
                        <input
                            id="maxQuestions"
                            type="number"
                            value={quizSettings.max_questions}
                            onChange={(e) =>
                                setQuizSettings((prev) => ({
                                    ...prev,
                                    max_questions: parseInt(e.target.value, 10) || 10,
                                }))
                            }
                            className="w-24 h-10 px-3 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-purple-700 dark:text-gray-100"
                            min="1"
                            max="50"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-base font-medium text-gray-900 dark:text-white">Question Types</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {quizSettings.question_types.map((type) => (
                            <span
                                key={type}
                                // Updated to solid background/border for tag
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-800 dark:bg-purple-900 dark:border dark:border-purple-700 dark:text-purple-100 dark:shadow-lg dark:shadow-purple-500/20"
                            >
                                {type}
                                <X
                                    className="h-3 w-3 cursor-pointer hover:text-red-600 dark:hover:text-pink-200"
                                    onClick={() => removeQuestionType(type)}
                                />
                            </span>
                        ))}
                    </div>
                    <select
                        onChange={(e) => addQuestionType(e.target.value)}
                        className="w-48 mt-3 h-10 px-3 border border-gray-300 rounded-md bg-white text-sm dark:bg-gray-800 dark:border-purple-700 dark:text-gray-100"
                    >
                        <option value="">Add question type</option>
                        {allQuestionTypes
                            .filter((type) => !quizSettings.question_types.includes(type))
                            .map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-purple-700">
                    <button
                        onClick={() => setStep(1)}
                        // Updated to solid dark background/border
                        className="h-10 px-6 rounded-xl border font-medium text-sm border-gray-300 text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleGenerateQuiz}
                        disabled={isGenerating}
                        className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm disabled:bg-purple-300 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40"
                    >
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
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Quiz in Progress</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Question {currentQuestionIndex + 1} of {currentQuizSession.questions.length}
                    </p>
                </div>
                <button
                    onClick={() => setStep(2)}
                    // Updated to solid dark background/border
                    className="inline-flex items-center gap-2 h-10 px-4 border rounded-xl text-sm font-medium border-gray-300 text-gray-800 hover:bg-gray-100 dark:border-purple-700 dark:text-purple-200 dark:bg-gray-800 dark:hover:bg-purple-900"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-800">
                <div
                    className="bg-purple-600 h-2 rounded-full dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:shadow-lg dark:shadow-purple-500/40"
                    style={{
                        width: `${((currentQuestionIndex + 1) / currentQuizSession.questions.length) * 100}%`,
                    }}
                />
            </div>
        </div>

        <div className="rounded-lg border-2 border-gray-200 bg-white mb-8 dark:border-purple-500 dark:bg-gray-900 dark:shadow-lg dark:shadow-purple-500/20">
            <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40">
                        <span className="text-purple-600 font-medium dark:text-white">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-6 dark:text-white">
                            {currentQuestion.question_text}
                        </h3>

                        <QuestionInput
                            question={currentQuestion}
                            userAnswer={userAnswers[currentQuestion.id]}
                            onAnswerSelect={handleAnswerSelect}
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-between">
            <button
                onClick={goToPrevQuestion}
                disabled={currentQuestionIndex === 0}
                // Updated to solid dark background/border
                className="h-10 px-6 rounded-xl border font-medium text-sm disabled:opacity-50 border-gray-300 text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
                Previous
            </button>
            <div className="flex gap-3">
                {currentQuestionIndex < currentQuizSession.questions.length - 1 ? (
                    <button
                        onClick={goToNextQuestion}
                        className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40"
                    >
                        Next Question
                    </button>
                ) : (
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting}
                        className="h-10 px-8 bg-green-600 text-white rounded-xl font-medium text-sm disabled:bg-green-300 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-400 dark:hover:to-teal-400 dark:shadow-lg dark:shadow-emerald-500/40"
                    >
                        {isSubmitting ? "Submitting..." : "Finish Quiz"}
                    </button>
                )}
            </div>
        </div>
    </div>
)}

        {/* Step 4: Results View */}
        {step === 4 && quizResults && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center dark:bg-gradient-to-br dark:from-emerald-500/30 dark:to-teal-500/30 dark:border dark:border-emerald-400/40 dark:shadow-lg dark:shadow-emerald-500/30">
                  <Award className="h-5 w-5 text-green-600 dark:text-emerald-100" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-teal-400">
                    Quiz Results
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium dark:shadow-lg dark:shadow-green-500/40">
                    ✓
                  </div>
                  <span className="text-green-600 font-medium dark:text-green-300">Upload</span>
                </div>
                <div className="w-12 h-0.5 bg-green-600 dark:bg-green-500/60" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium dark:shadow-lg dark:shadow-green-500/40">
                    ✓
                  </div>
                  <span className="text-green-600 font-medium dark:text-green-300">Customize</span>
                </div>
                <div className="w-12 h-0.5 bg-green-600 dark:bg-green-500/60" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium dark:shadow-lg dark:shadow-green-500/40">
                    ✓
                  </div>
                  <span className="text-green-600 font-medium dark:text-green-300">Quiz</span>
                </div>
                <div className="w-12 h-0.5 bg-green-600 dark:bg-green-500/60" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40">
                    4
                  </div>
                  <span className="text-purple-600 font-medium dark:text-purple-200">Results</span>
                </div>
              </div>
            </div>

            <div className="text-center bg-white p-8 rounded-lg border-2 border-gray-200 mb-8 dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-lg dark:shadow-purple-500/20">
              <h2 className="text-lg font-medium text-gray-500 dark:text-gray-300">Your Score</h2>
              <p className="text-7xl font-bold text-purple-600 my-2 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-purple-400 dark:to-pink-400">
                {quizResults.score}%
              </p>
              <button
                onClick={handleStartNewQuiz}
                className="mt-4 h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm inline-flex items-center gap-2 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 dark:shadow-lg dark:shadow-purple-500/40"
              >
                <Repeat className="h-4 w-4" />
                Take New Quiz
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Review Your Answers</h3>
              {quizResults.results.map((res, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg border-2 border-gray-200 dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
                        res.is_correct ? "bg-green-500" : "bg-red-500"
                      )}
                    >
                      {res.is_correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-4 dark:text-white">{res.question_text}</h4>
                      <div className="space-y-2">
                        <p
                          className={cn(
                            "text-sm p-2 rounded-md",
                            res.is_correct
                              ? "bg-green-100 text-green-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                              : "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-200"
                          )}
                        >
                          <strong>Your Answer: </strong>
                          {res.your_answer || <i>No answer provided</i>}
                        </p>
                        {!res.is_correct && (
                          <p className="text-sm p-2 rounded-md bg-green-100 text-green-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <strong>Correct Answer: </strong>
                            {res.correct_answer}
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
