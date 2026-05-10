<template>
  <div class="avatar" :style="{ background: avatarColors.bg, color: avatarColors.text }" :title="name">
    <span v-if="avatar" class="avatar-emoji">{{ avatar }}</span>
    <span v-else class="avatar-initials">{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string
  avatar?: string | null
}>()

const initials = computed(() =>
  props.name
    .trim()
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
)

function avatarColor(name: string): { bg: string; text: string } {
  const hash = [...name].reduce((acc, letter) => acc + letter.charCodeAt(0), 0)
  const hue = hash % 360
  return {
    bg:   `oklch(48% 0.14 ${hue})`,
    text: `oklch(92% 0.06 ${hue})`,
  }
}

const avatarColors = computed(() =>
  props.avatar
    ? { bg: 'transparent', text: 'inherit' }
    : avatarColor(props.name)
)
</script>

<style scoped>
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid var(--border-mid);
  overflow: hidden;
}

.avatar-emoji {
  font-size: 17px;
  line-height: 1;
  background: var(--surface);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-initials {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
}
</style>
