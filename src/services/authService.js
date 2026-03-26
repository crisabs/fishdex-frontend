import { api } from "./api";
import { authStore } from "../stores/auth";
import { fisherStore } from "../stores/fisher";

export const authService = {
  async login(payload) {
    const data = await api.request("/api/auth/login/", {
      method: "POST",
      body: payload
    });

    authStore.setUsername(payload.username || "");
    authStore.setTokens({
      access: data.access,
      refresh: data.refresh
    });

    return data;
  },

  async register(payload) {
    return api.request("/api/auth/register/", {
      method: "POST",
      body: payload
    });
  },

  async refresh() {
    const refresh = authStore.getRefreshToken();
    const data = await api.request("/api/auth/refresh/", {
      method: "POST",
      body: { refresh }
    });

    authStore.setTokens({
      access: data.access,
      refresh: data.refresh || refresh
    });

    return data;
  },

  async logout() {
    const refresh = authStore.getRefreshToken();

    try {
      await api.request("/api/auth/logout/", {
        method: "POST",
        auth: true,
        body: { refresh }
      });
    } finally {
      authStore.clear();
      fisherStore.clear();
    }
  }
};
