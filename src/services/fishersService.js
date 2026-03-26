import { api } from "./api";

export const fishersService = {
  getMe() {
    return api.request("/api/fishers/me/", {
      method: "GET",
      auth: true
    });
  },

  updateNickname(payload) {
    return api.request("/api/fishers/nickname/", {
      method: "PATCH",
      auth: true,
      body: payload
    });
  },

  changeZone(payload) {
    return api.request("/api/fishers/change-zone/", {
      method: "PATCH",
      auth: true,
      body: payload
    });
  }
};
