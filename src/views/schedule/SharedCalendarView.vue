<!-- src/views/schedule/SharedCalendarView.vue -->
<template>
  <div class="shared-calendar">
    <h2 class="title">공유 캘린더 테스트</h2>
    <CalendarView :events="events" viewType="dayGridMonth" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import CalendarView from "./CalendarView.vue";

const events = ref([]);

onMounted(() => {
  // 예시 일정
  events.value = [
    { title: "테스트 일정 A", start: "2025-10-30" },
    { title: "테스트 일정 B", start: "2025-11-02" },
  ];
});
</script>

<style scoped>
.shared-calendar {
  padding: 16px;
}
.title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
