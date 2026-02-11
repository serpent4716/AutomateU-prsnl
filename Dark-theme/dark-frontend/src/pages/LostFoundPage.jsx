"use client"

import { useState } from "react"
import { SidebarNavigation } from "./SidebarNavigation"
import { Search, Plus, MapPin, Calendar, Filter, Heart, MessageCircle, Share2, X } from "lucide-react"
import SpotlightCard from "../components/SpotlightCard/SpotlightCard.jsx"
import "../components/SpotlightCard/SpotlightCard.css"

// Helper for conditional classnames
const cn = (...classes) => classes.filter(Boolean).join(" ")

const initialItems = [
  {
    id: "1",
    title: "iPhone 13 Pro - Blue",
    description: "Lost my blue iPhone 13 Pro near the library. Has a clear case with some stickers.",
    category: "Electronics",
    type: "lost",
    location: "Main Library, 2nd Floor",
    date: "2024-01-15",
    contactInfo: { name: "Sarah Johnson", phone: "+1 (555) 123-4567", email: "sarah.j@email.com" },
    images: ["/placeholder.svg?height=200&width=300"],
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",
    likes: 12,
    comments: 3,
  },
  {
    id: "2",
    title: "Black Leather Wallet",
    description: "Found a black leather wallet in the cafeteria. Contains ID cards and some cash.",
    category: "Personal Items",
    type: "found",
    location: "Student Cafeteria",
    date: "2024-01-14",
    contactInfo: { name: "Mike Chen", phone: "+1 (555) 987-6543", email: "mike.chen@email.com" },
    images: ["/placeholder.svg?height=200&width=300"],
    status: "active",
    createdAt: "2024-01-14T15:20:00Z",
    likes: 8,
    comments: 1,
  },
  {
    id: "3",
    title: "Red Backpack with Books",
    description: "Lost my red Jansport backpack containing textbooks for CS courses.",
    category: "Bags",
    type: "lost",
    location: "Computer Lab - Building A",
    date: "2024-01-13",
    contactInfo: { name: "Alex Rodriguez", phone: "+1 (555) 456-7890", email: "alex.r@email.com" },
    images: ["/placeholder.svg?height=200&width=300"],
    status: "resolved",
    createdAt: "2024-01-13T09:15:00Z",
    likes: 5,
    comments: 2,
  },
]

const categories = ["Electronics", "Personal Items", "Bags", "Clothing", "Books", "Jewelry", "Keys", "Other"]

const animationStyles = `
  @keyframes float-up {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(5deg); }
  }
  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .icon-float:hover {
    animation: float-up 0.6s ease-in-out infinite;
  }
  .icon-spin:hover {
    animation: spin-slow 0.8s linear infinite;
  }
`

