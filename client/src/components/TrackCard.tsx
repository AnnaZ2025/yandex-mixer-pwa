/**
 * TrackCard — карточка трека в списке плейлиста.
 * Показывает обложку, название, исполнителей, длительность,
 * статус кэширования и кнопку загрузки.
 */

import { useState } from "react";
import { Download, CheckCircle, Loader2, Play, Music } from "lucide-react";
import { Track, cacheTrack } from "@/hooks/useApi";
import WaveformBars from "./WaveformBars";

interface TrackCardProps {
  track: Track;
  isPlaying?: boolean;
  onPlay?: (track: Track) => void;
  onCached?: (trackId: string) => void;
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function TrackCard({ track, isPlaying = false, onPlay, onCached }: TrackCardProps) {
  const [caching, setCaching] = useState(false);
  const [cached, setCached] = useState(track.is_cached);
  const [error, setError] = useState<string | null>(null);

  const handleCache = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cached || caching) return;
    setCaching(true);
    setError(null);
    try {
      await cacheTrack(track.id);
      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const res = await fetch(
            (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000") +
            `/api/cached_tracks/${track.id}.mp3`,
            { method: "HEAD" }
          );
          if (res.ok) {
            clearInterval(poll);
            setCached(true);
            setCaching(false);
            onCached?.(track.id);
          }
        } catch {}
      }, 3000);
      // Safety timeout after 5 minutes
      setTimeout(() => {
        clearInterval(poll);
        if (!cached) {
          setCaching(false);
          setError("Таймаут");
        }
      }, 300_000);
    } catch (e: any) {
      setCaching(false);
      setError("Ошибка");
    }
  };

  const handlePlay = () => {
    if (cached) onPlay?.(track);
  };

  return (
    <div
      className={`track-card flex items-center gap-3 px-3 py-2.5 border rounded-sm cursor-pointer select-none
        ${isPlaying
          ? "border-[#00FF88]/60 bg-[#00FF88]/5"
          : "border-white/5 bg-card"
        }`}
      onClick={handlePlay}
    >
      {/* Cover art */}
      <div className="relative flex-shrink-0 w-10 h-10 rounded-sm overflow-hidden bg-muted">
        {track.cover_uri ? (
          <img
            src={track.cover_uri}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={16} className="text-muted-foreground" />
          </div>
        )}
        {/* Play overlay */}
        {cached && !isPlaying && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play size={14} className="text-[#00FF88] fill-[#00FF88]" />
          </div>
        )}
        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <WaveformBars count={4} active={true} color="#00FF88" />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate leading-tight ${isPlaying ? "text-[#00FF88]" : "text-foreground"}`}>
          {track.title}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {track.artists.join(", ")}
        </div>
      </div>

      {/* Duration */}
      <div className="font-mono text-xs text-muted-foreground flex-shrink-0 w-10 text-right">
        {formatDuration(track.duration_ms)}
      </div>

      {/* Cache status */}
      <div className="flex-shrink-0 w-7 flex items-center justify-center">
        {cached ? (
          <CheckCircle size={15} className="text-[#00FF88]" />
        ) : caching ? (
          <Loader2 size={15} className="text-[#FFB800] animate-spin" />
        ) : (
          <button
            onClick={handleCache}
            className="text-muted-foreground hover:text-[#00FF88] transition-colors p-0.5"
            title="Загрузить трек"
          >
            <Download size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
