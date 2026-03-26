import { reactive } from "vue";

const state = reactive({
  profile: null
});

export const fisherStore = {
  getProfile() {
    return state.profile;
  },

  setProfile(profile) {
    state.profile = profile;
  },

  clear() {
    state.profile = null;
  }
};
