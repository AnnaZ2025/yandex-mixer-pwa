/**
 * TrackSelector — модальный экран выбора трека.
 * Сразу показывает все закэшированные треки без шага выбора плейлиста.
 * Поддерживает поиск по названию и исполнителю.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, Loader2, CheckCircle, Music, Search, Zap } from "lucide-react";
import { engine } from "@/lib/audioEngine";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";

const NGROK_HEADERS: HeadersInit = API_BASE.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: { ...NGROK_HEADERS, ...(options?.headers || {}) },
  });
}

interface Track {
  id: string;
  title: string;
  artists: string[];
  album: string;
  duration_ms: number;
  cover_uri: string | null;
  is_cached: boolean;
  cache_url: string | null;
  bpm?: number | null;
}

interface Props {
  deck: "A" | "B";
  apiBase: string;
  onClose: () => void;
  /** BPM of the other deck for compatibility scoring */
  referenceBpm?: number | null;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Calculate BPM compatibility score 0–100 */
function bpmScore(bpmA: number | null | undefined, bpmB: number | null | undefined): number | null {
  if (!bpmA || !bpmB) return null;
  const diff = Math.abs(bpmA - bpmB);
  // also check half/double tempo
  const diffHalf = Math.abs(bpmA - bpmB / 2);
  const diffDouble = Math.abs(bpmA - bpmB * 2);
  const minDiff = Math.min(diff, diffHalf, diffDouble);
  if (minDiff === 0) return 100;
  if (minDiff <= 3) return 95;
  if (minDiff <= 8) return 80;
  if (minDiff <= 15) return 60;
  if (minDiff <= 25) return 35;
  return 15;
}

export default function TrackSelector({ deck, apiBase, onClose, referenceBpm }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const accent = deck === "A" ? "#00FF88" : "#FF6B35";

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`${apiBase}/api/cached_tracks_meta`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Track[]) => setTracks(data))
      .catch(e => setError("Не удалось загрузить треки: " + e.message))
      .finally(() => {
        setLoading(false);
        // Focus search after load
        setTimeout(() => searchRef.current?.focus(), 100);
      });
  }, [apiBase]);

  const filtered = useMemo(() => {
    let list = tracks;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artists.some(a => a.toLowerCase().includes(q)) ||
        t.album.toLowerCase().includes(q)
      );
    }
    // Sort by BPM compatibility if referenceBpm is provided
    if (referenceBpm) {
      list = [...list].sort((a, b) => {
        const scoreA = bpmScore(referenceBpm, a.bpm) ?? 0;
        const scoreB = bpmScore(referenceBpm, b.bpm) ?? 0;
        return scoreB - scoreA;
      });
    }
    return list;
  }, [tracks, query, referenceBpm]);

  const selectTrack = useCallback(async (track: Track) => {
    setLoadingTrackId(track.id);
    try {
      const url = track.cache_url
        ? (track.cache_url.startsWith("http") ? track.cache_url : `${apiBase}${track.cache_url}`)
        : `${apiBase}/api/cached_tracks/${track.id}`;
      await engine.loadTrack(deck, url, {
        trackId: String(track.id),
        title: track.title,
        artist: track.artists?.join(", ") || "Unknown",
        coverUri: track.cover_uri,
      });
      onClose();
    } catch (e) {
      console.error("loadTrack error:", e);
      onClose();
    } finally {
      setLoadingTrackId(null);
    }
  }, [apiBase, deck, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(8px)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "#1a1a1a" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}
        >
          <Music className="w-4 h-4" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Загрузить на {deck === "A" ? "Деку A" : "Деку B"}
          </p>
          <p className="text-sm font-semibold text-white">
            Скачанные треки
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Search bar */}
      {!loading && !error && tracks.length > 0 && (
        <div className="px-4 py-3 border-b" style={{ borderColor: "#1a1a1a" }}>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "#111", border: `1px solid ${query ? accent + "40" : "#222"}` }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: query ? accent : "#444" }} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по названию или исполнителю..."
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none font-mono"
              style={{ minWidth: 0 }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="flex-shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} />
            <p className="text-xs font-mono text-zinc-600">Загружаем список треков...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <p className="text-sm text-red-400 font-mono">{error}</p>
            <p className="text-xs text-zinc-600">Убедитесь, что сервер запущен и обновлён</p>
          </div>
        )}

        {!loading && !error && tracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${accent}12`, border: `1px dashed ${accent}35` }}
            >
              <Music className="w-6 h-6" style={{ color: `${accent}60` }} />
            </div>
            <p className="text-sm font-semibold text-zinc-400">Нет скачанных треков</p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Перейдите в раздел «Плейлисты», откройте плейлист и нажмите на трек, чтобы скачать его
            </p>
          </div>
        )}

        {!loading && !error && tracks.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <Search className="w-8 h-8 text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-500">Ничего не найдено</p>
            <p className="text-xs text-zinc-600">Попробуйте другой запрос</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-col divide-y" style={{ borderColor: "#111" }}>
            {filtered.map(track => (
              <button
                key={track.id}
                onClick={() => selectTrack(track)}
                disabled={loadingTrackId === track.id}
                className="flex items-center gap-3 px-4 py-3 text-left transition-all active:bg-white/5 disabled:opacity-50"
              >
                {track.cover_uri ? (
                  <img
                    src={track.cover_uri.replace("200x200", "80x80")}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    style={{ boxShadow: `0 0 10px ${accent}20` }}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: "#1a1a1a" }}
                  >
                    <Music className="w-5 h-5 text-zinc-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {track.artists?.join(", ") || "Unknown"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {track.duration_ms > 0 && (
                      <p className="text-[10px] font-mono" style={{ color: `${accent}60` }}>
                        {formatDuration(track.duration_ms)}
                      </p>
                    )}
                    {referenceBpm && track.bpm && (() => {
                      const s = bpmScore(referenceBpm, track.bpm);
                      if (!s) return null;
                      const color = s >= 80 ? "#00FF88" : s >= 50 ? "#FFB800" : "#FF4444";
                      return (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          {track.bpm} BPM · {s}%
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {loadingTrackId === track.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: accent }} />
                  ) : (
                    <CheckCircle className="w-4 h-4" style={{ color: accent }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && !error && tracks.length > 0 && (
        <div
          className="px-4 py-3 text-center border-t"
          style={{ borderColor: "#1a1a1a" }}
        >
          <p className="text-[10px] font-mono text-zinc-600">
            {query
              ? `${filtered.length} из ${tracks.length} треков`
              : `${tracks.length} ${tracks.length === 1 ? "трек" : tracks.length < 5 ? "трека" : "треков"} в кэше`
            }
          </p>
        </div>
      )}
    </div>
  );
}
