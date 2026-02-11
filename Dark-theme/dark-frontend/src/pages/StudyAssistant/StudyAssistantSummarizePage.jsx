"use client"

import { useState } from "react"
import { FileText, Upload, Zap, Save, Copy, Download, Lightbulb, Clock } from "lucide-react"
import { SidebarNavigation } from "../SidebarNavigation";


export default function StudyAssistantSummarizePage() {
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState(null)

  const handleSummarize = () => {
    if (!inputText.trim()) return
    setIsLoading(true)

    setTimeout(() => {
      setSummary({
        title: "Generated Summary",
        mainSummary:
          "This text discusses computer networking, focusing on the OSI and TCP/IP models. It explains how data moves through network layers and the role of protocols in modern communication.",
        keyPoints: [
          "The OSI model has a 7-layer framework.",
          "TCP/IP is the foundational protocol for the internet.",
          "Each layer has specific functions.",
          "Standard protocols ensure interoperability.",
        ],
        readingTime: "3 min read",
        wordCount: inputText.split(" ").filter(Boolean).length,
        summaryLength: "Brief",
      })
      setIsLoading(false)
    }, 1500)
  }

  return (
     <div className="min-h-screen bg-white flex">
                <SidebarNavigation />
    <div className="min-h-screen bg-black flex-1 font-figtree relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/40 to-blue-500/40 rounded-xl flex items-center justify-center backdrop-blur-md border border-cyan-400/40 shadow-lg shadow-cyan-500/20">
                <FileText className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Text Summarizer</h1>
                <p className="text-gray-300 text-sm">Transform long content into concise, actionable summaries</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/40 to-slate-800/30 backdrop-blur-xl shadow-lg shadow-cyan-500/20">
              <div className="p-6 border-b border-cyan-500/20">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Upload className="h-5 w-5 text-cyan-200" />
                  Input Content
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 transition-colors rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300 mb-3 text-sm">Upload a document to summarize</p>
                  <button className="h-10 px-4 py-2 border border-cyan-500/40 rounded-lg text-sm font-medium bg-transparent hover:bg-cyan-500/10 text-cyan-200 transition-all">
                    Choose File
                  </button>
                  <p className="text-xs text-gray-400 mt-2">PDF, DOCX, TXT up to 10MB</p>
                </div>
                {/* Text Input */}
                <div className="relative">
                  <textarea
                    placeholder="Or paste your text here to get started..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows="12"
                    className="w-full p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none transition-all"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-500">{inputText.length} characters</div>
                </div>
                <button
                  onClick={handleSummarize}
                  disabled={!inputText.trim() || isLoading}
                  className="w-full h-12 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                >
                  {isLoading ? (
                    <>
                      <Zap className="h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" /> Generate Summary
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              {!summary && !isLoading && (
                <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-slate-900/40 to-slate-800/30 backdrop-blur-md">
                  <div className="p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Your Summary Will Appear Here</h3>
                    <p className="text-gray-400 text-sm">Add content and click "Generate Summary" to begin.</p>
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/40 to-slate-800/30 backdrop-blur-md shadow-lg shadow-cyan-500/20">
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-white">Processing Your Content...</h3>
                  </div>
                </div>
              )}
              {summary && (
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/40 to-slate-800/30 backdrop-blur-xl shadow-lg shadow-cyan-500/20">
                  <div className="p-6 border-b border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                        <FileText className="h-5 w-5 text-cyan-200" />
                        Summary Results
                      </h3>
                      <div className="flex gap-2">
                        <button className="h-9 w-9 flex items-center justify-center border border-cyan-500/40 rounded-lg bg-transparent hover:bg-cyan-500/10 text-cyan-200 transition-all">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button className="h-9 w-9 flex items-center justify-center border border-cyan-500/40 rounded-lg bg-transparent hover:bg-cyan-500/10 text-cyan-200 transition-all">
                          <Save className="h-4 w-4" />
                        </button>
                        <button className="h-9 w-9 flex items-center justify-center border border-cyan-500/40 rounded-lg bg-transparent hover:bg-cyan-500/10 text-cyan-200 transition-all">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
                        <Clock className="h-3 w-3" />
                        {summary.readingTime}
                      </span>
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-700/30 text-gray-300 border border-gray-600/30">
                        {summary.wordCount} words
                      </span>
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-700/30 text-gray-300 border border-gray-600/30">
                        {summary.summaryLength} summary
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-cyan-200" />
                        Main Summary
                      </h4>
                      <div className="bg-slate-900/40 border border-cyan-500/30 rounded-lg p-4">
                        <p className="text-gray-200 leading-relaxed">{summary.mainSummary}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-cyan-200" />
                        Key Points
                      </h4>
                      <div className="h-48 overflow-y-auto space-y-3 pr-2">
                        {summary.keyPoints.map((point, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-gray-900/40 border border-gray-700/40 rounded-lg hover:bg-gray-900/60 transition-all"
                          >
                            <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-cyan-500/30">
                              <span className="text-white text-sm font-medium">{index + 1}</span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-cyan-500/20">
                      <button className="flex-1 h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50">
                        <Save className="h-4 w-4" />
                        Save to Library
                      </button>
                      <button
                        onClick={() => {
                          setSummary(null)
                          setInputText("")
                        }}
                        className="h-10 px-4 border border-cyan-500/40 rounded-lg text-sm font-medium text-cyan-200 hover:bg-cyan-500/10 transition-all"
                      >
                        New Summary
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
   </div> 
  )
}
