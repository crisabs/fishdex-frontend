<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import PanelCard from "../components/PanelCard.vue";
import fishingCalmIllustration from "../components/fishing_calm.svg";
import fishingCaptureIllustration from "../components/fishing_capture.svg";
import { api } from "../services/api";
import { fishersService } from "../services/fishersService";
import { inventoryService } from "../services/inventoryService";

const CAPTURE_FISH_ENDPOINT = "/api/capture/capture/";
const SPAWNED_FISH_ENDPOINT = "/api/capture/spawned-fish/";

const globalError = ref("");
const busy = ref("");
const actionMessage = ref("");
const actionMessageVisible = ref(false);
const fisherProfile = ref(null);
const fishDetails = ref(null);
const inventoryItems = ref([]);
const selectedRodCode = ref("");
const selectedBaitCode = ref("");
const fishingState = ref("calm");
const capturePopup = ref({
  visible: false,
  message: "",
  type: "success",
});
const celebrationBurstVisible = ref(false);
const failureBurstVisible = ref(false);
const celebrationBurstItems = [
  "star",
  "heart",
  "bubble",
  "spark",
  "heart",
  "star",
];
const failureBurstItems = [
  "tear",
  "cloud",
  "heart",
  "tear",
  "cloud",
];
let capturePopupTimeoutId = null;
let celebrationBurstTimeoutId = null;
let failureBurstTimeoutId = null;
let hookRevealTimeoutId = null;
let actionMessageTimeoutId = null;

const forms = reactive({
  fishDetails: { fish_id: 1 },
  zone: { new_zone: "RIVER" },
});

const zoneOptions = [
  {
    value: "RIVER",
    label: "River",
    description: "Soft current and beginner vibes.",
  },
  {
    value: "LAKE",
    label: "Lake",
    description: "Quiet water and balanced catches.",
  },
  { value: "OCEAN", label: "Ocean", description: "Big waves and rarer fish." },
];

const profileCardItems = computed(() => {
  const result = fisherProfile.value?.result;

  if (!result) {
    return [];
  }

  return [
    { label: "Nickname", value: result.nickname },
    { label: "Level", value: String(result.level) },
    { label: "Coins", value: String(result.coins) },
    { label: "Current Zone", value: result.current_zone },
  ];
});

const activeFish = computed(() => fishDetails.value?.result || null);
const rodItems = computed(() =>
  inventoryItems.value.filter(
    (item) => item.item_code.includes("ROD") && Number(item.quantity) > 0,
  ),
);
const baitItems = computed(() =>
  inventoryItems.value.filter(
    (item) => item.item_code.includes("BAIT") && Number(item.quantity) > 0,
  ),
);
const hasRods = computed(() => rodItems.value.length > 0);
const canCast = computed(
  () => hasRods.value && Boolean(selectedRodCode.value) && fishingState.value !== "casting",
);
const canCapture = computed(() => fishingState.value === "hooked" && Boolean(activeFish.value));
const sceneMessage = computed(() => {
  if (fishingState.value === "casting") {
    return "Casting line...";
  }

  if (fishingState.value === "hooked") {
    return "Something bit...";
  }

  return "Press Cast Rod to start fishing.";
});
const sceneIllustration = computed(() =>
  fishingState.value === "hooked"
    ? fishingCaptureIllustration
    : fishingCalmIllustration,
);
const actionMessageClass = computed(() => ({
  spotlight: Boolean(actionMessage.value),
  hooked: actionMessage.value === "Something bit..." && fishingState.value === "hooked",
  success: /captured|bit|let the fish go|zone changed/i.test(actionMessage.value),
  failure: /need at least one rod|select one rod|slipped away|nothing bit|cast your rod first/i.test(
    actionMessage.value,
  ),
}));

function showActionMessage(message, options = {}) {
  const { autoHideMs = 0 } = options;

  actionMessage.value = message;
  actionMessageVisible.value = true;

  if (actionMessageTimeoutId) {
    clearTimeout(actionMessageTimeoutId);
    actionMessageTimeoutId = null;
  }

  if (autoHideMs > 0) {
    actionMessageTimeoutId = window.setTimeout(() => {
      actionMessageVisible.value = false;
      actionMessageTimeoutId = null;
    }, autoHideMs);
  }
}

