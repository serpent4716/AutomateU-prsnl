import React, { useState } from "react";
import { SidebarNavigation } from "../SidebarNavigation"; // Your real import
import { FileText, Upload, Zap, Save, Copy, Download, Lightbulb, Clock, AlertCircle, X } from "lucide-react";
import api from "../../services/api";

export default function StudyAssistantSummarizePage() {
    const [inputText, setInputText] = useState("");
    const [summaryLength, setSummaryLength] = useState("medium"); // New state for length
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState(null); // This will now just be a string
    const [error, setError] = useState(null); // New state for errors

    const handleSummarize = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setSummary(null);
        setError(null);

        try {
            // Call the actual API endpoint
            const response = await api.post("/study-assistant/summarize", {
                text: inputText,
                length: summaryLength,
            });
            
            // The API returns { summary: "..." }, so we set the string
            setSummary(response.data.summary);

        } catch (err) {
            console.error("Failed to summarize:", err);
            // Set error state to display to user
            const detail = err.response?.data?.detail || "An unexpected error occurred. Please try again.";
            setError(detail);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Helper to copy text to clipboard
    const copyToClipboard = () => {
        if (!summary) return;
        // This is a fallback for sandboxed environments
        try {
            const textArea = document.createElement("textarea");
            textArea.value = summary;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            alert("Summary copied to clipboard!"); // Simple feedback
        } catch (err) {
            console.error("Failed to copy text: ", err);
            alert("Failed to copy text.");
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            <SidebarNavigation />

            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Text Summarizer</h1>
                                <p className="text-gray-600">Transform long content into concise, actionable summaries</p>
                            </div>
                        </div>
                    </div>

                    {/* --- API Error Display --- */}
                    {error && (
                        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                            <button onClick={() => setError(null)} className="p-1 text-red-600 hover:text-red-800">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <div className="rounded-lg border-2 border-gray-200 bg-white shadow-sm">
                             <div className="p-6 border-b">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-green-600" />
                                    Input Content
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Text Input */}
                                <div className="relative">
                                    <textarea
                                        placeholder="Or paste your text here to get started..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        rows="12"
                                        className="w-full p-2 border border-gray-200 rounded-md resize-none focus:border-green-300 focus:ring-green-300"
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-gray-500">{inputText.length} characters</div>
                                </div>

                                {/* --- Length Selector --- */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label htmlFor="summaryLength" className="block text-sm font-medium text-gray-700 mb-1">Summary Length</label>
                                        <select
                                            id="summaryLength"
                                            value={summaryLength}
                                            onChange={(e) => setSummaryLength(e.target.value)}
                                            className="w-full h-12 px-3 py-2 border border-gray-200 rounded-xl bg-white focus:border-green-300 focus:ring-green-300"
                                        >
                                            <option value="short">Short (1-2 sentences)</option>
                                            <option value="medium">Medium (1-2 paragraphs)</option>
                                            <option value="long">Long (Detailed)</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleSummarize}
                                        disabled={!inputText.trim() || isLoading}
                                        className="w-full sm:w-auto h-12 py-3 px-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:bg-gray-400 self-end"
                                    >
                                        {isLoading ? (
                                            <><Zap className="h-4 w-4 animate-spin" /> Generating...</>
                                        ) : (
                                            <><Zap className="h-4 w-4" /> Generate</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Output Section */}
                        <div className="space-y-6">
                            {!summary && !isLoading && (
                                <div className="rounded-lg border-2 border-gray-100 bg-gray-50">
                                    <div className="p-12 text-center">
                                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Summary Will Appear Here</h3>
                                        <p className="text-gray-600">Add content, select a length, and click "Generate" to begin.</p>
                                    </div>
                                </div>
                            )}
                            {isLoading && (
                                <div className="rounded-lg border-2 border-green-200 bg-green-50">
                                    <div className="p-8 text-center">
                                        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <h3 className="text-lg font-semibold text-gray-900">Processing Your Content...</h3>
                                    </div>
                                </div>
                            )}
                            {/* --- Simplified Summary Display --- */}
                            {summary && (
                                <div className="rounded-lg border-2 border-green-200 bg-white">
                                    <div className="p-6 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-green-600" />
                                                Summary Results
                                            </h3>
                                            <div className="flex gap-2">
                                                <button onClick={copyToClipboard} title="Copy" className="h-9 w-9 flex items-center justify-center border rounded-xl bg-transparent hover:bg-accent"><Copy className="h-4 w-4" /></button>
                                                {/* These buttons are now just visual */}
                                                <button title="Save (Not Implemented)" className="h-9 w-9 flex items-center justify-center border rounded-xl bg-transparent hover:bg-accent opacity-50 cursor-not-allowed"><Save className="h-4 w-4" /></button>
                                                <button title="Download (Not Implemented)" className="h-9 w-9 flex items-center justify-center border rounded-xl bg-transparent hover:bg-accent opacity-50 cursor-not-allowed"><Download className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-green-600" />Main Summary</h4>
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                                                {/* Display the summary string directly, preserving whitespace */}
                                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
</div>
                                        </div>
                                        
                                        <div className="flex gap-3 pt-4 border-t">
                                            {/* <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium opacity-50 cursor-not-allowed"><Save className="h-4 w-4" />Save to Library</button> */}
                                            <button onClick={() => { setSummary(null); setInputText(""); setError(null); }} className="h-10 px-4 border rounded-xl text-sm font-medium">New Summary</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

