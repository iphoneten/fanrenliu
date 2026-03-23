import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
  }),
  actions: {
    login(payload) {
      this.user = { account: payload.account || "guest", roleName: payload.roleName || "韩立" };
    },
    logout() {
      this.user = null;
    },
  },
});
