<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import PanelCard from "../components/PanelCard.vue";
import inventoryIllustration from "../components/inventory.svg";
import { fishersService } from "../services/fishersService";
import { inventoryService } from "../services/inventoryService";

const globalError = ref("");
const busy = ref("");
const actionMessage = ref("");
const activeTab = ref("items");
const inventoryItemsResponse = ref(null);
const inventoryFishesResponse = ref(null);
const fisherProfileResponse = ref(null);
const selectedFish = ref(null);
const descriptionModalOpen = ref(false);
const sellModalOpen = ref(false);
const saleCelebration = ref(false);
const soldFishName = ref("");

let celebrationTimer = null;

const forms = reactive({
  sellFish: { pk: 1, fish_id: 1, total_weight: "1.00" },
  fishDescription: { pk: 1, description: "" },
});

const inventoryTabs = [
  { value: "items", label: "Items" },
  { value: "fishes", label: "Fishes" },
];

const inventoryItems = computed(() =>
  getCollection(inventoryItemsResponse.value)
    .filter((item) => Number(item.quantity) > 0)
    .sort((left, right) => Number(right.quantity) - Number(left.quantity)),
);
const inventoryFishes = computed(() =>
  getCollection(inventoryFishesResponse.value).map((fish, index) => ({
    ...fish,
    __rowKey: fish.pk ?? `${fish.fish_id ?? "fish"}-${index}`,
  })),
);
const fisherProfile = computed(() => fisherProfileResponse.value?.result ?? null);

