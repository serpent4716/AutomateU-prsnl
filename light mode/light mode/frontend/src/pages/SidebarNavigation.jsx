import React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, MessageCircle, Brain, CalendarDays, Search, Settings, CheckSquare, LogOut} from "lucide-react"
import api from "../services/api"
// Simple utility (instead of cn from shadcn)
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function SidebarNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = async (item) => {
    if (item.label === "Logout") {
        try {
            await api.post("/logout");   // your logout API
            navigate("/login");          // redirect after logout
        } catch (error) {
            console.error("Logout error:", error);
        }
    } else {
        navigate(item.path);
    }
  };
  const navigationItems = [
    {
      icon: Home,
      label: "Home",
      path: "/dashboard",
      description: "Your workspace",
    },
    {
      icon: CheckSquare,
      label: "Tasks",
      path: "/tasks",
      description: "Manage tasks",
    },
    // {
    //   icon: MessageCircle,
    //   label: "Chat",
    //   path: "/chat",
    //   description: "Team chat",
    // },
    {
      icon: Brain,
      label: "Study Assistant",
      path: "/study-assistant",
      description: "AI study help",
    },
    {
      icon: CalendarDays,
      label: "Attendance",
      path: "/attendance",
      description: "Track classes",
    },
    {
      icon: Search,
      label: "Lost & Found",
      path: "/lost-found",
      description: "Find items",
    },
    {
      icon: LogOut,
      label: "Logout",
      path: "/login",
      description: "Logout from your account",
    },
  ]

  return (
    <div className="w-16 bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
      {/* User Avatar */}
      <div className="mb-4">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
          JD
        </div>
      </div>

      {/* Navigation Items */}
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.path}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200",
              isActive
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            )}
            onClick={() => handleMenuClick(item)}
            title={item.label}

          >
            <Icon className="h-5 w-5" />
          </button>
        )
      })}

      {/* Settings at bottom */}
      <div className="flex-1" />
      <button
        className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-all duration-200"
        onClick={() => navigate("/settings")}
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  )
}
