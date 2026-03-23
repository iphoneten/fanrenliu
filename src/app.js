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
  getAvailableActions,
  getAttack,
  getAdjacentNodes,
  getBreakthroughInfo,
  getCurrentNode,
  getDefense,
  getEquippedItem,
  getMaxHp,
  getMaxSpirit,
  getNextNode,
  getRealmName,
  getSlotLabel,
  MAP_NODES,
  moveToNode,
  moveForward,
  parseSave,
  serializeSave,
  townPawn,
  townSell,
  townSmith,
  villageChat,
  villageWildHunt,
  villageRest,
  moorTraverse,
  unequipItem,
  useItem,
  executeCombatAction,
  tainanMarket,
  leaveBlackMarket,
} from "./game-core.js";

const STORAGE_KEY = "fanren-save-v2";
const ACTION_TICK_MS = 1200;
const ACTION_LABELS = ACTION_LABEL_CONFIG;

const elements = {
  name: document.querySelector("#player-name"),
  realm: document.querySelector("#realm-badge"),
  hp: document.querySelector("#hp-text"),
  spirit: document.querySelector("#spirit-text"),
  spiritBarText: document.querySelector("#spirit-bar-text"),
  attack: document.querySelector("#attack-text"),
  defense: document.querySelector("#defense-text"),
  stones: document.querySelector("#stones-text"),
  reputation: document.querySelector("#reputation-text"),
  cultivation: document.querySelector("#cultivation-text"),
  cultivationBar: document.querySelector("#cultivation-bar"),
  hpBar: document.querySelector("#hp-bar"),
  spiritBar: document.querySelector("#spirit-bar"),
  ageText: document.querySelector("#age-text"),
  lifespanText: document.querySelector("#lifespan-text"),
  danPoisonText: document.querySelector("#dan-poison-text"),
  aptitudeText: document.querySelector("#aptitude-text"),
  rootsText: document.querySelector("#roots-text"),
  physiqueText: document.querySelector("#physique-text"),
  comprehensionText: document.querySelector("#comprehension-text"),
  mindsetText: document.querySelector("#mindset-text"),
  fortuneText: document.querySelector("#fortune-text"),
  handName: document.querySelector("#hand-name"),
  handStyle: document.querySelector("#hand-style"),
  handDescription: document.querySelector("#hand-description"),
  breakthroughHint: document.querySelector("#breakthrough-hint"),
  nodeName: document.querySelector("#node-name"),
  nodeTopName: document.querySelector("#node-top-name"),
  nodeZone: document.querySelector("#node-zone"),
  nodeDescription: document.querySelector("#node-description"),
  nextNodeText: document.querySelector("#next-node-text"),
  nodeToggleBtn: document.querySelector("#node-toggle-btn"),
  nodeToggleText: document.querySelector("#node-toggle-text"),
  mapList: document.querySelector("#map-list"),
  actionHint: document.querySelector("#action-hint"),
  currentActionText: document.querySelector("#current-action-text"),
  stopActionBtn: document.querySelector("#stop-action-btn"),
  mainCommandGrid: document.querySelector("#main-command-grid"),
  caveCommandGrid: document.querySelector("#cave-command-grid"),
  pageTabs: document.querySelectorAll("[data-page-tab]"),
  pageMain: document.querySelector("#page-main"),
  pageCave: document.querySelector("#page-cave"),
  pageCombat: document.querySelector("#page-combat"),
  equipmentSummary: document.querySelector("#equipment-summary-list"),
  inventoryTabs: document.querySelectorAll("[data-inventory-tab]"),
  inventoryItemsPanel: document.querySelector("#inventory-items-panel"),
  inventoryEquipmentPanel: document.querySelector("#inventory-equipment-panel"),
  inventory: document.querySelector("#inventory-list"),
  equipment: document.querySelector("#equipment-list"),
  equipmentBag: document.querySelector("#equipment-bag-list"),
  logs: document.querySelector("#log-list"),
  newGameBtn: document.querySelector("#new-game-btn"),
  saveBtn: document.querySelector("#save-btn"),
  importInput: document.querySelector("#import-input"),
  dialog: document.querySelector("#name-dialog"),
  nameInput: document.querySelector("#name-input"),
  confirmNameBtn: document.querySelector("#confirm-name-btn"),
};

let player = loadPlayer();
let activeInventoryTab = "items";
let activePageTab = "main";
let activeAction = null;
let actionTimer = null;
let isMapExpanded = false;

