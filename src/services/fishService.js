import { api } from "./api";

export const fishService = {
  getListFishes() {
    return api.request("/api/fish/get-list-fishes/", {
      method: "GET",
      auth: true
    });
  },

  getFishDetails(fishId) {
    return api.request("/api/fish/get-fish-details/", {
      method: "GET",
      auth: true,
      query: { fish_id: fishId }
    });
  }
};
