<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import MilestoneCard from "@/components/schedule/MilestoneCard.vue";
import Todo from "@/components/schedule/TodoCard.vue";
import { useScheduleStore } from "@/stores/schedule";
import HomeTaskCard from "../../components/schedule/HomeTaskCard.vue";
import ScheduleDetailModal from "@/components/modal/ScheduleDetailModal.vue";

const store = useScheduleStore();
const workspaceId = localStorage.getItem("workspaceId") || "";
store.setWorkspace(workspaceId);

// 모달 상태
const showScheduleModal = ref(false);
const selectedScheduleId = ref<string | null>(null);

onMounted(async () => {
  await store.loadMilestones();
  await store.loadMyTasks();
  await store.loadPersonalSchedules();
});

// 일정 클릭 시
function openScheduleDetail(id: string) {
  selectedScheduleId.value = id;
  showScheduleModal.value = true;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
}

const today = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
});

const activeIdx = ref(0);
const activeMilestone = computed(() => {
  if (store.milestones.length === 0) return null;
  return store.milestones[activeIdx.value] || store.milestones[0];
});

// 보이는 마일스톤 계산 (현재 인덱스 기준 앞뒤 1개씩)
const visibleMilestones = computed(() => {
  if (store.milestones.length === 0) {
    return [];
  }
  if (store.milestones.length === 1) {
    return [store.milestones[0]];
  }
  
  const result = [];
  const current = activeIdx.value;
  const total = store.milestones.length;
  
  // 이전 마일스톤
  if (current > 0) {
    result.push(store.milestones[current - 1]);
  } else {
    // 마지막 마일스톤 (순환)
    result.push(store.milestones[total - 1]);
  }
  
  // 현재 마일스톤
  result.push(store.milestones[current]);
  
  // 다음 마일스톤
  if (current < total - 1) {
    result.push(store.milestones[current + 1]);
  } else {
    // 첫 번째 마일스톤 (순환)
    result.push(store.milestones[0]);
  }
  
  return result;
});

// 현재 활성 마일스톤의 상대 인덱스 (항상 중간)
const activeRelativeIndex = computed(() => {
  if (store.milestones.length <= 1) return 0;
  // 현재 마일스톤이 항상 중간에 위치
  return Math.floor(visibleMilestones.value.length / 2);
});

function nextMs() {
  if (store.milestones.length <= 1) return;
  
  // 애니메이션을 위한 트랜지션 추가
  if (activeIdx.value < store.milestones.length - 1) {
    activeIdx.value++;
  } else {
    activeIdx.value = 0; // 순환
  }
}

function prevMs() {
  if (store.milestones.length <= 1) return;
  
  // 애니메이션을 위한 트랜지션 추가
  if (activeIdx.value > 0) {
    activeIdx.value--;
  } else {
    activeIdx.value = store.milestones.length - 1; // 순환
  }
}
</script>

<template>
  <div class="wrap">
    <div class="today">
      <span>Today</span>
      <strong>{{ today }}</strong>
    </div>

    <!-- 2x2 카드 레이아웃 -->
    <div class="grid">
      <!-- 마일스톤 카드 -->
      <div class="card milestone">
        <div class="milestone-header">
          <span class="milestone-title-text">마일스톤</span>
        </div>

        <div class="milestone-container">
          <!-- 여러 개 마일스톤이 있을 때 겹쳐 보이도록 -->
          <template v-if="store.milestones.length > 0">
            <div 
              v-for="(milestone, index) in visibleMilestones" 
              :key="`${milestone.name}-${index}`"
              class="milestone-item"
              :class="{
                'milestone-active': index === activeRelativeIndex,
                'milestone-prev': index < activeRelativeIndex,
                'milestone-next': index > activeRelativeIndex
              }"
              :style="{ 
                zIndex: store.milestones.length - Math.abs(index - activeRelativeIndex),
                transitionDelay: index === activeRelativeIndex ? '0s' : '0.1s'
              }"
            >
              <MilestoneCard
                :name="milestone.name"
                :dday="milestone.dday"
                :progress="milestone.progress"
                :is-active="index === activeRelativeIndex"
              />
            </div>
            
            <!-- 네비게이션 - 화살표만 (스톤명은 SVG 내부에 표시) -->
            <div 
              v-if="store.milestones.length >= 2" 
              class="nav-arrows"
              :class="{ 'nav-always-visible': store.milestones.length >= 2 }"
            >
              <button @click="prevMs">◀</button>
              <button @click="nextMs">▶</button>
            </div>
          </template>
          
          <!-- 마일스톤이 없을 때 -->
          <div v-else class="empty">진행 중인 마일스톤이 없습니다.</div>
        </div>
      </div>

      <!-- 개인 To-Do -->
      <div class="card todo">
        <Todo />
      </div>

      <!-- Task -->
      <div class="card task">
        <HomeTaskCard />
      </div>

      <!-- 나의 일정 카드 -->
      <div class="card summary">
        <div class="schedule-container">
          <div class="schedule-header">
            <h3>나의 일정</h3>
            <button class="view-more" @click="$router.push('/schedule/shared')">전체보기</button>
          </div>

          <!-- 스크롤 가능한 리스트 영역 -->
          <div class="schedule-scroll">
            <div v-if="store.personalSchedules.length === 0" class="empty">
              오늘 포함된 일정이 없습니다.
            </div>

            <ul v-else class="schedule-list">
              <li
                v-for="item in store.personalSchedules"
                :key="item.id"
                class="schedule-item"
                @click="openScheduleDetail(item.id)"
              >
                <div class="left">
                  <div class="dot"></div>
                  <div class="title">{{ item.title }}</div>
                </div>
                <div class="right">
                  <span class="date">{{ formatDate(item.startAt) }} ~ {{ formatDate(item.endAt) }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
    </div>
    <!-- 일정 상세 모달 -->
    <ScheduleDetailModal
        v-if="showScheduleModal"
        :visible="showScheduleModal"
        :schedule-id="selectedScheduleId"
        @close="showScheduleModal = false"
      />
    </div>
  </div>
</template>

<style scoped>
/* 전체 레이아웃 */
.wrap {
  padding: 5px 32px;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  background: #F5F5F5;
  min-height: 100vh;
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
  margin: 8px 0 28px;
  font-size: 15px;
}
.today strong {
  font-size: 20px;
  font-weight: 700;
  color: #1C0F0F;
}

/* 2x2 고정형 카드 그리드 */
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 두 개씩 균등 배치 */
  grid-auto-rows: 340px; /* 각 카드의 고정 높이 */
  gap: 24px; /* 카드 간 간격 */
  justify-content: center;
  align-items: stretch;
}