async function runRequest(key, handler) {
  globalError.value = "";
  actionMessage.value = "";
  actionMessageVisible.value = false;
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

async function loadFishingView() {
  await loadFisherProfile();
  await loadInventoryItems();
}

async function loadFisherProfile() {
  const me = await runRequest("me", () => fishersService.getMe());

  if (me) {
    fisherProfile.value = me;

    if (!forms.zone.new_zone) {
      forms.zone.new_zone = me.result.current_zone.toUpperCase();
    }
  }
}

async function loadInventoryItems() {
  const items = await runRequest("items", () => inventoryService.getItems());

  if (items?.result) {
    inventoryItems.value = items.result;

    if (!rodItems.value.some((item) => item.item_code === selectedRodCode.value)) {
      selectedRodCode.value = "";
    }

    if (!baitItems.value.some((item) => item.item_code === selectedBaitCode.value)) {
      selectedBaitCode.value = "";
    }
  }
}

async function changeZone() {
  const response = await runRequest("zone", () =>
    fishersService.changeZone(forms.zone),
  );

  if (response) {
    showActionMessage(`Zone changed to ${response.new_zone}.`);
    await loadFishingView();
  }
}

function showCapturePopup(message, type) {
  capturePopup.value = {
    visible: true,
    message,
    type,
  };

  if (capturePopupTimeoutId) {
    clearTimeout(capturePopupTimeoutId);
  }

  capturePopupTimeoutId = window.setTimeout(() => {
    capturePopup.value.visible = false;
    capturePopupTimeoutId = null;
  }, 3200);
}

function resetFishingScene() {
  fishDetails.value = null;
  fishingState.value = "calm";
}

function triggerCelebrationBurst() {
  celebrationBurstVisible.value = false;

  if (celebrationBurstTimeoutId) {
    clearTimeout(celebrationBurstTimeoutId);
  }

  window.requestAnimationFrame(() => {
    celebrationBurstVisible.value = true;
  });

  celebrationBurstTimeoutId = window.setTimeout(() => {
    celebrationBurstVisible.value = false;
    celebrationBurstTimeoutId = null;
  }, 2800);
}

function triggerFailureBurst() {
  failureBurstVisible.value = false;

  if (failureBurstTimeoutId) {
    clearTimeout(failureBurstTimeoutId);
  }

  window.requestAnimationFrame(() => {
    failureBurstVisible.value = true;
  });

  failureBurstTimeoutId = window.setTimeout(() => {
    failureBurstVisible.value = false;
    failureBurstTimeoutId = null;
  }, 2400);
}

function selectRod(itemCode) {
  selectedRodCode.value = selectedRodCode.value === itemCode ? "" : itemCode;
}

function selectBait(itemCode) {
  selectedBaitCode.value = selectedBaitCode.value === itemCode ? "" : itemCode;
}

async function startFishing() {
  if (fishingState.value === "casting") {
    return;
  }

  if (!hasRods.value) {
    showActionMessage("You need at least one rod to fish.");
    return;
  }

  if (!selectedRodCode.value) {
    showActionMessage("Select one rod before casting.");
    return;
  }

  resetFishingScene();
  fishingState.value = "casting";

  const spawnedFish = await runRequest("spawnedFish", () =>
    api.request(SPAWNED_FISH_ENDPOINT, {
      method: "GET",
      auth: true,
    }),
  );

  if (!spawnedFish?.result?.fish_id) {
    resetFishingScene();
    showActionMessage("Nothing bit this time.");
    return;
  }

  if (hookRevealTimeoutId) {
    clearTimeout(hookRevealTimeoutId);
  }

  hookRevealTimeoutId = window.setTimeout(() => {
    fishDetails.value = {
      result: spawnedFish.result,
    };
    forms.fishDetails.fish_id = spawnedFish.result.fish_id;
    fishingState.value = "hooked";
    showActionMessage("Something bit...", { autoHideMs: 4200 });
    hookRevealTimeoutId = null;
  }, 2000);
}

function releaseFish() {
  resetFishingScene();
  showActionMessage("You let the fish go.");
}

function getNumericFishValue(...values) {
  const numericValue = values
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value));

  return numericValue ?? 0;
}

