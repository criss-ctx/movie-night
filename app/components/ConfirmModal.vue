<template>
  <Teleport to="body">
    <div
      v-if="state.visible"
      class="confirm-overlay"
      @click.self="handleCancel"
    >
      <div
        class="confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-msg"
      >
        <p id="confirm-msg" class="confirm-message">{{ state.message }}</p>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn--cancel" @click="handleCancel">Annuler</button>
          <button class="confirm-btn confirm-btn--danger" @click="handleConfirm">{{ state.label }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ConfirmState } from '~/types'

const state = useState<ConfirmState>('confirmModal', () => ({
  visible: false,
  message: '',
  label: 'Confirmer',
  resolve: null
}))

function handleConfirm() {
  state.value.visible = false
  state.value.resolve?.(true)
}

function handleCancel() {
  state.value.visible = false
  state.value.resolve?.(false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.value.visible) handleCancel()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(25, 23, 31, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}

.confirm-card {
  width: 100%;
  max-width: 320px;
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  padding: 28px 24px 20px;
}

.confirm-message {
  font-size: 15px;
  color: var(--text);
  text-align: center;
  line-height: 1.6;
  margin: 0 0 24px;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-btn {
  flex: 1;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 14px;
  min-height: 48px;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background 180ms, border-color 180ms, color 180ms;
}

.confirm-btn--cancel {
  background: none;
  border: 1px solid var(--border-mid);
  color: var(--text-secondary);
}

.confirm-btn--danger {
  background: none;
  border: 1px solid var(--danger);
  color: var(--danger);
}

@media (hover: hover) {
  .confirm-btn--cancel:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }
  .confirm-btn--danger:hover {
    background: var(--danger);
    color: var(--bg);
  }
}
</style>
