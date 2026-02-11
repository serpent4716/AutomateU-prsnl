import React, { useState, useEffect } from "react";
import api from "../services/api";
import SidebarWrapper from "../wrapper/SidebarWrapper";
import { Search, Plus, MapPin, Calendar, Filter, Heart, MessageCircle, Share2, CheckCircle, Trash2, AlertCircle, X } from "lucide-react";
import { SidebarNavigation } from "./SidebarNavigation";
// Helper for conditional classnames
const cn = (...classes) => classes.filter(Boolean).join(' ');

// List of Types, kept on the frontend for filtering UI
const types = ["Electronics", "Personal Items", "Bags", "Clothing", "Books", "Jewelry", "Keys", "Others"];

export default function LostFoundPage() {
    // State Management
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateError, setUpdateError] = useState(null); // For update/delete errors
    const [showAddItem, setShowAddItem] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [activeTab, setActiveTab] = useState("all");

    // Fetch items from the backend when the component mounts
    useEffect(() => {
        const fetchItems = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await api.get("/lost_and_found_items");
                // Map backend response to the frontend's expected data structure
                const mappedItems = response.data.map(item => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    type: item.item_type || "Other", // 'item_type' from backend maps to 'type' in frontend
                    location: item.location,
                    date: item.reported_at, // Use 'reported_at' for display date
                    contactInfo: { name: item.reporter_name || "Anonymous", phone: "", email: "" },
                    // Prepend your backend URL to the image path if it's relative
                    images: [item.photo_path ? `http://127.0.0.1:8000/${item.photo_path}` : "https://placehold.co/300x200/e2e8f0/64748b?text=No+Image"],
                    status: item.status,
                    createdAt: item.reported_at,
                    likes: item.likes || 0, // Default to 0 as it's not in the backend schema
                    comments: item.comments || 0, // Default to 0
                }));
                setItems(mappedItems);
            } catch (err) {
                console.error("Failed to fetch items:", err);
                setError("Could not load items. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Handle creating a new item and posting to the backend
    const handleCreateItem = async (itemData, photoFile) => {
        const formData = new FormData();
        // Append form fields for the multipart/form-data request
        formData.append("title", itemData.title);
        formData.append("description", itemData.description);
        formData.append("item_type", itemData.type.toLowerCase()); // 'type' from form maps to 'item_type'
        formData.append("location", itemData.location);
        formData.append("reporter_name", itemData.contactInfo.name);
        formData.append("status", itemData.status); // Use status from form


        if (photoFile) {
            formData.append("photo", photoFile);
        }

        try {
            await api.post("/report_item", formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Refetch all items to show the new one
            const fetchResponse = await api.get("/lost_and_found_items");
            setItems(fetchResponse.data.map(item => ({ // Re-map the data
                id: item.id,
                title: item.title,
                description: item.description,
                type: item.item_type,
                location: item.location,
                date: item.reported_at,
                contactInfo: { name: item.reporter_name || "Anonymous" },
                images: [item.photo_path ? `http://127.0.0.1:8000/${item.photo_path}` : `https://placehold.co/300x200/e2e8f0/64748b?text=No+Image`],
                status: item.status,
                createdAt: item.reported_at,
                likes: item.likes || 0,
                comments: item.comments || 0,
            })));
            setShowAddItem(false);
        } catch (err) {
            console.error("Failed to create item:", err);
            // You should use a modal or a toast notification here instead of alert
            setUpdateError("Failed to post item. Please check the details and try again.");
            setTimeout(() => setUpdateError(null), 5000);
        }
    };

    // NEW: Handle updating item status to "resolved"
    const handleUpdateStatus = async (itemId, newStatus) => {
        setUpdateError(null); // Clear previous errors
        try {
            const response = await api.put(`/lost_and_found_items/${itemId}`, {
                status: newStatus,
            });

            // Update the item in the local state
            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemId ? { ...item, status: response.data.status } : item
                )
            );
        } catch (err) {
            console.error("Failed to update item status:", err);
            const detail = err.response?.data?.detail || "Failed to update item. Please try again later.";
            if (err.response && err.response.status === 403) {
                setUpdateError("You are not authorized to update this item.");
            } else if (err.response && err.response.status === 404) {
                setUpdateError("Item not found. It may have been deleted.");
            } else {
                setUpdateError(detail);
            }
            // Automatically clear the error after 5 seconds
            setTimeout(() => setUpdateError(null), 5000);
        }
    };

    // NEW: Handle deleting an item
    const handleDeleteItem = async (itemId) => {
        setUpdateError(null);
        // Using console.log as a stand-in for a real confirmation modal
        // In a real app, you'd use a custom modal here, not window.confirm
        console.log("Delete confirmation requested for item " + itemId + ". Skipping modal for this environment.");
        // const isConfirmed = true; // Simulating confirmation

        // if (isConfirmed) { // Uncomment this block when you have a custom modal
        try {
            await api.delete(`/lost_and_found_items/${itemId}`);

            // Remove the item from the local state
            setItems(prevItems =>
                prevItems.filter(item => item.id !== itemId)
            );
        } catch (err) {
            console.error("Failed to delete item:", err);
            const detail = err.response?.data?.detail || "Failed to delete item. Please try again later.";
            if (err.response && err.response.status === 403) {
                setUpdateError("You are not authorized to delete this item.");
            } else if (err.response && err.response.status === 404) {
                setUpdateError("Item not found. It may have been deleted.");
            } else {
                setUpdateError(detail);
            }
            // Automatically clear the error after 5 seconds
            setTimeout(() => setUpdateError(null), 5000);
        }
        // }
    };

    // Filtering logic remains on the client-side for responsiveness
    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.location.toLowerCase().includes(searchQuery.toLowerCase());

        // Handle 'type' being undefined or null
        const itemType = item.type || "other";
        const matchesType = selectedType === "all" || itemType.toLowerCase() === selectedType.toLowerCase();

        const matchesStatusFilter = selectedStatus === "all" || item.status === selectedStatus;

        let matchesTab;
        switch (activeTab) {
            case "lost": matchesTab = item.status === "lost"; break;
            case "found": matchesTab = item.status === "found"; break;
            case "resolved": matchesTab = item.status === "resolved"; break;
            default: matchesTab = true;
        }

        return matchesSearch && matchesType && matchesStatusFilter && matchesTab;
    });

    // Helper functions remain the same
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
    const getTimeAgo = (dateString) => {
        if (!dateString) return "Some time ago";
        const diffInHours = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60));
        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };
    const getInitials = (name) => (name || "").split(" ").map(n => n[0]).join("");

    // ItemCard component now includes onUpdateStatus and onDeleteItem props
    const ItemCard = ({ item, onUpdateStatus, onDeleteItem }) => (
        <div className={cn("rounded-lg border bg-white shadow-sm overflow-hidden hover:shadow-lg transition-shadow", item.status === "resolved" && "opacity-100")}>
            <div className="relative">
                <div className="flex justify-center items-center bg-gray-50">
                    <img src={item.images[0]} alt={item.title} className="w-full h-60 object-contain p-2" onError={(e) => e.currentTarget.src = 'https://placehold.co/300x200/e2e8f0/64748b?text=Image+Not+Found'} />
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-full text-white", item.status === "lost" ? "bg-red-500" : item.status === "found" ? "bg-yellow-500" : "bg-green-500")}>
                        {item.status.toUpperCase()}
                    </span>
                    {/* This is redundant given the check above, but keeping from original
                    {item.status === "resolved" && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500">RESOLVED</span>} */}
                </div>
            </div>
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500"><MapPin className="h-4 w-4 flex-shrink-0" /><span className="line-clamp-1">{item.location}</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-500"><Calendar className="h-4 w-4 flex-shrink-0" /><span>{formatDate(item.date)} • {getTimeAgo(item.createdAt)}</span></div>
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs">{getInitials(item.contactInfo.name)}</div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{item.contactInfo.name}</p>
                        </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50"><Heart className="h-4 w-4" /><span className="sr-only">Like</span></button>
                        <button className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-50"><MessageCircle className="h-4 w-4" /><span className="sr-only">Comment</span></button>
                        <button className="p-1.5 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-50"><Share2 className="h-4 w-4" /><span className="sr-only">Share</span></button>

                        {/* --- NEW BUTTONS --- */}
                        {item.status !== 'resolved' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onUpdateStatus(item.id, 'resolved'); }}
                                title="Mark as Resolved"
                                className="p-1.5 text-gray-500 hover:text-green-600 rounded-full hover:bg-green-50"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Mark as Resolved</span>
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                            title="Delete Item"
                            className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Item</span>
                        </button>
                        {/* --- END NEW BUTTONS --- */}
                    </div>
                </div>
            </div>
        </div>
    );

    // Create Item Modal now handles file input
    const CreateItemModal = () => {
        const [formData, setFormData] = useState({
            title: "", description: "", type: "Electronics", status: "lost", location: "", date: new Date().toISOString().split('T')[0], // Default to today
            contactInfo: { name: "", phone: "", email: "" },
        });
        const [photoFile, setPhotoFile] = useState(null);

        const handleSubmit = (e) => {
            e.preventDefault();
            // Pass the correct form data to the handler
            const itemDataForApi = {
                title: formData.title,
                description: formData.description,
                type: formData.type, // This is the item category
                location: formData.location,
                date: formData.date,
                contactInfo: formData.contactInfo,
                status: formData.status // This is 'lost' or 'found'
            };
            handleCreateItem(itemDataForApi, photoFile);
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddItem(false)}>
                <div className="relative w-full max-w-3xl max-h-[90vh] transform transition-all duration-200 ease-out shadow-2xl border bg-white rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 border-b"><h2 className="text-lg font-semibold">Post a New Item</h2></div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Form fields */}
                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Item Title" className="w-full h-10 px-3 border rounded-md" required />
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description" className="w-full p-3 border rounded-md" rows="3" required />
                        <div className="grid grid-cols-2 gap-4">
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="h-10 px-3 border rounded-md bg-white">
                                <option value="lost">Lost Item</option>
                                <option value="found">Found Item</option>
                            </select>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="h-10 px-3 border rounded-md bg-white">
                                {types.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Location" className="w-full h-10 px-3 border rounded-md" required />
                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-10 px-3 border rounded-md" required />
                        {/* New file input for photo */}
                        <div>
                            <label className="text-sm font-medium text-gray-700">Photo (Optional)</label>
                            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                        </div>
                        <input value={formData.contactInfo.name} onChange={e => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, name: e.target.value } })} placeholder="Your Name" className="w-full h-10 px-3 border rounded-md" required />
                        <input value={formData.contactInfo.email} onChange={e => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, email: e.target.value } })} placeholder="Email (Optional)" type="email" className="w-full h-10 px-3 border rounded-md" />
                        <div className="flex justify-end gap-2 pt-4">
                            <button type="button" onClick={() => setShowAddItem(false)} className="h-10 px-4 border rounded-md">Cancel</button>
                            <button type="submit" className="h-10 px-4 bg-black text-white rounded-md">Post Item</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <SidebarNavigation />
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Search className="h-8 w-8 text-blue-600" />Lost & Found</h1>
                            <p className="text-gray-600 mt-1">Help reunite lost items with their owners</p>
                        </div>
                        <button onClick={() => setShowAddItem(true)} className="flex items-center gap-2 h-10 px-4 bg-black hover:bg-gray-800 text-white rounded-md text-sm font-medium">
                            <Plus className="h-4 w-4" /> Post Item
                        </button>
                    </div>

                    {/* --- NEW ERROR DISPLAY --- */}
                    {updateError && (
                        <div className="mb-4 p-3 rounded-md bg-red-100 border border-red-200 text-red-800 flex justify-between items-center shadow-sm" role="alert">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span>{updateError}</span>
                            </div>
                            <button onClick={() => setUpdateError(null)} className="p-1 rounded-full hover:bg-red-200" aria-label="Dismiss error">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Search and Filters */}
                    <div className="rounded-lg border bg-white shadow-sm mb-6 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input placeholder="Search items, locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-3 border border-gray-300 rounded-md text-sm" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm">
                                    <option value="all">All Status</option><option value="lost">Lost</option><option value="found">Found</option><option value="resolved">Resolved</option>
                                </select>
                                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm">
                                    <option value="all">All Types</option>
                                    {types.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                                </select>
                                <button className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-md"><Filter className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs & Content */}
                    <div className="space-y-6">
                        <div className="grid w-full grid-cols-4 border-b">
                            {["all", "lost", "found", "resolved"].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`p-3 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        {/* Conditional rendering for loading, error, and no items found states */}
                        {isLoading ? (
                            <div className="col-span-full text-center py-12 text-gray-500">Loading items...</div>
                        ) : error ? (
                            <div className="col-span-full text-center py-12 text-red-500">{error}</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map(item => <ItemCard key={item.id} item={item} onUpdateStatus={handleUpdateStatus} onDeleteItem={handleDeleteItem} />)
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">No items found</p>
                                        <p className="text-gray-400">Try adjusting your search or filters</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {showAddItem && <CreateItemModal />}
                </div>
            </main>
        </div>
    );
}

