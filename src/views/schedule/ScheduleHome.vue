<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import MilestoneCard from "@/components/schedule/MilestoneCard.vue";
import TaskList from "@/components/schedule/TaskList.vue";
import PersonalTodo from "@/components/schedule/PersonalTodo.vue";
import { useScheduleStore } from "@/stores/schedule";

const store = useScheduleStore();

const workspaceId = localStorage.getItem("workspaceId") || "";
store.setWorkspace(workspaceId);

onMounted(() => {
  store.loadAll();
});

const today = computed(() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
});

const activeMilestoneIdx = ref(0);
const activeMilestone = computed(
  () => store.milestones[activeMilestoneIdx.value]
);

function nextMs() {
  if (activeMilestoneIdx.value < store.milestones.length - 1)
    activeMilestoneIdx.value++;
}
function prevMs() {
  if (activeMilestoneIdx.value > 0) activeMilestoneIdx.value--;
}
</script>

<template>
  <div class="wrap">
    <div class="tabs">
      <button class="tab active">일정 홈</button>
      <button class="tab" @click="$router.push('/schedule/project')">프로젝트 캘린더</button>
      <button class="tab" @click="$router.push('/schedule/shared')">공유 캘린더</button>
    </div>

    <div class="today">
      <span>Today</span>
      <strong>{{ today }}</strong>
    </div>

    <!-- ✅ 2x2 카드 레이아웃 -->
    <div class="grid">
      <!-- 마일스톤 -->
      <div class="card milestone">
        <div class="nav">
          <button @click="prevMs">◀</button>
          <div class="spacer"></div>
          <button @click="nextMs">▶</button>
        </div>
        <MilestoneCard
          v-if="activeMilestone"
          :name="activeMilestone.name"
          :dday="activeMilestone.dday"
          :progress="activeMilestone.progress"
        />
        <div v-else class="empty">진행 중인 마일스톤이 없습니다.</div>
      </div>

      <!-- 개인 To-Do -->
      <div class="card todo">
        <PersonalTodo :items="store.todos" @toggle="store.toggleTodo" />
      </div>

      <!-- Task -->
      <div class="card task">
        <TaskList :items="store.tasks" @toggle="store.toggleTask" />
      </div>

      <!-- 추가 기능 -->
      <div class="card summary">
        <div class="empty">추가 기능 준비 중입니다.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 전체 레이아웃 */
.wrap {
  padding: 20px 32px;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

/* 상단 탭 */
.tabs {
  display: flex;
  gap: 14px;
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 12px;
  margin-bottom: 20px;
}
.tab {
  border: none;
  background: none;
  padding: 8px 14px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
}
.tab.active {
  color: #111;
  border-bottom: 2px solid #111;
}

/* 날짜 표시 */
.today {
  color: #666;
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 10px 0 24px;
}
.today strong {
  font-size: 18px;
  color: #000;
}

/* ✅ 2x2 카드 그리드 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 24px;
}

/* ✅ 카드 */
.card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 320px; /* 높이 자동 조절 */
  overflow: hidden;
  text-align: center;
}

/* 카드 내용이 없을 때 */
.empty {
  color: #888;
  font-weight: 500;
  font-size: 15px;
}

/* 네비게이션 버튼 */
.nav {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
}
.nav .spacer {
  flex: 1;
}
.nav button {
  border: none;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

/* ✅ 반응형 */
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
