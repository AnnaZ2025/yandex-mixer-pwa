/**
 * useApi — хук для работы с локальным FastAPI бэкендом.
 * Базовый URL берётся из переменной окружения VITE_API_BASE_URL,
 * что позволяет легко переключаться между localhost и ngrok.
 */

import { useState, useEffect, useCallback } from "react";

// В режиме разработки — localhost, в продакшне — ngrok URL из env
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";

// Заголовки для обхода страницы предупреждения ngrok
const NGROK_HEADERS: HeadersInit = API_BASE.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: { ...NGROK_HEADERS, ...(options?.headers || {}) },
  });
}

export interface Playlist {
  kind: number;
  title: string;
  track_count: number;
  cover_uri: string | null;
}

export interface Track {
  id: string;
  title: string;
  artists: string[];
  album: string;
  duration_ms: number;
  cover_uri: string | null;
  is_cached: boolean;
  cache_url: string | null;
  cache_trigger_url: string;
}

export interface ServerStatus {
  status: "ok" | "error";
  username: string;
}

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setError("Сервер недоступен. Убедитесь, что main.py запущен на вашем Mac.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  return { status, loading, error, refetch: check };
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`${API_BASE}/api/playlists`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { if (!cancelled) setPlaylists(data); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { playlists, loading, error };
}

export function usePlaylistTracks(playlistKind: number | null) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = useCallback(async (kind: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/playlists/${kind}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTracks(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (playlistKind !== null) fetchTracks(playlistKind);
    else setTracks([]);
  }, [playlistKind, fetchTracks]);

  return { tracks, loading, error, refetch: () => playlistKind && fetchTracks(playlistKind) };
}

export async function cacheTrack(trackId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/tracks/${trackId}/cache`, { method: "POST" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function getCachedTrackUrl(trackId: string): string {
  return `${API_BASE}/api/cached_tracks/${trackId}.mp3`;
}

export { API_BASE };
