<script setup>
import { onMounted, onBeforeUnmount, defineEmits, defineProps, watch, ref } from "vue";

const props = defineProps({
  events: { type: Array, default: () => [] },
  viewType: { type: String, default: "dayGridMonth" },
  initialDate: { type: [String, Date], default: undefined },
});
const emit = defineEmits(["openStoneModal"]);

// 캘린더 DOM & 인스턴스
const calEl = ref(null);
let calendar = null;

onMounted(() => {
  // CDN 전역 객체 방어
  const FC = window.FullCalendar;
  if (!FC || !FC.Calendar) {
    console.error("[CalendarBase] FullCalendar global not found. (CDN 로드 확인)");
    return;
  }

  calendar = new FC.Calendar(calEl.value, {
    // 외부에서 넘긴 뷰/날짜 반영
    initialView: props.viewType || "dayGridMonth",
    ...(props.initialDate ? { initialDate: props.initialDate } : {}),

    // 이벤트 소스
    events: props.events ?? [],
    displayEventTime: false,

    // 클릭 → 모달 오픈 이벤트 전달
    eventClick: (info) => {
      emit("openStoneModal", {
        id: info.event.id,
        type: info.event.extendedProps?.type, // STONE / TASK 등
      });
    },
  });

  calendar.render();
});

// props.events 변경 시 반영
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

// props.viewType 변경 시 뷰 전환
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

// props.initialDate 변경 시 해당 날짜로 이동
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
  <!-- CDN global build는 자체 스타일을 포함하므로 별도 CSS import 불필요 -->
  <div ref="calEl" id="calendar" style="padding: 20px;"></div>
</template>

<style scoped>
#calendar {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 12px;
}
</style>
