<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import PanelCard from "../components/PanelCard.vue";
import { authService } from "../services/authService";
import { fishersService } from "../services/fishersService";
import { inventoryService } from "../services/inventoryService";
import { authStore } from "../stores/auth";
import { fisherStore } from "../stores/fisher";

const router = useRouter();

const globalError = ref("");
const busy = ref("");
const actionMessage = ref("");
const fisherProfileResponse = ref(null);
const inventoryFishesResponse = ref(null);
const nicknameModalOpen = ref(false);
const nicknameCelebration = ref(false);

const forms = reactive({
  nickname: {
    nickname: "",
  },
});

let celebrationTimer = null;

const fisherProfile = computed(() => fisherProfileResponse.value?.result ?? null);
const inventoryFishes = computed(() => {
  const result = inventoryFishesResponse.value?.result;
  return Array.isArray(result) ? result : [];
});
const inventoryFishCount = computed(() => inventoryFishes.value.length);
const accountUser = computed(
  () => authStore.getUsername() || fisherProfile.value?.nickname || "Unknown",
);
const fisherInfo = computed(() => {
  if (!fisherProfile.value) {
    return [];
  }

  return [
    { key: "user", label: "User", value: accountUser.value },
    { key: "name", label: "Name", value: fisherProfile.value.nickname || "Unnamed" },
    { key: "level", label: "Lvl", value: String(fisherProfile.value.level ?? "-") },
    { key: "coins", label: "Coins", value: String(fisherProfile.value.coins ?? "-") },
    { key: "fish", label: "Fish", value: String(inventoryFishCount.value) },
    { key: "zone", label: "Zone", value: fisherProfile.value.current_zone || "-" },
  ];
});

async function runRequest(key, handler) {
  globalError.value = "";
  actionMessage.value = "";
  busy.value = key;

  try {
    return await handler();
  } catch (error) {
    globalError.value = error.message;
    return null;
  } finally {
    busy.value = "";
  }
}

async function loadFisherProfile() {
  const response = await runRequest("fisherProfile", () => fishersService.getMe());

  if (response) {
    fisherProfileResponse.value = response;
    fisherStore.setProfile(response);
    forms.nickname.nickname = response.result?.nickname || "";
  }
}

async function loadInventoryFishes() {
  const response = await runRequest("inventoryFishes", () =>
    inventoryService.getFishes(),
  );

  if (response) {
    inventoryFishesResponse.value = response;
  }
}

async function loadFisherView() {
  await Promise.all([loadFisherProfile(), loadInventoryFishes()]);
}

function openNicknameModal() {
  forms.nickname.nickname = fisherProfile.value?.nickname || "";
  nicknameModalOpen.value = true;
}

function closeNicknameModal() {
  nicknameModalOpen.value = false;
}

function triggerNicknameCelebration() {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
  }

  nicknameCelebration.value = false;

  window.requestAnimationFrame(() => {
    nicknameCelebration.value = true;
    celebrationTimer = window.setTimeout(() => {
      nicknameCelebration.value = false;
      celebrationTimer = null;
    }, 1500);
  });
}

async function submitNicknameChange() {
  const nickname = forms.nickname.nickname.trim();

  if (!nickname) {
    globalError.value = "Enter a nickname.";
    return;
  }

  const response = await runRequest("nickname", () =>
    fishersService.updateNickname({ nickname }),
  );

  if (!response) {
    return;
  }

  actionMessage.value = response.message || "Nickname updated.";
  closeNicknameModal();
  triggerNicknameCelebration();
  await loadFisherProfile();
}

async function handleLogout() {
  await authService.logout();
  router.push("/");
}

onMounted(loadFisherView);

onBeforeUnmount(() => {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
  }
});
</script>

<template>
  <main class="home-shell">
    <div class="home-scene subpage-scene fisher-scene">
      <header class="subpage-header fisher-header">
        <button class="soft-button" type="button" @click="$router.push('/')">
          Back Home
        </button>
        <button class="soft-button danger" type="button" @click="handleLogout">
          Logout
        </button>
      </header>

      <transition name="inventory-modal">
        <div
          v-if="nicknameModalOpen"
          class="inventory-modal-backdrop"
          @click.self="closeNicknameModal"
        >
          <div class="inventory-modal-card">
            <div class="inventory-modal-header">
              <div>
                <p class="inventory-modal-kicker">Nickname</p>
                <h3>Edit nickname</h3>
              </div>
            </div>

            <form class="form-grid" @submit.prevent="submitNicknameChange">
              <label>
                <span>Nickname</span>
                <input
                  v-model="forms.nickname.nickname"
                  maxlength="50"
                  placeholder="PedritoPiernasLargas"
                  required
                />
              </label>
              <div class="inventory-modal-actions">
                <button
                  class="soft-button compact-button"
                  type="button"
                  @click="closeNicknameModal"
                >
                  Cancel
                </button>
                <button class="primary-button" :disabled="busy === 'nickname'">
                  {{ busy === "nickname" ? "Saving..." : "Save" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <section class="subpage-hero fisher-hero">
        <div class="hero-copy-block auth-copy-block">
          <p class="mini-badge">Fisher</p>
          <h1>Fisher Profile</h1>
          <p>Track stats, zone and nickname.</p>
        </div>
        <div v-if="globalError" class="alert error">{{ globalError }}</div>
        <div v-if="actionMessage" class="alert success">{{ actionMessage }}</div>
      </section>

      <section class="fisher-layout">
        <PanelCard title="Profile">
          <div v-if="fisherInfo.length" class="friendly-data-grid fisher-info-grid">
            <div
              v-for="item in fisherInfo"
              :key="item.key"
              :class="['friendly-data-item', 'fisher-info-item', `fisher-info-${item.key}`]"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <p v-else class="soft-note">Loading profile...</p>
        </PanelCard>

        <PanelCard title="Nickname">
          <div
            :class="['nickname-card', { celebrating: nicknameCelebration }]"
          >
            <div v-if="nicknameCelebration" class="nickname-burst" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div class="nickname-copy">
              <span>Nickname</span>
              <strong>{{ fisherProfile?.nickname || "Unnamed" }}</strong>
            </div>
            <button
              class="pastel-action blue compact-action-button"
              type="button"
              @click="openNicknameModal"
            >
              Change
            </button>
          </div>
        </PanelCard>
      </section>
    </div>
  </main>
</template>

<style scoped>
.fisher-scene {
  min-height: calc(100vh - 40px);
}

.fisher-header {
  justify-content: space-between;
  gap: 12px;
}

.inventory-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(74, 59, 96, 0.28);
  backdrop-filter: blur(10px);
}

.inventory-modal-card {
  width: min(100%, 560px);
  padding: 24px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 253, 255, 0.98), rgba(244, 249, 255, 0.96));
  box-shadow: 0 26px 60px rgba(95, 79, 122, 0.22);
  border: 1px solid rgba(222, 210, 236, 0.9);
}

