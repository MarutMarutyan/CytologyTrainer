const theory = require('../data/theory.json');

const CATEGORIES = Object.keys(theory);

/**
 * Отправляет секцию теории пользователю
 */
async function sendSection(ctx, categoryKey, sectionIndex) {
  const cat = theory[categoryKey];
  if (!cat) return;

  const section = cat.sections[sectionIndex];
  if (!section) return;

  const total = cat.sections.length;
  const current = sectionIndex + 1;

  const text =
    `${cat.icon} *${cat.title}*\n` +
    `_(${current} из ${total})_\n\n` +
    `*${section.subtitle}*\n\n` +
    section.text;

  // Кнопки навигации
  const nav = [];

  if (sectionIndex > 0) {
    nav.push({ text: '⬅️ Назад', callback_data: `learn:${categoryKey}:${sectionIndex - 1}` });
  }

  if (sectionIndex < total - 1) {
    nav.push({ text: 'Далее ➡️', callback_data: `learn:${categoryKey}:${sectionIndex + 1}` });
  }

  const keyboard = [];
  if (nav.length > 0) keyboard.push(nav);

  // Кнопка «Пройти тест»
  keyboard.push([
    { text: `📝 Тест: ${cat.title}`, callback_data: `test_cat:${categoryKey}` },
  ]);

  // Кнопка «К списку тем»
  keyboard.push([
    { text: '📖 К списку тем', callback_data: 'learn_menu' },
  ]);

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard },
  });
}

/**
 * Обработчик команды /learn
 */
function registerLearnHandler(bot) {
  // /learn — меню выбора темы
  bot.command('learn', async (ctx) => {
    const keyboard = CATEGORIES.map(key => ([{
      text: `${theory[key].icon} ${theory[key].title}`,
      callback_data: `learn:${key}:0`,
    }]));

    await ctx.reply(
      '📖 *Режим обучения*\n\n' +
      'Выбери тему для изучения.\n' +
      'После теории можно сразу пройти тест!',
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  });

  // Возврат к меню тем
  bot.action('learn_menu', async (ctx) => {
    await ctx.answerCbQuery();

    const keyboard = CATEGORIES.map(key => ([{
      text: `${theory[key].icon} ${theory[key].title}`,
      callback_data: `learn:${key}:0`,
    }]));

    await ctx.reply(
      '📖 *Режим обучения*\n\nВыбери тему:',
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  });

  // Навигация по секциям теории
  bot.action(/^learn:(\w+):(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const categoryKey = ctx.match[1];
    const sectionIndex = parseInt(ctx.match[2], 10);
    await sendSection(ctx, categoryKey, sectionIndex);
  });
}

module.exports = { registerLearnHandler };
