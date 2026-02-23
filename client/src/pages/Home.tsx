/**
 * Home — главная страница AI-микшера Яндекс Музыки.
 * Design: Dark Studio — professional audio engineering aesthetic.
 * Layout: Header → Playlist selector → Track list → Mini player (fixed bottom)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { RefreshCw, Wifi, WifiOff, Download, CheckCircle, Loader2, Music2, Disc3, X, Square } from "lucide-react";
import {
  useServerStatus, usePlaylists, usePlaylistTracks,
  startBulkCache, getBulkCacheStatus, cancelBulkCache,
  Track, Playlist, BulkCacheStatus
} from "@/hooks/useApi";
import TrackCard from "@/components/TrackCard";
import WaveformBars from "@/components/WaveformBars";
import { Link } from "wouter";

const HERO_BG = "https://private-us-east-1.manuscdn.com/sessionFile/kJCgUUTAXpuoqEBvmxyLwC/sandbox/COKVXS6RQeS4whExli8Q99-img-1_1771858798000_na1fn_bWl4ZXItaGVyby1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUva0pDZ1VVVEFYcHVvcUVCdm14eUx3Qy9zYW5kYm94L0NPS1ZYUzZSUWVTNHdoRXhsaThROTktaW1nLTFfMTc3MTg1ODc5ODAwMF9uYTFmbl9iV2w0WlhJdGFHVnlieTFpWncucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=cH2RcDnlg3mwv-vUcmh31G7532z70X3mjadYLn8KSt8Uwe0ncwQYYD6-c6S-vLf6mtviWzXG8YHDn1my86AeMsZUplAt9GVbhYDZcN4VqAW9ISlu3XgPOQSP0n3KamxLfUWh19NKrxAIOp0FPO1BDRzZwf3W1KZQEX7cdKKCFD759UV9doUSZgM94n~eLHkLKB8KcWh7KrOSz5OmF3tTW3HIsy6aUthGMPAAqAAR1EUHcCyE9R84u0vX~UGSwPd0EAoe7PYNX6QsBTJQxD6xJz8iBTywnp28qgiYpovFSlULh-~c81GCmLYkpsEsY-Zme5VV5O5EggFsdyl5dlGUmA__";

export default function Home() {
  const { status, loading: statusLoading, error: statusError, refetch: refetchStatus } = useServerStatus();
  const { playlists, loading: playlistsLoading } = usePlaylists();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const { tracks, loading: tracksLoading, refetch: refetchTracks } = usePlaylistTracks(selectedPlaylist?.kind ?? null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // Bulk download state
  const [bulkStatus, setBulkStatus] = useState<BulkCacheStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((kind: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const s = await getBulkCacheStatus(kind);
        setBulkStatus(s);
        if (s.status === "done" || s.status === "cancelled") {
          stopPolling();
          refetchTracks();
        }
      } catch {}
    }, 1500);
  }, [stopPolling, refetchTracks]);

  // Stop polling when playlist changes
  useEffect(() => {
    stopPolling();
    setBulkStatus(null);
  }, [selectedPlaylist?.kind, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleCacheAll = useCallback(async () => {
    if (!selectedPlaylist) return;
    try {
      const res = await startBulkCache(selectedPlaylist.kind);
      setBulkStatus(res);
      if (res.status === "started" || res.status === "running" || res.status === "already_running") {
        startPolling(selectedPlaylist.kind);
      }
    } catch (e) {
      console.error("bulk cache error:", e);
    }
  }, [selectedPlaylist, startPolling]);

  const handleCancelBulk = useCallback(async () => {
    if (!selectedPlaylist) return;
    try {
      await cancelBulkCache(selectedPlaylist.kind);
      setBulkStatus(prev => prev ? { ...prev, status: "cancelled" } : null);
      stopPolling();
    } catch {}
  }, [selectedPlaylist, stopPolling]);

  const cachedCount = tracks.filter(t => t.is_cached).length;
  const isRunning = bulkStatus?.status === "running" || bulkStatus?.status === "already_running" || bulkStatus?.status === "started";
  const bulkDone = bulkStatus?.done ?? 0;
  const bulkTotal = bulkStatus?.total ?? tracks.length;
  const bulkProgress = bulkTotal > 0 ? Math.round((bulkDone / bulkTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── HERO HEADER ── */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

        <div className="relative px-4 pt-12 pb-8">
          {/* Logo row */}
          <div className="flex items-center gap-3 mb-1">
            <WaveformBars count={8} active={status?.status === "ok"} color="#00FF88" />
            <span className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
              AI MIXER
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight mt-2">
            Яндекс<span className="neon-text"> Микшер</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-2 font-mono tracking-wide">
            Персональный AI-диджей для ваших плейлистов
          </p>

          {/* CTA to DJ Deck */}
          <Link href="/dj">
            <div
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all active:scale-95"
              style={{ background: "#00FF8818", border: "1px solid #00FF8844", color: "#00FF88" }}
            >
              <Disc3 className="w-3.5 h-3.5" />
              Открыть DJ Стол
            </div>
          </Link>

          {/* Server status */}
          <div className="mt-5 flex items-center gap-2">
            {statusLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" />
                <span className="font-mono">Подключение...</span>
              </div>
            ) : status?.status === "ok" ? (
              <div className="flex items-center gap-1.5 text-xs">
                <Wifi size={12} className="text-[#00FF88]" />
                <span className="font-mono text-[#00FF88]">ONLINE</span>
                <span className="text-muted-foreground">· {status.username}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <WifiOff size={12} className="text-destructive" />
                <span className="font-mono text-destructive">OFFLINE</span>
                <button onClick={refetchStatus} className="text-muted-foreground hover:text-foreground ml-1">
                  <RefreshCw size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 px-4 pb-24">

        {/* Offline warning */}
        {statusError && (
          <div className="mb-4 p-3 border border-destructive/30 bg-destructive/5 rounded-sm text-xs text-destructive font-mono">
            {statusError}
          </div>
        )}

        {/* ── PLAYLISTS ── */}
        <section className="mb-6 mt-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Плейлисты
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {playlistsLoading ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-24 h-24 bg-muted rounded-sm animate-pulse" />
              ))}
            </div>
          ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {playlists.map(pl => (
                <button
                  key={pl.kind}
                  onClick={() => setSelectedPlaylist(pl)}
                  className={`flex-shrink-0 w-[96px] rounded-sm overflow-hidden border transition-all
                    ${selectedPlaylist?.kind === pl.kind
                      ? "border-[#00FF88]/60 neon-glow"
                      : "border-white/5 hover:border-white/20"
                    }`}
                >
                  <div className="relative w-full aspect-square bg-muted">
                    {pl.cover_uri ? (
                      <img src={pl.cover_uri} alt={pl.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 size={24} className="text-muted-foreground" />
                      </div>
                    )}
                    {selectedPlaylist?.kind === pl.kind && (
                      <div className="absolute inset-0 bg-[#00FF88]/10 flex items-end justify-center pb-1">
                        <WaveformBars count={5} active color="#00FF88" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-card">
                    <div className="text-[11px] font-medium truncate text-foreground leading-tight">{pl.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1">{pl.track_count} тр.</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── TRACKS ── */}
        {selectedPlaylist && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                {selectedPlaylist.title}
              </span>
              <div className="flex-1 h-px bg-border" />
              {tracks.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {cachedCount}/{tracks.length}
                    <CheckCircle size={9} className="inline ml-1 text-[#00FF88]" />
                  </span>
                  {isRunning ? (
                    <button
                      onClick={handleCancelBulk}
                      className="flex items-center gap-1 text-[10px] font-mono text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <Square size={9} />
                      Стоп
                    </button>
                  ) : (
                    <button
                      onClick={handleCacheAll}
                      disabled={cachedCount === tracks.length}
                      className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-[#00FF88] transition-colors disabled:opacity-40"
                    >
                      <Download size={10} />
                      Скачать все
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bulk download progress bar */}
            {isRunning && bulkTotal > 0 && (
              <div className="mb-3 rounded-lg overflow-hidden" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-zinc-500">
                      Скачивание {bulkDone} из {bulkTotal}
                    </span>
                    <span className="text-[10px] font-mono text-[#00FF88]">{bulkProgress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${bulkProgress}%`, background: "linear-gradient(90deg, #00FF88, #00cc6a)" }}
                    />
                  </div>
                  {bulkStatus?.current && (
                    <p className="text-[9px] font-mono text-zinc-600 mt-1 truncate">
                      → {bulkStatus.current}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Done banner */}
            {bulkStatus?.status === "done" && (
              <div
                className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
                style={{ background: "#00FF8810", border: "1px solid #00FF8830" }}
              >
                <CheckCircle size={12} className="text-[#00FF88] flex-shrink-0" />
                <span className="text-[10px] font-mono text-[#00FF88]">
                  Скачано {bulkStatus.done} из {bulkStatus.total} треков
                </span>
                <button onClick={() => setBulkStatus(null)} className="ml-auto text-zinc-600 hover:text-zinc-400">
                  <X size={10} />
                </button>
              </div>
            )}

            {tracksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-14 bg-muted rounded-sm animate-pulse" />
                ))}
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music2 size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-mono">Плейлист пуст</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tracks.map(track => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isPlaying={currentTrack?.id === track.id}
                    onPlay={setCurrentTrack}
                    onCached={() => refetchTracks()}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Empty state */}
        {!selectedPlaylist && !playlistsLoading && playlists.length > 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <WaveformBars count={12} active={false} className="justify-center mb-4" />
            <p className="text-sm font-mono">Выберите плейлист выше</p>
            <p className="text-xs mt-1 opacity-60">чтобы увидеть треки</p>
          </div>
        )}
      </main>
    </div>
  );
}