function getCollection(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.result)) {
    return payload.result;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
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

async function loadInventoryItems() {
  const response = await runRequest("inventoryItems", () =>
    inventoryService.getItems(),
  );

  if (response) {
    inventoryItemsResponse.value = response;
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

async function loadFisherProfile() {
  const response = await runRequest("fisherProfile", () =>
    fishersService.getMe(),
  );

  if (response) {
    fisherProfileResponse.value = response;
  }
}

function triggerSaleCelebration() {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
  }

  saleCelebration.value = false;

  requestAnimationFrame(() => {
    saleCelebration.value = true;
    celebrationTimer = window.setTimeout(() => {
      saleCelebration.value = false;
      celebrationTimer = null;
    }, 2100);
  });
}

async function loadInventoryView() {
  await Promise.all([
    loadFisherProfile(),
    loadInventoryItems(),
    loadInventoryFishes(),
  ]);
}

function formatFishLabel(fish) {
  return fish.name || fish.fish_name || `Fish #${fish.fish_id ?? fish.pk ?? "?"}`;
}

function formatFishMeta(fish) {
  return [
    fish.rarity,
    fish.habitat,
    fish.total_weight ? `${fish.total_weight} kg` : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

function getSellValue(fish) {
  return fish?.base_price ?? fish?.price ?? fish?.sell_price ?? 0;
}

function getFishWeight(fish) {
  return fish?.total_weight ?? fish?.base_weight ?? fish?.weight ?? 0;
}

function prepareFishForms(fish) {
  selectedFish.value = fish;
  forms.sellFish.pk = fish.pk ?? 1;
  forms.sellFish.fish_id = fish.fish_id ?? 1;
  forms.sellFish.total_weight = String(getFishWeight(fish) || "1.00");
  forms.fishDescription.pk = fish.pk ?? 1;
  forms.fishDescription.description = fish.description || "";
}

function openDescriptionModal(fish) {
  prepareFishForms(fish);
  descriptionModalOpen.value = true;
}

function closeDescriptionModal() {
  descriptionModalOpen.value = false;
}

function openSellModal(fish) {
  prepareFishForms(fish);
  sellModalOpen.value = true;
}

function closeSellModal() {
  sellModalOpen.value = false;
}

async function submitFishDescription() {
  const response = await runRequest("fishDescription", () =>
    inventoryService.updateFishDescription(forms.fishDescription),
  );

  if (!response) {
    return;
  }

  actionMessage.value = "Description saved.";
  closeDescriptionModal();
  await loadInventoryFishes();
}

async function submitSellFish() {
  console.log("[InventoryView] sellFish payload", { ...forms.sellFish });
  soldFishName.value = selectedFish.value ? formatFishLabel(selectedFish.value) : "Fish";

  const response = await runRequest("sellFish", () =>
    inventoryService.sellFish(forms.sellFish),
  );

  if (!response) {
    return;
  }

  closeSellModal();
  triggerSaleCelebration();
  actionMessage.value = `${soldFishName.value} sold. Coins updated.`;
  await Promise.all([loadFisherProfile(), loadInventoryFishes()]);
}

onMounted(loadInventoryView);

onBeforeUnmount(() => {
  if (celebrationTimer) {
    clearTimeout(celebrationTimer);
  }
});
</script>

<template>
  <main class="home-shell">
    <div class="home-scene subpage-scene inventory-scene">
      <header class="subpage-header">
        <button class="soft-button" type="button" @click="$router.push('/')">
          Back Home
        </button>
      </header>

      <transition name="inventory-modal">
        <div
          v-if="descriptionModalOpen"
          class="inventory-modal-backdrop"
          @click.self="closeDescriptionModal"
        >
          <div class="inventory-modal-card">
            <div class="inventory-modal-header">
              <div>
                <p class="inventory-modal-kicker">Add description</p>
                <h3>{{ selectedFish ? formatFishLabel(selectedFish) : "Fish" }}</h3>
              </div>
            </div>

            <form class="form-grid" @submit.prevent="submitFishDescription">
              <label>
                <span>Description</span>
                <textarea
                  v-model="forms.fishDescription.description"
                  rows="6"
                  placeholder="Add a sweet note about this catch..."
                  required
                />
              </label>
              <div class="inventory-modal-actions">
                <button
                  class="soft-button compact-button"
                  type="button"
                  @click="closeDescriptionModal"
                >
                  Cancel
                </button>
                <button class="primary-button" :disabled="busy === 'fishDescription'">
                  {{
                    busy === "fishDescription" ? "Saving..." : "Save"
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <transition name="inventory-modal">
        <div
          v-if="sellModalOpen"
          class="inventory-modal-backdrop"
          @click.self="closeSellModal"
        >
          <div class="inventory-modal-card sell-confirmation-card">
            <div class="inventory-modal-header">
              <div>
                <p class="inventory-modal-kicker">Confirm sale</p>
                <h3>{{ selectedFish ? formatFishLabel(selectedFish) : "Fish" }}</h3>
              </div>
            </div>

            <div class="sell-confirmation-copy">
              <p>
                Do you really want to sell
                <strong>{{ selectedFish ? formatFishLabel(selectedFish) : "this fish" }}</strong>
                for
                <strong>{{ getSellValue(selectedFish) }}</strong>
                coins?
              </p>
            </div>

            <div class="inventory-modal-actions">
              <button
                class="soft-button compact-button"
                type="button"
                @click="closeSellModal"
              >
                Cancel
              </button>
              <button
                class="primary-button"
                type="button"
                :disabled="busy === 'sellFish'"
                @click="submitSellFish"
              >
                {{ busy === "sellFish" ? "Selling..." : "Sell" }}
              </button>
            </div>
          </div>
        </div>
      </transition>

      <section class="subpage-hero inventory-hero">
        <div class="inventory-hero-card">
          <div class="hero-copy-block auth-copy-block inventory-copy-block">
            <p class="mini-badge">Inventory</p>
            <h1>Inventory</h1>
            <p>Your items and fishes, all in one cozy place.</p>
            <div v-if="fisherProfile" class="inventory-profile-strip">
              <div class="inventory-profile-pill">
                <span>Fisher</span>
                <strong>{{ fisherProfile.nickname }}</strong>
              </div>
              <div
                :class="[
                  'inventory-profile-pill',
                  'coins-pill',
                  { celebrating: saleCelebration },
                ]"
              >
                <div v-if="saleCelebration" class="inventory-sale-burst" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span>Coins</span>
                <strong>{{ fisherProfile.coins }}</strong>
              </div>
            </div>
          </div>
          <div class="inventory-hero-art">
            <img
              class="inventory-hero-image"
              :src="inventoryIllustration"
              alt="Inventory illustration"
            />
          </div>
        </div>
        <div v-if="globalError" class="alert error">{{ globalError }}</div>
        <div v-if="actionMessage" class="alert success">{{ actionMessage }}</div>
      </section>

      <section class="inventory-layout">
        <div class="inventory-sidebar">
          <PanelCard title="Your stash">
            <div class="inventory-tab-row">
              <button
                v-for="tab in inventoryTabs"
                :key="tab.value"
                type="button"
                class="inventory-tab"
                :class="{ selected: activeTab === tab.value }"
                @click="activeTab = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>

            <div v-if="activeTab === 'items'" class="inventory-panel-content">
              <div class="inventory-panel-heading">
                <h3>Items</h3>
                <button
                  class="soft-button compact-button"
                  type="button"
                  :disabled="busy === 'inventoryItems'"
                  @click="loadInventoryItems"
                >
                  {{ busy === "inventoryItems" ? "Loading..." : "Refresh" }}
                </button>
              </div>

              <div v-if="inventoryItems.length" class="inventory-list">
                <article
                  v-for="item in inventoryItems"
                  :key="item.item_code"
                  class="inventory-card"
                >
                  <div>
                    <strong>{{ item.item_name }}</strong>
                    <p>{{ item.item_code }}</p>
                  </div>
                  <span class="inventory-pill">x{{ item.quantity }}</span>
                </article>
              </div>
              <p v-else class="soft-note">No items in your backpack yet.</p>
            </div>

            <div v-else class="inventory-panel-content">
              <div class="inventory-panel-heading">
                <h3>Fishes</h3>
                <button
                  class="soft-button compact-button"
                  type="button"
                  :disabled="busy === 'inventoryFishes'"
                  @click="loadInventoryFishes"
                >
                  {{ busy === "inventoryFishes" ? "Loading..." : "Refresh" }}
                </button>
              </div>

              <div v-if="inventoryFishes.length" class="inventory-list fish-list">
                <article
                  v-for="fish in inventoryFishes"
                  :key="fish.__rowKey"
                  class="inventory-card fish-card"
                >
                  <div class="fish-card-copy">
                    <strong>{{ formatFishLabel(fish) }}</strong>
                    <p>{{ formatFishMeta(fish) || `Fish ID ${fish.fish_id}` }}</p>
                    <div class="fish-card-stats">
                      <span class="inventory-pill soft-blue">
                        {{ getFishWeight(fish) }} kg
                      </span>
                      <span class="inventory-pill soft-gold">
                        {{ getSellValue(fish) }} coins
                      </span>
                    </div>
                  </div>
                  <div class="fish-card-actions">
                    <button
                      class="soft-button compact-button"
                      type="button"
                      @click="openDescriptionModal(fish)"
                    >
                      Add description
                    </button>
                    <button
                      class="pastel-action pink compact-action-button"
                      type="button"
                      @click="openSellModal(fish)"
                    >
                      Sell
                    </button>
                  </div>
                </article>
              </div>
              <p v-else class="soft-note">No fishes stored yet.</p>
            </div>
          </PanelCard>
        </div>

      </section>
    </div>
  </main>
</template>

<style scoped>
.inventory-scene {
  min-height: calc(100vh - 40px);
  overflow: hidden;
}

.inventory-layout {
  flex: 1;
  min-height: 0;
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

.sell-confirmation-card {
  width: min(100%, 520px);
}

.sell-confirmation-copy {
  margin-bottom: 20px;
}

.sell-confirmation-copy p {
  margin: 0;
  color: #6e637f;
  font-size: 1rem;
  line-height: 1.6;
}

.sell-confirmation-copy strong {
  color: #5f5572;
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

.inventory-hero {
  margin-bottom: 12px;
}

.inventory-hero-card {
  width: min(100%, 1120px);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(240px, 0.9fr);
  gap: 24px;
  align-items: center;
  padding: 18px 22px;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(241, 225, 255, 0.9), transparent 30%),
    linear-gradient(180deg, rgba(255, 250, 255, 0.95), rgba(244, 241, 255, 0.92));
  border: 1px solid rgba(216, 199, 242, 0.88);
  box-shadow: 0 24px 60px rgba(176, 152, 212, 0.18);
}

.inventory-copy-block {
  max-width: 100%;
  text-align: left;
}

.inventory-hero .auth-copy-block h1 {
  margin: 0;
  font-size: clamp(1.9rem, 3vw, 2.4rem);
}

.inventory-hero .auth-copy-block p {
  margin-top: 6px;
  color: #786c8f;
  font-size: 0.98rem;
}

.inventory-hero-art {
  display: grid;
  place-items: center;
  padding: 10px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(246, 234, 255, 0.9), rgba(231, 241, 255, 0.86));
  border: 1px solid rgba(211, 195, 240, 0.82);
}

.inventory-hero-image {
  width: min(100%, 220px);
  height: auto;
  object-fit: contain;
}

.inventory-profile-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.inventory-profile-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 245, 255, 0.95), rgba(243, 238, 255, 0.92));
  border: 1px solid rgba(214, 198, 240, 0.9);
  box-shadow: 0 12px 26px rgba(186, 165, 219, 0.16);
  color: #7d718f;
}

.inventory-profile-pill span {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.inventory-profile-pill strong {
  color: #5f5572;
  font-size: 1.02rem;
}

.inventory-profile-pill.coins-pill {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f5e6ff, #ead7ff);
  border-color: rgba(179, 135, 241, 0.72);
  box-shadow: 0 16px 30px rgba(172, 127, 232, 0.22);
}

.inventory-profile-pill.coins-pill.celebrating {
  animation: inventoryCoinsPulse 1.2s ease;
  box-shadow: 0 18px 38px rgba(172, 127, 232, 0.3);
}

.inventory-sale-burst {
  position: absolute;
  inset: -30% -10%;
  pointer-events: none;
}

.inventory-sale-burst span {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(255, 239, 154, 0.58) 0%,
    rgba(255, 212, 82, 0.28) 40%,
    rgba(255, 212, 82, 0) 74%
  );
  animation: inventorySaleBurst 1.4s ease-out forwards;
}

.inventory-sale-burst span:nth-child(1) {
  top: -24px;
  left: -18px;
}

.inventory-sale-burst span:nth-child(2) {
  top: 2px;
  right: 6%;
  animation-delay: 0.08s;
}

.inventory-sale-burst span:nth-child(3) {
  bottom: -24px;
  left: 30%;
  animation-delay: 0.16s;
}

.inventory-sidebar {
  display: grid;
  width: 100%;
  min-height: 0;
}

.inventory-sidebar :deep(.panel-card) {
  padding: 26px 28px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 251, 255, 0.94), rgba(245, 242, 255, 0.92));
  border: 1px solid rgba(214, 198, 240, 0.88);
  box-shadow: 0 24px 52px rgba(176, 152, 212, 0.14);
}

