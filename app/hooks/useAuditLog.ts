// Clinical audit log — immutable, append-only, timestamped
import { useState, useCallback } from "react";

export interface AuditEntry {
  id: string;
  ts: string;           // ISO timestamp — never edited
  type: "gesture" | "phrase" | "typed" | "emergency" | "settings" | "system";
  text: string;
  meta?: Record<string, string | number | boolean>;
}

const STORAGE_KEY = "gesturetalk-audit-log";
const MAX_ENTRIES = 2000;

function load(): AuditEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function persist(entries: AuditEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* quota */ }
}

export function useAuditLog() {
  const [log, setLog] = useState<AuditEntry[]>(() =>
    typeof window !== "undefined" ? load() : []
  );

  const append = useCallback((type: AuditEntry["type"], text: string, meta?: AuditEntry["meta"]) => {
    const entry: AuditEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
      type,
      text,
      meta,
    };
    setLog(prev => {
      const next = [...prev, entry].slice(-MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, []);

  const exportCsv = useCallback(() => {
    const header = "id,timestamp,type,text\n";
    const rows = log.map(e =>
      `"${e.id}","${e.ts}","${e.type}","${e.text.replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gesturetalk-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [log]);

  return { log, append, exportCsv };
}
