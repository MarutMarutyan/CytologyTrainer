const questions = require('../data/questions.json');

// Хранилище активных сессий: userId -> { questionIndex, score, answers }
const sessions = new Map();

/**
 * Отправляет вопрос пользователю
 */
async function sendQuestion(ctx, session) {
  const q = questions[session.questionIndex];
  const total = questions.length;
  const current = session.questionIndex + 1;

  // Формируем варианты ответов с буквами
  const optionsText = q.options
    .map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`)
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
 * Обработчик команды /test
 */
function registerTestHandler(bot) {
  // Начало теста
  bot.command('test', async (ctx) => {
    const userId = ctx.from.id;

    sessions.set(userId, {
      questionIndex: 0,
      score: 0,
    });

    await ctx.reply(
      '📝 *Тест по гинекологической цитологии (Bethesda)*\n\n' +
      `Всего вопросов: ${questions.length}\n` +
      'На каждый вопрос отправляй букву ответа: А, Б, В или Г\n\n' +
      'Поехали!',
      { parse_mode: 'Markdown' }
    );

    await sendQuestion(ctx, sessions.get(userId));
  });

  // Обработка ответов
  bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const session = sessions.get(userId);

    if (!session) return; // нет активной сессии

    const text = ctx.message.text.trim().toUpperCase();
    const letterMap = { 'А': 0, 'A': 0, 'Б': 1, 'B': 1, 'В': 2, 'V': 2, 'Г': 3, 'G': 3 };

    // Проверяем что ответ — буква
    if (!(text in letterMap)) {
      await ctx.reply('Пожалуйста, отправь букву ответа: А, Б, В или Г');
      return;
    }

    const answerIndex = letterMap[text];
    const q = questions[session.questionIndex];
    const isCorrect = answerIndex === q.correct;

    if (isCorrect) {
      session.score++;
      await ctx.reply('✅ Верно!\n\n' + q.explanation, { parse_mode: 'Markdown' });
    } else {
      const correctLetter = String.fromCharCode(65 + q.correct);
      await ctx.reply(
        `❌ Неверно. Правильный ответ: *${correctLetter}) ${q.options[q.correct]}*\n\n` +
        q.explanation,
        { parse_mode: 'Markdown' }
      );
    }

    session.questionIndex++;

    // Проверяем конец теста
    if (session.questionIndex >= questions.length) {
      const percent = Math.round((session.score / questions.length) * 100);
      let emoji = percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '📚';

      await ctx.reply(
        `${emoji} *Тест завершён!*\n\n` +
        `Результат: *${session.score} из ${questions.length}* (${percent}%)\n\n` +
        (percent >= 80
          ? 'Отличный результат! Вы хорошо знаете тему.'
          : percent >= 50
          ? 'Неплохо! Есть над чем поработать.'
          : 'Рекомендуем повторить материал и попробовать снова.') +
        '\n\nДля нового теста нажми /test',
        { parse_mode: 'Markdown' }
      );

      sessions.delete(userId);
    } else {
      // Следующий вопрос
      await sendQuestion(ctx, session);
    }
  });
}

module.exports = { registerTestHandler };
