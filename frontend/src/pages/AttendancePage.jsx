import React, { useState, useEffect, useCallback, useMemo } from "react";
// We will use a mock component at the bottom of this file for now.
import { SidebarNavigation } from "./SidebarNavigation";
import api from "../services/api";

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
    ChevronLeft,
    ChevronRight,
    Loader2,
    TrendingDown,
    Info,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    X,
    LineChart as LineChartIcon, // New Icon for Trend
    Calculator,
    Ban, // Icon for Predictor
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts"; 
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Main Page Component ---
export default function AttendancePage() {
    // --- State Management ---
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [showAddClass, setShowAddClass] = useState(false);
    
    // API-driven state
    const [subjects, setSubjects] = useState([]);
    const [classInstances, setClassInstances] = useState([]);
    const [todaysClasses, setTodaysClasses] = useState([]);
    
    // State for Calendar/Analytics
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [calendarData, setCalendarData] = useState(new Map()); // Use Map
    const [analyticsData, setAnalyticsData] = useState(null);
    
    // Loading states
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);
    const [isInstancesLoading, setIsInstancesLoading] = useState(false);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    
    const [apiError, setApiError] = useState(null);
    const [pendingJobs, setPendingJobs] = useState({});

    // --- Utility Functions ---
    const pollJobStatus = useCallback((jobId, pendingJobKey, onSuccess) => {
        setPendingJobs(prev => ({ ...prev, [pendingJobKey]: true }));
        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/api/attendance/job/status/${jobId}`);
                const job = response.data; // Use .data due to our api wrapper
                if (job.status === "SUCCESS") {
                    clearInterval(interval);
                    setPendingJobs(prev => {
                        const newState = { ...prev };
                        delete newState[pendingJobKey];
                        return newState;
                    });
                    onSuccess();
                } else if (job.status === "FAILURE") {
                    clearInterval(interval);
                    setPendingJobs(prev => {
                        const newState = { ...prev };
                        delete newState[pendingJobKey];
                        return newState;
                    });
                    setApiError(job.error_message || "A background task failed.");
                }
            } catch (error) {
                console.error("Error polling job status:", error);
                setApiError(error.message);
                clearInterval(interval);
                setPendingJobs(prev => {
                    const newState = { ...prev };
                    delete newState[pendingJobKey];
                    return newState;
                });
            }
        }, 2000);
    }, []);

    // --- Data Fetching Functions ---
    const fetchSubjects = useCallback(async () => {
        setIsSubjectsLoading(true);
        try {
            const response = await api.get("/api/subjects");
            setSubjects(response.data); // Use .data
            setApiError(null);
        } catch (error) {
            console.error(error);
            setApiError(error.message);
        } finally {
            setIsSubjectsLoading(false);
        }
    }, []);

    const fetchInstancesForDate = useCallback(async (date, storeIn) => {
        if (storeIn === 'main') setIsInstancesLoading(true);

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        try {
            const response = await api.get("/api/class-instances", {
                params: { target_date: dateStr }
            });
            if (storeIn === 'main') {
                setClassInstances(response.data); // Use .data
            } else if (storeIn === 'today') {
                setTodaysClasses(response.data); // Use .data
            }
            setApiError(null);
        } catch (error) {
            console.error(error);
            setApiError(error.message);
        } finally {
            if (storeIn === 'main') setIsInstancesLoading(false);
        }
    }, []);

    const fetchCalendarData = useCallback(async (date) => {
        setIsCalendarLoading(true);
        try {
            const response = await api.get("/api/calendar-view", {
                params: {
                    month: date.getMonth() + 1,
                    year: date.getFullYear()
                }
            });
            const dataMap = new Map(response.data.map(day => [day.date, day.status])); // Use .data
            setCalendarData(dataMap);
        } catch (error) {
            console.error("Error fetching calendar data:", error);
            setApiError(error.message);
        } finally {
            setIsCalendarLoading(false);
        }
    }, []);

    const fetchAnalyticsData = useCallback(async () => {
        setIsAnalyticsLoading(true);
        try {
            const response = await api.get("/api/analytics-insights");
            setAnalyticsData(response.data); // Use .data
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            setApiError(error.message);
        } finally {
            setIsAnalyticsLoading(false);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
        fetchSubjects();
        fetchInstancesForDate(new Date(), 'today');
    }, [fetchSubjects, fetchInstancesForDate]);

    useEffect(() => {
        if (activeTab === 'mark') {
            fetchInstancesForDate(selectedDate, 'main');
        }
    }, [selectedDate, fetchInstancesForDate, activeTab]);

    // --- Event Handlers ---
    const handleAddSubject = async (newSubjectData) => {
        try {
            await api.post("/api/subjects", newSubjectData);
            fetchSubjects();
            setShowAddSubject(false);
        } catch (error) {
            console.error("Error adding subject:", error);
            setApiError(error.message);
        }
    };

    const handleAddClass = async (newClassData) => {
        const pendingJobKey = `add-class-${Date.now()}`;
        setPendingJobs(prev => ({ ...prev, [pendingJobKey]: true }));
        try {
            const response = await api.post("/api/class-instances", newClassData);
            const data = response.data; // Use .data
            pollJobStatus(data.job.id, pendingJobKey, () => {
                fetchInstancesForDate(selectedDate, 'main');
                const todayStr = new Date().toISOString().split("T")[0];
                if (newClassData.date === todayStr) {
                    fetchInstancesForDate(new Date(), 'today');
                }
                fetchSubjects(); // Refetch subjects *after* stats are updated
            });
            setShowAddClass(false);
        } catch (error) {
            console.error("Error adding class:", error);
            setApiError(error.message);
            setPendingJobs(prev => {
                const newState = { ...prev };
                delete newState[pendingJobKey];
                return newState;
            });
        }
    };
    
    const handleMarkAttendance = async (classInstanceId, newStatus) => {
        const pendingJobKey = classInstanceId;

        const originalInstances = [...classInstances];
        const newInstances = classInstances.map(instance => {
            if (instance.id === classInstanceId) {
                return {
                    ...instance,
                    attendance_record: {
                        ...(instance.attendance_record || {}),
                        status: newStatus,
                        id: instance.attendance_record?.id || -1, 
                        class_instance_id: classInstanceId,
                        created_at: (instance.attendance_record?.created_at || new Date().toISOString())
                    }
                };
            }
            return instance;
        });
        setClassInstances(newInstances);
        setPendingJobs(prev => ({ ...prev, [pendingJobKey]: true }));

        try {
            const response = await api.put(
                `/api/class-instances/${classInstanceId}/attendance`,
                { status: newStatus }
            );
            const data = response.data; // Use .data

            setPendingJobs(prev => {
                const newState = { ...prev };
                delete newState[pendingJobKey];
                return newState;
            });

            pollJobStatus(data.job.id, `silent-job-${data.job.id}`, () => {
                fetchInstancesForDate(selectedDate, 'main');
                
                const todayStr = new Date().toISOString().split("T")[0];
                const instanceDate = originalInstances.find(inst => inst.id === classInstanceId)?.date;
                if (instanceDate === todayStr) {
                    fetchInstancesForDate(new Date(), 'today');
                }
                
                if (activeTab === 'calendar') {
                    fetchCalendarData(calendarMonth);
                }
            });

        } catch (error) {
            console.error("Error marking attendance:", error);
            setApiError(error.message);
            setClassInstances(originalInstances); // Revert on failure
            setPendingJobs(prev => {
                const newState = { ...prev };
                delete newState[pendingJobKey];
                return newState;
            });
        }
    };
    
    const handleTabChange = (tab) => {
        if (tab === 'overview' || tab === 'analytics') {
            fetchSubjects();
        }
        if (tab === 'analytics' && !analyticsData) {
            fetchAnalyticsData();
        }
        if (tab === 'calendar') {
            fetchCalendarData(calendarMonth);
        }
        if (tab === 'mark') {
            fetchInstancesForDate(selectedDate, 'main');
        }
        setActiveTab(tab);
    };

    // --- Computed Data ---
    const overallAttendance = useMemo(() => {
        const totalClasses = subjects.reduce((sum, s) => sum + s.total_classes_held, 0);
        const totalAttended = subjects.reduce((sum, s) => sum + s.total_classes_attended, 0);
        return totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    }, [subjects]);

    const lowAttendanceSubjects = useMemo(() => {
        return subjects.filter(s => s.attendance_percentage < 75);
    }, [subjects]);

    const statCards = [
        { title: "Overall Attendance", value: `${overallAttendance.toFixed(1)}%`, Icon: Target, color: "text-blue-600" },
        { title: "Total Subjects", value: subjects.length, Icon: BookOpen, color: "text-green-600" },
        { title: "Classes Today", value: todaysClasses.length, Icon: Clock, color: "text-orange-600" },
        { title: "Low Attendance", value: lowAttendanceSubjects.length, Icon: AlertTriangle, color: "text-red-600" },
    ];
    
    const renderErrorPopup = () => {
        if (!apiError) return null;
        return (
            <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg motion-safe:animate-bounce">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-600" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800">An Error Occurred</p>
                        <p className="text-sm text-red-700 mt-1">{apiError}</p>
                    </div>
                    <button onClick={() => setApiError(null)} className="text-red-500 hover:text-red-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <SidebarNavigation />

            <main className="flex-1 p-6 md:pl-50">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Attendance Tracker
                            </h1>
                            <p className="text-gray-600 mt-1">Track your class attendance and maintain academic performance</p>
                        </div>
                        <button onClick={() => setShowAddSubject(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors">
                            <Plus className="h-4 w-4" />
                            Add Subject
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="space-y-6">
                        <div className="grid w-full grid-cols-4 border-b">
                            <button onClick={() => handleTabChange('overview')} className={cn("p-3 text-sm font-medium", activeTab === 'overview' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Overview</button>
                            <button onClick={() => handleTabChange('mark')} className={cn("p-3 text-sm font-medium", activeTab === 'mark' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Mark Attendance</button>
                            <button onClick={() => handleTabChange('calendar')} className={cn("p-3 text-sm font-medium", activeTab === 'calendar' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Calendar View</button>
                            <button onClick={() => handleTabChange('analytics')} className={cn("p-3 text-sm font-medium", activeTab === 'analytics' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black')}>Analytics</button>
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
                                                         <p className="text-2xl font-bold text-gray-900">
                                                            {isSubjectsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}
                                                         </p>
                                                     </div>
                                                     <Icon className={cn("h-8 w-8", color)} />
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>

                                 {lowAttendanceSubjects.length > 0 && (
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
                                                 {lowAttendanceSubjects.map((subject) => (
                                                     <div key={subject.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                                         <div>
                                                             <p className="font-medium text-gray-900">{subject.name}</p>
                                                             <p className="text-sm text-gray-600">{subject.code}</p>
                                                         </div>
                                                         <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">{subject.attendance_percentage.toFixed(1)}%</span>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {isSubjectsLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="rounded-lg border bg-white shadow-sm p-6 space-y-4 animate-pulse">
                                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                                <div className="h-8 bg-gray-200 rounded w-full"></div>
                                                <div className="h-12 bg-gray-200 rounded w-full"></div>
                                            </div>
                                        ))
                                     ) : (
                                         subjects.map((subject) => (
                                             <SubjectCard key={subject.id} subject={subject} />
                                         ))
                                     )}
                                 </div>
                             </div>
                        )}

                        {/* Mark Attendance Content */}
                        {activeTab === 'mark' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="rounded-lg border bg-white shadow-sm lg:col-span-1">
                                    <div className="p-6"><h3 className="text-lg font-semibold">Select Date</h3></div>
                                    <div className="p-4 pt-0">
                                        <FullCalendar
                                            selectedDate={selectedDate}
                                            onDateChange={setSelectedDate}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-white shadow-sm lg:col-span-2">
                                    <div className="flex flex-row items-center justify-between p-6">
                                        <h3 className="text-lg font-semibold">{selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
                                        <button onClick={() => setShowAddClass(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input hover:bg-accent">
                                            <Plus className="h-4 w-4" /> Add Class
                                        </button>
                                    </div>
                                    <div className="p-6 pt-0 space-y-4">
                                        {isInstancesLoading ? (
                                            <div className="flex justify-center items-center h-40">
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                            </div>
                                        ) : classInstances.length === 0 ? (
                                            <p className="text-center text-gray-500 py-10">No classes scheduled for this date.</p>
                                        ) : (
                                            classInstances.map((instance) => {
                                                const isJobPending = !!pendingJobs[instance.id];
                                                const attendance = instance.attendance_record;
                                                return (
                                                    <div key={instance.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: instance.subject.color }} />
                                                            <div>
                                                                <p className="font-medium">{instance.subject.name}</p>
                                                                <p className="text-sm text-gray-600">{instance.subject.code} • {new Date(`1970-01-01T${instance.time}Z`).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleMarkAttendance(instance.id, 'present')} 
                                                                disabled={isJobPending}
                                                                className={cn(
                                                                    "inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium h-9 px-3 w-24", 
                                                                    attendance?.status === 'present' ? 'bg-green-600 text-white' : 'border border-input hover:bg-accent',
                                                                    isJobPending && 'opacity-50 cursor-not-allowed'
                                                                )}
                                                            >
                                                                {isJobPending && attendance?.status !== 'present' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Present
                                                            </button>
                                                            <button 
                                                                onClick={() => handleMarkAttendance(instance.id, 'absent')} 
                                                                disabled={isJobPending}
                                                                className={cn(
                                                                    "inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium h-9 px-3 w-24", 
                                                                    attendance?.status === 'absent' ? 'bg-red-600 text-white' : 'border border-input hover:bg-accent',
                                                                    isJobPending && 'opacity-50 cursor-not-allowed'
                                                                )}
                                                            >
                                                                {isJobPending && attendance?.status !== 'absent' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Absent
                                                            </button>
                                                            <button 
                                                                onClick={() => handleMarkAttendance(instance.id, 'cancelled')} 
                                                                disabled={isJobPending}
                                                                className={cn(
                                                                    "inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium h-9 px-3", 
                                                                    attendance?.status === 'cancelled' ? 'bg-gray-500 text-white' : 'border border-input hover:bg-accent',
                                                                    isJobPending && 'opacity-50 cursor-not-allowed'
                                                                )}
                                                                title="Mark as Cancelled"
                                                            >
                                                                {isJobPending && attendance?.status !== 'cancelled' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                        }))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Calendar View Tab */}
                        {activeTab === 'calendar' && (
                            <MonthlyCalendarView
                                data={calendarData}
                                isLoading={isCalendarLoading}
                                currentMonth={calendarMonth}
                                onMonthChange={(newMonth) => {
                                    setCalendarMonth(newMonth);
                                    fetchCalendarData(newMonth);
                                }}
                            />
                        )}

                         {/* Analytics Tab */}
                         {activeTab === 'analytics' && (
                            <AnalyticsInsights
                                subjects={subjects}
                                insights={analyticsData}
                                isSubjectsLoading={isSubjectsLoading}
                                isInsightsLoading={isAnalyticsLoading}
                            />
                        )}
                    </div>
                </div>
            </main>
            
            <AddSubjectModal
                isOpen={showAddSubject}
                onClose={() => setShowAddSubject(false)}
                onAddSubject={handleAddSubject}
            />
            <AddClassModal
                isOpen={showAddClass}
                onClose={() => setShowAddClass(false)}
                onAddClass={handleAddClass}
                subjects={subjects}
                selectedDate={selectedDate}
            />
            {renderErrorPopup()}
        </div>
    );
}

// --- CHILD COMPONENTS ---

function SubjectCard({ subject }) {
    const { 
        name, code, color, total_classes_held, total_classes_attended, 
        attendance_percentage, bunkable_classes_for_75, classes_needed_for_75 
    } = subject;
    
    const percentage = attendance_percentage || 0;
    const isBelow75 = percentage < 75;

    return (
        <div className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            {/* Card Header */}
            <div className="p-6 pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold leading-none tracking-tight">{name}</h3>
                        <p className="text-sm text-gray-600">{code}</p>
                    </div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                </div>
            </div>
            
            {/* Card Body */}
            <div className="p-6 pt-0 space-y-4">
                {/* Attendance Bar */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span>Attendance (Real)</span>
                        <span className={cn("font-medium", !isBelow75 ? "text-green-600" : "text-red-600")}>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={cn("h-2 rounded-full", !isBelow75 ? "bg-green-500" : "bg-red-500")} style={{ width: `${percentage > 100 ? 100 : percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>Present: {total_classes_attended}</span>
                        <span>Total: {total_classes_held}</span>
                    </div>
                </div>
                
                {/* Bunkable Stats */}
                <div className="p-3 rounded-md bg-gray-50 border">
                    {isBelow75 ? (
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Classes to 75%</p>
                                <p className="text-lg font-bold text-green-600">{classes_needed_for_75}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <TrendingDown className="h-6 w-6 text-red-600" />
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Classes to Bunk</p>
                                <p className="text-lg font-bold text-red-600">{bunkable_classes_for_75}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AddSubjectModal({ isOpen, onClose, onAddSubject }) {
    const [newSubject, setNewSubject] = useState({
        name: "",
        code: "",
        color: "#3B82F6",
        schedules: []
    });
    const [scheduleDay, setScheduleDay] = useState("monday");
    const [scheduleTime, setScheduleTime] = useState("09:00");

    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"];
    
    const handleAddSchedule = () => {
        if (scheduleTime) {
            setNewSubject(prev => ({
                ...prev,
                schedules: [...prev.schedules, { day: scheduleDay, time: scheduleTime }]
            }));
        }
    };
    
    const handleSubmit = () => {
        if (!newSubject.name.trim() || !newSubject.code.trim()) return;
        onAddSubject(newSubject);
        // Reset form
        setNewSubject({ name: "", code: "", color: "#3B82F6", schedules: [] });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold">Add New Subject</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="p-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
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
                        <div className="flex flex-wrap gap-2 mt-2">
                            {colors.map((color) => (
                                <button key={color} style={{ backgroundColor: color }} onClick={() => setNewSubject(prev => ({...prev, color}))} className={cn("w-8 h-8 rounded-full border-2", newSubject.color === color ? "border-gray-900 ring-2 ring-offset-1 ring-gray-900" : "border-gray-300")} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Schedule (Optional)</label>
                        <div className="flex gap-2">
                            <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="monday">Monday</option>
                                <option value="tuesday">Tuesday</option>
                                <option value="wednesday">Wednesday</option>
                                <option value="thursday">Thursday</option>
                                <option value="friday">Friday</option>
                                <option value="saturday">Saturday</option>
                                <option value="sunday">Sunday</option>
                            </select>
                            <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            <button onClick={handleAddSchedule} className="h-10 px-3 border rounded-md"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-2 space-y-1">
                            {newSubject.schedules.map((s, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                    <span className="text-sm capitalize">{s.day} at {new Date(`1970-01-01T${s.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button onClick={() => setNewSubject(prev => ({...prev, schedules: prev.schedules.filter((_, idx) => idx !== i)}))}><X className="h-4 w-4 text-gray-500" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={handleSubmit} className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-black text-white hover:bg-gray-800">Add Subject</button>
                </div>
            </div>
        </div>
    );
}

function AddClassModal({ isOpen, onClose, onAddClass, subjects, selectedDate }) {
    const [newClass, setNewClass] = useState({
        subjectId: "",
        time: "09:00",
    });

    const handleSubmit = () => {
        if (!newClass.subjectId || !newClass.time) return;
        onAddClass({
            subject_id: parseInt(newClass.subjectId),
            time: newClass.time,
            date: selectedDate.toISOString().split("T")[0]
        });
        setNewClass({ subjectId: "", time: "09:00" });
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold">Add Class for {selectedDate.toLocaleDateString()}</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="p-6 pt-4 space-y-4">
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
                </div>
                <div className="p-6 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={handleSubmit} className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-black text-white hover:bg-gray-800">Add Class</button>
                </div>
            </div>
        </div>
    );
}

function FullCalendar({ selectedDate, onDateChange }) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
    
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ id: `empty-pre-${i}`, day: null, isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ id: `day-${i}`, day: i, isCurrentMonth: true, date: new Date(year, month, i) });
        }
        const remainingCells = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ id: `empty-post-${i}`, day: null, isCurrentMonth: false });
        }
        return days;
    }, [currentMonth]);

    const changeMonth = (offset) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const isSameDay = (d1, d2) => 
        d1 && d2 &&
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const today = new Date();

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
                <div className="font-semibold text-gray-800">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-500">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {calendarDays.map(({ id, day, isCurrentMonth, date }) => (
                    <button
                        key={id}
                        disabled={!isCurrentMonth}
                        onClick={() => onDateChange(date)}
                        className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-full text-sm transition-colors",
                            !isCurrentMonth && "invisible",
                            isCurrentMonth && "hover:bg-gray-100",
                            isSameDay(date, selectedDate) && "bg-blue-600 text-white hover:bg-blue-700",
                            !isSameDay(date, selectedDate) && isSameDay(date, today) && "text-blue-600 font-bold border border-blue-600",
                            !isSameDay(date, selectedDate) && !isSameDay(date, today) && "text-gray-700"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}

// --- NEW COMPONENT: MonthlyCalendarView ---
function MonthlyCalendarView({ data, isLoading, currentMonth, onMonthChange }) {
    
    const days = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const daysArray = [];
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            daysArray.push({ id: `empty-pre-${i}`, day: null, dateStr: null });
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            daysArray.push({ id: `day-${i}`, day: i, dateStr: dateStr });
        }
        return daysArray;
    }, [currentMonth]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'bg-green-500';
            case 'absent':
                return 'bg-red-500';
            case 'cancelled':
                return 'bg-gray-400';
            default:
                return 'bg-gray-200'; // No record
        }
    };

    return (
        <div className="rounded-lg border bg-white shadow-sm">
            <div className="flex justify-between items-center p-6">
                <h3 className="text-lg font-semibold">Monthly Attendance</h3>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-800">
                        {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
                    <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
                </div>
            </div>
            <div className="p-6 pt-0">
                {isLoading ? (
                    <div className="flex justify-center items-center h-60">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-500">{day}</div>
                        ))}
                        {days.map(({ id, day, dateStr }) => {
                            const status = data.get(dateStr);
                            return (
                                <div
                                    key={id}
                                    className={cn(
                                        "w-full h-16 rounded-md flex items-center justify-center text-sm",
                                        !day && "invisible",
                                        day && getStatusColor(status)
                                    )}
                                    title={dateStr ? `${dateStr}: ${status || 'No classes'}` : ''}
                                >
                                    {day && <span className={cn(status ? "text-white" : "text-gray-600")}>{day}</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-4">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-green-500"></div> Present
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-red-500"></div> Absent
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-gray-400"></div> Cancelled
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-gray-200"></div> No Class
                </div>
            </div>
        </div>
    );
}

// --- NEW COMPONENT: AnalyticsInsights (Now contains Predictor) ---
function AnalyticsInsights({ subjects, insights, isSubjectsLoading, isInsightsLoading }) {
    
    const overallData = useMemo(() => {
        const attended = subjects.reduce((sum, s) => sum + s.total_classes_attended, 0);
        const held = subjects.reduce((sum, s) => sum + s.total_classes_held, 0);
        return [
            { name: 'Attended', value: attended },
            { name: 'Missed', value: Math.max(0, held - attended) }
        ];
    }, [subjects]);

    return (
        <div className="space-y-6">
            
            {/* --- PREDICTOR IS NOW HERE --- */}
            <AttendancePredictor subjects={subjects} isLoading={isSubjectsLoading} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- Chart 1: Existing Pie --- */}
                <div className="rounded-lg border bg-white shadow-sm h-96">
                    <div className="p-6"><h3 className="text-lg font-semibold flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> Overall Breakdown</h3></div>
                    <div className="p-6 pt-0 h-80">
                        {isSubjectsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={overallData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                        <Cell key="attended" fill="#10B981" />
                                        <Cell key="missed" fill="#EF4444" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
                
                {/* --- Chart 2: NEW Day of Week --- */}
                <div className="rounded-lg border bg-white shadow-sm h-96">
                    <div className="p-6"><h3 className="text-lg font-semibold flex items-center gap-2"><BarChartIcon className="h-5 w-5" /> Attendance by Day</h3></div>
                    <div className="p-6 pt-0 h-80">
                        {isInsightsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={insights?.attendance_by_day} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" fontSize={12} />
                                    <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                                    <Legend />
                                    <Bar dataKey="percentage" name="Attendance %" fill="#8B5CF6" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
            
            {/* --- Chart 3: NEW Weekly Trend --- */}
            <div className="rounded-lg border bg-white shadow-sm h-96">
                <div className="p-6"><h3 className="text-lg font-semibold flex items-center gap-2"><LineChartIcon className="h-5 w-5" /> Weekly Trend (Last 12 Weeks)</h3></div>
                <div className="p-6 pt-0 h-80">
                    {isInsightsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={insights?.weekly_trend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week_label" fontSize={12} />
                                <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                                <Legend />
                                <Line type="monotone" dataKey="percentage" name="Attendance %" stroke="#06B6D4" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* --- Chart 4: Existing Subject Bar --- */}
            <div className="rounded-lg border bg-white shadow-sm h-96">
                <div className="p-6"><h3 className="text-lg font-semibold flex items-center gap-2"><BarChartIcon className="h-5 w-5" /> Subject Performance</h3></div>
                <div className="p-6 pt-0 h-80">
                    {isSubjectsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjects} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="code" fontSize={12} />
                                <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                                <Legend />
                                <Bar dataKey="attendance_percentage" name="Attendance %" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- NEW COMPONENT: AttendancePredictor ---
// (This was the "bunkable" calculator)
function AttendancePredictor({ subjects, isLoading }) {
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [remainingClasses, setRemainingClasses] = useState("");

    const calculation = useMemo(() => {
        if (!selectedSubjectId || remainingClasses === "" || remainingClasses < 0) {
            return null;
        }

        const subject = subjects.find(s => s.id === parseInt(selectedSubjectId));
        if (!subject) return null;

        const futureClasses = parseInt(remainingClasses);
        const { total_classes_held, total_classes_attended } = subject;
        const targetPercentage = 0.75;

        const projected_total_held = total_classes_held + futureClasses;
        const min_attended_needed = Math.ceil(projected_total_held * targetPercentage);
        const future_attended_needed = min_attended_needed - total_classes_attended;

        if (future_attended_needed > futureClasses) {
            return {
                canBunk: 0,
                needed: future_attended_needed - futureClasses,
                isImpossible: true,
                finalPercentage: ((total_classes_attended + futureClasses) / projected_total_held) * 100,
                futureClasses: futureClasses
            };
        }
        
        const bunkable = futureClasses - future_attended_needed;
        const final_attended = total_classes_attended + future_attended_needed;
        const finalPercentage = (final_attended / projected_total_held) * 100;

        return {
            canBunk: bunkable,
            needed: 0,
            isImpossible: false,
            finalPercentage: finalPercentage,
            futureClasses: futureClasses
        };

    }, [selectedSubjectId, remainingClasses, subjects]);

    if (isLoading) {
        return (
            <div className="rounded-lg border bg-white shadow-sm p-6">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-white shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight text-gray-900 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    Attendance Goal Calculator
                </h3>
                <p className="text-sm text-gray-600">
                    Find out how many classes you can bunk to stay at 75%.
                </p>
            </div>
            <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* --- Inputs --- */}
                <div className="md:col-span-1">
                    <label htmlFor="subjectSelect" className="block text-sm font-medium text-gray-700 mb-1">
                        1. Select Subject
                    </label>
                    <select
                        id="subjectSelect"
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Select a subject...</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.code}) - {s.attendance_percentage.toFixed(1)}%
                            </option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="remainingClasses" className="block text-sm font-medium text-gray-700 mb-1">
                        2. Classes Remaining (Estimate)
                    </label>
                    <input
                        id="remainingClasses"
                        type="number"
                        min="0"
                        value={remainingClasses}
                        onChange={(e) => setRemainingClasses(e.target.value)}
                        placeholder="e.g., 20"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        disabled={!selectedSubjectId}
                    />
                </div>
                
                {/* --- Result --- */}
                <div className="md:col-span-1 p-4 rounded-md bg-blue-50 border border-blue-200 h-full">
                    <p className="text-sm font-semibold text-blue-800">Your Goal:</p>
                    {calculation ? (
                        calculation.isImpossible ? (
                            <div className="text-center">
                                <p className="text-xl font-bold text-red-600">Impossible</p>
                                <p className="text-xs text-red-600">
                                    Even if you attend all {calculation.futureClasses} classes, your max will be {calculation.finalPercentage.toFixed(1)}%.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-700">{calculation.canBunk}</p>
                                <p className="text-sm text-blue-600">
                                    classes you can bunk (of your {calculation.futureClasses}) to get {calculation.finalPercentage.toFixed(1)}%.
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-gray-500 text-center">Enter data to calculate.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* --- Disclaimer --- */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <p className="text-xs text-gray-500 italic">
                    <Info className="h-3 w-3 inline-block mr-1" />
                    This could be wrong. It is based on the user's input and calculations, but due to holidays or something, could sometime result in wrong counts.
                </p>
            </div>
        </div>
    );
}



