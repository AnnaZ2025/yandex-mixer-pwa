// AI Микшер — Руководство пользователя
// Mobile-first guide page with screenshots

export default function Guide() {
  const sections = [
    {
      id: "what",
      emoji: "🎧",
      title: "Что такое AI Микшер?",
      content: (
        <p className="text-gray-300 leading-relaxed">
          AI Микшер превращает твои плейлисты из Яндекс Музыки в живой DJ-сет. Два виниловых
          проигрывателя — <strong className="text-green-400">Дека A</strong> и{" "}
          <strong className="text-orange-400">Дека B</strong> — и кроссфейдер посередине для
          плавных переходов. Всё прямо с iPhone, без App Store.
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur border-b border-green-900/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-xs">▐▌</span>
          <span className="text-xs font-mono text-green-400 tracking-widest">AI MIXER</span>
        </div>
        <h1 className="text-lg font-bold mt-0.5">Руководство пользователя</h1>
      </div>

      <div className="px-4 pb-16 max-w-lg mx-auto">

        {/* Intro */}
        <div className="mt-6 p-4 rounded-xl bg-green-950/30 border border-green-800/40">
          <p className="text-gray-300 leading-relaxed text-sm">
            AI Микшер превращает твои плейлисты из Яндекс Музыки в живой DJ-сет.
            Два проигрывателя — <span className="text-green-400 font-semibold">Дека A</span> и{" "}
            <span className="text-orange-400 font-semibold">Дека B</span> — и кроссфейдер
            для плавных переходов. Всё прямо с iPhone, без App Store.
          </p>
        </div>

        {/* Section: Install */}
        <Section emoji="📲" title="Установка на iPhone">
          <Steps steps={[
            "Открой Safari и перейди на yandex-mixer-pwa.vercel.app",
            "Нажми кнопку Поделиться ↑ в нижней панели Safari",
            'Выбери «На экран "Домой"»',
            "Нажми Добавить — иконка появится на рабочем столе",
          ]} />
          <Note>Приложение работает только когда Mac включён и подключён к интернету.</Note>
        </Section>

        {/* Section: Home screen */}
        <Section emoji="🏠" title="Главный экран">
          <Screenshot
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663175539117/oGZRCmHhSNFyKEmZ.png"
            alt="Главный экран"
          />
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            На главном экране видны все твои плейлисты из Яндекс Музыки. Зелёная надпись{" "}
            <span className="text-green-400 font-mono">ONLINE</span> означает, что бэкенд работает
            и музыка доступна. Прокручивай ленту плейлистов вправо, чтобы увидеть все.
          </p>
        </Section>

        {/* Section: Tracks */}
        <Section emoji="🎵" title="Просмотр треков">
          <Screenshot
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663175539117/zEHvISTWpXjQpPVD.png"
            alt="Список треков"
          />
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            Нажми на плейлист — появится список треков с обложками и длительностью. Кнопка{" "}
            <span className="text-white font-semibold">↓</span> справа от трека скачивает его на Mac.
            Кнопка <span className="text-white font-semibold">«Скачать все»</span> загружает весь
            плейлист сразу — удобно делать заранее.
          </p>
          <Note>Первая загрузка трека занимает 10–30 секунд. Повторное воспроизведение — мгновенно.</Note>
        </Section>

        {/* Section: DJ Deck */}
        <Section emoji="🎛️" title="DJ Стол">
          <Screenshot
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663175539117/jBGejvoTvlpLKqtq.png"
            alt="DJ Стол"
          />
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            DJ Стол — главный экран приложения. Он состоит из трёх частей:
          </p>
          <div className="mt-3 space-y-2">
            <FeatureRow color="green" label="Дека A" desc="Текущий играющий трек" />
            <FeatureRow color="orange" label="Дека B" desc="Следующий трек для перехода" />
            <FeatureRow color="gray" label="Кроссфейдер" desc="Слайдер перехода A → B" />
          </div>
        </Section>

        {/* Section: Crossfader */}
        <Section emoji="🎚️" title="Кроссфейдер и AI Подсказка">
          <Screenshot
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663175539117/gwYAUNZMiDDCQyjv.png"
            alt="Кроссфейдер"
          />
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            Кроссфейдер — горизонтальный слайдер между деками. Тяни влево — слышна только Дека A,
            вправо — только Дека B, посередине — обе сразу.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed mt-2">
            Внизу экрана всегда видна <span className="text-green-400 font-semibold">AI Подсказка</span> —
            она подсказывает следующий шаг в реальном времени.
          </p>
        </Section>

        {/* Section: How to start */}
        <Section emoji="▶️" title="Как начать слушать">
          <Steps steps={[
            "Нажми «Выбрать трек» на Деке A → выбери плейлист → выбери трек",
            "Нажми кнопку ▶ — трек начнёт играть",
            "Пока играет Дека A — загрузи трек на Деку B",
            "Нажми ▶ на Деке B, затем тяни кроссфейдер вправо",
          ]} />
        </Section>

        {/* Section: Onboarding */}
        <Section emoji="🎓" title="Встроенное обучение">
          <Screenshot
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663175539117/oyAmCPNNSJmQVyhs.png"
            alt="Обучение"
          />
          <p className="text-gray-300 text-sm leading-relaxed mt-3">
            При первом открытии DJ Стола запускается интерактивное обучение из 5 шагов.
            Чтобы пройти его снова — нажми кнопку <span className="text-white font-semibold">«Обучение»</span> внизу экрана.
          </p>
        </Section>

        {/* Section: Advanced */}
        <Section emoji="⚡" title="Продвинутые функции">
          <div className="space-y-3">
            <AdvancedFeature
              tag="AUTO"
              tagColor="bg-green-500"
              title="Автоматический переход"
              desc="Нажми AUTO — приложение само запустит Деку B, синхронизирует BPM и плавно переведёт кроссфейдер за 20 секунд. Кнопка STOP отменяет в любой момент."
            />
            <AdvancedFeature
              tag="SYNC"
              tagColor="bg-blue-500"
              title="Синхронизация темпа"
              desc="Выравнивает BPM Деки B под Деку A. Нажми перед переходом — треки не собьются в разные ритмы."
            />
            <AdvancedFeature
              tag="CUE"
              tagColor="bg-yellow-500"
              title="Метка точки входа"
              desc="Двойное нажатие — установить метку. Одиночное — прыгнуть к метке. Удобно для старта трека с нужного момента."
            />
            <AdvancedFeature
              tag="LOOP"
              tagColor="bg-purple-500"
              title="Зациклить фрагмент"
              desc="Зацикливает 4-тактовый фрагмент. Нажми снова — луп выключится и трек продолжится."
            />
            <AdvancedFeature
              tag="EQ"
              tagColor="bg-orange-500"
              title="Эквалайзер"
              desc="Три ручки: BASS (бас), MID (вокал), TREBLE (верха). Крути вверх — усиливаешь, вниз — убираешь."
            />
          </div>
        </Section>

        {/* Section: Cheatsheet */}
        <Section emoji="📋" title="Шпаргалка">
          <div className="rounded-xl overflow-hidden border border-gray-800">
            {[
              ["Выбрать трек", "Нажать «Выбрать трек»"],
              ["Play / Пауза", "Кнопка ▶ / ⏸"],
              ["В начало", "Кнопка ⏮"],
              ["Переход A→B", "Тянуть кроссфейдер вправо"],
              ["Автопереход", "Кнопка AUTO"],
              ["Синхронизация", "Кнопка SYNC"],
              ["Метка", "Двойное нажатие CUE"],
              ["Луп", "Кнопка LOOP"],
              ["Бас", "Ручка BASS"],
            ].map(([action, how], i) => (
              <div
                key={i}
                className={`flex justify-between items-center px-3 py-2.5 text-sm ${
                  i % 2 === 0 ? "bg-gray-900/60" : "bg-gray-900/30"
                }`}
              >
                <span className="text-gray-400">{action}</span>
                <span className="text-white font-medium text-right ml-4">{how}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Section: Troubleshooting */}
        <Section emoji="🔧" title="Если что-то не работает">
          <div className="space-y-3">
            <TroubleItem
              problem="Показывает OFFLINE"
              solution="Нужно запустить Mac: бэкенд + ngrok туннель"
            />
            <TroubleItem
              problem="Трек долго загружается"
              solution="Нормально при первом скачивании — подожди 10–30 сек"
            />
            <TroubleItem
              problem="Звук не воспроизводится"
              solution="Нажми ▶ пальцем — Safari требует ручного первого нажатия"
            />
            <TroubleItem
              problem="Иконка не открывается"
              solution="Открой Safari → yandex-mixer-pwa.vercel.app напрямую"
            />
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600 pb-4">
          AI Микшер · Версия 1.0 · Февраль 2026
        </div>
      </div>
    </div>
  );
}

// Helper components
function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <h2 className="text-base font-bold flex items-center gap-2 mb-3">
        <span>{emoji}</span>
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg">
      <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-900/60 border border-green-700 text-green-400 text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
        </div>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 px-3 py-2 rounded-lg bg-yellow-950/30 border border-yellow-800/40 text-yellow-300 text-xs leading-relaxed">
      ⚠️ {children}
    </div>
  );
}

function FeatureRow({ color, label, desc }: { color: string; label: string; desc: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-900/40 border-green-700/50 text-green-400",
    orange: "bg-orange-900/40 border-orange-700/50 text-orange-400",
    gray: "bg-gray-800/40 border-gray-700/50 text-gray-300",
  };
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${colors[color]}`}>
      <span className="font-bold text-sm w-24 flex-shrink-0">{label}</span>
      <span className="text-gray-400 text-sm">{desc}</span>
    </div>
  );
}

function AdvancedFeature({ tag, tagColor, title, desc }: { tag: string; tagColor: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start p-3 rounded-xl bg-gray-900/50 border border-gray-800">
      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white ${tagColor}`}>
        {tag}
      </span>
      <div>
        <p className="text-white text-sm font-semibold">{title}</p>
        <p className="text-gray-400 text-xs leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function TroubleItem({ problem, solution }: { problem: string; solution: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">
      <p className="text-red-400 text-sm font-semibold">❌ {problem}</p>
      <p className="text-gray-300 text-sm mt-1">✅ {solution}</p>
    </div>
  );
}
