import {
  ACTION_LABEL_CONFIG,
  ACTION_MODE_CONFIG,
  COMMAND_CONFIG,
  COMBAT_ITEM_CONFIG,
  CULTIVATION_BASE_RATE,
  DEFAULT_INVENTORY,
  MAP_CONFIG,
  EVENT_CONFIG,
  PILL_CONFIG,
  REALM_CONFIG,
  MONSTER_CONFIG,
  EQUIPMENT_CONFIG,
} from "./game-data.js";
import { CHAPTER_MONSTERS, VILLAGE_GOSSIPS } from "./story-data.js";

export const REALMS = REALM_CONFIG;

const MAP_ID_ALIAS = {
  "map-6001": "village",
  "map-60015": "village-wild",
  "map-6002": "backhill",
  "map-6003": "town",
  "map-6004": "moor",
  "map-6005": "tainan",
  "map-6006": "tainan-market",
};

function mapAliasFromId(id) {
  return MAP_ID_ALIAS[id] || id;
}

function commandActionsForMap(rawId) {
  const global = COMMAND_CONFIG.filter((row) => row.mapId === "global" && row.action);
  const local = COMMAND_CONFIG.filter((row) => row.mapId === rawId && row.action);
  return [...new Set([...local, ...global].map((row) => row.action))];
}

function hasAnyNormalLoot(player) {
  return ["野兽肉", "蛇胆", "完整的狼皮", "铜钱", "银两", "污染兽肉"].some(
    (name) => (player.inventory[name] || 0) > 0
  );
}

function checkCommandCondition(player, row) {
  const text = row.condition || "";
  if (!text || text.includes("无条件") || text.includes("状态 == IDLE")) {
    return true;
  }
  if (text.includes("法力 >= 10")) {
    return player.spirit >= 10;
  }
  if (text.includes("背包有凡俗杂物")) {
    return hasAnyNormalLoot(player);
  }
  if (text.includes("碎银 >= 5")) {
    return player.silver >= 5;
  }
  if (text.includes("持有[下品灵石]")) {
    return (player.inventory["下品灵石"] || 0) > 0;
  }
  if (text.includes("境界 >= 炼气一层")) {
    return player.realmIndex >= 1;
  }
  if (text.includes("灵石 >= 1")) {
    return player.stones >= 1 || (player.inventory["下品灵石"] || 0) >= 1;
  }
  if (text.includes("灵石 >= 2")) {
    return player.stones >= 2 || (player.inventory["下品灵石"] || 0) >= 2;
  }
  if (text.includes("主线已激活金手指")) {
    return player.storyFlags.awakenedHand;
  }
  if (text.includes("拥有[基础阵旗]")) {
    return (player.inventory["基础阵旗"] || 0) > 0;
  }
  if (text.includes("宗门身份 == 外门")) {
    return player.sectRole === "外门";
  }
  if (text.includes("门派贡献 >= 100")) {
    return (player.sectContribution || 0) >= 100;
  }
  if (text.includes("境界 < 筑基期")) {
    return true;
  }
  if (text.includes("首次到达该地图")) {
    return !player.storyFlags.chapterFinished;
  }
  return true;
}

function supportedMainCommand(row) {
  return [
    "openInventory",
    "openSkills",
    "cultivate",
    "openGoldFinger",
    "stopAction",
    "villageRest",
    "villageChat",
    "villageWildHunt",
    "backhillSearch",
    "townSell",
    "townSmith",
    "townPawn",
    "moorTraverse",
    "move",
  ].includes(row.action);
}

export const MAP_NODES = MAP_CONFIG.map((row) => ({
  id: mapAliasFromId(row.id),
  rawId: row.id,
  name: row.name,
  zone: row.zone,
  costMonths: row.moveCostMonths,
  description: row.note || row.commandsText || row.name,
  actions: commandActionsForMap(row.id),
  adjacent: row.adjacent.map(mapAliasFromId),
  auraMultiplier: row.auraMultiplier,
}));

export { ACTION_LABEL_CONFIG };
export { ACTION_MODE_CONFIG };

const HANDS = [
  {
    key: "bottle",
    name: "造化之瓶",
    style: "灵农大亨流",
    description: "可缓慢催熟灵草，后期偏向种植、卖药、资源滚雪球。",
    bonus: { alchemy: 4, fortune: 2, cultivationBuff: 0.1 },
  },
  {
    key: "stone",
    name: "混沌石珠",
    style: "变废为宝捡漏流",
    description: "可提纯废丹与劣质材料，降低丹毒风险。",
    bonus: { detox: 15, alchemy: 2, cultivationBuff: 0.05 },
  },
  {
    key: "mirror",
    name: "衍天之镜",
    style: "全能宗师流",
    description: "可在幻境中无损推演炼丹与功法，适合悟性流成长。",
    bonus: { comprehension: 4, alchemy: 3, cultivationBuff: 0.08 },
  },
];

const EQUIPMENT_SLOTS = ["weapon", "armor", "accessory"];

const SLOT_LABELS = {
  weapon: "法器",
  armor: "护甲",
  accessory: "佩饰",
};

const EQUIPMENT_BASES = COMBAT_ITEM_CONFIG.filter((item) => EQUIPMENT_SLOTS.includes(item.slot));

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function randomFrom(list) {
  return list[randomInt(0, list.length - 1)];
}

function createRoots() {
  const roots = ["金", "木", "水", "火", "土"];
  const count = randomInt(4, 5);
  const shuffled = [...roots].sort(() => Math.random() - 0.5).slice(0, count);
  const purities = shuffled.map((name, index) => ({
    name,
    purity: randomInt(index === 0 ? 24 : 12, index === 0 ? 42 : 28),
  }));
  purities.sort((a, b) => b.purity - a.purity);
  return purities;
}

