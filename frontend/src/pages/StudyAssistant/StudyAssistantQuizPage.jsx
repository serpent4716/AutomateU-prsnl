import React from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import { Upload, HelpCircle, Settings, Plus, X } from "lucide-react";
import { useState } from "react";
export default function StudyAssistantQuizPage() {
    const [step, setStep] = useState(1); // 1: Upload, 2: Customize, 3: Quiz
    const [uploadedContent, setUploadedContent] = useState("");
    const [quizSettings, setQuizSettings] = useState({
        maxQuestions: 20,
        questionTypes: ["Multiple choice", "True or false", "Short response", "Fill in the blank"],
        language: "English",
        difficulty: "Medium",
        hardMode: false,
    });

    const allQuestionTypes = ["Multiple choice", "True or false", "Short response", "Fill in the blank", "Essay questions"];

    const removeQuestionType = (typeToRemove) => {
        setQuizSettings(prev => ({
            ...prev,
            questionTypes: prev.questionTypes.filter(type => type !== typeToRemove),
        }));
    };

    const addQuestionType = (type) => {
        if (type && !quizSettings.questionTypes.includes(type)) {
            setQuizSettings(prev => ({
                ...prev,
                questionTypes: [...prev.questionTypes, type],
            }));
        }
    };

    // Step 1: Upload View
    if (step === 1) {
        return (
            <div className="min-h-screen bg-white flex">
                <SidebarNavigation />
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <HelpCircle className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Quiz Generator</h1>
                                    <p className="text-gray-600">Upload your study material to create a custom quiz</p>
                                </div>
                            </div>
                             {/* Progress Steps */}
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                                    <span className="text-purple-600 font-medium">Upload</span>
                                </div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                                    <span className="text-gray-500">Customize</span>
                                </div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                                    <span className="text-gray-500">Quiz</span>
                                </div>
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* File Upload */}
                            <div className="rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors bg-white">
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Upload className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Document</h3>
                                    <p className="text-gray-600 mb-6">Upload PDFs, Word docs, or text files</p>
                                    <button className="h-12 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium">Choose File</button>
                                    <p className="text-xs text-gray-500 mt-4">Supports PDF, DOCX, TXT up to 10MB</p>
                                </div>
                            </div>
                            {/* Text Input */}
                            <div className="rounded-lg border-2 border-gray-200 bg-white">
                                <div className="p-6 border-b"><h3 className="text-lg font-semibold">Or Paste Your Content</h3></div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Study Material</label>
                                        <textarea
                                            id="content"
                                            placeholder="Paste your notes or any study material here..."
                                            value={uploadedContent}
                                            onChange={(e) => setUploadedContent(e.target.value)}
                                            rows="12"
                                            className="mt-2 w-full p-2 border border-gray-300 rounded-md resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => uploadedContent.trim() && setStep(2)}
                                        disabled={!uploadedContent.trim()}
                                        className="w-full h-12 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium disabled:bg-gray-400"
                                    >
                                        Continue to Customize
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
    
    // Step 2: Customize View
    if (step === 2) {
        return (
             <div className="min-h-screen bg-white flex">
                <SidebarNavigation />
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Settings className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Customize Quiz</h1>
                                    <p className="text-gray-600">Configure your quiz settings</p>
                                </div>
                            </div>
                            {/* Progress Steps */}
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">✓</div>
                                    <span className="text-green-600 font-medium">Upload</span>
                                </div>
                                <div className="w-12 h-0.5 bg-green-600"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                                    <span className="text-purple-600 font-medium">Customize</span>
                                </div>
                                <div className="w-12 h-0.5 bg-gray-200"></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                                    <span className="text-gray-500">Quiz</span>
                                </div>
                            </div>
                        </div>
                        {/* Customization Form */}
                        <div className="rounded-lg border-2 border-gray-200 bg-white">
                            <div className="p-6 border-b"><h3 className="text-lg font-semibold">Quiz Settings</h3></div>
                            <div className="p-6 space-y-8">
                                {/* Max Questions */}
                                <div>
                                    <label htmlFor="maxQuestions" className="text-base font-medium">Maximum number of questions</label>
                                    <div className="mt-2">
                                        <input
                                            id="maxQuestions"
                                            type="number"
                                            value={quizSettings.maxQuestions}
                                            onChange={(e) => setQuizSettings(prev => ({ ...prev, maxQuestions: parseInt(e.target.value, 10) || 20 }))}
                                            className="w-24 h-10 px-3 border border-gray-300 rounded-md"
                                            min="1"
                                            max="50"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">{quizSettings.maxQuestions} questions or fewer.</p>
                                    </div>
                                </div>
                                {/* Question Types */}
                                <div>
                                    <label className="text-base font-medium">Question Types</label>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {quizSettings.questionTypes.map(type => (
                                            <span key={type} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                                                {type}
                                                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => removeQuestionType(type)} />
                                            </span>
                                        ))}
                                    </div>
                                    <select onChange={(e) => addQuestionType(e.target.value)} className="w-48 mt-3 h-10 px-3 border border-gray-300 rounded-md bg-white text-sm">
                                        <option value="">Add question type</option>
                                        {allQuestionTypes
                                            .filter(type => !quizSettings.questionTypes.includes(type))
                                            .map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                {/* Other Settings */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-base font-medium">Language</label>
                                        <select value={quizSettings.language} onChange={(e) => setQuizSettings(prev => ({...prev, language: e.target.value}))} className="w-full mt-2 h-10 px-3 border border-gray-300 rounded-md bg-white">
                                            <option>English</option><option>Spanish</option><option>French</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-base font-medium">Difficulty</label>
                                        <div className="mt-2 flex items-center justify-between p-2 border rounded-md">
                                            <span className="text-sm text-gray-600">Hard mode</span>
                                            <input type="checkbox" checked={quizSettings.hardMode} onChange={(e) => setQuizSettings(prev => ({...prev, hardMode: e.target.checked}))} className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500" />
                                        </div>
                                    </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex justify-between pt-6 border-t">
                                    <button onClick={() => setStep(1)} className="h-10 px-6 rounded-xl border font-medium text-sm">Back</button>
                                    <button onClick={() => setStep(3)} className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm">Generate Quiz</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // Step 3: Quiz View
    return (
        <div className="min-h-screen bg-white flex">
            <SidebarNavigation />
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Quiz Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Quiz in Progress</h1>
                                <p className="text-gray-600">Question 1 of {quizSettings.maxQuestions}</p>
                            </div>
                            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 h-10 px-4 border rounded-xl text-sm font-medium"><Settings className="h-4 w-4" />Settings</button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: "5%" }}></div>
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="rounded-lg border-2 border-gray-200 bg-white mb-8">
                        <div className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-purple-600 font-medium">1</span></div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 mb-6">How is the Link Layer typically implemented in devices?</h3>
                                    {/* Answer Options */}
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 cursor-pointer transition-colors"><input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500"/><span>A) Through software applications only</span></label>
                                        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 cursor-pointer transition-colors"><input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500"/><span>B) In both hardware and firmware/software</span></label>
                                        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 cursor-pointer transition-colors"><input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500"/><span>C) Only using Network Interface Cards (NICs)</span></label>
                                        <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 cursor-pointer transition-colors"><input type="radio" name="question1" className="text-purple-600 focus:ring-purple-500"/><span>D) Exclusively in the operating system</span></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                        <button className="h-10 px-6 rounded-xl border font-medium text-sm">Previous</button>
                        <div className="flex gap-3">
                            <button className="h-10 px-6 rounded-xl border font-medium text-sm">Skip</button>
                            <button className="h-10 px-8 bg-purple-600 text-white rounded-xl font-medium text-sm">Next Question</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}