function formatMonths(value) {
  return Number(value || 0).toFixed(2);
}

function loadPlayer() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return createNewPlayer();
  }
  try {
    return parseSave(saved);
  } catch {
    return createNewPlayer();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, serializeSave(player));
}

function renderMap() {
  elements.mapList.innerHTML = "";
  const adjacent = getAdjacentNodes(player);
  adjacent.forEach((node, index) => {
    const li = document.createElement("li");
    const isUnlocked = player.unlockedNodes.includes(node.id);
    const isSelected = player.selectedDestinationId === node.id;
    const moveGuard = canMoveToNode(player, node.id);
    li.className = `map-node ${isUnlocked ? "is-unlocked" : ""} ${isSelected ? "is-current" : ""}`;
    li.innerHTML = `
      <span class="map-node-index">0${index + 1}</span>
      <div class="map-node-body">
        <strong>${node.name}</strong>
        <span>${node.zone}</span>
      </div>
      <button class="tiny-btn map-enter-btn" data-enter-destination="${node.id}" ${moveGuard.ok ? "" : "disabled"} title="${moveGuard.reason}">前往</button>
    `;
    li.dataset.destinationId = node.id;
    elements.mapList.appendChild(li);
  });
  elements.mapList.classList.toggle("is-open", isMapExpanded);
  elements.nodeToggleText.textContent = isMapExpanded ? "收起可前往" : "展开可前往";
}

function renderActions() {
  const node = getCurrentNode(player);
  const nextNode = getNextNode(player);
  const info = [];
  if (node.id === "village") {
    info.push("新手目标：先在村中立足，再去后山碰仙缘。");
  } else if (node.id === "backhill") {
    info.push("后山搜寻 5 次或击杀 3 只野狼，必触发血色仙缘。");
  } else if (node.id === "town") {
    info.push("炼气一层且持有下品灵石后，可在当铺获得太南谷指引。");
  } else if (node.id === "moor") {
    info.push("第三次谨慎穿行将遭遇血线蛇。");
  } else if (node.id === "tainan") {
    const bt = getBreakthroughInfo(player);
    info.push(bt.requirement);
  }
  if (nextNode) {
    info.push(`当前选中：${nextNode.name}，赶路耗时 ${formatMonths(nextNode.costMonths)} 个月。`);
  }
  if (activeAction) {
    info.unshift(`正在自动执行：${ACTION_LABELS[activeAction]}。`);
  }
  elements.actionHint.textContent = info.join(" ");
}

function renderCommandButtons(container, actions, runningAction, extraTitle = "") {
  container.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.className = `action-btn ${action === runningAction ? "is-running" : ""}`;
    button.dataset.action = action;
    button.textContent = ACTION_LABELS[action] || action;
    if (extraTitle && action === "breakthrough") {
      button.title = extraTitle;
    }
    container.appendChild(button);
  });
}

