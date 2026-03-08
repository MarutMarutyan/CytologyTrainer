const { getUserStats } = require('../stats');

const CATEGORY_LABELS = {
  'specimen_adequacy': 'Адекватность препарата',
  'NILM': 'NILM (норма)',
  'ASC': 'ASC (атипичные клетки)',
  'LSIL': 'LSIL (низкоградусное)',
  'HSIL': 'HSIL (высокоградусное)',
  'glandular': 'Железистые аномалии',
  'general': 'Общие вопросы',
  'thyroid_general': 'ЩЖ: Общие',
  'thyroid_I': 'ЩЖ: Кат. I',
  'thyroid_II': 'ЩЖ: Кат. II',
  'thyroid_III': 'ЩЖ: Кат. III',
  'thyroid_IV': 'ЩЖ: Кат. IV',
  'thyroid_V': 'ЩЖ: Кат. V',
  'thyroid_VI': 'ЩЖ: Кат. VI',
};

/**
 * Форматирует прогресс-бар
 */
function progressBar(percent) {
  const filled = Math.round(percent / 10);
  return '▓'.repeat(filled) + '░'.repeat(10 - filled);
}

/**
 * Обработчик команды /stats
 */
function registerStatsHandler(bot) {
  bot.command('stats', async (ctx) => {
    const stats = getUserStats(ctx.from.id);

    if (!stats) {
      await ctx.reply(
        'У тебя пока нет статистики.\n\n' +
        'Пройди первый тест: /test',
      );
      return;
    }

    const percent = Math.round((stats.totalCorrect / stats.totalAnswered) * 100);

    // Общая статистика
    let text = `📊 *Твоя статистика*\n\n`;
    text += `Тестов пройдено: *${stats.testsCompleted}*\n`;
    text += `Всего ответов: *${stats.totalAnswered}*\n`;
    text += `Правильных: *${stats.totalCorrect}* (${percent}%)\n`;
    text += `${progressBar(percent)}\n\n`;

    // По категориям
    text += `*По темам:*\n`;
    for (const [cat, data] of Object.entries(stats.categories)) {
      const catPercent = Math.round((data.correct / data.total) * 100);
      const label = CATEGORY_LABELS[cat] || cat;
      const icon = catPercent >= 80 ? '🟢' : catPercent >= 50 ? '🟡' : '🔴';
      text += `${icon} ${label}: ${data.correct}/${data.total} (${catPercent}%)\n`;
    }

    // Последние тесты
    if (stats.history.length > 0) {
      text += `\n*Последние тесты:*\n`;
      const recent = stats.history.slice(-5).reverse();
      for (const h of recent) {
        const date = new Date(h.date);
        const dateStr = date.toLocaleDateString('ru-RU', {
          day: '2-digit', month: '2-digit',
        });
        const catLabel = h.category === 'all'
          ? 'Все темы'
          : (CATEGORY_LABELS[h.category] || h.category);
        text += `${dateStr} — ${catLabel}: ${h.score}/${h.total}\n`;
      }
    }

    // Рекомендация
    const weakest = Object.entries(stats.categories)
      .filter(([, d]) => d.total >= 3)
      .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));

    if (weakest.length > 0) {
      const [weakCat] = weakest[0];
      const weakLabel = CATEGORY_LABELS[weakCat] || weakCat;
      text += `\n💡 *Рекомендация:* повтори тему «${weakLabel}»`;
    }

    text += `\n\nДля нового теста: /test`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  });
}

module.exports = { registerStatsHandler };
