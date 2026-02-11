"use client"

import { useState, useEffect } from "react"   // <--- ADDED useEffect
import { SidebarNavigation } from "./SidebarNavigation"
import { CalendarDays, Search, CheckSquare, BookOpen, Zap, Target, PenTool, Users, ArrowRight } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import TextType from "../components/TextType/TextType.jsx"

import LiquidEther from "../components/LiquidEther/LiquidEther.jsx"

import AIFloatingWidget from "../components/AIFloatingWidget/AIFloatingWidget.jsx"
import ProductivityMetrics from "../components/ProductivityMetrics/ProductivityMetrics.jsx"

import SpotlightCard from "../components/SpotlightCard/SpotlightCard.jsx"


// <CHANGE> Added inline animation styles for interactive icon movements
const animationStyles = `
  @keyframes float-up {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(5deg); }
  }
  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes bounce-icon {
    0%, 100% { transform: scale(1) translateY(0); }
    50% { transform: scale(1.1) translateY(-4px); }
  }
  @keyframes pulse-glow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
  .icon-float:hover {
    animation: float-up 0.6s ease-in-out infinite;
  }
  .icon-spin:hover {
    animation: spin-slow 0.8s linear infinite;
  }
  .icon-bounce:hover {
    animation: bounce-icon 0.5s ease-in-out infinite;
  }
  .icon-pulse:hover {
    animation: pulse-glow 0.6s ease-in-out infinite;
  }
`

const initialTasks = [
  {
    id: "1",
    title: "Design new landing page",
    description: "Create wireframes and mockups",
    status: "todo",
    priority: "high",
  },
  {
    id: "2",
    title: "Implement user authentication",
    description: "Set up OAuth integration",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "3",
    title: "Write API documentation",
    description: "Document all REST endpoints",
    status: "done",
    priority: "medium",
  },
]

