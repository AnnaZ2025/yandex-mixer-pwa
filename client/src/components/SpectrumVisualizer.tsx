/**
 * SpectrumVisualizer — анимированный частотный спектр для обеих дек.
 * Использует AnalyserNode из audioEngine для получения данных в реальном времени.
 * Design: Dark Studio — зелёный (#00FF88) для деки A, оранжевый (#FF6B35) для деки B
 */
import { useEffect, useRef } from "react";
import { engine } from "@/lib/audioEngine";

interface Props {
  isPlayingA: boolean;
  isPlayingB: boolean;
}

export default function SpectrumVisualizer({ isPlayingA, isPlayingB }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ACCENT_A = "#00FF88";
    const ACCENT_B = "#FF6B35";
    const BAR_COUNT = 48;
    const BAR_GAP = 2;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, W, H);

      // Center line
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, H / 2 - 1, W, 1);

      const barW = (W - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

      const drawBars = (freqData: Uint8Array, color: string, flip: boolean) => {
        // Subsample frequency data to BAR_COUNT bars
        const step = Math.floor(freqData.length / BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += freqData[i * step + j];
          }
          const avg = sum / step;
          const normalized = avg / 255;
          const barH = normalized * (H / 2 - 4);

          const x = i * (barW + BAR_GAP);
          const y = flip ? H / 2 - barH : H / 2;

          // Gradient per bar
          const grad = ctx.createLinearGradient(x, flip ? H / 2 - barH : H / 2, x, flip ? H / 2 : H / 2 + barH);
          grad.addColorStop(0, color);
          grad.addColorStop(1, color + "22");
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barW, barH);
        }
      };

      // Deck A — top half (mirrored up)
      const freqA = engine.getRealtimeFrequency("A");
      if (freqA.length > 0) {
        drawBars(freqA, ACCENT_A, true);
      } else if (isPlayingA) {
        // Idle animation when playing but no data yet
        for (let i = 0; i < BAR_COUNT; i++) {
          const h = Math.sin(Date.now() / 300 + i * 0.3) * 3 + 4;
          ctx.fillStyle = ACCENT_A + "40";
          ctx.fillRect(i * (barW + BAR_GAP), H / 2 - h, barW, h);
        }
      }

      // Deck B — bottom half
      const freqB = engine.getRealtimeFrequency("B");
      if (freqB.length > 0) {
        drawBars(freqB, ACCENT_B, false);
      } else if (isPlayingB) {
        for (let i = 0; i < BAR_COUNT; i++) {
          const h = Math.sin(Date.now() / 300 + i * 0.3 + Math.PI) * 3 + 4;
          ctx.fillStyle = ACCENT_B + "40";
          ctx.fillRect(i * (barW + BAR_GAP), H / 2, barW, h);
        }
      }

      // Labels
      ctx.font = "9px monospace";
      ctx.fillStyle = "#333";
      ctx.fillText("A", 4, 12);
      ctx.fillText("B", 4, H - 4);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlayingA, isPlayingB]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={80}
      className="w-full rounded-xl"
      style={{ display: "block", background: "#080808" }}
    />
  );
}