function getFishWeightForCapture() {
  return getNumericFishValue(
    activeFish.value?.total_weight,
    activeFish.value?.base_weight,
    activeFish.value?.weight,
    activeFish.value?.fish_weight,
  );
}

function getFishLengthForCapture(weight) {
  const existingLength = getNumericFishValue(
    activeFish.value?.base_length,
    activeFish.value?.length,
    activeFish.value?.fish_length,
  );

  if (existingLength > 0) {
    return existingLength;
  }

  // The spawn endpoint does not provide length, so we derive a simple
  // believable fallback from weight to avoid sending 0 to the capture API.
  return Number(Math.max(weight * 2, 0.3).toFixed(2));
}

function buildCapturePayload() {
  const fishWeight = getFishWeightForCapture();

  return {
    used_rod: selectedRodCode.value,
    used_bait: selectedBaitCode.value,
    fish_id: activeFish.value.fish_id,
    fish_weight: fishWeight,
    fish_length: getFishLengthForCapture(fishWeight),
  };
}

async function captureFish() {
  if (fishingState.value !== "hooked" || !activeFish.value) {
    showActionMessage("Cast your rod first.");
    return;
  }

  if (!hasRods.value) {
    showActionMessage("You need at least one rod to fish.");
    return;
  }

  if (!selectedRodCode.value) {
    showActionMessage("Select one rod before capturing.");
    return;
  }

  const payload = buildCapturePayload();
  const response = await runRequest("capture", () =>
    api.request(CAPTURE_FISH_ENDPOINT, {
      method: "POST",
      auth: true,
      body: payload,
    }),
  );

  if (!response) {
    return;
  }

  showCapturePopup(
    response?.result?.message || "Capture completed.",
    response?.result?.captured ? "success" : "failure",
  );

  if (response?.result?.captured) {
    triggerCelebrationBurst();
  } else {
    triggerFailureBurst();
  }

  const captureMessage = response?.result?.captured
    ? `${activeFish.value.name} captured${payload.used_bait ? ` with ${payload.used_rod} and ${payload.used_bait}` : ` with ${payload.used_rod}`}.`
    : `${activeFish.value.name} slipped away.`;
  await Promise.all([loadFisherProfile(), loadInventoryItems()]);
  resetFishingScene();
  showActionMessage(captureMessage);
}

onMounted(loadFishingView);

onBeforeUnmount(() => {
  if (capturePopupTimeoutId) {
    clearTimeout(capturePopupTimeoutId);
  }

  if (celebrationBurstTimeoutId) {
    clearTimeout(celebrationBurstTimeoutId);
  }

  if (failureBurstTimeoutId) {
    clearTimeout(failureBurstTimeoutId);
  }

  if (hookRevealTimeoutId) {
    clearTimeout(hookRevealTimeoutId);
  }
});
</script>

