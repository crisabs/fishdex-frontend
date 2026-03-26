<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import PanelCard from "../components/PanelCard.vue";
import marketIllustration from "../components/market.svg";
import { fishersService } from "../services/fishersService";
import { storeService } from "../services/storeService";

const baitOptions = ref([]);
const rodOptions = ref([]);

const globalError = ref("");
const busy = ref("");
const actionMessage = ref("");
const fisherProfile = ref(null);
const purchaseCelebration = ref(false);
const responses = reactive({
  buyItem: null,
  baitPurchase: null,
  rodPurchase: null,
});

let celebrationTimer = null;

const forms = reactive({
  bait: { item_code: "", quantity: 1 },
  rod: { item_code: "", quantity: 1 },
});

const allOptions = computed(() => [...baitOptions.value, ...rodOptions.value]);

const optionLabels = computed(() =>
  Object.fromEntries(allOptions.value.map((option) => [option.value, option.label])),
);

const optionDisplayLabels = computed(() =>
  Object.fromEntries(
    allOptions.value.map((option) => [option.value, formatOptionLabel(option)]),
  ),
);
const optionMap = computed(() =>
  Object.fromEntries(allOptions.value.map((option) => [option.value, option])),
);
const baitSelectionSummary = computed(() =>
  buildSelectionSummary(forms.bait.item_code, forms.bait.quantity),
);
const rodSelectionSummary = computed(() =>
  buildSelectionSummary(forms.rod.item_code, forms.rod.quantity),
);

const fisherInfo = computed(() => {
  const result = fisherProfile.value?.result;

  if (!result) {
    return [];
  }

  return [
    { label: "Nickname", value: result.nickname },
    { label: "Coins", value: String(result.coins) },
  ];
});

function formatCoins(value) {
  return `${value} coins`;
}

function formatOptionLabel(option) {
  return `${option.label} - ${formatCoins(option.price)}`;
}

function buildSelectionSummary(itemCode, quantity) {
  const option = optionMap.value[itemCode];

  if (!option) {
    return null;
  }

  const units = Math.max(Number(quantity) || 1, 1);
  const total = Number(option.price) * units;

  return {
    label: option.label,
    units,
    total,
  };
}

function normalizeStoreOptions(items, type) {
  const prefix = type === "bait" ? "BAIT" : "ROD";

  return (items || []).map((item) => {
    const slug = item.name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    return {
      label: item.name,
      price: item.price,
      value: `${prefix}_${slug.split("_")[0]}`,
    };
  });
}

function triggerPurchaseCelebration() {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
  }

  purchaseCelebration.value = false;

  requestAnimationFrame(() => {
    purchaseCelebration.value = true;
    celebrationTimer = setTimeout(() => {
      purchaseCelebration.value = false;
      celebrationTimer = null;
    }, 1600);
  });
}

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

async function loadProfile() {
  const profile = await runRequest("profile", () => fishersService.getMe());

  if (profile) {
    fisherProfile.value = profile;
  }
}

async function loadStoreOptions() {
  const [baitStore, rodStore] = await Promise.all([
    runRequest("baitStore", () => storeService.getBaitStoreList()),
    runRequest("rodStore", () => storeService.getRodStoreList()),
  ]);

  if (baitStore?.result) {
    baitOptions.value = normalizeStoreOptions(baitStore.result, "bait");
  }

  if (rodStore?.result) {
    rodOptions.value = normalizeStoreOptions(rodStore.result, "rod");
  }
}

function clearSelection() {
  forms.bait.item_code = "";
  forms.bait.quantity = 1;
  forms.rod.item_code = "";
  forms.rod.quantity = 1;
  responses.buyItem = null;
  responses.baitPurchase = null;
  responses.rodPurchase = null;
  globalError.value = "";
  actionMessage.value = "Purchase selection cleared.";
}

function clearBaitSelection() {
  forms.bait.item_code = "";
  forms.bait.quantity = 1;
  responses.baitPurchase = null;
  globalError.value = "";
  actionMessage.value = "Bait selection cleared.";
}

function clearRodSelection() {
  forms.rod.item_code = "";
  forms.rod.quantity = 1;
  responses.rodPurchase = null;
  globalError.value = "";
  actionMessage.value = "Rod selection cleared.";
}

async function buyBait() {
  if (!forms.bait.item_code) {
    actionMessage.value = "";
    globalError.value = "Select one bait before buying.";
    return;
  }

  const payload = {
    item_code: forms.bait.item_code,
    quantity: forms.bait.quantity,
  };

  const response = await runRequest("buyItem", () =>
    storeService.buyItem(payload),
  );

  if (!response) {
    return;
  }

  responses.baitPurchase = {
    request: payload,
    response,
  };
  responses.buyItem = responses.baitPurchase;
  actionMessage.value = "Bait purchase completed successfully.";
  triggerPurchaseCelebration();
  await loadProfile();
}

