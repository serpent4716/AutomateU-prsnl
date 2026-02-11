import React, { useState, useEffect } from "react"
import SidebarWrapper from "../wrapper/SidebarWrapper";
import { MessageCircle, CalendarDays, Search, CheckSquare, BookOpen, FileText, Target, PenTool, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { SidebarNavigation } from "./SidebarNavigation";
// Utility function (instead of cn from shadcn)
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export default function DashboardPage() {

  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      navigate("/login")
      return
    }
  }, [navigate])

  const quickActions = [
    {
      icon: MessageCircle,
      title: "Chat with AI",
      description: "Get instant help and answers",
      path: "/study-assistant/chat",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "text-blue-600",
    },
  ]

  const studyingTools = [
    {
      icon: BookOpen,
      title: "Study Assistant",
      description: "AI-powered study help",
      path: "/study-assistant",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "text-green-600",
    },
    {
      icon: Target,
      title: "Quiz",
      description: "Test your knowledge",
      path: "/study-assistant/quiz",
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      iconColor: "text-purple-600",
    },
    {
      icon: FileText,
      title: "Summarizer",
      description: "Summarize documents and articles",
      path: "/study-assistant/summarize",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "text-green-600",
    },
    {
      icon: PenTool,
      title: "Document Generator",
      description: "Generate your Submission Documents Easily",
      path: "/study-assistant/docgenerator",
      color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
      iconColor: "text-indigo-600",
    },
  ]

  const productivityTools = [
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "Manage your work",
      path: "/tasks",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      icon: CalendarDays,
      title: "Attendance",
      description: "Track your classes",
      path: "/attendance",
      color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
      iconColor: "text-indigo-600",
    },
    {
      icon: Search,
      title: "Lost & Found",
      description: "Find missing items",
      path: "/lost-found",
      color: "bg-teal-50 hover:bg-teal-100 border-teal-200",
      iconColor: "text-teal-600",
    },
    {
      icon: PenTool,
      title: "Document Generator",
      description: "Generate your Submission Documents Easily",
      path: "/study-assistant/docgenerator",
      color: "bg-pink-50 hover:bg-pink-100 border-pink-200",
      iconColor: "text-pink-600",
    },
  ]

  return (
    <div className="min-h-screen bg-white flex">
      <SidebarNavigation />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Good morning! 👋</h1>
              <p className="text-gray-600">Ready to be productive today?</p>
            </div>
          </div>

          {/* Search - Custom Input */}
          <div className="relative  w-full max-w-4xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tasks, documents, or ask me anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:border-gray-300 transition-colors w-full outline-none"
            />
          </div>
        </div>

        {/* Quick Action */}
        <div className="mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <div
                key={action.title}
                className={cn(
                  "cursor-pointer transition-all duration-200 border-2 rounded-xl",
                  action.color
                )}
                onClick={() => navigate(action.path)}
              >
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Icon className={cn("h-6 w-6", action.iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{action.title}</h3>
                      <p className="text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Studying Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Studying</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {studyingTools.map((tool) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.title}
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2 rounded-xl",
                    tool.color
                  )}
                  onClick={() => navigate(tool.path)}
                >
                  <div className="p-6">
                    <div className="flex flex-col items-start gap-3">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Icon className={cn("h-6 w-6", tool.iconColor)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                        <p className="text-gray-600 text-sm">{tool.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Productivity Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Productivity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productivityTools.map((tool) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.title}
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2 rounded-xl",
                    tool.color
                  )}
                  onClick={() => navigate(tool.path)}
                >
                  <div className="p-6">
                    <div className="flex flex-col items-start gap-3">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <Icon className={cn("h-6 w-6", tool.iconColor)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                        <p className="text-gray-600 text-sm">{tool.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
