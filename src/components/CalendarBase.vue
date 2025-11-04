<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from "vue";

const props = defineProps({
  events: { type: Array, default: () => [] },
  viewType: { type: String, default: "dayGridMonth" },
  initialDate: { type: [String, Date], default: undefined },
});

const emit = defineEmits(["event-click"]);

const calEl = ref(null);
let calendar = null;

onMounted(() => {
  const FC = window.FullCalendar;
  if (!FC || !FC.Calendar) {
    console.error("[CalendarBase] FullCalendar global not found. (CDN 로드 확인)");
    return;
  }

  calendar = new FC.Calendar(calEl.value, {
    headerToolbar: false,
    initialView: props.viewType || "dayGridMonth",
    ...(props.initialDate ? { initialDate: props.initialDate } : {}),
    events: props.events ?? [],
    displayEventTime: false,

    eventClick: (info) => {
      const eventData = info.event.extendedProps || {};
      console.log("[CalendarBase] 클릭된 이벤트:", info.event);

      // 상위 컴포넌트로 데이터 전달
      emit("event-click", {
        ...eventData,
        id: info.event.id,
        title: info.event.title,
      });
    },
  });

  calendar.render();
});

// props 변경 감시
watch(
  () => props.events,
  (newEvents) => {
    if (!calendar) return;
    calendar.removeAllEvents();
    if (Array.isArray(newEvents) && newEvents.length) {
      calendar.addEventSource(newEvents);
    }
  },
  { deep: true }
);

watch(
  () => props.viewType,
  (v) => {
    if (!calendar || !v) return;
    try {
      calendar.changeView(v);
    } catch (e) {
      console.warn("[CalendarBase] changeView 실패:", v, e);
    }
  }
);

watch(
  () => props.initialDate,
  (d) => {
    if (!calendar || !d) return;
    try {
      calendar.gotoDate(d);
    } catch (e) {
      console.warn("[CalendarBase] gotoDate 실패:", d, e);
    }
  }
);

onBeforeUnmount(() => {
  if (calendar) {
    calendar.destroy();
    calendar = null;
  }
});
</script>

<template>
  <div ref="calEl" id="calendar"></div>
</template>

<style scoped>
#calendar {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 12px;
}
</style>
