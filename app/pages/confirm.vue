<template>
  <div class="confirm-page">
    <p class="confirm-label">Connexion en cours…</p>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()

// Redirect once the PKCE exchange completes and user is set
watch(user, () => router.replace('/'), { once: true })
</script>

<style scoped>
.confirm-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-label {
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--text-faint);
  letter-spacing: 0.06em;
}
</style>