<template>
  <main class="home-shell">
    <div class="home-scene subpage-scene">
      <header class="subpage-header">
        <button class="soft-button" type="button" @click="$router.push('/')">
          Back Home
        </button>
      </header>

      <transition name="capture-popup">
        <div
          v-if="capturePopup.visible"
          class="capture-popup"
          :class="capturePopup.type"
          role="status"
          aria-live="polite"
        >
          <p>{{ capturePopup.message }}</p>
        </div>
      </transition>

      <transition name="celebration-burst">
        <div
          v-if="celebrationBurstVisible"
          class="celebration-burst"
          aria-hidden="true"
        >
          <span
            v-for="(item, index) in celebrationBurstItems"
            :key="`${item}-${index}`"
            class="celebration-burst-item"
            :class="[item, `item-${index + 1}`]"
          />
        </div>
      </transition>

      <transition name="failure-burst">
        <div
          v-if="failureBurstVisible"
          class="failure-burst"
          aria-hidden="true"
        >
          <span
            v-for="(item, index) in failureBurstItems"
            :key="`${item}-${index}`"
            class="failure-burst-item"
            :class="[item, `item-${index + 1}`]"
          />
        </div>
      </transition>

      <transition name="cast-screen">
        <div
          v-if="fishingState === 'casting'"
          class="cast-screen-overlay"
          aria-hidden="true"
        >
          <div class="cast-screen-rings">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div class="cast-screen-sparkles">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </transition>

      <section class="subpage-hero">
        <div class="hero-copy-block auth-copy-block">
          <h1>Catch a fish</h1>
        </div>
        <div v-if="globalError" class="alert error">{{ globalError }}</div>
        <div
          v-if="actionMessageVisible && actionMessage"
          :class="['alert', actionMessageClass]"
        >
          {{ actionMessage }}
        </div>
      </section>

      <section class="fishing-layout">
        <div class="fishing-sidebar">
          <PanelCard title="Fisher Setup">
            <div
              v-if="fisherProfile"
              class="friendly-data-list compact-profile-list"
            >
              <div
                v-for="item in profileCardItems"
                :key="item.label"
                class="friendly-data-item compact-data-item"
              >
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
            <p v-else class="soft-note">Loading your fisher...</p>

            <form class="form-grid" @submit.prevent="changeZone">
              <p class="compact-section-label">Zone</p>
              <div class="zone-selector">
                <button
                  v-for="zone in zoneOptions"
                  :key="zone.value"
                  type="button"
                  class="zone-option"
                  :class="{ selected: forms.zone.new_zone === zone.value }"
                  @click="forms.zone.new_zone = zone.value"
                >
                  <strong>{{ zone.label }}</strong>
                </button>
              </div>
              <button class="primary-button" :disabled="busy === 'zone'">
                {{
                  busy === "zone" ? "Changing..." : "Change to selected zone"
                }}
              </button>
            </form>
          </PanelCard>
        </div>

        <div class="fishing-main">
          <PanelCard title="Fishing Spot">
            <div class="fishing-scene-card" :class="`state-${fishingState}`">
              <div class="fishing-scene-art">
                <img
                  class="fishing-scene-image"
                  :src="sceneIllustration"
                  :alt="fishingState === 'hooked' ? 'Fish on the hook' : 'Calm fishing scene'"
                />
                <div v-if="fishingState === 'casting'" class="line-ripple" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div class="fishing-scene-copy">
                <p class="mini-badge soft-mini-badge scene-kicker">Fishing</p>
                <h3>
                  {{ fishingState === "hooked" && activeFish ? activeFish.name : "Quiet water" }}
                </h3>
                <p class="scene-message">{{ sceneMessage }}</p>

                <div
                  v-if="fishingState === 'hooked' && activeFish"
                  class="friendly-data-grid fish-stats-grid"
                >
                  <div class="friendly-data-item fish-stat-item">
                    <span>Rarity</span>
                    <strong>{{ activeFish.rarity || "Unknown" }}</strong>
                  </div>
                  <div class="friendly-data-item fish-stat-item">
                    <span>Habitat</span>
                    <strong>{{ activeFish.habitat }}</strong>
                  </div>
                  <div class="friendly-data-item fish-stat-item">
                    <span>Weight</span>
                    <strong>{{ activeFish.total_weight || activeFish.base_weight }}</strong>
                  </div>
                  <div class="friendly-data-item fish-stat-item">
                    <span>Price</span>
                    <strong>{{ activeFish.base_price }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="fishing-footer-actions fish-card-actions compact-actions scene-actions"
            >
              <button
                v-if="fishingState !== 'hooked'"
                class="pastel-action pink fishing-cta"
                type="button"
                :disabled="busy === 'spawnedFish' || fishingState === 'casting'"
                @click="startFishing"
              >
                {{
                  busy === "spawnedFish" || fishingState === "casting"
                    ? "Casting..."
                    : "Cast Rod"
                }}
              </button>
              <template v-else>
                <button
                  class="pastel-action pink fishing-cta"
                  type="button"
                  :disabled="busy === 'capture' || !canCapture"
                  @click="captureFish"
                >
                  {{ busy === "capture" ? "Capturing..." : "Capture" }}
                </button>
                <button
                  class="pastel-action blue fishing-cta"
                  type="button"
                  :disabled="busy === 'capture'"
                  @click="releaseFish"
                >
                  Let It Go
                </button>
              </template>
            </div>
          </PanelCard>

          <PanelCard title="Rod & Bait">
            <div class="gear-sections">
              <div class="gear-block">
                <h4>Rods</h4>
                <p class="gear-helper-text">Pick one rod. Click again to remove.</p>
                <div v-if="rodItems.length" class="gear-item-list">
                  <button
                    v-for="item in rodItems"
                    :key="item.item_code"
                    type="button"
                    class="gear-item"
                    :class="{ selected: selectedRodCode === item.item_code }"
                    @click="selectRod(item.item_code)"
                  >
                    <span>{{ item.item_name }}</span>
                    <strong class="gear-qty">x{{ item.quantity }}</strong>
                  </button>
                </div>
                <p v-else class="soft-note rod-warning">
                  You need at least one rod to fish.
                </p>
              </div>

              <div class="gear-block">
                <h4>Bait</h4>
                <p class="gear-helper-text">Pick one bait. Click again to remove.</p>
                <div v-if="baitItems.length" class="gear-item-list">
                  <button
                    v-for="item in baitItems"
                    :key="item.item_code"
                    type="button"
                    class="gear-item"
                    :class="{ selected: selectedBaitCode === item.item_code }"
                    @click="selectBait(item.item_code)"
                  >
                    <span>{{ item.item_name }}</span>
                    <strong class="gear-qty">x{{ item.quantity }}</strong>
                  </button>
                </div>
                <p v-else class="soft-note">No bait available. You can still fish.</p>
              </div>
            </div>
          </PanelCard>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.capture-popup {
  position: fixed;
  top: 28px;
  left: 50%;
  z-index: 30;
  transform: translateX(-50%);
  min-width: min(440px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  padding: 16px 20px;
  border-radius: 18px;
  border: 1px solid transparent;
  box-shadow: 0 18px 40px rgba(26, 35, 44, 0.18);
  backdrop-filter: blur(10px);
}

.capture-popup p {
  margin: 0;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.capture-popup.success {
  background: rgba(232, 250, 238, 0.96);
  border-color: rgba(82, 168, 111, 0.35);
  color: #256b3d;
  animation: popup-bounce 0.8s ease;
}

.capture-popup.failure {
  background: rgba(255, 243, 235, 0.97);
  border-color: rgba(214, 120, 66, 0.35);
  color: #9b4b1e;
}

.capture-popup-enter-active,
.capture-popup-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.capture-popup-enter-from,
.capture-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

.cast-screen-enter-active,
.cast-screen-leave-active {
  transition: opacity 0.28s ease;
}

.cast-screen-enter-from,
.cast-screen-leave-to {
  opacity: 0;
}

.subpage-hero {
  margin-bottom: 12px;
}

.auth-copy-block {
  max-width: 100%;
}

.auth-copy-block h1 {
  margin: 0;
  font-size: clamp(1.85rem, 3vw, 2.5rem);
}

.compact-profile-list {
  gap: 8px;
  margin-bottom: 14px;
}

.compact-data-item {
  padding: 10px 12px;
  gap: 2px;
}

.compact-section-label {
  margin: 0 0 8px;
  color: #8b84a0;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.alert.spotlight {
  position: relative;
  transform-origin: center;
  box-shadow: 0 18px 40px rgba(183, 163, 208, 0.2);
  animation: alertPulse 1.2s ease-in-out 3;
}

.alert.spotlight.hooked {
  animation: hookedAlertPulse 1s ease-in-out infinite;
}

.alert.spotlight.success {
  background: linear-gradient(135deg, #ebfff1, #f9ffef);
  border: 1px solid rgba(140, 210, 136, 0.75);
  color: #2b7546;
}

.alert.spotlight.failure {
  background: linear-gradient(135deg, #fff0f4, #fff8ef);
  border: 1px solid rgba(236, 162, 184, 0.85);
  color: #a15371;
}

.celebration-burst {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 28;
  overflow: hidden;
}

.celebration-burst-item {
  position: absolute;
  left: 50%;
  top: 92px;
  opacity: 0;
  animation: burst-rise 2.35s ease-out forwards;
}

.celebration-burst-item.star {
  width: 18px;
  height: 18px;
  background: #ffd768;
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 92%,
    50% 70%,
    21% 92%,
    32% 57%,
    2% 35%,
    39% 35%
  );
}

.celebration-burst-item.heart {
  width: 18px;
  height: 18px;
  background: #ff8fb1;
  transform: rotate(-45deg);
}

.celebration-burst-item.heart::before,
.celebration-burst-item.heart::after {
  content: "";
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ff8fb1;
}

.celebration-burst-item.heart::before {
  top: -9px;
  left: 0;
}

.celebration-burst-item.heart::after {
  top: 0;
  left: 9px;
}

.celebration-burst-item.bubble,
.celebration-burst-item.spark {
  border-radius: 999px;
}

.celebration-burst-item.bubble {
  width: 14px;
  height: 14px;
  background: rgba(154, 225, 255, 0.95);
  box-shadow: 0 0 0 5px rgba(154, 225, 255, 0.2);
}

.celebration-burst-item.spark {
  width: 10px;
  height: 10px;
  background: #9df1c8;
  box-shadow:
    0 0 0 4px rgba(157, 241, 200, 0.16),
    0 0 18px rgba(157, 241, 200, 0.3);
}

.celebration-burst-item.item-1 {
  animation-delay: 0s;
  --burst-x: -152px;
  --burst-y: 132px;
  --burst-rotate: -35deg;
}

.celebration-burst-item.item-2 {
  animation-delay: 0.05s;
  --burst-x: -94px;
  --burst-y: 168px;
  --burst-rotate: 24deg;
}

.celebration-burst-item.item-3 {
  animation-delay: 0.08s;
  --burst-x: -22px;
  --burst-y: 148px;
  --burst-rotate: -18deg;
}

.celebration-burst-item.item-4 {
  animation-delay: 0.12s;
  --burst-x: 36px;
  --burst-y: 172px;
  --burst-rotate: 30deg;
}

.celebration-burst-item.item-5 {
  animation-delay: 0.03s;
  --burst-x: 104px;
  --burst-y: 142px;
  --burst-rotate: -28deg;
}

.celebration-burst-item.item-6 {
  animation-delay: 0.09s;
  --burst-x: 156px;
  --burst-y: 178px;
  --burst-rotate: 20deg;
}

.failure-burst {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 27;
  overflow: hidden;
}

.failure-burst-item {
  position: absolute;
  left: 50%;
  top: 108px;
  opacity: 0;
  animation: kawaiiDrop 2.1s ease-in forwards;
}

.failure-burst-item.tear {
  width: 14px;
  height: 20px;
  background: linear-gradient(180deg, #9edcff, #5bb4ff);
  border-radius: 50% 50% 55% 55%;
  transform: rotate(12deg);
}

.failure-burst-item.cloud {
  width: 18px;
  height: 18px;
  background: #ffd7e9;
  border-radius: 999px;
  box-shadow:
    -10px 2px 0 0 #ffd7e9,
    10px 3px 0 0 #ffd7e9;
}

.failure-burst-item.heart {
  width: 16px;
  height: 16px;
  background: #ff9dbc;
  transform: rotate(-45deg);
}

.failure-burst-item.heart::before,
.failure-burst-item.heart::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff9dbc;
}

.failure-burst-item.heart::before {
  top: -8px;
  left: 0;
}

.failure-burst-item.heart::after {
  top: 0;
  left: 8px;
}

.failure-burst-item.item-1 {
  --drop-x: -132px;
  animation-delay: 0s;
}

.failure-burst-item.item-2 {
  --drop-x: -56px;
  animation-delay: 0.12s;
}

.failure-burst-item.item-3 {
  --drop-x: 0px;
  animation-delay: 0.08s;
}

.failure-burst-item.item-4 {
  --drop-x: 68px;
  animation-delay: 0.18s;
}

.failure-burst-item.item-5 {
  --drop-x: 136px;
  animation-delay: 0.1s;
}

.cast-screen-overlay {
  position: fixed;
  inset: 0;
  z-index: 24;
  pointer-events: none;
  overflow: hidden;
  background: radial-gradient(
    circle at center,
    rgba(220, 245, 255, 0.16),
    rgba(255, 240, 248, 0.1),
    rgba(255, 255, 255, 0)
  );
}

.cast-screen-rings,
.cast-screen-sparkles {
  position: absolute;
  inset: 0;
}

.cast-screen-rings span {
  position: absolute;
  left: 50%;
  top: 54%;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  border: 4px solid rgba(132, 212, 241, 0.42);
  transform: translate(-50%, -50%);
  animation: screenRipple 2s ease-out infinite;
}

.cast-screen-rings span:nth-child(2) {
  animation-delay: 0.3s;
}

.cast-screen-rings span:nth-child(3) {
  animation-delay: 0.6s;
}

.cast-screen-rings span:nth-child(4) {
  animation-delay: 0.9s;
}

.cast-screen-sparkles span {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: radial-gradient(circle, #fff2a6, #ffd97a 60%, rgba(255, 217, 122, 0) 72%);
  animation: sparkleFloat 1.8s ease-in-out infinite;
}

.cast-screen-sparkles span:nth-child(1) {
  left: 24%;
  top: 28%;
}

.cast-screen-sparkles span:nth-child(2) {
  right: 24%;
  top: 34%;
  animation-delay: 0.35s;
}

.cast-screen-sparkles span:nth-child(3) {
  left: 30%;
  bottom: 26%;
  animation-delay: 0.18s;
}

.cast-screen-sparkles span:nth-child(4) {
  right: 28%;
  bottom: 22%;
  animation-delay: 0.52s;
}

@keyframes burst-rise {
  0% {
    opacity: 0;
    transform: translate(-50%, 18px) scale(0.5) rotate(0deg);
  }

  12% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--burst-x)), calc(-1 * var(--burst-y)))
      scale(1.12) rotate(var(--burst-rotate));
  }
}

@keyframes popup-bounce {
  0% {
    transform: translateX(-50%) scale(0.9);
  }

  60% {
    transform: translateX(-50%) scale(1.04);
  }

  100% {
    transform: translateX(-50%) scale(1);
  }
}

@keyframes alertPulse {
  0% {
    transform: scale(1);
  }

  35% {
    transform: scale(1.04);
  }

  70% {
    transform: scale(0.985);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes hookedAlertPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 18px 40px rgba(183, 163, 208, 0.2);
  }

  30% {
    transform: scale(1.06);
    box-shadow: 0 24px 52px rgba(183, 163, 208, 0.28);
  }

  60% {
    transform: scale(0.985);
    box-shadow: 0 14px 30px rgba(183, 163, 208, 0.16);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 18px 40px rgba(183, 163, 208, 0.2);
  }
}

@keyframes kawaiiDrop {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) translateX(var(--drop-x)) scale(0.7);
  }

  20% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, 190px) translateX(var(--drop-x)) scale(1.08)
      rotate(16deg);
  }
}