function render() {
  const node = getCurrentNode(player);
  const nextNode = getNextNode(player);
  const breakthroughInfo = getBreakthroughInfo(player);
  const hpRatio = player.hp / Math.max(1, getMaxHp(player));
  const spiritRatio = player.spirit / Math.max(1, getMaxSpirit(player));
  const lifespanRatio = player.age / Math.max(1, player.lifespan);

  elements.name.textContent = player.name;
  elements.realm.textContent = getRealmName(player);
  elements.hp.textContent = `${player.hp} / ${getMaxHp(player)}`;
  elements.spirit.textContent = `${player.spirit} / ${getMaxSpirit(player)}`;
  elements.spiritBarText.textContent = `${player.spirit} / ${getMaxSpirit(player)}`;
  elements.attack.textContent = `${getAttack(player)}`;
  elements.defense.textContent = `${getDefense(player)}`;
  elements.stones.textContent = `${player.stones}`;
  elements.reputation.textContent = `${player.reputation}`;
  elements.cultivation.textContent = `${player.cultivation} / ${player.cultivationNeeded}`;
  elements.cultivationBar.style.width = `${Math.min(100, (player.cultivation / Math.max(1, player.cultivationNeeded)) * 100)}%`;
  elements.hpBar.style.width = `${Math.min(100, hpRatio * 100)}%`;
  elements.spiritBar.style.width = `${Math.min(100, spiritRatio * 100)}%`;

  elements.ageText.textContent = `${player.age.toFixed(1)} 岁`;
  elements.lifespanText.textContent = `${player.lifespan} 岁`;
  elements.danPoisonText.textContent = `${player.danPoison}`;
  elements.aptitudeText.textContent = player.aptitude;
  elements.rootsText.textContent = player.roots.map((root) => `${root.name}${root.purity}`).join(" / ");
  elements.physiqueText.textContent = `${player.physique}`;
  elements.comprehensionText.textContent = `${player.comprehension}`;
  elements.mindsetText.textContent = `${player.mindset}`;
  elements.fortuneText.textContent = `${player.fortune}`;

  elements.handName.textContent = player.hand.name;
  elements.handStyle.textContent = player.hand.style;
  elements.handDescription.textContent = player.hand.description;
  elements.breakthroughHint.textContent = breakthroughInfo.requirement;

  elements.nodeName.textContent = node.name;
  elements.nodeTopName.textContent = node.name;
  elements.nodeZone.textContent = node.zone;
  elements.nodeDescription.textContent = node.description;
  elements.nextNodeText.textContent = nextNode ? `${nextNode.name} · ${formatMonths(nextNode.costMonths)} 个月` : "暂无可前往节点";

  renderMap();
  renderActions();
  elements.currentActionText.textContent = activeAction ? `执行中：${ACTION_LABELS[activeAction]}` : "当前无持续行动";
  elements.stopActionBtn.disabled = !activeAction;
  const availableMainActions = getAvailableActions(player, "main");
  const availableCaveActions = getAvailableActions(player, "cave");
  renderCommandButtons(elements.mainCommandGrid, availableMainActions, activeAction);
  renderCommandButtons(elements.caveCommandGrid, availableCaveActions, activeAction, breakthroughInfo.requirement);
  elements.pageTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.pageTab === activePageTab);
  });
  elements.pageMain.classList.toggle("is-active", activePageTab === "main");
  elements.pageCave.classList.toggle("is-active", activePageTab === "cave");
  elements.pageCombat.classList.toggle("is-active", activePageTab === "combat");

  document.body.classList.toggle("danger-lifespan", lifespanRatio >= 0.8);
  document.body.classList.toggle("danger-spirit", spiritRatio <= 0.2);
  document.body.classList.toggle("danger-danpoison", player.danPoison >= 30);

  elements.equipmentSummary.innerHTML = "";
  ["weapon", "armor", "accessory"].forEach((slot) => {
    const item = getEquippedItem(player, slot);
    const li = document.createElement("li");
    li.className = "inventory-item compact-item";
    li.innerHTML = `<span>${getSlotLabel(slot)}</span><strong>${item ? item.name : "未装备"}</strong>`;
    elements.equipmentSummary.appendChild(li);
  });

  elements.inventoryTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.inventoryTab === activeInventoryTab);
  });
  elements.inventoryItemsPanel.classList.toggle("is-active", activeInventoryTab === "items");
  elements.inventoryEquipmentPanel.classList.toggle("is-active", activeInventoryTab === "equipment");

  elements.inventory.innerHTML = "";
  Object.entries(player.inventory).forEach(([item, count]) => {
    const li = document.createElement("li");
    li.className = "inventory-card";
    li.innerHTML = `
      <div class="inventory-card-head">
        <span class="inventory-card-type">丹药</span>
        <strong class="inventory-card-count">x${count}</strong>
      </div>
      <div class="inventory-card-body">
        <strong class="inventory-card-name">${item}</strong>
        <span class="inventory-card-meta">${item === "清灵散" ? "解毒" : "修炼辅助"}</span>
        <button class="tiny-btn" data-use-item="${item}" ${count <= 0 ? "disabled" : ""}>使用</button>
      </div>
    `;
    elements.inventory.appendChild(li);
  });

  elements.equipment.innerHTML = "";
  ["weapon", "armor", "accessory"].forEach((slot) => {
    const item = getEquippedItem(player, slot);
    const li = document.createElement("li");
    li.className = "inventory-item equipment-slot-item";
    li.innerHTML = `
      <div>
        <span>${getSlotLabel(slot)}</span>
        <strong>${item ? item.name : "未装备"}</strong>
      </div>
      <button class="tiny-btn" data-unequip-slot="${slot}">卸下</button>
    `;
    elements.equipment.appendChild(li);
  });

  elements.equipmentBag.innerHTML = "";
  if (player.equipmentBag.length === 0) {
    const li = document.createElement("li");
    li.className = "inventory-card inventory-card-empty";
    li.innerHTML = `
      <div class="inventory-card-body">
        <strong class="inventory-card-name">暂无装备</strong>
        <span class="inventory-card-meta">黑原与斗法中有概率获得</span>
      </div>
    `;
    elements.equipmentBag.appendChild(li);
  } else {
    player.equipmentBag.forEach((item) => {
      const li = document.createElement("li");
      li.className = "inventory-card equipment-card";
      li.innerHTML = `
        <div class="inventory-card-head">
          <span class="inventory-card-type">${getSlotLabel(item.slot)}</span>
          <button class="tiny-btn" data-equip-id="${item.id}">装备</button>
        </div>
        <div class="inventory-card-body">
          <strong class="inventory-card-name">${item.name}</strong>
          <span class="inventory-card-meta">攻 ${item.attack} · 防 ${item.defense}</span>
          <span class="inventory-card-meta">气血 ${item.hp} · 灵力 ${item.spirit}</span>
        </div>
      `;
      elements.equipmentBag.appendChild(li);
    });
  }

  elements.logs.innerHTML = "";
  player.logs.forEach((entry) => {
    const div = document.createElement("div");
    div.className = `log-item ${entry.type || "normal"}`;
    div.textContent = entry.text;
    elements.logs.appendChild(div);
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    const action = button.dataset.action;
    button.classList.toggle("is-running", action === activeAction);
  });

  // ===== 渲染斗法面板状态 =====
  const isCombatActive = player.combat && player.combat.isActive;

  if (isCombatActive) {
    activePageTab = "combat";
    elements.pageTabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.pageTab === "combat"));
    elements.pageMain.classList.remove("is-active");
    elements.pageCave.classList.remove("is-active");
    elements.pageCombat.classList.add("is-active");

    const enemy = player.combat.enemy;
    const combatSide = document.querySelector(".combat-side");
    combatSide.innerHTML = `
      <span>敌方</span>
      <strong>${enemy.name}</strong>
      <p>状态：❤️ ${enemy.currentHp > enemy.hp * 0.5 ? '尚有余力' : '气息萎靡'} (约 ${Math.ceil(enemy.currentHp / enemy.hp * 100)}%)</p>
      <p>特性：${enemy.trait || '无'}</p>
    `;

    const combatLog = document.querySelector(".combat-log");
    combatLog.innerHTML = player.combat.logs.slice(-5).map(l => `<div>${l}</div>`).join("");

    document.querySelectorAll("[data-combat-action]").forEach(btn => btn.disabled = false);
  } else {
    document.querySelectorAll("[data-combat-action]").forEach(btn => btn.disabled = true);
    document.querySelector(".combat-side").innerHTML = `<span>安全</span><strong>当前无战斗</strong><p>你暂时安全，可以安心修炼或探索。</p>`;
    document.querySelector(".combat-log").innerHTML = ``;
  }
}

