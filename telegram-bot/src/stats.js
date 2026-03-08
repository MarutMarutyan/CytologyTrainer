const fs = require('fs');
const path = require('path');

const STATS_FILE = path.join(__dirname, 'data', 'user_stats.json');

/**
 * Загружает статистику из файла
 */
function loadStats() {
  try {
    const data = fs.readFileSync(STATS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Сохраняет статистику в файл
 */
function saveStats(stats) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
}

/**
 * Записывает результат теста для пользователя
 * @param {number} userId
 * @param {object} result - { category, total, correct, questions }
 *   questions: [{ id, correct: boolean, category }]
 */
function recordTestResult(userId, result) {
  const stats = loadStats();
  const key = String(userId);

  if (!stats[key]) {
    stats[key] = {
      testsCompleted: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      categories: {},
      history: [],
    };
  }

  const user = stats[key];
  user.testsCompleted++;
  user.totalCorrect += result.correct;
  user.totalAnswered += result.total;

  // Статистика по категориям
  for (const q of result.questions) {
    const cat = q.category;
    if (!user.categories[cat]) {
      user.categories[cat] = { correct: 0, total: 0 };
    }
    user.categories[cat].total++;
    if (q.correct) {
      user.categories[cat].correct++;
    }
  }

  // История последних 20 тестов
  user.history.push({
    date: new Date().toISOString(),
    category: result.category,
    score: result.correct,
    total: result.total,
  });
  if (user.history.length > 20) {
    user.history = user.history.slice(-20);
  }

  saveStats(stats);
}

/**
 * Возвращает статистику пользователя
 */
function getUserStats(userId) {
  const stats = loadStats();
  return stats[String(userId)] || null;
}

module.exports = { recordTestResult, getUserStats };
