"use client"

import { SidebarNavigation } from "../SidebarNavigation"
import {
  FileText,
  Settings,
  ClipboardCheck,
  Loader,
  ChevronRight,
  Check,
  Download,
  XCircle,
  CheckCircle,
} from "lucide-react"
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import api from "../../services/api"

// --- Helper function (from your quiz page) ---
const cn = (...classes) => classes.filter(Boolean).join(" ")

// --- Constants ---

// The full list of fields
const ALL_FIELDS = [
  "Name",
  "UID",
  "Class and Batch",
  "Experiment No",
  "Date",
  "Aim",
  "Objective",
  "Problem Statement",
  "Theory",
  "Pseudo-Code/Algo",
  "Analysis",
  "Program",
  "Result",
  "Conclusion",
  "References",
]

// The basic required fields for Step 2
const BASIC_FIELDS = ["Name", "UID", "Class and Batch", "Experiment No", "Date", "Aim"]

// The fields that *won't* be asked for in Step 2 (per your request)
const AI_GENERATED_FIELDS = [
  "Objective",
  "Problem Statement",
  "Theory",
  "Pseudo-Code/Algo",
  "Analysis",
  "Program",
  "Result",
  "Conclusion",
  "References",
]

// The single, non-optional field
const REQUIRED_FIELD = "Aim"

// Helper map to decide which fields should be larger text areas
const FIELD_PROPS = {
  Name: { type: "input", placeholder: "e.g., Jeet Patel" },
  UID: { type: "input", placeholder: "e.g., 2023800080" },
  "Class and Batch": { type: "input", placeholder: "e.g., CSE - B1" },
  "Experiment No": { type: "input", placeholder: "e.g., 01" },
  Date: { type: "date" },
  Aim: { type: "textarea", placeholder: "The main goal of this experiment is..." },
  Objective: { type: "textarea", placeholder: "List the specific objectives..." },
  "Problem Statement": { type: "textarea", placeholder: "Define the problem to be solved..." },
  Theory: { type: "textarea", placeholder: "Explain the relevant theory and concepts..." },
  "Pseudo-Code/Algo": { type: "textarea", placeholder: "Write the algorithm or pseudo-code..." },
  Analysis: { type: "textarea", placeholder: "Analyze the time/space complexity..." },
  Program: { type: "textarea", placeholder: "Paste your full program code here..." },
  Result: { type: "textarea", placeholder: "Describe the results and show outputs..." },
  Conclusion: { type: "textarea", placeholder: "Conclude the findings of the experiment..." },
  References: { type: "textarea", placeholder: "List any references (books, websites, etc.)..." },
}

