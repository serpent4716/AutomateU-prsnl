import React, { useState, useEffect } from "react"
import { SidebarNavigation } from "./SidebarNavigation"
import { MessageCircle, CalendarDays, Search, CheckSquare, BookOpen, FileText, Target, PenTool } from "lucide-react"
import { useNavigate } from "react-router-dom"
import TextType from "../components/TextType/TextType"
import ProductivityMetrics from "../components/ProductivityMetrics/ProductivityMetrics"
import api from "../services/api"

// Dark theme visual components
import LiquidEther from "../components/LiquidEther/LiquidEther.jsx"

import SpotlightCard from "../components/SpotlightCard/SpotlightCard.jsx"


// Utility function (instead of cn from shadcn)
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tasks, setTasks] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      navigate("/login")
      return
    }

    const fetchTasks = async () => {
      try {
        const response = await api.get("/tasks")
        setTasks(response.data || [])
      } catch (err) {
        console.error("Failed to fetch dashboard tasks:", err)
        setTasks([])
      }
    }

    fetchTasks()
  }, [navigate])

  // Quick Actions (no dark reference in original, so we match Tasks-style blue gradient)
  const quickActions = [
    {
      icon: MessageCircle,
      title: "Chat with AI",
      description: "Get instant help and answers",
      path: "/study-assistant/chat",
      // Light theme classes (unchanged)
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "text-blue-600",
      // Dark theme: match Tasks card from dark dashboard
      darkClasses:
        "dark:bg-blue-950 dark:border-blue-700", // Changed to solid colors
      glow: "rgba(96, 165, 250, 0.45)",
    },
  ]

  // Studying tools — colors mapped exactly by index from dark dashboard
  const studyingTools = [
    {
      icon: BookOpen,
      title: "Study Assistant",
      description: "AI-powered study help",
      path: "/study-assistant",
      // Light (unchanged)
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "text-green-600",
      // Dark: Study Assistant from dark dashboard
      darkClasses:
        "dark:bg-emerald-950 dark:border-emerald-700",
      glow: "rgba(16,185,129,0.45)",
    },
    {
      icon: Target,
      title: "Quiz",
      description: "Test your knowledge",
      path: "/study-assistant/quiz",
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      iconColor: "text-purple-600",
      // Dark: Quiz from dark dashboard
      darkClasses:
        "dark:bg-purple-950 dark:border-purple-700",
      glow: "rgba(192,132,252,0.45)",
    },
    {
      icon: FileText,
      title: "Summarizer",
      description: "Summarize documents and articles",
      path: "/study-assistant/summarize",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "text-green-600",
      // Dark: Flashcards colors from dark dashboard (applied to Summarizer)
      darkClasses:
        "dark:bg-amber-950 dark:border-amber-700",
      glow: "rgba(251,191,36,0.45)",
    },
    {
      icon: PenTool,
      title: "Document Generator",
      description: "Generate your Submission Documents Easily",
      path: "/study-assistant/docgenerator",
      color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
      iconColor: "text-indigo-600",
      // Dark: Write colors from dark dashboard
      darkClasses:
        "dark:bg-cyan-950 dark:border-cyan-700",
      glow: "rgba(34,211,238,0.45)",
    },
  ]

  // Productivity tools — colors mapped exactly by index from dark dashboard
  const productivityTools = [
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "Manage your work",
      path: "/tasks",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "text-blue-600",
      // Dark: Tasks from dark dashboard
      darkClasses:
        "dark:bg-blue-950 dark:border-blue-700",
      glow: "rgba(96,165,250,0.45)",
    },
    {
      icon: CalendarDays,
      title: "Attendance",
      description: "Track your classes",
      path: "/attendance",
      color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
      iconColor: "text-indigo-600",
      // Dark: Attendance from dark dashboard
      darkClasses:
        "dark:bg-purple-950 dark:border-pruple-700",
      glow: "rgba(167,139,250,0.45)",
    },
    {
      icon: Search,
      title: "Lost & Found",
      description: "Find missing items",
      path: "/lost-found",
      color: "bg-teal-50 hover:bg-teal-100 border-teal-200",
      iconColor: "text-teal-600",
      // Dark: Lost & Found from dark dashboard
      darkClasses:
        "dark:bg-teal-950 dark:border-teal-700",
      glow: "rgba(45,212,191,0.45)",
    },
    {
      icon: PenTool,
      title: "Document Generator",
      description: "Generate your Submission Documents Easily",
      path: "/study-assistant/docgenerator",
      color: "bg-pink-50 hover:bg-pink-100 border-pink-200",
      iconColor: "text-pink-600",
      // Dark: Team Chat colors from dark dashboard (applied to Document Generator)
      darkClasses:
        "dark:bg-pink-950 dark:border-pink-700",
      glow: "rgba(244,114,182,0.45)",
    },
  ]

  return (
    <div className="relative min-h-screen bg-white dark:bg-black flex overflow-hidden">
      {/* Dark-only Liquid Ether background */}
      <div className="absolute inset-0 -z-10 opacity-10 hidden dark:block pointer-events-none h-full w-full">
        <LiquidEther cursorSize={35} />
      </div>

      <SidebarNavigation />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight mb-3 text-gray-700 dark:text-white font-figtree">
              <TextType
                text={[
                  "Hello welcome to AutomateU",
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
            <p className="text-base lg:text-lg text-gray-400 dark:text-gray-400 font-medium font-figtree leading-relaxed">
              {tasks.length === 0 ? "Start with your first task (optional)." : "Track your progress and keep your momentum going."}
            </p>
          </div>

          {/* Search - keeps light style, adds dark variant similar to dark dashboard */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tasks, documents, or ask me anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:border-gray-300 transition-colors w-full outline-none",
                "dark:bg-white/5 dark:border-white/10 dark:text-gray-200 dark:placeholder-gray-500 dark:shadow-md dark:hover:shadow-orange-500/10 dark:hover:border-white/20"
              )}
            />
          </div>
        </div>

        {/* Performance */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Performance
          </h2>
          <ProductivityMetrics tasks={tasks} />
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <SpotlightCard spotlightColor={action.glow} key={action.title}>
                <div
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2 rounded-xl",
                    action.darkClasses,
                    action.color
                    
                  )}
                  onClick={() => navigate(action.path)}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-white/5 rounded-xl shadow-sm">
                        <Icon className={cn("h-6 w-6", action.iconColor, "dark:text-white/90")} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {action.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            )
          })}
        </div>

        {/* Studying Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Studying</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {studyingTools.map((tool) => {
              const Icon = tool.icon
              return (
                <SpotlightCard spotlightColor={tool.glow} key={tool.title}>
                  <div
                    className={cn(
                      "cursor-pointer transition-all duration-200 border-2 rounded-xl",
                      tool.darkClasses,
                      tool.color
                      
                    )}
                    onClick={() => navigate(tool.path)}
                  >
                    <div className="p-6">
                      <div className="flex flex-col items-start gap-3">
                        <div className="p-3 bg-white dark:bg-white/5 rounded-xl shadow-sm">
                          <Icon className={cn("h-6 w-6", tool.iconColor, "dark:text-white/90")} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {tool.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              )
            })}
          </div>
        </div>

        {/* Productivity Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Productivity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productivityTools.map((tool) => {
              const Icon = tool.icon
              return (
                <SpotlightCard spotlightColor={tool.glow} key={tool.title}>
                  <div
                    className={cn(
                      "cursor-pointer transition-all duration-200 border-2 rounded-xl",
                      tool.color,
                      tool.darkClasses
                    )}
                    onClick={() => navigate(tool.path)}
                  >
                    <div className="p-6">
                      <div className="flex flex-col items-start gap-3">
                        <div className="p-3 bg-white dark:bg-white/5 rounded-xl shadow-sm">
                          <Icon className={cn("h-6 w-6", tool.iconColor, "dark:text-white/90")} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {tool.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
