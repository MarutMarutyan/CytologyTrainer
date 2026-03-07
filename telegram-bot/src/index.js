require('dotenv').config();
const { Telegraf } = require('telegraf');

const { registerStartHandler } = require('./handlers/start');
const { registerTestHandler } = require('./handlers/test');
const { registerHelpHandler } = require('./handlers/help');

// Проверяем токен
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN не задан в .env файле');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Регистрируем обработчики
registerStartHandler(bot);
registerHelpHandler(bot);
registerTestHandler(bot);

// Запускаем бота
bot.launch()
  .then(() => console.log('Бот запущен! Нажми Ctrl+C для остановки.'))
  .catch((err) => {
    console.error('Ошибка запуска:', err.message);
    process.exit(1);
  });

// Корректная остановка по Ctrl+C
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
