// ============ 游戏状态 ============
const state = {
  godName: '',
  divinePower: 50,
  faith: 30,
  followers: 10,
  day: 1,
  currentPrayer: null,
  log: []
};

// ============ 祈祷数据 ============
const prayers = [
  { icon: '🌾', person: '一位朴实的农夫', request: '祈求降雨，拯救枯萎的庄稼。', type: 'farmer' },
  { icon: '💰', person: '一位贪婪的商人', request: '乞求财富与繁荣的商路。', type: 'merchant' },
  { icon: '⚔️', person: '一位受伤的士兵', request: '恳求在即将到来的战斗中获胜。', type: 'soldier' },
  { icon: '🗡️', person: '一位走投无路的窃贼', request: '请求帮助他偷窃富人的财物。', type: 'thief' },
  { icon: '👶', person: '一位忧心的母亲', request: '祈祷她生病的孩子能够康复。', type: 'mother' },
  { icon: '📖', person: '一位年轻的书生', request: '寻求神圣的智慧来通过科举。', type: 'scholar' },
  { icon: '🏗️', person: '一位村中长老', request: '请求庇护村庄免受暴风侵袭。', type: 'elder' },
  { icon: '🎭', person: '一位游历的乐师', request: '祈祷获得灵感，谱写传世之曲。', type: 'bard' },
  { icon: '⚒️', person: '一位疲惫的铁匠', request: '请求力量来锻造一把绝世神兵。', type: 'blacksmith' },
  { icon: '🌊', person: '一位渔夫', request: '祈祷风平浪静，满载而归。', type: 'fisherman' },
  { icon: '👑', person: '一位骄傲的国王', request: '要求神明赐予力量击溃敌国。', type: 'king' },
  { icon: '🌿', person: '一位医者', request: '请求指引找到珍稀的药草。', type: 'healer' },
  { icon: '🐑', person: '一位孤独的牧羊人', request: '祈祷在无尽的山丘上有人相伴。', type: 'shepherd' },
  { icon: '🔥', person: '一位复仇的寡妇', request: '要求为被害的丈夫伸张正义。', type: 'widow' },
  { icon: '🏹', person: '一位年轻的猎人', request: '祈祷狩猎成功，养活全村。', type: 'hunter' }
];

