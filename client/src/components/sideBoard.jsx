import { Shield, Clock, Activity } from "lucide-react";

export default function SidebarAnalytics({
  scans = 152,
  findings = 8743,
  risk = 78,
  lastScan = "2m ago",
  version = "v1.0.0",
  trend = [3, 4, 5, 4, 6, 7, 8],
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (risk / 100) * circumference;
  const max = Math.max(...trend);

  return (
    <div className="mt-auto px-5 pb-6 mb-4">
      <div className="border-white/10 pt-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-white">
            Security Overview
          </span>
        </div>

        {/* Sparkline */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3 h-3 text-violet-400" />
            <span className="text-xs text-gray-400">Activity Trend</span>
          </div>
        </div>

        {/* Radial Gauge */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
              />

              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="url(#riskGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000"
              />

              <defs>
                <linearGradient
                  id="riskGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{risk}%</span>

              <span className="text-[10px] uppercase tracking-wider text-orange-400">
                High
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Scans</span>
            <span className="text-white font-medium">{scans}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Findings</span>
            <span className="text-white font-medium">
              {findings.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Last Scan</span>
            <span className="text-green-400">{lastScan}</span>
          </div>
        </div>

        <div className="flex items-end gap-1 h-10 my-5">
          {trend.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-violet-600 to-violet-400 transition-all duration-500"
              style={{
                height: `${(v / max) * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Clock className="w-3 h-3" />
            Active
          </div>

          <span className="text-[11px] text-gray-500">{version}</span>
        </div>
      </div>
    </div>
  );
}
