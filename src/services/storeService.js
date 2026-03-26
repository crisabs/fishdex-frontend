import { api } from "./api";

export const storeService = {
  getBaitStoreList() {
    return api.request("/api/store/get-bait-store-list/", {
      auth: true
    });
  },

  getRodStoreList() {
    return api.request("/api/store/get-rod-store-list/", {
      auth: true
    });
  },

  buyItem(payload) {
    return api.request("/api/store/buy-item/", {
      method: "PUT",
      auth: true,
      body: payload
    });
  }
};