function getAptitudeLabel(roots) {
  if (roots.length === 1 && roots[0].purity > 90) {
    return "天灵根";
  }
  if (roots.length <= 3) {
    return "真灵根";
  }
  return "伪灵根";
}

function scaleEquipment(base, tier) {
  return {
    attack: Math.max(0, Math.floor(base.attack / 15) + tier),
    defense: Math.max(0, Math.floor(base.defense / 25) + tier),
    hp: (base.defense > 0 ? 12 : 4) + tier * 5,
    spirit: Math.max(0, 4 - (base.senseCost || 0)) + tier * 2,
  };
}

function createEquipment(slot, player) {
  const base = randomFrom(EQUIPMENT_BASES.filter((item) => item.slot === slot));
  const tier = Math.max(0, Math.floor(player.realmIndex / 3));
  const scaled = scaleEquipment(base, tier);
  return {
    id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slot,
    name: base.name,
    type: base.type,
    ...scaled,
    manaCost: base.manaCost,
    senseCost: base.senseCost,
  };
}

function createLifespanCap(realmIndex) {
  const realm = REALMS[realmIndex] || REALMS[0];
  const [min, max] = realm.lifespan;
  return randomInt(min, max);
}

function pushLog(player, text, type = "normal") {
  player.logs.unshift({ text, type });
  player.logs = player.logs.slice(0, 80);
}

function renderEventText(player, text) {
  return String(text || "")
    .replace(/\{handName\}/g, player.hand?.name || "")
    .replace(/\{handDescription\}/g, player.hand?.description || "")
    .replace(/\{playerName\}/g, player.name || "");
}

function shouldInterruptOnEvent(eventConfig) {
  const text = eventConfig.text || "";
  return eventConfig.id.includes("_Main") || text.includes("[🌟奇遇]") || text.includes("[主线]");
}

function getCounterValue(player, key) {
  const aliases = {
    backhill: "backhillSearches",
    wolf: "wolfKills",
    moor: "moorSteps",
  };
  const realKey = aliases[key] || key;
  return player.counters?.[realKey] || 0;
}

export function evaluateCondition(player, conditionStr) {
  if (!conditionStr || conditionStr === "无条件" || conditionStr === "无") {
    return true;
  }

  const andGroups = conditionStr.split(";");
  for (const group of andGroups) {
    if (!group.trim()) {
      continue;
    }
    const orConds = group.split("||");
    let groupPassed = false;

    for (const cond of orConds) {
      const match = cond.trim().match(/(prop|item|flag|count):(.+?)(>=|<=|>|<|==|!=)(.+)/);
      if (!match) {
        continue;
      }

      const [, type, key, op, rawVal] = match;
      const expected = Number(rawVal);
      let actual = 0;

      if (type === "prop") actual = player[key] || 0;
      if (type === "item") actual = player.inventory[key] || 0;
      if (type === "flag") actual = player.storyFlags[key] ? 1 : 0;
      if (type === "count") actual = getCounterValue(player, key);

      let passed = false;
      if (op === ">=") passed = actual >= expected;
      if (op === "<=") passed = actual <= expected;
      if (op === ">") passed = actual > expected;
      if (op === "<") passed = actual < expected;
      if (op === "==") passed = actual === expected;
      if (op === "!=") passed = actual !== expected;

      if (passed) {
        groupPassed = true;
        break;
      }
    }

    if (!groupPassed) {
      return false;
    }
  }

  return true;
}

function applyEventRewards(player, eventConfig) {
  if (eventConfig.rewards && eventConfig.rewards !== "无") {
    eventConfig.rewards.split(";").forEach((rewardStr) => {
      if (!rewardStr) return;
      const [type, key, rawVal] = rewardStr.split(":");
      const numVal = Number(rawVal || 0);
      if (!type || !key) return;
      if (type === "item") {
        player.inventory[key] = (player.inventory[key] || 0) + numVal;
      } else if (type === "prop") {
        if (key === "lifespan") player.lifespan = Math.max(player.lifespan, numVal);
        else player[key] = (player[key] || 0) + numVal;
      }
    });
  }

  if (eventConfig.flags && eventConfig.flags !== "无") {
    eventConfig.flags.split(";").forEach((flagStr) => {
      if (!flagStr) return;
      const [type, key, rawVal] = flagStr.split(":");
      if (!type || !key) return;
      if (type === "flag") player.storyFlags[key] = rawVal === "1" || rawVal === "true";
    });
  }
}

function dispatchEvent(player, commandAction) {
  const validEvents = EVENT_CONFIG.filter(
    (event) => event.command === commandAction && evaluateCondition(player, event.condition)
  );
  if (validEvents.length === 0) {
    return null;
  }

  const totalWeight = validEvents.reduce((sum, event) => sum + event.weight, 0);
  let roll = Math.random() * totalWeight;
  let selectedEvent = validEvents[validEvents.length - 1];

  for (const event of validEvents) {
    roll -= event.weight;
    if (roll <= 0) {
      selectedEvent = event;
      break;
    }
  }

  pushLog(player, renderEventText(player, selectedEvent.text), selectedEvent.type);
  applyEventRewards(player, selectedEvent);
  if (shouldInterruptOnEvent(selectedEvent)) {
    player.pendingInterruptMessage = "触发关键事件，当前持续行动已中断。";
  }
  return selectedEvent;
}

function spendMonths(player, months, reason) {
  player.age += months / 12;
  if (reason) {
    pushLog(player, `${reason}，耗时 ${months} 个月。`);
  }
}

function checkLifespan(player) {
  if (player.age >= player.lifespan) {
    player.hp = 0;
    pushLog(player, "寿元耗尽，你在漫长求道路上老死。", "warning");
  }
}