async function buyRod() {
  if (!forms.rod.item_code) {
    actionMessage.value = "";
    globalError.value = "Select one rod before buying.";
    return;
  }

  const payload = {
    item_code: forms.rod.item_code,
    quantity: forms.rod.quantity,
  };

  const response = await runRequest("buyItem", () =>
    storeService.buyItem(payload),
  );

  if (!response) {
    return;
  }

  responses.rodPurchase = {
    request: payload,
    response,
  };
  responses.buyItem = responses.rodPurchase;
  actionMessage.value = "Rod purchase completed successfully.";
  triggerPurchaseCelebration();
  await loadProfile();
}

onMounted(loadProfile);
onMounted(loadStoreOptions);

onBeforeUnmount(() => {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
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

      <section class="subpage-hero">
        <div class="store-hero-card">
          <div class="hero-copy-block auth-copy-block store-copy-block">
            <p class="mini-badge">Store</p>
            <h1>Pick your gear and head back to the water</h1>
            <p class="store-hero-text">
              Choose bait and rods, set the quantity, and keep an eye on your
              coins.
            </p>
          </div>
          <div class="store-hero-art">
            <img
              class="store-hero-image"
              :src="marketIllustration"
              alt="Market illustration"
            />
          </div>
        </div>
        <div v-if="globalError" class="alert error">{{ globalError }}</div>
        <div v-if="actionMessage" class="alert success">
          {{ actionMessage }}
        </div>
      </section>

      <section class="store-screen">
        <PanelCard title="Your Wallet">
          <div
            v-if="fisherInfo.length"
            :class="['store-profile-grid', { celebrating: purchaseCelebration }]"
          >
            <div v-if="purchaseCelebration" class="purchase-burst" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div
              v-for="item in fisherInfo"
              :key="item.label"
              :class="[
                'friendly-data-item',
                'store-profile-item',
                { 'coins-highlight': item.label === 'Coins' },
              ]"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <p v-else class="soft-note">Loading fisher profile...</p>
        </PanelCard>

        <section class="store-grid">
          <PanelCard title="Bait">
            <form class="form-grid store-form" @submit.prevent>
              <label>
                <span>Type</span>
                <select v-model="forms.bait.item_code">
                  <option value="">Choose bait</option>
                  <option
                    v-for="option in baitOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ formatOptionLabel(option) }}
                  </option>
                </select>
              </label>
              <label>
                <span>Quantity</span>
                <input
                  v-model.number="forms.bait.quantity"
                  type="number"
                  min="1"
                  :disabled="!forms.bait.item_code"
                />
              </label>
              <div v-if="baitSelectionSummary" class="selection-chip">
                <span>Selected</span>
                <strong>
                  {{
                    `${baitSelectionSummary.label} · x${baitSelectionSummary.units} · ${formatCoins(baitSelectionSummary.total)}`
                  }}
                </strong>
              </div>
              <div class="panel-inline-actions">
                <button
                  class="primary-button"
                  type="button"
                  :disabled="
                    busy === 'buyItem' ||
                    busy === 'profile' ||
                    !forms.bait.item_code
                  "
                  @click="buyBait"
                >
                  {{ busy === "buyItem" ? "Buying..." : "Buy bait" }}
                </button>
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="busy === 'buyItem'"
                  @click="clearBaitSelection"
                >
                  Clear
                </button>
              </div>
            </form>
          </PanelCard>

          <PanelCard title="Rods">
            <form class="form-grid store-form" @submit.prevent>
              <label>
                <span>Type</span>
                <select v-model="forms.rod.item_code">
                  <option value="">Choose rod</option>
                  <option
                    v-for="option in rodOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ formatOptionLabel(option) }}
                  </option>
                </select>
              </label>
              <label>
                <span>Quantity</span>
                <input
                  v-model.number="forms.rod.quantity"
                  type="number"
                  min="1"
                  :disabled="!forms.rod.item_code"
                />
              </label>
              <div v-if="rodSelectionSummary" class="selection-chip">
                <span>Selected</span>
                <strong>
                  {{
                    `${rodSelectionSummary.label} · x${rodSelectionSummary.units} · ${formatCoins(rodSelectionSummary.total)}`
                  }}
                </strong>
              </div>
              <div class="panel-inline-actions">
                <button
                  class="primary-button"
                  type="button"
                  :disabled="
                    busy === 'buyItem' ||
                    busy === 'profile' ||
                    !forms.rod.item_code
                  "
                  @click="buyRod"
                >
                  {{ busy === "buyItem" ? "Buying..." : "Buy rod" }}
                </button>
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="busy === 'buyItem'"
                  @click="clearRodSelection"
                >
                  Clear
                </button>
              </div>
            </form>
          </PanelCard>
        </section>
      </section>
    </div>
  </main>
</template>

<style scoped>
.store-screen {
  display: grid;
  gap: 22px;
  flex: 1;
  min-height: 0;
}

.store-hero-card {
  width: min(100%, 1120px);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(240px, 0.9fr);
  gap: 24px;
  align-items: center;
  padding: 26px 28px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(241, 225, 255, 0.9), transparent 30%),
    linear-gradient(180deg, rgba(255, 250, 255, 0.95), rgba(244, 241, 255, 0.92));
  border: 1px solid rgba(216, 199, 242, 0.88);
  box-shadow: 0 24px 60px rgba(176, 152, 212, 0.18);
}

