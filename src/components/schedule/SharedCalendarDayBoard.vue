<!-- src/components/schedule/SharedCalendarDayBoard.vue -->
<template>
  <div class="dayboard-root">
    <!-- 상단 공통 헤더: 이전/오늘/다음 + 날짜 -->
    <div class="dayboard-header">
      <div class="left">
        <button class="nav-btn" @click="goPrev">‹</button>
        <button class="nav-btn" @click="goToday">오늘</button>
        <button class="nav-btn" @click="goNext">›</button>
      </div>
      <div class="center">{{ formatDate(currentDate) }}</div>
      <div class="right"></div>
    </div>

    <!-- 사람(나 + 구독자) 컬럼 -->
    <div class="dayboard-columns" ref="columnsWrap">
      <div
        v-for="(p, idx) in people"
        :key="p.id"
        class="dayboard-col"
      >
        <div class="col-header">
          <span class="dot" :style="{ backgroundColor: p.color || '#f9a825' }"></span>
          <span class="name">{{ p.title }}</span>
        </div>
        <div class="calendar-shell" :ref="(el) => setCalEl(el, idx)"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, computed, ref, nextTick } from 'vue';

/** props
 * myEvents: 내 일정 [{id,title,start,end,...}]
 * subscribers: [{ targetUserId, targetUserName, color, visible, events: [...] }]
 * height: px 또는 'auto'
 */
const props = defineProps({
  myEvents: { type: Array, default: () => [] },
  subscribers: { type: Array, default: () => [] },
  height: { type: [String, Number], default: 900 },
});

const FC = window.FullCalendar;
const currentDate = ref(new Date());
const calendars = ref([]);            // FC.Calendar 인스턴스들
const calEls = ref([]);               // 각 캘린더 DOM
const columnsWrap = ref(null);
let syncing = false;

// 사람 목록(왼쪽부터: 나 → visible 구독자)
const people = computed(() => {
  const me = { id: 'me', title: '내 일정', color: '#fbc02d', _events: props.myEvents || [] };
  const subs = (props.subscribers || [])
    .filter(s => s.visible)
    .map(s => ({
      id: s.targetUserId,
      title: s.targetUserName || s.targetUserId,
      color: s.color || '#90caf9',
      _events: s.events || []
    }));
  return [me, ...subs];
});

function setCalEl(el, idx) {
  if (!el) return;
  calEls.value[idx] = el;
}

function formatDate(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = (dt.getMonth() + 1).toString().padStart(2, '0');
  const day = dt.getDate().toString().padStart(2, '0');
  const wk = ['일','월','화','수','목','금','토'][dt.getDay()];
  return `${y}.${m}.${day} (${wk})`;
}

function renderAll() {
  destroyAll();
  calendars.value = people.value.map((p, i) => {
    const cal = new FC.Calendar(calEls.value[i], {
      initialView: 'timeGridDay',
      initialDate: currentDate.value,
      height: props.height,
      headerToolbar: false,
      allDaySlot: false,
      nowIndicator: true,
      slotMinTime: '07:00:00',
      slotMaxTime: '22:00:00',
      expandRows: true,
      dayHeaderFormat: { weekday: 'short' }, // 상단 요일은 작게
      eventOverlap: true,
      displayEventTime: false,
      events: p._events,
      // 클릭 → 상세 모달은 기존 로직에 맞춰 emit 하거나 바로 연결
      eventClick(info) {
        // 예: 이 컴포넌트 밖의 모달을 열고 싶으면 아래 emit 사용
        // emit('eventClick', { person: p, event: info.event });
      },
      datesSet() {
        // 날짜가 외부에서 바뀐 경우도 동기화(첫 번째 캘린더 기준)
        const d = calendars.value[0]?.getDate();
        if (d && d.toDateString() !== new Date(currentDate.value).toDateString()) {
          currentDate.value = d;
        }
      },
    });
    cal.render();
    return cal;
  });

  nextTick(() => setupScrollSync());
}

function destroyAll() {
  calendars.value.forEach(c => c?.destroy?.());
  calendars.value = [];
}

function goToday() {
  currentDate.value = new Date();
  calendars.value.forEach(c => c?.today?.());
}
function goPrev() {
  currentDate.value = new Date(currentDate.value.getTime() - 24 * 60 * 60 * 1000);
  calendars.value.forEach(c => c?.prev?.());
}
function goNext() {
  currentDate.value = new Date(currentDate.value.getTime() + 24 * 60 * 60 * 1000);
  calendars.value.forEach(c => c?.next?.());
}

// 스크롤 동기화 (수직)
// 각 캘린더의 .fc-scroller를 찾아 scrollTop을 맞춘다.
function setupScrollSync() {
  const scrollers = Array.from(columnsWrap.value.querySelectorAll('.fc-scroller'));
  scrollers.forEach(sc => {
    sc.addEventListener('scroll', () => {
      if (syncing) return;
      syncing = true;
      const top = sc.scrollTop;
      scrollers.forEach(other => {
        if (other !== sc) other.scrollTop = top;
      });
      syncing = false;
    });
  });
}

// watch: 사람 목록/이벤트/날짜 변경 → 리렌더
watch([people, () => props.height], () => {
  nextTick(renderAll);
}, { deep: true });

watch(currentDate, (d) => {
  calendars.value.forEach(c => c?.gotoDate?.(d));
});

onMounted(() => renderAll());
onBeforeUnmount(() => destroyAll());
</script>

<style scoped>
.dayboard-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dayboard-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 6px 4px;
}
.dayboard-header .left { justify-self: start; }
.dayboard-header .center { font-weight: 600; }
.dayboard-header .right { justify-self: end; }
.nav-btn {
  border: 1px solid var(--fc-border-color, #ddd);
  padding: 4px 8px;
  border-radius: 6px;
  margin-right: 6px;
  background: #fff;
  cursor: pointer;
}
.dayboard-columns {
  display: flex;
  gap: 8px;
  overflow-x: auto; /* 구독자가 많을 때 가로 스크롤 */
}
.dayboard-col {
  min-width: 340px;            /* 한 사람당 너비 */
  flex: 0 0 340px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #fffdf7;
  display: flex;
  flex-direction: column;
}
.col-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f1f1;
  position: sticky;
  top: 0;
  background: inherit;
  z-index: 2;
}
.col-header .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.calendar-shell {
  padding: 0 4px 6px;
}
</style>
