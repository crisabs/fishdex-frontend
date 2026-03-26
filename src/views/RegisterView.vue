<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import PanelCard from "../components/PanelCard.vue";
import JsonViewer from "../components/JsonViewer.vue";
import fishingIllustration from "../components/fishing_calm.svg";
import { authService } from "../services/authService";
import { fishersService } from "../services/fishersService";
import { fisherStore } from "../stores/fisher";

const router = useRouter();

const registerForm = reactive({
  email: "",
  password: "",
});

const registerResponse = ref(null);
const authError = ref("");
const busy = ref(false);

async function submitRegister() {
  authError.value = "";
  busy.value = true;

  try {
    registerResponse.value = await authService.register({ ...registerForm });
    await authService.login({
      username: registerForm.email,
      password: registerForm.password,
    });
    fisherStore.setProfile(await fishersService.getMe());
    router.push("/");
  } catch (error) {
    authError.value = error.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="home-shell">
    <div class="home-scene subpage-scene auth-scene">
      <header class="subpage-header">
        <button class="soft-button" type="button" @click="$router.push('/')">
          Back Home
        </button>
      </header>

      <section class="auth-layout">
        <div class="auth-hero-card">
          <div class="hero-copy-block auth-copy-block auth-copy">
            <p class="mini-badge">Register</p>
            <h1>Create your fisher and jump in</h1>
            <p>
              After the account is created, the app signs in automatically and
              sends you straight back home.
            </p>
          </div>
          <div class="auth-hero-art">
            <img
              class="auth-hero-image"
              :src="fishingIllustration"
              alt="Fishing illustration"
            />
          </div>
        </div>

        <PanelCard class="auth-panel-card kawaii-auth-card">
          <form class="form-grid" @submit.prevent="submitRegister">
            <label>
              <span>Email</span>
              <input v-model="registerForm.email" type="email" required />
            </label>
            <label>
              <span>Password</span>
              <input v-model="registerForm.password" type="password" required />
            </label>
            <button class="primary-button" :disabled="busy">
              {{ busy ? "Creating..." : "Create account" }}
            </button>
          </form>

          <div v-if="authError" class="alert error">{{ authError }}</div>
          <JsonViewer :value="registerResponse" />
        </PanelCard>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-scene {
  min-height: calc(100vh - 44px);
  overflow: hidden;
}

.auth-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  gap: 22px;
  align-items: stretch;
  min-height: 0;
}

.auth-hero-card {
  display: grid;
  grid-template-columns: 1fr;
  align-content: center;
  gap: 20px;
  padding: 28px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(241, 225, 255, 0.9), transparent 28%),
    linear-gradient(180deg, rgba(255, 250, 255, 0.95), rgba(244, 241, 255, 0.92));
  border: 1px solid rgba(216, 199, 242, 0.88);
  box-shadow: 0 24px 60px rgba(176, 152, 212, 0.18);
}

.auth-copy {
  text-align: left;
  max-width: 100%;
}

.auth-copy h1 {
  margin: 6px 0 0;
  font-size: clamp(2.4rem, 4vw, 3.5rem);
}

.auth-copy p:last-child {
  margin-top: 14px;
  color: #786c8f;
}

.auth-hero-art {
  display: grid;
  place-items: center;
  padding: 12px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(246, 234, 255, 0.9), rgba(231, 241, 255, 0.86));
  border: 1px solid rgba(211, 195, 240, 0.82);
}

.auth-hero-image {
  width: min(100%, 360px);
  height: auto;
  object-fit: contain;
}

.kawaii-auth-card {
  align-self: center;
  padding: 30px 32px;
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 251, 255, 0.94), rgba(245, 242, 255, 0.92));
  border: 1px solid rgba(214, 198, 240, 0.88);
  box-shadow: 0 24px 52px rgba(176, 152, 212, 0.14);
}

.kawaii-auth-card :deep(label span) {
  color: #7a6f8f;
}

@media (max-width: 980px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }
}
</style>