/* 카드 스타일 */
.card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;

  /* 고정 크기 보정 */
  min-height: 340px;
  max-height: 340px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

/* 마일스톤 카드만 중앙 정렬 */
.card.milestone {
  justify-content: flex-start;
  align-items: stretch;
}

/* 마일스톤 헤더는 왼쪽 정렬 */
.card.milestone .milestone-header {
  text-align: left;
}

/* 다른 카드들은 상단 정렬 */
.card.todo,
.card.task,
.card.summary {
  justify-content: flex-start;
  align-items: stretch;
}

/* hover 시 살짝 뜨는 효과 */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 반응형 (태블릿 이하일 때 1열로 전환) */
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
    grid-auto-rows: 320px;
  }
}

/* 카드 내용이 없을 때 */
.empty {
  color: #888;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  margin-bottom: 40px;
}

/* 마일스톤 헤더 */
.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 10px 15px;
  margin: 0 10px;
  border-bottom: 1px solid rgb(223, 223, 223);
  flex-shrink: 0;
  text-align: left;
}

.milestone-title-text {
  font-size: 18px;
  font-weight: 700;
  color: #1C0F0F;
  margin-left: 8px;
  margin-top: 10px;
}

/* 네비게이션 버튼 - 화살표만 (스톤명은 SVG 내부에 표시됨) */
.nav-arrows {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 500px; /* 화살표 간격 조정 (이 값을 수정하면 화살표 간격 변경 가능) */
  opacity: 1;
  transition: opacity 0.2s ease;
  z-index: 30;
  pointer-events: none;
  margin-top: 0px; /* 화살표 위치 조정 (이 값을 수정하면 화살표 위치 변경 가능) */
}

.nav-always-visible {
  opacity: 1;
}

.nav-arrows button {
  border: none;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  color: #1C0F0F;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.nav-arrows button:hover {
  background: #FFE364;
  box-shadow: 0 4px 12px rgba(255, 227, 100, 0.4);
  transform: scale(1.1);
}

/* 마일스톤 컨테이너 */
.milestone-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  min-height: 250px;
  perspective: 1000px;
}

.card.milestone {
  overflow: visible;
}

.milestone-item {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.milestone-active {
  transform: scale(1) translateX(0);
  opacity: 1;
  z-index: 10;
}

.milestone-prev {
  transform: scale(0.65) translateX(-200px);
  opacity: 1.0; /* 0.3 → 0.5로 증가 (더 높이고 싶으면 이 값을 수정하세요) */
  pointer-events: none;
  z-index: 1;
  filter: blur(1.5px); /* blur도 약간 줄임 */
}

.milestone-next {
  transform: scale(0.65) translateX(200px);
  opacity: 0.3; /* 0.3 → 0.5로 증가 (더 높이고 싶으면 이 값을 수정하세요) */
  pointer-events: none;
  z-index: 1;
  filter: blur(1.5px); /* blur도 약간 줄임 */
}

/* 반응형 */
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.schedule-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 8px 10px;
}

/* 상단 제목 영역 */
.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 10px 12px;
  border-bottom: 1px solid rgb(233, 233, 233);
  flex-shrink: 0; /* 고정 */
}

.schedule-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1C0F0F;
  margin: 0;
}

.view-more {
  border: none;
  background: transparent;
  font-size: 13px;
  color: #888;
  cursor: pointer;
  transition: color 0.2s ease;
  font-weight: 500;
}
.view-more:hover {
  color: #1C0F0F;
}

/* 스크롤 가능한 영역 */
.schedule-scroll {
  flex: 1;
  overflow-y: auto; /* ✅ 내부 스크롤 */
  padding-right: 6px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 스크롤바 커스터마이징 (Chrome 기준) */
.schedule-scroll::-webkit-scrollbar {
  width: 6px;
}
.schedule-scroll::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}
.schedule-scroll::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 3px;
}
.schedule-scroll::-webkit-scrollbar-thumb:hover {
  background: #B0B0B0;
}

/* 일정 리스트 */
.schedule-list {
  list-style: none;
  margin: 0;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F5F5F5;
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.schedule-item:hover {
  background: #FFF8D8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 227, 100, 0.25);
}

/* 일정 항목 내부 구성 */
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dot {
  width: 8px;
  height: 8px;
  background: #FFE364;
  border-radius: 50%;
  flex-shrink: 0;
}
.title {
  font-weight: 600;
  color: #1C0F0F;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.right .date {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* 빈 상태 */
.schedule-scroll .empty {
  color: #888;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  margin-bottom: 50px;
}
</style>