.inventory-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.inventory-modal-kicker {
  margin: 0 0 6px;
  color: #d07fa3;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.inventory-modal-header h3 {
  margin: 0;
  color: #5f5572;
  font-size: 1.45rem;
  font-family: "Fredoka", "Nunito", sans-serif;
}

.inventory-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.inventory-modal-enter-active,
.inventory-modal-leave-active {
  transition: opacity 0.22s ease;
}

.inventory-modal-enter-active .inventory-modal-card,
.inventory-modal-leave-active .inventory-modal-card {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.inventory-modal-enter-from,
.inventory-modal-leave-to {
  opacity: 0;
}

.inventory-modal-enter-from .inventory-modal-card,
.inventory-modal-leave-to .inventory-modal-card {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.fisher-hero {
  margin-bottom: 18px;
}

.fisher-layout {
  display: grid;
  gap: 22px;
}

.fisher-layout :deep(.panel-card) {
  padding: 24px 26px;
}

.fisher-info-grid {
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 14px;
}

.fisher-info-item {
  min-width: 0;
  height: 100%;
}

.fisher-info-item strong {
  font-size: 1.08rem;
  overflow-wrap: anywhere;
}

.fisher-info-user,
.fisher-info-name {
  grid-column: span 4;
}

.fisher-info-coins,
.fisher-info-fish,
.fisher-info-level,
.fisher-info-zone {
  grid-column: span 2;
}

.fisher-info-level {
  place-items: center;
  text-align: center;
  padding-inline: 12px;
}

.fisher-info-level strong {
  font-size: 1.45rem;
}

.fisher-info-zone {
  justify-content: center;
}

.fisher-info-coins strong,
.fisher-info-fish strong {
  font-size: 1.2rem;
}

.nickname-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(135deg, #fff0f7, #e7f4ff);
  border: 1px solid rgba(219, 208, 235, 0.9);
  box-shadow: 0 14px 30px rgba(215, 197, 226, 0.16);
}

.nickname-copy {
  display: grid;
  gap: 6px;
}

.nickname-copy span {
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #af86a1;
}

.nickname-copy strong {
  color: #5f5572;
  font-size: clamp(1.25rem, 3vw, 1.7rem);
  font-family: "Fredoka", "Nunito", sans-serif;
}

.nickname-burst {
  position: absolute;
  inset: -20% -5%;
  pointer-events: none;
}

.nickname-burst span {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(255, 239, 154, 0.55) 0%,
    rgba(255, 212, 82, 0.28) 38%,
    rgba(255, 212, 82, 0) 72%
  );
  animation: nicknameBurst 1.2s ease-out forwards;
}

.nickname-burst span:nth-child(1) {
  top: -18px;
  left: -10px;
}

.nickname-burst span:nth-child(2) {
  top: 8px;
  right: 10%;
  animation-delay: 0.08s;
}

.nickname-burst span:nth-child(3) {
  bottom: -24px;
  left: 32%;
  animation-delay: 0.16s;
}

.nickname-card.celebrating {
  animation: nicknamePulse 0.95s ease;
}

.compact-button {
  min-height: auto;
  padding: 10px 14px;
  border-radius: 16px;
}

.compact-action-button {
  min-width: 170px;
  min-height: auto;
  padding: 10px 14px;
  border-radius: 16px;
  box-shadow: 0 10px 22px rgba(226, 207, 232, 0.22);
}

@keyframes nicknamePulse {
  0% {
    transform: scale(1);
    box-shadow: 0 14px 30px rgba(215, 197, 226, 0.16);
  }

  35% {
    transform: scale(1.02);
    box-shadow: 0 18px 36px rgba(215, 197, 226, 0.24);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 14px 30px rgba(215, 197, 226, 0.16);
  }
}

@keyframes nicknameBurst {
  0% {
    opacity: 0;
    transform: scale(0.35);
  }

  18% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}

@media (max-width: 720px) {
  .fisher-header,
  .nickname-card,
  .inventory-modal-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .compact-action-button {
    width: 100%;
    min-width: 0;
  }

  .fisher-info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .fisher-info-user,
  .fisher-info-name,
  .fisher-info-coins,
  .fisher-info-fish,
  .fisher-info-zone,
  .fisher-info-level {
    grid-column: auto;
  }
}

@media (max-width: 520px) {
  .fisher-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
