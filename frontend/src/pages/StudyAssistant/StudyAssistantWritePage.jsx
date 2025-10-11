import React, { useState, useEffect } from "react";
import { SidebarNavigation } from "../SidebarNavigation";
import { PenTool, Plus, FileText, Clock, Calendar, Search, Filter } from "lucide-react";

const initialDrafts = [
    {
        id: "1",
        title: "The Impact of Climate Change on Marine Ecosystems",
        content: "Climate change represents one of the most pressing challenges of our time...",
        type: "research",
        status: "in-progress",
        wordCount: 1250,
        createdAt: "2024-01-10",
        lastModified: "2024-01-15",
        subject: "Environmental Science",
    },
    {
        id: "2",
        title: "Analysis of Shakespeare's Hamlet",
        content: "William Shakespeare's Hamlet stands as one of the greatest tragedies in English literature...",
        type: "essay",
        status: "completed",
        wordCount: 2100,
        createdAt: "2024-01-08",
        lastModified: "2024-01-12",
        subject: "English Literature",
    },
    {
        id: "3",
        title: "Machine Learning Applications in Healthcare",
        content: "The integration of machine learning technologies in healthcare has revolutionized...",
        type: "report",
        status: "draft",
        wordCount: 800,
        createdAt: "2024-01-14",
        lastModified: "2024-01-14",
        subject: "Computer Science",
    },
];

export default function StudyAssistantWritePage() {
    const [drafts, setDrafts] = useState(initialDrafts);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [activeTab, setActiveTab] = useState("all");
    const [newDraft, setNewDraft] = useState({
        title: "",
        type: "essay",
        subject: "",
    });

    const handleCreateDraft = () => {
        if (!newDraft.title.trim()) return;
        const draft = {
            id: Date.now().toString(),
            title: newDraft.title,
            content: "",
            type: newDraft.type,
            status: "draft",
            wordCount: 0,
            createdAt: new Date().toISOString().split("T")[0],
            lastModified: new Date().toISOString().split("T")[0],
            subject: newDraft.subject,
        };
        setDrafts((prev) => [draft, ...prev]);
        setNewDraft({ title: "", type: "essay", subject: "" });
        setShowCreateDialog(false);
    };

    const filteredDrafts = drafts.filter((draft) => {
        const matchesSearch =
            draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            draft.subject?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "all" || draft.type === selectedType;
        const matchesStatus = selectedStatus === "all" || draft.status === selectedStatus;
        const matchesTab = activeTab === "all" || (activeTab === "essays" && draft.type === "essay") || (activeTab === "research" && draft.type === "research") || (activeTab === "reports" && draft.type === "report");
        return matchesSearch && matchesType && matchesStatus && matchesTab;
    });

    const getStatusColor = (status) => {
        const colors = {
            draft: "bg-gray-100 text-gray-800 border-gray-200",
            "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
            completed: "bg-green-100 text-green-800 border-green-200",
        };
        return colors[status] || colors.draft;
    };

    const getTypeColor = (type) => {
        const colors = {
            essay: "bg-purple-100 text-purple-800 border-purple-200",
            research: "bg-blue-100 text-blue-800 border-blue-200",
            report: "bg-green-100 text-green-800 border-green-200",
            other: "bg-orange-100 text-orange-800 border-orange-200",
        };
        return colors[type] || colors.other;
    };
    
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

    const draftsByType = (type) => drafts.filter((draft) => draft.type === type).length;
    const completedDrafts = drafts.filter((draft) => draft.status === "completed").length;
    
    const DraftCard = ({ draft }) => (
         <div className="rounded-lg border-2 border-gray-100 hover:border-gray-200 transition-colors cursor-pointer bg-white shadow-sm">
            <div className="p-6 pb-3">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold leading-tight line-clamp-2">{draft.title}</h3>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${getTypeColor(draft.type)}`}>{draft.type}</span>
                        <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(draft.status)}`}>{draft.status.replace("-", " ")}</span>
                    </div>
                </div>
            </div>
            <div className="p-6 pt-0">
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{draft.content || "No content yet..."}</p>
                <div className="space-y-2 text-sm text-gray-500">
                    {draft.subject && <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>{draft.subject}</span></div>}
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>{draft.wordCount} words</span></div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Created {formatDate(draft.createdAt)}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>Modified {formatDate(draft.lastModified)}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="w-full inline-flex items-center justify-center h-9 px-3 rounded-xl text-sm font-medium border border-input bg-transparent hover:bg-accent">Continue Writing</button>
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="min-h-screen bg-white flex">
            <SidebarNavigation />

            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><PenTool className="h-5 w-5 text-indigo-600" /></div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">Write</h1>
                                    <p className="text-gray-600">Create and manage your essays and research papers</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreateDialog(true)} className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-sm font-medium">
                                <Plus className="h-4 w-4" /> New Draft
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="border-2 border-gray-100 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-gray-900">{drafts.length}</div><div className="text-sm text-gray-600">Total Drafts</div></div>
                            <div className="border-2 border-purple-100 bg-purple-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-purple-600">{draftsByType("essay")}</div><div className="text-sm text-purple-600">Essays</div></div>
                            <div className="border-2 border-blue-100 bg-blue-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-blue-600">{draftsByType("research")}</div><div className="text-sm text-blue-600">Research</div></div>
                            <div className="border-2 border-green-100 bg-green-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-green-600">{completedDrafts}</div><div className="text-sm text-green-600">Completed</div></div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex gap-4 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input placeholder="Search drafts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full h-10 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:bg-white focus:border-gray-300" />
                            </div>
                            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="h-10 px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm">
                                <option value="all">All Types</option><option value="essay">Essays</option><option value="research">Research</option><option value="report">Reports</option><option value="other">Other</option>
                            </select>
                            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-10 px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm">
                                <option value="all">All Status</option><option value="draft">Draft</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                            </select>
                            <button className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 border border-input bg-transparent rounded-xl text-sm font-medium hover:bg-accent"><Filter className="h-4 w-4" /> Filter</button>
                        </div>
                    </div>

                    {/* Tabs & Content */}
                    <div className="space-y-6">
                        <div className="grid w-full grid-cols-4 max-w-md border-b">
                            {["all", "essays", "research", "reports"].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`p-3 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDrafts.length > 0 ? (
                                filteredDrafts.map(draft => <DraftCard key={draft.id} draft={draft} />)
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <PenTool className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No drafts found</h3>
                                    <p className="text-gray-600">Create your first draft to get started.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Draft Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreateDialog(false)}>
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6"><h2 className="text-lg font-semibold">Create New Draft</h2></div>
                        <div className="p-6 pt-0 space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input id="title" value={newDraft.title} onChange={(e) => setNewDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Enter draft title..." className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm" />
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select value={newDraft.type} onChange={(e) => setNewDraft(prev => ({ ...prev, type: e.target.value }))} className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm bg-white">
                                    <option value="essay">Essay</option><option value="research">Research Paper</option><option value="report">Report</option><option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
                                <input id="subject" value={newDraft.subject} onChange={(e) => setNewDraft(prev => ({ ...prev, subject: e.target.value }))} placeholder="e.g., English Literature" className="w-full h-10 px-3 py-2 border border-input rounded-md text-sm" />
                            </div>
                            <button onClick={handleCreateDraft} className="w-full h-10 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md text-sm font-medium">Create Draft</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}