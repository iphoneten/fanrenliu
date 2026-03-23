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
  roleName: "",
});

function submit() {
  authStore.login(form);
  gameStore.reset(form.roleName || "韩立");
  router.push("/game/hero");
}
</script>

<template>
  <div>
    <h1 class="auth-title">注册</h1>
    <van-form @submit="submit">
      <van-field v-model="form.account" name="account" label="账号" placeholder="设置账号" />
      <van-field v-model="form.password" name="password" type="password" label="密码" placeholder="设置密码" />
      <van-field v-model="form.roleName" name="roleName" label="道号" placeholder="韩立" />
      <div class="auth-actions">
        <van-button block type="primary" native-type="submit">创建角色</van-button>
        <van-button block plain type="default" to="/login">返回登录</van-button>
      </div>
    </van-form>
  </div>
</template>
