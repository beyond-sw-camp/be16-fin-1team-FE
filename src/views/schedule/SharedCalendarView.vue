<template>
  <div class="shared-calendar-wrap">
    <div class="toolbar">
      <div class="left">
        <button @click="prevMonth" class="nav-btn">◀</button>
        <span class="month-text">{{ currentYearMonth }}</span>
        <button @click="nextMonth" class="nav-btn">▶</button>
      </div>
      <div class="right">
        <button class="create-btn" @click="showModal = true">＋ 일정 등록</button>
        <!-- 월/주/일 전환 버튼 -->
        <div class="view-toggle">
          <button
            v-for="type in viewOptions"
            :key="type.value"
            :class="['view-btn', { active: viewType === type.value }]"
            @click="viewType = type.value"
          >
            {{ type.label }}
          </button>
        </div>
        <div>
          <!-- 월/주: 기존 FullCalendar -->
          <FullCalendarWrapper
            v-if="view !== 'day'"
            :events="mergedEventsForMonthWeek"
            :view-type="view === 'month' ? 'dayGridMonth' : 'timeGridWeek'"
          />

          <!-- 일: 사람별 컬럼 보드(무료 버전) -->
          <SharedCalendarDayBoard
            v-else
            :my-events="myEvents"
            :subscribers="subscribers"
            :height="880"
            @eventClick="openDetailModal"
          />
        </div>
      </div>
    </div>

    <div class="calendar-container">
      <!-- 사이드바 -->
      <div class="sidebar">
        <div class="subscribe-header">
          <h4>구독 리스트</h4>
          <img
            src="@/assets/icons/calendar/setting.svg"
            alt="설정"
            class="setting-icon"
            @click="isManageModalOpen = true"
          />
        </div>
          <div v-for="user in subscribers" :key="user.targetUserId" class="user-item">
            <label class="user-label">
              <input type="checkbox" v-model="user.visible" class="user-checkbox" />
              <!-- 색상 동그라미 -->
              <span
                class="user-dot"
                :style="{ backgroundColor: user.color }"
              ></span>
              <!-- 유저 이름 -->
              <span class="user-name">
                {{ user.targetUserName || user.targetUserId }}
              </span>
            </label>
          </div>
        <hr />
      </div>

      <div class="calendar-panel">
        <transition name="calendar-fade">
          <div v-show="isCalendarVisible" ref="calendarEl" id="shared-calendar"></div>
        </transition>
      </div>

      <!-- 유저 검색 모달 -->
      <SearchUserModal
        v-model:visible="isUserModalOpen"
        :workspaceId="workspaceId"
        @subscribed="fetchSharedData"
      />
      <!-- 구독 모달 -->
      <ManageSubscriptionModal
        v-model:visible="isManageModalOpen"
        :workspaceId="workspaceId"
        :subscribers="subscribers"
        @subscribed="fetchSharedData"
      />

    </div>
    
    <!-- 일정 등록 모달 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>일정 등록</h3>

        <label>일정 이름</label>
        <input v-model="form.calendarName" placeholder="일정 이름 입력" />

        <label>시작일</label>
        <input type="datetime-local" v-model="form.startedAt" />

        <label>종료일</label>
        <input type="datetime-local" v-model="form.endedAt" />

        <label>반복 주기</label>
        <select v-model="form.repeatCycle">
          <option value="NONE">없음</option>
          <option value="DAILY">매일</option>
          <option value="WEEKLY">매주</option>
          <option value="MONTHLY">매월</option>
        </select>

        <label>반복 종료일</label>
        <input type="datetime-local" v-model="form.repeatEndAt" />

        <label>
          <input type="checkbox" v-model="form.isShared" />
          공유 여부
        </label>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showModal = false">취소</button>
          <button class="submit-btn" @click="createSchedule">등록</button>
        </div>
      </div>
    </div>

    <!-- 일정 조회 모달 -->
    <ScheduleDetailModal
      v-model:visible="isDetailModalOpen"
      :eventId="selectedEventId"
      @updated="fetchSharedData"
      @deleted="fetchSharedData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed  } from "vue";
