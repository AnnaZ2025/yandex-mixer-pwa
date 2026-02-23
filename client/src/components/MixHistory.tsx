/**
 * MixHistory — история миксов.
 * Сохраняет пары треков (A+B) в localStorage при каждом AUTO MIX или ручном переходе.
 * Design: Dark Studio — #080808 bg, #00FF88 accent
 */
import { useState, useEffect } from "react";
import { Clock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export interface MixEntry {
  id: string;
  timestamp: number;
  trackA: { id: string; title: string; artist: string; coverUri: string | null; bpm: number | null };
  trackB: { id: string; title: string; artist: string; coverUri: string | null; bpm: number | null };
  crossfadeType: "manual" | "auto";
}

const STORAGE_KEY = "yandex_mixer_history";
const MAX_ENTRIES = 20;

export function saveMixEntry(entry: Omit<MixEntry, "id" | "timestamp">) {
  try {
    const existing: MixEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newEntry: MixEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function loadMixHistory(): MixEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function MixHistory() {
  const [history, setHistory] = useState<MixEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHistory(loadMixHistory());
    // Refresh when storage changes
    const handler = () => setHistory(loadMixHistory());
    window.addEventListener("storage", handler);
    // Also poll every 5s for same-tab updates
    const interval = setInterval(() => setHistory(loadMixHistory()), 5000);
    return () => { window.removeEventListener("storage", handler); clearInterval(interval); };
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  if (history.length === 0) return null;

  const visible = expanded ? history : history.slice(0, 3);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ borderBottom: expanded ? "1px solid #1a1a1a" : "none" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" style={{ color: "#00FF88" }} />
          <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "#00FF88" }}>
            История миксов
          </span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ background: "#00FF8820", color: "#00FF88", border: "1px solid #00FF8830" }}
          >
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); clearHistory(); }}
              className="p-1 rounded transition-colors"
              style={{ color: "#444" }}
              title="Очистить историю"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-600" />
          )}
        </div>
      </div>

      {/* Entries */}
      {expanded && (
        <div className="divide-y" style={{ borderColor: "#1a1a1a" }}>
          {visible.map((entry) => (
            <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
              {/* Covers */}
              <div className="flex items-center flex-shrink-0" style={{ width: "52px" }}>
                {entry.trackA.coverUri ? (
                  <img
                    src={entry.trackA.coverUri.startsWith("http") ? entry.trackA.coverUri : `https://${entry.trackA.coverUri.replace("%%", "40x40")}`}
                    alt=""
                    className="w-7 h-7 rounded-md object-cover"
                    style={{ border: "1px solid #00FF8840" }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md" style={{ background: "#00FF8815" }} />
                )}
                <span className="text-[8px] font-mono text-zinc-700 mx-0.5">→</span>
                {entry.trackB.coverUri ? (
                  <img
                    src={entry.trackB.coverUri.startsWith("http") ? entry.trackB.coverUri : `https://${entry.trackB.coverUri.replace("%%", "40x40")}`}
                    alt=""
                    className="w-7 h-7 rounded-md object-cover"
                    style={{ border: "1px solid #FF6B3540" }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md" style={{ background: "#FF6B3515" }} />
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white truncate leading-tight">
                  <span style={{ color: "#00FF88" }}>{entry.trackA.title}</span>
                  <span className="text-zinc-600 mx-1">→</span>
                  <span style={{ color: "#FF6B35" }}>{entry.trackB.title}</span>
                </p>
                <p className="text-[9px] text-zinc-600 truncate mt-0.5">
                  {entry.trackA.bpm && entry.trackB.bpm
                    ? `${entry.trackA.bpm} → ${entry.trackB.bpm} BPM · `
                    : ""}
                  {entry.crossfadeType === "auto" ? "AUTO" : "ручной"} · {formatTime(entry.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {history.length > 3 && !expanded && (
            <div className="px-4 py-2 text-center">
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] font-mono text-zinc-600"
              >
                Показать все {history.length}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
