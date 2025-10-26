import React, { useState } from "react";
import { SidebarNavigation } from "./SidebarNavigation";
import {
    CalendarDays,
    Plus,
    CheckCircle,
    XCircle,
    TrendingUp,
    AlertTriangle,
    BookOpen,
    Clock,
    Target,
} from "lucide-react";

// Helper for conditional classnames
const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [showAddClass, setShowAddClass] = useState(false);
    const [newSubject, setNewSubject] = useState({
        name: "",
        code: "",
        color: "#3B82F6",
    });
    const [newClass, setNewClass] = useState({
        subjectId: "",
        time: "",
    });

    const [subjects, setSubjects] = useState([
        {
            id: "1",
            name: "Data Structures & Algorithms",
            code: "CS301",
            color: "#3B82F6",
            totalClasses: 45,
            attendedClasses: 38,
            schedule: [
                { day: "Monday", time: "09:00 AM" },
                { day: "Wednesday", time: "11:00 AM" },
                { day: "Friday", time: "02:00 PM" },
            ],
        },
        {
            id: "2",
            name: "Database Management Systems",
            code: "CS302",
            color: "#10B981",
            totalClasses: 40,
            attendedClasses: 35,
            schedule: [
                { day: "Tuesday", time: "10:00 AM" },
                { day: "Thursday", time: "01:00 PM" },
            ],
        },
        {
            id: "3",
            name: "Operating Systems",
            code: "CS303",
            color: "#F59E0B",
            totalClasses: 42,
            attendedClasses: 30,
            schedule: [
                { day: "Monday", time: "02:00 PM" },
                { day: "Wednesday", time: "03:00 PM" },
            ],
        },
    ]);

    const [attendanceRecords, setAttendanceRecords] = useState([
        { id: "1", subjectId: "1", date: "2024-01-15", status: "present" },
        { id: "2", subjectId: "2", date: "2024-01-15", status: "present" },
        { id: "3", subjectId: "1", date: "2024-01-14", status: "absent" },
        { id: "4", subjectId: "3", date: "2024-01-14", status: "present" },
    ]);

    const [scheduledClasses, setScheduledClasses] = useState([]);

    const handleAddSubject = () => {
        if (!newSubject.name.trim() || !newSubject.code.trim()) return;
        const subject = {
            id: Date.now().toString(),
            name: newSubject.name,
            code: newSubject.code,
            color: newSubject.color,
            totalClasses: 0,
            attendedClasses: 0,
            schedule: [],
        };
        setSubjects((prev) => [...prev, subject]);
        setNewSubject({ name: "", code: "", color: "#3B82F6" });
        setShowAddSubject(false);
    };

    const handleAddClass = () => {
        if (!newClass.subjectId || !newClass.time) return;
        const scheduledClass = {
            id: Date.now().toString(),
            subjectId: newClass.subjectId,
            date: selectedDate.toISOString().split("T")[0],
            time: newClass.time,
        };
        setScheduledClasses((prev) => [...prev, scheduledClass]);
        setNewClass({ subjectId: "", time: "" });
        setShowAddClass(false);
    };
    
    const handleMarkAttendance = (subjectId, status) => {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const existingRecord = attendanceRecords.find((record) => record.subjectId === subjectId && record.date === dateStr);

        if (existingRecord) {
            setAttendanceRecords((prev) =>
                prev.map((record) => (record.id === existingRecord.id ? { ...record, status } : record))
            );
        } else {
            const newRecord = {
                id: Date.now().toString(),
                subjectId,
                date: dateStr,
                status,
            };
            setAttendanceRecords((prev) => [...prev, newRecord]);
        }

        setSubjects((prev) =>
            prev.map((subject) => {
                if (subject.id === subjectId) {
                    const wasPresent = existingRecord?.status === "present";
                    const isPresent = status === "present";
                    let attendedClasses = subject.attendedClasses;
                    let totalClasses = subject.totalClasses;

                    if (!existingRecord) {
                        totalClasses += 1;
                        if (isPresent) attendedClasses += 1;
                    } else {
                        if (wasPresent && !isPresent) attendedClasses -= 1;
                        if (!wasPresent && isPresent) attendedClasses += 1;
                    }
                    return { ...subject, totalClasses, attendedClasses };
                }
                return subject;
            })
        );
    };

    const getAttendanceForDate = (subjectId, date) => {
        const dateStr = date.toISOString().split("T")[0];
        return attendanceRecords.find((record) => record.subjectId === subjectId && record.date === dateStr);
    };

    const getScheduledClassesForDate = (date) => {
        const dateStr = date.toISOString().split("T")[0];
        return scheduledClasses.filter((cls) => cls.date === dateStr);
    };

    const getAttendancePercentage = (subject) => {
        return subject.totalClasses > 0 ? (subject.attendedClasses / subject.totalClasses) * 100 : 0;
    };
    
    const getOverallAttendance = () => {
        const totalClasses = subjects.reduce((sum, subject) => sum + subject.totalClasses, 0);
        const totalAttended = subjects.reduce((sum, subject) => sum + subject.attendedClasses, 0);
        return totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    };
    
    const getLowAttendanceSubjects = () => {
        return subjects.filter((subject) => getAttendancePercentage(subject) < 75);
    };

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"];
    
    const statCards = [
        { title: "Overall Attendance", value: `${getOverallAttendance().toFixed(1)}%`, Icon: Target, color: "text-blue-600" },
        { title: "Total Subjects", value: subjects.length, Icon: BookOpen, color: "text-green-600" },
        { title: "Classes Today", value: getScheduledClassesForDate(new Date()).length, Icon: Clock, color: "text-orange-600" },
        { title: "Low Attendance", value: getLowAttendanceSubjects().length, Icon: AlertTriangle, color: "text-red-600" },
    ];
    
    const renderSimpleCalendar = () => {
        // This is a simplified representation. A real calendar is much more complex.
        return (
            <div className="p-4 border rounded-md">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>{"<"}</button>
                    <div className="font-bold">{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>{">"}</button>
                </div>
                 <div className="text-center text-gray-500 py-8">
                     <CalendarDays className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                     <p>Selected: {selectedDate.toLocaleDateString()}</p>
                     <p className="text-xs mt-2">Use an input for specific date selection:</p>
                     <input 
                        type="date"
                        value={selectedDate.toISOString().split("T")[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="mt-2 p-1 border rounded"
                     />
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <SidebarNavigation />

            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <CalendarDays className="h-8 w-8 text-blue-600" />
                                Attendance Tracker
                            </h1>
                            <p className="text-gray-600 mt-1">Track your class attendance and maintain academic performance</p>
                        </div>
                        <button onClick={() => setShowAddSubject(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-black text-white hover:bg-gray-800">
                            <Plus className="h-4 w-4" />
                            Add Subject
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="space-y-6">
                        <div className="grid w-full grid-cols-4 border-b">
                            <button onClick={() => setActiveTab('overview')} className={cn("p-3 text-sm font-medium", activeTab === 'overview' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Overview</button>
                            <button onClick={() => setActiveTab('mark')} className={cn("p-3 text-sm font-medium", activeTab === 'mark' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Mark Attendance</button>
                            <button onClick={() => setActiveTab('calendar')} className={cn("p-3 text-sm font-medium", activeTab === 'calendar' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Calendar View</button>
                            <button onClick={() => setActiveTab('analytics')} className={cn("p-3 text-sm font-medium", activeTab === 'analytics' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Analytics</button>
                        </div>
                        
                        {/* Overview Content */}
                        {activeTab === 'overview' && (
                             <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                     {statCards.map(({title, value, Icon, color}) => (
                                        <div key={title} className="rounded-lg border bg-white shadow-sm">
                                             <div className="p-4">
                                                 <div className="flex items-center justify-between">
                                                     <div>
                                                         <p className="text-sm font-medium text-gray-600">{title}</p>
                                                         <p className="text-2xl font-bold text-gray-900">{value}</p>
                                                     </div>
                                                     <Icon className={cn("h-8 w-8", color)} />
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>

                                 {getLowAttendanceSubjects().length > 0 && (
                                     <div className="rounded-lg border border-red-200 bg-red-50">
                                         <div className="flex flex-col space-y-1.5 p-6">
                                             <h3 className="text-lg font-semibold leading-none tracking-tight text-red-800 flex items-center gap-2">
                                                 <AlertTriangle className="h-5 w-5" />
                                                 Low Attendance Alert
                                             </h3>
                                         </div>
                                         <div className="p-6 pt-0">
                                             <p className="text-red-700 mb-3">The following subjects have attendance below 75%:</p>
                                             <div className="space-y-2">
                                                 {getLowAttendanceSubjects().map((subject) => (
                                                     <div key={subject.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                                         <div>
                                                             <p className="font-medium text-gray-900">{subject.name}</p>
                                                             <p className="text-sm text-gray-600">{subject.code}</p>
                                                         </div>
                                                         <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">{getAttendancePercentage(subject).toFixed(1)}%</span>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {subjects.map((subject) => {
                                         const percentage = getAttendancePercentage(subject);
                                         return (
                                             <div key={subject.id} className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                                                 <div className="p-6 pb-3">
                                                     <div className="flex items-center justify-between">
                                                         <div>
                                                             <h3 className="text-lg font-semibold leading-none tracking-tight">{subject.name}</h3>
                                                             <p className="text-sm text-gray-600">{subject.code}</p>
                                                         </div>
                                                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                                                     </div>
                                                 </div>
                                                 <div className="p-6 pt-0 space-y-4">
                                                     <div>
                                                         <div className="flex justify-between text-sm mb-2">
                                                             <span>Attendance</span>
                                                             <span className={cn("font-medium", percentage >= 75 ? "text-green-600" : "text-red-600")}>{percentage.toFixed(1)}%</span>
                                                         </div>
                                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                                             <div className={cn("h-2 rounded-full", percentage >= 75 ? "bg-green-500" : "bg-red-500")} style={{ width: `${percentage}%` }}></div>
                                                          </div>
                                                     </div>
                                                     <div className="flex justify-between text-sm text-gray-600">
                                                         <span>Present: {subject.attendedClasses}</span>
                                                         <span>Total: {subject.totalClasses}</span>
                                                     </div>
                                                     <div className="space-y-1">
                                                         <p className="text-sm font-medium text-gray-700">Schedule:</p>
                                                         {subject.schedule.map((s, index) => <p key={index} className="text-xs text-gray-600">{s.day} - {s.time}</p>)}
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                        )}

                        {/* Mark Attendance Content */}
                        {activeTab === 'mark' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="rounded-lg border bg-white shadow-sm">
                                    <div className="p-6"><h3 className="text-lg font-semibold">Select Date</h3></div>
                                    <div className="p-6 pt-0 flex justify-center">{renderSimpleCalendar()}</div>
                                </div>
                                <div className="rounded-lg border bg-white shadow-sm">
                                    <div className="flex flex-row items-center justify-between p-6">
                                        <h3 className="text-lg font-semibold">{selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
                                        <button onClick={() => setShowAddClass(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input hover:bg-accent">
                                            <Plus className="h-4 w-4" /> Add Class
                                        </button>
                                    </div>
                                    <div className="p-6 pt-0 space-y-4">
                                        {(getScheduledClassesForDate(selectedDate).length > 0 ? getScheduledClassesForDate(selectedDate) : subjects.map(s => ({...s, id: s.id, subjectId: s.id, time: 'Any Time'})))
                                            .map((item) => {
                                                const subject = subjects.find(s => s.id === item.subjectId);
                                                if (!subject) return null;
                                                const attendance = getAttendanceForDate(subject.id, selectedDate);
                                                return (
                                                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                                                            <div>
                                                                <p className="font-medium">{subject.name}</p>
                                                                <p className="text-sm text-gray-600">{subject.code} • {item.time}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleMarkAttendance(subject.id, 'present')} className={cn("inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium h-9 px-3", attendance?.status === 'present' ? 'bg-green-600 text-white' : 'border border-input hover:bg-accent')}>
                                                                <CheckCircle className="h-4 w-4" /> Present
                                                            </button>
                                                            <button onClick={() => handleMarkAttendance(subject.id, 'absent')} className={cn("inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium h-9 px-3", attendance?.status === 'absent' ? 'bg-red-600 text-white' : 'border border-input hover:bg-accent')}>
                                                                <XCircle className="h-4 w-4" /> Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Other Tabs Placeholder */}
                        {activeTab === 'calendar' && (
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="p-6"><h3 className="text-lg font-semibold">Attendance Calendar</h3></div>
                                <div className="p-6 pt-0">
                                    <div className="text-center text-gray-500 py-12">
                                        <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                        <p>Calendar view with attendance visualization coming soon!</p>
                                        <p className="text-sm">This will show your attendance patterns over time</p>
                                    </div>
                                </div>
                            </div>
                        )}
                         {activeTab === 'analytics' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="rounded-lg border bg-white shadow-sm">
                                   <div className="p-6"><h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Attendance Trends</h3></div>
                                   <div className="p-6 pt-0">
                                       <div className="text-center text-gray-500 py-8">
                                           <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                           <p>Attendance trends chart coming soon!</p>
                                       </div>
                                   </div>
                               </div>
                               <div className="rounded-lg border bg-white shadow-sm">
                                   <div className="p-6"><h3 className="text-lg font-semibold">Subject Performance</h3></div>
                                   <div className="p-6 pt-0 space-y-4">
                                       {subjects.map((subject) => {
                                           const percentage = getAttendancePercentage(subject);
                                           return (
                                                <div key={subject.id} className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">{subject.name}</span>
                                                        <span className={cn("text-sm font-medium", percentage >= 75 ? "text-green-600" : "text-red-600")}>{percentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                         <div className={cn("h-2 rounded-full", percentage >= 75 ? "bg-green-500" : "bg-red-500")} style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           </div>
                        )}
                    </div>
                </div>
            </main>
            
            {/* Add Subject Dialog */}
            {showAddSubject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddSubject(false)}>
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h2 className="text-lg font-semibold">Add New Subject</h2>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <div>
                                <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                                <input id="subjectName" value={newSubject.name} onChange={(e) => setNewSubject(prev => ({...prev, name: e.target.value}))} placeholder="e.g., Data Structures" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                                <input id="subjectCode" value={newSubject.code} onChange={(e) => setNewSubject(prev => ({...prev, code: e.target.value}))} placeholder="e.g., CS301" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <div className="flex gap-2 mt-2">
                                    {colors.map((color) => (
                                        <button key={color} style={{ backgroundColor: color }} onClick={() => setNewSubject(prev => ({...prev, color}))} className={cn("w-8 h-8 rounded-full border-2", newSubject.color === color ? "border-gray-900" : "border-gray-300")} />
                                    ))}
                                </div>
                            </div>
                             <button onClick={handleAddSubject} className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-black text-white hover:bg-gray-800">Add Subject</button>
                        </div>
                    </div>
                </div>
            )}
            
             {/* Add Class Dialog */}
             {showAddClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddClass(false)}>
                    <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6"><h2 className="text-lg font-semibold">Add Class for {selectedDate.toLocaleDateString()}</h2></div>
                        <div className="p-6 pt-0 space-y-4">
                            <div>
                                <label htmlFor="classSubject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select value={newClass.subjectId} onChange={(e) => setNewClass(prev => ({...prev, subjectId: e.target.value}))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Select subject</option>
                                    {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="classTime" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input id="classTime" type="time" value={newClass.time} onChange={(e) => setNewClass(prev => ({...prev, time: e.target.value}))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>
                            <button onClick={handleAddClass} className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-black text-white hover:bg-gray-800">Add Class</button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
}