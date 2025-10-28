<script setup lang="ts">
import { onMounted } from "vue";

const props = defineProps({
  events: { type: Array, required: true },
});

onMounted(() => {
  const calendarEl = document.getElementById("calendar");

  // ✅ FullCalendar는 전역 객체로 이미 로드됨 (import 필요 없음)
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: props.events,
    headerToolbar: {
      start: "prev,next today",
      center: "title",
      end: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    height: "auto",
  });

  calendar.render();
});
</script>

<template>
  <div id="calendar"></div>
</template>

<style scoped>
:deep(.fc) {
  font-family: "Pretendard", sans-serif;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 12px;
}
</style>