// ============ 选择效果 ============
const effects = {
  bless: {
    farmer:      { power: -8,  faith: +12, followers: +3,  text: '甘霖从晴空降下，庄稼重获生机！' },
    merchant:    { power: -10, faith: +5,  followers: +1,  text: '金币在商人的钱箱中不断增多。' },
    soldier:     { power: -12, faith: +10, followers: +4,  text: '神圣之光庇护了战场上的士兵。' },
    thief:       { power: -6,  faith: -2,  followers: +1,  text: '你帮助了窃贼……信徒们质疑你的道德。' },
    mother:      { power: -5,  faith: +15, followers: +5,  text: '孩子奇迹般地康复了，你的仁慈传遍四方。' },
    scholar:     { power: -4,  faith: +8,  followers: +2,  text: '神圣的知识涌入书生的脑海。' },
    elder:       { power: -10, faith: +12, followers: +4,  text: '暴风在村庄周围散去，人们欢呼雀跃！' },
    bard:        { power: -3,  faith: +6,  followers: +2,  text: '乐师谱写了一首赞颂你的圣歌，广为传唱。' },
    blacksmith:  { power: -7,  faith: +8,  followers: +2,  text: '刀刃闪耀着神圣的光芒，一件杰作诞生了。' },
    fisherman:   { power: -5,  faith: +10, followers: +3,  text: '海面平静如镜，鱼儿争相跃入渔网。' },
    king:        { power: -15, faith: +5,  followers: +6,  text: '国王获胜了，但你的神力消耗巨大。' },
    healer:      { power: -4,  faith: +12, followers: +3,  text: '一株发光的药草出现了，无数生命将被拯救。' },
    shepherd:    { power: -3,  faith: +7,  followers: +1,  text: '一个友善的精灵出现，陪伴孤独的牧羊人。' },
    widow:       { power: -10, faith: +10, followers: +3,  text: '神罚降临，凶手被揭露了。' },
    hunter:      { power: -5,  faith: +10, followers: +4,  text: '一头雄壮的鹿出现了，今夜全村将饱餐一顿。' }
  },
  ignore: {
    farmer:      { power: 0, faith: -3, followers: -1, text: '庄稼枯萎了，农夫失去了希望。' },
    merchant:    { power: 0, faith: -1, followers: 0,  text: '商人耸耸肩，继续讨价还价。' },
    soldier:     { power: 0, faith: -4, followers: -2, text: '士兵战死沙场，他的战友们失去了信仰。' },
    thief:       { power: 0, faith: +1, followers: 0,  text: '窃贼独自失败了，正义之人赞许你的沉默。' },
    mother:      { power: 0, faith: -5, followers: -2, text: '孩子的命运未卜，母亲泣不成声。' },
    scholar:     { power: 0, faith: -2, followers: 0,  text: '书生落榜了，开始质疑你的存在。' },
    elder:       { power: 0, faith: -4, followers: -2, text: '暴风肆虐村庄，对你的信任逐渐消散。' },
    bard:        { power: 0, faith: -1, followers: 0,  text: '乐师写了一首平庸的曲子，生活继续。' },
    blacksmith:  { power: 0, faith: -2, followers: -1, text: '刀刃碎裂了，铁匠诅咒苍天。' },
    fisherman:   { power: 0, faith: -3, followers: -1, text: '又是空网而归，渔夫转而祈祷其他神明。' },
    king:        { power: 0, faith: -2, followers: -1, text: '国王很不满，开始考虑信奉其他神明。' },
    healer:      { power: 0, faith: -3, followers: -1, text: '没有药草，病人们受苦，信仰动摇。' },
    shepherd:    { power: 0, faith: -1, followers: 0,  text: '牧羊人叹了口气，转而和羊群说话。' },
    widow:       { power: 0, faith: -4, followers: -2, text: '正义永远没有到来，寡妇诅咒你的名字。' },
    hunter:      { power: 0, faith: -3, followers: -1, text: '狩猎失败了，饥饿的村民质疑你的关怀。' }
  },
  punish: {
    farmer:      { power: -3, faith: +2,  followers: -2, text: '闪电劈中田野！农夫吓得瑟瑟发抖。' },
    merchant:    { power: -3, faith: +3,  followers: -1, text: '商人的金子化为尘土，旁人引以为戒。' },
    soldier:     { power: -5, faith: +4,  followers: -2, text: '你击碎了士兵的剑，战争非你所愿。' },
    thief:       { power: -2, faith: +6,  followers: +1, text: '窃贼的双手被冻住了，人们欢呼神罚降临！' },
    mother:      { power: -2, faith: -8,  followers: -4, text: '你惩罚一位悲伤的母亲？！信徒们愤然离去。' },
    scholar:     { power: -2, faith: +1,  followers: -1, text: '书生的书卷化为灰烬，这是一个严厉的教训。' },
    elder:       { power: -4, faith: +2,  followers: -3, text: '你让暴风更加猛烈，村庄在恐惧中颤抖。' },
    bard:        { power: -2, faith: +2,  followers: -1, text: '乐师的声音消失了，这是对所有人的警告。' },
    blacksmith:  { power: -3, faith: +2,  followers: -1, text: '锻炉爆炸了！铁匠学会了谦卑。' },
    fisherman:   { power: -3, faith: +2,  followers: -2, text: '漩涡吞没了渔船，海岸上的人们畏惧你。' },
    king:        { power: -8, faith: +8,  followers: -3, text: '国王的王冠碎裂，即使统治者也要在你面前低头。' },
    healer:      { power: -2, faith: -4,  followers: -3, text: '惩罚医者？你的残忍散播了怀疑。' },
    shepherd:    { power: -2, faith: +1,  followers: -1, text: '狼群扑向羊群，牧羊人更加虔诚地祈祷。' },
    widow:       { power: -4, faith: +5,  followers: -1, text: '你因寡妇的愤怒而惩罚她，恐惧蔓延开来。' },
    hunter:      { power: -3, faith: +3,  followers: -2, text: '森林陷入死寂，没有生灵敢动弹。' }
  }
};

