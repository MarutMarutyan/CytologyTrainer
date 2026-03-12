const cron = require('node-cron');
const questions = require('./data/questions.json');

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Вопрос дня — с задержкой ответа для вовлечения
async function postQuestionOfDay(bot) {
  if (!CHANNEL_ID) return;

  const q = random(questions);
  const letters = ['A', 'B', 'C', 'D'];
  const options = q.options.map((opt, i) => `${letters[i]}. ${opt}`).join('\n');

  // Сначала только вопрос — пусть подумают
  const questionText =
    `🔬 <b>Вопрос дня</b>\n\n` +
    `${q.question}\n\n` +
    `${options}\n\n` +
    `<i>Ответ — через 2 часа. Проверь себя: @CytoBot_bot → /test</i>`;

  await bot.telegram.sendMessage(CHANNEL_ID, questionText, { parse_mode: 'HTML' });

  // Через 2 часа — ответ с объяснением
  setTimeout(async () => {
    const correct = letters[q.correct];
    const answerText =
      `✅ <b>Ответ: ${correct}. ${q.options[q.correct]}</b>\n\n` +
      `${q.explanation}\n\n` +
      `📚 Больше тестов → @CytoBot_bot`;
    try {
      await bot.telegram.sendMessage(CHANNEL_ID, answerText, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('Ошибка отправки ответа:', e.message);
    }
  }, 2 * 60 * 60 * 1000);
}

// Клинический кейс (среда) — формат который пересылают
async function postClinicalCase(bot) {
  if (!CHANNEL_ID) return;

  const cases = [
    {
      scenario: 'Пациентка 34 года. Скрининговый ПАП-тест. На препарате: клетки с перинуклеарным просветлением, гиперхромными ядрами неправильной формы, "изюмоподобный" хроматин.',
      question: 'Ваша интерпретация по системе Bethesda?',
      answer: 'LSIL (Low-grade Squamous Intraepithelial Lesion)',
      explanation: 'Описанные клетки — классические <b>койлоциты</b>. Перинуклеарное просветление + гиперхромное неровное ядро = цитопатический эффект ВПЧ. Это LSIL по Bethesda. Тактика: повторный ПАП через 1 год или тест на ВПЧ.',
    },
    {
      scenario: 'ТАБ щитовидной железы. Узел 1.8 см. На препарате: микрофолликулы, клетки с увеличенными ядрами, скудная коллоид. Митозов нет. Ядерные псевдовключения отсутствуют.',
      question: 'Категория TBSRTC?',
      answer: 'Категория IV — Фолликулярная неоплазия (FN/SFN)',
      explanation: '<b>Микрофолликулярный паттерн + скудный коллоид</b> без ядерных признаков папиллярного рака → категория IV TBSRTC. Риск злокачественности 25–40%. Рекомендация: гемитиреоидэктомия или молекулярное тестирование (Afirma/ThyroSeq).',
    },
    {
      scenario: 'Пациентка 52 года. ПАП-тест после менопаузы. На препарате: мелкие клетки с гиперхромными ядрами, скудная цитоплазма, воспалительный фон.',
      question: 'Как дифференцировать атрофию от HSIL?',
      answer: 'Атрофические изменения vs HSIL — ключ в хроматине и тесте с эстрогенами',
      explanation: 'При <b>атрофии</b> хроматин равномерный ("пыльный"), ядра одинакового размера, нет N/C инверсии. При <b>HSIL</b> хроматин грубый, неравномерный, ядра полиморфные. Если сомнение → местная эстрогенотерапия 2 недели + повторный мазок.',
    },
  ];

  const c = random(cases);
  const text =
    `🩺 <b>Клинический кейс</b>\n\n` +
    `<b>Ситуация:</b> ${c.scenario}\n\n` +
    `❓ ${c.question}\n\n` +
    `<i>Думай. Ответ ниже ↓</i>\n` +
    `||<b>${c.answer}</b>\n\n${c.explanation}||\n\n` +
    `📝 Тренируй клиническое мышление → @CytoBot_bot`;

  await bot.telegram.sendMessage(CHANNEL_ID, text, { parse_mode: 'HTML' });
}

// Факт недели (понедельник) — обновлённый формат
async function postWeeklyFact(bot) {
  if (!CHANNEL_ID) return;

  const facts = [
    { title: 'Bethesda 2024: что изменилось?', body: 'В обновлении 2024 года уточнены критерии категории AIS (аденокарцинома in situ). Теперь выделяют эндоцервикальный, эндометриоидный и другие подтипы — это влияет на тактику.' },
    { title: 'Койлоцит: 3 обязательных признака', body: '1) Перинуклеарное просветление (гало)\n2) Гиперхромное неровное ядро\n3) Чёткий наружный контур клетки\nВсе три вместе = LSIL. Один признак — недостаточно.' },
    { title: 'Правило 10×6 в ТАБ щитовидной', body: 'Адекватный препарат = минимум <b>6 групп по 10 фолликулярных клеток</b>. Если меньше → категория I (неинформативная), повторная ТАБ под УЗИ-контролем.' },
    { title: 'ASC-US: когда откликаться?', body: 'ВПЧ-тест при ASC-US: если ВПЧ (+) → кольпоскопия. Если ВПЧ (−) → повтор через 3 года. Без ВПЧ-теста → повтор ПАП через 1 год. Это стандарт ASCCP 2019.' },
    { title: 'Hurthle-клетки: норма или патология?', body: 'Единичные клетки Хёртле в ТАБ — вариант нормы при хроническом тиреоидите. Преобладающий паттерн из клеток Хёртля (>75% клеток) + скудный коллоид → категория IV (HCN).' },
    { title: 'N/C ratio: главный критерий HSIL', body: 'Повышенное ядерно-цитоплазматическое соотношение (>50%) — ключевой признак HSIL. При LSIL N/C нормальное или незначительно повышено. Измеряй мысленно каждый раз.' },
    { title: 'TBSRTC vs Bethesda: общее', body: 'Обе системы — 6-категорийные, основаны на риске злокачественности, определяют тактику. TBSRTC создана по образцу Bethesda специально для щитовидной железы в 2007–2009 гг.' },
  ];

  const f = random(facts);
  const text =
    `🧠 <b>Факт недели: ${f.title}</b>\n\n` +
    `${f.body}\n\n` +
    `Проверь знания по теме → @CytoBot_bot`;

  await bot.telegram.sendMessage(CHANNEL_ID, text, { parse_mode: 'HTML' });
}

// Пятничное напоминание — вовлекающее
async function postReminder(bot) {
  if (!CHANNEL_ID) return;

  const reminders = [
    `⚡️ <b>Пятница — день самопроверки</b>\n\nСколько правильных ответов дашь за 5 минут?\n\n👉 @CytoBot_bot → /test\n\n<i>Лучший результат недели — поделись в комментариях.</i>`,
    `📊 <b>Твоя статистика за неделю</b>\n\nСколько тестов прошёл? Какие темы западают?\n\n@CytoBot_bot → /stats — посмотри свой прогресс.\n\n<i>Система Bethesda или TBSRTC — что сложнее?</i>`,
    `🎯 <b>Пятничный челлендж</b>\n\n10 вопросов по щитовидной железе. Засеки время.\n\n@CytoBot_bot → /test\n\n<i>Если 9–10 правильно — ты готов к любому разбору случая.</i>`,
  ];

  await bot.telegram.sendMessage(CHANNEL_ID, random(reminders), { parse_mode: 'HTML' });
}

function registerScheduler(bot) {
  if (!CHANNEL_ID) {
    console.log('TELEGRAM_CHANNEL_ID не задан — планировщик постов отключён');
    return;
  }

  // Вопрос дня — каждый день в 09:00 Ереван (05:00 UTC)
  cron.schedule('0 5 * * *', async () => {
    try { await postQuestionOfDay(bot); console.log('Вопрос дня опубликован'); }
    catch (err) { console.error('Ошибка вопроса дня:', err.message); }
  });

  // Факт недели — понедельник 10:00 Ереван (06:00 UTC)
  cron.schedule('0 6 * * 1', async () => {
    try { await postWeeklyFact(bot); console.log('Факт недели опубликован'); }
    catch (err) { console.error('Ошибка факта недели:', err.message); }
  });

  // Клинический кейс — среда 11:00 Ереван (07:00 UTC)
  cron.schedule('0 7 * * 3', async () => {
    try { await postClinicalCase(bot); console.log('Клинический кейс опубликован'); }
    catch (err) { console.error('Ошибка кейса:', err.message); }
  });

  // Напоминание — пятница 17:00 Ереван (13:00 UTC)
  cron.schedule('0 13 * * 5', async () => {
    try { await postReminder(bot); console.log('Напоминание опубликовано'); }
    catch (err) { console.error('Ошибка напоминания:', err.message); }
  });

  console.log('Планировщик постов запущен ✓');
}

module.exports = { registerScheduler, postQuestionOfDay, postWeeklyFact, postClinicalCase, postReminder };
