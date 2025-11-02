<script setup>
const emits = defineEmits(["changeView"]);

const views = [
  { key: "dayGridMonth", label: "월" },
  { key: "timeGridWeek", label: "주" },
  { key: "timeGridDay", label: "일" },
];
</script>

<template>
  <div class="toolbar">
    <div class="title">📆 Orbit 일정 관리</div>
    <div class="buttons">
      <button
        v-for="v in views"
        :key="v.key"
        class="toolbar-btn"
        @click="$emit('changeView', v.key)"
      >
        {{ v.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 10px 16px;
  margin-bottom: 16px;
}
.toolbar-btn {
  background: #ffd64f;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.toolbar-btn:hover {
  background: #ffcb28;
}
</style>
