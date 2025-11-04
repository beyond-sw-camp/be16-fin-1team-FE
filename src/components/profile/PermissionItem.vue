<template>
  <div class="permission-item">
    <div class="permission-item-content">
      <div class="permission-item-label">{{ label }}</div>
      <div class="permission-item-subtext">{{ subtext }}</div>
    </div>
    <Chip :enabled="enabled" />
  </div>
</template>

<script>
import Chip from '../common/Chip.vue'

export default {
  name: 'PermissionItem',
  components: {
    Chip
  },
  props: {
    label: {
      type: String,
      required: true
    },
    subtext: {
      type: String,
      default: ''
    },
    enabled: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--gap-m);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  gap: var(--gap-m);
}

.permission-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xxs);
}

.permission-item-label {
  font-size: 18px;
  color: var(--text);
  font-weight: 500;
}

.permission-item-subtext {
  font-size: 18px;
  color: var(--text-weak);
}
</style>
