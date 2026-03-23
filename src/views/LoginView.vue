<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useGameStore } from "@/stores/game";

const router = useRouter();
const authStore = useAuthStore();
const gameStore = useGameStore();

const form = reactive({
  account: "",
  password: "",
});

function submit() {
  authStore.login(form);
  if (!gameStore.player?.name) {
    gameStore.reset("韩立");
  }
  router.push("/game/hero");
}
</script>

<template>
  <div>
    <h1 class="auth-title">登录</h1>
    <van-form @submit="submit">
      <van-field v-model="form.account" name="account" label="账号" placeholder="输入账号" />
      <van-field v-model="form.password" name="password" type="password" label="密码" placeholder="输入密码" />
      <div class="auth-actions">
        <van-button block type="primary" native-type="submit">进入修仙界</van-button>
        <van-button block plain type="default" to="/register">前往注册</van-button>
      </div>
    </van-form>
  </div>
</template>