function nextRealm(player) {
  return REALMS[player.realmIndex + 1] || null;
}

export function createNewPlayer(name = "韩立") {
  const roots = createRoots();
  const hand = randomFrom(HANDS);
  const firstTarget = REALMS[1];
  const player = {
    name,
    realmIndex: 0,
    age: 16,
    lifespan: createLifespanCap(0),
    physique: randomInt(22, 46),
    comprehension: randomInt(18, 42),
    mindset: randomInt(20, 45),
    fortune: randomInt(18, 44),
    roots,
    aptitude: getAptitudeLabel(roots),
    hp: 70,
    maxHp: 70,
    spirit: 18,
    maxSpirit: 18,
    attack: 8,
    defense: 4,
    cultivation: 0,
    cultivationNeeded: firstTarget.cultivationNeeded,
    alchemySkill: 0,
    danPoison: 0,
    cultivationBuff: 0,
    insight: 10,
    silver: 80,
    stones: 0,
    reputation: 0,
    currentNodeId: "village",
    selectedDestinationId: "backhill",
    unlockedNodes: ["village"],
    storyFlags: {
      introShown: true,
      foundManual: false,
      awakenedHand: false,
      townPassed: false,
      moorCleared: false,
      pawnHintDone: false,
      chapterFinished: false,
    },
    counters: {
      backhillSearches: 0,
      wolfKills: 0,
      moorSteps: 0,
    },
    hand,
    equipment: { weapon: null, armor: null, accessory: null },
    equipmentBag: [],
    inventory: { ...DEFAULT_INVENTORY },
    logs: [],
  };

  pushLog(
    player,
    `${name}以${player.aptitude}开局，主灵根为${roots[0].name}(${roots[0].purity})，寿元上限 ${player.lifespan} 岁。`,
    "positive"
  );
  dispatchEvent(player, "opening");
  pushLog(player, `你在后山得来的残器中蕴藏着${hand.name}，本局流派为${hand.style}。`, "positive");
  return normalize(player);
}

// 通用：根据装备名称从配置表中生成一件独立的装备实体
export function generateEquipmentByName(name) {
  // 从配置总表中查找基础数据
  const baseDef = EQUIPMENT_CONFIG.find(item => item.name === name);
  if (!baseDef) {
    console.error(`装备配置库中未找到: ${name}`);
    return null;
  }

  // 生成带有唯一 ID 的实例
  return {
    id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    baseId: baseDef.id,   // 记录来源于哪条配置ID
    name: baseDef.name,
    slot: baseDef.slot,
    type: baseDef.type,
    attack: baseDef.attack || 0,
    defense: baseDef.defense || 0,
    hp: 0,
    spirit: 0,
    manaCost: baseDef.manaCost || 0,
    senseCost: baseDef.senseCost || 0
  };
}

export function getRealmName(player) {
  return REALMS[player.realmIndex]?.name || REALMS[0].name;
}

export function getCurrentNode(player) {
  return MAP_NODES.find((node) => node.id === player.currentNodeId) || MAP_NODES[0];
}

export function getAdjacentNodes(player) {
  const current = getCurrentNode(player);
  return (current.adjacent || [])
    .map((id) => MAP_NODES.find((node) => node.id === id))
    .filter(Boolean);
}

export function getNextNode(player) {
  const adjacent = getAdjacentNodes(player);
  if (player.selectedDestinationId) {
    return adjacent.find((node) => node.id === player.selectedDestinationId) || adjacent[0] || null;
  }
  return adjacent[0] || null;
}

export function canMoveToNode(player, destinationId) {
  const current = getCurrentNode(player);
  const node = getAdjacentNodes(player).find((item) => item.id === destinationId);
  if (!node) {
    return { ok: false, reason: "该节点当前不可直达。" };
  }
  if (current.id === "town" && node.id === "moor" && !player.storyFlags.pawnHintDone) {
    return { ok: false, reason: "需要先去当铺探问，获得黑原与太南谷的指引。" };
  }
  if (node.id === "moor" && player.realmIndex < 1) {
    return { ok: false, reason: "迷雾黑原过于凶险，至少需炼气一层。" };
  }
  if (current.id === "moor" && node.id === "tainan" && !player.storyFlags.moorCleared) {
    return { ok: false, reason: "必须先闯过黑原深处的血线蛇阻拦。" };
  }
  if (current.id === "tainan" && node.id === "tainan-market" && !player.storyFlags.chapterFinished) {
    return { ok: false, reason: "需先在太南谷外围完成异宝觉醒。" };
  }
  if (node.id === "tainan-market" && (player.inventory["下品灵石"] || 0) < 1 && player.stones < 1) {
    return { ok: false, reason: "进入太南谷坊市需缴纳 1 块下品灵石。" };
  }
  return { ok: true, reason: "" };
}

export function getSlotLabel(slot) {
  return SLOT_LABELS[slot] || slot;
}

export function getEquippedItem(player, slot) {
  return player.equipmentBag.find((item) => item.id === player.equipment[slot]) || null;
}

export function getEquipmentBonuses(player) {
  return EQUIPMENT_SLOTS.reduce(
    (bonus, slot) => {
      const item = getEquippedItem(player, slot);
      if (!item) {
        return bonus;
      }
      bonus.attack += item.attack || 0;
      bonus.defense += item.defense || 0;
      bonus.hp += item.hp || 0;
      bonus.spirit += item.spirit || 0;
      return bonus;
    },
    { attack: 0, defense: 0, hp: 0, spirit: 0 }
  );
}

export function getAttack(player) {
  return player.attack + getEquipmentBonuses(player).attack;
}

export function getDefense(player) {
  return player.defense + getEquipmentBonuses(player).defense;
}

