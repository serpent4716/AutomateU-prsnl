"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Sparkles, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Spline from "@splinetool/react-spline"
import "@fontsource/figtree/400.css"
import "@fontsource/figtree/600.css"
import "@fontsource/figtree/700.css"

export default function AIFloatingWidget() {
  const [isHovered, setIsHovered] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [textIndex, setTextIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (isHovered) {
      setShowBubble(true)
      setTextIndex(0)
      const interval = setInterval(() => {
        setTextIndex((prev) => (prev < 18 ? prev + 1 : 18))
      }, 50)
      return () => clearInterval(interval)
    } else {
      const timer = setTimeout(() => {
        setShowBubble(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isHovered])

  const handleChatNow = () => {
    navigate("/study-assistant/chat")
  }

  const fullText = "Ask me anything!"

  return (
    <div
      className="fixed right-8 bottom-8 z-40 flex flex-col items-center justify-center cursor-pointer font-figtree"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech Bubble */}
      <div
        className={`absolute bottom-[140px] px-4 py-3 rounded-xl shadow-lg whitespace-nowrap
                    bg-white/95 dark:bg-black/80
                    border border-gray-200/80 dark:border-white/20
                    backdrop-blur-md
                    transition-all duration-300
                    ${showBubble ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <div className="text-sm font-semibold text-black dark:text-white min-h-[20px]">
          {fullText.substring(0, textIndex)}
          {textIndex < fullText.length && <span className="animate-pulse ml-0.5">|</span>}
        </div>
        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-[6px] border-l-transparent
                        border-r-[6px] border-r-transparent
                        border-t-[6px] border-t-white/95 dark:border-t-black/80" />
      </div>

      {/* Spline Blob */}
      <div className="relative w-[120px] h-[120px] flex items-center justify-center transition-all duration-300 animate-float">
        <div
          className={`absolute -inset-1.5 rounded-[20%] bg-radial-gradient-white dark:bg-radial-gradient-dark
                      filter blur-lg transition-opacity duration-400
                      ${isHovered ? "opacity-100" : "opacity-0"}`}
        />
        <div className="w-full h-full relative">
          <Spline scene="https://prod.spline.design/sFVNZmY5tr8VKMry/scene.splinecode" />
        </div>
      </div>

      {/* Chat Bubble */}
      <div
        className={`group absolute right-[140px] bottom-0 min-w-[300px] p-4 rounded-2xl
                    bg-gray-50/80 dark:bg-gradient-to-br from-white/10 to-white/5
                    border border-gray-200/80 dark:border-white/15
                    backdrop-blur-xl shadow-2xl dark:shadow-black/20
                    transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                    ${showBubble ? "opacity-100 translate-x-0 scale-100 pointer-events-auto" : "opacity-0 translate-x-5 scale-90 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg
                          bg-gray-200/80 dark:bg-white/10
                          border border-gray-300/80 dark:border-white/20
                          text-gray-700 dark:text-slate-100 flex-shrink-0 animate-pulse-icon">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 -tracking-tight">Chat with AI</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Get instant answers</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-medium text-gray-600 dark:text-slate-300 leading-relaxed -tracking-tight">
            Ask questions, get insights, and explore ideas with our AI assistant
          </p>
          <button
            onClick={handleChatNow}
            className="group/button flex items-center justify-center gap-2 px-4 py-2.5 mt-1.5 rounded-xl
                       bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600
                       text-white text-[13px] font-semibold -tracking-tight
                       shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40
                       transition-all duration-350 ease-in-out
                       hover:-translate-y-0.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Start Chat</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/button:translate-x-1" />
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes pulse-icon {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        .animate-pulse-icon {
          animation: pulse-icon 2s ease-in-out infinite;
        }
        .cubic-bezier\\(0\\.34\\,1\\.56\\,0\\.64\\,1\\) {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bg-radial-gradient-white {
          background-image: radial-gradient(circle, rgba(70, 70, 70, 0.3) 0%, rgba(50, 50, 50, 0.1) 40%, transparent 70%);
        }
        .dark .bg-radial-gradient-dark {
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 70%);
        }
      `}</style>
    </div>
  )
}
