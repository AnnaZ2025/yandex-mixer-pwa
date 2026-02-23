/**
 * TrackSelector — модальный экран выбора трека.
 * Показывает плейлисты и треки. При выборе трека — загружает его на деку.
 */
import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, Loader2, Download, CheckCircle } from "lucide-react";
import { engine } from "@/lib/audioEngine";

interface Playlist {
  kind: number;
  title: string;
  cover_uri: string | null;
  track_count: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  duration_ms: number;
  cover_uri: string | null;
  cached: boolean;
}

interface Props {
  deck: "A" | "B";
  apiBase: string;
  onClose: () => void;
}

export default function TrackSelector({ deck, apiBase, onClose }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);
  const accent = deck === "A" ? "#00FF88" : "#FF6B35";

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/api/playlists`)
      .then(r => r.json())
      .then(data => setPlaylists(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiBase]);

  const loadTracks = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setLoading(true);
    fetch(`${apiBase}/api/playlists/${playlist.kind}`)
      .then(r => r.json())
      .then(data => setTracks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [apiBase]);

  const selectTrack = useCallback(async (track: Track) => {
    if (!track.cached) {
      // Cache first
      setLoadingTrackId(track.id);
      try {
        await fetch(`${apiBase}/api/tracks/${track.id}/cache`, { method: "POST" });
        // Poll until cached
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(r => setTimeout(r, 2000));
          const resp = await fetch(`${apiBase}/api/playlists/${selectedPlaylist!.kind}`);
          const updated: Track[] = await resp.json();
          const t = updated.find(x => x.id === track.id);
          if (t?.cached) {
            setTracks(updated);
            break;
          }
          attempts++;
        }
      } catch (e) {
        console.error(e);
        setLoadingTrackId(null);
        return;
      }
      setLoadingTrackId(null);
    }

    // Load into engine
    const url = `${apiBase}/api/cached_tracks/${track.id}`;
    await engine.loadTrack(deck, url, {
      trackId: String(track.id),
      title: track.title,
      artist: track.artist,
      coverUri: track.cover_uri,
    });
    onClose();
  }, [apiBase, deck, selectedPlaylist, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: "#1a1a1a" }}
      >
        {selectedPlaylist && (
          <button
            onClick={() => { setSelectedPlaylist(null); setTracks([]); }}
            className="w-8 h-8 flex items-center justify-center rounded hover:opacity-70"
            style={{ background: "#1a1a1a" }}
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          </button>
        )}
        <div className="flex-1">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Загрузить на {deck === "A" ? "Деку A" : "Деку B"}
          </p>
          <p className="text-sm font-medium text-white">
            {selectedPlaylist ? selectedPlaylist.title : "Выберите плейлист"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:opacity-70"
          style={{ background: "#1a1a1a" }}
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} />
          </div>
        )}

        {/* Playlists */}
        {!loading && !selectedPlaylist && (
          <div className="grid grid-cols-2 gap-3">
            {playlists.map(pl => (
              <button
                key={pl.kind}
                onClick={() => loadTracks(pl)}
                className="flex flex-col gap-2 p-3 rounded-xl text-left hover:opacity-80 transition-opacity"
                style={{ background: "#111", border: `1px solid #222` }}
              >
                {pl.cover_uri ? (
                  <img
                    src={`https://${pl.cover_uri.replace("%%", "120x120")}`}
                    alt=""
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-lg" style={{ background: `${accent}15` }} />
                )}
                <p className="text-xs font-medium text-white truncate">{pl.title}</p>
                <p className="text-[10px] text-zinc-600">{pl.track_count} треков</p>
              </button>
            ))}
          </div>
        )}

        {/* Tracks */}
        {!loading && selectedPlaylist && (
          <div className="flex flex-col gap-2">
            {tracks.map(track => (
              <button
                key={track.id}
                onClick={() => selectTrack(track)}
                disabled={loadingTrackId === track.id}
                className="flex items-center gap-3 p-3 rounded-xl text-left hover:opacity-80 transition-opacity disabled:opacity-50"
                style={{ background: "#111", border: `1px solid #1a1a1a` }}
              >
                {track.cover_uri ? (
                  <img
                    src={`https://${track.cover_uri.replace("%%", "60x60")}`}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded flex-shrink-0" style={{ background: "#1a1a1a" }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{track.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                </div>
                <div className="flex-shrink-0">
                  {loadingTrackId === track.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: accent }} />
                  ) : track.cached ? (
                    <CheckCircle className="w-4 h-4" style={{ color: accent }} />
                  ) : (
                    <Download className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
