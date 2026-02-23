/**
 * WaveformCanvas — отображает статическую форму волны трека
 * и позицию воспроизведения. Клик по волне — перемотка.
 */
import { useRef, useEffect, useCallback } from "react";
import { engine } from "@/lib/audioEngine";

interface Props {
  deck: "A" | "B";
  waveformData: Float32Array | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  /** Hint from AI: "now" | "wait" | "urgent" | null */
  hint?: "now" | "wait" | "urgent" | null;
  accentColor?: string;
}

export default function WaveformCanvas({
  deck,
  waveformData,
  currentTime,
  duration,
  hint,
  accentColor = "#00FF88",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const progress = duration > 0 ? currentTime / duration : 0;
    const playX = Math.floor(progress * W);

    // Background
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);

    if (!waveformData || waveformData.length === 0) {
      // Empty state
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, H / 2 - 1, W, 2);
      return;
    }

    const barW = W / waveformData.length;

    // Draw bars
    for (let i = 0; i < waveformData.length; i++) {
      const x = i * barW;
      const barH = waveformData[i] * (H * 0.85);
      const y = (H - barH) / 2;

      const isPast = x < playX;
      ctx.fillStyle = isPast ? accentColor : "#2a2a2a";
      ctx.fillRect(x, y, Math.max(barW - 1, 1), barH);
    }

    // Playhead line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, H);
    ctx.stroke();

    // AI hint overlay
    if (hint === "now") {
      // Green zone: 65–85% of track
      const x1 = W * 0.65;
      const x2 = W * 0.85;
      ctx.fillStyle = "rgba(0,255,136,0.12)";
      ctx.fillRect(x1, 0, x2 - x1, H);
      ctx.strokeStyle = "rgba(0,255,136,0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, 0); ctx.lineTo(x1, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (hint === "urgent") {
      // Red flicker at the end
      ctx.fillStyle = "rgba(255,60,60,0.15)";
      ctx.fillRect(W * 0.88, 0, W * 0.12, H);
    }

    // Realtime waveform overlay (oscilloscope)
    const realtimeData = engine.getRealtimeWaveform(deck);
    if (realtimeData.length > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const sliceW = W / realtimeData.length;
      for (let i = 0; i < realtimeData.length; i++) {
        const v = realtimeData[i] / 128.0;
        const y = (v * H) / 2;
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * sliceW, y);
      }
      ctx.stroke();
    }
  }, [waveformData, currentTime, duration, hint, accentColor, deck]);

  useEffect(() => {
    const loop = () => {
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (duration === 0) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    engine.seek(deck, ratio * duration);
  }, [deck, duration]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      onClick={handleClick}
      className="w-full h-full cursor-crosshair rounded"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
