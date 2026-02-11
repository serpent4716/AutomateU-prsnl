"use client";

import React, { useState } from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import {
  FileText,
  Upload,
  Zap,
  Save,
  Copy,
  Download,
  Lightbulb,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import api from "../../services/api";

export default function StudyAssistantSummarizePage() {
  const [inputText, setInputText] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setSummary(null);
    setError(null);

    try {
      const response = await api.post("/study-assistant/summarize", {
        text: inputText,
        length: summaryLength,
      });

      setSummary(response.data.summary);
    } catch (err) {
      console.error("Failed to summarize:", err);
      const detail =
        err.response?.data?.detail ||
        "An unexpected error occurred. Please try again.";
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;

    try {
      const textArea = document.createElement("textarea");
      textArea.value = summary;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Summary copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy text.");
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gradient-to-br dark:from-black dark:via-slate-950 dark:to-black">
      {/* Liquid Ether Glow */}
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <SidebarNavigation />

      <main className="flex-1 p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {/* LIGHT MODE ICON */}
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center dark:hidden">
                <FileText className="h-5 w-5 text-green-600" />
              </div>

              {/* DARK MODE ICON */}
              <div className="hidden dark:flex w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/40 to-blue-500/40 backdrop-blur-md border border-cyan-400/40 shadow-lg shadow-cyan-500/20 items-center justify-center">
                <FileText className="h-5 w-5 text-cyan-200" />
              </div>

              <div>
                {/* Title */}
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400">
                  Text Summarizer
                </h1>

                {/* Subtitle */}
                <p className="text-gray-600 dark:text-gray-400">
                  Transform long content into concise, actionable summaries
                </p>
              </div>
            </div>
          </div>

          {/* Error Box */}
          {error && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-900/20 dark:border-red-500/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ---------------- INPUT SECTION ---------------- */}
            <div className="rounded-lg border-2 border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  {/* Light mode icon */}
                  <Upload className="h-5 w-5 text-green-600 dark:hidden" />

                  {/* Dark mode icon */}
                  <Upload className="hidden dark:block h-5 w-5 text-cyan-300" />

                  Input Content
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <textarea
                    placeholder="Or paste your text here to get started..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows="12"
                    className="w-full p-4 rounded-md resize-none border border-gray-200 focus:border-green-300 focus:ring-green-300 dark:bg-white/5 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-cyan-500/50 dark:focus:ring-cyan-500/30"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400">
                    {inputText.length} characters
                  </div>
                </div>

                {/* Length selector + button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                      Summary Length
                    </label>

                    <select
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value)}
                      className="w-full h-12 border border-gray-200 rounded-xl bg-white focus:border-green-300 focus:ring-green-300 dark:bg-white/5 dark:border-white/20 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-500/40"
                    >
                      <option value="short">Short (1–2 sentences)</option>
                      <option value="medium">Medium (1–2 paragraphs)</option>
                      <option value="long">Long (Detailed)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSummarize}
                    disabled={!inputText.trim() || isLoading}
                    className="w-full sm:w-auto h-12 px-6 flex items-center justify-center gap-2 
                    bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:bg-gray-400 
                    dark:bg-gradient-to-r dark:from-cyan-600 dark:to-blue-600 dark:hover:from-cyan-500 dark:hover:to-blue-500 
                    dark:shadow-lg dark:shadow-cyan-500/30"
                  >
                    {isLoading ? (
                      <>
                        <Zap className="h-4 w-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" /> Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ---------------- OUTPUT SECTION ---------------- */}
            <div className="space-y-6">
              {!summary && !isLoading && (
                <div className="rounded-lg border-2 border-gray-100 bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl">
                  <div className="p-12 text-center">
                    {/* ICON: Light */}
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4 dark:hidden" />

                    {/* ICON: Dark */}
                    <FileText className="hidden dark:block h-16 w-16 text-gray-600 mx-auto mb-4" />

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Your Summary Will Appear Here
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add content, select length, and click “Generate”
                    </p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="rounded-lg border-2 border-green-200 bg-green-50 dark:bg-white/5 dark:border-cyan-400/20 dark:backdrop-blur-xl">
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4 dark:border-cyan-500 dark:border-t-transparent" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Processing Your Content...
                    </h3>
                  </div>
                </div>
              )}

              {summary && (
                <div className="rounded-lg border-2 border-green-200 bg-white dark:border-cyan-500/30 dark:bg-white/5 dark:backdrop-blur-xl dark:shadow-lg dark:shadow-cyan-500/20">
                  <div className="p-6 border-b border-gray-200 dark:border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                        <FileText className="h-5 w-5 text-green-600 dark:text-cyan-200" />
                        Summary Results
                      </h3>

                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="h-9 w-9 flex items-center justify-center border border-gray-300 rounded-xl bg-transparent hover:bg-gray-100 dark:border-cyan-500/40 dark:text-cyan-200 dark:hover:bg-cyan-500/10"
                        >
                          <Copy className="h-4 w-4" />
                        </button>

                        <button className="h-9 w-9 border rounded-xl bg-transparent opacity-50 cursor-not-allowed dark:border-cyan-500/20 dark:opacity-50">
                          <Save className="h-4 w-4" />
                        </button>

                        <button className="h-9 w-9 border rounded-xl bg-transparent opacity-50 cursor-not-allowed dark:border-cyan-500/20 dark:opacity-50">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600 dark:text-cyan-200" />
                        Main Summary
                      </h4>

                      <div className="bg-green-50 border border-green-200 p-4 rounded-xl max-h-96 overflow-y-auto dark:bg-white/5 dark:border-cyan-500/30">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-cyan-500/20">
                      <button
                        onClick={() => {
                          setSummary(null);
                          setInputText("");
                          setError(null);
                        }}
                        className="h-10 px-4 border rounded-xl text-sm font-medium border-gray-300 dark:border-cyan-500/40 dark:text-cyan-200 dark:hover:bg-cyan-500/10"
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
  );
}
