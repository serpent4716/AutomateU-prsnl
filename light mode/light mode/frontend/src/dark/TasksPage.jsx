"use client"

import { useState, useMemo, useEffect } from "react"
import { SidebarNavigation } from "./SidebarNavigation"
import {
  CheckSquare,
  Plus,
  Search,
  BarChart3,
  Users,
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Trash,
  GripVertical,
  Bell,
} from "lucide-react"
import Spline from "@splinetool/react-spline"
import api from "../services/api" // <-- backend service

const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do.",
  "Every small step forward is progress. Keep pushing!",
  "Your potential is limitless. Believe in yourself.",
  "Focus on today's tasks and conquer your goals.",
  "Success is the sum of small efforts. You've got this!",
  "Today is the perfect day to accomplish something great.",
  "Innovation comes from dedication and hard work.",
  "Don't wait for opportunity, create it yourself.",
  "You're stronger than you think. Keep going!",
  "Creativity thrives when you're focused and determined.",
]

function TasksPageContent({ user }) {
  // --- State (kept identical to dark UI)
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [newTeamName, setNewTeamName] = useState("")
  const [joinTeamId, setJoinTeamId] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [error, setError] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [showTeamManager, setShowTeamManager] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // --- Use real user mapping (per your confirmation) instead of mock users
  const userMap = useMemo(() => {
    const tempUsers = [{ id: user.id, name: user.name }]
    const map = new Map()
    tempUsers.forEach((u) => u && map.set(u.id, u))
    return map
  }, [user])

  // animation styles left unchanged
  const animationStyles = `
      @keyframes float-up {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      @keyframes pulse-soft {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      @keyframes blob-bounce {
        0%, 100% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(10px, -15px) scale(1.08); }
        50% { transform: translate(-8px, 10px) scale(0.98); }
        75% { transform: translate(12px, -8px) scale(1.05); }
      }
      @keyframes fade-in-out {
        0% { opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { opacity: 0; }
      }
      .icon-float:hover {
        animation: float-up 0.6s ease-in-out infinite;
      }
      .quote-pulse {
        animation: fade-in-out 5s ease-in-out infinite;
      }
      .blob-hover:hover .blob-animate {
        animation: blob-bounce 0.8s ease-in-out infinite;
      }
    `

  // --------------------------
  // Backend integration here
  // --------------------------
  useEffect(() => {
    // Fetch tasks & teams when user is available
    const fetchTasks = async () => {
      try {
        const response = await api.get("/tasks")
        // ensure tags exist
        setTasks(response.data.map((task) => ({ ...task, tags: task.tags || [] })))
      } catch (err) {
        console.error("Failed to fetch tasks:", err)
        setError("Could not load tasks.")
        setTimeout(() => setError(null), 3000)
      }
    }

    const fetchTeams = async () => {
      try {
        const response = await api.get("/teams")
        setTeams(response.data)
      } catch (err) {
        console.error("Failed to fetch teams:", err)
      }
    }

    if (user) {
      fetchTasks()
      fetchTeams()
    }
  }, [user])

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    try {
      const response = await api.post("/teams", { name: newTeamName })
      setTeams((prev) => [...prev, response.data])
      setNewTeamName("")
    } catch (err) {
      console.error("Failed to create team:", err)
      setError(err.response?.data?.detail || "Failed to create team.")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleJoinTeam = async (e) => {
    e.preventDefault()
    if (!joinTeamId.trim()) return
    try {
      await api.post(`/teams/${joinTeamId}/join`)
      const response = await api.get("/teams")
      setTeams(response.data)
      setJoinTeamId("")
    } catch (err) {
      console.error("Failed to join team:", err)
      setError(err.response?.data?.detail || "Failed to join team.")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleCreateTask = async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData)
      setTasks((prev) => [...prev, { ...response.data, tags: response.data.tags || [] }])
      setShowCreateDialog(false)
    } catch (err) {
      console.error("Failed to create task:", err)
      setError("Failed to create task. Please try again.")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleUpdateTask = async (taskId, updates) => {
    const originalTasks = [...tasks]
    const taskToUpdate = tasks.find((task) => task.id === taskId)
    if (!taskToUpdate) return

    const updatedTask = { ...taskToUpdate, ...updates }
    setTasks((prev) => prev.map((task) => (task.id === taskId ? updatedTask : task)))

    const payload = {
      title: updatedTask.title,
      desc: updatedTask.desc,
      due_date: updatedTask.due_date,
      status: updatedTask.status,
      priority: updatedTask.priority,
      tags: updatedTask.tags,
      estimated_hours: updatedTask.estimated_hours,
      team_id: updatedTask.team_id,
    }

    try {
      await api.put(`/tasks/${taskId}`, payload)
      if (editingTask) setEditingTask(null)
    } catch (err) {
      console.error("Failed to update task:", err)
      setError("Failed to update task. Please try again.")
      setTimeout(() => setError(null), 3000)
      setTasks(originalTasks)
    }
  }

  const handleDeleteTask = async (taskId) => {
    const originalTasks = [...tasks]
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    try {
      await api.delete(`/tasks/${taskId}`)
    } catch (err) {
      console.error("Failed to delete task:", err)
      setError("Failed to delete task. Please try again.")
      setTimeout(() => setError(null), 3000)
      setTasks(originalTasks)
    }
  }

  const handleDrop = (newStatus) => {
    if (draggedTask && draggedTask.status !== newStatus) {
      handleUpdateTask(draggedTask.id, { status: newStatus })
    }
    setDraggedTask(null)
  }

  // --------------------------
  // End backend integration
  // --------------------------

  const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const totalTasks = filteredTasks.length
  const incompleteTasks = filteredTasks.filter((t) => t.status === "todo").length
  const completedTasks = filteredTasks.filter((t) => t.status === "done").length
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress").length
  const overdueTasks = filteredTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const statsList = [
    { title: "Total Tasks", value: totalTasks, icon: CheckSquare, color: "text-blue-400" },
    { title: "Incomplete", value: incompleteTasks, icon: AlertTriangle, color: "text-gray-400" },
    { title: "Completed", value: completedTasks, icon: CheckSquare, color: "text-green-400" },
    { title: "In Progress", value: inProgressTasks, icon: Clock, color: "text-amber-400" },
    { title: "Overdue", value: overdueTasks, icon: AlertTriangle, color: "text-red-400" },
  ]

  const columns = [
    {
      status: "todo",
      title: "To Do",
      gradient: "from-blue-600 to-cyan-600",
      accent: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    {
      status: "in_progress",
      title: "In Progress",
      gradient: "from-purple-600 to-pink-600",
      accent: "from-purple-500 to-pink-500",
      bgLight: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
    {
      status: "done",
      title: "Done",
      gradient: "from-green-600 to-emerald-600",
      accent: "from-green-500 to-emerald-500",
      bgLight: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  ]

  const priorityColors = {
    low: "bg-green-500/20 text-green-300 border border-green-500/30",
    medium: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    high: "bg-red-500/20 text-red-300 border border-red-500/30",
  }

  const getInitials = (name) =>
    name
      ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
      : "?"

  return (
    <div className="min-h-screen bg-black font-sans overflow-hidden">
      <style>{animationStyles}</style>

      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl -z-10 opacity-30" />
      <div className="fixed bottom-32 right-32 w-64 h-64 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-full blur-3xl -z-10 opacity-20" />

      <div className="min-h-screen flex">
        <SidebarNavigation />

        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-4">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {totalTasks > 0 && (
              <div className="mb-6 backdrop-blur-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-200">
                  You have <span className="font-bold text-blue-300">{incompleteTasks} incomplete</span> tasks,{" "}
                  <span className="font-bold text-amber-300">{inProgressTasks} in progress</span>, and{" "}
                  <span className="font-bold text-green-300">{completedTasks} completed</span>.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Task Manager</h1>
                <p className="text-gray-400 text-sm">Organize and track your team's work seamlessly</p>
                <div className="h-1 w-16 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 rounded-full mt-2" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 h-10 px-4 py-2 text-white transition-all duration-300"
                >
                  <BarChart3 className="h-4 w-4" /> Analytics
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 h-10 px-4 py-2 text-white transition-all duration-300"
                >
                  <Plus className="h-4 w-4" /> New Task
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="relative max-w-md">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 px-4 py-3 hover:border-white/20 transition-all duration-300">
                  <Search className="text-orange-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full bg-transparent focus:outline-none text-sm text-gray-200 placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="relative mb-8 backdrop-blur-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-white/10 rounded-xl p-5 overflow-hidden blob-hover">
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl blob-animate opacity-50" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                <div className="hidden lg:flex items-center justify-center h-32 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10">
                  <Spline scene="https://prod.spline.design/sFVNZmY5tr8VKMry/scene.splinecode" />
                </div>

                <div className="lg:col-span-2 flex flex-col justify-center">
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Today's Motivation</p>
                  <p className="text-base lg:text-lg text-white font-figtree font-semibold quote-pulse leading-relaxed min-h-[24px]">
                    {MOTIVATIONAL_QUOTES[currentQuoteIndex]}
                  </p>
                </div>
              </div>
            </div>

            {showStats && (
              <div className="mb-8 space-y-6">
                <h2 className="text-lg font-semibold text-white">Analytics & Team Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {statsList.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div
                        key={stat.title}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-400">{stat.title}</p>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-orange-400" /> Team Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleCreateTeam} className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <h4 className="font-medium text-white">Create a New Team</h4>
                      <input
                        placeholder="Team name..."
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20"
                      />
                      <button type="submit" className="w-full h-10 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-md text-sm font-medium">
                        Create Team
                      </button>
                    </form>
                    <form onSubmit={handleJoinTeam} className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <h4 className="font-medium text-white">Join an Existing Team</h4>
                      <input
                        type="number"
                        placeholder="Team ID..."
                        value={joinTeamId}
                        onChange={(e) => setJoinTeamId(e.target.value)}
                        className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20"
                      />
                      <button type="submit" className="w-full h-10 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-md text-sm font-medium">
                        Join Team
                      </button>
                    </form>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-medium text-white mb-3">Your Teams</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teams.map((team) => (
                        <div key={team.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
                          <span className="text-white text-sm">{team.name}</span>
                          <span className="text-xs text-gray-500">ID: {team.id}</span>
                        </div>
                      ))}
                      {teams.length === 0 && <p className="text-sm text-gray-400">No teams yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => (
                <div key={column.status} className="flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-2 w-12 bg-gradient-to-r ${column.accent} rounded-full`} />
                      <h3 className="font-bold text-white text-lg">{column.title}</h3>
                      <span className="ml-auto backdrop-blur-xl bg-white/10 px-3 py-1 rounded-full text-sm font-medium text-gray-300 border border-white/5">
                        {filteredTasks.filter((t) => t.status === column.status).length}
                      </span>
                    </div>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(column.status)}
                    className={`flex-1 backdrop-blur-2xl ${column.bgLight} border ${column.borderColor} rounded-xl p-4 min-h-[500px] hover:border-white/40 transition-all duration-300 space-y-3`}
                  >
                    {filteredTasks
                      .filter((t) => t.status === column.status)
                      .map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggedTask(task)}
                          onClick={() => setEditingTask(task)}
                          className={`backdrop-blur-xl bg-gradient-to-br ${column.gradient}/20 border ${column.borderColor} rounded-lg p-4 hover:border-white/40 hover:bg-gradient-to-br hover:${column.gradient}/30 transition-all duration-300 cursor-grab active:cursor-grabbing group shadow-lg hover:shadow-xl`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <GripVertical className="h-4 w-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{task.title}</h4>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTask(task.id)
                              }}
                              className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-300 mb-3 ml-7 line-clamp-2">{task.desc}</p>
                          <div className="flex flex-wrap gap-2 mb-3 ml-7">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                            {task.tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-400 ml-7">
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                            {task.estimated_hours && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {task.estimated_hours}h
                              </div>
                            )}
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 text-white text-xs font-bold">
                              {getInitials(userMap.get(task.user_id)?.name)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {(showCreateDialog || editingTask) && (
              <TaskDialog
                task={editingTask}
                onClose={() => {
                  setShowCreateDialog(false)
                  setEditingTask(null)
                }}
                onSave={editingTask ? (updates) => handleUpdateTask(editingTask.id, updates) : handleCreateTask}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function TaskDialog({ task, onClose, onSave }) {
  const isEditing = !!task
  const [formData, setFormData] = useState({
    title: task?.title || "",
    desc: task?.desc || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    due_date: task?.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
    estimated_hours: task?.estimated_hours || "",
    tags: task?.tags || [],
    team_id: task?.team_id || "",
  })
  const [newTag, setNewTag] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      estimated_hours: formData.estimated_hours ? Number.parseInt(formData.estimated_hours, 10) : null,
      team_id: formData.team_id ? Number.parseInt(formData.team_id, 10) : null,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    }
    onSave(payload)
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }))
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/60" onClick={onClose}>
      <div
        className="relative flex flex-col w-full max-w-lg max-h-[90vh] bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl border border-white/10 rounded-2xl overflow-hidden transform transition-all duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">{isEditing ? "Edit Task" : "Create New Task"}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <form id="task-dialog-form" onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="flex h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20"
                required
              />
            </div>
            <div>
              <label htmlFor="desc" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="desc"
                value={formData.desc}
                onChange={(e) => setFormData((prev) => ({ ...prev, desc: e.target.value }))}
                className="min-h-[80px] w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-white/20"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                  className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-white/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                  className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-300 mb-2">
                  Hours
                </label>
                <input
                  type="number"
                  id="estimated_hours"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estimated_hours: e.target.value }))}
                  className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/20"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="h-10 px-4 rounded-md bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-400" onClick={() => removeTag(tag)} />
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label htmlFor="team_id" className="block text-sm font-medium text-gray-300 mb-2">
                  Team ID
                </label>
                <input
                  type="number"
                  id="team_id"
                  value={formData.team_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, team_id: e.target.value }))}
                  className="h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium">
              Cancel
            </button>
            <button type="submit" className="h-10 px-4 rounded-md bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-sm font-medium">
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Export expects `user` prop now — keeps UI unchanged. This follows the light-mode pattern. See sources. :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}
export default function TasksPage({ user }) {
  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }
  return <TasksPageContent user={user} />
}
