<template>
  <div class="stone-filter">
    <button class="pill" :class="{ active: isAll }" @click="toggleAll">전체</button>
    <div class="scroll">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="pill"
        :class="{ active: modelValue.includes(opt.value) }"
        @click="toggle(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
    <button class="pill ghost" @click="clear" aria-label="필터 초기화">초기화</button>
  </div>
</template>

<script>
export default {
  name: 'StoneFilter',
  props: {
    options: { type: Array, default: () => [] },
    modelValue: { type: Array, default: () => [] }
  },
  computed: {
    isAll() {
      return !this.modelValue || this.modelValue.length === 0;
    }
  },
  methods: {
    toggleAll() {
      this.$emit('update:modelValue', []);
    },
    toggle(v) {
      const set = new Set(this.modelValue || []);
      if (set.has(v)) set.delete(v); else set.add(v);
      this.$emit('update:modelValue', Array.from(set));
    },
    clear() {
      this.$emit('update:modelValue', []);
    }
  }
};
</script>

<style scoped>
.stone-filter { display: flex; align-items: center; gap: 6px; max-width: 520px; }
.scroll { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; }
.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  white-space: nowrap;
  cursor: pointer;
}
.pill.active { background: #111827; color: #fff; border-color: #111827; }
.pill.ghost { background: transparent; border-style: dashed; }
</style>