export function getMaxHp(player) {
  return player.maxHp + getEquipmentBonuses(player).hp;
}

export function getMaxSpirit(player) {
  return player.maxSpirit + getEquipmentBonuses(player).spirit;
}

export function getCultivationRate(player) {
  const rootPenalty = player.roots.length ** 1.5;
  const mainPurity = player.roots[0]?.purity || 20;
  const buff = 1 + (player.cultivationBuff || 0) + (player.hand.bonus.cultivationBuff || 0);
  return (
    CULTIVATION_BASE_RATE *
    (mainPurity / rootPenalty) *
    (1 + player.comprehension / 200) *
    buff
  );
}

export function getAvailableActions(player, page = "main") {
  if (page === "combat") {
    return [];
  }
  if (page === "cave") {
    return ["cultivate", "alchemy", "breakthrough"];
  }
  const current = getCurrentNode(player);
  const localRows = COMMAND_CONFIG.filter((row) => row.mapId === current.rawId && row.action);
  const globalRows = COMMAND_CONFIG.filter((row) => row.mapId === "global" && row.action);
  const allowed = [...localRows, ...globalRows].filter(
    (row) => supportedMainCommand(row) && checkCommandCondition(player, row)
  );
  return [...allowed.map((row) => row.action), "exportSave"];
}

function normalize(player) {
  if (!player.logs) {
    player.logs = [];
  }
  if (!player.inventory) {
    player.inventory = { ...DEFAULT_INVENTORY };
  }
  if (!player.equipment) {
    player.equipment = { weapon: null, armor: null, accessory: null };
  }
  if (!player.equipmentBag) {
    player.equipmentBag = [];
  }
  if (!player.unlockedNodes) {
    player.unlockedNodes = ["village"];
  }
  if (!("selectedDestinationId" in player)) {
    player.selectedDestinationId = getAdjacentNodes(player)[0]?.id || null;
  }
  if (!player.storyFlags) {
    player.storyFlags = {
      introShown: true,
      foundManual: false,
      awakenedHand: false,
      townPassed: false,
      moorCleared: false,
      pawnHintDone: false,
      chapterFinished: false,
    };
  }
  if (!player.counters) {
    player.counters = {
      backhillSearches: 0,
      wolfKills: 0,
      moorSteps: 0,
    };
  }
  if (!player.combat) {
    player.combat = { isActive: false, enemy: null, logs: [] };
  }
  if (!player.hand) {
    player.hand = randomFrom(HANDS);
  }
  if (!("pendingInterruptMessage" in player)) {
    player.pendingInterruptMessage = "";
  }
  player.hp = clamp(player.hp, 0, getMaxHp(player));
  player.spirit = clamp(player.spirit, 0, getMaxSpirit(player));
  checkLifespan(player);
  return player;
}

export function getBreakthroughInfo(player) {
  const target = nextRealm(player);
  if (!target) {
    return { rate: 0, requirement: "当前版本暂未开放更高境界。" };
  }
  let requirement = target.aidItem ? `建议准备${target.aidItem}。` : "修为足够即可尝试。";
  if (player.realmIndex === 0) {
    requirement = "需先修成《长春功》并在太南谷吐纳灵气。";
  }
  if (target.key === "qi13") {
    requirement = "炼气大圆满突破筑基必须准备筑基丹。";
  }
  return { rate: target.breakthroughRate, requirement };
}

export function moveForward(player) {
  const node = getNextNode(player);
  if (!node) {
    pushLog(player, "当前卷已走到尽头，后续需扩展太南谷后的修仙界地图。");
    return normalize(player);
  }
  const guard = canMoveToNode(player, node.id);
  if (!guard.ok) {
    pushLog(player, guard.reason, "warning");
    return normalize(player);
  }
  spendMonths(player, node.costMonths, `你从${getCurrentNode(player).name}赶往${node.name}`);
  if (node.id === "tainan-market" && (player.inventory["下品灵石"] || 0) > 0) {
    player.inventory["下品灵石"] -= 1;
    pushLog(player, "你缴纳 1 块下品灵石，顺利进入太南谷坊市。");
  }
  player.currentNodeId = node.id;
  player.selectedDestinationId = getAdjacentNodes(player)[0]?.id || null;
  if (!player.unlockedNodes.includes(node.id)) {
    player.unlockedNodes.push(node.id);
  }
  if (node.id === "moor") {
    pushLog(player, "踏入迷雾黑原后，任何一次失误都可能直接葬身妖口。", "warning");
  }
  return normalize(player);
}

export function moveToNode(player, destinationId) {
  player.selectedDestinationId = destinationId;
  return moveForward(player);
}

export function villageRest(player) {
  spendMonths(player, 0.03, "你回屋歇息");
  player.hp = getMaxHp(player);
  pushLog(player, "你在土炕上睡了一整天，气血恢复到最佳状态。");
  return normalize(player);
}

export function villageChat(player) {
  spendMonths(player, 0.02, "你在村口闲聊");
  const event = dispatchEvent(player, "villageChat");
  if (!event) {
    pushLog(player, `[传闻] ${randomFrom(VILLAGE_GOSSIPS)}`);
  }
  return normalize(player);
}

function parseCultivationFromLootText(text) {
  const raw = String(text || "");
  const match = raw.match(/修为\+(\d+)(?:~(\d+))?/);
  if (!match) return 0;
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  return randomInt(min, max);
}

function gainVillageWildLoot(player, monster) {
  const lootText = monster.loot || "";
  if (lootText.includes("鸡肉")) {
    player.inventory["鸡肉"] = (player.inventory["鸡肉"] || 0) + 1;
  }
  if (lootText.includes("草芯束")) {
    player.inventory["草芯束"] = (player.inventory["草芯束"] || 0) + 1;
  }
  const cultivationGain = parseCultivationFromLootText(lootText);
  if (cultivationGain > 0) {
    player.cultivation += cultivationGain;
    pushLog(player, `你从${monster.name}身上领悟到一点粗浅吐纳法，修为 +${cultivationGain}。`, "positive");
  }
}

