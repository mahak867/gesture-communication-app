"use client";
import { useState, useEffect, useCallback } from "react";

interface Message { text: string; timestamp: string; flagged?: boolean; }

export default function CaregiverDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [filter, setFilter] = useState<"all" | "urgent" | "pain" | "needs">("all");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const URGENT_KEYWORDS = ["emergency", "help", "pain", "hurt", "can't breathe", "severe", "911", "urgent", "call"];
  const PAIN_KEYWORDS = ["pain", "hurt", "ache", "sore", "burning", "stabbing", "level"];
  const NEEDS_KEYWORDS = ["water", "food", "bathroom", "cold", "hot", "hungry", "thirsty", "sleep"];

  const flagMessage = (text: string) =>
    URGENT_KEYWORDS.some((k) => text.toLowerCase().includes(k));

  const loadMessages = useCallback(() => {
    try {
      const stored = localStorage.getItem('gesturetalk-conversation-log');
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed.map((m: Message) => ({ ...m, flagged: flagMessage(m.text) })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadMessages]);

  const generateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/caregiver-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, timeframe: "daily" }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary("Unable to generate summary — check that Ollama is running.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const exportLog = () => {
    const content = messages.map((m) => `[${m.timestamp}]${m.flagged ? " 🚨" : ""} ${m.text}`).join("\n");
    const blob = new Blob([`GestureTalk Communication Log\nExported: ${new Date().toLocaleString()}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gesturetalk-log-${Date.now()}.txt`;
    a.click();
  };

  const filteredMessages = messages.filter((m) => {
    if (search && !m.text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "urgent") return m.flagged;
    if (filter === "pain") return PAIN_KEYWORDS.some((k) => m.text.toLowerCase().includes(k));
    if (filter === "needs") return NEEDS_KEYWORDS.some((k) => m.text.toLowerCase().includes(k));
    return true;
  });

  const urgentCount = messages.filter((m) => m.flagged).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Caregiver Dashboard</h1>
            <p className="text-gray-400 text-sm">GestureTalk — real-time patient communication</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
            <span className="text-xs text-gray-400">{autoRefresh ? "Live" : "Paused"}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{messages.length}</div>
            <div className="text-xs text-gray-400">Total messages</div>
          </div>
          <div className={`rounded-xl p-3 text-center ${urgentCount > 0 ? "bg-red-900 border border-red-500" : "bg-gray-900"}`}>
            <div className="text-2xl font-bold">{urgentCount}</div>
            <div className="text-xs text-gray-400">Urgent flags</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{messages.length > 0 ? Math.round(messages.length / 24) : 0}</div>
            <div className="text-xs text-gray-400">Per hour avg</div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-gray-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Gemma 4 AI Summary</h2>
            <button
              onClick={generateSummary}
              disabled={loadingSummary || messages.length === 0}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {loadingSummary ? "Generating..." : "Generate"}
            </button>
          </div>
          {summary ? (
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{summary}</p>
          ) : (
            <p className="text-gray-500 text-sm">Click Generate to create an AI summary of today&apos;s communication using Gemma 4 on-device.</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            aria-label="Search messages"
          />
          <button onClick={exportLog} className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg">
            Export
          </button>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`text-sm px-4 py-2 rounded-lg ${autoRefresh ? "bg-green-800 text-green-300" : "bg-gray-800 text-gray-300"}`}
          >
            {autoRefresh ? "Live" : "Paused"}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "urgent", "pain", "needs"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${filter === f ? "bg-white text-black" : "bg-gray-800 text-gray-400"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Message log */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {messages.length === 0 ? "No messages yet. App messages appear here in real time." : "No messages match this filter."}
            </div>
          ) : (
            filteredMessages.slice().reverse().map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${m.flagged ? "bg-red-950 border border-red-800" : "bg-gray-900"}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-white">{m.flagged && "🚨 "}{m.text}</span>
                  <span className="text-gray-500 text-xs whitespace-nowrap flex-shrink-0">{new Date(m.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
