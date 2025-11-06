import React, { useState } from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import { Zap, RotateCcw, ChevronLeft, ChevronRight, Plus, Settings, Shuffle } from "lucide-react";

// Initial data for the flashcards
const initialFlashcards = [
    {
        id: "1",
        front: "What is the OSI Model?",
        back: "The Open Systems Interconnection (OSI) model is a conceptual framework that describes how data moves through a network. It has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.",
        difficulty: "medium",
        mastered: false,
    },
    {
        id: "2",
        front: "Define TCP/IP",
        back: "Transmission Control Protocol/Internet Protocol (TCP/IP) is the fundamental communication protocol suite for the internet. TCP handles reliable data transmission while IP handles addressing and routing.",
        difficulty: "easy",
        mastered: true,
    },
    {
        id: "3",
        front: "What is a MAC Address?",
        back: "A Media Access Control (MAC) address is a unique identifier assigned to network interfaces. It operates at the Data Link layer and is used for local network communication.",
        difficulty: "hard",
        mastered: false,
    },
];

export default function StudyAssistantFlashcardPage() {
    const [flashcards, setFlashcards] = useState(initialFlashcards);
    const [currentCard, setCurrentCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studyMode, setStudyMode] = useState("study"); // "study" or "create"

    // Card navigation
    const nextCard = () => {
        setCurrentCard((prev) => (prev + 1) % flashcards.length);
        setIsFlipped(false);
    };

    const prevCard = () => {
        setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        setIsFlipped(false);
    };
    
    // Helper to get color classes based on difficulty
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "easy": return "bg-green-100 text-green-700";
            case "medium": return "bg-yellow-100 text-yellow-700";
            case "hard": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };
    
    // --- CREATE MODE VIEW ---
    if (studyMode === "create") {
        return (
            <div className="min-h-screen bg-white flex">
                <SidebarNavigation />
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                        <Plus className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-semibold text-gray-900">Create Flashcards</h1>
                                        <p className="text-gray-600">Add new cards to your study deck</p>
                                    </div>
                                </div>
                                <button onClick={() => setStudyMode("study")} className="inline-flex items-center justify-center h-10 px-4 py-2 bg-transparent text-sm font-medium border border-input rounded-xl hover:bg-accent">
                                    Back to Study
                                </button>
                            </div>
                        </div>

                        {/* Create Form */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="rounded-lg border-2 border-gray-200 bg-white shadow-sm">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Front of Card</h3>
                                    <input placeholder="Enter question or term..." className="w-full mb-4 text-lg p-4 h-auto border rounded-md" />
                                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                        <span className="text-gray-400">Question preview</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border-2 border-gray-200 bg-white shadow-sm">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Back of Card</h3>
                                    <input placeholder="Enter answer or definition..." className="w-full mb-4 text-lg p-4 h-auto border rounded-md" />
                                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                        <span className="text-gray-400">Answer preview</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-center">
                            <button className="inline-flex items-center justify-center gap-2 h-12 px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-base font-medium">
                                <Plus className="h-4 w-4" /> Add Flashcard
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // --- STUDY MODE VIEW (DEFAULT) ---
    return (
        <div className="min-h-screen bg-white flex">
            <SidebarNavigation />
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Flashcards</h1>
                                    <p className="text-gray-600">Network Fundamentals • {flashcards.length} cards</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setStudyMode("create")} className="inline-flex items-center justify-center gap-2 h-10 px-3 py-2 border rounded-xl text-sm font-medium hover:bg-accent">
                                    <Plus className="h-4 w-4" /> Add Cards
                                </button>
                                <button className="inline-flex items-center justify-center gap-2 h-10 px-3 py-2 border rounded-xl bg-transparent text-sm font-medium hover:bg-accent">
                                    <Shuffle className="h-4 w-4" /> Shuffle
                                </button>
                                <button className="inline-flex items-center justify-center h-10 w-10 border rounded-xl bg-transparent hover:bg-accent">
                                    <Settings className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div className="bg-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-600 font-medium">{currentCard + 1} of {flashcards.length}</span>
                        </div>
                    </div>

                    {/* Flashcard */}
                    <div className="mb-8">
                        <div
                            className={`rounded-lg border-2 border-gray-200 cursor-pointer transition-all duration-500 transform hover:scale-[1.02] ${isFlipped ? "bg-orange-50 border-orange-200" : "bg-white"}`}
                            onClick={() => setIsFlipped(!isFlipped)}
                            style={{ minHeight: "400px", perspective: "1000px" }}
                        >
                            <div className="p-12 flex flex-col justify-center items-center text-center h-full">
                                <div className="absolute top-6">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(flashcards[currentCard].difficulty)}`}>
                                        {flashcards[currentCard].difficulty}
                                    </span>
                                    {flashcards[currentCard].mastered && (
                                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Mastered</span>
                                    )}
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    {isFlipped ? (
                                        <div>
                                            <p className="text-lg text-gray-800 leading-relaxed max-w-2xl">{flashcards[currentCard].back}</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
                                                className="mt-6 inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" /> Flip Back
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{flashcards[currentCard].front}</h2>
                                            <p className="text-gray-500">Click to reveal answer</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button onClick={prevCard} className="inline-flex items-center justify-center gap-2 h-10 px-6 py-2 border rounded-xl bg-transparent text-sm font-medium hover:bg-accent disabled:opacity-50" disabled={currentCard === 0}>
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        {isFlipped && (
                            <div className="flex gap-3">
                                <button className="h-10 px-6 rounded-xl border-red-200 text-red-600 hover:bg-red-50 bg-transparent text-sm font-medium">Hard</button>
                                <button className="h-10 px-6 rounded-xl border-yellow-200 text-yellow-600 hover:bg-yellow-50 bg-transparent text-sm font-medium">Medium</button>
                                <button className="h-10 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium">Easy</button>
                            </div>
                        )}
                        <button onClick={nextCard} className="inline-flex items-center justify-center gap-2 h-10 px-6 py-2 border rounded-xl bg-transparent text-sm font-medium hover:bg-accent disabled:opacity-50" disabled={currentCard === flashcards.length - 1}>
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}