export function villageWildHunt(player) {
  spendMonths(player, 0.03, "你在青石村野外巡游打野");
  const monster = randomFrom(CHAPTER_MONSTERS.filter((m) => m.nodeId === "village-wild"));
  if (!monster) {
    pushLog(player, "野外一片寂静，你绕了半天也没找到可下手的目标。");
    return normalize(player);
  }
  player.hp -= monster.attack;
  gainVillageWildLoot(player, monster);
  pushLog(player, `你击退${monster.name}，损失气血 ${monster.attack}，拾得 ${monster.loot}。`);
  return normalize(player);
}

function gainBackhillLoot(player, monster) {
  if (monster.loot === "野兽肉") {
    player.inventory["野兽肉"] = (player.inventory["野兽肉"] || 0) + 1;
  }
  if (monster.loot === "蛇胆") {
    player.inventory["蛇胆"] = (player.inventory["蛇胆"] || 0) + 1;
  }
  if (monster.loot === "完整的狼皮") {
    player.inventory["完整的狼皮"] = (player.inventory["完整的狼皮"] || 0) + 1;
    player.counters.wolfKills += 1;
  }
}

export function backhillSearch(player) {
  spendMonths(player, 0.03, "你在无名后山进山搜寻");
  player.counters.backhillSearches += 1;

  const event = dispatchEvent(player, "backhillSearch");
  if (!event) {
    const monster = randomFrom(CHAPTER_MONSTERS.filter((m) => m.nodeId === "backhill"));
    const hurt = monster.attack;
    player.hp -= hurt;
    gainBackhillLoot(player, monster);
    pushLog(player, `你遭遇${monster.name}，损失气血 ${hurt}，拾得 ${monster.loot}。`);
  }
  return normalize(player);
}

export function townSell(player) {
  spendMonths(player, 0.03, "你在凡俗集镇摆摊售卖");
  const sellables = [
    ["野兽肉", 4],
    ["蛇胆", 8],
    ["完整的狼皮", 15],
  ];
  let earned = 0;
  sellables.forEach(([item, price]) => {
    const count = player.inventory[item] || 0;
    if (count > 0) {
      earned += count * price;
      delete player.inventory[item];
    }
  });
  if (earned === 0) {
    pushLog(player, "你摊前冷清，身上也没什么可卖的东西。");
  } else {
    player.silver += earned;
    pushLog(player, `你把猎得的材料统统卖掉，换回碎银 ${earned}。`, "positive");
  }
  return normalize(player);
}

export function townSmith(player) {
  spendMonths(player, 0.02, "你去了一趟铁匠铺");

  // 通过名称判断是否已经拥有
  const hasDagger = player.equipmentBag.some(eq => eq.name === "精铁匕首") ||
    (getEquippedItem(player, "weapon")?.name === "精铁匕首");

  const hasCrossbow = player.equipmentBag.some(eq => eq.name === "凡人连弩") ||
    (getEquippedItem(player, "weapon")?.name === "凡人连弩");

  if (!hasDagger && player.silver >= 30) {
    player.silver -= 30;
    // 直接用工厂函数生成装备
    const eq = generateEquipmentByName("精铁匕首");
    if (eq) player.equipmentBag.push(eq);

    pushLog(player, "你花 30 两买下精铁匕首，已放入【装备背包】，请前往洞府手动佩戴。", "positive");

  } else if (!hasCrossbow && player.silver >= 80) {
    player.silver -= 80;
    const eq = generateEquipmentByName("凡人连弩");
    if (eq) player.equipmentBag.push(eq);

    pushLog(player, "你花 80 两买下凡人连弩，已放入【装备背包】，请前往洞府手动佩戴。", "positive");

  } else {
    pushLog(player, "铁匠铺里要么你已买过顺手兵器，要么手头银两不足。");
  }

  return normalize(player);
}

export function townPawn(player) {
  spendMonths(player, 0.02, "你走进当铺探问消息");

  const event = dispatchEvent(player, "townPawn");
  if (!event) {
    pushLog(player, "当前未配置【当铺探问】对应事件。", "warning");
  }
  return normalize(player);
}

export function moorTraverse(player) {
  spendMonths(player, 1, "你在迷雾黑原中谨慎穿行");
  player.counters.moorSteps += 1;
  if (player.counters.moorSteps < 3) {
    return triggerCombat(player, 1006); // 触发瘴气野狗
  }

  if (player.realmIndex < 1) {
    pushLog(player, "血线蛇自迷雾中暴起，你尚未踏入炼气，只能仓皇退走。", "warning");
    player.hp -= 25;
    return normalize(player);
  }

  player.storyFlags.moorCleared = true;
  return triggerCombat(player, 1007); // 触发Boss血线蛇
}

export function awakenAtTainan(player) {
  if (player.currentNodeId !== "tainan" || player.storyFlags.chapterFinished) {
    return normalize(player);
  }
  const event = dispatchEvent(player, "awakenAtTainan");
  if (!event) {
    pushLog(player, "当前未配置【太南谷觉醒】对应事件。", "warning");
  }
  return normalize(player);
}

