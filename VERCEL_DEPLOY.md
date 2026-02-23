# Деплой AI Микшер на Vercel

## Что нужно перед деплоем

1. Аккаунт на [vercel.com](https://vercel.com)
2. Репозиторий на GitHub с кодом проекта
3. ngrok запущен на Mac с командой:
   ```
   ngrok http --domain=aortal-unoxygenized-herma.ngrok-free.dev 8000
   ```

---

## Шаг 1: Экспорт кода на GitHub

В Manus откройте **Management UI → Settings → GitHub** и нажмите **Export to GitHub**.
Это создаст приватный репозиторий с полным кодом проекта.

---

## Шаг 2: Импорт на Vercel

1. Зайдите на [vercel.com/new](https://vercel.com/new)
2. Нажмите **Import Git Repository**
3. Выберите репозиторий `yandex-mixer-pwa`
4. Vercel автоматически определит настройки из `vercel.json`

---

## Шаг 3: Переменные окружения

В разделе **Environment Variables** добавьте:

| Переменная | Значение |
|---|---|
| `VITE_API_BASE_URL` | `https://aortal-unoxygenized-herma.ngrok-free.dev` |

Остальные переменные (`VITE_ANALYTICS_*`) можно оставить пустыми.

---

## Шаг 4: Deploy

Нажмите **Deploy**. Через ~1 минуту приложение будет доступно по адресу вида:
`https://yandex-mixer-pwa.vercel.app`

---

## Шаг 5: Установка на iPhone

1. Откройте URL приложения в Safari на iPhone
2. Нажмите кнопку **Поделиться** (квадрат со стрелкой вверх)
3. Выберите **На экран «Домой»**
4. Нажмите **Добавить**

Приложение установится как PWA с иконкой на рабочем столе.

---

## Важно: ngrok должен работать

Бэкенд (FastAPI на Mac) должен быть запущен при каждом использовании приложения:

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

## Обновление приложения

При изменении кода достаточно сделать `git push` в репозиторий — Vercel автоматически пересоберёт и задеплоит новую версию.