.inventory-tab-row {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 0 0 1px rgba(216, 204, 231, 0.7);
}

.inventory-tab {
  border: 0;
  border-radius: 14px;
  padding: 11px 16px;
  background: transparent;
  color: #766b88;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.inventory-tab.selected {
  background: linear-gradient(135deg, #ffe2ef, #e5f2ff);
  color: #5d536f;
  box-shadow: 0 10px 22px rgba(212, 195, 229, 0.24);
}

.inventory-panel-content {
  margin-top: 18px;
  display: grid;
  gap: 14px;
  min-height: 0;
  height: min(100%, calc(100vh - 320px));
}

.inventory-panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.inventory-panel-heading h3 {
  margin: 0;
  color: #5f5572;
  font-size: 1.2rem;
  font-family: "Fredoka", "Nunito", sans-serif;
}

.inventory-card p {
  margin: 6px 0 0;
  color: #8a809a;
  font-size: 0.93rem;
}

.inventory-list {
  display: grid;
  gap: 10px;
}

.inventory-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 250, 255, 0.96), rgba(244, 241, 255, 0.92));
  border: 1px solid rgba(216, 201, 241, 0.82);
  box-shadow: 0 14px 28px rgba(193, 171, 223, 0.14);
}

.inventory-card strong {
  color: #62566f;
}

