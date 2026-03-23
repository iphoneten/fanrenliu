import { createRouter, createWebHistory } from "vue-router";
import AuthLayout from "@/views/AuthLayout.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import MainLayout from "@/views/MainLayout.vue";
import HeroView from "@/views/HeroView.vue";
import CaveView from "@/views/CaveView.vue";
import CombatView from "@/views/CombatView.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    component: AuthLayout,
    children: [
      { path: "", name: "login", component: LoginView },
      { path: "/register", name: "register", component: RegisterView },
    ],
  },
  {
    path: "/game",
    component: MainLayout,
    children: [
      { path: "hero", name: "hero", component: HeroView },
      { path: "cave", name: "cave", component: CaveView },
      { path: "combat", name: "combat", component: CombatView },
      { path: "", redirect: "/game/hero" },
    ],
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
