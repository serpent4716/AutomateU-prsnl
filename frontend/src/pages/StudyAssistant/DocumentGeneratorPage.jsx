import { SidebarNavigation } from "../SidebarNavigation"; // Removed this import to prevent crashes
import { FileText, Settings, ClipboardCheck, Loader, ChevronRight, Check, Download, XCircle, CheckCircle } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../../services/api"; // This now uses your real API service

// --- Helper function (from your quiz page) ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Constants ---

// The full list of fields
const ALL_FIELDS = [
  'Name', 'UID', 'Class and Batch', 'Experiment No', 'Date', 'Aim', 
  'Objective', 'Problem Statement', 'Theory', 'Pseudo-Code/Algo', 
  'Analysis', 'Program', 'Result', 'Conclusion', 'References'
];

// The basic required fields for Step 2
const BASIC_FIELDS = ['Name', 'UID', 'Class and Batch', 'Experiment No', 'Date', 'Aim'];

// The fields that *won't* be asked for in Step 2 (per your request)
const AI_GENERATED_FIELDS = [
  'Objective', 'Problem Statement', 'Theory', 'Pseudo-Code/Algo', 
  'Analysis', 'Program', 'Result', 'Conclusion', 'References'
];

// The single, non-optional field
const REQUIRED_FIELD = 'Aim';

// Helper map to decide which fields should be larger text areas
const FIELD_PROPS = {
  'Name': { type: 'input', placeholder: 'e.g., Jeet Patel' },
  'UID': { type: 'input', placeholder: 'e.g., 2023800080' },
  'Class and Batch': { type: 'input', placeholder: 'e.g., CSE - B1' },
  'Experiment No': { type: 'input', placeholder: 'e.g., 01' },
  'Date': { type: 'date' },
  'Aim': { type: 'textarea', placeholder: 'The main goal of this experiment is...' },
  'Objective': { type: 'textarea', placeholder: 'List the specific objectives...' },
  'Problem Statement': { type: 'textarea', placeholder: 'Define the problem to be solved...' },
  'Theory': { type: 'textarea', placeholder: 'Explain the relevant theory and concepts...' },
  'Pseudo-Code/Algo': { type: 'textarea', placeholder: 'Write the algorithm or pseudo-code...' },
  'Analysis': { type: 'textarea', placeholder: 'Analyze the time/space complexity...' },
  'Program': { type: 'textarea', placeholder: 'Paste your full program code here...' },
  'Result': { type: 'textarea', placeholder: 'Describe the results and show outputs...' },
  'Conclusion': { type: 'textarea', placeholder: 'Conclude the findings of the experiment...' },
  'References': { type: 'textarea', placeholder: 'List any references (books, websites, etc.)...' },
};

// --- Helper Components ---

