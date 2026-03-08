const allQuestions = require('../data/questions.json');
const { recordTestResult } = require('../stats');

// Хранилище активных сессий: userId -> { questions, questionIndex, score }
const sessions = new Map();

// Количество вопросов в одном тесте
const TEST_SIZE = 10;

// Названия категорий на русском
const CATEGORY_LABELS = {
  'specimen_adequacy': 'Адекватность препарата',
  'NILM': 'NILM (норма)',
  'ASC': 'ASC (атипичные клетки)',
  'LSIL': 'LSIL (низкоградусное)',
  'HSIL': 'HSIL (высокоградусное)',
  'glandular': 'Железистые аномалии',
  'general': 'Общие вопросы'
};

/**
 * Перемешивает массив (Fisher-Yates)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Отправляет вопрос пользователю
 */
// Кириллические буквы для вариантов ответов
const LETTERS = ['А', 'Б', 'В', 'Г'];

async function sendQuestion(ctx, session) {
  const q = session.questions[session.questionIndex];
  const total = session.questions.length;
  const current = session.questionIndex + 1;

  const optionsText = q.options
    .map((opt, i) => `${LETTERS[i]}) ${opt}`)
    .join('\n');

  await ctx.reply(
    `*Вопрос ${current} из ${total}*\n\n` +
    `${q.question}\n\n` +
    `${optionsText}\n\n` +
    `_Отправь букву ответа (А, Б, В или Г)_`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * Запускает тест с выбранными вопросами
 */
async function startTest(ctx, userId, testQuestions, title) {
  const selected = shuffle(testQuestions).slice(0, TEST_SIZE);

  sessions.set(userId, {
    questions: selected,
    questionIndex: 0,
    score: 0,
    category: title.includes('все темы') ? 'all' : selected[0].category,
    answers: [],
  });

  await ctx.reply(
    `📝 *${title}*\n\n` +
    `Вопросов: ${selected.length}\n` +
    'На каждый вопрос отправляй букву ответа: А, Б, В или Г\n\n' +
    'Поехали!',
    { parse_mode: 'Markdown' }
  );

  await sendQuestion(ctx, sessions.get(userId));
}

/**
 * Обработчик команды /test
 */
function registerTestHandler(bot) {
  // /test — показываем меню выбора категории
  bot.command('test', async (ctx) => {
    const categories = [...new Set(allQuestions.map(q => q.category))];

    const keyboard = categories.map(cat => ([{
      text: `${CATEGORY_LABELS[cat] || cat} (${allQuestions.filter(q => q.category === cat).length})`,
      callback_data: `test_cat:${cat}`
    }]));

    // Добавляем кнопку "Все темы"
    keyboard.unshift([{
      text: `🔀 Все темы (${allQuestions.length})`,
      callback_data: 'test_cat:all'
    }]);

    await ctx.reply(
      '📝 *Тест по цервикальной цитологии (Bethesda)*\n\n' +
      'Выбери тему:',
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  });

  // Обработка выбора категории
  bot.action(/^test_cat:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const category = ctx.match[1];
    const userId = ctx.from.id;

    let testQuestions;
    let title;

    if (category === 'all') {
      testQuestions = allQuestions;
      title = 'Тест: все темы Bethesda';
    } else {
      testQuestions = allQuestions.filter(q => q.category === category);
      title = `Тест: ${CATEGORY_LABELS[category] || category}`;
    }

    if (testQuestions.length === 0) {
      await ctx.reply('В этой категории пока нет вопросов.');
      return;
    }

    await startTest(ctx, userId, testQuestions, title);
  });

  // Обработка ответов
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const session = sessions.get(userId);

    if (!session) return;

    const text = ctx.message.text.trim().toUpperCase();
    const letterMap = { 'А': 0, 'A': 0, 'Б': 1, 'B': 1, 'В': 2, 'V': 2, 'Г': 3, 'G': 3 };

    if (!(text in letterMap)) {
      await ctx.reply('Пожалуйста, отправь букву ответа: А, Б, В или Г');
      return;
    }

    const answerIndex = letterMap[text];
    const q = session.questions[session.questionIndex];
    const isCorrect = answerIndex === q.correct;

    // Inline-кнопка "Посмотреть в атласе"
    const replyOptions = { parse_mode: 'Markdown' };
    if (q.reference_url) {
      replyOptions.reply_markup = {
        inline_keyboard: [[
          { text: '🔬 Посмотреть в атласе IARC', url: q.reference_url }
        ]]
      };
    }

    session.answers.push({
      id: q.id,
      category: q.category,
      correct: isCorrect,
    });

    if (isCorrect) {
      session.score++;
      await ctx.reply('✅ Верно!\n\n' + q.explanation, replyOptions);
    } else {
      const correctLetter = LETTERS[q.correct];
      await ctx.reply(
        `❌ Неверно. Правильный ответ: *${correctLetter}) ${q.options[q.correct]}*\n\n` +
        q.explanation,
        replyOptions
      );
    }

    session.questionIndex++;

    if (session.questionIndex >= session.questions.length) {
      const total = session.questions.length;
      const percent = Math.round((session.score / total) * 100);
      let emoji = percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '📚';

      // Сохраняем результат
      recordTestResult(userId, {
        category: session.category,
        total,
        correct: session.score,
        questions: session.answers,
      });

      await ctx.reply(
        `${emoji} *Тест завершён!*\n\n` +
        `Результат: *${session.score} из ${total}* (${percent}%)\n\n` +
        (percent >= 80
          ? 'Отличный результат! Вы хорошо знаете тему.'
          : percent >= 50
          ? 'Неплохо! Есть над чем поработать.'
          : 'Рекомендуем повторить материал и попробовать снова.') +
        '\n\n📊 /stats — посмотреть свою статистику\n' +
        'Для нового теста нажми /test',
        { parse_mode: 'Markdown' }
      );

      sessions.delete(userId);
    } else {
      await sendQuestion(ctx, session);
    }
  });
}

module.exports = { registerTestHandler };
