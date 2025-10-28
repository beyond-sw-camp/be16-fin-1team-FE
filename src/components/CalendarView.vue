<script setup lang="ts">
import { computed } from "vue";
import FullCalendar from "@fullcalendar/vue3";

// ✅ v5.11.5에서는 main.min.css 사용
import "@fullcalendar/core/main.min.css";
import "@fullcalendar/daygrid/main.min.css";
import "@fullcalendar/timegrid/main.min.css";

import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const props = defineProps({
  events: { type: Array, required: true },
  viewType: { type: String, default: "dayGridMonth" }
});

const safeViewType = computed(() => {
  const v = props.viewType?.trim?.();
  if (!v) return "dayGridMonth";
  const valid = ["dayGridMonth", "timeGridWeek", "timeGridDay"];
  return valid.includes(v) ? v : "dayGridMonth";
});
</script>

<template>
  <FullCalendar
    :plugins="[dayGridPlugin, timeGridPlugin, interactionPlugin]"
    :initialView="safeViewType"
    :events="props.events"
    :headerToolbar="{
      start: 'prev,next today',
      center: 'title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay'
    }"
    height="auto"
  />
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
