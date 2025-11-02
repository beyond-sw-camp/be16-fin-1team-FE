<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import CalendarBase from "@/components/CalendarBase.vue";
import CalendarToolbar from "@/components/CalendarToolbar.vue"; // 선택 사항

// ✅ 예시: 임시 이벤트 데이터
const events = ref([
  { title: "팀 회의", start: "2025-11-03" },
  { title: "코드 리뷰", start: "2025-11-05" },
  { title: "Orbit 배포", start: "2025-11-10" },
]);

// ✅ 보기 타입 변경 가능 (month/week/day)
const viewType = ref("dayGridMonth");

// ✅ 동적으로 변경 가능하도록 watch 처리
const safeEvents = computed(() => (Array.isArray(events.value) ? events.value : []));

onMounted(() => {
  console.log("📅 CalendarView mounted: ", safeEvents.value);
});
</script>

<template>
  <div class="calendar-container">
    <!-- 툴바 -->
    <CalendarToolbar />

    <!-- 캘린더 -->
    <CalendarBase :events="safeEvents" :viewType="viewType" />
  </div>
</template>

<style scoped>
.calendar-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  background-color: #fafafa;
  border-radius: 20px;
}
</style>
