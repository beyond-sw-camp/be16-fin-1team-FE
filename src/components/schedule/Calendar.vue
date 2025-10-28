<script setup lang="ts">
import { defineProps, watch } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const props = defineProps({
  events: { type: Array, required: true },
  viewType: { type: String, default: "dayGridMonth" },
});
</script>

<template>
  <FullCalendar
    :plugins="[dayGridPlugin, timeGridPlugin, interactionPlugin]"
    :initialView="props.viewType"
    :events="props.events"
    :headerToolbar="false"
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