export function cultivate(player) {
  if (!player.storyFlags.foundManual) {
    pushLog(player, "你尚未得到功法残卷，无法引气入体。", "warning");
    return normalize(player);
  }
  const inMortalChapter = !player.storyFlags.chapterFinished;
  const areaText = player.currentNodeId === "tainan" ? "你在太南谷租住低阶洞府打坐" : "你在绝灵之地勉强吐纳";
  spendMonths(player, 1, areaText);
  if (player.inventory["聚气散"] > 0 && Math.random() < 0.4) {
    player.inventory["聚气散"] -= 1;
    player.cultivationBuff = 0.35;
    pushLog(player, "你服下一份聚气散，修炼速度明显提升。", "positive");
  } else {
    player.cultivationBuff = 0;
  }
  const chapterDebuff = inMortalChapter ? 0.1 : 1;
  const gain = Math.max(1, Math.floor(getCultivationRate(player) * chapterDebuff));
  player.cultivation += gain;
  player.spirit = Math.max(0, player.spirit - 2);
  pushLog(player, `你吐纳天地灵气，修为增加 ${gain}。`, "positive");
  if (player.realmIndex === 0 && player.cultivation >= player.cultivationNeeded) {
    pushLog(player, "你已经触及引气入体门槛，可以尝试突破炼气一层了。", "positive");
  }
  return normalize(player);
}

export function alchemy(player) {
  if (player.currentNodeId !== "tainan") {
    pushLog(player, "凡俗之地没有真正的炼丹条件。", "warning");
    return normalize(player);
  }
  spendMonths(player, 2, "你租用地火房尝试炼丹");
  const pill = PILL_CONFIG["黄龙丹"];
  const baseRecipe = 20;
  const fireQuality = 1;
  const handBonus = player.hand.bonus.alchemy || 0;
  const rate = clamp(
    (baseRecipe + player.alchemySkill * 0.5 + fireQuality * 10 + handBonus * 2) *
    (1 + player.comprehension / 100) -
    15,
    5,
    92
  );
  if (Math.random() * 100 < rate) {
    const yieldCount = randomInt(1, 3);
    player.inventory["黄龙丹"] += yieldCount;
    player.alchemySkill += 2;
    pushLog(
      player,
      `炼丹成功，你得到 ${yieldCount} 枚黄龙丹。当前丹道熟练 ${player.alchemySkill}。`,
      "positive"
    );
  } else {
    player.alchemySkill += 1;
    player.danPoison += Math.max(0, pill.danPoison - (player.hand.bonus.detox || 0));
    pushLog(player, `炼丹失败，药渣反噬，你的丹毒提升至 ${player.danPoison}。`, "warning");
  }
  return normalize(player);
}

export function useItem(player, itemName) {
  if ((player.inventory[itemName] || 0) <= 0) {
    pushLog(player, `${itemName}数量不足。`, "warning");
    return normalize(player);
  }

  const pill = PILL_CONFIG[itemName];
  player.inventory[itemName] -= 1;

  if (itemName === "破障丹" || itemName === "筑基丹") {
    pushLog(player, `${itemName}需在突破时自动生效。`);
    player.inventory[itemName] += 1;
    return normalize(player);
  }

  if (pill?.cultivationGain) {
    player.cultivation += pill.cultivationGain;
  }
  if (pill?.danPoison > 0) {
    const poison = Math.max(0, pill.danPoison - (player.hand.key === "stone" ? 3 : 0));
    player.danPoison += poison;
    pushLog(player, `你服下${itemName}，${pill.effectText}，丹毒 +${poison}。`);
  } else if (pill?.danPoison < 0) {
    player.danPoison = Math.max(0, player.danPoison + pill.danPoison);
    pushLog(player, `你服下${itemName}，${pill.effectText}。`, "positive");
  } else {
    pushLog(player, `你服下${itemName}，${pill?.effectText || "暂无效果说明"}。`);
  }

  return normalize(player);
}

function applyBreakthroughFailure(player, target) {
  const failure = target.failure || "";
  if (failure.includes("气血减半")) {
    player.hp = Math.max(1, Math.floor(player.hp / 2));
  }
  if (failure.includes("气血当前值减半")) {
    player.hp = Math.max(1, Math.floor(player.hp / 2));
  }
  if (failure.includes("掉落20%当前修为")) {
    player.cultivation = Math.max(0, Math.floor(player.cultivation * 0.8));
  }
  if (failure.includes("扣除 20% 当前层修为")) {
    player.cultivation = Math.max(0, Math.floor(player.cultivation * 0.8));
  }
  if (failure.includes("扣除 10% 当前层修为")) {
    player.cultivation = Math.max(0, Math.floor(player.cultivation * 0.9));
  }
  if (failure.includes("修为清零")) {
    player.cultivation = 0;
    spendMonths(player, 12, "你经脉受损，被迫静养");
  }
  if (failure.includes("需静养2年")) {
    spendMonths(player, 24, "你经脉重创，被迫静养");
  }
  if (failure.includes("寿元扣除2年")) {
    player.age += 2;
    player.realmIndex = Math.max(1, player.realmIndex - 1);
  }
  if (failure.includes("扣除 3 年寿元")) {
    player.age += 3;
  }
  if (failure.includes("扣除 1 年寿元")) {
    player.age += 1;
  }
  if (failure.includes("扣除 5 年寿元")) {
    player.age += 5;
  }
  if (failure.includes("寿元折损1年")) {
    player.age += 1;
  }
  if (failure.includes("寿元折损6个月")) {
    player.age += 0.5;
  }
  if (failure.includes("修为倒退一层")) {
    player.realmIndex = Math.max(1, player.realmIndex - 1);
  }
  if (failure.includes("修为倒退两层")) {
    player.realmIndex = Math.max(1, player.realmIndex - 2);
  }
  if (failure.includes("修为倒退至六层一半")) {
    player.realmIndex = Math.min(player.realmIndex, 5);
    player.cultivation = Math.floor((REALMS[6]?.cultivationNeeded || 10000) / 2);
  }
  if (failure.includes("修为倒退")) {
    player.cultivation = Math.max(0, Math.floor(player.cultivation * 0.85));
  }
  player.hp -= 12;
  pushLog(player, `突破失败：${failure}。`, "warning");
}

