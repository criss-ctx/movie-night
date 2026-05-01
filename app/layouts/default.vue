<template>
  <div class="app">
    <header class="app-header">
      <span class="app-title">Movie Night</span>
      <button
        v-if="user"
        class="logout-btn visible"
        aria-label="Se déconnecter"
        @click="signOut"
      >&#8617;</button>
    </header>
    <main class="app-content">
      <slot />
    </main>
    <nav class="tab-bar">
      <NuxtLink to="/" class="tab-btn" exact-active-class="active">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="4" y1="20" x2="21" y2="3"/>
          <polyline points="21 16 21 21 16 21"/>
          <line x1="15" y1="15" x2="21" y2="21"/>
        </svg>
        <span class="tab-label">Tirage</span>
      </NuxtLink>
      <NuxtLink to="/journal" class="tab-btn" exact-active-class="active">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <line x1="8" y1="6" x2="20" y2="6"/>
          <line x1="8" y1="12" x2="20" y2="12"/>
          <line x1="8" y1="18" x2="20" y2="18"/>
          <circle cx="3.5" cy="6" r="0.5" fill="currentColor"/>
          <circle cx="3.5" cy="12" r="0.5" fill="currentColor"/>
          <circle cx="3.5" cy="18" r="0.5" fill="currentColor"/>
        </svg>
        <span class="tab-label">Journal</span>
      </NuxtLink>
      <NuxtLink to="/add" class="tab-btn" exact-active-class="active">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <span class="tab-label">Ajouter</span>
      </NuxtLink>
    </nav>
    <ConfirmModal />
    <LoginModal />
  </div>
</template>

<script setup lang="ts">
const { user, signOut } = useAuth()
</script>
