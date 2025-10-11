import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNavigation } from './SidebarNavigation';
import { CheckSquare, Plus, Search, Filter, BarChart3, Users, X, Calendar, Clock, AlertTriangle, Trash } from 'lucide-react';
import api from '../services/api';

function TasksPageContent({ user }) {
    const [tasks, setTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [newTeamName, setNewTeamName] = useState("");
    const [joinTeamId, setJoinTeamId] = useState("");

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [draggedTask, setDraggedTask] = useState(null);
    const [error, setError] = useState(null); 
    
    const [showStats, setShowStats] = useState(false);
    const [showTeamManager, setShowTeamManager] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const userMap = useMemo(() => {
        const tempUsers = [{id: user.id, name: user.name}]; 
        const map = new Map();
        tempUsers.forEach(u => u && map.set(u.id, u));
        return map;
    }, [user]);

    // --- THE FIX: This useEffect now depends on the `user` prop ---
    // It will only run AFTER App.js has confirmed the user session is valid.
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await api.get("/tasks");
                setTasks(response.data.map(task => ({ ...task, tags: task.tags || [] })));
            } catch (err) {
                console.error("Failed to fetch tasks:", err);
                setError("Could not load tasks.");
                setTimeout(() => setError(null), 3000);
            }
        };

        const fetchTeams = async () => {
            try {
                const response = await api.get("/teams"); 
                setTeams(response.data);
            } catch (err) {
                console.error("Failed to fetch teams:", err);
            }
        };

        // This check ensures we only fetch data when we have a valid user object.
        if (user) {
            fetchTasks();
            fetchTeams();
            
        }
    }, [user]); // The dependency array now correctly waits for the user prop.

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        try {
            const response = await api.post("/teams", { name: newTeamName });
            setTeams(prev => [...prev, response.data]);
            setNewTeamName("");
        } catch (err) {
            console.error("Failed to create team:", err);
            setError(err.response?.data?.detail || "Failed to create team.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        if (!joinTeamId.trim()) return;
        try {
            await api.post(`/teams/${joinTeamId}/join`);
            const response = await api.get("/teams"); // Refetch teams after joining
            setTeams(response.data);
            setJoinTeamId("");
        } catch (err) {
            console.error("Failed to join team:", err);
            setError(err.response?.data?.detail || "Failed to join team.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            const response = await api.post("/tasks", taskData);
            setTasks(prev => [...prev, { ...response.data, tags: response.data.tags || [] }]);
            setShowCreateDialog(false);
        } catch (err) {
            console.error("Failed to create task:", err);
            setError("Failed to create task. Please try again.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        const originalTasks = [...tasks];
        const taskToUpdate = tasks.find(task => task.id === taskId);
        if (!taskToUpdate) return;

        const updatedTask = { ...taskToUpdate, ...updates };
        setTasks(prev => prev.map(task => (task.id === taskId ? updatedTask : task)));

        const payload = {
            title: updatedTask.title,
            desc: updatedTask.desc,
            due_date: updatedTask.due_date,
            status: updatedTask.status,
            priority: updatedTask.priority,
            tags: updatedTask.tags,
            estimated_hours: updatedTask.estimated_hours,
            team_id: updatedTask.team_id,
        };

        try {
            await api.put(`/tasks/${taskId}`, payload);
            if (editingTask) setEditingTask(null); 
        } catch (err) {
            console.error("Failed to update task:", err);
            setError("Failed to update task. Please try again.");
            setTimeout(() => setError(null), 3000);
            setTasks(originalTasks);
        }
    };

    const handleDeleteTask = async (taskId) => {
        const originalTasks = [...tasks];
        setTasks(prev => prev.filter(task => task.id !== taskId));
        try {
            await api.delete(`/tasks/${taskId}`);
        } catch (err) {
            console.error("Failed to delete task:", err);
            setError("Failed to delete task. Please try again.");
            setTimeout(() => setError(null), 3000);
            setTasks(originalTasks);
        }
    };
    
    const handleDrop = (newStatus) => {
        if (draggedTask && draggedTask.status !== newStatus) {
            handleUpdateTask(draggedTask.id, { status: newStatus });
        }
        setDraggedTask(null);
    };

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const totalTasks = filteredTasks.length;
    const incolmpletedTasks = filteredTasks.filter(t => t.status === "todo").length;
    const completedTasks = filteredTasks.filter(t => t.status === "done").length;
    const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress").length;
    const overdueTasks = filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const statsList = [
        { title: "Total Tasks", value: totalTasks, icon: CheckSquare, color: "text-blue-600" },
        {title: "Incomplete", value: incolmpletedTasks, icon: AlertTriangle, color: "text-gray-600" },
        { title: "Completed", value: completedTasks, icon: CheckSquare, color: "text-green-600" },
        { title: "In Progress", value: inProgressTasks, icon: Clock, color: "text-yellow-600" },
        { title: "Overdue", value: overdueTasks, icon: AlertTriangle, color: "text-red-600" },
    ];

    const columns = [
        { status: "todo", title: "To Do", color: "bg-gray-100" },
        { status: "in_progress", title: "In Progress", color: "bg-blue-100" },
        { status: "done", title: "Done", color: "bg-green-100" },
        // { status: "notes", title: "Notes", color: "bg-yellow-100" },
    ];
    
    const priorityColors = {
        low: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-red-100 text-red-800",
    };
    const getInitials = (name) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase() : '?';

    return (
        <div className="min-h-screen bg-white flex">
            <SidebarNavigation />
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div className="mb-8">
                         <div className="flex items-center justify-between mb-6">
                             <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Task Manager</h1>
                                <p className="text-gray-600">Organize and track your team's work</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowStats(!showStats)} className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border h-10 px-4 py-2">
                                    <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                                </button>
                                <button onClick={() => setShowCreateDialog(true)} className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-black text-white h-10 px-4 py-2">
                                    <Plus className="h-4 w-4 mr-2" /> New Task
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex h-10 w-full rounded-md border bg-gray-50 pl-10 px-3 py-2 text-sm"/>
                            </div>
                            <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border h-10 px-4 py-2">
                                <Filter className="h-4 w-4 mr-2" /> Filter
                            </button>
                        </div>
                    </div>
                    
                    {showStats && (
                         <div className="mb-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Analytics & Team Management</h2>
                                <button onClick={() => setShowTeamManager(!showTeamManager)} className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border h-10 px-4 py-2">
                                    <Users className="h-4 w-4 mr-2" /> Manage Team
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {statsList.map((stat) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div key={stat.title} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                                    </div>
                                                    <Icon className={`h-8 w-8 ${stat.color}`} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                                     <h3 className="text-lg font-semibold leading-none tracking-tight mb-4">Project Progress</h3>
                                     <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Completion Rate</span>
                                            <span>{completionRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                             <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {showTeamManager && (
                                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                                    <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 mb-4">
                                        <Users className="h-5 w-5" /> Team Management
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <form onSubmit={handleCreateTeam} className="space-y-2 p-4 bg-gray-50 rounded-xl">
                                            <h4 className="font-medium">Create a New Team</h4>
                                            <input placeholder="New team name..." value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="h-10 w-full rounded-md border px-3 py-2 text-sm"/>
                                            <button type="submit" className="w-full h-10 px-4 py-2 bg-black text-white rounded-md">Create Team</button>
                                        </form>
                                        <form onSubmit={handleJoinTeam} className="space-y-2 p-4 bg-gray-50 rounded-xl">
                                            <h4 className="font-medium">Join an Existing Team</h4>
                                            <input type="number" placeholder="Enter team ID to join..." value={joinTeamId} onChange={(e) => setJoinTeamId(e.target.value)} className="h-10 w-full rounded-md border px-3 py-2 text-sm"/>
                                            <button type="submit" className="w-full h-10 px-4 py-2 bg-blue-600 text-white rounded-md">Join Team</button>
                                        </form>
                                    </div>
                                    <div className="mt-6">
                                        <h4 className="font-medium mb-2">Your Teams</h4>
                                        <div className="space-y-2">
                                            {teams.map(team => (
                                                <div key={team.id} className="flex items-center justify-between p-2 border rounded-lg">
                                                    <span>{team.name}</span>
                                                    <span className="text-sm text-gray-500">ID: {team.id}</span>
                                                </div>
                                            ))}
                                            {teams.length === 0 && <p className="text-sm text-gray-500">You are not part of any teams yet.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {columns.map((column) => (
                        
                            <div 
                                key={column.status}
                                className={`${column.color} rounded-lg p-4 min-h-[500px]`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(column.status)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-800">{column.title}</h3>
                                    <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">{filteredTasks.filter(t => t.status === column.status).length}</span>
                                </div>
                                {filteredTasks.filter(t => t.status === column.status).map((task) => (
                                    <div 
                                        key={task.id}
                                        draggable
                                        onDragStart={() => setDraggedTask(task)}
                                        className="rounded-lg bg-white shadow p-4 cursor-pointer mb-4"
                                        onClick={() => setEditingTask(task)}
                                    >
                                       <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-gray-500 hover:text-red-600"><Trash className="h-4 w-4"/></button>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.desc}</p>
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                                            {task.tags.map(tag => <span key={tag} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border text-gray-600">{tag}</span>)}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            {task.due_date && <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span>{new Date(task.due_date).toLocaleDateString()}</span></div>}
                                            {task.estimated_hours && <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{task.estimated_hours}h</span></div>}
                                            <div title={userMap.get(task.user_id)?.name || 'Unknown'}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs">{getInitials(userMap.get(task.user_id)?.name)}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {(showCreateDialog || editingTask) && 
                        <TaskDialog 
                            task={editingTask}
                            onClose={() => { setShowCreateDialog(false); setEditingTask(null); }}
                            onSave={editingTask ? (updates) => handleUpdateTask(editingTask.id, updates) : handleCreateTask}
                        />
                    }
                </div>
            </main>
        </div>
    );
}

function TaskDialog({ task, onClose, onSave }) {
    const isEditing = !!task;
    const [formData, setFormData] = useState({
        title: task?.title || "",
        desc: task?.desc || "",
        status: task?.status || "todo",
        priority: task?.priority || "medium",
        due_date: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
        estimated_hours: task?.estimated_hours || "",
        tags: task?.tags || [],
        team_id: task?.team_id || "",
    });
    const [newTag, setNewTag] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours, 10) : null,
            team_id: formData.team_id ? parseInt(formData.team_id, 10) : null,
            due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        };
        onSave(payload);
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/60" onClick={onClose}>
            <div className={`
                    relative flex flex-col w-full max-w-lg max-h-[90vh]
                    bg-white shadow-2xl border rounded-2xl overflow-hidden
                    transform transition-all duration-200 ease-out
                    `}
                    onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">{isEditing ? "Edit Task" : "Create New Task"}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="h-5 w-5 text-gray-600" /></button>
                </div>
                <form id="task-dialog-form" onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input id="title" value={formData.title} onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" required/>
                        </div>
                        <div>
                            <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea id="desc" value={formData.desc} onChange={(e) => setFormData(prev => ({...prev, desc: e.target.value}))} className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select id="status" value={formData.status} onChange={(e) => setFormData(prev => ({...prev, status: e.target.value}))} className="h-10 w-full rounded-md border px-3 py-2 text-sm">
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="done">Done</option>
                                    {/* <option value="notes">Notes</option>  */}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select id="priority" value={formData.priority} onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value}))} className="h-10 w-full rounded-md border px-3 py-2 text-sm">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input type="date" id="due_date" value={formData.due_date} onChange={(e) => setFormData(prev => ({...prev, due_date: e.target.value}))} className="h-10 w-full rounded-md border px-3 py-2 text-sm"/>
                            </div>
                             <div>
                                <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                                <input type="number" id="estimated_hours" value={formData.estimated_hours} onChange={(e) => setFormData(prev => ({...prev, estimated_hours: e.target.value}))} className="h-10 w-full rounded-md border px-3 py-2 text-sm"/>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                            <div className="flex gap-2">
                                <input id="tags" value={newTag} onChange={(e) => setNewTag(e.target.value)} className="h-10 w-full rounded-md border px-3 py-2 text-sm"/>
                                <button type="button" onClick={addTag} className="h-10 px-4 py-2 border rounded-md">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {formData.tags.map(tag => <span key={tag} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-gray-100">{tag}<X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} /></span>)}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="h-10 px-4 py-2 border rounded-md">Cancel</button>
                        <button type="submit" form="task-dialog-form" className="h-10 px-4 py-2 bg-black text-white rounded-md">{isEditing ? "Save Changes" : "Create Task"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TasksPage({ user }) {
    if (!user) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    return <TasksPageContent user={user} />;
}

