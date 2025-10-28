<script setup lang="ts">
import { ref } from "vue";
import { useScheduleStore } from "@/stores/schedule";

const emit = defineEmits(["close"]);
const store = useScheduleStore();
const visibleMap = ref({});

store.tasks.forEach(t => (visibleMap.value[t.id] = true));

function toggleVisibility(id) {
  visibleMap.value[id] = !visibleMap.value[id];
}

function closeSidebar() {
  emit("close");
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <button class="close-btn" @click="closeSidebar">→</button>
    </div>
    <ul class="event-list">
      <li
        v-for="t in store.tasks"
        :key="t.id"
        class="event-item"
        :class="{ hidden: !visibleMap[t.id] }"
      >
        <button @click="toggleVisibility(t.id)" class="icon-btn">
          <img
            :src="visibleMap[t.id] ? '/icons/eye-open.svg' : '/icons/eye-closed.svg'"
            alt="toggle"
          />
        </button>
        <span class="title">{{ t.title }}</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 260px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  padding: 16px;
  z-index: 100;
}

.sidebar-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.event-item.hidden {
  opacity: 0.4;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
}
.title {
  font-size: 14px;
  font-weight: 500;
}
</style>
