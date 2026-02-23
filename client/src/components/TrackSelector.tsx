/**
 * TrackSelector — модальный экран выбора трека.
 * Сразу показывает все закэшированные треки без шага выбора плейлиста.
 */
import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle, Music } from "lucide-react";
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
}

interface Props {
  deck: "A" | "B";
  apiBase: string;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function TrackSelector({ deck, apiBase, onClose }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      .finally(() => setLoading(false));
  }, [apiBase]);

  const selectTrack = useCallback(async (track: Track) => {
    setLoadingTrackId(track.id);
    try {
      // cache_url may be relative ("/api/cached_tracks/ID") or absolute
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
      // Close anyway so user isn't stuck
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

        {!loading && !error && tracks.length > 0 && (
          <div className="flex flex-col divide-y" style={{ borderColor: "#111" }}>
            {tracks.map(track => (
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
                  {track.duration_ms > 0 && (
                    <p className="text-[10px] font-mono mt-1" style={{ color: `${accent}60` }}>
                      {formatDuration(track.duration_ms)}
                    </p>
                  )}
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
            {tracks.length} {tracks.length === 1 ? "трек" : tracks.length < 5 ? "трека" : "треков"} в кэше
          </p>
        </div>
      )}
    </div>
  );
}