export function breakthrough(player) {
  const target = nextRealm(player);
  if (!target) {
    pushLog(player, "当前版本暂未开放更高境界。");
    return normalize(player);
  }
  if (player.realmIndex === 0 && !player.storyFlags.foundManual) {
    pushLog(player, "你连功法都未获得，谈不上引气入体。", "warning");
    return normalize(player);
  }
  if (player.realmIndex >= 1 && player.currentNodeId !== "tainan") {
    pushLog(player, "突破需要更稳定的灵脉与护法条件。", "warning");
    return normalize(player);
  }
  if (player.cultivation < player.cultivationNeeded) {
    pushLog(player, `修为不足，当前还需 ${player.cultivationNeeded - player.cultivation} 修为。`, "warning");
    return normalize(player);
  }

  let rate = target.breakthroughRate;
  let usedAidItem = null;
  if (player.comprehension > 40) {
    rate += 0.05;
  }
  if (player.danPoison >= 30) {
    rate -= 0.18;
  }
  if (target.aidItem && player.inventory[target.aidItem] > 0) {
    rate += target.aidBonus;
    player.inventory[target.aidItem] -= 1;
    usedAidItem = target.aidItem;
    pushLog(player, `${target.aidItem}药力化开，本次突破额外提升 ${Math.round(target.aidBonus * 100)}% 成功率。`, "positive");
  }
  if (usedAidItem === "护脉丹") {
    pushLog(player, "护脉丹护住心脉，本次突破至少不会跌落境界。", "positive");
  }

  spendMonths(player, 6, `你闭死关冲击${target.name}`);
  player.cultivation -= player.cultivationNeeded;

  if (Math.random() < rate) {
    player.realmIndex += 1;
    player.lifespan = Math.max(player.lifespan, createLifespanCap(player.realmIndex));
    player.maxHp += 16;
    player.maxSpirit += 10;
    player.attack += 3;
    player.defense += 2;
    player.hp = getMaxHp(player);
    player.spirit = getMaxSpirit(player);
    player.cultivationNeeded = nextRealm(player)?.cultivationNeeded || player.cultivationNeeded;
    pushLog(player, `突破成功，你已踏入${getRealmName(player)}，寿元大限提升至 ${player.lifespan} 岁。`, "positive");
  } else if (target.failure.includes("爆体而亡")) {
    player.hp = 0;
    pushLog(player, "你冲击更高境界失败，灵力逆卷，当场爆体而亡。", "warning");
  } else {
    if (usedAidItem === "护脉丹" && failureWouldDropRealm(target)) {
      const snapshotRealm = player.realmIndex;
      applyBreakthroughFailure(player, target);
      player.realmIndex = snapshotRealm;
      pushLog(player, "护脉丹替你稳住了境界根基，没有发生跌境。", "positive");
      return normalize(player);
    }
    applyBreakthroughFailure(player, target);
  }

  return normalize(player);
}

function failureWouldDropRealm(target) {
  return /倒退一层|倒退两层/.test(target.failure || "");
}

export function equipItem(player, itemId) {
  const item = player.equipmentBag.find((entry) => entry.id === itemId);
  if (!item) {
    pushLog(player, "未找到对应装备。", "warning");
    return normalize(player);
  }
  const old = getEquippedItem(player, item.slot);
  player.equipment[item.slot] = item.id;
  pushLog(player, old ? `你卸下${old.name}，改为装备${item.name}。` : `你装备了${item.name}。`, "positive");
  return normalize(player);
}

export function unequipItem(player, slot) {
  const item = getEquippedItem(player, slot);
  if (!item) {
    pushLog(player, `${getSlotLabel(slot)}位当前没有装备。`, "warning");
    return normalize(player);
  }
  player.equipment[slot] = null;
  pushLog(player, `你卸下了${item.name}。`);
  return normalize(player);
}

export function serializeSave(player) {
  return JSON.stringify(normalize(clone(player)), null, 2);
}

export function parseSave(raw) {
  const data = JSON.parse(raw);
  return normalize({
    ...createNewPlayer(data.name || "韩立"),
    ...data,
    inventory: { ...DEFAULT_INVENTORY, ...(data.inventory || {}) },
    equipment: {
      weapon: data.equipment?.weapon || null,
      armor: data.equipment?.armor || null,
      accessory: data.equipment?.accessory || null,
    },
    equipmentBag: Array.isArray(data.equipmentBag) ? data.equipmentBag : [],
    unlockedNodes: Array.isArray(data.unlockedNodes) && data.unlockedNodes.length ? data.unlockedNodes : ["village"],
    selectedDestinationId: data.selectedDestinationId || null,
    roots: Array.isArray(data.roots) && data.roots.length ? data.roots : createRoots(),
    hand: data.hand || randomFrom(HANDS),
    storyFlags: {
      introShown: Boolean(data.storyFlags?.introShown),
      foundManual: Boolean(data.storyFlags?.foundManual),
      awakenedHand: Boolean(data.storyFlags?.awakenedHand),
      townPassed: Boolean(data.storyFlags?.townPassed),
      moorCleared: Boolean(data.storyFlags?.moorCleared),
      pawnHintDone: Boolean(data.storyFlags?.pawnHintDone),
      chapterFinished: Boolean(data.storyFlags?.chapterFinished),
    },
    counters: {
      backhillSearches: Number(data.counters?.backhillSearches || 0),
      wolfKills: Number(data.counters?.wolfKills || 0),
      moorSteps: Number(data.counters?.moorSteps || 0),
    },
    logs: Array.isArray(data.logs) ? data.logs : [],
  });
}


