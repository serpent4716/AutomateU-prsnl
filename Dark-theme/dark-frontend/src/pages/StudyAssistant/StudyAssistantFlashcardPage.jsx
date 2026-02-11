"use client"

import { useState } from "react"
import { Zap, RotateCcw, ChevronLeft, ChevronRight, Plus, Settings, Shuffle } from "lucide-react"
import { SidebarNavigation } from "../SidebarNavigation";


const initialFlashcards = [
  {
    id: "1",
    front: "What is the OSI Model?",
    back: "The Open Systems Interconnection (OSI) model is a conceptual framework that describes how data moves through a network. It has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.",
    difficulty: "medium",
    mastered: false,
    color: "from-blue-600 to-blue-700",
    borderColor: "border-blue-500/50",
    shadowColor: "shadow-blue-500/40",
  },
  {
    id: "2",
    front: "Define TCP/IP",
    back: "Transmission Control Protocol/Internet Protocol (TCP/IP) is the fundamental communication protocol suite for the internet. TCP handles reliable data transmission while IP handles addressing and routing.",
    difficulty: "easy",
    mastered: true,
    color: "from-purple-600 to-purple-700",
    borderColor: "border-purple-500/50",
    shadowColor: "shadow-purple-500/40",
  },
  {
    id: "3",
    front: "What is a MAC Address?",
    back: "A Media Access Control (MAC) address is a unique identifier assigned to network interfaces. It operates at the Data Link layer and is used for local network communication.",
    difficulty: "hard",
    mastered: false,
    color: "from-pink-600 to-pink-700",
    borderColor: "border-pink-500/50",
    shadowColor: "shadow-pink-500/40",
  },
]

export default function StudyAssistantFlashcardPage() {
  const [flashcards, setFlashcards] = useState(initialFlashcards)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studyMode, setStudyMode] = useState("study")

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    setIsFlipped(false)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
      case "medium":
        return "bg-amber-500/30 text-amber-200 border border-amber-500/40 shadow-lg shadow-amber-500/20"
      case "hard":
        return "bg-red-500/30 text-red-200 border border-red-500/40 shadow-lg shadow-red-500/20"
      default:
        return "bg-gray-500/30 text-gray-200 border border-gray-500/40"
    }
  }

  if (studyMode === "create") {
    return <div className="min-h-screen bg-black flex font-figtree relative overflow-hidden"></div>
  }

  const currentFlashcard = flashcards[currentCard]

  return (
     <div className="min-h-screen bg-white flex">
                    <SidebarNavigation />
    <div className="min-h-screen bg-black flex-1 font-figtree relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 p-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-xl flex items-center justify-center backdrop-blur-md border border-blue-400/40 shadow-lg shadow-blue-500/20">
                  <Zap className="h-5 w-5 text-blue-200" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Flashcards</h1>
                  <p className="text-gray-400 text-sm">Network Fundamentals • {flashcards.length} cards</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStudyMode("create")}
                  className="inline-flex items-center justify-center gap-2 h-10 px-3 py-2 border border-blue-500/40 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-500/10 transition-all"
                >
                  <Plus className="h-4 w-4" /> Add Cards
                </button>
                <button className="inline-flex items-center justify-center gap-2 h-10 px-3 py-2 border border-blue-500/40 rounded-lg bg-transparent text-sm font-medium text-blue-200 hover:bg-blue-500/10 transition-all">
                  <Shuffle className="h-4 w-4" /> Shuffle
                </button>
                <button className="inline-flex items-center justify-center h-10 w-10 border border-blue-500/40 rounded-lg bg-transparent text-blue-200 hover:bg-blue-500/10 transition-all">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 bg-gray-800/30 rounded-full h-2 backdrop-blur-sm border border-gray-700/30">
                <div
                  className={`bg-gradient-to-r ${currentFlashcard.color} h-2 rounded-full transition-all duration-300 shadow-lg ${currentFlashcard.shadowColor}`}
                  style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-300 font-medium">
                {currentCard + 1} of {flashcards.length}
              </span>
            </div>
          </div>

          <div className="mb-8 h-96" style={{ perspective: "1200px" }}>
            <div
              className={`relative w-full h-full transition-transform duration-500 cursor-pointer`}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front of card */}
              <div
                className={`absolute w-full h-full rounded-2xl border-2 ${currentFlashcard.borderColor} bg-gradient-to-br ${currentFlashcard.color} backdrop-blur-xl shadow-2xl ${currentFlashcard.shadowColor} p-12 flex flex-col justify-center items-center text-center`}
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div className="absolute top-6 flex gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getDifficultyColor(currentFlashcard.difficulty)}`}
                  >
                    {currentFlashcard.difficulty}
                  </span>
                  {currentFlashcard.mastered && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                      Mastered
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h2 className="text-4xl font-bold text-white mb-6 leading-tight">{currentFlashcard.front}</h2>
                  <p className="text-white/70 text-sm font-medium">Click to reveal answer</p>
                </div>
              </div>

              {/* Back of card */}
              <div
                className={`absolute w-full h-full rounded-2xl border-2 ${currentFlashcard.borderColor} bg-gradient-to-br ${currentFlashcard.color} backdrop-blur-xl shadow-2xl ${currentFlashcard.shadowColor} p-12 flex flex-col justify-center items-center text-center`}
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-lg text-white leading-relaxed max-w-2xl mb-8">{currentFlashcard.back}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFlipped(false)
                    }}
                    className="inline-flex items-center text-white/80 hover:text-white font-semibold transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" /> Flip Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={prevCard}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 py-2 border border-gray-600/50 rounded-lg bg-gray-900/40 backdrop-blur-sm text-sm font-medium text-gray-200 hover:bg-gray-800/60 hover:border-gray-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={currentCard === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {isFlipped && (
              <div className="flex gap-3 animate-in fade-in duration-300">
                <button className="h-10 px-6 rounded-lg border border-red-500/40 text-red-200 hover:bg-red-500/10 bg-red-950/30 backdrop-blur-sm text-sm font-medium transition-all">
                  Hard
                </button>
                <button className="h-10 px-6 rounded-lg border border-amber-500/40 text-amber-200 hover:bg-amber-500/10 bg-amber-950/30 backdrop-blur-sm text-sm font-medium transition-all">
                  Medium
                </button>
                <button className="h-10 px-6 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-500/30">
                  Easy
                </button>
              </div>
            )}
            <button
              onClick={nextCard}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 py-2 border border-gray-600/50 rounded-lg bg-gray-900/40 backdrop-blur-sm text-sm font-medium text-gray-200 hover:bg-gray-800/60 hover:border-gray-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={currentCard === flashcards.length - 1}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
   </div> 
  )
}
