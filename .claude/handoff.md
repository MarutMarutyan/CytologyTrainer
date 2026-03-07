# Handoff — CytologyTrainer

## Последнее обновление
2026-03-08

## Что сделано

- Создана документация: `docs/project.md`
- Создан CLAUDE.md с правилами проекта
- Создана структура папок
- Инициализирован Git
- Создан скелет Telegram-бота (Node.js + Telegraf)

## Текущий статус

Проект только создан. Telegram-бот — базовый скелет, без реальных тестов.

## Следующие шаги

1. Получить токен бота у @BotFather в Telegram
2. Добавить реальные вопросы в `telegram-bot/src/data/questions.json`
3. Реализовать логику прохождения теста (шаг за шагом)
4. Протестировать бота вручную

## Ключевые файлы

- `docs/project.md` — описание проекта
- `telegram-bot/src/index.js` — точка входа бота
- `telegram-bot/src/data/questions.json` — вопросы для тестов
- `telegram-bot/.env.example` — нужные переменные окружения
