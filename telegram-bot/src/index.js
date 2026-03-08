require('dotenv').config();
const { Telegraf } = require('telegraf');

const { registerStartHandler } = require('./handlers/start');
const { registerTestHandler } = require('./handlers/test');
const { registerStatsHandler } = require('./handlers/stats');
const { registerHelpHandler } = require('./handlers/help');
const { registerLearnHandler } = require('./handlers/learn');
const { registerAdminHandler } = require('./handlers/admin');
const { trackUser } = require('./users');

// Проверяем токен
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN не задан в .env файле');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Регистрируем обработчики
registerStartHandler(bot);
registerHelpHandler(bot);
registerLearnHandler(bot);
registerStatsHandler(bot);
registerAdminHandler(bot);
registerTestHandler(bot);

// Трекинг всех входящих сообщений
bot.on('message', (ctx) => trackUser(ctx));

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
