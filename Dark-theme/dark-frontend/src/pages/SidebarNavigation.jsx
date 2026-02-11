import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, MessageCircle, Brain, CalendarDays, Search, Settings, CheckSquare } from "lucide-react"

// Simple utility
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function SidebarNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const navigationItems = [
    { icon: Home, label: "Home", path: "/dashboard", gradient:  "from-orange-400 via-pink-400 to-purple-400"  },
    { icon: CheckSquare, label: "Tasks", path: "/tasks", gradient: "from-cyan-400 via-sky-500 to-indigo-500" },
    { icon: MessageCircle, label: "Chat", path: "/chat", gradient:"from-blue-400 via-cyan-500 to-emerald-500"  },
    { icon: Brain, label: "Study Assistant", path: "/study-assistant", gradient: "from-violet-400 via-purple-400 to-indigo-400" },
    { icon: CalendarDays, label: "Attendance", path: "/attendance", gradient: "from-teal-400 via-emerald-500 to-lime-500" },
    { icon: Search, label: "Lost & Found", path: "/lost-found", gradient: "from-teal-500 to-teal-600" },
  ]

  return (
    <>
      <div className="fixed left-0 top-0 h-screen w-16 bg-black/95 backdrop-blur-xl border-r border-gray-800 flex flex-col items-center py-4 space-y-3">

        {/* Avatar — warm gradient */}
        <div className="mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 via-rose-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
            JD
          </div>
        </div>

        {/* Nav Items */}
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={item.label}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200",
                isActive
                  ? `bg-gradient-to-tr ${item.gradient} text-white shadow-md`
                  : "text-gray-400 hover:bg-gray-800"
              )}
            >
              <Icon className="h-5 w-5 transition-transform duration-300 hover:scale-125 hover:-translate-y-[2px]" />
            </button>
          )
        })}

        <div className="flex-1" />

        {/* Settings — separate gradient */}
        <button
          onClick={() => navigate("/settings")}
          title="Settings"
          className="w-12 h-12 flex items-center justify-center rounded-xl  text-white shadow-md"
        >
          <Settings className="h-5 w-5 transition-transform duration-300 hover:scale-125 hover:-translate-y-[2px]" />
        </button>
      </div>

      {/* Space for sidebar */}
      <style>{`body { padding-left: 4rem; }`}</style>
    </>
  )
}
