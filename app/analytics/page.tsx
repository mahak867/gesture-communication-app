"use client";
import { useEffect, useState } from "react";
import { useAnalytics } from "@/app/hooks/useAnalytics";

interface DailyStats { date: string; messages: number; emergencies: number; }

export default function AnalyticsDashboard() {
  const { getStats } = useAnalytics();
  const [stats, setStats] = useState({ totalMessages: 0, todayMessages: 0, gemmaUsed: 0, emergencies: 0, phrasesUsed: 0 });
  const [daily, setDaily] = useState<DailyStats[]>([]);

  useEffect(() => {
    setStats(getStats());
    // Build last 7 days chart data
    const events = JSON.parse(localStorage.getItem("gesturetalk_analytics") || "[]");
    const days: Record<string, DailyStats> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      days[key] = { date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }), messages: 0, emergencies: 0 };
    }
    events.forEach((e: { event: string; timestamp: string }) => {
      const key = new Date(e.timestamp).toDateString();
      if (days[key]) {
        if (e.event === "message_spoken") days[key].messages++;
        if (e.event === "emergency_triggered") days[key].emergencies++;
      }
    });
    setDaily(Object.values(days));
  }, [getStats]);

  const maxMessages = Math.max(...daily.map((d) => d.messages), 1);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-400 text-sm">All data stored only on this device. Never shared.</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total messages", value: stats.totalMessages, color: "text-blue-400" },
            { label: "Today", value: stats.todayMessages, color: "text-green-400" },
            { label: "Gemma AI used", value: stats.gemmaUsed, color: "text-purple-400" },
            { label: "Emergencies", value: stats.emergencies, color: "text-red-400" },
            { label: "Phrases used", value: stats.phrasesUsed, color: "text-yellow-400" },
            { label: "Gemma rate", value: stats.totalMessages > 0 ? `${Math.round((stats.gemmaUsed / stats.totalMessages) * 100)}%` : "0%", color: "text-cyan-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-4">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 7-day chart */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h2 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Messages — last 7 days</h2>
          <div className="flex items-end gap-2 h-24">
            {daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-600 rounded-t-sm transition-all"
                  style={{ height: `${(d.messages / maxMessages) * 80}px`, minHeight: d.messages > 0 ? "4px" : "0" }}
                />
                <span className="text-xs text-gray-500">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clear data */}
        <button
          onClick={() => { if (confirm("Clear all analytics data?")) { localStorage.removeItem("gesturetalk_analytics"); setStats({ totalMessages: 0, todayMessages: 0, gemmaUsed: 0, emergencies: 0, phrasesUsed: 0 }); } }}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm py-3 rounded-xl"
        >
          Clear analytics data
        </button>
      </div>
    </div>
  );
}