@keyframes screenRipple {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.25);
  }

  22% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(3.2);
  }
}

@keyframes sparkleFloat {
  0% {
    opacity: 0.25;
    transform: scale(0.8) translateY(0);
  }

  50% {
    opacity: 1;
    transform: scale(1.12) translateY(-8px);
  }

  100% {
    opacity: 0.3;
    transform: scale(0.84) translateY(0);
  }
}

.gear-helper-text {
  margin: 0 0 8px;
  color: #7d7190;
  font-size: 0.82rem;
}

.gear-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  border: 1px solid rgba(79, 133, 170, 0.32);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96),
    rgba(234, 244, 250, 0.88)
  );
  appearance: none;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 6px 18px rgba(79, 133, 170, 0.08);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.gear-item::after {
  content: "Choose";
  position: absolute;
  top: 10px;
  right: 14px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(79, 133, 170, 0.1);
  color: #4f85aa;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.gear-item:hover {
  border-color: rgba(79, 133, 170, 0.65);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 1),
    rgba(220, 240, 249, 0.96)
  );
  box-shadow: 0 14px 28px rgba(79, 133, 170, 0.16);
  transform: translateY(-2px);
}

.gear-item.selected {
  border-color: rgba(79, 133, 170, 0.8);
  background: rgba(79, 133, 170, 0.12);
  box-shadow: 0 10px 24px rgba(79, 133, 170, 0.16);
  transform: translateY(-1px);
}