// ============ 随机事件 ============
const randomEvents = [
  { text: '🌈 一道彩虹出现在你的神殿上空，信徒们深受鼓舞！', faith: +5, followers: +2, power: 0 },
  { text: '🌑 日食降临，人们惊恐万分，祈祷更加虔诚！', faith: +8, followers: 0, power: +5 },
  { text: '🐉 一条巨龙袭击了村庄！你的信徒要求你采取行动。', faith: -5, followers: -3, power: 0 },
  { text: '🎉 人们举办了一场盛大的祭典来荣耀你！新的信徒纷纷到来。', faith: +3, followers: +5, power: 0 },
  { text: '💀 瘟疫席卷大地，人们开始质疑你的力量。', faith: -8, followers: -4, power: 0 },
  { text: '⭐ 一颗流星被视为你的神迹，朝圣者蜂拥而至！', faith: +4, followers: +3, power: +3 },
  { text: '🏛️ 一座敌对神明的神殿崩塌了，你的信徒欢庆胜利！', faith: +6, followers: +4, power: 0 },
  { text: '🌋 火山隆隆作响，人们因恐惧而献上更多祭品。', faith: +3, followers: -1, power: +8 },
  { text: '🕊️ 一只白鸽落在你的祭坛上，和平降临大地。', faith: +5, followers: +2, power: +2 },
  { text: '👹 恶魔在你的信徒耳边低语，散播怀疑的种子。', faith: -6, followers: -2, power: -3 }
];

// ============ DOM 引用 ============
const dom = {
  nameScreen: document.getElementById('name-screen'),
  gameScreen: document.getElementById('game-screen'),
  gameoverScreen: document.getElementById('gameover-screen'),
  nameInput: document.getElementById('name-input'),
  godName: document.getElementById('god-name'),
  divinePower: document.getElementById('divine-power'),
  faith: document.getElementById('faith'),
  followers: document.getElementById('followers'),
  day: document.getElementById('day'),
  powerBar: document.getElementById('power-bar'),
  faithBar: document.getElementById('faith-bar'),
  prayerIcon: document.getElementById('prayer-icon'),
  prayerText: document.getElementById('prayer-text'),
  feedback: document.getElementById('feedback'),
  log: document.getElementById('log'),
  gameoverTitle: document.getElementById('gameover-title'),
  gameoverText: document.getElementById('gameover-text'),
  gameoverStats: document.getElementById('gameover-stats'),
  choiceBtns: document.querySelectorAll('.choice-btn')
};

// ============ 游戏函数 ============

function startGame() {
  const name = dom.nameInput.value.trim();
  if (!name) {
    dom.nameInput.style.borderColor = '#c47a5a';
    dom.nameInput.placeholder = '神明必须有名字！';
    return;
  }
  state.godName = name;
  dom.godName.textContent = name;
  dom.nameScreen.classList.add('hidden');
  dom.gameScreen.classList.remove('hidden');
  updateUI();
  generatePrayer();
}

// 回车键开始游戏
document.getElementById('name-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') startGame();
});

function generatePrayer() {
  const prayer = prayers[Math.floor(Math.random() * prayers.length)];
  state.currentPrayer = prayer;

  dom.prayerIcon.textContent = prayer.icon;
  dom.prayerIcon.classList.remove('pulse');
  void dom.prayerIcon.offsetWidth;
  dom.prayerIcon.classList.add('pulse');

  dom.prayerText.textContent = `${prayer.person}${prayer.request}`;
  setButtonsDisabled(false);
}

function makeChoice(choice) {
  if (!state.currentPrayer) return;
  setButtonsDisabled(true);

  const prayer = state.currentPrayer;
  const effect = effects[choice][prayer.type];

  // 应用效果
  state.divinePower = clamp(state.divinePower + effect.power, 0, 100);
  state.faith = clamp(state.faith + effect.faith, 0, 100);
  state.followers = Math.max(0, state.followers + effect.followers);

  // 显示反馈
  showFeedback(effect.text, `${choice}-feedback`);

  // 添加日志
  const choiceLabel = choice === 'bless' ? '✨ 赐福' : choice === 'ignore' ? '😐 无视' : '🔥 惩罚';
  addLog(`${choiceLabel}了${prayer.person}。${formatStatChanges(effect)}`);

  updateUI();

  // 检查游戏结束
  if (checkGameOver()) return;

  // 延迟后进入下一回合
  setTimeout(() => {
    state.day++;

    // 25% 概率触发随机事件
    if (Math.random() < 0.25) {
      triggerRandomEvent();
    } else {
      generatePrayer();
    }

    updateUI();
  }, 1200);
}

