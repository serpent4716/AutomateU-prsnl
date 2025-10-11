import React, { useState } from "react";
import { SidebarNavigation } from "./SidebarNavigation";
import { Search, Plus, MapPin, Calendar, Phone, Mail, Filter, Heart, MessageCircle, Share2, X } from "lucide-react";

// Helper for conditional classnames
const cn = (...classes) => classes.filter(Boolean).join(' ');

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
];

const categories = ["Electronics", "Personal Items", "Bags", "Clothing", "Books", "Jewelry", "Keys", "Other"];

export default function LostFoundPage() {
    const [items, setItems] = useState(initialItems);
    const [showAddItem, setShowAddItem] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [activeTab, setActiveTab] = useState("all");

    const handleCreateItem = (itemData) => {
        const newItem = {
            ...itemData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            status: "active",
            likes: 0,
            comments: 0,
            images: ["/placeholder.svg?height=200&width=300"], // Default image
        };
        setItems(prev => [newItem, ...prev]);
        setShowAddItem(false);
    };
    
    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        const matchesTypeFilter = selectedType === "all" || item.type === selectedType;
        
        let matchesTab;
        switch(activeTab) {
            case "lost": matchesTab = item.type === "lost"; break;
            case "found": matchesTab = item.type === "found"; break;
            case "resolved": matchesTab = item.status === "resolved"; break;
            default: matchesTab = true;
        }

        return matchesSearch && matchesCategory && matchesTypeFilter && matchesTab;
    });

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
    const getTimeAgo = (dateString) => {
        const diffInHours = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60));
        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };
    
    const getInitials = (name) => name.split(" ").map(n => n[0]).join("");

    const ItemCard = ({ item }) => (
        <div className={cn("rounded-lg border bg-white shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer", item.status === "resolved" && "opacity-75")}>
            <div className="relative">
                <img src={item.images[0]} alt={item.title} className="w-full h-48 object-cover"/>
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={cn("px-2 py-0.5 text-xs font-semibold rounded-full text-white", item.type === "lost" ? "bg-red-500" : "bg-green-500")}>
                        {item.type.toUpperCase()}
                    </span>
                    {item.status === "resolved" && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">RESOLVED</span>}
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
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50"><Heart className="h-4 w-4" /><span className="sr-only">Like</span></button>
                        <button className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-50"><MessageCircle className="h-4 w-4" /><span className="sr-only">Comment</span></button>
                        <button className="p-1.5 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-50"><Share2 className="h-4 w-4" /><span className="sr-only">Share</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
    
    // Simplified Create Item Modal
    const CreateItemModal = () => {
        const [formData, setFormData] = useState({
            title: "", description: "", category: "Other", type: "lost", location: "", date: "",
            contactInfo: { name: "", phone: "", email: "" },
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            handleCreateItem(formData);
        };
        
        return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddItem(false)}>
                    <div
                        className={`
                            relative w-full max-w-3xl max-h-[90vh]
                            transform transition-all duration-200 ease-out
                            shadow-2xl border bg-white rounded-2xl
                            overflow-hidden flex flex-col
                            ${showAddItem ? "scale-100 opacity-100" : "scale-95 opacity-0"}
                        `}
                        onClick={(e) => e.stopPropagation()}
                    >   

                    <div className="p-6 border-b"><h2 className="text-lg font-semibold">Post a New Item</h2></div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Form fields */}
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Item Title" className="w-full h-10 px-3 border rounded-md" required />
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" className="w-full p-3 border rounded-md" rows="3" required />
                        <div className="grid grid-cols-2 gap-4">
                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="h-10 px-3 border rounded-md bg-white">
                                <option value="lost">Lost Item</option>
                                <option value="found">Found Item</option>
                            </select>
                             <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="h-10 px-3 border rounded-md bg-white">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Location" className="w-full h-10 px-3 border rounded-md" required />
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-10 px-3 border rounded-md" required />
                        <input value={formData.contactInfo.name} onChange={e => setFormData({...formData, contactInfo: {...formData.contactInfo, name: e.target.value}})} placeholder="Your Name" className="w-full h-10 px-3 border rounded-md" required />
                        <input value={formData.contactInfo.email} onChange={e => setFormData({...formData, contactInfo: {...formData.contactInfo, email: e.target.value}})} placeholder="Email" className="w-full h-10 px-3 border rounded-md" />
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
            <main className="flex-1 p-6">
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

                    {/* Search and Filters */}
                    <div className="rounded-lg border bg-white shadow-sm mb-6 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input placeholder="Search items, locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-3 border border-gray-300 rounded-md text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm">
                                    <option value="all">All Types</option><option value="lost">Lost</option><option value="found">Found</option>
                                </select>
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm">
                                    <option value="all">All Categories</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <button className="h-10 w-10 flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-md"><Filter className="h-4 w-4" /></button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredItems.length > 0 ? (
                                filteredItems.map(item => <ItemCard key={item.id} item={item} />)
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No items found</p>
                                    <p className="text-gray-400">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {showAddItem && <CreateItemModal />}
                </div>
            </main>
        </div>
    );
}