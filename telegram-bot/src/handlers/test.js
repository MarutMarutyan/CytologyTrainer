const allQuestions = require('../data/questions.json');
const { recordTestResult } = require('../stats');

// Хранилище активных сессий: userId -> { questions, questionIndex, score, ... }
const sessions = new Map();

// Количество вопросов в одном тесте
const TEST_SIZE = 10;

// Латинские буквы для вариантов ответов
const LETTERS = ['A', 'B', 'C', 'D'];

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
 * Отправляет вопрос пользователю с inline-кнопками
 */
async function sendQuestion(ctx, session) {
  const q = session.questions[session.questionIndex];
  const total = session.questions.length;
  const current = session.questionIndex + 1;

  const optionsText = q.options
    .map((opt, i) => `*${LETTERS[i]}.* ${opt}`)
    .join('\n');

  // Кнопки ответов (2x2) + кнопка отмены
  const keyboard = [
    [
      { text: 'A', callback_data: `ans:0` },
      { text: 'B', callback_data: `ans:1` },
    ],
    [
      { text: 'C', callback_data: `ans:2` },
      { text: 'D', callback_data: `ans:3` },
    ],
    [
      { text: '❌ Прервать тест', callback_data: 'test_cancel' },
    ],
  ];

  await ctx.reply(
    `*Вопрос ${current} из ${total}*\n\n` +
    `${q.question}\n\n` +
    `${optionsText}`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    }
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
    'Нажимай кнопку с ответом. Поехали!',
    { parse_mode: 'Markdown' }
  );

  await sendQuestion(ctx, sessions.get(userId));
}

/**
 * Обрабатывает ответ пользователя (общая логика)
 */
async function handleAnswer(ctx, userId, answerIndex) {
  const session = sessions.get(userId);
  if (!session) return;

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
      `❌ Неверно. Правильный ответ: *${correctLetter}. ${q.options[q.correct]}*\n\n` +
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
}

/**
 * Обработчик команды /test
 */
function registerTestHandler(bot) {
  // /test — показываем меню выбора категории
  bot.command('test', async (ctx) => {
    // Если уже в тесте — спрашиваем
    const userId = ctx.from.id;
    if (sessions.has(userId)) {
      sessions.delete(userId);
      await ctx.reply('Предыдущий тест прерван. Выбирай новую тему:');
    }

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

  // Обработка нажатия кнопки ответа
  bot.action(/^ans:(\d)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const session = sessions.get(userId);

    if (!session) {
      await ctx.answerCbQuery('Тест не активен. Нажми /test');
      return;
    }

    const answerIndex = parseInt(ctx.match[1], 10);
    await handleAnswer(ctx, userId, answerIndex);
  });

  // Обработка отмены теста
  bot.action('test_cancel', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const session = sessions.get(userId);

    if (session) {
      const answered = session.answers.length;
      sessions.delete(userId);
      await ctx.reply(
        `🛑 Тест прерван (отвечено ${answered} из ${session.questions.length}).\n\n` +
        'Для нового теста: /test',
      );
    }
  });

  // Обработка текстовых ответов (fallback + пропуск команд)
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const session = sessions.get(userId);

    if (!session) return;

    const text = ctx.message.text.trim();

    // Пропускаем команды — пусть обрабатываются другими хэндлерами
    if (text.startsWith('/')) return;

    const upper = text.toUpperCase();
    const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'А': 0, 'Б': 1, 'В': 2, 'Г': 3 };

    if (upper in letterMap) {
      await handleAnswer(ctx, userId, letterMap[upper]);
    } else {
      await ctx.reply('Нажми кнопку с ответом (A, B, C или D) или /test для нового теста.');
    }
  });
}

module.exports = { registerTestHandler };
