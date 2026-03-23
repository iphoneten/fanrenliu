<script setup>
import { computed } from "vue";
import { useGameStore } from "@/stores/game";

const gameStore = useGameStore();
const player = computed(() => gameStore.player);
const labels = computed(() => gameStore.actionLabels);
</script>

<template>
  <div class="page-shell">
    <van-nav-bar title="洞府" />
    <div class="page-body">
      <van-cell-group inset>
        <van-cell title="金手指" :value="player.hand.name" />
        <van-cell title="流派" :value="player.hand.style" />
        <van-cell title="说明" :label="player.hand.description" />
      </van-cell-group>

      <div class="mobile-section">
        <div class="section-title">修炼</div>
        <div class="action-grid">
          <van-button
            v-for="action in gameStore.availableCaveActions"
            :key="action"
            size="small"
            type="default"
            @click="gameStore.startAction(action)"
          >
            {{ labels[action] || action }}
          </van-button>
        </div>
      </div>

      <div class="mobile-section">
        <div class="section-title">当前穿戴</div>
        <van-cell-group inset>
          <van-cell
            v-for="entry in gameStore.equippedItems"
            :key="entry.slot"
            :title="entry.slot"
            :value="entry.item?.name || '未装备'"
          >
            <template #right-icon>
              <van-button size="mini" plain type="default" @click="gameStore.unequip(entry.slot)">
                卸下
              </van-button>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="mobile-section">
        <div class="section-title">丹药与道具</div>
        <van-cell-group inset>
          <van-cell
            v-for="item in gameStore.consumables"
            :key="item.name"
            :title="item.name"
            :value="`x${item.count}`"
          >
            <template #right-icon>
              <van-button size="mini" type="primary" :disabled="item.count <= 0" @click="gameStore.useConsumable(item.name)">
                使用
              </van-button>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="mobile-section">
        <div class="section-title">装备背包</div>
        <van-cell-group inset>
          <van-cell
            v-for="item in gameStore.equipmentBag"
            :key="item.id"
            :title="item.name"
            :label="`攻 ${item.attack} / 防 ${item.defense}`"
          >
            <template #right-icon>
              <van-button size="mini" type="primary" @click="gameStore.equip(item.id)">装备</van-button>
            </template>
          </van-cell>
          <van-cell v-if="gameStore.equipmentBag.length === 0" title="暂无装备" />
        </van-cell-group>
      </div>
    </div>
  </div>
</template>
