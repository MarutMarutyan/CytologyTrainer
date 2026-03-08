/**
 * Команда /admin — статистика пользователей (только для владельца)
 */
const { getUserStats } = require('../users');

function registerAdminHandler(bot) {
  bot.command('admin', (ctx) => {
    const adminId = process.env.ADMIN_TELEGRAM_ID;

    // Проверяем что это владелец
    if (!adminId || String(ctx.from.id) !== String(adminId)) {
      return ctx.reply('Команда недоступна.');
    }

    const { total, today, week, recent } = getUserStats();

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
}

module.exports = { registerAdminHandler };
