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
      <div class="modal-container">
        <header class="modal-header">
          <h2>일정 등록</h2>
        </header>

        <div class="modal-body">
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
        </div>

        <footer class="modal-footer">
          <button class="cancel-btn" @click="showModal = false">취소</button>
          <button class="submit-btn" @click="createSchedule">등록</button>
        </footer>
      </div>
    </div>

    <!-- 일정 조회 모달 -->
    <ScheduleDetailModal
      v-model:visible="isDetailModalOpen"
      :scheduleId="selectedEventId"
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

// ✅ 유저별 색상 팔레트 (프로젝트 캘린더와 유사한 색상)
const userColorPalette = [
  "#FFD93D", // 노란색
  "#6ECB63", // 초록색
  "#FF5A8A", // 핑크색
  "#9B6BFF", // 보라색
  "#4C9AFF", // 파란색
  "#34D399", // 민트색
  "#FF9F68", // 주황색
  "#A78BFA", // 연보라색
  "#FF4B4B", // 코랄색
  "#F472B6", // 연핑크색
  "#FBBF24", // 연노란색
  "#FB923C", // 연주황색
  "#C084FC", // 라벤더색
  "#3B82F6", // 진파란색
  "#EC4899", // 진핑크색
  "#F59E0B", // 골드색
  "#10B981", // 에메랄드색
  "#F97316", // 오렌지색
];

// ✅ 유저별 색상 맵 (targetUserId -> color)
const userColorMap = new Map();

// ✅ 유저별 색상 할당 함수
function getColorForUserId(userId) {
  if (!userId) return userColorPalette[0];
  
  const userIdStr = String(userId);
  if (!userColorMap.has(userIdStr)) {
    const color = userColorPalette[userColorMap.size % userColorPalette.length];
    userColorMap.set(userIdStr, color);
  }
  return userColorMap.get(userIdStr);
}

// ✅ hex를 rgba로 변환 (불투명도 조절용)
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ✅ 불투명도 설정
const EVENT_BACKGROUND_OPACITY = 0.35; // 배경 불투명도 (구독 유저 일정용)
const EVENT_BORDER_OPACITY = 1.0; // 테두리 불투명도
const MY_SCHEDULE_BACKGROUND_OPACITY = 0.3; // 내 일정 배경 불투명도 (30%)

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

    // 일정 등록 후 form 초기화
    form.value = {
      calendarName: "",
      startedAt: "",
      endedAt: "",
      repeatCycle: "NONE",
      repeatEndAt: "",
      isShared: true,
    };
    
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

// 모달 닫힐 때 form 초기화
watch(showModal, (visible) => {
  if (!visible) {
    // 모달이 닫힐 때 폼 초기화
    form.value = {
      calendarName: "",
      startedAt: "",
      endedAt: "",
      repeatCycle: "NONE",
      repeatEndAt: "",
      isShared: true,
    };
  }
});

// ✅ 멀티데이 이벤트 처리 함수 (연속된 바로 표시되도록 하나의 이벤트로 유지, 시간 정보 유지)
function processMultiDayEvent(startTime, endTime, baseEvent) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // 시작일과 종료일의 날짜만 추출 (시간 제외)
  const startDateOnly = new Date(start);
  startDateOnly.setHours(0, 0, 0, 0);
  const endDateOnly = new Date(end);
  endDateOnly.setHours(0, 0, 0, 0);
  
  // 같은 날인지 확인
  const isSameDay = startDateOnly.getTime() === endDateOnly.getTime();
  
  // 시간이 정확히 00:00:00부터 23:59:59까지인지 확인
  const startHour = start.getHours();
  const startMin = start.getMinutes();
  const startSec = start.getSeconds();
  const endHour = end.getHours();
  const endMin = end.getMinutes();
  const endSec = end.getSeconds();
  
  // 하루 종일 이벤트인지 확인 (00:00:00 ~ 23:59:59 또는 다음날 00:00:00)
  const isFullDay = (startHour === 0 && startMin === 0 && startSec === 0) && 
                    ((endHour === 23 && endMin === 59) || (endHour === 0 && endMin === 0 && endSec === 0));
  
  // // 멀티데이 이벤트를 하나의 이벤트로 유지 (FullCalendar가 자동으로 연속된 바로 표시)
  // // 시간 정보는 유지되며, 주/일 뷰에서 시간대로 표시됨
  // return [{
  //   ...baseEvent,
  //   start: startTime,
  //   end: endTime,
  //   allDay: isFullDay && isSameDay, // 같은 날이고 하루 종일이면 allDay, 아니면 시간대로 표시
  // }];

  // 월뷰(dayGridMonth)에서는 같은 날짜면 allDay로 강제해서 '채워진 카드'로 렌더
  const forceAllDayForMonth =
  (window?.FullCalendar?.Calendar && (calendar?.view?.type === 'dayGridMonth')) && isSameDay;

  return [{
    ...baseEvent,
    start: startTime,
    end: endTime,
    allDay: forceAllDayForMonth ? true : (isFullDay && isSameDay),
  }];
}

