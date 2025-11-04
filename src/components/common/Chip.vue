<template>
  <span class="chip" :class="{ 'chip-enabled': enabled, 'chip-disabled': !enabled }">
    {{ enabled ? '가능' : '불가' }}
  </span>
</template>

<script>
export default {
  name: 'Chip',
  props: {
    enabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.chip:hover {
  opacity: 0.9;
}

.chip-enabled {
  background-color: var(--success-bg);
  color: var(--success-text);
}

.chip-disabled {
  background-color: var(--chip-bg);
  color: var(--chip-text);
}
</style>