.gear-item.selected::after {
  content: "Selected";
  background: rgba(79, 133, 170, 0.18);
}

.gear-item:focus-visible {
  outline: 2px solid rgba(79, 133, 170, 0.8);
  outline-offset: 2px;
}

.gear-qty {
  padding-right: 92px;
  color: #5f5572;
  font-size: 0.95rem;
}

.fishing-layout {
  grid-template-columns: minmax(250px, 300px) minmax(0, 1fr);
  gap: 16px;
}

.fishing-sidebar,
.fishing-main {
  gap: 14px;
}

.fishing-sidebar :deep(.panel-card),
.fishing-main :deep(.panel-card) {
  padding: 18px 20px;
}

.friendly-data-list,
.friendly-data-grid {
  gap: 8px;
}

.friendly-data-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.friendly-data-item {
  padding: 10px 12px;
}

.fishing-scene-card {
  display: grid;
  grid-template-columns: minmax(280px, 1.1fr) minmax(0, 0.9fr);
  gap: 16px;
  align-items: center;
}

.fishing-scene-art {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 320px;
  padding: 18px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.95), transparent 50%),
    linear-gradient(180deg, rgba(228, 245, 255, 0.95), rgba(239, 250, 255, 0.82));
  border: 1px solid rgba(191, 223, 243, 0.9);
  overflow: hidden;
}

