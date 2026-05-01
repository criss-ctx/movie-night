<template>
  <Teleport to="body">
    <div v-if="showLoginModal" class="login-overlay" @click.self="dismissLogin">
      <div class="login-card">
        <button class="login-close" aria-label="Fermer" @click="dismissLogin">&times;</button>
        <h1 class="login-title">Movie Night</h1>
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
</script>
