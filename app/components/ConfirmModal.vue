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
