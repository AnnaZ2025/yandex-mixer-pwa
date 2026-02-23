/**
 * OnboardingOverlay — пошаговое руководство для новичка.
 * Показывает 5 шагов с анимацией, подсветкой и стрелками.
 * Сохраняет статус в localStorage, показывается только один раз.
 */
import { useState, useEffect } from "react";
import { ChevronRight, X, Zap, Music2, Sliders, ArrowLeftRight, Play } from "lucide-react";

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
  highlight: string; // CSS selector или описание элемента
  emoji: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    icon: <Music2 className="w-8 h-8" />,
    title: "Шаг 1 из 5 — Загрузи трек на Деку A",
    description: "Нажми на блок «Выбрать трек» в верхней деке (зелёная рамка). Откроется список твоих плейлистов из Яндекс Музыки.",
    tip: "Выбери плейлист → выбери трек. Если трек не скачан, он загрузится автоматически (это займёт 10–30 секунд).",
    highlight: "deck-a",
    emoji: "🎵",
  },
  {
    id: 2,
    icon: <Music2 className="w-8 h-8" />,
    title: "Шаг 2 из 5 — Загрузи трек на Деку B",
    description: "Теперь нажми на блок «Выбрать трек» в нижней деке (оранжевая рамка). Это будет следующий трек в миксе.",
    tip: "Выбирай треки с похожим BPM — AI покажет совместимость в процентах. Чем выше, тем чище переход.",
    highlight: "deck-b",
    emoji: "🎶",
  },
  {
    id: 3,
    icon: <Play className="w-8 h-8" />,
    title: "Шаг 3 из 5 — Запусти оба трека",
    description: "Нажми кнопку ▶ на Деке A, подожди несколько секунд, затем нажми ▶ на Деке B. Оба трека будут играть одновременно!",
    tip: "Кнопка SYNC выравнивает темп (BPM) второго трека под первый — это делает переход плавнее.",
    highlight: "play-buttons",
    emoji: "▶️",
  },
  {
    id: 4,
    icon: <ArrowLeftRight className="w-8 h-8" />,
    title: "Шаг 4 из 5 — Двигай кроссфейдер",
    description: "Большой ползунок посередине — это кроссфейдер. Тяни его влево, чтобы слышать Деку A, вправо — Деку B.",
    tip: "Медленно тяни фейдер во время перехода — это и есть настоящий DJ-микс! AI подскажет лучший момент.",
    highlight: "crossfader",
    emoji: "🎚️",
  },
  {
    id: 5,
    icon: <Sliders className="w-8 h-8" />,
    title: "Шаг 5 из 5 — Управляй EQ",
    description: "Три ручки на каждой деке (BASS / MID / TREBLE) управляют частотами. Крути их пальцем вверх/вниз.",
    tip: "Классический приём: перед переходом убери BASS на входящем треке, а после перехода — подними. Двойное касание сбрасывает в центр.",
    highlight: "eq-knobs",
    emoji: "🎛️",
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const current = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimating(false);
      }, 250);
    } else {
      localStorage.setItem("dj_onboarding_done", "1");
      onComplete();
    }
  };

  const skip = () => {
    localStorage.setItem("dj_onboarding_done", "1");
    onComplete();
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
    >
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button
          onClick={skip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        >
          <X className="w-3 h-3" />
          Пропустить
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 px-4">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? "24px" : "8px",
              height: "8px",
              background: i <= step ? "#00FF88" : "#2a2a2a",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 gap-6"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(10px)" : "translateY(0)",
          transition: "opacity 0.25s, transform 0.25s",
        }}
      >
        {/* Emoji + Icon */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #00FF8820, #00FF8808)",
              border: "1px solid #00FF8840",
              boxShadow: "0 0 40px #00FF8815",
              color: "#00FF88",
            }}
          >
            {current.icon}
          </div>
          <div
            className="absolute -top-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "#111", border: "1px solid #2a2a2a" }}
          >
            {current.emoji}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" style={{ color: "#00FF88" }} />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            AI Обучение
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-xl font-bold text-center leading-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "#fff" }}
        >
          {current.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-zinc-300 text-center leading-relaxed max-w-sm">
          {current.description}
        </p>

        {/* Tip box */}
        <div
          className="w-full max-w-sm p-4 rounded-xl"
          style={{
            background: "#00FF8808",
            border: "1px solid #00FF8825",
          }}
        >
          <div className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="font-semibold" style={{ color: "#00FF88" }}>Совет: </span>
              {current.tip}
            </p>
          </div>
        </div>

        {/* Visual guide for crossfader step */}
        {current.highlight === "crossfader" && (
          <div className="w-full max-w-sm">
            <div
              className="relative h-14 rounded-full flex items-center px-2"
              style={{
                background: "linear-gradient(90deg, #00FF8822 0%, #1a1a1a 50%, #FF6B3522 100%)",
                border: "1px solid #2a2a2a",
              }}
            >
              <span className="text-xs font-mono font-bold" style={{ color: "#00FF88" }}>A</span>
              <div className="flex-1 flex justify-center">
                <div
                  className="w-12 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "#2a2a2a", border: "2px solid #444" }}
                >
                  <div className="flex flex-col gap-0.5">
                    {[0,1,2].map(i => <div key={i} className="w-4 h-px bg-zinc-500" />)}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: "#FF6B35" }}>B</span>
              {/* Arrow animation */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ animation: "pulse 2s infinite" }}
              >
                <span className="text-2xl" style={{ animation: "bounce 1s infinite" }}>👈</span>
              </div>
            </div>
            <p className="text-[10px] text-center text-zinc-600 mt-2 font-mono">
              ← тяни влево для Деки A · тяни вправо для Деки B →
            </p>
          </div>
        )}

        {/* Visual guide for EQ step */}
        {current.highlight === "eq-knobs" && (
          <div className="flex items-end gap-6 justify-center">
            {["BASS", "MID", "TREBLE"].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center relative"
                  style={{
                    background: "conic-gradient(#00FF88 0deg, #00FF88 200deg, #1a1a1a 200deg)",
                    boxShadow: "0 0 12px #00FF8830",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "#111" }}
                  >
                    <div className="w-1 h-3 rounded-full" style={{ background: "#00FF88", transform: `rotate(${-30 + i * 30}deg)` }} />
                  </div>
                </div>
                <span className="text-[9px] font-mono text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="p-6 pb-8">
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-mono font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          style={{
            background: isLast
              ? "linear-gradient(135deg, #00FF88, #00CC66)"
              : "linear-gradient(135deg, #00FF8820, #00FF8808)",
            border: `1px solid ${isLast ? "#00FF88" : "#00FF8840"}`,
            color: isLast ? "#000" : "#00FF88",
            boxShadow: isLast ? "0 0 30px #00FF8840" : "none",
          }}
        >
          {isLast ? (
            <>
              <Play className="w-5 h-5" />
              Начать миксовать!
            </>
          ) : (
            <>
              Понятно, дальше
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
