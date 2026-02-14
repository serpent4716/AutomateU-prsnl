import React, { useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Home,
  MessageCircle,
  Brain,
  CalendarDays,
  Search,
  Settings,
  CheckSquare,
  LogOut,
} from "lucide-react"

import api from "../services/api"

// Utility
function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function SidebarNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const avatarLetter = useMemo(() => {
    try {
      const raw = localStorage.getItem("user")
      if (!raw) return "U"
      const parsed = JSON.parse(raw)
      const name = (parsed?.name || "").trim()
      return name ? name.charAt(0).toUpperCase() : "U"
    } catch {
      return "U"
    }
  }, [])

  const handleMenuClick = async (item) => {
    if (item.label === "Logout") {
      try {
        await api.post("/logout")
        navigate("/login")
      } catch (error) {
        console.error("Logout error:", error)
      }
    } else {
      navigate(item.path)
    }
  }

  const navigationItems = [
    {
      icon: Home,
      label: "Home",
      path: "/dashboard",
      lightActive: "bg-gray-900 text-white",
      darkGradient: "bg-gradient-to-tr from-orange-400 via-pink-400 to-purple-400",
    },
    {
      icon: CheckSquare,
      label: "Tasks",
      path: "/tasks",
      lightActive: "bg-gray-900 text-white",
      darkGradient: "bg-gradient-to-tr from-blue-400 via-cyan-400 to-indigo-400",
    },
    {
      icon: Brain,
      label: "Study Assistant",
      path: "/study-assistant",
      lightActive: "bg-gray-900 text-white",
      darkGradient: "bg-gradient-to-tr from-violet-400 via-purple-400 to-indigo-400",
    },
    {
      icon: CalendarDays,
      label: "Attendance",
      path: "/attendance",
      lightActive: "bg-gray-900 text-white",
      darkGradient: "bg-gradient-to-tr from-teal-400 via-emerald-500 to-lime-500",
    },
    {
      icon: Search,
      label: "Lost & Found",
      path: "/lost-found",
      lightActive: "bg-gray-900 text-white",
      darkGradient: "bg-gradient-to-tr from-teal-500 to-teal-600",
    },
    {
      icon: LogOut,
      label: "Logout",
      path: "/login",
      lightActive: "bg-gray-900 text-white",
      darkGradient: "bg-gradient-to-tr from-rose-500 to-red-500",
    },
  ]

  return (
    <div
      className={cn(
        "w-16 border-r flex flex-col items-center py-4 space-y-2 transition-all duration-200",

        // Light mode
        "bg-gray-100 border-gray-200",

        // Dark mode
        "dark:bg-black/95 dark:border-gray-800 dark:text-gray-300"
      )}
    >
      {/* Avatar */}
      <div className="mb-4">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",

            // Light
            "bg-blue-100 text-blue-600",

            // Dark
            "dark:bg-gray-800 dark:text-white"
          )}
        >
          {avatarLetter}
        </div>
      </div>

      {/* Navigation items */}
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path

        return (
          <button
            key={item.label}
            onClick={() => handleMenuClick(item)}
            title={item.label}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200",

              // Light theme inactive
              !isActive && "text-gray-600 hover:bg-gray-200 hover:text-gray-900",

              // Light theme active
              isActive && item.lightActive,

              // DARK THEME INACTIVE
              "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",

              // DARK THEME ACTIVE (gradient)
              isActive && `dark:${item.darkGradient} dark:text-white shadow-md`
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        )
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <button
        onClick={() => navigate("/settings")}
        title="Settings"
        className={cn(
          "w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200",

          // Light
          "text-gray-600 hover:bg-gray-200 hover:text-gray-900",

          // Dark
          "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        )}
      >
        <Settings className="h-5 w-5" />
      </button>
    </div>
  )
}