const ProgressBar = ({ step }) => {
  const steps = [
    { number: 1, title: "Configure" },
    { number: 2, title: "Details" },
    { number: 3, title: "Generate" },
  ]

  return (
    <div className="flex items-center gap-4">
      {steps.map((s, index) => (
        <React.Fragment key={s.number}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                step === s.number &&
                  "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50",
                step > s.number && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
                step < s.number && "bg-white/10 text-gray-400",
              )}
            >
              {step > s.number ? <Check className="w-4 h-4" /> : s.number}
            </div>
            <span
              className={cn(
                "font-medium text-sm",
                step === s.number && "bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400",
                step > s.number && "text-emerald-400",
                step < s.number && "text-gray-400",
              )}
            >
              {s.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 rounded-full",
                step > s.number ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-white/10",
              )}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// --- Main Page Component ---

export default function DocumentGeneratorPage() {
  const [step, setStep] = useState(1)
  const [preset, setPreset] = useState("basic")
  const [selectedFields, setSelectedFields] = useState(BASIC_FIELDS)
  const [fieldValues, setFieldValues] = useState({ Date: new Date().toISOString().split("T")[0] })
  const [problemStatementCount, setProblemStatementCount] = useState("single")

  // NEW State for backend task management
  const [currentTask, setCurrentTask] = useState(null)
  const [error, setError] = useState(null)
  const pollingInterval = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Memoize the fields that will be rendered in Step 2
  const fieldsForStep2 = useMemo(() => {
    return ALL_FIELDS.filter((field) => selectedFields.includes(field) && !AI_GENERATED_FIELDS.includes(field))
  }, [selectedFields])

  // --- Polling Logic ---

  const clearPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
  }

  const handlePolling = useCallback((task_id) => {
    clearPolling()

    pollingInterval.current = setInterval(async () => {
      try {
        const response = await api.get(`/documents/status/${task_id}`)
        const { status, error: taskError } = response.data

        setCurrentTask((prev) => ({ ...prev, status, error: taskError }))

        if (status === "COMPLETED" || status === "FAILED") {
          clearPolling()
        }
      } catch (err) {
        console.error("Polling failed:", err)
        setError("Failed to get document status. Please try again.")
        setCurrentTask((prev) => ({ ...prev, status: "FAILED", error: "Polling failed" }))
        clearPolling()
      }
    }, 3000)
  }, [])

  useEffect(() => {
    return () => clearPolling()
  }, [])

  // --- Handlers ---

  const handlePresetChange = (e) => {
    const newPreset = e.target.value
    setPreset(newPreset)
    if (newPreset === "basic") {
      setSelectedFields(BASIC_FIELDS)
    } else if (newPreset === "full") {
      setSelectedFields(ALL_FIELDS)
    }
  }

  const handleFieldToggle = (field) => {
    if (field === REQUIRED_FIELD) return

    const newSelectedFields = selectedFields.includes(field)
      ? selectedFields.filter((f) => f !== field)
      : [...selectedFields, field]

    setSelectedFields(newSelectedFields)
    setPreset("custom")
  }

  const handleInputChange = (field, value) => {
    setFieldValues((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep2 = () => {
    const missingField = fieldsForStep2.find((field) => !fieldValues[field]?.trim())
    if (missingField) {
      setError(`Please fill in all required fields. '${missingField}' is missing.`)
      return false
    }
    setError(null)
    return true
  }

  const handleGenerateDocument = async () => {
    if (!validateStep2()) return

    setStep(3)
    setError(null)
    setCurrentTask({ task_id: null, status: "STARTING", error: null })

    const basicDetailsPayload = {}
    BASIC_FIELDS.forEach((field) => {
      basicDetailsPayload[field.replace(/ /g, "_")] = fieldValues[field] || ""
    })

    const payload = {
      basicDetails: basicDetailsPayload,
      selectedSections: selectedFields,
      problemStatementCount: problemStatementCount,
    }

    try {
      const response = await api.post("/documents/generate", payload)
      const { task_id, status } = response.data

      setCurrentTask({ task_id, status, error: null })
      handlePolling(task_id)
    } catch (err) {
      console.error("Failed to start document generation:", err)
      const errorMsg = err.response?.data?.detail || "Failed to start generation task."
      setError(errorMsg)
      setCurrentTask({ task_id: null, status: "FAILED", error: errorMsg })
    }
  }

  const handleDownload = async () => {
    if (!currentTask?.task_id) return

    setIsDownloading(true)
    setError(null)

    try {
      const response = await api.get(`/documents/download/${currentTask.task_id}`, {
        responseType: "blob",
      })

      const disposition = response.headers["content-disposition"]
      let filename = "generated_document.docx"
      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        const matches = filenameRegex.exec(disposition)
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "")
        }
      }

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      )
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed:", err)
      setError("Failed to download the document. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleStartNew = () => {
    setStep(1)
    setPreset("basic")
    setSelectedFields(BASIC_FIELDS)
    setFieldValues({ Date: new Date().toISOString().split("T")[0] })
    setProblemStatementCount("single")
    setCurrentTask(null)
    setError(null)
    clearPolling()
  }

  const renderFieldInput = (field) => {
    const props = FIELD_PROPS[field] || { type: "input", placeholder: `Enter ${field}` }
    const isRequired = BASIC_FIELDS.includes(field)

    return (
      <div key={field} className="mb-4">
        <label htmlFor={field} className="block text-sm font-medium text-gray-200 mb-2">
          {field} {isRequired && <span className="text-cyan-400">*</span>}
        </label>
        {props.type === "textarea" ? (
          <textarea
            id={field}
            rows={field === "Program" ? 10 : 3}
            className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            placeholder={props.placeholder}
            value={fieldValues[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        ) : (
          <input
            type={props.type}
            id={field}
            className="w-full h-10 px-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            placeholder={props.placeholder}
            value={fieldValues[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            autoComplete="off"
          />
        )}
      </div>
    )
  }

  const renderGenerationStatus = () => {
    const status = currentTask?.status

    switch (status) {
      case "STARTING":
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-white">Connecting...</h3>
            <p className="mt-1 text-gray-400">Sending your request to the server.</p>
          </div>
        )
      case "QUEUED":
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-white">Your job is in the queue</h3>
            <p className="mt-1 text-gray-400">It will be processed shortly.</p>
          </div>
        )
      case "PROCESSING":
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-white">Generating Document...</h3>
            <p className="mt-1 text-gray-400">This may take a few moments. You can safely leave this page.</p>
          </div>
        )
      case "COMPLETED":
        return (
          <div className="text-center p-12">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold text-white">Your document is ready!</h3>
            <p className="mt-1 text-gray-400">Click the button below to download your .docx file.</p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="mt-6 h-12 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium text-sm inline-flex items-center gap-2 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:from-blue-500 disabled:to-cyan-500 shadow-lg shadow-blue-500/30"
            >
              {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? "Downloading..." : "Download Document"}
            </button>
          </div>
        )
      case "FAILED":
        return (
          <div className="text-center p-12">
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <h3 className="mt-4 text-lg font-semibold text-white">Generation Failed</h3>
            <p className="mt-1 text-red-400">{currentTask?.error || "An unknown error occurred."}</p>
          </div>
        )
      default:
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-white">Initializing...</h3>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex bg-black font-sans">
      <SidebarNavigation />

      <main className="flex-1 p-8 overflow-y-auto h-screen bg-gradient-to-br from-black via-slate-950 to-black">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-950/30 backdrop-blur-sm border border-red-500/30 text-red-300 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          {/* Step 1: Select Fields */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                    <FileText className="h-5 w-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                      Document Generator
                    </h1>
                    <p className="text-gray-400 text-sm">Step 1: Select the sections for your document</p>
                  </div>
                </div>
                <ProgressBar step={1} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">Document Presets</h3>
                  <div className="flex gap-6 mt-3">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                      <input
                        type="radio"
                        name="preset"
                        value="basic"
                        checked={preset === "basic"}
                        onChange={handlePresetChange}
                        className="accent-cyan-500"
                      />
                      Basic (Lab Report)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                      <input
                        type="radio"
                        name="preset"
                        value="full"
                        checked={preset === "full"}
                        onChange={handlePresetChange}
                        className="accent-cyan-500"
                      />
                      Full Document
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                      <input
                        type="radio"
                        name="preset"
                        value="custom"
                        checked={preset === "custom"}
                        onChange={handlePresetChange}
                        className="accent-cyan-500"
                      />
                      Custom
                    </label>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Sections</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ALL_FIELDS.map((field) => (
                      <label
                        key={field}
                        className={cn(
                          "flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all",
                          selectedFields.includes(field)
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                          field === REQUIRED_FIELD ? "opacity-60 cursor-not-allowed" : "",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field)}
                          onChange={() => handleFieldToggle(field)}
                          disabled={field === REQUIRED_FIELD}
                          className="accent-cyan-500"
                        />
                        <span className="font-medium text-gray-100 text-sm">{field}</span>
                        {field === REQUIRED_FIELD && <span className="text-xs text-cyan-400">(Required)</span>}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="h-10 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium text-sm inline-flex items-center gap-2 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                  >
                    Next: Add Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Enter Details */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                    <Settings className="h-5 w-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                      Enter Details
                    </h1>
                    <p className="text-gray-400 text-sm">Step 2: Fill in the content for your selected sections</p>
                  </div>
                </div>
                <ProgressBar step={2} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                <div className="p-6">
                  {fieldsForStep2.map((field) => renderFieldInput(field))}

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <label className="block text-sm font-medium text-gray-200 mb-3">Number of Problem Statements</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                        <input
                          type="radio"
                          name="problemStatementCount"
                          value="single"
                          checked={problemStatementCount === "single"}
                          onChange={(e) => setProblemStatementCount(e.target.value)}
                          className="accent-cyan-500"
                        />
                        Single
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                        <input
                          type="radio"
                          name="problemStatementCount"
                          value="multiple"
                          checked={problemStatementCount === "multiple"}
                          onChange={(e) => setProblemStatementCount(e.target.value)}
                          className="accent-cyan-500"
                        />
                        Multiple
                      </label>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="h-10 px-6 rounded-lg border border-white/20 bg-white/5 text-gray-200 font-medium text-sm hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateDocument}
                    disabled={currentTask && currentTask.status !== "FAILED"}
                    className="h-10 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium text-sm inline-flex items-center gap-2 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:from-blue-500 disabled:to-cyan-500 shadow-lg shadow-blue-500/30"
                  >
                    <Check className="w-4 h-4" />
                    Generate Document
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Generated Document */}
          {step === 3 && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <ClipboardCheck className="h-5 w-5 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                      Generating Your Document
                    </h1>
                    <p className="text-gray-400 text-sm">Step 3: Please wait for the process to complete.</p>
                  </div>
                </div>
                <ProgressBar step={3} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                {renderGenerationStatus()}

                {(currentTask?.status === "COMPLETED" || currentTask?.status === "FAILED") && (
                  <div className="p-6 border-t border-white/10 flex justify-end">
                    <button
                      onClick={handleStartNew}
                      className="h-10 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                    >
                      Start New Document
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
