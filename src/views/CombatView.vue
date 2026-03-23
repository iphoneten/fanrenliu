<script setup>
import { computed } from "vue";
import { useGameStore } from "@/stores/game";

const gameStore = useGameStore();
const combat = computed(() => gameStore.player.combat);
</script>

<template>
  <div class="page-shell">
    <van-nav-bar title="斗法" />
    <div class="page-body">
      <van-cell-group inset>
        <van-cell title="状态" :value="combat.isActive ? '战斗中' : '未进入战斗'" />
        <van-cell v-if="combat.enemy" title="敌方" :value="combat.enemy.name" :label="combat.enemy.trait" />
      </van-cell-group>

      <div class="mobile-section">
        <div class="section-title">战斗日志</div>
        <div class="log-list">
          <div v-for="(log, index) in (combat.logs || []).slice(-8)" :key="index" class="log-item">
            {{ log }}
          </div>
        </div>
      </div>

      <div class="mobile-section">
        <div class="section-title">斗法指令</div>
        <div class="action-grid">
          <van-button size="small" type="default" :disabled="!combat.isActive" @click="gameStore.combat('artifact')">
            驱使法器
          </van-button>
          <van-button size="small" type="default" :disabled="!combat.isActive" @click="gameStore.combat('spell')">
            施展火弹术
          </van-button>
          <van-button size="small" type="default" :disabled="!combat.isActive" @click="gameStore.combat('talisman')">
            砸出火龙符
          </van-button>
          <van-button size="small" type="warning" :disabled="!combat.isActive" @click="gameStore.combat('beg')">
            求饶
          </van-button>
          <van-button size="small" type="danger" :disabled="!combat.isActive" @click="gameStore.combat('blood_escape')">
            血遁
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>
