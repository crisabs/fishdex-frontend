import { reactive } from "vue";

const ACCESS_TOKEN_KEY = "fishdex.accessToken";
const REFRESH_TOKEN_KEY = "fishdex.refreshToken";
const USERNAME_KEY = "fishdex.username";

const state = reactive({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || "",
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || "",
  username: localStorage.getItem(USERNAME_KEY) || ""
});

export const authStore = {
  getAccessToken() {
    return state.accessToken;
  },

  getRefreshToken() {
    return state.refreshToken;
  },

  getUsername() {
    return state.username;
  },

  setTokens({ access, refresh }) {
    if (access) {
      state.accessToken = access;
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
    }

    if (refresh) {
      state.refreshToken = refresh;
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
  },

  setUsername(username) {
    state.username = username || "";

    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
      return;
    }

    localStorage.removeItem(USERNAME_KEY);
  },

  clear() {
    state.accessToken = "";
    state.refreshToken = "";
    state.username = "";
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getAccessToken());
  }
};
