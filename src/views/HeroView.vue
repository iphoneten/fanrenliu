<script setup>
import { computed } from "vue";
import { useGameStore } from "@/stores/game";

const gameStore = useGameStore();

const player = computed(() => gameStore.player);
const currentNode = computed(() => gameStore.currentNode);
const adjacentNodes = computed(() => gameStore.adjacentNodes);
const actionLabels = computed(() => gameStore.actionLabels);
</script>

<template>
  <div class="page-shell">
    <van-nav-bar title="主角" />
    <div class="page-body">
      <van-cell-group inset>
        <van-cell title="姓名" :value="player.name" />
        <van-cell title="境界" :value="gameStore.realmName" />
        <van-cell title="寿元" :value="`${player.age.toFixed(1)} / ${player.lifespan}`" />
        <van-cell title="地图" :value="currentNode.name" />
      </van-cell-group>

      <div class="mobile-section">
        <div class="section-title">状态</div>
        <van-cell-group inset>
          <van-cell title="气血" :value="gameStore.hpText" />
          <van-cell title="法力" :value="gameStore.spiritText" />
          <van-cell title="修为" :value="gameStore.cultivationText" />
          <van-cell title="攻 / 防" :value="`${gameStore.attackValue} / ${gameStore.defenseValue}`" />
        </van-cell-group>
      </div>

      <div class="mobile-section">
        <div class="section-title">可前往</div>
        <van-cell-group inset>
          <van-cell
            v-for="node in adjacentNodes"
            :key="node.id"
            :title="node.name"
            :label="node.guard.reason || node.zone"
          >
            <template #right-icon>
              <van-button
                size="small"
                type="primary"
                :disabled="!node.guard.ok"
                @click="gameStore.enterNode(node.id)"
              >
                前往
              </van-button>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <div class="mobile-section">
        <div class="section-title">行动</div>
        <div class="action-grid">
          <van-button
            v-for="action in gameStore.availableMainActions"
            :key="action"
            size="small"
            type="default"
            @click="gameStore.startAction(action)"
          >
            {{ actionLabels[action] || action }}
          </van-button>
        </div>
        <div class="action-grid action-grid-single">
          <van-button size="small" plain type="warning" @click="gameStore.stopAction('你主动停止了当前持续行动。')">
            中断/出关
          </van-button>
        </div>
      </div>

      <div class="mobile-section">
        <div class="section-title">日志</div>
        <div class="log-list">
          <div v-for="(log, index) in player.logs.slice(0, 8)" :key="index" class="log-item">
            {{ log.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
