<!-- src/views/schedule/ProjectCalendar.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import CalendarView from "@/components/schedule/CalendarView.vue";

const router = useRouter();

// 임시 이벤트
const events = ref([
  { title: "JWT Filter 구현", start: "2025-09-10", end: "2025-09-13", color: "#FFD93D" },
  { title: "ERD 설계",       start: "2025-09-22", end: "2025-09-29", color: "#6A7FDB" },
  { title: "출시 테스트",     start: "2025-09-19", end: "2025-09-21", color: "#F2C94C" },
]);

const currentView = ref("dayGridMonth");
const showSidebar = ref(false);
const currentDate = ref(new Date(2025, 8)); // 2025-09

function goScheduleHome() { router.push({ path: "/schedule" }); }
function goSharedCalendar() { router.push({ path: "/schedule/shared" }); } // 추후 실제 라우트

function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
}

function changeMonth(delta: number) {
  const date = new Date(currentDate.value);
  date.setMonth(date.getMonth() + delta);
  currentDate.value = date;
}

function formatYearMonth(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

const sidebarItems = ref([
  { name: "기획", color: "#EB5757", visible: true },
  { name: "담당자 테스트1", color: "#9B51E0", visible: true },
  { name: "작업1", color: "#56CCF2", visible: true },
  { name: "담당자 테스트2", color: "#BB6BD9", visible: true },
  { name: "ERD", color: "#2F80ED", visible: false },
  { name: "출시 테스트", color: "#F2C94C", visible: true },
]);

function toggleVisibility(item: any) { item.visible = !item.visible; }
</script>

<template>
  <div class="project-calendar-wrap">
    <!-- 탭 -->
    <!-- <div class="tabs">
      <button class="tab" @click="goScheduleHome">일정 홈</button>
      <button class="tab active">프로젝트 캘린더</button>
      <button class="tab" @click="goSharedCalendar">공유 캘린더</button>
    </div> -->

    <!-- 툴바 -->
    <div class="toolbar">
      <div class="left">
        <button class="arrow" @click="changeMonth(-1)">◀</button>
        <strong>{{ formatYearMonth(currentDate) }}</strong>
        <button class="arrow" @click="changeMonth(1)">▶</button>
      </div>

      <div class="right">
        <button class="icon-btn" @click="toggleSidebar">👁️</button>
        <select v-model="currentView" class="view-select">
          <option value="timeGridDay">일</option>
          <option value="timeGridWeek">주</option>
          <option value="dayGridMonth">월</option>
        </select>
      </div>
    </div>

    <!-- 캘린더 -->
    <div class="calendar-container">
      <CalendarView :events="events" :viewType="currentView" />
    </div>

    <!-- 사이드바 -->
    <transition name="slide">
      <aside v-if="showSidebar" class="sidebar">
        <div class="sidebar-header">
          <button class="close-btn" @click="toggleSidebar">←</button>
        </div>
        <div class="sidebar-body">
          <div v-for="item in sidebarItems" :key="item.name" class="sidebar-item">
            <button class="eye-btn" :class="{ off: !item.visible }" @click="toggleVisibility(item)">
              {{ item.visible ? "👁️" : "🚫" }}
            </button>
            <span class="dot" :style="{ background: item.color }"></span>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.project-calendar-wrap { padding: 18px 20px; position: relative; }
.tabs { display: flex; gap: 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 18px; }
.tab { border: none; background: none; padding: 8px 14px; border-bottom: 2px solid transparent; color: #888; font-weight: 600; cursor: pointer; }
.tab.active { color: #111; border-color: #ffcc00; }

.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.left { display: flex; align-items: center; gap: 10px; }
.arrow { border: none; background: #fff; border-radius: 6px; width: 28px; height: 28px; box-shadow: 0 1px 5px rgba(0,0,0,.08); cursor: pointer; }

.right { display: flex; align-items: center; gap: 8px; }
.icon-btn { border: none; background: #fff; border-radius: 8px; width: 32px; height: 32px; box-shadow: 0 2px 6px rgba(0,0,0,.1); cursor: pointer; }
.view-select { border: 1px solid #ddd; border-radius: 8px; padding: 6px 10px; background: #fff; cursor: pointer; }

.calendar-container { background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.05); padding: 12px; }

.sidebar { position: absolute; top: 70px; right: 0; width: 280px; height: 100%; background: #fff; box-shadow: -4px 0 12px rgba(0,0,0,.08); border-radius: 12px 0 0 12px; padding: 16px; }
.sidebar-header { display: flex; justify-content: flex-start; margin-bottom: 10px; }
.close-btn { border: none; background: #fff; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
.sidebar-body { display: flex; flex-direction: column; gap: 12px; }
.sidebar-item { display: flex; align-items: center; gap: 10px; }
.eye-btn { background: none; border: none; cursor: pointer; font-size: 16px; }
.eye-btn.off { opacity: .3; }
.dot { width: 12px; height: 12px; border-radius: 50%; }

.slide-enter-active, .slide-leave-active { transition: all .3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(20px); }
</style>
