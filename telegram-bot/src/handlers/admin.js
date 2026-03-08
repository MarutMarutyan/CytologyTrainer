/**
 * Команда /admin — статистика пользователей (только для владельца)
 */
const { getUserStats } = require('../users');
const { postQuestionOfDay } = require('../scheduler');

function registerAdminHandler(bot) {
  bot.command('admin', async (ctx) => {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    const userId = String(ctx.from.id);

    if (!adminId || userId !== adminId) {
      return ctx.reply('Команда недоступна.');
    }

    let total = 0, today = 0, week = 0, recent = [];
    try {
      const stats = getUserStats();
      total = stats.total; today = stats.today; week = stats.week; recent = stats.recent;
    } catch (err) {
      console.error('Ошибка getUserStats:', err.message);
    }

    let text = `📊 *Статистика CytologyTrainer*\n\n`;
    text += `👥 Всего пользователей: *${total}*\n`;
    text += `🆕 Новых сегодня: *${today}*\n`;
    text += `📅 Новых за неделю: *${week}*\n\n`;

    if (recent.length > 0) {
      text += `*Последние активные:*\n`;
      recent.forEach((u, i) => {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Без имени';
        const username = u.username ? ` (@${u.username})` : '';
        const date = new Date(u.lastActive).toLocaleDateString('ru-RU');
        text += `${i + 1}. ${name}${username} — ${date}\n`;
      });
    } else {
      text += '_Пользователей пока нет_';
    }

    ctx.reply(text, { parse_mode: 'Markdown' });
  });

  bot.command('testpost', async (ctx) => {
    const adminId = process.env.ADMIN_TELEGRAM_ID;
    const userId = String(ctx.from.id);

    if (!adminId || userId !== adminId) {
      return ctx.reply('Команда недоступна.');
    }

    try {
      await postQuestionOfDay(bot);
      ctx.reply('✅ Тестовый пост опубликован в канале!');
    } catch (err) {
      ctx.reply(`❌ Ошибка: ${err.message}`);
    }
  });
}

module.exports = { registerAdminHandler };
