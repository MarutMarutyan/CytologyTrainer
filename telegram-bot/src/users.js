/**
 * Модуль трекинга пользователей бота
 */
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Не удалось сохранить users.json:', err.message);
  }
}

function trackUser(ctx) {
  const users = loadUsers();
  const id = String(ctx.from.id);
  const now = new Date().toISOString();

  if (!users[id]) {
    // Новый пользователь
    users[id] = {
      id,
      firstName: ctx.from.first_name || '',
      lastName: ctx.from.last_name || '',
      username: ctx.from.username || '',
      joinDate: now,
      lastActive: now,
      messageCount: 1,
    };
  } else {
    // Обновляем активность
    users[id].lastActive = now;
    users[id].messageCount = (users[id].messageCount || 0) + 1;
    // Обновляем имя если изменилось
    users[id].firstName = ctx.from.first_name || users[id].firstName;
    users[id].username = ctx.from.username || users[id].username;
  }

  saveUsers(users);
}

function getUserStats() {
  const users = loadUsers();
  const all = Object.values(users);
  const now = new Date();

  const today = all.filter(u => {
    const d = new Date(u.joinDate);
    return d.toDateString() === now.toDateString();
  });

  const week = all.filter(u => {
    const d = new Date(u.joinDate);
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  });

  const recent = all
    .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
    .slice(0, 10);

  return { total: all.length, today: today.length, week: week.length, recent };
}

module.exports = { trackUser, getUserStats };