import { getMySchedules, getSubscriptions } from "@/api/sharedCalendarApi.js";
import axios from "axios";
import SearchUserModal from "@/components/modal/SearchUserModal.vue"; 
import ScheduleDetailModal from "@/components/modal/ScheduleDetailModal.vue";
import ManageSubscriptionModal from "@/components/modal/ManageSubscriptionModal.vue";

const isManageModalOpen = ref(false);

const workspaceId = localStorage.getItem("selectedWorkspaceId");
const calendarEl = ref(null);
let calendar = null;
const userId = localStorage.getItem("id");

const myEvents = ref([]);
const subscribers = ref([]); // 구독자 리스트 저장용
const newUserId = ref("");
const showModal = ref(false);

const isUserModalOpen = ref(false);

const openModal = () => (isUserModalOpen.value = true);

const selectedEventId = ref(null);
const isDetailModalOpen = ref(false);

const currentDate = ref(new Date());

const currentYearMonth = computed(() => {
  return `${currentDate.value.getFullYear()}년 ${currentDate.value.getMonth() + 1}월`;
});

const prevMonth = () => {
  calendar?.prev(); // FullCalendar 내부 이동
  currentDate.value = calendar?.getDate(); 
};

const nextMonth = () => {
  calendar?.next();
  currentDate.value = calendar?.getDate(); 
};

const form = ref({
  calendarName: "",
  startedAt: "",
  endedAt: "",
  repeatCycle: "NONE",
  repeatEndAt: "",
  isShared: true,
});

// 일정 등록 함수
const createSchedule = async () => {
  try {
    await axios.post(
      `/user-service/shared-calendars`,
      {
        workspaceId,
        calendarName: form.value.calendarName,
        startedAt: form.value.startedAt,
        endedAt: form.value.endedAt,
        repeatCycle: form.value.repeatCycle,
        repeatEndAt: form.value.repeatEndAt,
        isShared: form.value.isShared,
      },
      {
        headers: { "X-User-Id": userId },
      }
    );

    alert("✅ 일정이 등록되었습니다.");
    showModal.value = false;

    // 새 일정 반영
    await fetchSharedData();
    setTimeout(() => calendar?.render(), 200);

    calendar?.render();

    // window.location.reload();
  } catch (err) {
    console.error("❌ 일정 등록 실패:", err);
    alert("일정 등록 실패");
  }
};

// --- 공유 데이터 로드 ---
const fetchSharedData = async () => {
  try {
    const [mine, subs] = await Promise.all([
      getMySchedules(workspaceId),
      getSubscriptions(workspaceId),
    ]);
    console.log(subs)

    // 내 일정
    myEvents.value = mine.map((e) => ({
      id: e.id,
      title: `[내 일정] ${e.calendarName}`,
      start: e.startedAt,
      end: e.endedAt,
      color: "#A5B4FF",
      type: "me",
    }));

    // 구독자별 일정
    subscribers.value = subs.map((s, i) => ({
      subscriptionId: s.id,
      targetUserId: s.targetUserId,
      targetUserName: s.targetUserName,
      visible: true,
      color: ["#FFB6B9", "#FFD580", "#8DE7B8", "#C3A1E0"][i % 4],
      events: (s.sharedCalendars || []).map((ev) => ({
        id: ev.calendarId,
        title: `[${s.targetUserName}] ${ev.calendarName}`,
        start: ev.startedAt,
        end: ev.endedAt,
        color: ["#FFB6B9", "#FFD580", "#8DE7B8", "#C3A1E0"][i % 4],
        type: s.targetUserId,
      })),
    }));

    renderCalendar();
  } catch (err) {
    console.error("❌ 공유 캘린더 조회 실패:", err);
  }
};

