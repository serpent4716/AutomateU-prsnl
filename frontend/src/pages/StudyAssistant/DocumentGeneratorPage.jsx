/* -------------- FINAL MERGED FILE (LIGHT + DARK THEME) ---------------- */

import { SidebarNavigation } from "../SidebarNavigation";
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
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../services/api";

// --- simple merge helper ---
const cn = (...classes) => classes.filter(Boolean).join(" ");

// ------------------ CONSTANTS ---------------------
const ALL_FIELDS = [
  "Name", "UID", "Class and Batch", "Experiment No", "Date",
  "Aim", "Objective", "Problem Statement", "Theory",
  "Pseudo-Code/Algo", "Analysis", "Program", "Result",
  "Conclusion", "References",
];

const BASIC_FIELDS = ["Name", "UID", "Class and Batch", "Experiment No", "Date", "Aim"];

const AI_GENERATED_FIELDS = [
  "Objective", "Problem Statement", "Theory",
  "Pseudo-Code/Algo", "Analysis", "Program",
  "Result", "Conclusion", "References",
];

const REQUIRED_FIELD = "Aim";

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
  Conclusion: { type: "textarea", placeholder: "Conclude the findings..." },
  References: { type: "textarea", placeholder: "List any references..." },
};

// ----------------- PROGRESS BAR -------------------
const ProgressBar = ({ step }) => {
  const steps = [
    { number: 1, title: "Configure" },
    { number: 2, title: "Details" },
    { number: 3, title: "Generate" },
  ];

  return (
    <div className="flex items-center gap-4">
      {steps.map((s, index) => (
        <React.Fragment key={s.number}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",

                /* LIGHT THEME */
                step === s.number && "bg-purple-600 text-white",
                step > s.number && "bg-green-600 text-white",
                step < s.number && "bg-gray-200 text-gray-500",

                /* DARK THEME */
                "dark:text-white",
                step === s.number &&
                  "dark:bg-gradient-to-r dark:from-blue-500 dark:to-cyan-500 dark:shadow-lg dark:shadow-cyan-500/40",
                step > s.number &&
                  "dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500",
                step < s.number &&
                  "dark:bg-white/10 dark:text-gray-400"
              )}
            >
              {step > s.number ? <Check className="w-4 h-4" /> : s.number}
            </div>

            <span
              className={cn(
                "font-medium",

                /* LIGHT */
                step === s.number && "text-purple-600",
                step > s.number && "text-green-700",
                step < s.number && "text-gray-500",

                /* DARK */
                "dark:text-gray-300",
                step === s.number &&
                  "dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400",
                step > s.number && "dark:text-emerald-400"
              )}
            >
              {s.title}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5",
                step > s.number ? "bg-green-600" : "bg-gray-200",

                /* DARK */
                step > s.number
                  ? "dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500"
                  : "dark:bg-white/10"
              )}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ----------------- MAIN COMPONENT ------------------
export default function DocumentGeneratorPage() {
  const [step, setStep] = useState(1);
  const [preset, setPreset] = useState("basic");
  const [selectedFields, setSelectedFields] = useState(BASIC_FIELDS);
  const [fieldValues, setFieldValues] = useState({
    Date: new Date().toISOString().split("T")[0],
  });
  const [problemStatementCount, setProblemStatementCount] = useState("single");

  const [currentTask, setCurrentTask] = useState(null);
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fieldsForStep2 = useMemo(
    () =>
      ALL_FIELDS.filter(
        (f) => selectedFields.includes(f) && !AI_GENERATED_FIELDS.includes(f)
      ),
    [selectedFields]
  );

  // ------------ POLLING ------------
  const clearPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const handlePolling = useCallback((task_id) => {
    clearPolling();
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await api.get(`/documents/status/${task_id}`);
        const { status, error: taskError } = response.data;
        setCurrentTask((prev) => ({ ...prev, status, error: taskError }));
        if (status === "COMPLETED" || status === "FAILED") clearPolling();
      } catch (err) {
        setError("Failed to reach server.");
        setCurrentTask((prev) => ({ ...prev, status: "FAILED" }));
        clearPolling();
      }
    }, 3000);
  }, []);

  useEffect(() => () => clearPolling(), []);

  // ------------ HANDLERS ------------
  const handlePresetChange = (e) => {
    const p = e.target.value;
    setPreset(p);
    if (p === "basic") setSelectedFields(BASIC_FIELDS);
    else if (p === "full") setSelectedFields(ALL_FIELDS);
  };

  const handleFieldToggle = (field) => {
    if (field === REQUIRED_FIELD) return;
    if (selectedFields.includes(field))
      setSelectedFields(selectedFields.filter((f) => f !== field));
    else setSelectedFields([...selectedFields, field]);
    setPreset("custom");
  };

  const handleInputChange = (field, val) => {
    setFieldValues((p) => ({ ...p, [field]: val }));
  };

  const validateStep2 = () => {
    const missing = fieldsForStep2.find((f) => !fieldValues[f]?.trim());
    if (missing) {
      setError(`Please fill '${missing}'`);
      return false;
    }
    return true;
  };

  const handleGenerateDocument = async () => {
    if (!validateStep2()) return;

    setStep(3);
    setError(null);
    setCurrentTask({ task_id: null, status: "STARTING" });

    const basicPayload = {};
    BASIC_FIELDS.forEach((f) => {
      basicPayload[f.replace(/ /g, "_")] = fieldValues[f] || "";
    });

    const payload = {
      basicDetails: basicPayload,
      selectedSections: selectedFields,
      problemStatementCount,
    };

    try {
      const res = await api.post("/documents/generate", payload);
      handlePolling(res.data.task_id);
      setCurrentTask({ task_id: res.data.task_id, status: res.data.status });
    } catch (e) {
      setError("Failed to start generation.");
      setCurrentTask({ status: "FAILED" });
    }
  };

  const handleDownload = async () => {
    if (!currentTask?.task_id) return;
    setIsDownloading(true);

    try {
      const res = await api.get(`/documents/download/${currentTask.task_id}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated_document.docx";
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError("Download failed.");
    }
    setIsDownloading(false);
  };

  const handleStartNew = () => {
    setStep(1);
    setPreset("basic");
    setSelectedFields(BASIC_FIELDS);
    setFieldValues({ Date: new Date().toISOString().split("T")[0] });
    setProblemStatementCount("single");
    setCurrentTask(null);
    setError(null);
    clearPolling();
  };

  // ---------------- FIELD INPUT -----------------
  const renderFieldInput = (field) => {
    const props = FIELD_PROPS[field];
    const required = BASIC_FIELDS.includes(field);

    return (
      <div key={field} className="mb-4">
        <label
          className={cn(
            "block text-sm font-medium mb-1 text-gray-700",
            "dark:text-gray-200"
          )}
        >
          {field} {required && <span className="text-red-500">*</span>}
        </label>

        {props.type === "textarea" ? (
          <textarea
            rows={field === "Program" ? 10 : 3}
            className={cn(
              "w-full p-2 border rounded-md",

              /* LIGHT */
              "border-gray-300 bg-white text-black",

              /* DARK */
              "dark:bg-white/5 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-500 dark:backdrop-blur-sm dark:focus:ring-cyan-500/20 dark:focus:border-cyan-500/50 transition-all"
            )}
            placeholder={props.placeholder}
            value={fieldValues[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        ) : (
          <input
            type={props.type}
            className={cn(
              "w-full h-10 px-3 border rounded-md",

              /* LIGHT */
              "border-gray-300 bg-white text-black",

              /* DARK */
              "dark:bg-white/5 dark:border-white/10 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-cyan-500/20 dark:focus:border-cyan-500/50 transition-all"
            )}
            value={fieldValues[field] || ""}
            placeholder={props.placeholder}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        )}
      </div>
    );
  };

  // ---------------- STATUS -----------------
  const renderGenerationStatus = () => {
    const status = currentTask?.status;

    const baseTitle = "text-gray-800 dark:text-white font-semibold text-lg";
    const baseSub = "text-gray-600 dark:text-gray-400 text-sm";

    if (status === "STARTING")
      return (
        <div className="p-12 text-center">
          <Loader className="w-12 h-12 mx-auto text-purple-600 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400 animate-spin" />
          <h3 className={baseTitle}>Connecting...</h3>
          <p className={baseSub}>Sending request to server.</p>
        </div>
      );

    if (status === "QUEUED")
      return (
        <div className="p-12 text-center">
          <Loader className="w-12 h-12 mx-auto animate-spin text-purple-600 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400" />
          <h3 className={baseTitle}>In Queue</h3>
          <p className={baseSub}>Waiting for processing...</p>
        </div>
      );

    if (status === "PROCESSING")
      return (
        <div className="p-12 text-center">
          <Loader className="w-12 h-12 mx-auto animate-spin text-purple-600 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400" />
          <h3 className={baseTitle}>Generating Document...</h3>
          <p className={baseSub}>This may take a moment.</p>
        </div>
      );

    if (status === "COMPLETED")
      return (
        <div className="p-12 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-600 dark:text-emerald-400" />
          <h3 className={baseTitle}>Document Ready!</h3>
          <p className={baseSub}>Click below to download.</p>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={cn(
              "mt-6 px-8 h-12 rounded-xl text-white font-medium flex items-center gap-2 justify-center",

              /* LIGHT */
              "bg-purple-600 hover:bg-purple-700",

              /* DARK */
              "dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 dark:shadow-lg dark:shadow-cyan-500/30"
            )}
          >
            {isDownloading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloading ? "Downloading..." : "Download"}
          </button>
        </div>
      );

    if (status === "FAILED")
      return (
        <div className="p-12 text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-600 dark:text-red-500" />
          <h3 className={baseTitle}>Generation Failed</h3>
          <p className="text-red-600 dark:text-red-400">{currentTask?.error}</p>
        </div>
      );

    return (
      <div className="p-12 text-center">
        <Loader className="w-12 h-12 mx-auto animate-spin text-purple-600" />
      </div>
    );
  };

  // ---------------- RETURN -----------------
  return (
    <div
      className={cn(
        "min-h-screen flex font-sans bg-gray-100",
        /* DARK MODE BACKGROUND GLASS + SPOTLIGHT + LIQUID ETHER */
        "dark:bg-gradient-to-br dark:from-black dark:via-slate-950 dark:to-black dark:relative"
      )}
    >
      {/* LIQUID ETHER GLOW */}
      <div className="hidden dark:block absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-32 w-72 h-72 bg-cyan-500/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-20 right-32 w-80 h-80 bg-blue-600/20 blur-3xl rounded-full"></div>
      </div>

      <SidebarNavigation />

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto">

          {error && (
            <div className="mb-4 p-3 text-center rounded-md border font-medium
              bg-red-100 text-red-700 border-red-300
              dark:bg-red-900/20 dark:text-red-300 dark:border-red-500/30"
            >
              {error}
            </div>
          )}

          {/* --------------------- STEP 1 --------------------- */}
          {step === 1 && (
            <>
              <div className="mb-8 flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",

                    /* LIGHT */
                    "bg-purple-100 text-purple-600",

                    /* DARK */
                    "dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-cyan-500/20 dark:border dark:border-cyan-500/30"
                  )}
                >
                  <FileText className="w-5 h-5 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400" />
                </div>

                <div>
                  <h1
                    className={cn(
                      "text-2xl font-semibold text-gray-900",
                      "dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400"
                    )}
                  >
                    Document Generator
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Step 1: Select the sections for your document
                  </p>
                </div>
              </div>

              <ProgressBar step={1} />

              <div
                className={cn(
                  "rounded-lg border-2 bg-white mt-6",
                  "border-gray-200",
                  "dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl dark:rounded-2xl"
                )}
              >
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Document Presets
                  </h3>

                  <div className="flex gap-6 mt-3">
                    {["basic", "full", "custom"].map((p) => (
                      <label
                        key={p}
                        className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 hover:dark:text-white transition-all"
                      >
                        <input
                          type="radio"
                          name="preset"
                          value={p}
                          checked={preset === p}
                          onChange={handlePresetChange}
                          className="accent-purple-600 dark:accent-cyan-500"
                        />
                        {p === "basic"
                          ? "Basic (Lab Report)"
                          : p === "full"
                          ? "Full Document"
                          : "Custom"}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Select Sections
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ALL_FIELDS.map((field) => (
                      <label
                        key={field}
                        className={cn(
                          "flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-all",

                          /* LIGHT */
                          selectedFields.includes(field)
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300",

                          /* DARK */
                          selectedFields.includes(field)
                            ? "dark:border-cyan-500/50 dark:bg-cyan-500/10"
                            : "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20",

                          field === REQUIRED_FIELD &&
                            "opacity-70 cursor-not-allowed"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field)}
                          onChange={() => handleFieldToggle(field)}
                          disabled={field === REQUIRED_FIELD}
                          className="accent-purple-600 dark:accent-cyan-500"
                        />

                        <span className="text-gray-800 dark:text-gray-100 font-medium">
                          {field}
                        </span>

                        {field === REQUIRED_FIELD && (
                          <span className="text-xs text-purple-700 dark:text-cyan-400">
                            (Required)
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className={cn(
                      "h-10 px-8 rounded-xl text-white font-medium flex items-center gap-2",

                      /* LIGHT */
                      "bg-purple-600 hover:bg-purple-700",

                      /* DARK */
                      "dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 dark:shadow-lg dark:shadow-cyan-500/30"
                    )}
                  >
                    Next: Add Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* --------------------- STEP 2 --------------------- */}
          {step === 2 && (
            <>
              <div className="mb-8 flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",

                    /* LIGHT */
                    "bg-purple-100 text-purple-600",

                    /* DARK */
                    "dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-cyan-500/20 dark:border dark:border-cyan-500/30"
                  )}
                >
                  <Settings className="w-5 h-5 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400" />
                </div>

                <div>
                  <h1
                    className={cn(
                      "text-2xl font-semibold text-gray-900",
                      "dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-cyan-400"
                    )}
                  >
                    Enter Details
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Step 2: Fill in the content for your selected sections.
                  </p>
                </div>
              </div>

              <ProgressBar step={2} />

              <div
                className={cn(
                  "rounded-lg border-2 bg-white mt-6",
                  "border-gray-200",
                  "dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl dark:rounded-2xl"
                )}
              >
                <div className="p-6">
                  {fieldsForStep2.map(renderFieldInput)}

                  {/* Problem Statement Count */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Number of Problem Statements
                    </label>

                    <div className="flex gap-6">
                      {["single", "multiple"].map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 hover:dark:text-white transition-all"
                        >
                          <input
                            type="radio"
                            name="problemStatementCount"
                            value={opt}
                            checked={problemStatementCount === opt}
                            onChange={(e) => setProblemStatementCount(e.target.value)}
                            className="accent-purple-600 dark:accent-cyan-500"
                          />
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className={cn(
                      "h-10 px-6 rounded-xl border font-medium",

                      /* LIGHT */
                      "border-gray-300 bg-white hover:bg-gray-100 text-gray-800",

                      /* DARK */
                      "dark:border-white/20 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
                    )}
                  >
                    Back
                  </button>

                  <button
                    onClick={handleGenerateDocument}
                    disabled={currentTask && currentTask.status !== "FAILED"}
                    className={cn(
                      "h-10 px-8 rounded-xl text-white font-medium flex items-center gap-2",

                      /* LIGHT */
                      "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300",

                      /* DARK */
                      "dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 dark:shadow-lg dark:shadow-cyan-500/30 dark:disabled:opacity-40"
                    )}
                  >
                    <Check className="w-4 h-4" />
                    Generate Document
                  </button>
                </div>
              </div>
            </>
          )}

          {/* --------------------- STEP 3 --------------------- */}
          {step === 3 && (
            <>
              <div className="mb-8 flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",

                    /* LIGHT */
                    "bg-green-100 text-green-700",

                    /* DARK */
                    "dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/20 dark:border dark:border-emerald-500/30"
                  )}
                >
                  <ClipboardCheck className="w-5 h-5 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-emerald-400 dark:to-teal-400" />
                </div>

                <div>
                  <h1
                    className={cn(
                      "text-2xl font-semibold text-gray-900",
                      "dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-teal-400"
                    )}
                  >
                    Generating Your Document
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Step 3: Please wait until the generation is complete.
                  </p>
                </div>
              </div>

              <ProgressBar step={3} />

              <div
                className={cn(
                  "rounded-lg border-2 bg-white mt-6",
                  "border-gray-200",
                  "dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl dark:rounded-2xl"
                )}
              >
                {renderGenerationStatus()}

                {(currentTask?.status === "COMPLETED" ||
                  currentTask?.status === "FAILED") && (
                  <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
                    <button
                      onClick={handleStartNew}
                      className={cn(
                        "h-10 px-8 rounded-xl text-white font-medium",

                        /* LIGHT */
                        "bg-purple-600 hover:bg-purple-700",

                        /* DARK */
                        "dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 dark:shadow-lg dark:shadow-cyan-500/30"
                      )}
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
  );
}
