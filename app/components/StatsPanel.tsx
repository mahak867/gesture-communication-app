// components/StatsPanel.tsx
'use client';
import { useState, useEffect } from 'react';
import type { SessionStats } from '../hooks/useStats';

interface StatsPanelProps {
  stats: SessionStats;
}

function formatDuration(start: Date, now: Date): string {
  const secs = Math.floor((now.getTime() - start.getTime()) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className={`bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-1`}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg">{icon}</span>
        <span className="text-xs text-gray-500 uppercase font-bold">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-gray-600">{sub}</span>}
    </div>
  );
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date()); // setState in interval callback — allowed
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const avgWords =
    stats.messagesSent > 0
      ? (stats.wordsSent / stats.messagesSent).toFixed(1)
      : '—';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">📊 Session Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon="⏱️"
            label="Duration"
            value={formatDuration(stats.sessionStarted, now)}
            sub="since app opened"
            color="text-cyan-400"
          />
          <StatCard
            icon="🤟"
            label="Gestures"
            value={stats.gesturesConfirmed}
            sub="confirmed"
            color="text-violet-400"
          />
          <StatCard
            icon="💬"
            label="Messages"
            value={stats.messagesSent}
            sub="sent"
            color="text-amber-400"
          />
          <StatCard
            icon="📝"
            label="Words"
            value={stats.wordsSent}
            sub={`avg ${avgWords} per message`}
            color="text-emerald-400"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">ℹ️ About GestureTalk</h3>
        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-2 text-xs text-gray-400 leading-relaxed">
          <p>
            <strong className="text-gray-200">GestureTalk</strong> converts real-time hand gestures
            into voice and text, giving people with speech challenges an instant communication tool.
          </p>
          <p>
            Powered by <strong className="text-gray-200">MediaPipe Hands</strong> (Google AI) for
            on-device, privacy-first hand tracking — no video is ever uploaded.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {['On-device AI', 'No data uploaded', 'Works offline (PWA)', 'Any camera device'].map(
              (tag) => (
                <span
                  key={tag}
                  className="bg-gray-700/60 border border-gray-700 rounded-full px-2 py-0.5 text-[10px] text-gray-300"
                >
                  ✓ {tag}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