function perform(action) {
  if (player.hp <= 0) {
    stopCurrentAction("角色已陨落，持续行动终止。");
    player = createNewPlayer(player.name);
  }

  if (action === "openInventory") {
    activePageTab = "cave";
    activeInventoryTab = "items";
    persist();
    render();
    return;
  } else if (action === "openSkills") {
    player.logs.unshift({ text: "功法与神通界面尚未独立实现，当前先保留为占位入口。", type: "normal" });
    player.logs = player.logs.slice(0, 80);
    persist();
    render();
    return;
  } else if (action === "openGoldFinger") {
    activePageTab = "cave";
    player.logs.unshift({ text: `你凝神查看${player.hand.name}，当前流派为${player.hand.style}。`, type: "positive" });
    player.logs = player.logs.slice(0, 80);
    persist();
    render();
    return;
  } else if (action === "stopAction") {
    stopCurrentAction("你主动中断了当前持续行动。");
    return;
  } else if (action === "villageRest") {
    player = villageRest(player);
  } else if (action === "villageChat") {
    player = villageChat(player);
  } else if (action === "villageWildHunt") {
    player = villageWildHunt(player);
  } else if (action === "backhillSearch") {
    player = backhillSearch(player);
  } else if (action === "townSell") {
    player = townSell(player);
  } else if (action === "townSmith") {
    player = townSmith(player);
  } else if (action === "townPawn") {
    player = townPawn(player);
  } else if (action === "moorTraverse") {
    player = moorTraverse(player);
  } else if (action === "tainanMarket") {
    player = tainanMarket(player);
  } else if (action === "leaveBlackMarket") {
    player = leaveBlackMarket(player);
  } else if (action === "move") {
    player = moveForward(player);
    player = awakenAtTainan(player);
  } else if (action === "cultivate") {
    player = cultivate(player);
  } else if (action === "alchemy") {
    player = alchemy(player);
  } else if (action === "breakthrough") {
    player = breakthrough(player);
  } else if (action === "exportSave") {
    exportSave();
    return;
  }

  persist();
  render();
}

