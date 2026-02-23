/**
 * MiniPlayer — фиксированный нижний плеер.
 * Показывает текущий трек, управление воспроизведением и прогресс.
 */

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Music } from "lucide-react";
import { Track, getCachedTrackUrl } from "@/hooks/useApi";
import WaveformBars from "./WaveformBars";

interface MiniPlayerProps {
  track: Track | null;
  playlist: Track[];
  onTrackChange?: (track: Track) => void;
}

export default function MiniPlayer({ track, playlist, onTrackChange }: MiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load new track when it changes
  useEffect(() => {
    if (!track || !audioRef.current) return;
    audioRef.current.src = getCachedTrackUrl(track.id);
    audioRef.current.load();
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [track?.id]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true));
    }
  };

  const handleNext = () => {
    if (!track || !playlist.length) return;
    const idx = playlist.findIndex(t => t.id === track.id);
    const next = playlist.find((t, i) => i > idx && t.is_cached);
    if (next) onTrackChange?.(next);
  };

  const handlePrev = () => {
    if (!track || !playlist.length) return;
    const idx = playlist.findIndex(t => t.id === track.id);
    const cached = playlist.slice(0, idx).filter(t => t.is_cached);
    if (cached.length) onTrackChange?.(cached[cached.length - 1]);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  const handleEnded = () => {
    setPlaying(false);
    handleNext();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-white/10">
      {/* Progress bar */}
      <div
        className="h-0.5 bg-muted cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-[#00FF88] transition-none"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Cover */}
        <div className="relative w-10 h-10 rounded-sm overflow-hidden bg-muted flex-shrink-0">
          {track.cover_uri ? (
            <img src={track.cover_uri} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={16} className="text-muted-foreground" />
            </div>
          )}
          {playing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <WaveformBars count={4} active={true} color="#00FF88" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-foreground">{track.title}</div>
          <div className="text-xs text-muted-foreground truncate">{track.artists.join(", ")}</div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handlePrev}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-[#00FF88] text-black flex items-center justify-center hover:bg-[#00FF88]/80 transition-colors"
          >
            {playing ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" />}
          </button>
          <button
            onClick={handleNext}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
      />
    </div>
  );
}