export default function LostFoundPage() {
  const [items, setItems] = useState(initialItems)
  const [showAddItem, setShowAddItem] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [likedItems, setLikedItems] = useState(new Set())

  const handleCreateItem = (itemData) => {
    const newItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: "active",
      likes: 0,
      comments: 0,
      images: ["/placeholder.svg?height=200&width=300"],
    }
    setItems((prev) => [newItem, ...prev])
    setShowAddItem(false)
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesTypeFilter = selectedType === "all" || item.type === selectedType

    let matchesTab
    switch (activeTab) {
      case "lost":
        matchesTab = item.type === "lost"
        break
      case "found":
        matchesTab = item.type === "found"
        break
      case "resolved":
        matchesTab = item.status === "resolved"
        break
      default:
        matchesTab = true
    }

    return matchesSearch && matchesCategory && matchesTypeFilter && matchesTab
  })

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const getTimeAgo = (dateString) => {
    const diffInHours = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60))
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")

  const toggleLike = (itemId) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const ItemCard = ({ item }) => (
    <SpotlightCard spotlightColor={item.type === "lost" ? "rgba(239, 68, 68, 0.3)" : "rgba(45, 212, 191, 0.3)"}>
      <div
        className={cn(
          "rounded-2xl overflow-hidden backdrop-blur-sm border transition-all duration-500 hover:scale-105",
          "bg-gradient-to-br from-white/10 to-white/5",
          "border-white/10 hover:border-white/20",
          item.status === "resolved" && "opacity-60",
        )}
      >
        <div className="relative">
          <img src={item.images[0] || "/placeholder.svg"} alt={item.title} className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-lg text-white backdrop-blur-md border",
                item.type === "lost" ? "bg-red-500/80 border-red-400/50" : "bg-teal-500/80 border-teal-400/50",
              )}
            >
              {item.type.toUpperCase()}
            </span>
            {item.status === "resolved" && (
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-500/80 text-white backdrop-blur-md border border-gray-400/50">
                RESOLVED
              </span>
            )}
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white line-clamp-1 tracking-tight">{item.title}</h3>
            <p className="text-sm text-gray-300 line-clamp-2 mt-2 leading-relaxed">{item.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4 flex-shrink-0 text-teal-400" />
            <span className="line-clamp-1">{item.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4 flex-shrink-0 text-teal-400" />
            <span>
              {formatDate(item.date)} • {getTimeAgo(item.createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center font-bold text-white text-xs">
                {getInitials(item.contactInfo.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.contactInfo.name}</p>
                <p className="text-xs text-gray-400">{item.contactInfo.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleLike(item.id)}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  likedItems.has(item.id)
                    ? "text-red-400 bg-red-500/20"
                    : "text-gray-400 hover:text-red-400 hover:bg-red-500/10",
                )}
              >
                <Heart className="h-4 w-4" fill={likedItems.has(item.id) ? "currentColor" : "none"} />
                <span className="sr-only">Like</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-500/10 transition-all duration-200">
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Comment</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-teal-400 rounded-full hover:bg-teal-500/10 transition-all duration-200">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  )

  const CreateItemModal = () => {
    const [formData, setFormData] = useState({
      title: "",
      description: "",
      category: "Other",
      type: "lost",
      location: "",
      date: "",
      contactInfo: { name: "", phone: "", email: "" },
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      handleCreateItem(formData)
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setShowAddItem(false)}
      >
        <div
          className={`
                        relative w-full max-w-2xl max-h-[90vh]
                        transform transition-all duration-300 ease-out
                        shadow-2xl border bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl
                        overflow-hidden flex flex-col
                        border-white/20
                        ${showAddItem ? "scale-100 opacity-100" : "scale-95 opacity-0"}
                    `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Post a New Item</h2>
            <button onClick={() => setShowAddItem(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Item Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Blue iPhone 13 Pro"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details about the item..."
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
                rows="3"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
                >
                  <option value="lost" className="bg-gray-900">
                    Lost Item
                  </option>
                  <option value="found" className="bg-gray-900">
                    Found Item
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where was it lost/found?"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
              <input
                value={formData.contactInfo.name}
                onChange={(e) =>
                  setFormData({ ...formData, contactInfo: { ...formData.contactInfo, name: e.target.value } })
                }
                placeholder="Your full name"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.contactInfo.email}
                onChange={(e) =>
                  setFormData({ ...formData, contactInfo: { ...formData.contactInfo, email: e.target.value } })
                }
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all"
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg text-white font-semibold transition-all duration-200 shadow-lg shadow-teal-500/30 hover:scale-105"
              >
                Post Item
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-black">
      <style>{animationStyles}</style>

      <div className="min-h-screen flex">
        <SidebarNavigation />
        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-1 w-10 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 rounded-full" />
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                      <Search className="h-8 w-8 text-teal-400 icon-spin" />
                      Lost & Found
                    </h1>
                  </div>
                  <p className="text-gray-400 mt-2 text-base">
                    Help reunite lost items with their owners across campus
                  </p>
                </div>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-teal-500/30 hover:scale-105"
                >
                  <Plus className="h-5 w-5" /> Post Item
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-teal-500/5 transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-400 h-5 w-5" />
                    <input
                      placeholder="Search items, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all text-sm font-medium"
                    />
                  </div>
                  <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all font-medium"
                    >
                      <option value="all" className="bg-gray-900">
                        All Types
                      </option>
                      <option value="lost" className="bg-gray-900">
                        Lost
                      </option>
                      <option value="found" className="bg-gray-900">
                        Found
                      </option>
                    </select>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all font-medium"
                    >
                      <option value="all" className="bg-gray-900">
                        All Categories
                      </option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="bg-gray-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button className="h-11 w-11 flex items-center justify-center bg-white/10 hover:bg-teal-500/30 text-teal-400 rounded-lg border border-white/10 hover:border-teal-400/50 transition-all duration-200">
                      <Filter className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex gap-1 border-b border-white/10">
                {["all", "lost", "found", "resolved"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-5 py-3 text-sm font-bold capitalize tracking-wide transition-all duration-200",
                      activeTab === tab
                        ? "border-b-2 border-teal-400 text-teal-400"
                        : "text-gray-400 hover:text-gray-300",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-300 text-lg font-semibold">No items found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>

            {showAddItem && <CreateItemModal />}
          </div>
        </main>
      </div>
    </div>
  )
}