// ================= 战斗与坊市系统逻辑 =================

export function triggerCombat(player, monsterId) {
  const monsterData = MONSTER_CONFIG.find((m) => m.id === monsterId);
  if (!monsterData) return normalize(player);

  player.combat = {
    isActive: true,
    enemy: { ...monsterData, currentHp: monsterData.hp },
    logs: [`遭遇了 ${monsterData.name}！境界模糊，似有杀气。`]
  };
  pushLog(player, `[⚠️警告] 遭遇强敌 ${monsterData.name}，强行切入斗法！`, "warning");
  return normalize(player);
}

export function executeCombatAction(player, actionType) {
  if (!player.combat || !player.combat.isActive) return player;

  const enemy = player.combat.enemy;
  let playerDamage = 0;
  let actionLog = "";
  let escaped = false;

  switch (actionType) {
    case "spell":
      if (player.spirit < 5) {
        actionLog = "法力不足 5 点，火弹术施展失败！";
      } else {
        player.spirit -= 5;
        playerDamage = 20;
        actionLog = `你施展火弹术，一团烈火砸中对方，造成 ${playerDamage} 点真伤。`;
      }
      break;
    case "artifact":
      const weapon = getEquippedItem(player, "weapon");
      if (!weapon) {
        actionLog = "你未装备法器，双拳难敌四手！";
        playerDamage = getAttack(player);
      } else if (player.spirit < weapon.manaCost) {
        actionLog = `法力不足以驱使 ${weapon.name}！`;
      } else {
        player.spirit -= weapon.manaCost;
        let dmg = getAttack(player);
        if (weapon.type === "凡人兵器" && enemy.trait.includes("蛇鳞")) Math.floor(dmg /= 2);
        playerDamage = dmg;
        actionLog = `你驱使 ${weapon.name} 猛攻，造成 ${playerDamage} 点伤害！`;
      }
      break;
    case "talisman":
      if ((player.inventory["火龙符"] || 0) <= 0) {
        actionLog = "你储物袋中已无火龙符！";
      } else {
        player.inventory["火龙符"] -= 1;
        playerDamage = 50;
        actionLog = `你砸出一张火龙符！化作火龙吞噬对方，造成 ${playerDamage} 点伤害！`;
      }
      break;
    case "beg":
      if (player.silver > 0 || player.stones > 0) {
        player.silver = 0;
        player.stones = Math.floor(player.stones / 2);
        actionLog = "你丢出灵石与银两，趁对方抢夺之际狼狈逃离！";
        escaped = true;
      } else {
        actionLog = "你穷得叮当响，对方嫌弃地拒绝了你的求饶！";
      }
      break;
    case "blood_escape":
      player.age += 5;
      player.maxHp = Math.floor(player.maxHp * 0.8);
      player.hp = Math.min(player.hp, player.maxHp);
      actionLog = "你咬破舌尖施展血遁术！损失 5 年寿元与气血本源，化作血光遁走！";
      escaped = true;
      break;
  }

  player.combat.logs.push(`> [你] ${actionLog}`);
  if (playerDamage > 0) enemy.currentHp -= playerDamage;

  if (escaped) {
    player.combat.isActive = false;
    pushLog(player, "你惊险逃脱了战斗，捡回一条命。");
    return normalize(player);
  }

  if (enemy.currentHp <= 0) {
    player.combat.isActive = false;
    let lootLog = `你击杀了 ${enemy.name}！`;
    if (Math.random() <= enemy.dropRate && enemy.loot) {
      const loots = enemy.loot.split("/").map(s => s.trim().split(" ")[0]);
      loots.forEach(l => {
        player.inventory[l] = (player.inventory[l] || 0) + 1;
        lootLog += ` 获得 ${l}。`;
      });
    }
    pushLog(player, lootLog, "positive");
    return normalize(player);
  }

  const def = getDefense(player);
  const finalEnemyDmg = Math.max(1, enemy.attack - def);
  player.hp -= finalEnemyDmg;
  player.combat.logs.push(`> [敌] ${enemy.name} 发起反击，造成 ${finalEnemyDmg} 点伤害。`);

  if (enemy.trait.includes("剧毒")) {
    player.hp -= 2;
    player.combat.logs.push(`> [敌] 毒气侵体，额外损失 2 点气血。`);
  }

  if (player.hp <= 0) {
    player.combat.isActive = false;
    pushLog(player, `你被 ${enemy.name} 击杀，道消身死。`, "warning");
  }
  return normalize(player);
}

export function tainanMarket(player) {
  spendMonths(player, 0.03, "你在坊市地摊区闲逛");
  const roll = Math.random();
  if (roll < 0.2 && player.stones >= 5) {
    player.stones -= 5;
    pushLog(player, "你轻信散修，花 5 块灵石买了一株『玉髓芝』，仔细一看竟是染色萝卜！", "warning");
  } else if (roll < 0.4 && player.stones >= 10) {
    player.stones -= 10;
    player.inventory["火龙符"] = (player.inventory["火龙符"] || 0) + 1;
    pushLog(player, "你眼力极佳，花 10 块灵石淘到一张完好的【火龙符】！", "positive");
  } else {
    pushLog(player, "逛了半天，尽是些破铜烂铁，毫无收获。");
  }
  return normalize(player);
}

export function leaveBlackMarket(player) {
  if (Math.random() < 0.3) {
    pushLog(player, "你刚走出黑市，神识察觉到一道阴冷的目光锁定了你...", "warning");
    return triggerCombat(player, 1005); // 暂时代替劫修
  } else {
    pushLog(player, "你施展敛气术，在坊市巷弄里绕了几圈，安全甩掉了尾巴。");
    player.currentNodeId = "map-6006"; // 回到太南谷
    return normalize(player);
  }
}
