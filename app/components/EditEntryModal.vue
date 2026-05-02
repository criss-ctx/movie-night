<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="state.visible"
        class="edit-overlay"
        @click.self="handleCancel"
      >
        <div
          class="edit-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div class="edit-header">
            <h2 id="edit-modal-title" class="edit-title">Modifier</h2>
            <button class="edit-close" aria-label="Fermer" @click="handleCancel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="edit-body">
            <EditEntryForm
              v-if="state.entry"
              ref="formRef"
              :entry="state.entry"
              :profiles="state.profiles"
            />
          </div>

          <div class="edit-footer">
            <button class="edit-btn edit-btn--cancel" @click="handleCancel">Annuler</button>
            <button class="edit-btn edit-btn--save" @click="handleSave">Enregistrer</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { EditModalState, EditChanges } from '~/types'

const state = useState<EditModalState>('editModal', () => ({
  visible: false,
  entry: null,
  profiles: [],
  resolve: null
}))

const formRef = ref<{ getChanges: () => EditChanges } | null>(null)

function handleSave() {
  const changes = formRef.value?.getChanges()
  state.value.visible = false
  state.value.resolve?.(changes ?? null)
}

function handleCancel() {
  state.value.visible = false
  state.value.resolve?.(null)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.value.visible) handleCancel()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.edit-overlay {
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

.edit-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--r-md);
  overflow: visible;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}

.edit-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  letter-spacing: 0.04em;
}

.edit-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text-faint);
  cursor: pointer;
  transition: color 150ms, border-color 150ms;
}

@media (hover: hover) {
  .edit-close:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }
}

.edit-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.edit-footer {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px;
}

.edit-btn {
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

.edit-btn--cancel {
  background: none;
  border: 1px solid var(--border-mid);
  color: var(--text-secondary);
}

.edit-btn--save {
  background: none;
  border: 1px solid var(--accent);
  color: var(--accent);
}

@media (hover: hover) {
  .edit-btn--cancel:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }
  .edit-btn--save:hover {
    background: var(--accent);
    color: var(--bg);
  }
}

/* ── Transition ──────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active .edit-card,
.modal-leave-active .edit-card {
  transition: transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1), opacity 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .edit-card {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}

.modal-leave-to .edit-card {
  transform: scale(0.97) translateY(4px);
  opacity: 0;
}
</style>
