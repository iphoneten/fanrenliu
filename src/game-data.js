import {
  command_rows,
  equipment_rows,
  event_rows,
  map_rows,
  material_rows,
  monster_rows,
  pill_rows,
  realm_rows,
  skill_rows,
} from "./generated/game-config.js";

export const CULTIVATION_BASE_RATE = 6;
export const REALM_CONFIG_SOURCE = "doc/境界数值配表.xlsx#炼气期境界数值配表";
export const RAW_CONFIG_SOURCE = "doc/*.xlsx -> src/generated/game-config.js";

function parseNumber(value, fallback = 0) {
  if (value == null || value === "") {
    return fallback;
  }
  const match = String(value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

function parsePercentText(value) {
  const text = String(value || "");
  if (text.includes("%")) {
    return parseNumber(text) / 100;
  }
  const raw = parseNumber(text, 0);
  return raw > 1 ? raw / 100 : raw;
}

function normalizeRealmName(name) {
  const text = String(name || "");
  if (text.includes("大圆满")) {
    return "qi13";
  }
  const match = text.match(/炼气([一二三四五六七八九十]+)层/);
  if (!match) {
    return "mortal";
  }
  const mapping = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
  };
  return `qi${mapping[match[1]] || 1}`;
}

function extractAid(row) {
  const text = String(row["关键突破辅助道具"] || "");
  if (!text || text.startsWith("无")) {
    return { aidItem: null, aidBonus: 0 };
  }
  const name = text.split(" ")[0];
  const bonusMatch = text.match(/\+(\d+)%/);
  return {
    aidItem: name,
    aidBonus: bonusMatch ? Number(bonusMatch[1]) / 100 : name === "筑基丹" ? 0.5 : 0,
  };
}

export const REALM_CONFIG = [
  {
    key: "mortal",
    name: "凡人",
    lifespan: [60, 80],
    cultivationNeeded: 0,
    breakthroughRate: 1,
    failure: "无",
    aidItem: null,
    aidBonus: 0,
  },
  ...realm_rows.map((row) => {
    const aid = extractAid(row);
    return {
      key: normalizeRealmName(row["境界名称"]),
      name: row["境界名称"],
      lifespan: [120, 120],
      cultivationNeeded: parseNumber(row["升级所需修为"]),
      breakthroughRate: parsePercentText(row["基础突破成功率"]),
      failure: row["突破失败惩罚"] || "无",
      aidItem: aid.aidItem,
      aidBonus: aid.aidBonus,
    };
  }),
];

function inferPillEffect(text) {
  const raw = String(text || "");
  if (raw.includes("修为")) {
    return { cultivationGain: parseNumber(raw), effectText: raw };
  }
  if (raw.includes("恢复")) {
    return { heal: parseNumber(raw), effectText: raw };
  }
  if (raw.includes("突破率")) {
    return { breakthroughBonus: parsePercentText(raw), effectText: raw };
  }
  if (raw.includes("清除")) {
    return { detox: parseNumber(raw), effectText: raw };
  }
  return { effectText: raw || "无" };
}

export const PILL_CONFIG = Object.fromEntries(
  pill_rows.map((row) => {
    const effect = inferPillEffect(row["核心效果"]);
    return [
      row["名称"],
      {
        id: parseNumber(row["物品ID"]),
        type: row["类型"],
        marketPrice: parseNumber(row["坊市基准价"]),
        effectText: effect.effectText,
        cultivationGain: effect.cultivationGain || 0,
        heal: effect.heal || 0,
        breakthroughBonus: effect.breakthroughBonus || 0,
        detox: effect.detox || 0,
        danPoison: parseNumber(row["丹毒积累"]),
        description: row["策划备注/描述"] || "",
      },
    ];
  })
);

export const DEFAULT_INVENTORY = Object.fromEntries(
  Object.keys(PILL_CONFIG).map((name) => [name, ["聚气散"].includes(name) ? 1 : 0])
);

function inferCombatSlot(type, name) {
  const t = String(type || "");
  if (t.includes("法器")) {
    if (name.includes("盾")) {
      return "armor";
    }
    return "weapon";
  }
  if (t.includes("符宝") || t.includes("异宝")) {
    return "accessory";
  }
  if (t.includes("法术")) {
    return "spell";
  }
  if (t.includes("符箓")) {
    return "talisman";
  }
  if (t.includes("兵器")) {
    return "weapon";
  }
  return "accessory";
}

export const EQUIPMENT_CONFIG = equipment_rows.map((row) => ({
  id: parseNumber(row["装备ID"]),
  name: row["名称"],
  type: row["品阶"],
  slot: inferCombatSlot(row["品阶"], row["名称"]),
  senseCost: parseNumber(row["占用神识"]),
  manaCost: parseNumber(row["耗蓝/回合"]),
  attack: parseNumber(row["攻击力"]),
  defense: parseNumber(row["防御力"]),
  effect: row["特殊效果/描述"] || "",
}));

export const SKILL_CONFIG = skill_rows.map((row) => ({
  id: parseNumber(row["功法ID"]),
  name: row["名称"],
  type: row["类型"],
  requirement: row["学习要求"] || "",
  costText: row["消耗"] || "",
  effect: row["核心效果/威能"] || "",
  description: row["策划备注/描述"] || "",
  slot: inferCombatSlot(row["类型"], row["名称"]),
  attack: parseNumber(row["核心效果/威能"]),
  defense: row["名称"].includes("盾") ? parseNumber(row["核心效果/威能"]) : 0,
  manaCost: parseNumber(row["消耗"]),
  senseCost: 0,
}));

const talismanRows = pill_rows.filter((row) => String(row["类型"] || "").includes("符箓"));

export const COMBAT_ITEM_CONFIG = [
  ...SKILL_CONFIG.map((item) => ({
    key: `skill-${item.id}`,
    name: item.name,
    type: item.type,
    marketPriceText: item.costText || "免费",
    slot: item.slot,
    attack: item.attack,
    defense: item.defense,
    manaCost: item.manaCost,
    senseCost: item.senseCost,
    effect: item.effect,
  })),
  ...EQUIPMENT_CONFIG.map((item) => ({
    key: `equip-${item.id}`,
    name: item.name,
    type: item.type,
    marketPriceText: "",
    slot: item.slot,
    attack: item.attack,
    defense: item.defense,
    manaCost: item.manaCost,
    senseCost: item.senseCost,
    effect: item.effect,
  })),
  ...talismanRows.map((row) => ({
    key: `pill-${parseNumber(row["物品ID"])}`,
    name: row["名称"],
    type: row["类型"],
    marketPriceText: row["坊市基准价"],
    slot: "talisman",
    attack: parseNumber(row["核心效果"]),
    defense: 0,
    manaCost: 0,
    senseCost: 0,
    effect: row["策划备注/描述"] || row["核心效果"] || "",
  })),
];

export const MONSTER_CONFIG = monster_rows.map((row) => ({
  id: parseNumber(row["怪物ID"]),
  nodeName: row["所属节点"],
  name: row["怪物名称"],
  hp: parseNumber(row["气血"]),
  attack: parseNumber(row["攻击"]),
  trait: row["特性/防御技能"] || "",
  loot: row["掉落物品"] || "",
  dropRate: parsePercentText(row["掉率"]),
}));

export const MATERIAL_CONFIG = material_rows.map((row) => ({
  id: parseNumber(row["材料ID"]),
  name: row["名称"],
  tier: row["品阶/类型"] || "",
  source: row["来源途径"] || "",
  usage: row["用途与价值"] || "",
  description: row["描述"] || "",
}));

function normalizeMapNodeId(idText) {
  return `map-${parseNumber(idText)}`;
}

function parseDaysToMonths(text) {
  const raw = String(text || "");
  if (raw.includes("天")) {
    return parseNumber(raw) / 30;
  }
  if (raw.includes("月")) {
    return parseNumber(raw);
  }
  return parseNumber(raw);
}

function parseAdjacent(text) {
  return String(text || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => normalizeMapNodeId(part));
}

export const MAP_CONFIG = map_rows
  .filter((row) => row["地图ID"] && !String(row["地图ID"]).startsWith(":"))
  .map((row) => ({
    chapter: row["所属章节"] || "",
    id: normalizeMapNodeId(row["地图ID"]),
    rawId: parseNumber(row["地图ID"]),
    name: row["节点名称"],
    region: row["区域归属"] || "",
    zone: row["安全级别"] || "",
    auraMultiplier: parseNumber(row["灵气倍率"], 1),
    adjacent: parseAdjacent(row["相邻节点 (可前往)"]),
    moveCostMonths: parseDaysToMonths(row["移动耗时"]),
    commandsText: row["专属交互指令 / 刷怪池"] || "",
    note: row["备注 / 解锁条件"] || "",
  }));

function normalizeCommandId(idText) {
  return `cmd-${parseNumber(idText)}`;
}

function inferCommandAction(name) {
  const mapping = {
    回屋歇息: "villageRest",
    村口闲聊: "villageChat",
    进山搜寻: "backhillSearch",
    摆摊售卖: "townSell",
    铁匠铺: "townSmith",
    当铺探问: "townPawn",
    谨慎穿行: "moorTraverse",
    状态与背包: "openInventory",
    功法与神通: "openSkills",
    盘膝打坐: "cultivate",
    "🌟仙缘异宝": "openGoldFinger",
    "中断/出关": "stopAction",
    逛散修地摊: "tainanMarket",
    离开黑市: "leaveBlackMarket",
    租地火室炼丹: "alchemy",
  };
  return mapping[name] || null;
}

export const COMMAND_CONFIG = command_rows.map((row) => ({
  module: row["所属模块"] || "",
  mapId: parseNumber(row["地图ID"]) === 0 ? "global" : normalizeMapNodeId(row["地图ID"]),
  id: normalizeCommandId(row["指令ID"]),
  name: row["指令名称"],
  action: inferCommandAction(row["指令名称"]),
  type: row["指令类型"] || "一次性",
  condition: row["显示/执行条件"] || "",
  costText: row["执行消耗 (每Tick)"] || "",
  baseTimeText: row["基础耗时"] || "",
  outputText: row["产出/触发事件"] || "",
  stateChange: row["状态机切换"] || "",
}));

export const ACTION_MODE_CONFIG = {
  ...Object.fromEntries(
    COMMAND_CONFIG.filter((row) => row.action).map((row) => [
      row.action,
      row.type === "持续性" ? "repeat" : "single",
    ])
  ),
  move: "single",
  alchemy: "repeat",
  breakthrough: "repeat",
  exportSave: "single",
};

export const ACTION_LABEL_CONFIG = {
  ...Object.fromEntries(
    COMMAND_CONFIG.filter((row) => row.action).map((row) => [row.action, row.name])
  ),
  move: "离开此地",
  alchemy: "炼丹",
  breakthrough: "突破",
  exportSave: "导出存档",
};

function normalizeEventRewardText(text) {
  const raw = String(text || "").trim();
  if (!raw || raw === "无") return raw;
  return raw
    .split(";")
    .map((part) => {
      const trimmed = part.trim();
      const itemMatch = trimmed.match(/^(\w+):([^,:=]+),(.+)$/);
      if (itemMatch) {
        return `${itemMatch[1]}:${itemMatch[2]}:${itemMatch[3]}`;
      }
      return trimmed;
    })
    .join(";");
}

function normalizeEventFlagText(text) {
  const raw = String(text || "").trim();
  if (!raw || raw === "无") return raw;
  return raw
    .split(";")
    .map((part) => {
      const trimmed = part.trim();
      const flagMatch = trimmed.match(/^(\w+):([^:=]+)=(.+)$/);
      if (flagMatch) {
        return `${flagMatch[1]}:${flagMatch[2]}:${flagMatch[3]}`;
      }
      return trimmed;
    })
    .join(";");
}

function normalizeEventConditionText(text) {
  const raw = String(text || "").trim();
  if (!raw || raw === "无条件" || raw === "无") return raw;
  return raw.replace(/(?<![<>=!])=(?![<>=])/g, "==");
}

export const EVENT_CONFIG = event_rows.map((row) => ({
  id: row["事件ID (EventID)"] || "",
  command: inferEventCommand(row["事件ID (EventID)"] || ""),
  weight: parseNumber(row["触发权重/概率"], 0),
  condition: normalizeEventConditionText(row["前置条件 (Condition)"] || ""),
  text: row["事件文本 (Log Text)"] || "",
  rewards: normalizeEventRewardText(row["奖励/产出 (Reward)"] || ""),
  flags: normalizeEventFlagText(row["状态变更 (Flags)"] || ""),
  type: inferEventType(row["事件文本 (Log Text)"] || ""),
}));

function inferEventCommand(eventId) {
  if (eventId.startsWith("E_6001_")) {
    return "villageChat";
  }
  if (eventId.startsWith("E_6002_")) {
    return "backhillSearch";
  }
  if (eventId.startsWith("E_6003_")) {
    return "townPawn";
  }
  if (eventId.startsWith("E_6005_")) {
    return "awakenAtTainan";
  }
  return "";
}

function inferEventType(text) {
  if (text.includes("[🌟奇遇]") || text.includes("[主线]")) {
    return "positive";
  }
  if (text.includes("[传闻]")) {
    return "normal";
  }
  if (text.includes("[⚠️")) {
    return "warning";
  }
  return "normal";
}
