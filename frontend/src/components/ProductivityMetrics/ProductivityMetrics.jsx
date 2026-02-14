"use client";
import { TrendingUp, Flame, CheckCircle2 } from "lucide-react";
import CountUp from "../CountUp/CountUp.jsx";

function MetricCard({ icon: Icon, label, value, unit, accentColor, trend, gradientText }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 border border-gray-200/80 dark:border-white/5 
                   bg-grey/80 dark:bg-gradient-to-br from-slate-900/80 to-slate-800/40
                   flex flex-col gap-4 transition-all duration-350 ease-in-out group cursor-pointer
                   hover:-translate-y-1.5 hover:shadow-lg hover:border-gray-300/80 dark:hover:border-white/10`}
    >
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: accentColor }} />

      <div className="flex flex-col gap-4 pl-2">
        <div className="flex items-start justify-between">
          <div
            className="p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 relative -top-3 
                        bg-gray-100/80 dark:bg-white/5 shadow-md dark:shadow-black/25
                        group-hover:scale-110 group-hover:-translate-y-0.5"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Icon className="h-6 w-6" style={{ color: accentColor }} />
          </div>
          <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
            {label}
          </span>
        </div>

        <div className="flex items-baseline gap-2 -mt-1">
          <div className={`text-4xl font-extrabold tracking-tighter leading-none text-transparent bg-clip-text ${gradientText}`}>
            <CountUp from={0} to={Number.parseInt(value, 10)} separator="," direction="up" duration={1.5} />
          </div>
          {unit && <span className="text-sm font-semibold text-gray-500 dark:text-slate-500">{unit}</span>}
        </div>

        {trend && <p className="text-xs font-medium text-gray-600 dark:text-slate-300 mt-1">{trend}</p>}
      </div>
    </div>
  );
}

export default function ProductivityMetrics({ tasks = [] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.filter((t) => t.status !== "done").length;

  const now = new Date();
  const dueToday = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    const d = new Date(t.due_date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;

  const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;
  const scoreTrend = total > 0 ? `${completed} completed out of ${total}` : "Start with your first task";
  const pendingTrend = total > 0 ? `${dueToday} due today` : "Start with your first task";
  const streak = completed > 0 ? Math.min(30, completed) : 0;
  const streakTrend = completed > 0 ? "Keep it going!" : "Start with your first task";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
      <MetricCard
        icon={TrendingUp}
        label="Productivity Score"
        value={String(productivityScore)}
        unit="/100"
        accentColor="#f49817"
        trend={scoreTrend}
        gradientText="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400"
      />
      <MetricCard
        icon={CheckCircle2}
        label="Tasks to Complete"
        value={String(pending)}
        unit="pending"
        accentColor="#f0499a"
        trend={pendingTrend}
        gradientText="bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-500"
      />
      <MetricCard
        icon={Flame}
        label="Study Streak"
        value={String(streak)}
        unit="days"
        accentColor="#A78BFA"
        trend={streakTrend}
        gradientText="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400"
      />
    </div>
  );
}
