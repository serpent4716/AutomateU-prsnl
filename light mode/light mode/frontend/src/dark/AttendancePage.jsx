import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SidebarNavigation } from "./SidebarNavigation";
import api from "../services/api";

import { CalendarDays, Plus, CheckCircle, XCircle, TrendingUp, AlertTriangle, BookOpen, Clock, Target, ChevronLeft, ChevronRight, Loader2, TrendingDown, Info, BarChartIcon, PieChartIcon, X, LineChartIcon, Calculator, Ban, Zap, Activity } from 'lucide-react';
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

// <CHANGE> Added animation styles for enhanced interactivity
const animationStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1); }
    50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.5), inset 0 0 30px rgba(34, 197, 94, 0.15); }
  }
  @keyframes slide-in-left {
    from { 
      opacity: 0;
      transform: translateX(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes float-subtle {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
  }
  .animate-glow-pulse {
    animation: glow-pulse 2s ease-in-out infinite;
  }
  .animate-slide-in-left {
    animation: slide-in-left 0.8s ease-out;
  }
  .animate-float-subtle {
    animation: float-subtle 3s ease-in-out infinite;
  }
`;

export default function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [showAddClass, setShowAddClass] = useState(false);

    const [subjects, setSubjects] = useState([]);
    const [classInstances, setClassInstances] = useState([]);
    const [todaysClasses, setTodaysClasses] = useState([]);

    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [calendarData, setCalendarData] = useState(new Map());
    const [analyticsData, setAnalyticsData] = useState(null);

    const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);
    const [isInstancesLoading, setIsInstancesLoading] = useState(false);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

    const [apiError, setApiError] = useState(null);
    const [pendingJobs, setPendingJobs] = useState({});

    const pollJobStatus = useCallback((jobId, pendingJobKey, onSuccess) => {
        setPendingJobs(prev => ({ ...prev, [pendingJobKey]: true }));
        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/api/attendance/job/status/${jobId}`);
                const job = response.data;
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

    const fetchSubjects = useCallback(async () => {
        setIsSubjectsLoading(true);
        try {
            const response = await api.get("/api/subjects");
            setSubjects(response.data);
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
                setClassInstances(response.data);
            } else if (storeIn === 'today') {
                setTodaysClasses(response.data);
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
            const dataMap = new Map(response.data.map(day => [day.date, day.status]));
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
            setAnalyticsData(response.data);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            setApiError(error.message);
        } finally {
            setIsAnalyticsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
        fetchInstancesForDate(new Date(), 'today');
    }, [fetchSubjects, fetchInstancesForDate]);

    useEffect(() => {
        if (activeTab === 'mark') {
            fetchInstancesForDate(selectedDate, 'main');
        }
    }, [selectedDate, fetchInstancesForDate, activeTab]);

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
            const data = response.data;
            pollJobStatus(data.job.id, pendingJobKey, () => {
                fetchInstancesForDate(selectedDate, 'main');
                const todayStr = new Date().toISOString().split("T")[0];
                if (newClassData.date === todayStr) {
                    fetchInstancesForDate(new Date(), 'today');
                }
                fetchSubjects();
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
            const data = response.data;

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
            setClassInstances(originalInstances);
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

    const overallAttendance = useMemo(() => {
        const totalClasses = subjects.reduce((sum, s) => sum + s.total_classes_held, 0);
        const totalAttended = subjects.reduce((sum, s) => sum + s.total_classes_attended, 0);
        return totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    }, [subjects]);

    const lowAttendanceSubjects = useMemo(() => {
        return subjects.filter(s => s.attendance_percentage < 75);
    }, [subjects]);

    const statCards = [
        { title: "Overall Attendance", value: `${overallAttendance.toFixed(1)}%`, Icon: Target, color: "from-emerald-500 to-green-600", bgColor: "from-emerald-900/20 to-green-900/20" },
        { title: "Total Subjects", value: subjects.length, Icon: BookOpen, color: "from-blue-500 to-cyan-600", bgColor: "from-blue-900/20 to-cyan-900/20" },
        { title: "Classes Today", value: todaysClasses.length, Icon: Clock, color: "from-amber-500 to-orange-600", bgColor: "from-amber-900/20 to-orange-900/20" },
        { title: "Low Attendance", value: lowAttendanceSubjects.length, Icon: AlertTriangle, color: "from-red-500 to-rose-600", bgColor: "from-red-900/20 to-rose-900/20" },
    ];

    const renderErrorPopup = () => {
        if (!apiError) return null;
        return (
            <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm rounded-xl border border-red-500/30 bg-gradient-to-br from-red-950/90 to-red-900/80 p-4 shadow-2xl backdrop-blur-xl animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-400 animate-float-subtle" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-300">An Error Occurred</p>
                        <p className="text-sm text-red-400 mt-1">{apiError}</p>
                    </div>
                    <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-300 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black flex font-figtree">
            <style>{animationStyles}</style>
            <SidebarNavigation />

            <main className="flex-1 p-6 md:pl-50 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* <CHANGE> Enhanced header with gradient accent */}
                    <div className="flex items-center justify-between mb-8 group">
                        <div className="flex items-start gap-4">
                            <div className="w-1 h-16 bg-gradient-to-b from-emerald-400 via-green-400 to-transparent rounded-full animate-glow-pulse" />
                            <div>
                                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                                    Attendance Tracker
                                </h1>
                                <p className="text-gray-400 mt-2 text-sm">
                                    Track your class attendance and maintain academic performance
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowAddSubject(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-11 px-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105">
                            <Plus className="h-5 w-5" />
                            Add Subject
                        </button>
                    </div>

                    {/* <CHANGE> Enhanced tabs with dark mode styling */}
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="grid w-full grid-cols-4 border-b border-white/10">
                            {[
                                { id: 'overview', label: 'Overview' },
                                { id: 'mark', label: 'Mark Attendance' },
                                { id: 'calendar', label: 'Calendar View' },
                                { id: 'analytics', label: 'Analytics' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "p-4 text-sm font-semibold transition-all duration-300 relative",
                                        activeTab === tab.id
                                            ? 'text-emerald-400'
                                            : 'text-gray-400 hover:text-gray-200'
                                    )}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-green-400 to-transparent" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Overview Content */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {statCards.map(({ title, value, Icon, color, bgColor }, i) => (
                                        <div key={title} className="group" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className={cn("rounded-xl border border-white/10 bg-gradient-to-br", bgColor, "backdrop-blur-xl shadow-lg hover:shadow-2xl hover:border-white/20 transition-all duration-300 hover:scale-105 overflow-hidden")}>
                                                <div className="p-6">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
                                                            <p className={cn("text-3xl font-extrabold mt-2 bg-clip-text text-transparent bg-gradient-to-r", color)}>
                                                                {isSubjectsLoading ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : value}
                                                            </p>
                                                        </div>
                                                        <Icon className={cn("h-10 w-10 text-gray-600 group-hover:text-emerald-400 transition-colors duration-300", "group-hover:scale-110 group-hover:rotate-6")} style={{ transitionDuration: '0.3s' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {lowAttendanceSubjects.length > 0 && (
                                    <div className="rounded-xl border border-red-500/30 bg-gradient-to-br from-red-950/40 to-red-900/20 backdrop-blur-xl overflow-hidden">
                                        <div className="flex flex-col space-y-1.5 p-6 border-b border-red-500/20">
                                            <h3 className="text-lg font-extrabold text-red-300 flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
                                                Low Attendance Alert
                                            </h3>
                                        </div>
                                        <div className="p-6">
                                            <p className="text-red-300 mb-4 text-sm">The following subjects have attendance below 75%:</p>
                                            <div className="space-y-3">
                                                {lowAttendanceSubjects.map((subject) => (
                                                    <div key={subject.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-4 rounded-lg border border-red-500/20 transition-all duration-300 hover:border-red-500/40">
                                                        <div>
                                                            <p className="font-semibold text-white text-sm">{subject.name}</p>
                                                            <p className="text-xs text-gray-400">{subject.code}</p>
                                                        </div>
                                                        <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-red-100">{subject.attendance_percentage.toFixed(1)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isSubjectsLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4 animate-pulse">
                                                <div className="h-5 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded w-3/4"></div>
                                                <div className="h-4 bg-white/10 rounded w-1/4"></div>
                                                <div className="h-8 bg-white/10 rounded w-full"></div>
                                                <div className="h-12 bg-white/10 rounded w-full"></div>
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
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl lg:col-span-1 overflow-hidden">
                                    <div className="p-6 border-b border-white/10"><h3 className="text-lg font-bold text-white">Select Date</h3></div>
                                    <div className="p-6">
                                        <FullCalendar
                                            selectedDate={selectedDate}
                                            onDateChange={setSelectedDate}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl lg:col-span-2 overflow-hidden">
                                    <div className="flex flex-row items-center justify-between p-6 border-b border-white/10">
                                        <h3 className="text-lg font-bold text-white">{selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
                                        <button onClick={() => setShowAddClass(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-9 px-4 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/40 hover:border-emerald-500/60 transition-all duration-300">
                                            <Plus className="h-4 w-4" /> Add Class
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-3">
                                        {isInstancesLoading ? (
                                            <div className="flex justify-center items-center h-40">
                                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                            </div>
                                        ) : classInstances.length === 0 ? (
                                            <p className="text-center text-gray-500 py-10">No classes scheduled for this date.</p>
                                        ) : (
                                            classInstances.map((instance) => {
                                                const isJobPending = !!pendingJobs[instance.id];
                                                const attendance = instance.attendance_record;
                                                return (
                                                    <div key={instance.id} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: instance.subject.color }} />
                                                            <div>
                                                                <p className="font-semibold text-white text-sm">{instance.subject.name}</p>
                                                                <p className="text-xs text-gray-400">{instance.subject.code} • {new Date(`1970-01-01T${instance.time}Z`).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleMarkAttendance(instance.id, 'present')}
                                                                disabled={isJobPending}
                                                                className={cn(
                                                                    "inline-flex items-center justify-center gap-1 rounded-lg text-xs font-bold h-9 px-3 transition-all duration-300",
                                                                    attendance?.status === 'present'
                                                                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                                                                        : 'border border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10',
                                                                    isJobPending && 'opacity-50 cursor-not-allowed'
                                                                )}
                                                            >
                                                                {isJobPending && attendance?.status !== 'present' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Present
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkAttendance(instance.id, 'absent')}
                                                                disabled={isJobPending}
                                                                className={cn(
                                                                    "inline-flex items-center justify-center gap-1 rounded-lg text-xs font-bold h-9 px-3 transition-all duration-300",
                                                                    attendance?.status === 'absent'
                                                                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30'
                                                                        : 'border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10',
                                                                    isJobPending && 'opacity-50 cursor-not-allowed'
                                                                )}
                                                            >
                                                                {isJobPending && attendance?.status !== 'absent' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Absent
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkAttendance(instance.id, 'cancelled')}
                                                                disabled={isJobPending}
                                                                className={cn(
                                                                    "inline-flex items-center justify-center gap-1 rounded-lg text-xs font-bold h-9 px-3 transition-all duration-300",
                                                                    attendance?.status === 'cancelled'
                                                                        ? 'bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-lg shadow-gray-500/30'
                                                                        : 'border border-gray-500/30 text-gray-400 hover:border-gray-500/60 hover:bg-gray-500/10',
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

// <CHANGE> Enhanced subject card with dark mode and animations
function SubjectCard({ subject }) {
    const {
        name, code, color, total_classes_held, total_classes_attended,
        attendance_percentage, bunkable_classes_for_75, classes_needed_for_75
    } = subject;

    const percentage = attendance_percentage || 0;
    const isBelow75 = percentage < 75;

    return (
        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl hover:border-white/20 hover:bg-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 flex flex-col justify-between overflow-hidden">
            <div className="p-6 pb-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">{name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{code}</p>
                    </div>
                    <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300 font-semibold">Attendance</span>
                        <span className={cn("font-bold text-sm", !isBelow75 ? "text-emerald-400" : "text-red-400")}>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={cn("h-2.5 rounded-full transition-all duration-500", !isBelow75 ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/50" : "bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/50")}
                            style={{ width: `${percentage > 100 ? 100 : percentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>Present: {total_classes_attended}</span>
                        <span>Total: {total_classes_held}</span>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-white/5 to-white/0 border border-white/10">
                    {isBelow75 ? (
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-emerald-500 animate-float-subtle" />
                            <div>
                                <p className="text-xs font-semibold text-gray-300">Classes to 75%</p>
                                <p className="text-2xl font-extrabold text-emerald-400">{classes_needed_for_75}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <TrendingDown className="h-6 w-6 text-red-500 animate-float-subtle" />
                            <div>
                                <p className="text-xs font-semibold text-gray-300">Classes to Bunk</p>
                                <p className="text-2xl font-extrabold text-red-400">{bunkable_classes_for_75}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// <CHANGE> Enhanced modals with dark theme
function AddSubjectModal({ isOpen, onClose, onAddSubject }) {
    const [newSubject, setNewSubject] = useState({
        name: "",
        code: "",
        color: "#10B981",
        schedules: []
    });
    const [scheduleDay, setScheduleDay] = useState("monday");
    const [scheduleTime, setScheduleTime] = useState("09:00");

    const colors = ["#10B981", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444", "#14B8A6", "#6366F1", "#F97316"];

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
        setNewSubject({ name: "", code: "", color: "#10B981", schedules: [] });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in-up" onClick={onClose}>
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-950/95 rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400">Add New Subject</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label htmlFor="subjectName" className="block text-sm font-semibold text-gray-300 mb-2">Subject Name</label>
                        <input id="subjectName" value={newSubject.name} onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Data Structures" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                    </div>
                    <div>
                        <label htmlFor="subjectCode" className="block text-sm font-semibold text-gray-300 mb-2">Subject Code</label>
                        <input id="subjectCode" value={newSubject.code} onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))} placeholder="e.g., CS301" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Color</label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map((color) => (
                                <button key={color} style={{ backgroundColor: color }} onClick={() => setNewSubject(prev => ({ ...prev, color }))} className={cn("w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110", newSubject.color === color ? "border-white ring-2 ring-offset-2 ring-offset-slate-900 ring-white" : "border-white/30")} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Weekly Schedule (Optional)</label>
                        <div className="flex gap-2">
                            <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50">
                                <option value="monday">Monday</option>
                                <option value="tuesday">Tuesday</option>
                                <option value="wednesday">Wednesday</option>
                                <option value="thursday">Thursday</option>
                                <option value="friday">Friday</option>
                                <option value="saturday">Saturday</option>
                                <option value="sunday">Sunday</option>
                            </select>
                            <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50" />
                            <button onClick={handleAddSchedule} className="h-10 px-3 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-3 space-y-2">
                            {newSubject.schedules.map((s, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/10">
                                    <span className="text-sm text-gray-300 capitalize">{s.day} at {new Date(`1970-01-01T${s.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button onClick={() => setNewSubject(prev => ({ ...prev, schedules: prev.schedules.filter((_, idx) => idx !== i) }))} className="text-gray-500 hover:text-red-400 transition-colors"><X className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 bg-white/5">
                    <button onClick={handleSubmit} className="w-full inline-flex items-center justify-center rounded-lg text-sm font-bold h-10 px-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 shadow-lg hover:shadow-emerald-500/30 transition-all">Add Subject</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in-up" onClick={onClose}>
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-950/95 rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400">Add Class</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 pt-4 space-y-4">
                    <div>
                        <label htmlFor="classSubject" className="block text-sm font-semibold text-gray-300 mb-2">Subject</label>
                        <select value={newClass.subjectId} onChange={(e) => setNewClass(prev => ({ ...prev, subjectId: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50">
                            <option value="">Select subject</option>
                            {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="classTime" className="block text-sm font-semibold text-gray-300 mb-2">Time</label>
                        <input id="classTime" type="time" value={newClass.time} onChange={(e) => setNewClass(prev => ({ ...prev, time: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50" />
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 bg-white/5">
                    <button onClick={handleSubmit} className="w-full inline-flex items-center justify-center rounded-lg text-sm font-bold h-10 px-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 shadow-lg hover:shadow-emerald-500/30 transition-all">Add Class</button>
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
        const remainingCells = 42 - days.length;
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
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><ChevronLeft className="h-5 w-5" /></button>
                <div className="font-bold text-gray-200">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day, i) => (
                    <div key={i} className="text-center text-xs font-bold text-gray-500">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ id, day, isCurrentMonth, date }) => (
                    <button
                        key={id}
                        disabled={!isCurrentMonth}
                        onClick={() => onDateChange(date)}
                        className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200",
                            !isCurrentMonth && "invisible",
                            isCurrentMonth && "hover:bg-white/10",
                            isSameDay(date, selectedDate) && "bg-gradient-to-br from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/30",
                            !isSameDay(date, selectedDate) && isSameDay(date, today) && "text-emerald-400 font-bold border border-emerald-500/40",
                            !isSameDay(date, selectedDate) && !isSameDay(date, today) && "text-gray-400"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}

// <CHANGE> Enhanced monthly calendar with animated charts
function MonthlyCalendarView({ data, isLoading, currentMonth, onMonthChange }) {

    const days = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
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
                return 'from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/30';
            case 'absent':
                return 'from-red-600 to-rose-600 shadow-lg shadow-red-500/30';
            case 'cancelled':
                return 'from-gray-600 to-slate-600 shadow-lg shadow-gray-500/20';
            default:
                return 'from-white/5 to-white/0 border border-white/10';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'present':
                return 'text-white';
            case 'absent':
                return 'text-white';
            case 'cancelled':
                return 'text-white';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Monthly Attendance</h3>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-300">
                        {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><ChevronLeft className="h-5 w-5" /></button>
                    <button onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><ChevronRight className="h-5 w-5" /></button>
                </div>
            </div>
            <div className="p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-60">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-gray-400 pb-2">{day}</div>
                        ))}
                        {days.map(({ id, day, dateStr }) => {
                            const status = data.get(dateStr);
                            return (
                                <div
                                    key={id}
                                    className={cn(
                                        "w-full h-20 rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-300 hover:scale-105",
                                        !day && "invisible",
                                        day && `bg-gradient-to-br ${getStatusColor(status)}`,
                                        day && getStatusTextColor(status)
                                    )}
                                    title={dateStr ? `${dateStr}: ${status || 'No classes'}` : ''}
                                >
                                    {day && <span>{day}</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-600 to-green-600"></div>
                    <span className="text-gray-300">Present</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-red-600 to-rose-600"></div>
                    <span className="text-gray-300">Absent</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-gray-600 to-slate-600"></div>
                    <span className="text-gray-300">Cancelled</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded border border-white/10"></div>
                    <span className="text-gray-400">No Class</span>
                </div>
            </div>
        </div>
    );
}

// <CHANGE> Enhanced analytics with animated charts
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
        <div className="space-y-6 animate-fade-in-up">

            <AttendancePredictor subjects={subjects} isLoading={isSubjectsLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10"><h3 className="text-lg font-bold flex items-center gap-2 text-white"><PieChartIcon className="h-5 w-5 text-emerald-400" /> Overall Breakdown</h3></div>
                    <div className="p-6 h-80">
                        {isSubjectsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={overallData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                        <Cell key="attended" fill="#10B981" />
                                        <Cell key="missed" fill="#EF4444" />
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Day of Week Chart */}
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10"><h3 className="text-lg font-bold flex items-center gap-2 text-white"><BarChartIcon className="h-5 w-5 text-blue-400" /> Attendance by Day</h3></div>
                    <div className="p-6 h-80">
                        {isInsightsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={insights?.attendance_by_day} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="day" fontSize={12} stroke="rgba(255,255,255,0.5)" />
                                    <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} stroke="rgba(255,255,255,0.5)" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                    <Legend />
                                    <Bar dataKey="percentage" name="Attendance %" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10"><h3 className="text-lg font-bold flex items-center gap-2 text-white"><LineChartIcon className="h-5 w-5 text-cyan-400" /> Weekly Trend (Last 12 Weeks)</h3></div>
                <div className="p-6 h-80">
                    {isInsightsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={insights?.weekly_trend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="week_label" fontSize={12} stroke="rgba(255,255,255,0.5)" />
                                <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} stroke="rgba(255,255,255,0.5)" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Legend />
                                <Line type="monotone" dataKey="percentage" name="Attendance %" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#06B6D4', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Subject Performance Chart */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10"><h3 className="text-lg font-bold flex items-center gap-2 text-white"><BarChartIcon className="h-5 w-5 text-orange-400" /> Subject Performance</h3></div>
                <div className="p-6 h-80">
                    {isSubjectsLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjects} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="code" fontSize={12} stroke="rgba(255,255,255,0.5)" />
                                <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} stroke="rgba(255,255,255,0.5)" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="attendance_percentage" name="Attendance %" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

// <CHANGE> Enhanced attendance predictor calculator
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
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl p-6">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="flex flex-col space-y-1.5 p-6 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-emerald-400 animate-float-subtle" />
                    Attendance Goal Calculator
                </h3>
                <p className="text-sm text-gray-400">
                    Find out how many classes you can bunk to stay at 75%.
                </p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="subjectSelect" className="block text-sm font-semibold text-gray-300 mb-2">
                        1. Select Subject
                    </label>
                    <select
                        id="subjectSelect"
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50"
                    >
                        <option value="">Select a subject...</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.code}) - {s.attendance_percentage.toFixed(1)}%
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="remainingClasses" className="block text-sm font-semibold text-gray-300 mb-2">
                        2. Classes Remaining (Estimate)
                    </label>
                    <input
                        id="remainingClasses"
                        type="number"
                        min="0"
                        value={remainingClasses}
                        onChange={(e) => setRemainingClasses(e.target.value)}
                        placeholder="e.g., 20"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                        disabled={!selectedSubjectId}
                    />
                </div>

                <div className="p-5 rounded-lg bg-gradient-to-br from-emerald-600/20 to-green-600/10 border border-emerald-500/30 h-full">
                    <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide">Your Goal:</p>
                    {calculation ? (
                        calculation.isImpossible ? (
                            <div className="text-center mt-2">
                                <p className="text-2xl font-extrabold text-red-400">Impossible</p>
                                <p className="text-xs text-red-400 mt-1">
                                    Even if you attend all {calculation.futureClasses} classes, your max will be {calculation.finalPercentage.toFixed(1)}%.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center mt-2">
                                <p className="text-3xl font-extrabold text-emerald-300">{calculation.canBunk}</p>
                                <p className="text-xs text-emerald-400 mt-1">
                                    classes you can bunk (of your {calculation.futureClasses}) to get {calculation.finalPercentage.toFixed(1)}%.
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-xs text-gray-400 text-center">Enter data to calculate.</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-4 border-t border-white/10 bg-white/5">
                <p className="text-xs text-gray-500 italic flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    This could be wrong. It is based on the user's input and calculations, but due to holidays or something, could sometime result in wrong counts.
                </p>
            </div>
        </div>
    );
}
