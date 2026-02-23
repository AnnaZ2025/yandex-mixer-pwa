# AI Микшер — Инструкция по запуску и деплою

## Ссылка на приложение

🎧 **https://yandex-mixer-pwa.vercel.app**

---

## Что нужно для работы

1. Mac с запущенным бэкендом (FastAPI)
2. ngrok туннель (статичный домен)
3. iPhone с Safari для установки PWA

---

## Ежедневный запуск (Mac)

Каждый раз перед использованием приложения запустите на Mac два терминала:

```bash
# Терминал 1: запустить бэкенд
cd ~/Desktop/yandex_mixer
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Терминал 2: запустить ngrok туннель
ngrok http --domain=aortal-unoxygenized-herma.ngrok-free.dev 8000
```

Фронтенд на Vercel работает всегда, но музыка загружается только когда Mac онлайн.

---

## Установка на iPhone

1. Откройте **https://yandex-mixer-pwa.vercel.app** в Safari на iPhone
2. Нажмите кнопку **Поделиться** (квадрат со стрелкой вверх)
3. Выберите **На экран «Домой»**
4. Нажмите **Добавить**

Приложение установится как PWA с иконкой на рабочем столе.

---

## Обновление приложения (если нужно передеплоить)

При изменении кода в Manus:
1. Сохраните чекпоинт в Manus
2. Vercel автоматически подхватит изменения из GitHub и пересоберёт проект

---

## Технические детали

| Компонент | Адрес |
|---|---|
| Фронтенд (Vercel) | https://yandex-mixer-pwa.vercel.app |
| Бэкенд (ngrok) | https://aortal-unoxygenized-herma.ngrok-free.dev |
| GitHub репозиторий | https://github.com/AnnaZ2025/yandex-mixer-pwa |
| Локальный бэкенд | http://localhost:8000 |

---

## Как задеплоить заново (если понадобится)

1. Зайдите на [vercel.com/new](https://vercel.com/new)
2. Нажмите **Import Git Repository** → выберите `AnnaZ2025/yandex-mixer-pwa`
3. В разделе **Environment Variables** добавьте:
   - `VITE_API_BASE_URL` = `https://aortal-unoxygenized-herma.ngrok-free.dev`
4. Нажмите **Deploy**
5. В Settings → Deployment Protection → отключите **Vercel Authentication**