export default function DashboardPage() {
  const [tasks] = useState(initialTasks)
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredTool, setHoveredTool] = useState(null)
  const navigate = useNavigate()

  // ----------------------------------------------------------
  // ✅ BACKEND LOGIN CHECK ADDED (from light-mode)
  // ----------------------------------------------------------
  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      navigate("/login")
      return
    }
  }, [navigate])
  // ----------------------------------------------------------

  const studyingTools = [
    {
      icon: BookOpen,
      title: "Study Assistant",
      description: "AI-powered study help",
      path: "/study-assistant",
      gradient: "from-emerald-400 via-green-300 to-emerald-500",
      bgGradient: "from-emerald-950/40 to-emerald-900/20",
      glow: "rgba(16, 185, 129, 0.45)",
      animation: "icon-float",
    },
    {
      icon: Target,
      title: "Quiz",
      description: "Test your knowledge",
      path: "/study-assistant/quiz",
      gradient: "from-purple-400 via-pink-400 to-violet-500",
      bgGradient: "from-purple-950/40 to-purple-900/20",
      glow: "rgba(192, 132, 252, 0.45)",
      animation: "icon-spin",
    },
    {
      icon: Zap,
      title: "Flashcards",
      description: "Quick learning sessions",
      path: "/study-assistant/flashcards",
      gradient: "from-amber-400 via-orange-400 to-yellow-400",
      bgGradient: "from-amber-950/40 to-amber-900/20",
      glow: "rgba(251, 191, 36, 0.45)",
      animation: "icon-bounce",
    },
    {
      icon: PenTool,
      title: "Write",
      description: "Essays & research papers",
      path: "/study-assistant/write",
      gradient: "from-cyan-400 via-sky-400 to-teal-400",
      bgGradient: "from-cyan-950/40 to-cyan-900/20",
      glow: "rgba(34, 211, 238, 0.45)",
      animation: "icon-pulse",
    },
  ]

  const productivityTools = [
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "Manage your work",
      path: "/tasks",
      gradient: "from-blue-400 via-cyan-400 to-indigo-400",
      bgGradient: "from-blue-950/40 to-blue-900/20",
      glow: "rgba(96, 165, 250, 0.45)",
      animation: "icon-bounce",
    },
    {
      icon: CalendarDays,
      title: "Attendance",
      description: "Track your classes",
      path: "/attendance",
      gradient: "from-violet-400 via-purple-400 to-indigo-400",
      bgGradient: "from-purple-950/40 to-purple-900/20",
      glow: "rgba(167, 139, 250, 0.45)",
      animation: "icon-float",
    },
    {
      icon: Search,
      title: "Lost & Found",
      description: "Find missing items",
      path: "/lost-found",
      gradient: "from-teal-400 via-green-400 to-emerald-400",
      bgGradient: "from-teal-950/40 to-teal-900/20",
      glow: "rgba(45, 212, 191, 0.45)",
      animation: "icon-spin",
    },
    {
      icon: Users,
      title: "Team Chat",
      description: "Collaborate with others",
      path: "/chat",
      gradient: "from-pink-400 via-rose-400 to-fuchsia-400",
      bgGradient: "from-pink-950/40 to-pink-900/20",
      glow: "rgba(244, 114, 182, 0.45)",
      animation: "icon-pulse",
    },
  ]

  return (
    <div className="relative min-h-screen font-figtree overflow-hidden bg-black ">
      <style>{animationStyles}</style>

      <div className="absolute inset-0 -z-10 opacity-10">
        <LiquidEther cursorSize={35} />
      </div>

      <AIFloatingWidget />

      <div className="min-h-screen flex transition-all">
        <SidebarNavigation />

        <main className="flex-1 p-6 lg:p-10 font-figtree">
          <div className="mb-10">
            <div className="mb-6">
              <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight mb-3 text-white font-figtree">
                <TextType
                  text={[
                    "Good morning!",
                    "Welcome to AutomateU",
                    "Manage tasks, track attendance,",
                    "Find lost items & chat with AI",
                  ]}
                  typingSpeed={70}
                  pauseDuration={2500}
                  showCursor={true}
                  cursorCharacter="|"
                  highlightWords={["AutomateU"]}
                  gradientMap={{
                    AutomateU: "linear-gradient(to right, #fb923c, #f472b6, #c084fc)",
                  }}
                />
              </h1>
              <p className="text-base lg:text-lg text-gray-400 font-medium font-figtree leading-relaxed">
                Let's make today{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 font-bold">
                  productive
                </span>{" "}
                and{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-400 font-bold">
                  efficient
                </span>.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl relative group font-figtree">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 px-5 py-3 shadow-md hover:shadow-orange-500/10 transition-all duration-300 hover:border-white/20">
                <Search className="text-orange-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-sm text-gray-200 placeholder-gray-500 font-medium font-figtree"
                />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="mb-12 font-figtree">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-1 w-10 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 rounded-full" />
              <h2 className="text-2xl lg:text-2xl font-bold text-white tracking-tight font-figtree">
                Your Performance
              </h2>
            </div>
            <ProductivityMetrics />
          </div>

          {/* Study Tools */}
          <div className="mb-12 font-figtree">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-1 w-10 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-full" />
              <h2 className="text-2xl lg:text-2xl font-extrabold text-white tracking-tight font-figtree">
                Study Tools
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 font-figtree">
              {studyingTools.map((tool) => {
                const Icon = tool.icon
                const isHovered = hoveredTool === tool.title
                return (
                  <div
                    key={tool.title}
                    onClick={() => navigate(tool.path)}
                    onMouseEnter={() => setHoveredTool(tool.title)}
                    onMouseLeave={() => setHoveredTool(null)}
                    className="cursor-pointer font-figtree"
                  >
                    <SpotlightCard spotlightColor={tool.glow}>
                      <div
                        className={`relative rounded-2xl p-6 bg-gradient-to-br ${tool.bgGradient} backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all duration-500 hover:scale-105 flex flex-col gap-4 font-figtree`}
                      >
                        <div className="p-3 rounded-xl w-fit bg-white/5">
                          <Icon className={`h-5 w-5 text-white/90 ${tool.animation}`} />
                        </div>
                        <div>
                          <h3
                            className={`font-bold text-lg tracking-tight mb-1 transition-all duration-300 font-figtree ${isHovered
                                ? "bg-clip-text text-transparent bg-gradient-to-r " + tool.gradient
                                : "text-white"
                              }`}
                          >
                            {tool.title}
                          </h3>
                          <p className="text-xs text-gray-400 font-medium leading-relaxed font-figtree">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </SpotlightCard>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Productivity Tools */}
          <div className="mb-8 font-figtree">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-1 w-10 bg-gradient-to-r from-blue-400 via-teal-400 to-pink-400 rounded-full" />
              <h2 className="text-2xl lg:text-2xl font-extrabold text-white tracking-tight font-figtree">
                Productivity Tools
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-figtree">
              {productivityTools.map((tool) => {
                const Icon = tool.icon
                const isHovered = hoveredTool === tool.title
                return (
                  <div
                    key={tool.title}
                    onClick={() => navigate(tool.path)}
                    onMouseEnter={() => setHoveredTool(tool.title)}
                    onMouseLeave={() => setHoveredTool(null)}
                    className="cursor-pointer font-figtree"
                  >
                    <SpotlightCard spotlightColor={tool.glow}>
                      <div
                        className={`relative rounded-2xl p-6 bg-gradient-to-br ${tool.bgGradient} backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all duration-500 hover:scale-105 flex items-center gap-5 font-figtree`}
                      >
                        <div className="p-3 rounded-xl bg-white/5">
                          <Icon className={`h-5 w-5 text-white/90 ${tool.animation}`} />
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`font-bold text-lg tracking-tight mb-1 transition-all duration-300 font-figtree ${isHovered
                                ? "bg-clip-text text-transparent bg-gradient-to-r " + tool.gradient
                                : "text-white"
                              }`}
                          >
                            {tool.title}
                          </h3>
                          <p className="text-xs text-gray-400 font-medium leading-relaxed font-figtree">
                            {tool.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-all duration-300 group-hover:translate-x-2 flex-shrink-0" />
                      </div>
                    </SpotlightCard>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
