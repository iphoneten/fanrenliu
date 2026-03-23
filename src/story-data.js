import { EVENT_CONFIG, MONSTER_CONFIG } from "./game-data.js";

const NODE_NAME_TO_ID = {
  青石村野外: "village-wild",
  无名后山: "backhill",
  凡俗集镇: "town",
  迷雾黑原: "moor",
};

export const CHAPTER_MONSTERS = MONSTER_CONFIG.map((monster) => ({
  ...monster,
  nodeId: NODE_NAME_TO_ID[monster.nodeName] || "backhill",
}));

export const VILLAGE_GOSSIPS = EVENT_CONFIG.filter((event) => event.id.startsWith("E_6001_"))
  .map((event) => event.text)
  .filter(Boolean);
