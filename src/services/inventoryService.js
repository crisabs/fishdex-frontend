import { api } from "./api";

export const inventoryService = {
  getItems() {
    return api.request("/api/inventory/items/", {
      method: "GET",
      auth: true
    });
  },

  getFishes() {
    return api.request("/api/inventory/fishes/", {
      method: "GET",
      auth: true
    });
  },

  sellFish(payload) {
    return api.request("/api/inventory/fish-sell/", {
      method: "POST",
      auth: true,
      body: payload
    });
  },

  updateFishDescription(payload) {
    return api.request("/api/inventory/fisher-fish-description/", {
      method: "PATCH",
      auth: true,
      body: payload
    });
  }
};
