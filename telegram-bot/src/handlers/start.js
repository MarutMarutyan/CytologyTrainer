/**
 * Обработчик команды /start
 */
const { trackUser } = require('../users');
const { processReferral } = require('./referral');

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    trackUser(ctx);

    // Обработка реферальной ссылки (?start=ref_USERID)
    const payload = ctx.startPayload;
    if (payload && payload.startsWith('ref_')) {
      const referrerId = payload.replace('ref_', '');
      const success = processReferral(ctx.from.id, referrerId);
      if (success) {
        try {
          await ctx.telegram.sendMessage(
            referrerId,
            `🎉 По твоей ссылке присоединился новый коллега!\nНачислено +20 бонусных тестов.\n\n/referral — посмотреть статистику`
          );
        } catch (e) {
          // Пользователь мог заблокировать бота — игнорируем
        }
      }
    }

    const name = ctx.from.first_name || 'коллега';
    ctx.reply(
      `Добро пожаловать, ${name}! 👋\n\n` +
      `Я бот платформы *CytologyTrainer* — помогаю изучать клиническую цитологию по международным стандартам.\n\n` +
      `*Что я умею:*\n` +
      `📖 /learn — изучить теорию по темам\n` +
      `📝 /test — пройти тест по гинекологической цитологии (Bethesda)\n` +
      `📊 /stats — моя статистика и прогресс\n` +
      `🔗 /referral — пригласить коллегу и получить бонусы\n` +
      `ℹ️ /help — помощь и список команд\n\n` +
      `Начнём?`,
      { parse_mode: 'Markdown' }
    );
  });
}

module.exports = { registerStartHandler };