.store-copy-block {
  max-width: 100%;
  text-align: left;
}

.store-hero-art {
  display: grid;
  place-items: center;
  padding: 16px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(246, 234, 255, 0.9), rgba(231, 241, 255, 0.86));
  border: 1px solid rgba(211, 195, 240, 0.82);
}

.store-hero-image {
  width: min(100%, 340px);
  height: auto;
  object-fit: contain;
}

.store-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  align-items: start;
  min-height: 0;
}

.store-hero-text {
  max-width: 560px;
  margin: 12px 0 0;
  color: #786c8f;
}

.store-profile-grid {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  padding: 4px;
  border-radius: 24px;
}

.purchase-burst {
  position: absolute;
  inset: -20% -5%;
  pointer-events: none;
}

.purchase-burst span {
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
  animation: storeBurst 1.2s ease-out forwards;
}

.purchase-burst span:nth-child(1) {
  top: -18px;
  left: -10px;
}

.purchase-burst span:nth-child(2) {
  top: 8px;
  right: 10%;
  animation-delay: 0.08s;
}

.purchase-burst span:nth-child(3) {
  bottom: -24px;
  left: 32%;
  animation-delay: 0.16s;
}

.store-profile-item strong {
  font-size: 1.35rem;
}

.store-profile-item.coins-highlight {
  background: linear-gradient(135deg, #f5e6ff, #ead7ff);
  border-color: rgba(179, 135, 241, 0.82);
  box-shadow: 0 18px 34px rgba(172, 127, 232, 0.28);
  color: #694097;
}

.store-profile-grid.celebrating .store-profile-item.coins-highlight {
  animation: walletPulse 0.95s ease;
}

.store-profile-item.coins-highlight span,
.store-profile-item.coins-highlight strong {
  color: #694097;
}

.store-profile-item.coins-highlight strong {
  font-size: 1.55rem;
}

.store-screen :deep(.panel-card) {
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 251, 255, 0.94), rgba(245, 242, 255, 0.92));
  border: 1px solid rgba(214, 198, 240, 0.88);
  box-shadow: 0 24px 52px rgba(176, 152, 212, 0.14);
}

.store-form {
  gap: 16px;
}

.store-form label span {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 1rem;
  font-weight: 700;
}

.selection-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 241, 247, 0.95),
    rgba(235, 245, 255, 0.92)
  );
  border: 1px solid rgba(214, 201, 233, 0.82);
  color: #6b607f;
}

.selection-chip span {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b1849f;
}

.selection-chip strong {
  font-size: 1.15rem;
}

.store-summary-list {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 18px;
}

.store-summary-item {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(219, 208, 235, 0.85);
  box-shadow: 0 14px 30px rgba(215, 197, 226, 0.14);
}

.store-summary-kicker {
  margin: 0 0 6px;
  font-size: 0.74rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #d18aa8;
}

.store-summary-item h3 {
  margin: 0;
  color: #5e5472;
  font-size: 1.2rem;
  font-family: "Fredoka", "Nunito", sans-serif;
}

.summary-code {
  margin: 6px 0 8px;
  color: #8b84a0;
  font-size: 0.92rem;
}

.summary-quantity {
  margin: 0;
  color: #7f7590;
  font-size: 0.95rem;
}

.store-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin: 20px 0 16px;
}

.panel-inline-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

select {
  width: 100%;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(205, 194, 227, 0.9);
  background: rgba(255, 255, 255, 0.94);
  color: #5d536f;
  font-size: 1.08rem;
  font-weight: 700;
}

select option {
  font-size: 1.02rem;
}

@keyframes walletPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 16px 32px rgba(228, 186, 58, 0.28);
  }

  35% {
    transform: scale(1.04);
    box-shadow: 0 22px 42px rgba(228, 186, 58, 0.38);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 16px 32px rgba(228, 186, 58, 0.28);
  }
}

@keyframes storeBurst {
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
  .store-hero-card {
    grid-template-columns: 1fr;
    padding: 22px;
  }

  .store-grid {
    grid-template-columns: 1fr;
  }

  .panel-inline-actions,
  .store-actions {
    flex-direction: column;
  }
}
</style>
