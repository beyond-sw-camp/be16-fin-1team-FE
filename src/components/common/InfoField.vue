<template>
  <div class="info-field">
    <div class="info-field-left" v-if="$slots['left-icon']">
      <slot name="left-icon"></slot>
    </div>
    <div class="info-field-content">
      <div class="info-field-label">{{ label }}</div>
      <input 
        v-if="editable" 
        v-model="localValue"
        class="info-field-input"
        @blur="handleBlur"
      />
      <div v-else class="info-field-value" :title="value">{{ value }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InfoField',
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: String,
      default: '-'
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:value', 'change'],
  data() {
    return {
      localValue: this.value
    }
  },
  watch: {
    value(newVal) {
      this.localValue = newVal;
    }
  },
  methods: {
    handleBlur() {
      this.$emit('update:value', this.localValue);
      this.$emit('change', this.localValue);
    }
  }
}
</script>

<style scoped>
.info-field {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  gap: var(--gap-s);
}

.info-field-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.info-field-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-m);
  min-width: 0;
}

.info-field-label {
  font-size: 12px;
  color: var(--text-weak);
  flex-shrink: 0;
}

.info-field-value {
  font-size: 14px;
  color: var(--text);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.info-field-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 14px;
  text-align: right;
  padding: 0;
  outline: none;
  font-family: inherit;
}

.info-field-input::placeholder {
  color: var(--text-weak);
}
</style>