// 구독 추가
const addSubscription = async () => {
  if (!newUserId.value.trim()) {
    alert("유저 ID를 입력하세요.");
    return;
  }

  try {
    await axios.post(
      "/user-service/subscriptions",
      {
        workspaceId,
        targetUserIdList: [newUserId.value],
      },
      {
        headers: {
          "X-User-Id": localStorage.getItem("id"),
        },
      }
    );

    alert("✅ 구독이 추가되었습니다.");
    newUserId.value = "";
    fetchSharedData(); // 새 구독 반영
  } catch (err) {
    console.error("❌ 구독 추가 실패:", err);
    alert("구독 추가 실패");
  }
};

// --- 캘린더 렌더링 ---
const viewType = ref("dayGridMonth");
const renderCalendar = () => {
  const FC = window.FullCalendar;
  if (!FC) return;

  if (calendar) calendar.destroy();

  const visibleEvents = [
    ...myEvents.value,
    ...subscribers.value
      .filter((u) => u.visible)
      .flatMap((u) => u.events),
  ];

  calendar = new FC.Calendar(calendarEl.value, {
    initialView: viewType.value,
    height: "auto",
    displayEventTime: false,
    headerToolbar: false,
    events: visibleEvents,
    eventClick(info) {
      selectedEventId.value = info.event.id;
      isDetailModalOpen.value = true;
    },
  });

  calendar.render();
};

// 월/주/일 버튼 목록
const viewOptions = [
  { value: "dayGridMonth", label: "월" },
  { value: "timeGridWeek", label: "주" },
  { value: "timeGridDay", label: "일" },
];

// viewType 변경 시 FullCalendar 뷰 전환
const isCalendarVisible = ref(true);

// viewType 변경 시 뷰 변경 + 살짝 페이드 효과
watch(viewType, async (newView) => {
  if (!calendar) return;

  // 페이드 아웃
  isCalendarVisible.value = false;

  // 약간 기다렸다가
  setTimeout(() => {
    calendar.changeView(newView);
    isCalendarVisible.value = true; // 페이드 인
  }, 300);
});

// watch로 체크박스 상태 변경 감지 후 렌더링
watch(
  subscribers,
  () => {
    renderCalendar();
  },
  { deep: true }
);

onMounted(async () => {
  await fetchSharedData();
  if (calendar) calendar.changeView(viewType.value);
});
</script>

<style scoped>
.create-btn {
  background: #ffcd4d;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 8px;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;

  /* ✅ z-index를 높게 지정 */
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 10px;
  padding: 20px;
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeIn 0.2s ease-in-out;

  /* ✅ FullCalendar보다 위에 오도록 */
  z-index: 2001;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.modal input,
.modal select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.cancel-btn {
  background: #ddd;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.submit-btn {
  background: #ffd580;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.shared-calendar-wrap {
  padding: 20px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.calendar-container {
  display: flex;
  gap: 20px;
}
.sidebar {
  width: 200px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 12px;
}
.user-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  margin-bottom: 6px;
}
.calendar-panel {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 12px;
}

.subscribe-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subscribe-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.subscribe-btn {
  background: #ffd580;
  color: #333;
  border: none;
  border-radius: 6px;
  padding: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.subscribe-btn:hover {
  background: #ffcd4d;
}

.view-toggle {
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.view-btn {
  border: none;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 500;
  background: #fff;
  color: #555;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #f8f8f8;
}

.view-btn.active {
  background: #ffd580;
  color: #333;
  font-weight: 600;
}

/* ✅ 뷰 전환 애니메이션 */
.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: all 0.4s ease;
}

.calendar-fade-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.calendar-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.calendar-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

.user-item {
  display: flex;
  align-items: center;
  padding: 6px 4px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.user-item:hover {
  background-color: #f8f8f8;
}

.user-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: 100%;
}

.user-checkbox {
  accent-color: #ffcd4d; /* 체크박스 색상 */
  cursor: pointer;
}

.user-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* hover 시 색상 점 살짝 커짐 */
.user-item:hover .user-dot {
  transform: scale(1.2);
}

.nav-btn {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 4px 8px;
  margin: 0 4px;
  cursor: pointer;
}

.month-text {
  font-weight: 600;
  margin: 0 8px;
}

.subscribe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.setting-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.setting-icon:hover {
  opacity: 1;
}

</style>
