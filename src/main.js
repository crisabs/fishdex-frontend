import { createApp } from "vue";
import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import App from "./App.vue";
import { routes } from "./router";
import { authStore } from "./stores/auth";
import "./styles.css";

const isGithubPagesBuild = import.meta.env.BASE_URL !== "/";

const router = createRouter({
  history: isGithubPagesBuild
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
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
