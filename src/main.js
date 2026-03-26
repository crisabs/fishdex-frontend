import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import { routes } from "./router";
import { authStore } from "./stores/auth";
import "./styles.css";

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const protectedPaths = ["/fishing", "/inventory", "/store"];

  if (protectedPaths.includes(to.path) && !authStore.isAuthenticated()) {
    return "/login";
  }

  return true;
});

createApp(App).use(router).mount("#app");
