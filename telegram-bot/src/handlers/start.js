/**
 * Обработчик команды /start
 */
function registerStartHandler(bot) {
  bot.start((ctx) => {
    const name = ctx.from.first_name || 'коллега';
    ctx.reply(
      `Добро пожаловать, ${name}! 👋\n\n` +
      `Я бот платформы *CytologyTrainer* — помогаю изучать клиническую цитологию по международным стандартам.\n\n` +
      `*Что я умею:*\n` +
      `📝 /test — пройти тест по гинекологической цитологии (Bethesda)\n` +
      `📊 /stats — моя статистика и прогресс\n` +
      `ℹ️ /help — помощь и список команд\n\n` +
      `Начнём?`,
      { parse_mode: 'Markdown' }
    );
  });
}

module.exports = { registerStartHandler };
