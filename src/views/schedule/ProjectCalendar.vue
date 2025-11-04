<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import CalendarBase from "@/components/CalendarBase.vue";
import StoneDetailModal from "@/views/Project/StoneDetailModal.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const workspaceId = ref(
  route.query.workspaceId || 
  route.params.workspaceId || 
  localStorage.getItem("selectedWorkspaceId") || ""
);
const showModal = ref(false);
const selectedStoneId = ref(null);
const projectId = ref('');


console.log("🧭 workspaceId:", workspaceId.value);
console.log("🧭 userId:", localStorage.getItem("id"));

// ✅ 일정 배열
const events = ref([]);
const currentView = ref("dayGridMonth");
const showSidebar = ref(false);
const currentDate = ref(new Date());

function openStoneModal(eventData) {
  console.log("🖥️[ProjectCalendar] 클릭:", eventData);
  selectedStoneId.value = eventData.stoneId || eventData.id;
  // workspaceId.value = eventData.workspaceId;
  // projectId.value = eventData.projectId;
  showModal.value = true;
}

// // ✅ 모달 제어
// const showStoneModal = ref(false);
// // const selectedStoneId = ref<string | null>(null);

// ✅ 참여 스톤 & 태스크 불러오기
const fetchEvents = async () => {
  const id = localStorage.getItem("id");

  if (!workspaceId.value) {
    console.error("❌ workspaceId가 없습니다. 요청 중단.");
    return;
  }

  try {
    console.log("🔵 요청 URL:", `/workspace-service/workspace/${workspaceId.value}/my-stones`);

    const userId = localStorage.getItem("id");

    const [stoneRes, taskRes] = await Promise.all([
      axios.get(`/workspace-service/workspace/${workspaceId.value}/my-stones`, {
        headers: { "X-User-Id": userId },
      }),
      axios.get(`/workspace-service/workspace/${workspaceId.value}/my-tasks`, {
        headers: { "X-User-Id": userId },
      }),
    ]);

    const stoneEvents = (stoneRes.data.result || []).map((s) => ({
      id: s.stoneId,
      title: `[스톤] ${s.stoneName}`,
      start: s.startTime,
      end: s.endTime,
      project: s.projectName,
      type: "STONE",
      color: "#A3B8FF",
      stoneId: s.stoneId,
    }));

    const taskEvents = (taskRes.data.result || []).map((t) => ({
      id: t.taskId,
      title: `[태스크] ${t.taskName}`,
      start: t.startTime,
      end: t.endTime,
      project: t.projectName,
      stone: t.stoneName,
      type: "TASK",
      color: "#FFD93D",
      stoneId: t.stoneId,
    }));

    events.value = [...stoneEvents, ...taskEvents];
  } catch (e) {
    console.error("❌ 프로젝트 캘린더 이벤트 불러오기 실패:", e);
  }
};

onMounted(fetchEvents);

// ✅ 월 이동
function changeMonth(delta) {
  const date = new Date(currentDate.value);
  date.setMonth(date.getMonth() + delta);
  currentDate.value = date;
}
function formatYearMonth(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
}

// ✅ 사이드바
const sidebarItems = ref([
  { name: "스톤 일정", color: "#A3B8FF", visible: true },
  { name: "태스크 일정", color: "#FFD93D", visible: true },
]);
function toggleVisibility(item) {
  item.visible = !item.visible;
}

</script>

<template>
  <div class="project-calendar-wrap">
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

    <!-- 📅 캘린더 -->
    <div class="calendar-container">
      <CalendarBase
        :events="events"
        @event-click="openStoneModal"
      />

      <!-- ✅ 스톤 상세 모달 -->
      <StoneDetailModal
        :is-visible="showModal"
        :key="selectedStoneId"
        :stone-id="selectedStoneId"
        :workspace-id="workspaceId"
        :project-id="projectId"
        @close="showModal = false"
      />
    </div>

    <!-- 👁️ 사이드바 -->
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
.calendar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>