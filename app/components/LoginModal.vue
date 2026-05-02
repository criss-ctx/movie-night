<template>
  <Teleport to="body">
    <div v-if="showLoginModal" class="login-overlay" @click.self="dismissLogin">
      <div
        class="login-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button class="login-close" aria-label="Fermer" @click="dismissLogin">&times;</button>
        <h1 id="login-modal-title" class="login-title">Movie Night</h1>
        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              placeholder="ton@email.com"
              required
              autocomplete="email"
            />
          </div>
          <div class="form-group">
            <label for="login-password">Mot de passe</label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>
          <p class="login-error">{{ errorMessage }}</p>
          <button type="submit" class="form-submit">Se connecter</button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { showLoginModal, signIn, dismissLogin } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  const { error } = await signIn(email.value, password.value)
  if (error) {
    errorMessage.value = 'Email ou mot de passe incorrect.'
  } else {
    email.value = ''
    password.value = ''
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showLoginModal.value) dismissLogin()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: rgba(25, 23, 31, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  padding: 36px 32px 32px;
}

.login-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--text-faint);
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 150ms;
}

@media (hover: hover) {
  .login-close:hover {
    color: var(--text);
  }
}

.login-title {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0 0 40px;
  letter-spacing: 0.05em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-error {
  color: var(--danger);
  font-size: 13px;
  margin: -8px 0 0;
  min-height: 16px;
}
</style>
