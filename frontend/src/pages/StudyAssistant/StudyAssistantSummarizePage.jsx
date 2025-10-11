import React, { useState } from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import { FileText, Upload, Zap, Save, Copy, Download, Lightbulb, Clock } from "lucide-react";

export default function StudyAssistantSummarizePage() {
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState(null);

    const handleSummarize = () => {
        if (!inputText.trim()) return;
        setIsLoading(true);

        // Simulate AI processing
        setTimeout(() => {
            setSummary({
                title: "Generated Summary",
                mainSummary: "This text discusses computer networking, focusing on the OSI and TCP/IP models. It explains how data moves through network layers and the role of protocols in modern communication.",
                keyPoints: [
                    "The OSI model has a 7-layer framework.",
                    "TCP/IP is the foundational protocol for the internet.",
                    "Each layer has specific functions.",
                    "Standard protocols ensure interoperability.",
                ],
                readingTime: "3 min read",
                wordCount: inputText.split(" ").filter(Boolean).length,
                summaryLength: "Brief",
            });
            setIsLoading(false);
        }, 1500);
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
                                {/* File Upload */}
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-300 transition-colors">
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-3">Upload a document to summarize</p>
                                    <button className="h-10 px-4 py-2 border rounded-xl text-sm font-medium bg-transparent hover:bg-accent">
                                        Choose File
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">PDF, DOCX, TXT up to 10MB</p>
                                </div>
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
                                <button
                                    onClick={handleSummarize}
                                    disabled={!inputText.trim() || isLoading}
                                    className="w-full h-12 py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:bg-gray-400"
                                >
                                    {isLoading ? (
                                        <><Zap className="h-4 w-4 animate-spin" /> Generating...</>
                                    ) : (
                                        <><Zap className="h-4 w-4" /> Generate Summary</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Output Section */}
                        <div className="space-y-6">
                            {!summary && !isLoading && (
                                <div className="rounded-lg border-2 border-gray-100 bg-gray-50">
                                    <div className="p-12 text-center">
                                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Summary Will Appear Here</h3>
                                        <p className="text-gray-600">Add content and click "Generate Summary" to begin.</p>
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
                            {summary && (
                                <div className="rounded-lg border-2 border-green-200 bg-white">
                                    <div className="p-6 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-green-600" />
                                                Summary Results
                                            </h3>
                                            <div className="flex gap-2">
                                                <button className="h-9 w-9 flex items-center justify-center border rounded-xl bg-transparent hover:bg-accent"><Copy className="h-4 w-4" /></button>
                                                <button className="h-9 w-9 flex items-center justify-center border rounded-xl bg-transparent hover:bg-accent"><Save className="h-4 w-4" /></button>
                                                <button className="h-9 w-9 flex items-center justify-center border rounded-xl bg-transparent hover:bg-accent"><Download className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 mt-4">
                                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700"><Clock className="h-3 w-3" />{summary.readingTime}</span>
                                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100">{summary.wordCount} words</span>
                                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100">{summary.summaryLength} summary</span>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-green-600" />Main Summary</h4>
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                <p className="text-gray-800 leading-relaxed">{summary.mainSummary}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-green-600" />Key Points</h4>
                                            <div className="h-48 overflow-y-auto space-y-3 pr-2">
                                                {summary.keyPoints.map((point, index) => (
                                                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-green-600 text-sm font-medium">{index + 1}</span>
                                                        </div>
                                                        <p className="text-gray-800 text-sm leading-relaxed">{point}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t">
                                            <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium"><Save className="h-4 w-4" />Save to Library</button>
                                            <button onClick={() => { setSummary(null); setInputText(""); }} className="h-10 px-4 border rounded-xl text-sm font-medium">New Summary</button>
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