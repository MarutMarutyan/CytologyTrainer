/**
 * Обработчик команды /start
 */
const { trackUser } = require('../users');

function registerStartHandler(bot) {
  bot.start((ctx) => {
    trackUser(ctx);
    const name = ctx.from.first_name || 'коллега';
    ctx.reply(
      `Добро пожаловать, ${name}! 👋\n\n` +
      `Я бот платформы *CytologyTrainer* — помогаю изучать клиническую цитологию по международным стандартам.\n\n` +
      `*Что я умею:*\n` +
      `📖 /learn — изучить теорию по темам\n` +
      `📝 /test — пройти тест по гинекологической цитологии (Bethesda)\n` +
      `📊 /stats — моя статистика и прогресс\n` +
      `ℹ️ /help — помощь и список команд\n\n` +
      `Начнём?`,
      { parse_mode: 'Markdown' }
    );
  });
}

module.exports = { registerStartHandler };
