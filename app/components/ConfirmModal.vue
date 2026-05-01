<template>
  <Teleport to="body">
    <div v-if="state.visible" class="confirm-overlay" @click.self="handleCancel">
      <div class="confirm-card">
        <p class="confirm-message">{{ state.message }}</p>
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
</script>
