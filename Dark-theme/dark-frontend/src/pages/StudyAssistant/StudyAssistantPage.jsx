"use client"
import { SidebarNavigation } from "../SidebarNavigation"
import { MessageCircle, Target, Zap, FileText, PenTool } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Spline from "@splinetool/react-spline"
import TextType from "../../components/TextType/TextType.jsx"
import "../../components/TextType/TextType.css"
import Aurora from "../../components/Aurora/Aurora.jsx"
import "../../components/Aurora/Aurora.css"
import SpotlightCard from "../../components/SpotlightCard/SpotlightCard.jsx"
import "../../components/SpotlightCard/SpotlightCard.css"

export default function StudyAssistantPage() {
  const navigate = useNavigate()

  const studyTools = [
    {
      icon: MessageCircle,
      title: "Chat Assistant",
      description: "Get instant help with your questions",
      path: "/study-assistant/chat",
      gradient: "from-blue-300 via-cyan-300 to-indigo-300",
      bgGradient: "from-blue-900/60 to-blue-800/40",
      glow: "rgba(59, 255, 255, 0.6)",
    },
    {
      icon: Target,
      title: "Quiz Generator",
      description: "Create custom quizzes from your materials",
      path: "/study-assistant/quiz",
      gradient: "from-purple-300 via-pink-300 to-violet-400",
      bgGradient: "from-purple-900/60 to-purple-800/40",
      glow: "rgba(255, 100, 200, 0.6)",
    },
    {
      icon: Zap,
      title: "Flashcards",
      description: "Interactive flashcards for quick learning",
      path: "/study-assistant/flashcards",
      gradient: "from-amber-300 via-orange-300 to-yellow-300",
      bgGradient: "from-amber-900/60 to-amber-800/40",
      glow: "rgba(255, 220, 50, 0.6)",
    },
    {
      icon: FileText,
      title: "Summarizer",
      description: "Summarize documents and articles",
      path: "/study-assistant/summarize",
      gradient: "from-emerald-300 via-green-300 to-emerald-400",
      bgGradient: "from-emerald-900/60 to-emerald-800/40",
      glow: "rgba(50, 255, 150, 0.6)",
    },
    {
      icon: PenTool,
      title: "Write",
      description: "Document for lab submission",
      path: "/study-assistant/write",
      gradient: "from-cyan-300 via-sky-300 to-teal-300",
      bgGradient: "from-cyan-900/60 to-cyan-800/40",
      glow: "rgba(100, 255, 255, 0.6)",
    },
  ]

  return (
    <div className="relative min-h-screen font-figtree overflow-hidden bg-black">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora colorStops={["#f11a9b", "#3b82f6", "#6d28d9"]} amplitude={0.0008} blend={0.8} />
      </div>

      <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40" />

      <div className="min-h-screen flex transition-all relative z-10">
        <SidebarNavigation />

        <main className="flex-1 px-6 lg:px-8 font-figtree flex flex-col">
          <div className="flex flex-col items-center justify-start pt-8 lg:pt-10">
            <div className="relative z-20 mb-1" style={{ marginTop: "10px" }}>
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-full px-6 py-2 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/15">
                <p className="text-sm font-semibold text-white/90 font-figtree tracking-wide">
                  <TextType
                    text={[
                      "Hi! I'm AutomateU 👋",
                      "Ready to study smarter? 📚",
                      "Let's ace those exams! 🎯",
                      "Your AI study buddy! 🤖✨",
                    ]}
                    typingSpeed={60}
                    pauseDuration={2000}
                    showCursor={true}
                    cursorCharacter="|"
                  />
                </p>
              </div>
            </div>

            {/* 🔥 ENHANCED ORB GLOW */}
            <div
              className="relative w-full max-w-sm h-100 flex items-center justify-center orb-wrapper"
              style={{ perspective: "1200px" }}
            >
              {/* Glow Layers */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Outer aura */}
                <div
                  style={{
                    width: "420px",
                    height: "420px",
                    background:
                      "radial-gradient(circle, rgba(0,255,255,0.35) 0%, rgba(255,0,180,0.2) 40%, transparent 80%)",
                    filter: "blur(120px) saturate(180%) brightness(1.4)",
                    animation: "pulseGlow 5s ease-in-out infinite",
                    borderRadius: "100%",
                  }}
                />

                {/* Middle aura */}
                <div
                  style={{
                    width: "330px",
                    height: "330px",
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(0,200,255,0.25) 50%, transparent 80%)",
                    filter: "blur(80px)",
                    animation: "pulseGlow 4s ease-in-out infinite .5s",
                    borderRadius: "100%",
                  }}
                />

                {/* Core glow */}
                <div
                  style={{
                    width: "260px",
                    height: "260px",
                    filter: "blur(50px)",
                    animation: "pulseGlow 3s ease-in-out infinite 1s",
                    borderRadius: "100%",
                  }}
                />
              </div>

              {/* Spline orb */}
              <div
                className="relative z-10 spline-orb"
                style={{
                  animation:
                    "bounceOrb 4.8s cubic-bezier(.25, .6, .35, .98) infinite, float-3d 8s ease-in-out infinite",
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                  filter: "drop-shadow(0 0 40px rgba(255,255,255,0.7)) drop-shadow(0 0 90px rgba(0,255,255,0.45))",
                }}
              >
                <Spline scene="https://prod.spline.design/sFVNZmY5tr8VKMry/scene.splinecode" />
              </div>
            </div>

            <div className="text-center mb-8 z-10 px-4">
              <h1 className="text-5xl lg:text-6xl font-black tracking-tighter text-white font-figtree mb-4 leading-tight">
                Study Assistant
              </h1>
              <p className="text-base lg:text-lg text-gray-300 font-medium">
                Enhance your learning with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 font-bold">
                  AI-powered tools
                </span>{" "}
                designed to help you study more effectively
              </p>
            </div>
          </div>

          {/* Tools */}
          <div className="mt-8 mb-14 font-figtree">
            <div className="mb-8 flex items-center justify-center gap-2">
              <div className="h-0.5 w-8 bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 rounded-full" />
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white">Choose Your Tool</h2>
              <div className="h-0.5 w-8 bg-gradient-to-r from-indigo-300 via-purple-300 to-violet-300 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 px-2 max-w-4xl mx-auto">
              {studyTools.map((tool) => {
                const Icon = tool.icon
                return (
                  <div key={tool.title} onClick={() => navigate(tool.path)} className="cursor-pointer h-full">
                    <SpotlightCard spotlightColor={tool.glow}>
                      <div
                        className={`relative rounded-2xl p-8 bg-gradient-to-br ${tool.bgGradient} backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.05] hover:drop-shadow-[0_0_20px_rgba(255,255,255,.45)] flex flex-col gap-4 h-full group`}
                      >
                        <div className="p-3 rounded-xl w-fit bg-white/10 group-hover:bg-white/20 transition-colors">
                          <Icon className="h-7 w-7 text-white/90 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3
                            className={`font-bold text-lg tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r ${tool.gradient}`}
                          >
                            {tool.title}
                          </h3>
                          <p className="text-sm text-gray-300 font-medium leading-relaxed">{tool.description}</p>
                        </div>
                      </div>
                    </SpotlightCard>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes float-3d {
          0%, 100% { transform: translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) }
          25% { transform: translateY(-12px) translateZ(20px) rotateX(2deg) rotateY(-3deg) }
          50% { transform: translateY(-20px) translateZ(30px) rotateX(0deg) rotateY(0deg) }
          75% { transform: translateY(-12px) translateZ(20px) rotateX(-2deg) rotateY(3deg) }
        }
        @keyframes pulseGlow {
          0%,100% { opacity:.65; transform:scale(1) }
          50% { opacity:1; transform:scale(1.12) }
        }
        @keyframes bounceOrb {
          0%,100% { transform:translateY(0) scale(1) }
          20% { transform:translateY(-18px) scale(1.02) }
          40% { transform:translateY(0) scale(0.985) }
          55% { transform:translateY(-8px) scale(1.01) }
          70% { transform:translateY(0) scale(0.997) }
          85% { transform:translateY(-4px) scale(1.005) }
        }
        .spline-orb { will-change: transform; z-index: 2 }
        .orb-wrapper { position: relative; z-index: 3; transform: translateZ(0) }
      `}</style>
    </div>
  )
}