function triggerRandomEvent() {
  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];

  state.divinePower = clamp(state.divinePower + event.power, 0, 100);
  state.faith = clamp(state.faith + event.faith, 0, 100);
  state.followers = Math.max(0, state.followers + event.followers);

  showFeedback(event.text, 'event-feedback');
  addLog(`⚡ 事件：${event.text}`);

  updateUI();

  if (checkGameOver()) return;

  setTimeout(() => {
    generatePrayer();
  }, 1500);
}

function showFeedback(text, className) {
  dom.feedback.textContent = text;
  dom.feedback.className = className;
  dom.feedback.classList.remove('hidden');
  dom.feedback.style.animation = 'none';
  void dom.feedback.offsetWidth;
  dom.feedback.style.animation = '';
}

function addLog(text) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-day">第${state.day}天：</span>${text}`;
  dom.log.prepend(entry);

  while (dom.log.children.length > 50) {
    dom.log.removeChild(dom.log.lastChild);
  }
}

function updateUI() {
  dom.divinePower.textContent = state.divinePower;
  dom.faith.textContent = state.faith;
  dom.followers.textContent = state.followers;
  dom.day.textContent = state.day;

  dom.powerBar.style.width = state.divinePower + '%';
  dom.faithBar.style.width = state.faith + '%';

  flashElement(dom.divinePower);
  flashElement(dom.faith);
  flashElement(dom.followers);
}

function flashElement(el) {
  el.classList.remove('stat-flash');
  void el.offsetWidth;
  el.classList.add('stat-flash');
}

function setButtonsDisabled(disabled) {
  dom.choiceBtns.forEach(btn => btn.disabled = disabled);
}

function checkGameOver() {
  let title = '', text = '';

  if (state.followers <= 0) {
    title = '💔 被遗忘';
    text = `最后一位信徒也离你而去。没有了信仰，你的神性火花消散于虚无。"${state.godName}"这个名字被时间遗忘了。`;
  } else if (state.divinePower <= 0 && state.faith <= 0) {
    title = '💀 陨落之神';
    text = `没有神力，没有信仰，${state.godName}化为凡尘。天界关闭了大门。`;
  } else if (state.faith >= 100 && state.followers >= 50) {
    title = '🌟 飞升成功！';
    text = `${state.godName}已成为至高神明！拥有${state.followers}位虔诚的信徒和满溢的信仰，你升入了最高神殿！`;
  } else if (state.day > 50) {
    title = '🏛️ 传说时代';
    text = `五十天过去了，奇迹的时代落幕。${state.godName}带着${state.followers}位信徒，在众神之中占据了一席之地。`;
  } else {
    return false;
  }

  dom.gameoverTitle.textContent = title;
  dom.gameoverText.textContent = text;
  dom.gameoverStats.innerHTML = `
    ⚡ 神力：${state.divinePower} | 🙏 信仰：${state.faith} | 👥 信徒：${state.followers} | 📅 天数：${state.day}
  `;

  dom.gameScreen.classList.add('hidden');
  dom.gameoverScreen.classList.remove('hidden');
  return true;
}

// ============ 工具函数 ============

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function formatStatChanges(effect) {
  const parts = [];
  if (effect.power !== 0) parts.push(`神力${effect.power > 0 ? '+' : ''}${effect.power}`);
  if (effect.faith !== 0) parts.push(`信仰${effect.faith > 0 ? '+' : ''}${effect.faith}`);
  if (effect.followers !== 0) parts.push(`信徒${effect.followers > 0 ? '+' : ''}${effect.followers}`);
  return parts.length ? `（${parts.join('，')}）` : '';
}
