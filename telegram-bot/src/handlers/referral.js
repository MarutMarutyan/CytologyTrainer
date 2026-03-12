/**
 * Реферальная система — /referral
 * Пригласи коллегу → получи бонусные тесты
 */
const { loadUsers, saveUsers } = require('../users');

const BOT_USERNAME = process.env.BOT_USERNAME || 'CytoBot_bot';
const BONUS_PER_REFERRAL = 20; // бонусных тестов за каждого приглашённого

function getReferralLink(userId) {
  return `https://t.me/${BOT_USERNAME}?start=ref_${userId}`;
}

function getReferralStats(userId) {
  const users = loadUsers();
  const referrals = Object.values(users).filter(u => u.referredBy === String(userId));
  const user = users[String(userId)];
  const bonusTests = (user && user.bonusTests) || 0;
  return { count: referrals.length, bonusTests };
}

function processReferral(newUserId, referrerId) {
  if (String(newUserId) === String(referrerId)) return false;

  const users = loadUsers();
  const newUser = users[String(newUserId)];
  const referrer = users[String(referrerId)];

  if (!newUser || !referrer) return false;
  if (newUser.referredBy) return false; // уже был приглашён

  // Записываем реферала
  newUser.referredBy = String(referrerId);

  // Даём бонус пригласившему
  referrer.bonusTests = (referrer.bonusTests || 0) + BONUS_PER_REFERRAL;
  referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;

  saveUsers(users);
  return true;
}

function registerReferralHandler(bot) {
  bot.command('referral', (ctx) => {
    const userId = ctx.from.id;
    const link = getReferralLink(userId);
    const { count, bonusTests } = getReferralStats(userId);

    ctx.reply(
      `🔗 <b>Пригласи коллегу</b>\n\n` +
      `Отправь эту ссылку коллегам-лаборантам или цитологам:\n` +
      `<code>${link}</code>\n\n` +
      `За каждого приглашённого получаешь <b>${BONUS_PER_REFERRAL} бонусных тестов</b>.\n\n` +
      `📊 Твоя статистика:\n` +
      `• Приглашено: ${count} человек\n` +
      `• Бонусных тестов: ${bonusTests}\n\n` +
      `<i>Помоги коллегам учиться — и получи больше практики сам.</i>`,
      { parse_mode: 'HTML' }
    );
  });
}

module.exports = { registerReferralHandler, processReferral, getReferralLink, getReferralStats };