function executeActionTick(action) {
  perform(action);
  if (player.pendingInterruptMessage) {
    const message = player.pendingInterruptMessage;
    player.pendingInterruptMessage = "";
    stopCurrentAction(message);
    return;
  }
  if (player.hp <= 0) {
    stopCurrentAction("你已无力继续，持续行动终止。");
  }
}

function startContinuousAction(action) {
  if ((ACTION_MODE_CONFIG[action] || "single") === "single" || action === "exportSave") {
    perform(action);
    return;
  }
  if (activeAction === action) {
    return;
  }
  stopCurrentAction();
  activeAction = action;
  player.logs.unshift({ text: `你开始持续执行【${ACTION_LABELS[action]}】。`, type: "normal" });
  player.logs = player.logs.slice(0, 80);
  executeActionTick(action);
  if (!activeAction) {
    return;
  }
  actionTimer = window.setInterval(() => executeActionTick(action), ACTION_TICK_MS);
  render();
}

function stopCurrentAction(message) {
  if (actionTimer) {
    window.clearInterval(actionTimer);
    actionTimer = null;
  }
  if (activeAction && message) {
    player.logs.unshift({ text: message, type: "normal" });
    player.logs = player.logs.slice(0, 80);
  }
  activeAction = null;
  persist();
  render();
}

function exportSave() {
  const blob = new Blob([serializeSave(player)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${player.name || "fanren"}-save.json`;
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const combatAction = target.dataset.combatAction;
  if (combatAction) {
    player = executeCombatAction(player, combatAction);
    persist();
    render();
    return;
  }

  const inventoryTab = target.dataset.inventoryTab;
  if (inventoryTab) {
    activeInventoryTab = inventoryTab;
    render();
    return;
  }

  const pageTab = target.dataset.pageTab;
  if (pageTab) {
    activePageTab = pageTab;
    render();
    return;
  }

  if (target.id === "node-toggle-btn" || target.closest("#node-toggle-btn")) {
    isMapExpanded = !isMapExpanded;
    render();
    return;
  }

  const enterDestination = target.dataset.enterDestination || target.closest("[data-enter-destination]")?.dataset.enterDestination;
  if (enterDestination) {
    player = moveToNode(player, enterDestination);
    player = awakenAtTainan(player);
    persist();
    render();
    return;
  }

  const destinationId = target.dataset.destinationId || target.closest("[data-destination-id]")?.dataset.destinationId;
  if (destinationId) {
    player.selectedDestinationId = destinationId;
    persist();
    render();
    return;
  }

  const useItemName = target.dataset.useItem;
  if (useItemName) {
    player = useItem(player, useItemName);
    persist();
    render();
    return;
  }

  const equipId = target.dataset.equipId;
  if (equipId) {
    player = equipItem(player, equipId);
    persist();
    render();
    return;
  }

  const unequipSlot = target.dataset.unequipSlot;
  if (unequipSlot) {
    player = unequipItem(player, unequipSlot);
    persist();
    render();
    return;
  }

  const action = target.dataset.action;
  if (action) {
    startContinuousAction(action);
  }
});

elements.newGameBtn.addEventListener("click", () => {
  elements.nameInput.value = player?.name || "";
  elements.dialog.showModal();
});

elements.confirmNameBtn.addEventListener("click", () => {
  const name = elements.nameInput.value.trim() || "韩立";
  stopCurrentAction();
  player = createNewPlayer(name);
  persist();
  elements.dialog.close();
  render();
});

elements.saveBtn.addEventListener("click", () => {
  persist();
  player.logs.unshift({ text: "已手动保存当前存档。", type: "normal" });
  render();
});

elements.stopActionBtn.addEventListener("click", () => {
  stopCurrentAction("你主动停止了当前持续行动。");
});

elements.importInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  const text = await file.text();
  stopCurrentAction();
  player = parseSave(text);
  persist();
  render();
  event.target.value = "";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { });
  });
}

render();
