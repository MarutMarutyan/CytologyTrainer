const cron = require('node-cron');
const questions = require('./data/questions.json');

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

// Случайный элемент массива
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Пост "Вопрос дня"
async function postQuestionOfDay(bot) {
  if (!CHANNEL_ID) return;

  const q = random(questions);
  const letters = ['A', 'B', 'C', 'D'];
  const options = q.options.map((opt, i) => `${letters[i]}. ${opt}`).join('\n');
  const correct = letters[q.correct];

  const text =
    `🔬 *Вопрос дня*\n\n` +
    `${q.question}\n\n` +
    `${options}\n\n` +
    `||✅ Ответ: *${correct}. ${q.options[q.correct]}*\n\n` +
    `${q.explanation}||\n\n` +
    `📚 Учись в боте → @CytoBot_bot`;

  await bot.telegram.sendMessage(CHANNEL_ID, text, { parse_mode: 'MarkdownV2' });
}

// Пост "Факт недели" (понедельник)
async function postWeeklyFact(bot) {
  if (!CHANNEL_ID) return;

  const facts = [
    'Система Bethesda для цитологии шейки матки включает 6 категорий: NILM, ASC-US, LSIL, HSIL, AGC и злокачественность. Каждая категория определяет тактику ведения пациентки.',
    'Система TBSRTC для щитовидной железы также состоит из 6 категорий. Риск злокачественности при категории VI (Malignant) составляет 97–99%.',
    'Койлоцит — клетка с перинуклеарным просветлением и гиперхромным ядром. Это цитопатический эффект ВПЧ и главный признак LSIL.',
    'ТАБ (тонкоигольная аспирационная биопсия) — золотой стандарт цитологической диагностики щитовидной железы. Адекватный препарат требует минимум 6 групп по 10 фолликулярных клеток.',
    'HSIL объединяет CIN II и CIN III. Риск инвазивного рака при HSIL без лечения достигает 30% в течение 10 лет.',
    'Категория AUS/FLUS (щитовидная железа) — "серая зона". Риск злокачественности 10–30%. Рекомендуется повторная ТАБ или молекулярное тестирование.',
    'Нормальные эндоцервикальные клетки на LBP могут имитировать HSIL из-за скученности и гиперхромии. Ключ к различию — равномерный хроматин и сохранённые межклеточные границы.',
  ];

  const fact = random(facts);

  const text =
    `🧠 *Факт недели*\n\n` +
    `${fact}\n\n` +
    `📖 Проверь знания → @CytoBot_bot`;

  await bot.telegram.sendMessage(CHANNEL_ID, text, { parse_mode: 'Markdown' });
}

// Пост "Напоминание" (пятница)
async function postReminder(bot) {
  if (!CHANNEL_ID) return;

  const text =
    `⚡️ *Конец недели — отличное время для теста!*\n\n` +
    `Проверь свои знания по цитологии:\n` +
    `• Гинекологическая цитология (Bethesda)\n` +
    `• Цитология щитовидной железы (TBSRTC)\n\n` +
    `Бесплатно, на русском языке.\n\n` +
    `👉 @CytoBot_bot → /test`;

  await bot.telegram.sendMessage(CHANNEL_ID, text, { parse_mode: 'Markdown' });
}

function registerScheduler(bot) {
  if (!CHANNEL_ID) {
    console.log('TELEGRAM_CHANNEL_ID не задан — планировщик постов отключён');
    return;
  }

  // Вопрос дня — каждый день в 09:00 (UTC+4 Ереван = 05:00 UTC)
  cron.schedule('0 5 * * *', async () => {
    try {
      await postQuestionOfDay(bot);
      console.log('Вопрос дня опубликован');
    } catch (err) {
      console.error('Ошибка публикации вопроса дня:', err.message);
    }
  });

  // Факт недели — каждый понедельник в 10:00 (06:00 UTC)
  cron.schedule('0 6 * * 1', async () => {
    try {
      await postWeeklyFact(bot);
      console.log('Факт недели опубликован');
    } catch (err) {
      console.error('Ошибка публикации факта недели:', err.message);
    }
  });

  // Напоминание — каждую пятницу в 17:00 (13:00 UTC)
  cron.schedule('0 13 * * 5', async () => {
    try {
      await postReminder(bot);
      console.log('Напоминание опубликовано');
    } catch (err) {
      console.error('Ошибка публикации напоминания:', err.message);
    }
  });

  console.log('Планировщик постов запущен ✓');
}

module.exports = { registerScheduler, postQuestionOfDay, postWeeklyFact, postReminder };
