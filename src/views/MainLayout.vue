<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const active = computed(() => {
  if (route.path.includes("/cave")) return 1;
  if (route.path.includes("/combat")) return 2;
  return 0;
});

function onChange(value) {
  if (value === 0) router.push("/game/hero");
  if (value === 1) router.push("/game/cave");
  if (value === 2) router.push("/game/combat");
}
</script>

<template>
  <div class="mobile-shell">
    <div class="mobile-content">
      <router-view />
    </div>
    <van-tabbar :model-value="active" @change="onChange" fixed placeholder safe-area-inset-bottom>
      <van-tabbar-item>主角</van-tabbar-item>
      <van-tabbar-item>洞府</van-tabbar-item>
      <van-tabbar-item>斗法</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