// Progress bar for the 3-step process
const ProgressBar = ({ step }) => {
  const steps = [
    { number: 1, title: 'Configure' },
    { number: 2, title: 'Details' },
    { number: 3, title: 'Generate' },
  ];

  return (
    <div className="flex items-center gap-4">
      {steps.map((s, index) => (
        <React.Fragment key={s.number}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step === s.number && 'bg-purple-600 text-white',
                step > s.number && 'bg-green-600 text-white',
                step < s.number && 'bg-gray-200 text-gray-500'
              )}
            >
              {step > s.number ? <Check className="w-4 h-4" /> : s.number}
            </div>
            <span
              className={cn(
                'font-medium',
                step === s.number && 'text-purple-600',
                step > s.number && 'text-green-600',
                step < s.number && 'text-gray-500'
              )}
            >
              {s.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn('w-12 h-0.5', step > s.number ? 'bg-green-600' : 'bg-gray-200')}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- Main Page Component ---

export default function DocumentGeneratorPage() {
  const [step, setStep] = useState(1);
  const [preset, setPreset] = useState("basic"); // 'basic', 'full', 'custom'
  const [selectedFields, setSelectedFields] = useState(BASIC_FIELDS);
  const [fieldValues, setFieldValues] = useState({ Date: new Date().toISOString().split('T')[0] });
  const [problemStatementCount, setProblemStatementCount] = useState('single'); // New state
  
  // NEW State for backend task management
  const [currentTask, setCurrentTask] = useState(null); // Will store { task_id, status, error }
  const [error, setError] = useState(null);
  const pollingInterval = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Memoize the fields that will be rendered in Step 2
  // We filter out the AI-generated fields, as requested.
  const fieldsForStep2 = useMemo(() => {
    return ALL_FIELDS.filter(field => 
      selectedFields.includes(field) && 
      !AI_GENERATED_FIELDS.includes(field)
    );
  }, [selectedFields]);
  
  // --- Polling Logic (from your quiz page) ---

  const clearPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const handlePolling = useCallback((task_id) => {
    clearPolling(); // Clear any existing interval
    
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await api.get(`/documents/status/${task_id}`);
        const { status, error: taskError } = response.data;

        setCurrentTask(prev => ({ ...prev, status, error: taskError }));

        if (status === 'COMPLETED' || status === 'FAILED') {
          clearPolling();
        }
      } catch (err) {
        console.error("Polling failed:", err);
        setError("Failed to get document status. Please try again.");
        setCurrentTask(prev => ({ ...prev, status: 'FAILED', error: "Polling failed" }));
        clearPolling();
      }
    }, 3000); // Poll every 3 seconds
  }, []);

  // Clear interval on unmount
  useEffect(() => {
    return () => clearPolling();
  }, []);


  // --- Handlers ---

  const handlePresetChange = (e) => {
    const newPreset = e.target.value;
    setPreset(newPreset);
    if (newPreset === 'basic') {
      setSelectedFields(BASIC_FIELDS);
    } else if (newPreset === 'full') {
      setSelectedFields(ALL_FIELDS);
    }
  };

  const handleFieldToggle = (field) => {
    if (field === REQUIRED_FIELD) return; // 'Aim' is locked

    const newSelectedFields = selectedFields.includes(field)
      ? selectedFields.filter(f => f !== field)
      : [...selectedFields, field];
      
    setSelectedFields(newSelectedFields);
    setPreset('custom'); // Switching to custom
  };

  const handleInputChange = (field, value) => {
    setFieldValues(prev => ({ ...prev, [field]: value }));
  };

  const validateStep2 = () => {
    // Only validate the fields that are actually shown in Step 2
    const missingField = fieldsForStep2.find(field => !fieldValues[field]?.trim());
    if (missingField) {
      setError(`Please fill in all required fields. '${missingField}' is missing.`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleGenerateDocument = async () => {
    if (!validateStep2()) return;

    setStep(3); // Move to "Generating" screen
    setError(null);
    setCurrentTask({ task_id: null, status: 'STARTING', error: null });

    // 1. Construct the payload for the backend
    const basicDetailsPayload = {};
    BASIC_FIELDS.forEach(field => {
      basicDetailsPayload[field.replace(/ /g, '_')] = fieldValues[field] || "";
    });

    const payload = {
      basicDetails: basicDetailsPayload,
      selectedSections: selectedFields,
      problemStatementCount: problemStatementCount,
    };

    // 2. Make the API Call to *start* the task
    try {
      const response = await api.post("/documents/generate", payload);
      const { task_id, status } = response.data;
      
      setCurrentTask({ task_id, status, error: null });
      handlePolling(task_id); // Start polling
      
    } catch (err) {
      console.error("Failed to start document generation:", err);
      const errorMsg = err.response?.data?.detail || "Failed to start generation task.";
      setError(errorMsg);
      setCurrentTask({ task_id: null, status: 'FAILED', error: errorMsg });
    }
  };

  const handleDownload = async () => {
    if (!currentTask?.task_id) return;
    
    setIsDownloading(true);
    setError(null);
    
    try {
      // Request the file as a blob
      const response = await api.get(`/documents/download/${currentTask.task_id}`, {
        responseType: 'blob',
      });
      
      // Extract filename from Content-Disposition header
      const disposition = response.headers['content-disposition'];
      let filename = 'generated_document.docx'; // Default
      if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
          }
      }

      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download the document. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };


  const handleStartNew = () => {
    setStep(1);
    setPreset("basic");
    setSelectedFields(BASIC_FIELDS);
    setFieldValues({ Date: new Date().toISOString().split('T')[0] });
    setProblemStatementCount('single');
    setCurrentTask(null);
    setError(null);
    clearPolling();
  };
  
  // Helper to render the correct input (text or textarea)
  const renderFieldInput = (field) => {
    const props = FIELD_PROPS[field] || { type: 'input', placeholder: `Enter ${field}` };
    const isRequired = BASIC_FIELDS.includes(field);

    return (
      <div key={field} className="mb-4">
        <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
          {field} {isRequired && <span className="text-red-500">*</span>}
        </label>
        {props.type === 'textarea' ? (
          <textarea
            id={field}
            rows={field === 'Program' ? 10 : 3}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            placeholder={props.placeholder}
            value={fieldValues[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        ) : (
          <input
            type={props.type}
            id={field}
            className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            placeholder={props.placeholder}
            value={fieldValues[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            autoComplete="off"
          />
        )}
      </div>
    );
  };
  
  // --- NEW: Helper for Step 3 Content ---
  const renderGenerationStatus = () => {
    const status = currentTask?.status;

    switch (status) {
      case 'STARTING':
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto text-purple-600 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Connecting...</h3>
            <p className="mt-1 text-gray-600">Sending your request to the server.</p>
          </div>
        );
      case 'QUEUED':
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto text-purple-600 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Your job is in the queue</h3>
            <p className="mt-1 text-gray-600">It will be processed shortly.</p>
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto text-purple-600 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Generating Document...</h3>
            <p className="mt-1 text-gray-600">This may take a few moments. You can safely leave this page.</p>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="text-center p-12">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Your document is ready!</h3>
            <p className="mt-1 text-gray-600">Click the button below to download your .docx file.</p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="mt-6 h-12 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm inline-flex items-center gap-2 disabled:bg-purple-300"
            >
              {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? "Downloading..." : "Download Document"}
            </button>
          </div>
        );
      case 'FAILED':
        return (
          <div className="text-center p-12">
            <XCircle className="w-12 h-12 mx-auto text-red-600" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Generation Failed</h3>
            <p className="mt-1 text-red-600">{currentTask?.error || "An unknown error occurred."}</p>
          </div>
        );
      default:
        return (
          <div className="text-center p-12">
            <Loader className="w-12 h-12 mx-auto text-purple-600 animate-spin" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Initializing...</h3>
          </div>
        );
    }
  };


  return (
    <div className="min-h-screen flex bg-gray-100 font-sans">
      <SidebarNavigation />

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Global Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-center">
              {error}
            </div>
          )}

          {/* Step 1: Select Fields */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Document Generator</h1>
                    <p className="text-gray-600">Step 1: Select the sections for your document</p>
                  </div>
                </div>
                <ProgressBar step={1} />
              </div>

              <div className="rounded-lg border-2 border-gray-200 bg-white">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Document Presets</h3>
                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="preset" value="basic" checked={preset === 'basic'} onChange={handlePresetChange} className="text-purple-600 focus:ring-purple-500" />
                      Basic (Lab Report)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="preset" value="full" checked={preset === 'full'} onChange={handlePresetChange} className="text-purple-600 focus:ring-purple-500" />
                      Full Document
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="preset" value="custom" checked={preset === 'custom'} onChange={handlePresetChange} className="text-purple-600 focus:ring-purple-500" />
                      Custom
                    </label>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Select Sections</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ALL_FIELDS.map(field => (
                      <label
                        key={field}
                        className={cn(
                          'flex items-center gap-2 p-3 border rounded-md cursor-pointer',
                          selectedFields.includes(field) ? 'border-purple-500 bg-purple-50' : 'border-gray-200',
                          field === REQUIRED_FIELD ? 'opacity-70 cursor-not-allowed bg-gray-100' : 'hover:border-purple-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field)}
                          onChange={() => handleFieldToggle(field)}
                          disabled={field === REQUIRED_FIELD}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-medium">{field}</span>
                        {field === REQUIRED_FIELD && <span className="text-xs text-purple-700">(Required)</span>}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="p-6 border-t flex justify-end">
                  <button onClick={() => setStep(2)} className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm inline-flex items-center gap-2">
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
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Enter Details</h1>
                    <p className="text-gray-600">Step 2: Fill in the content for your selected sections</p>
                  </div>
                </div>
                <ProgressBar step={2} />
              </div>

              <div className="rounded-lg border-2 border-gray-200 bg-white">
                <div className="p-6">
                  {/* Render the basic fields */}
                  {fieldsForStep2.map(field => renderFieldInput(field))}
                  
                  {/* --- NEW SECTION (as requested) --- */}
                  <div className="mt-6 pt-6 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Problem Statements
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="problemStatementCount"
                          value="single"
                          checked={problemStatementCount === 'single'}
                          onChange={(e) => setProblemStatementCount(e.target.value)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        Single
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="problemStatementCount"
                          value="multiple"
                          checked={problemStatementCount === 'multiple'}
                          onChange={(e) => setProblemStatementCount(e.target.value)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        Multiple
                      </label>
                    </div>
                  </div>
                  {/* --- END NEW SECTION --- */}

                </div>
                <div className="p-6 border-t flex justify-between">
                  <button onClick={() => setStep(1)} className="h-10 px-6 rounded-xl border font-medium text-sm">Back</button>
                  <button 
                    onClick={handleGenerateDocument} 
                    disabled={currentTask && currentTask.status !== 'FAILED'} 
                    className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm inline-flex items-center gap-2 disabled:bg-purple-300"
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
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Generating Your Document</h1>
                    <p className="text-gray-600">Step 3: Please wait for the process to complete.</p>
                  </div>
                </div>
                <ProgressBar step={3} />
              </div>
              
              <div className="rounded-lg border-2 border-gray-200 bg-white">
                {renderGenerationStatus()}
                
                {(currentTask?.status === 'COMPLETED' || currentTask?.status === 'FAILED') && (
                  <div className="p-6 border-t flex justify-end">
                    <button onClick={handleStartNew} className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm">
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