.fishing-scene-image {
  position: relative;
  z-index: 1;
  width: min(100%, 400px);
  height: auto;
  object-fit: contain;
}

.fishing-scene-copy {
  display: grid;
  gap: 12px;
}

.scene-kicker {
  width: fit-content;
  margin: 0;
}

.fishing-scene-copy h3 {
  margin: 0;
  color: #5d536f;
  font-size: clamp(1.7rem, 3vw, 2.35rem);
  font-family: "Fredoka", "Nunito", sans-serif;
}

.scene-message {
  margin: 0;
  color: #746987;
  font-size: 1rem;
  line-height: 1.6;
}

.fish-stats-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.fish-stat-item {
  min-height: 0;
}

.line-ripple {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.line-ripple span {
  position: absolute;
  width: 88px;
  height: 88px;
  border-radius: 999px;
  border: 3px solid rgba(88, 176, 214, 0.45);
  animation: rippleCast 2s ease-out infinite;
}

.line-ripple span:nth-child(2) {
  animation-delay: 0.25s;
}

.line-ripple span:nth-child(3) {
  animation-delay: 0.5s;
}

.zone-selector {
  gap: 8px;
}

.zone-option {
  padding: 12px 14px;
}

.zone-option span {
  display: none;
}

.gear-sections {
  gap: 12px;
}

.gear-block h4 {
  margin-bottom: 6px;
}

.gear-item-list {
  gap: 8px;
}

.rod-warning {
  color: #9b4b1e;
}

.gear-item {
  padding: 11px 12px;
}

.compact-actions {
  margin-top: 12px;
}

.scene-actions {
  margin-top: 18px;
}

.fishing-cta {
  min-height: 58px;
  padding: 14px 18px;
  font-size: 1rem;
}

@keyframes rippleCast {
  0% {
    opacity: 0;
    transform: scale(0.35);
  }

  25% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: scale(2.2);
  }
}

@media (max-width: 1100px) {
  .friendly-data-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fishing-scene-card {
    grid-template-columns: 1fr;
  }

  .fish-stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .fish-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fishing-scene-art {
    min-height: 240px;
  }

  .fishing-scene-image {
    width: min(100%, 300px);
  }
}
</style>
