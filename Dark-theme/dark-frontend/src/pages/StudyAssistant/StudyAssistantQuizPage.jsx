"use client"
import { Upload, HelpCircle, Settings, X } from "lucide-react"
import { useState } from "react"
import { SidebarNavigation } from "../SidebarNavigation";

export default function StudyAssistantQuizPage() {
  const [step, setStep] = useState(1)
  const [uploadedContent, setUploadedContent] = useState("")
  const [quizSettings, setQuizSettings] = useState({
    maxQuestions: 20,
    questionTypes: ["Multiple choice", "True or false", "Short response", "Fill in the blank"],
    language: "English",
    difficulty: "Medium",
    hardMode: false,
  })

  const allQuestionTypes = [
    "Multiple choice",
    "True or false",
    "Short response",
    "Fill in the blank",
    "Essay questions",
  ]

  const removeQuestionType = (typeToRemove) => {
    setQuizSettings((prev) => ({
      ...prev,
      questionTypes: prev.questionTypes.filter((type) => type !== typeToRemove),
    }))
  }

  const addQuestionType = (type) => {
    if (type && !quizSettings.questionTypes.includes(type)) {
      setQuizSettings((prev) => ({
        ...prev,
        questionTypes: [...prev.questionTypes, type],
      }))
    }
  }

  // Step 1: Upload View
  if (step === 1) {
    return (
     <div className="min-h-screen bg-white flex">
                    <SidebarNavigation />
        
      <div className="min-h-screen bg-black flex-1 font-figtree relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <main className="flex-1 p-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-xl flex items-center justify-center backdrop-blur-md border border-purple-400/40 shadow-lg shadow-purple-500/20">
                  <HelpCircle className="h-5 w-5 text-purple-200" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-figtree">Quiz Generator</h1>
                  <p className="text-gray-300 font-figtree text-sm">
                    Upload your study material to create a custom quiz
                  </p>
                </div>
              </div>
              {/* Progress Steps */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg shadow-purple-500/50">
                    1
                  </div>
                  <span className="text-purple-200 font-medium">Upload</span>
                </div>
                <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700/50 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="text-gray-400">Customize</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-700/30"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700/50 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="text-gray-400">Quiz</span>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* File Upload */}
              <div className="rounded-2xl border border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 bg-gradient-to-br from-purple-950/40 to-pink-950/30 backdrop-blur-xl hover:shadow-lg hover:shadow-purple-500/20">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-400/40 shadow-lg shadow-purple-500/20">
                    <Upload className="h-8 w-8 text-purple-200" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Upload Document</h3>
                  <p className="text-gray-300 mb-6 text-sm">Upload PDFs, Word docs, or text files</p>
                  <button className="h-12 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
                    Choose File
                  </button>
                  <p className="text-xs text-gray-400 mt-4">Supports PDF, DOCX, TXT up to 10MB</p>
                </div>
              </div>
              {/* Text Input */}
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-pink-950/30 backdrop-blur-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                <div className="p-6 border-b border-purple-500/20">
                  <h3 className="text-lg font-semibold text-white">Or Paste Your Content</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-200">
                      Study Material
                    </label>
                    <textarea
                      id="content"
                      placeholder="Paste your notes or any study material here..."
                      value={uploadedContent}
                      onChange={(e) => setUploadedContent(e.target.value)}
                      rows="12"
                      className="mt-2 w-full p-4 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:border-purple-400/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none transition-all"
                    />
                  </div>
                  <button
                    onClick={() => uploadedContent.trim() && setStep(2)}
                    disabled={!uploadedContent.trim()}
                    className="w-full h-12 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                  >
                    Continue to Customize
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    )
  }

  // Step 2: Customize View
  if (step === 2) {
    return (
   <div className="min-h-screen bg-white flex">
                    <SidebarNavigation />
      <div className="min-h-screen bg-black flex-1 font-figtree relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <main className="flex-1 p-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-xl flex items-center justify-center backdrop-blur-md border border-purple-400/40 shadow-lg shadow-purple-500/20">
                  <Settings className="h-5 w-5 text-purple-200" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-figtree">Customize Quiz</h1>
                  <p className="text-gray-300 font-figtree text-sm">Configure your quiz settings</p>
                </div>
              </div>
              {/* Progress Steps */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg shadow-green-500/30">
                    ✓
                  </div>
                  <span className="text-green-400 font-medium">Upload</span>
                </div>
                <div className="w-12 h-0.5 bg-green-600/50"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg shadow-purple-500/50">
                    2
                  </div>
                  <span className="text-purple-200 font-medium">Customize</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-700/30"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700/50 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="text-gray-400">Quiz</span>
                </div>
              </div>
            </div>
            {/* Customization Form */}
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-pink-950/30 backdrop-blur-xl shadow-lg shadow-purple-500/20">
              <div className="p-6 border-b border-purple-500/20">
                <h3 className="text-lg font-semibold text-white">Quiz Settings</h3>
              </div>
              <div className="p-6 space-y-8">
                {/* Max Questions */}
                <div>
                  <label htmlFor="maxQuestions" className="text-base font-medium text-white">
                    Maximum number of questions
                  </label>
                  <div className="mt-2">
                    <input
                      id="maxQuestions"
                      type="number"
                      value={quizSettings.maxQuestions}
                      onChange={(e) =>
                        setQuizSettings((prev) => ({
                          ...prev,
                          maxQuestions: Number.parseInt(e.target.value, 10) || 20,
                        }))
                      }
                      className="w-24 h-10 px-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white focus:border-purple-400/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                      min="1"
                      max="50"
                    />
                    <p className="text-sm text-gray-400 mt-1">{quizSettings.maxQuestions} questions or fewer.</p>
                  </div>
                </div>
                {/* Question Types */}
                <div>
                  <label className="text-base font-medium text-white">Question Types</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quizSettings.questionTypes.map((type) => (
                      <span
                        key={type}
                        className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/40 rounded-full text-sm font-medium text-purple-100 shadow-lg shadow-purple-500/20"
                      >
                        {type}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-pink-200 transition-colors"
                          onClick={() => removeQuestionType(type)}
                        />
                      </span>
                    ))}
                  </div>
                  <select
                    onChange={(e) => addQuestionType(e.target.value)}
                    className="w-48 mt-3 h-10 px-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white text-sm focus:border-purple-400/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                  >
                    <option value="">Add question type</option>
                    {allQuestionTypes
                      .filter((type) => !quizSettings.questionTypes.includes(type))
                      .map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                  </select>
                </div>
                {/* Other Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-base font-medium text-white">Language</label>
                    <select
                      value={quizSettings.language}
                      onChange={(e) => setQuizSettings((prev) => ({ ...prev, language: e.target.value }))}
                      className="w-full mt-2 h-10 px-3 bg-slate-900/50 border border-purple-500/30 rounded-lg text-white focus:border-purple-400/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-base font-medium text-white">Difficulty</label>
                    <div className="mt-2 flex items-center justify-between p-3 bg-slate-900/50 border border-purple-500/30 rounded-lg">
                      <span className="text-sm text-gray-300">Hard mode</span>
                      <input
                        type="checkbox"
                        checked={quizSettings.hardMode}
                        onChange={(e) => setQuizSettings((prev) => ({ ...prev, hardMode: e.target.checked }))}
                        className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-purple-500/20">
                  <button
                    onClick={() => setStep(1)}
                    className="h-10 px-6 rounded-lg border border-purple-500/40 text-purple-200 font-medium text-sm hover:bg-purple-500/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="h-10 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                  >
                    Generate Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    )
  }

  // Step 3: Quiz View
  return (
    <div className="min-h-screen bg-white flex">
                    <SidebarNavigation />
    <div className="min-h-screen bg-black flex-1 font-figtree relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 p-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Quiz in Progress</h1>
                <p className="text-gray-300 text-sm">Question 1 of {quizSettings.maxQuestions}</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 h-10 px-4 border border-purple-500/40 rounded-lg text-sm font-medium text-purple-200 hover:bg-purple-500/10 transition-all"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
            <div className="w-full bg-gray-800/30 rounded-full h-2 backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full shadow-lg shadow-purple-500/50"
                style={{ width: "5%" }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-pink-950/30 backdrop-blur-xl mb-8 shadow-lg shadow-purple-500/20">
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/50">
                  <span className="text-white font-medium text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-6">
                    How is the Link Layer typically implemented in devices?
                  </h3>
                  {/* Answer Options */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border border-purple-500/30 rounded-lg hover:border-purple-400/60 hover:bg-purple-500/10 cursor-pointer transition-all">
                      <input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500" />
                      <span className="text-gray-200">A) Through software applications only</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-purple-500/30 rounded-lg hover:border-purple-400/60 hover:bg-purple-500/10 cursor-pointer transition-all">
                      <input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500" />
                      <span className="text-gray-200">B) In both hardware and firmware/software</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-purple-500/30 rounded-lg hover:border-purple-400/60 hover:bg-purple-500/10 cursor-pointer transition-all">
                      <input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500" />
                      <span className="text-gray-200">C) Only using Network Interface Cards (NICs)</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-purple-500/30 rounded-lg hover:border-purple-400/60 hover:bg-purple-500/10 cursor-pointer transition-all">
                      <input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500" />
                      <span className="text-gray-200">D) Exclusively in the operating system</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button className="h-10 px-6 rounded-lg border border-purple-500/40 text-purple-200 font-medium text-sm hover:bg-purple-500/10 transition-all">
              Previous
            </button>
            <div className="flex gap-3">
              <button className="h-10 px-6 rounded-lg border border-purple-500/40 text-purple-200 font-medium text-sm hover:bg-purple-500/10 transition-all">
                Skip
              </button>
              <button className="h-10 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
                Next Question
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  )
}