// --- 공유 데이터 로드 ---
const fetchSharedData = async () => {
  try {
    const [mine, subs] = await Promise.all([
      getMySchedules(workspaceId),
      getSubscriptions(workspaceId),
    ]);

    // ✅ 색상 맵 초기화
    userColorMap.clear();
    
    // ✅ 내 일정 색상 (고정 색상)
    const myColor = "#A5B4FF";
    
    // 내 일정 (배경 불투명도 30% + 굵은 테두리)
    const myEventsList = [];
    mine.forEach((e) => {
      const baseEvent = {
        id: e.id,
        title: `[내 일정] ${e.calendarName}`,
        backgroundColor: hexToRgba(myColor, MY_SCHEDULE_BACKGROUND_OPACITY), // 배경 불투명도 30%
        borderColor: myColor, // 테두리 색상: 내 전용 색
        borderWidth: 3, // 굵은 테두리
        textColor: myColor, // 텍스트 색상: 내 전용 색
        classNames: ["my-schedule-event"], // 커스텀 클래스 추가
        type: "me",
      };
      
      // 멀티데이 이벤트 처리 (연속된 바로 표시되도록, 시간 정보 유지)
      const processedEvents = processMultiDayEvent(e.startedAt, e.endedAt, baseEvent);
      myEventsList.push(...processedEvents);
    });
    myEvents.value = myEventsList;

    // 구독자별 일정
    subscribers.value = subs.map((s) => {
      // ✅ 유저별 고정 색상 할당
      const userColor = getColorForUserId(s.targetUserId);
      
      const userEventsList = [];
      (s.sharedCalendars || []).forEach((ev) => {
        const baseEvent = {
          id: ev.calendarId,
          title: `[${s.targetUserName}] ${ev.calendarName}`,
          color: "#FFFFFF", // 텍스트 색상: 흰색
          backgroundColor: hexToRgba(userColor, EVENT_BACKGROUND_OPACITY),
          // 테두리 없음 (구독 유저 일정)
          type: s.targetUserId,
        };
        
        // 멀티데이 이벤트 처리 (연속된 바로 표시되도록, 시간 정보 유지)
        const processedEvents = processMultiDayEvent(ev.startedAt, ev.endedAt, baseEvent);
        userEventsList.push(...processedEvents);
      });
      
      return {
        subscriptionId: s.id,
        targetUserId: s.targetUserId,
        targetUserName: s.targetUserName,
        visible: true,
        color: userColor, // 사이드바 표시용 색상
        events: userEventsList,
      };
    });

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
    eventDisplay: 'block',
    height: "auto",
    displayEventTime: false,
    headerToolbar: false,
    // 1일짜리 이벤트도 항상 표시되도록 설정
    dayMaxEvents: false,
    moreLinkClick: 'popover',
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

/* ========= 일정 등록 ============ */
/* ===== Overlay & Container ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(3px);
}

.modal-container {
  width: 400px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeIn 0.25s ease-out;
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
}

/* ===== Header ===== */
.modal-header {
  background: #fff8e1;
  padding: 16px 20px;
  border-bottom: 1px solid #f2e3a5;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

/* ===== Body ===== */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.modal-body label {
  font-weight: 600;
  color: #444;
  font-size: 14px;
}

.modal-body input,
.modal-body select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
}

/* ===== Footer ===== */
.modal-footer {
  padding: 12px 20px;
  text-align: right;
  background: #fafafa;
  border-top: 1px solid #eee;
}

.cancel-btn,
.submit-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
}
.cancel-btn:hover {
  background: #e8e8e8;
}

.submit-btn {
  background: #ffcd4d;
}
.submit-btn:hover {
  background: #ffd86c;
}

/* ===== Animation ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== 구독 ========== */
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
