"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Sparkles, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Spline from "@splinetool/react-spline"
import "./AIFloatingWidget.css"
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
      className="ai-floating-widget font-figtree"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`speech-bubble ${showBubble ? "visible" : ""}`}>
        <div className="bubble-text">
          {fullText.substring(0, textIndex)}
          {textIndex < fullText.length && <span className="cursor">|</span>}
        </div>
        <div className="bubble-arrow" />
      </div>

      <div className="blob-container">
        <div className={`blob-glow ${isHovered ? "active" : ""}`} />
        <div className="blob-wrapper">
          <Spline scene="https://prod.spline.design/sFVNZmY5tr8VKMry/scene.splinecode" />
        </div>
      </div>

      <div className={`chat-bubble group ${showBubble ? "visible" : ""}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

        <div className="chat-header">
          <div className="header-icon">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <p className="chat-title">Chat with AI</p>
            <p className="chat-subtitle">Get instant answers</p>
          </div>
        </div>

        <div className="chat-content">
          <p className="chat-message">
            Ask questions, get insights, and explore ideas with our AI assistant
          </p>
          <button onClick={handleChatNow} className="chat-button">
            <MessageCircle className="button-icon" size={18} />
            <span>Start Chat</span>
            <ArrowRight className="arrow-icon" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
