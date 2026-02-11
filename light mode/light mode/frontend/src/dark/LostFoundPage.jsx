"use client"

import { useState, useEffect } from "react"
import { SidebarNavigation } from "./SidebarNavigation"
import { Search, Plus, MapPin, Calendar, Filter, Heart, MessageCircle, Share2, X, CheckCircle, Trash2, AlertCircle } from "lucide-react"
import SpotlightCard from "../components/SpotlightCard/SpotlightCard.jsx"

import api from "../services/api" // <-- backend API service (axios or similar)

/*
  Integrated backend logic (fetch, create (multipart), update, delete)
  while keeping the dark UI intact. Mapping rules described in the message.
*/

const cn = (...classes) => classes.filter(Boolean).join(" ")

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
  // --- State
  const [items, setItems] = useState([]) // backend-driven items
  const [showAddItem, setShowAddItem] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all") // "all" | "lost" | "found"
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updateError, setUpdateError] = useState(null)
  const [selectedTypeForFilter, setSelectedTypeForFilter] = useState("all")

  const categories = ["Electronics", "Personal Items", "Bags", "Clothing", "Books", "Jewelry", "Keys", "Other"]

  // --- Helper: map backend item -> dark UI item model
  const mapBackendItem = (item) => {
    // backend fields: id, title, description, item_type, location, reported_at, reporter_name, photo_path, status
    const backendStatus = (item.status || "").toLowerCase() // 'lost' | 'found' | 'resolved'
    // determine type (lost/found) and status (active/resolved)
    let uiType = "lost"
    if (backendStatus === "lost" || backendStatus === "found") {
      uiType = backendStatus
    } else {
      // fallback: if item_type looks like 'found' or 'lost'
      const guess = (item.item_type || "").toLowerCase()
      uiType = guess === "found" ? "found" : "lost"
    }
    const uiStatus = backendStatus === "resolved" ? "resolved" : "active"

    const imgUrl = item.photo_path
      ? item.photo_path.startsWith("http")
        ? item.photo_path
        : `http://127.0.0.1:8000/${item.photo_path}`
      : "/placeholder.svg?height=200&width=300" // fallback

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.item_type ? (String(item.item_type).charAt(0).toUpperCase() + String(item.item_type).slice(1)) : "Other",
      type: uiType, // lost | found
      location: item.location || "",
      date: item.reported_at ? item.reported_at.split("T")[0] : (item.date || ""),
      contactInfo: { name: item.reporter_name || "Anonymous", phone: item.contact_phone || "", email: item.reporter_email || "" },
      images: [imgUrl],
      status: uiStatus, // active | resolved
      createdAt: item.reported_at || item.createdAt || new Date().toISOString(),
      likes: item.likes || 0,
      comments: item.comments || 0,
    }
  }

  // --- Fetch items on mount
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.get("/lost_and_found_items")
        // assume response.data is an array
        const mapped = response.data.map(mapBackendItem)
        setItems(mapped)
      } catch (err) {
        console.error("Failed to fetch items:", err)
        setError("Could not load items. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchItems()
  }, [])

  // --- Create item (multipart/form-data) and refresh list
  const handleCreateItem = async (itemData, photoFile) => {
    setUpdateError(null)
    const formData = new FormData()
    formData.append("title", itemData.title)
    formData.append("description", itemData.description)
    // itemData.category -> backend's item_type (lowercase)
    formData.append("item_type", (itemData.category || "other").toLowerCase())
    formData.append("location", itemData.location || "")
    formData.append("reporter_name", itemData.contactInfo?.name || "")
    formData.append("status", itemData.type || "lost") // if UI lets user pick lost/found
    if (photoFile) {
      formData.append("photo", photoFile)
    }

    try {
      await api.post("/report_item", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      // refetch items after successful post
      const fetchResponse = await api.get("/lost_and_found_items")
      setItems(fetchResponse.data.map(mapBackendItem))
      setShowAddItem(false)
    } catch (err) {
      console.error("Failed to create item:", err)
      setUpdateError("Failed to post item. Please check the details and try again.")
      setTimeout(() => setUpdateError(null), 5000)
    }
  }

  // --- Update item status (e.g., mark as resolved)
  const handleUpdateStatus = async (itemId, newStatus) => {
    setUpdateError(null)
    try {
      const res = await api.put(`/lost_and_found_items/${itemId}`, { status: newStatus })
      // update local item using response if provided
      const updatedBackend = res.data
      // If backend returns updated object, map it, otherwise optimistic update:
      if (updatedBackend && updatedBackend.id) {
        setItems(prev => prev.map(it => (it.id === updatedBackend.id ? mapBackendItem(updatedBackend) : it)))
      } else {
        // optimistic local update
        setItems(prev => prev.map(it => (it.id === itemId ? { ...it, status: newStatus === "resolved" ? "resolved" : it.status } : it)))
      }
    } catch (err) {
      console.error("Failed to update item status:", err)
      const detail = err.response?.data?.detail || "Failed to update item. Please try again later."
      if (err.response && err.response.status === 403) {
        setUpdateError("You are not authorized to update this item.")
      } else if (err.response && err.response.status === 404) {
        setUpdateError("Item not found. It may have been deleted.")
      } else {
        setUpdateError(detail)
      }
      setTimeout(() => setUpdateError(null), 5000)
    }
  }

  // --- Delete item
  const handleDeleteItem = async (itemId) => {
    setUpdateError(null)
    try {
      await api.delete(`/lost_and_found_items/${itemId}`)
      setItems(prev => prev.filter(it => it.id !== itemId))
    } catch (err) {
      console.error("Failed to delete item:", err)
      const detail = err.response?.data?.detail || "Failed to delete item. Please try again later."
      if (err.response && err.response.status === 403) {
        setUpdateError("You are not authorized to delete this item.")
      } else if (err.response && err.response.status === 404) {
        setUpdateError("Item not found. It may have been deleted.")
      } else {
        setUpdateError(detail)
      }
      setTimeout(() => setUpdateError(null), 5000)
    }
  }

  // --- Filtering logic (preserve dark UI behavior)
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
    if (!dateString) return "Some time ago"
    const diffInHours = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60))
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }
  const getInitials = (name) => (name || "").split(" ").map(n => n[0]).join("")

  // --- Item card uses update/delete handlers
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
          <img src={item.images[0] || "/placeholder.svg"} alt={item.title} className="w-full h-48 object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.svg?height=200&width=300" }} />
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
                onClick={() => {/* placeholder for like action if desired */ }}
                className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-500/10 transition-all duration-200"
                title="Like"
              >
                <Heart className="h-4 w-4" />
                <span className="sr-only">Like</span>
              </button>

              <button className="p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-500/10 transition-all duration-200" title="Comment">
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Comment</span>
              </button>

              <button className="p-2 text-gray-400 hover:text-teal-400 rounded-full hover:bg-teal-500/10 transition-all duration-200" title="Share">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </button>

              {item.status !== "resolved" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, "resolved") }}
                  title="Mark as Resolved"
                  className="p-2 text-gray-400 hover:text-green-400 rounded-full hover:bg-green-500/10 transition-all duration-200"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Mark as Resolved</span>
                </button>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id) }}
                title="Delete Item"
                className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Item</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  )

  // --- Create Item Modal (supports file upload)
  const CreateItemModal = () => {
    const [formData, setFormData] = useState({
      title: "",
      description: "",
      category: "Other",
      type: "lost",
      location: "",
      date: new Date().toISOString().split("T")[0],
      contactInfo: { name: "", phone: "", email: "" },
    })
    const [photoFile, setPhotoFile] = useState(null)

    const handleSubmit = (e) => {
      e.preventDefault()
      const itemDataForApi = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        type: formData.type,
        date: formData.date,
        contactInfo: formData.contactInfo,
      }
      handleCreateItem(itemDataForApi, photoFile)
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddItem(false)}>
        <div className="relative w-full max-w-3xl max-h-[90vh] transform transition-all duration-200 ease-out shadow-2xl border bg-gradient-to-br from-white/10 to-white/5 rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b"><h2 className="text-lg font-semibold text-white">Post a New Item</h2></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Item Title" className="w-full h-10 px-3 border rounded-md bg-white/5 text-white" required />
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description" className="w-full p-3 border rounded-md bg-white/5 text-white" rows="3" required />
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="h-10 px-3 border rounded-md bg-white/5 text-white">
                <option value="lost">Lost Item</option>
                <option value="found">Found Item</option>
              </select>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="h-10 px-3 border rounded-md bg-white/5 text-white">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Location" className="w-full h-10 px-3 border rounded-md bg-white/5 text-white" required />
            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-10 px-3 border rounded-md bg-white/5 text-white" required />
            <div>
              <label className="text-sm font-medium text-gray-300">Photo (Optional)</label>
              <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10" />
            </div>
            <input value={formData.contactInfo.name} onChange={e => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, name: e.target.value } })} placeholder="Your Name" className="w-full h-10 px-3 border rounded-md bg-white/5 text-white" required />
            <input value={formData.contactInfo.email} onChange={e => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, email: e.target.value } })} placeholder="Email (Optional)" type="email" className="w-full h-10 px-3 border rounded-md bg-white/5 text-white" />
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setShowAddItem(false)} className="h-10 px-4 border rounded-md text-white/80">Cancel</button>
              <button type="submit" className="h-10 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-md">Post Item</button>
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

            {updateError && (
              <div className="mb-4 p-3 rounded-md bg-red-900/20 border border-red-800/30 text-red-200 flex justify-between items-center shadow-sm" role="alert">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{updateError}</span>
                </div>
                <button onClick={() => setUpdateError(null)} className="p-1 rounded-full hover:bg-red-800/30" aria-label="Dismiss error">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

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
                      <option value="all">All Types</option>
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all font-medium"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
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
                {isLoading ? (
                  <div className="col-span-full text-center py-12 text-gray-400">Loading items...</div>
                ) : error ? (
                  <div className="col-span-full text-center py-12 text-red-400">{error}</div>
                ) : filteredItems.length > 0 ? (
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
