// ============ Mujian SDK 初始化 ============
let sdkReady = false;

async function initSDK() {
  try {
    await window.$mujian_lite.init();
    sdkReady = true;
    console.log('Mujian SDK 初始化成功');
  } catch (e) {
    console.warn('Mujian SDK 初始化失败，将使用本地数据：', e);
    sdkReady = false;
  }
}

// 通用 AI 请求函数
async function askAI(prompt) {
  if (!sdkReady) return null;
  try {
    const baseURL = window.$mujian_lite.openapi.baseURL;
    const apiKey = window.$mujian_lite.openapi.apiKey;
    const response = await fetch(`${baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'auto',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    console.warn('AI 请求失败：', e);
    return null;
  }
}

initSDK();

// ============ 信徒类型定义 ============
const FOLLOWER_TYPES = {
  fanatic:  { name: '狂信徒', icon: '🔥', faithPer: 3, desc: '无条件信仰，每人贡献3点信仰' },
  devout:   { name: '虔信徒', icon: '🙏', faithPer: 2, desc: '虔诚信仰，每人贡献2点信仰' },
  normal:   { name: '普通信徒', icon: '👤', faithPer: 1, desc: '一般信仰，每人贡献1点信仰' },
  skeptic:  { name: '疑信徒', icon: '🤔', faithPer: 0, desc: '半信半疑，不贡献信仰' },
  fake:     { name: '伪信徒', icon: '🎭', faithPer: -1, desc: '假装信仰，每人消耗1点信仰' }
};

// ============ 游戏状态 ============
const state = {
  godName: '',
  divinePower: 50,
  faith: 30,
  followers: { fanatic: 1, devout: 3, normal: 4, skeptic: 2, fake: 0 },
  day: 1,
  currentPrayer: null,
  currentEffects: null, // AI 生成的效果
  log: []
};

function getTotalFollowers() {
  return Object.values(state.followers).reduce((a, b) => a + b, 0);
}

function getFaithFromFollowers() {
  let total = 0;
  for (const [type, count] of Object.entries(state.followers)) {
    total += count * FOLLOWER_TYPES[type].faithPer;
  }
  return total;
}

// ============ 本地祈祷数据（降级用） ============
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

// ============ 本地选择效果（降级用） ============
const effects = {
  bless: {
    farmer:      { power: -8,  faith: +12, followers: { normal: +2, devout: +1 }, text: '甘霖从晴空降下，庄稼重获生机！' },
    merchant:    { power: -10, faith: +5,  followers: { fake: +1 }, text: '金币在商人的钱箱中不断增多。' },
    soldier:     { power: -12, faith: +10, followers: { fanatic: +1, normal: +2 }, text: '神圣之光庇护了战场上的士兵。' },
    thief:       { power: -6,  faith: -2,  followers: { fake: +1 }, text: '你帮助了窃贼……信徒们质疑你的道德。' },
    mother:      { power: -5,  faith: +15, followers: { devout: +2, fanatic: +1 }, text: '孩子奇迹般地康复了，你的仁慈传遍四方。' },
    scholar:     { power: -4,  faith: +8,  followers: { normal: +1, devout: +1 }, text: '神圣的知识涌入书生的脑海。' },
    elder:       { power: -10, faith: +12, followers: { devout: +2, normal: +1 }, text: '暴风在村庄周围散去，人们欢呼雀跃！' },
    bard:        { power: -3,  faith: +6,  followers: { normal: +1, skeptic: +1 }, text: '乐师谱写了一首赞颂你的圣歌，广为传唱。' },
    blacksmith:  { power: -7,  faith: +8,  followers: { devout: +1, normal: +1 }, text: '刀刃闪耀着神圣的光芒，一件杰作诞生了。' },
    fisherman:   { power: -5,  faith: +10, followers: { normal: +2, devout: +1 }, text: '海面平静如镜，鱼儿争相跃入渔网。' },
    king:        { power: -15, faith: +5,  followers: { normal: +3, fake: +2 }, text: '国王获胜了，但你的神力消耗巨大。' },
    healer:      { power: -4,  faith: +12, followers: { devout: +2 }, text: '一株发光的药草出现了，无数生命将被拯救。' },
    shepherd:    { power: -3,  faith: +7,  followers: { normal: +1 }, text: '一个友善的精灵出现，陪伴孤独的牧羊人。' },
    widow:       { power: -10, faith: +10, followers: { fanatic: +1, devout: +1 }, text: '神罚降临，凶手被揭露了。' },
    hunter:      { power: -5,  faith: +10, followers: { normal: +2, devout: +1 }, text: '一头雄壮的鹿出现了，今夜全村将饱餐一顿。' }
  },
  ignore: {
    farmer:      { power: 0, faith: -3, followers: { normal: -1 }, text: '庄稼枯萎了，农夫失去了希望。' },
    merchant:    { power: 0, faith: -1, followers: {}, text: '商人耸耸肩，继续讨价还价。' },
    soldier:     { power: 0, faith: -4, followers: { normal: -1, skeptic: +1 }, text: '士兵战死沙场，他的战友们失去了信仰。' },
    thief:       { power: 0, faith: +1, followers: {}, text: '窃贼独自失败了，正义之人赞许你的沉默。' },
    mother:      { power: 0, faith: -5, followers: { devout: -1, skeptic: +1 }, text: '孩子的命运未卜，母亲泣不成声。' },
    scholar:     { power: 0, faith: -2, followers: { skeptic: +1 }, text: '书生落榜了，开始质疑你的存在。' },
    elder:       { power: 0, faith: -4, followers: { normal: -1, skeptic: +1 }, text: '暴风肆虐村庄，对你的信任逐渐消散。' },
    bard:        { power: 0, faith: -1, followers: {}, text: '乐师写了一首平庸的曲子，生活继续。' },
    blacksmith:  { power: 0, faith: -2, followers: { normal: -1 }, text: '刀刃碎裂了，铁匠诅咒苍天。' },
    fisherman:   { power: 0, faith: -3, followers: { normal: -1 }, text: '又是空网而归，渔夫转而祈祷其他神明。' },
    king:        { power: 0, faith: -2, followers: { fake: -1 }, text: '国王很不满，开始考虑信奉其他神明。' },
    healer:      { power: 0, faith: -3, followers: { normal: -1 }, text: '没有药草，病人们受苦，信仰动摇。' },
    shepherd:    { power: 0, faith: -1, followers: {}, text: '牧羊人叹了口气，转而和羊群说话。' },
    widow:       { power: 0, faith: -4, followers: { devout: -1, skeptic: +1 }, text: '正义永远没有到来，寡妇诅咒你的名字。' },
    hunter:      { power: 0, faith: -3, followers: { normal: -1 }, text: '狩猎失败了，饥饿的村民质疑你的关怀。' }
  },
  punish: {
    farmer:      { power: -3, faith: +2,  followers: { normal: -1, skeptic: -1 }, text: '闪电劈中田野！农夫吓得瑟瑟发抖。' },
    merchant:    { power: -3, faith: +3,  followers: { fake: -1 }, text: '商人的金子化为尘土，旁人引以为戒。' },
    soldier:     { power: -5, faith: +4,  followers: { normal: -1, fanatic: +1 }, text: '你击碎了士兵的剑，战争非你所愿。' },
    thief:       { power: -2, faith: +6,  followers: { fanatic: +1 }, text: '窃贼的双手被冻住了，人们欢呼神罚降临！' },
    mother:      { power: -2, faith: -8,  followers: { devout: -2, skeptic: +1 }, text: '你惩罚一位悲伤的母亲？！信徒们愤然离去。' },
    scholar:     { power: -2, faith: +1,  followers: { normal: -1 }, text: '书生的书卷化为灰烬，这是一个严厉的教训。' },
    elder:       { power: -4, faith: +2,  followers: { normal: -2, fanatic: +1 }, text: '你让暴风更加猛烈，村庄在恐惧中颤抖。' },
    bard:        { power: -2, faith: +2,  followers: { normal: -1 }, text: '乐师的声音消失了，这是对所有人的警告。' },
    blacksmith:  { power: -3, faith: +2,  followers: { normal: -1 }, text: '锻炉爆炸了！铁匠学会了谦卑。' },
    fisherman:   { power: -3, faith: +2,  followers: { normal: -1, skeptic: -1 }, text: '漩涡吞没了渔船，海岸上的人们畏惧你。' },
    king:        { power: -8, faith: +8,  followers: { fake: -2, fanatic: +1 }, text: '国王的王冠碎裂，即使统治者也要在你面前低头。' },
    healer:      { power: -2, faith: -4,  followers: { devout: -1, skeptic: +1 }, text: '惩罚医者？你的残忍散播了怀疑。' },
    shepherd:    { power: -2, faith: +1,  followers: { normal: -1 }, text: '狼群扑向羊群，牧羊人更加虔诚地祈祷。' },
    widow:       { power: -4, faith: +5,  followers: { fanatic: +1, normal: -1 }, text: '你因寡妇的愤怒而惩罚她，恐惧蔓延开来。' },
    hunter:      { power: -3, faith: +3,  followers: { normal: -1, skeptic: -1 }, text: '森林陷入死寂，没有生灵敢动弹。' }
  }
};

// ============ 随机事件 ============
const randomEvents = [
  { text: '🌈 一道彩虹出现在你的神殿上空，信徒们深受鼓舞！', faith: +5, followers: { devout: +1, normal: +1 }, power: 0 },
  { text: '🌑 日食降临，人们惊恐万分，祈祷更加虔诚！', faith: +8, followers: { fanatic: +1 }, power: +5 },
  { text: '🐉 一条巨龙袭击了村庄！你的信徒要求你采取行动。', faith: -5, followers: { normal: -2, skeptic: +1 }, power: 0 },
  { text: '🎉 人们举办了一场盛大的祭典来荣耀你！新的信徒纷纷到来。', faith: +3, followers: { normal: +3, fake: +1 }, power: 0 },
  { text: '💀 瘟疫席卷大地，人们开始质疑你的力量。', faith: -8, followers: { devout: -1, normal: -2, skeptic: +2 }, power: 0 },
  { text: '⭐ 一颗流星被视为你的神迹，朝圣者蜂拥而至！', faith: +4, followers: { devout: +2, normal: +1 }, power: +3 },
  { text: '🏛️ 一座敌对神明的神殿崩塌了，你的信徒欢庆胜利！', faith: +6, followers: { fanatic: +2, normal: +1 }, power: 0 },
  { text: '🌋 火山隆隆作响，人们因恐惧而献上更多祭品。', faith: +3, followers: { skeptic: -1 }, power: +8 },
  { text: '🕊️ 一只白鸽落在你的祭坛上，和平降临大地。', faith: +5, followers: { devout: +1, normal: +1 }, power: +2 },
  { text: '👹 恶魔在你的信徒耳边低语，散播怀疑的种子。', faith: -6, followers: { devout: -1, fake: +1, skeptic: +1 }, power: -3 }
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
  followerDetail: document.getElementById('follower-detail'),
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
  choiceBtns: document.querySelectorAll('.choice-btn'),
  loadingOverlay: document.getElementById('loading-overlay')
};

// ============ 加载状态 ============
function showLoading(text) {
  if (dom.loadingOverlay) {
    dom.loadingOverlay.querySelector('.loading-text').textContent = text || '神谕降临中…';
    dom.loadingOverlay.classList.remove('hidden');
  }
}

function hideLoading() {
  if (dom.loadingOverlay) {
    dom.loadingOverlay.classList.add('hidden');
  }
}

// ============ JSON 解析辅助 ============
function extractJSON(text) {
  // 尝试从 AI 回复中提取 JSON
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch (e) {}
  }
  // 尝试直接解析
  try { return JSON.parse(text.trim()); } catch (e) {}
  // 尝试找 { } 块
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch (e) {}
  }
  return null;
}

// ============ AI 生成初始属性 ============
async function aiGenerateAttributes(godName) {
  const prompt = `你是一个奇幻游戏的世界观设计师。玩家创建了一位名为"${godName}"的新生神明。
请根据这个神名的含义、意境和气质，随机分配初始属性。

请严格返回以下JSON格式（不要加任何其他文字）：
{
  "divinePower": <10-80之间的整数>,
  "faith": <10-60之间的整数>,
  "followers": {
    "fanatic": <0-3之间的整数，狂信徒>,
    "devout": <1-5之间的整数，虔信徒>,
    "normal": <2-8之间的整数，普通信徒>,
    "skeptic": <0-4之间的整数，疑信徒>,
    "fake": <0-2之间的整数，伪信徒>
  },
  "title": "<根据神名给出一个简短的神明称号，如'风暴之主'、'慈悲圣者'等>",
  "description": "<一句话描述这位神明降世时的异象，30字以内>"
}`;

  const result = await askAI(prompt);
  if (!result) return null;
  const parsed = extractJSON(result);
  if (!parsed) return null;

  // 验证数据合理性
  if (typeof parsed.divinePower !== 'number' || typeof parsed.faith !== 'number') return null;
  if (!parsed.followers || typeof parsed.followers !== 'object') return null;

  return parsed;
}

// ============ AI 生成祈祷事件 ============
async function aiGeneratePrayer(godName, day, power, faith) {
  const prompt = `你是一个奇幻游戏的事件生成器。当前是"${godName}"神明的第${day}天。
神力：${power}，信仰：${faith}。

请生成一个凡人向神明祈祷的事件。要有创意，不要重复常见的祈祷。

请严格返回以下JSON格式（不要加任何其他文字）：
{
  "icon": "<一个合适的emoji>",
  "person": "<祈祷者的描述，如'一位失明的老琴师'>",
  "request": "<祈祷的内容，20-40字>",
  "effects": {
    "bless": {
      "power": <-15到-2之间>,
      "faith": <+3到+15之间>,
      "followers": {"<类型>": <数量>, ...},
      "text": "<赐福后的结果描述，20-40字>"
    },
    "ignore": {
      "power": 0,
      "faith": <-6到+1之间>,
      "followers": {"<类型>": <数量>, ...},
      "text": "<无视后的结果描述，20-40字>"
    },
    "punish": {
      "power": <-8到-2之间>,
      "faith": <-8到+8之间>,
      "followers": {"<类型>": <数量>, ...},
      "text": "<惩罚后的结果描述，20-40字>"
    }
  }
}

followers类型只能是：fanatic(狂信徒)、devout(虔信徒)、normal(普通信徒)、skeptic(疑信徒)、fake(伪信徒)。
每个选择的followers变化总和应在-3到+3之间。`;

  const result = await askAI(prompt);
  if (!result) return null;
  const parsed = extractJSON(result);
  if (!parsed) return null;

  // 基本验证
  if (!parsed.icon || !parsed.person || !parsed.request || !parsed.effects) return null;
  if (!parsed.effects.bless || !parsed.effects.ignore || !parsed.effects.punish) return null;

  return parsed;
}

// ============ 游戏函数 ============

async function startGame() {
  const name = dom.nameInput.value.trim();
  if (!name) {
    dom.nameInput.style.borderColor = '#c47a5a';
    dom.nameInput.placeholder = '神明必须有名字！';
    return;
  }
  state.godName = name;

  // 尝试 AI 生成属性
  showLoading('天命正在编织…');
  const attrs = await aiGenerateAttributes(name);
  hideLoading();

  if (attrs) {
    state.divinePower = clamp(attrs.divinePower, 10, 80);
    state.faith = clamp(attrs.faith, 10, 60);
    state.followers = {
      fanatic: clamp(attrs.followers.fanatic || 0, 0, 3),
      devout: clamp(attrs.followers.devout || 2, 1, 5),
      normal: clamp(attrs.followers.normal || 4, 2, 8),
      skeptic: clamp(attrs.followers.skeptic || 1, 0, 4),
      fake: clamp(attrs.followers.fake || 0, 0, 2)
    };

    // 显示降世异象
    dom.godName.textContent = name;
    dom.nameScreen.classList.add('hidden');
    dom.gameScreen.classList.remove('hidden');
    updateUI();

    const title = attrs.title || '';
    const desc = attrs.description || '';
    if (title || desc) {
      const msg = title ? `「${title}」${name}降世！${desc}` : desc;
      showFeedback(msg, 'event-feedback');
      addLog(`🌟 ${msg}`);
    }
  } else {
    // 降级：使用默认属性
    state.divinePower = 50;
    state.faith = 30;
    state.followers = { fanatic: 1, devout: 3, normal: 4, skeptic: 2, fake: 0 };
    dom.godName.textContent = name;
    dom.nameScreen.classList.add('hidden');
    dom.gameScreen.classList.remove('hidden');
    updateUI();
  }

  generatePrayer();
}

// 回车键开始游戏
document.getElementById('name-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') startGame();
});

async function generatePrayer() {
  setButtonsDisabled(true);
  state.currentEffects = null;

  // 尝试 AI 生成
  showLoading('聆听凡人的祈祷…');
  const aiPrayer = await aiGeneratePrayer(state.godName, state.day, state.divinePower, state.faith);
  hideLoading();

  if (aiPrayer) {
    state.currentPrayer = {
      icon: aiPrayer.icon,
      person: aiPrayer.person,
      request: aiPrayer.request,
      type: '__ai__'
    };
    state.currentEffects = aiPrayer.effects;
  } else {
    // 降级到本地数据
    const prayer = prayers[Math.floor(Math.random() * prayers.length)];
    state.currentPrayer = prayer;
    state.currentEffects = null;
  }

  dom.prayerIcon.textContent = state.currentPrayer.icon;
  dom.prayerIcon.classList.remove('pulse');
  void dom.prayerIcon.offsetWidth;
  dom.prayerIcon.classList.add('pulse');

  dom.prayerText.textContent = `${state.currentPrayer.person}${state.currentPrayer.request}`;
  setButtonsDisabled(false);
}

function makeChoice(choice) {
  if (!state.currentPrayer) return;
  setButtonsDisabled(true);

  const prayer = state.currentPrayer;
  let effect;

  if (state.currentEffects) {
    // AI 生成的效果
    effect = state.currentEffects[choice];
    // 确保 followers 字段存在
    if (!effect.followers) effect.followers = {};
  } else {
    // 本地数据效果
    effect = effects[choice][prayer.type];
  }

  // 应用神力和信仰
  state.divinePower = clamp(state.divinePower + (effect.power || 0), 0, 100);
  state.faith = clamp(state.faith + (effect.faith || 0), 0, 100);

  // 应用信徒变化
  applyFollowerChanges(effect.followers || {});

  // 信徒贡献的信仰加成（每回合结算）
  const faithBonus = Math.floor(getFaithFromFollowers() / 5);
  state.faith = clamp(state.faith + faithBonus, 0, 100);

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

// ============ 信徒变化处理 ============
function applyFollowerChanges(changes) {
  for (const [type, delta] of Object.entries(changes)) {
    if (FOLLOWER_TYPES[type]) {
      state.followers[type] = Math.max(0, (state.followers[type] || 0) + delta);
    }
  }
}

function triggerRandomEvent() {
  const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];

  state.divinePower = clamp(state.divinePower + event.power, 0, 100);
  state.faith = clamp(state.faith + event.faith, 0, 100);
  applyFollowerChanges(event.followers || {});

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
  const total = getTotalFollowers();
  dom.divinePower.textContent = state.divinePower;
  dom.faith.textContent = state.faith;
  dom.followers.textContent = total;
  dom.day.textContent = state.day;

  dom.powerBar.style.width = state.divinePower + '%';
  dom.faithBar.style.width = state.faith + '%';

  // 更新信徒详情
  if (dom.followerDetail) {
    let html = '';
    for (const [type, info] of Object.entries(FOLLOWER_TYPES)) {
      const count = state.followers[type] || 0;
      if (count > 0) {
        html += `<span class="follower-type" title="${info.desc}">${info.icon}${info.name}×${count}</span>`;
      }
    }
    dom.followerDetail.innerHTML = html;
  }

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
  const total = getTotalFollowers();
  let title = '', text = '';

  if (total <= 0) {
    title = '💔 被遗忘';
    text = `最后一位信徒也离你而去。没有了信仰，你的神性火花消散于虚无。"${state.godName}"这个名字被时间遗忘了。`;
  } else if (state.divinePower <= 0 && state.faith <= 0) {
    title = '💀 陨落之神';
    text = `没有神力，没有信仰，${state.godName}化为凡尘。天界关闭了大门。`;
  } else if (state.faith >= 100 && total >= 50) {
    title = '🌟 飞升成功！';
    text = `${state.godName}已成为至高神明！拥有${total}位虔诚的信徒和满溢的信仰，你升入了最高神殿！`;
  } else if (state.day > 50) {
    title = '🏛️ 传说时代';
    text = `五十天过去了，奇迹的时代落幕。${state.godName}带着${total}位信徒，在众神之中占据了一席之地。`;
  } else {
    return false;
  }

  // 构建信徒详情
  let followerSummary = '';
  for (const [type, info] of Object.entries(FOLLOWER_TYPES)) {
    const count = state.followers[type] || 0;
    if (count > 0) followerSummary += `${info.icon}${info.name}×${count} `;
  }

  dom.gameoverTitle.textContent = title;
  dom.gameoverText.textContent = text;
  dom.gameoverStats.innerHTML = `
    ⚡ 神力：${state.divinePower} | 🙏 信仰：${state.faith} | 👥 信徒：${total} | 📅 天数：${state.day}
    <br><small>${followerSummary}</small>
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
  if (effect.power && effect.power !== 0) parts.push(`神力${effect.power > 0 ? '+' : ''}${effect.power}`);
  if (effect.faith && effect.faith !== 0) parts.push(`信仰${effect.faith > 0 ? '+' : ''}${effect.faith}`);
  // 信徒变化汇总
  const fChanges = effect.followers || {};
  for (const [type, delta] of Object.entries(fChanges)) {
    if (delta !== 0 && FOLLOWER_TYPES[type]) {
      parts.push(`${FOLLOWER_TYPES[type].name}${delta > 0 ? '+' : ''}${delta}`);
    }
  }
  return parts.length ? `（${parts.join('，')}）` : '';
}
