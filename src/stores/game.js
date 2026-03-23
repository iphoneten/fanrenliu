import { defineStore } from "pinia";
import {
  ACTION_LABEL_CONFIG,
  ACTION_MODE_CONFIG,
  awakenAtTainan,
  alchemy,
  backhillSearch,
  breakthrough,
  canMoveToNode,
  createNewPlayer,
  cultivate,
  equipItem,
  executeCombatAction,
  getAdjacentNodes,
  getAvailableActions,
  getBreakthroughInfo,
  getCurrentNode,
  getEquipmentBonuses,
  getEquippedItem,
  getNextNode,
  getRealmName,
  getAttack,
  getDefense,
  getMaxHp,
  getMaxSpirit,
  moveToNode,
  parseSave,
  serializeSave,
  townPawn,
  townSell,
  townSmith,
  triggerCombat,
  unequipItem,
  useItem,
  villageChat,
  villageRest,
  villageWildHunt,
  moorTraverse,
} from "@/game-core";

const STORAGE_KEY = "fanren-vue-save-v1";
const ACTION_TICK_MS = 1200;

function loadInitialPlayer() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createNewPlayer("韩立");
  }
  try {
    return parseSave(raw);
  } catch {
    return createNewPlayer("韩立");
  }
}

export const useGameStore = defineStore("game", {
  state: () => ({
    player: loadInitialPlayer(),
    activeAction: null,
    activeInventoryTab: "consumables",
    isMapExpanded: false,
    actionTimer: null,
  }),
  getters: {
    currentNode(state) {
      return getCurrentNode(state.player);
    },
    adjacentNodes(state) {
      return getAdjacentNodes(state.player).map((node) => ({
        ...node,
        guard: canMoveToNode(state.player, node.id),
      }));
    },
    nextNode(state) {
      return getNextNode(state.player);
    },
    realmName(state) {
      return getRealmName(state.player);
    },
    availableMainActions(state) {
      return getAvailableActions(state.player, "main");
    },
    availableCaveActions(state) {
      return getAvailableActions(state.player, "cave");
    },
    breakthroughInfo(state) {
      return getBreakthroughInfo(state.player);
    },
    actionLabels() {
      return ACTION_LABEL_CONFIG;
    },
    hpText(state) {
      return `${state.player.hp} / ${getMaxHp(state.player)}`;
    },
    spiritText(state) {
      return `${state.player.spirit} / ${getMaxSpirit(state.player)}`;
    },
    cultivationText(state) {
      return `${state.player.cultivation} / ${state.player.cultivationNeeded}`;
    },
    attackValue(state) {
      return getAttack(state.player);
    },
    defenseValue(state) {
      return getDefense(state.player);
    },
    equipmentBonus(state) {
      return getEquipmentBonuses(state.player);
    },
    equippedItems(state) {
      return ["weapon", "armor", "accessory"].map((slot) => ({
        slot,
        item: getEquippedItem(state.player, slot),
      }));
    },
    consumables(state) {
      return Object.entries(state.player.inventory).map(([name, count]) => ({ name, count }));
    },
    equipmentBag(state) {
      return state.player.equipmentBag;
    },
  },
  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, serializeSave(this.player));
    },
    reset(name) {
      this.stopAction();
      this.player = createNewPlayer(name || "韩立");
      this.persist();
    },
    perform(action) {
      if (this.player.hp <= 0) {
        this.stopAction("角色已陨落，持续行动终止。");
        this.player = createNewPlayer(this.player.name);
      }

      if (action === "openInventory") return;
      if (action === "openSkills") {
        this.player.logs.unshift({ text: "功法与神通页面已迁移到 Vue，详细内容下一步继续接。", type: "normal" });
      } else if (action === "openGoldFinger") {
        this.player.logs.unshift({ text: `你凝神查看${this.player.hand.name}，当前流派为${this.player.hand.style}。`, type: "positive" });
      } else if (action === "stopAction") {
        this.stopAction("你主动中断了当前持续行动。");
        return;
      } else if (action === "villageRest") {
        this.player = villageRest(this.player);
      } else if (action === "villageChat") {
        this.player = villageChat(this.player);
      } else if (action === "villageWildHunt") {
        this.player = villageWildHunt(this.player);
      } else if (action === "backhillSearch") {
        this.player = backhillSearch(this.player);
      } else if (action === "townSell") {
        this.player = townSell(this.player);
      } else if (action === "townSmith") {
        this.player = townSmith(this.player);
      } else if (action === "townPawn") {
        this.player = townPawn(this.player);
      } else if (action === "moorTraverse") {
        this.player = moorTraverse(this.player);
      } else if (action === "cultivate") {
        this.player = cultivate(this.player);
      } else if (action === "alchemy") {
        this.player = alchemy(this.player);
      } else if (action === "breakthrough") {
        this.player = breakthrough(this.player);
      }

      if (this.player.pendingInterruptMessage) {
        const message = this.player.pendingInterruptMessage;
        this.player.pendingInterruptMessage = "";
        this.stopAction(message);
        return;
      }

      this.persist();
    },
    startAction(action) {
      if ((ACTION_MODE_CONFIG[action] || "single") === "single") {
        this.perform(action);
        return;
      }
      if (this.activeAction === action) return;
      this.stopAction();
      this.activeAction = action;
      this.player.logs.unshift({ text: `你开始持续执行【${ACTION_LABEL_CONFIG[action] || action}】。`, type: "normal" });
      this.perform(action);
      if (!this.activeAction) return;
      this.actionTimer = window.setInterval(() => {
        this.perform(action);
      }, ACTION_TICK_MS);
    },
    stopAction(message = "") {
      if (this.actionTimer) {
        window.clearInterval(this.actionTimer);
        this.actionTimer = null;
      }
      if (this.activeAction && message) {
        this.player.logs.unshift({ text: message, type: "normal" });
      }
      this.activeAction = null;
      this.persist();
    },
    toggleMap() {
      this.isMapExpanded = !this.isMapExpanded;
    },
    enterNode(nodeId) {
      this.player = moveToNode(this.player, nodeId);
      this.player = awakenAtTainan(this.player);
      this.persist();
    },
    useConsumable(name) {
      this.player = useItem(this.player, name);
      this.persist();
    },
    equip(itemId) {
      this.player = equipItem(this.player, itemId);
      this.persist();
    },
    unequip(slot) {
      this.player = unequipItem(this.player, slot);
      this.persist();
    },
    combat(action) {
      this.player = executeCombatAction(this.player, action);
      this.persist();
    },
    triggerPreviewCombat(monsterId) {
      this.player = triggerCombat(this.player, monsterId);
      this.persist();
    },
  },
});
