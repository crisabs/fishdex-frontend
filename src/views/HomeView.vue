<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import fishingIllustration from "../components/fishing_calm.svg";
import { authService } from "../services/authService";
import { fishersService } from "../services/fishersService";
import { authStore } from "../stores/auth";
import { fisherStore } from "../stores/fisher";

const router = useRouter();
const loadingProfile = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated());
const fisherProfile = computed(() => fisherStore.getProfile());
const fisherName = computed(
  () => fisherProfile.value?.result?.nickname || "Guest",
);

async function loadProfile() {
  if (!authStore.isAuthenticated()) {
    fisherStore.clear();
    return;
  }

  loadingProfile.value = true;

  try {
    const data = await fishersService.getMe();
    fisherStore.setProfile(data);
  } catch (error) {
    authStore.clear();
    fisherStore.clear();
  } finally {
    loadingProfile.value = false;
  }
}

async function handleLogout() {
  await authService.logout();
  fisherStore.clear();
  router.push("/");
}

function openAuth() {
  router.push("/login");
}

function openRegister() {
  router.push("/register");
}

function openProtected(path) {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }

  router.push(path);
}

function openFisherProfile() {
  openProtected("/fisher");
}

onMounted(loadProfile);
</script>

<template>
  <main class="home-shell">
    <div class="home-scene">
      <header class="game-header">
        <div
          class="player-chip player-chip-interactive"
          :class="{ ready: isAuthenticated }"
          role="button"
          tabindex="0"
          @click="openFisherProfile"
          @keydown.enter.prevent="openFisherProfile"
          @keydown.space.prevent="openFisherProfile"
        >
          <div class="player-chip-copy">
            <span class="player-label">Fisher</span>
            <strong>{{ loadingProfile ? "Loading..." : fisherName }}</strong>
          </div>
          <button
            v-if="isAuthenticated"
            class="icon-button"
            type="button"
            aria-label="Fisher profile"
            @click.stop="openFisherProfile"
          >
            <span class="gear-shape">+</span>
          </button>
        </div>

        <div class="auth-actions">
          <button
            v-if="!isAuthenticated"
            class="soft-button"
            type="button"
            @click="openAuth"
          >
            Login
          </button>
          <button
            v-if="!isAuthenticated"
            class="soft-button accent"
            type="button"
            @click="openRegister"
          >
            Register
          </button>
          <button
            v-if="isAuthenticated"
            class="soft-button danger"
            type="button"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </header>

      <section class="hero-stage">
        <div class="hero-copy-block">
          <p class="mini-badge">Fishdex</p>
          <h1>A fishing adventure</h1>
          <p>
            Calm colors, simple actions, and a friendly fisher waiting at the
            lake.
          </p>
        </div>

        <div class="hero-avatar-wrap">
          <div class="bubble bubble-left"></div>
          <div class="bubble bubble-right"></div>
          <img
            class="home-hero-illustration"
            :src="fishingIllustration"
            alt="Fishing illustration"
          />
        </div>

        <nav class="hero-actions">
          <button
            class="pastel-action pink"
            type="button"
            @click="openProtected('/fishing')"
          >
            Go Fishing
          </button>
          <button
            class="pastel-action blue"
            type="button"
            @click="openProtected('/inventory')"
          >
            Inventory
          </button>
          <button
            class="pastel-action mint"
            type="button"
            @click="openProtected('/store')"
          >
            Store
          </button>
        </nav>
      </section>
    </div>
  </main>
</template>

<style scoped>
.home-scene {
  padding: 28px 28px 26px;
}

.game-header {
  margin-bottom: 12px;
}

.hero-stage {
  gap: 36px;
  padding: 44px 18px 26px;
}

.hero-copy-block {
  max-width: 760px;
  text-align: center;
}

.hero-copy-block h1 {
  margin: 10px 0 0;
  font-size: clamp(2.8rem, 6vw, 4.8rem);
  line-height: 0.95;
}

.hero-copy-block p {
  margin: 16px auto 0;
  max-width: 620px;
  font-size: 1.18rem;
  line-height: 1.75;
}

.player-chip-interactive {
  min-width: 310px;
  padding: 18px 18px 18px 24px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
  box-shadow: 0 16px 30px rgba(182, 157, 212, 0.16);
}

.player-chip-interactive:hover,
.player-chip-interactive:focus-visible {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 22px 38px rgba(182, 157, 212, 0.24);
  outline: none;
}

.player-chip-copy strong {
  font-size: 1.2rem;
}

.player-label {
  font-size: 0.78rem;
}

.auth-actions {
  gap: 12px;
}

.auth-actions :deep(.soft-button) {
  min-height: 50px;
  padding-inline: 20px;
  font-size: 1rem;
}

.hero-actions {
  gap: 16px;
}

.hero-actions :deep(.pastel-action) {
  min-width: 180px;
  min-height: 62px;
  font-size: 1.02rem;
}

.hero-avatar-wrap {
  padding: 26px;
  border-radius: 38px;
  background: linear-gradient(
    180deg,
    rgba(255, 247, 255, 0.88),
    rgba(242, 239, 255, 0.78)
  );
  border: 1px solid rgba(215, 199, 240, 0.85);
  box-shadow: 0 26px 60px rgba(177, 156, 211, 0.2);
}

.home-hero-illustration {
  position: relative;
  z-index: 1;
  width: min(560px, 82vw);
  max-width: 100%;
  height: auto;
  display: block;
  padding: 12px;
  object-fit: contain;
}

@media (max-width: 720px) {
  .home-scene {
    padding: 22px 18px 20px;
  }

  .hero-stage {
    gap: 24px;
    padding: 28px 8px 16px;
  }

  .hero-copy-block h1 {
    font-size: clamp(2.4rem, 11vw, 3.5rem);
  }

  .hero-copy-block p {
    font-size: 1.03rem;
  }

  .player-chip-interactive {
    min-width: 100%;
  }

  .home-hero-illustration {
    width: min(360px, 84vw);
    padding: 4px;
  }
}
</style>
