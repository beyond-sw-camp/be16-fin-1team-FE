<script setup>
import { onMounted } from "vue";

onMounted(() => {
  const el = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(el, {
    initialView: "dayGridMonth",
    events: [
      { title: "ERD 설계", start: "2025-09-10", end: "2025-09-13", color: "#6A7FDB" },
      { title: "JWT Filter 구현", start: "2025-09-22", end: "2025-09-29", color: "#FFD93D" },
    ],
  });

  calendar.render();
});
</script>

<template>
  <div id="calendar" style="padding: 20px;"></div>
</template>

<style scoped>
#calendar {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 12px;
}
</style>
