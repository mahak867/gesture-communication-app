import { useCallback } from "react";

export type EventName =
  | "gesture_detected"
  | "phrase_selected"
  | "emergency_triggered"
  | "message_spoken"
  | "gemma_completion_used"
  | "gemma_offline_fallback"
  | "language_changed"
  | "session_start"
  | "session_end";

interface AnalyticsEvent {
  event: EventName;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

export function useAnalytics() {
  const track = useCallback((event: EventName, properties?: Record<string, string | number | boolean>) => {
    try {
      const entry: AnalyticsEvent = { event, properties, timestamp: new Date().toISOString() };
      // Store locally
      const existing = JSON.parse(localStorage.getItem("gesturetalk_analytics") || "[]");
      existing.push(entry);
      // Keep last 1000 events
      if (existing.length > 1000) existing.splice(0, existing.length - 1000);
      localStorage.setItem("gesturetalk_analytics", JSON.stringify(existing));
    } catch { /* storage full or unavailable */ }
  }, []);

  const getStats = useCallback(() => {
    try {
      const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem("gesturetalk_analytics") || "[]");
      const today = new Date().toDateString();
      const todayEvents = events.filter((e) => new Date(e.timestamp).toDateString() === today);
      return {
        totalMessages: events.filter((e) => e.event === "message_spoken").length,
        todayMessages: todayEvents.filter((e) => e.event === "message_spoken").length,
        gemmaUsed: events.filter((e) => e.event === "gemma_completion_used").length,
        emergencies: events.filter((e) => e.event === "emergency_triggered").length,
        phrasesUsed: events.filter((e) => e.event === "phrase_selected").length,
      };
    } catch {
      return { totalMessages: 0, todayMessages: 0, gemmaUsed: 0, emergencies: 0, phrasesUsed: 0 };
    }
  }, []);

  return { track, getStats };
}