.inventory-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  padding: 7px 11px;
  border-radius: 999px;
  background: #fff4fb;
  color: #d16b98;
  font-weight: 700;
  font-size: 0.86rem;
}

.inventory-pill.soft-blue {
  background: #e8f4ff;
  color: #4d7aa2;
}

.inventory-pill.soft-gold {
  background: #fff3d9;
  color: #a56b16;
}

.fish-list {
  max-height: 100%;
  overflow: auto;
  padding-right: 4px;
}

.inventory-list {
  min-height: 0;
}

.fish-card {
  align-items: flex-start;
}

.fish-card-copy {
  min-width: 0;
  flex: 1;
}

.fish-card-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.fish-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.compact-button {
  min-height: auto;
  padding: 10px 14px;
  border-radius: 16px;
}

.compact-action-button {
  min-width: 110px;
  min-height: auto;
  padding: 10px 14px;
  border-radius: 16px;
  box-shadow: 0 10px 22px rgba(226, 207, 232, 0.22);
}

@keyframes inventoryCoinsPulse {
  0% {
    transform: scale(1);
  }

  35% {
    transform: scale(1.08);
  }

  70% {
    transform: scale(0.98);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes inventorySaleBurst {
  0% {
    opacity: 0;
    transform: scale(0.35);
  }

  18% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

@media (max-width: 980px) {
  .inventory-hero-card {
    grid-template-columns: 1fr;
    padding: 22px;
  }

  .inventory-panel-content {
    height: auto;
  }

  .fish-list {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 720px) {
  .inventory-card,
  .inventory-panel-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .fish-card-actions {
    justify-content: stretch;
  }
}
</style>
