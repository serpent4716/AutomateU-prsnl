"use client"
import { TrendingUp, Flame, CheckCircle2 } from "lucide-react"
import CountUp from "../CountUp/CountUp.jsx"
import "./ProductivityMetrics.css"

function MetricCard({ icon: Icon, label, value, unit, accentColor, trend, bgGradient, gradientText }) {
  return (
    <div className={`metric-card ${bgGradient} group cursor-pointer`}>
      {/* Accent Bar */}
      <div className="accent-bar" style={{ background: accentColor }}></div>

      <div className="metric-content">
        {/* Header Section */}
        <div className="metric-header">
          <div className="metric-icon" style={{ backgroundColor: `${accentColor}15` }}>
            <Icon className="h-6 w-6" style={{ color: accentColor }} />
          </div>
          <span className="metric-label">{label}</span>
        </div>

        {/* Main Value */}
        <div className="metric-value">
          <div className={`value text-transparent bg-clip-text font-extrabold ${gradientText}`}>
            <CountUp
              from={0}
              to={Number.parseInt(value)}
              separator=","
              direction="up"
              duration={2}
              className="count-up-text"
            />
          </div>
          {unit && <span className="unit">{unit}</span>}
        </div>

        {/* Trend */}
        {trend && <p className="metric-trend">{trend}</p>}
      </div>
    </div>
  )
}

export default function ProductivityMetrics() {
  return (
    <div className="productivity-metrics">
      <MetricCard
        icon={TrendingUp}
        label="Productivity Score"
        value="87"
        unit="/100"
        accentColor="#f49817"
        trend="↑ 12% from last week"
        bgGradient="bg-gradient-to-br from-slate-900/80 to-slate-800/40"
        gradientText="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400"
      />
      <MetricCard
        icon={CheckCircle2}
        label="Tasks to Complete"
        value="5"
        unit="pending"
        accentColor="#f0499a"
        trend="2 due today"
        bgGradient="bg-gradient-to-br from-slate-900/80 to-slate-800/40"
        gradientText="bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-500"
      />
      <MetricCard
        icon={Flame}
        label="Study Streak"
        value="12"
        unit="days"
        accentColor="#A78BFA"
        trend="🔥 Keep it going!"
        bgGradient="bg-gradient-to-br from-slate-900/80 to-slate-800/40"
        gradientText="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400"
      />
    </div>
  )
}
