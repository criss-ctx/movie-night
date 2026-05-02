<template>
  <div class="app">
    <header class="app-header">
      <button
        class="theme-toggle"
        :aria-label="theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'"
        @click="toggle"
      >
        <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>

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
    <p class="app-footer">
      <NuxtLink to="/about" class="app-footer-link">À propos</NuxtLink>
    </p>
    <ConfirmModal />
    <LoginModal />
    <EditEntryModal />
  </div>
</template>

<script setup lang="ts">
const { user, signOut } = useAuth()
const { theme, toggle, init } = useTheme()

onMounted(init)
</script>

<style scoped>
.tab-bar {
  flex-shrink: 0;
  display: flex;
  border-top: 1px solid var(--border);
  background: var(--bg);
  padding-bottom: max(env(safe-area-inset-bottom), 8px);
}

.app-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px max(env(safe-area-inset-bottom), 6px);
  margin: 0;
  border-top: 1px solid var(--border);
  background: var(--bg);
}

.app-footer-link {
  font-size: 11px;
  color: var(--text-faint);
  text-decoration: none;
  transition: color 150ms;
}

@media (hover: hover) {
  .app-footer-link:hover { color: var(--text-secondary); }
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 0 12px;
  background: none;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  transition: color 150ms;
  -webkit-tap-highlight-color: transparent;
  text-decoration: none;
}

.tab-btn.active {
  color: var(--accent);
}

@media (hover: hover) {
  .tab-btn:not(.active):hover {
    color: var(--text-secondary);
  }
}

.tab-icon {
  width: 20px;
  height: 20px;
}

.tab-label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.theme-toggle {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 150ms;
}

@media (hover: hover) {
  .theme-toggle:hover {
    color: var(--text-secondary);
  }
}

.logout-btn {
  display: none;
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-faint);
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
  transition: color 150ms;
}

.logout-btn.visible {
  display: block;
}

@media (hover: hover) {
  .logout-btn:hover {
    color: var(--text-secondary);
  }
}
</style>
