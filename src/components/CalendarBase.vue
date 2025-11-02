<script setup>
import { onMounted, defineEmits, watch } from "vue";

const props = defineProps({
  events: Array,
});
const emit = defineEmits(["openStoneModal"]);

onMounted(() => {
  const el = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(el, {
    initialView: "dayGridMonth",
    events: props.events,
    eventClick: (info) => {
      emit("openStoneModal", {
        id: info.event.id,
        type: info.event.extendedProps.type,
      });
    },
  });

  calendar.render();

  // Vue props 변경 시 다시 렌더링
  watch(
    () => props.events,
    (newEvents) => {
      calendar.removeAllEvents();
      calendar.addEventSource(newEvents);
    },
    { deep: true }
  );
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
