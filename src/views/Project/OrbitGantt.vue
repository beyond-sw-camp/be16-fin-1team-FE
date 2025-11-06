<template>
  <div class="orbit-gantt-wrap">
    <!-- ✅ 상단 툴바 -->
    <div class="gantt-toolbar">
      <div class="left">
        <strong>간트차트</strong>
        <span class="view-mode">
          <button 
            class="view-btn" 
            :class="{ active: viewMode === 'month' }"
            @click="viewMode = 'month'"
          >
            월
          </button>
          <button 
            class="view-btn" 
            :class="{ active: viewMode === 'week' }"
            @click="viewMode = 'week'"
          >
            주
          </button>
          <button 
            class="view-btn" 
            :class="{ active: viewMode === 'day' }"
            @click="viewMode = 'day'"
          >
            일
          </button>
        </span>
      </div>
      <div class="right">
        <button class="btn" @click="zoomOut">－</button>
        <span class="zoom">{{ Math.round(zoom * 100) }}%</span>
        <button class="btn" @click="zoomIn">＋</button>
        <button class="btn btn-today" @click="scrollToday">오늘</button>
      </div>
    </div>

    <!-- ✅ 간트차트 컨테이너 -->
    <div
      ref="scrollHost"
      class="gantt-scroll"
      @wheel="onWheelScroll"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseDrag"
    >
      <div v-if="!ready" class="empty">
        <div class="loading-spinner"></div>
        <div>데이터 불러오는 중…</div>
      </div>

      <template v-else>
        <!-- 왼쪽 작업 목록 영역 -->
        <div class="gantt-task-list" :style="{ width: taskListWidth + 'px' }">
          <div class="task-list-header">
            <div class="header-cell">작업</div>
          </div>
          <div class="task-list-body">
            <div
              v-for="(item, index) in visibleItems"
              :key="item.id"
              class="task-row"
              :class="{ 'is-task': item.isTask, 'is-stone': !item.isTask, even: index % 2 === 0 }"
              @click="toggleCollapse(item)"
            >
              <div class="task-cell">
                <span 
                  class="task-color-dot" 
                  :style="{ backgroundColor: item.color }"
                ></span>
                <span class="task-name">{{ item.name }}</span>
                <span 
                  v-if="item.hasChildren" 
                  class="collapse-icon"
                  @click.stop="toggleCollapse(item)"
                >
                  {{ collapsedSet.has(item.id) ? '▶' : '▼' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽 타임라인 영역 -->
        <div class="gantt-timeline">
          <!-- 날짜 헤더 -->
          <div class="timeline-header" :style="{ width: timelineWidth + 'px' }">
            <!-- 월 헤더 (월/주 모드에서만 표시) -->
            <div v-if="viewMode !== 'day'" class="month-row">
              <div 
                v-for="(m, i) in visibleMonths" 
                :key="'m-' + m.key"
                class="month-cell"
                :style="{
                  left: m.x + 'px',
                  width: m.w + 'px',
                  backgroundColor: '#FAFAFA'
                }"
              >
                {{ m.label }}
              </div>
            </div>
            <!-- 일/주 헤더 -->
            <div class="day-row" :style="{ marginTop: viewMode === 'day' ? '0' : '0' }">
              <div 
                v-for="d in visibleDays" 
                :key="'d-' + d.key"
                class="day-cell"
                :style="{
                  left: d.x + 'px',
                  width: d.w + 'px'
                }"
                :class="{ 'is-today': d.isToday, 'is-weekend': d.isWeekend }"
              >
                {{ d.label }}
              </div>
              <!-- 오늘 표시 원 -->
              <div 
                v-if="todayX >= 0" 
                class="today-indicator"
                :style="{ left: (todayX - 10) + 'px' }"
              >
                <div class="today-circle"></div>
              </div>
            </div>
          </div>

          <!-- 본문 바 영역 -->
          <div 
            class="timeline-body" 
            :style="{ 
              width: timelineWidth + 'px',
              height: bodyHeight + 'px'
            }"
          >
            <!-- 그리드 배경 -->
            <div 
              v-for="(item, index) in visibleItems"
              :key="'row-' + item.id"
              class="grid-row"
              :class="{ even: index % 2 === 0 }"
              :style="{ top: (index * rowHeight) + 'px', height: rowHeight + 'px' }"
            ></div>

            <!-- 오늘 세로선 -->
            <div 
              v-if="todayX >= 0" 
              class="today-vertical-line"
              :style="{ 
                left: todayX + 'px',
                height: bodyHeight + 'px'
              }"
            ></div>

            <!-- 간트 바 -->
            <div
              v-for="b in visibleBars"
              :key="'bar-' + b.key"
              class="gantt-bar-wrapper"
              :style="{
                left: b.x + 'px',
                top: b.y + 'px',
                width: b.w + 'px',
                height: barHeight + 'px'
              }"
              @mouseenter="showTooltip(b, $event)"
              @mouseleave="hideTooltip"
              @click.stop="selectBar(b)"
            >
              <!-- 배경 바 (전체 기간) -->
              <div 
                class="bar-background"
                :style="{
                  backgroundColor: b.isTask ? hexToRgba(b.color, 0.25) : hexToRgba(b.color, 0.35),
                  borderColor: b.color,
                  borderRadius: '6px'
                }"
              ></div>
              <!-- 진행률 바 -->
              <div 
                class="bar-progress"
                :style="{
                  width: Math.max(2, (b.progress / 100) * 100) + '%',
                  backgroundColor: b.color,
                  borderRadius: '6px'
                }"
              ></div>
              <!-- 호버 효과 -->
              <div class="bar-hover"></div>
            </div>
          </div>
        </div>

        <!-- 툴팁 -->
        <div 
          v-show="tooltip.visible" 
          class="tooltip" 
          :style="tooltip.style"
        >
          <div class="tooltip-header">
            <span 
              class="tooltip-color-dot" 
              :style="{ backgroundColor: tooltip.data.color }"
            ></span>
            <div class="tooltip-name">{{ tooltip.data.name }}</div>
          </div>
          <div class="tooltip-content">
            <div class="tooltip-row">
              <span class="tooltip-label">기간</span>
              <span class="tooltip-value">{{ tooltip.data.start }} ~ {{ tooltip.data.end }}</span>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-label">진행률</span>
              <span class="tooltip-value">{{ tooltip.data.progress }}%</span>
            </div>
            <div v-if="tooltip.isToday" class="tooltip-row today-mark">
              <span>🌟 오늘 해당</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, watchEffect, nextTick } from "vue";
import axios from "axios";

/* ===== Props ===== */
const props = defineProps({
  projectId: { type: String, required: true },
  projectStart: { type: String, default: null },
  projectEnd:   { type: String, default: null },
});

/* ===== Layout consts ===== */
const rowHeight = 40;
const barHeight = 24;
const headerMonthHeight = 32;
const headerDayHeight = 36;
const headerHeight = headerMonthHeight + headerDayHeight;
const pxPerDayBase = 40;
const taskListWidth = 280;

/* ===== Refs ===== */
const zoom = ref(1);
const ready = ref(false);
const scrollHost = ref(null);
const hostWidth = ref(1200);
const hostHeight = ref(480);
const collapsedSet = ref(new Set());
const viewMode = ref('month'); // 'month' | 'week' | 'day'

/* ===== Data ===== */
const stones = ref([]);
const colorPalette = ["#9B6BFF", "#4C9AFF", "#FF5A8A", "#FFD93D", "#6ECB63", "#FF9F68"];
const colorMap = new Map(); // stoneId -> color (동일 stoneId는 동일 색상)

/* ===== Utils ===== */
const parse = (x) => new Date(x);
const toDateOnly = (d) => d.toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((a - b) / 86400000);
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
  return new Date(d.setDate(diff));
};
const getWeekEnd = (date) => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

/* ===== API ===== */
async function fetchStones(projectId) {
  const { data } = await axios.get(`/workspace-service/project/stones/${projectId}`);
  return data.result || [];
}
async function fetchTasks(stoneId) {
  const { data } = await axios.get(`/workspace-service/task/${stoneId}`);
  return data.result || [];
}

/* ===== 색상 할당: 동일 stoneId는 동일 색상 유지 ===== */
function assignColors(arr, depth = 0) {
  arr.forEach((s, i) => {
    if (!colorMap.has(String(s.stoneId))) {
      const color = colorPalette[colorMap.size % colorPalette.length];
      colorMap.set(String(s.stoneId), color);
    }
    s.__color = colorMap.get(String(s.stoneId));
    
    if (Array.isArray(s.childStone) && s.childStone.length) {
      assignColors(s.childStone, depth + 1);
    }
  });
}

/* ===== Attach tasks & assign colors ===== */
function attachTasks(arr, map) {
  arr.forEach((s) => {
    s.taskList = map.get(s.stoneId) || [];
    if (s.taskList) {
      s.taskList.forEach(t => {
        t.__stoneId = s.stoneId;
      });
    }
    if (Array.isArray(s.childStone) && s.childStone.length) {
      attachTasks(s.childStone, map);
    }
  });
}

/* ===== Flatten ===== */
function flatten(arr, parentId = null) {
  const out = [];
  arr.forEach((s) => {
    const color = colorMap.get(String(s.stoneId)) || "#9B6BFF";
    out.push({
      id: s.stoneId,
      name: s.stoneName,
      start: parse(s.startTime),
      end: parse(s.endTime),
      progress: s.milestone || 0,
      color,
      parentId,
      isTask: false,
      hasChildren: (s.taskList?.length || 0) + (s.childStone?.length || 0) > 0,
      stoneId: s.stoneId,
    });

    if (Array.isArray(s.taskList) && !collapsedSet.value.has(s.stoneId)) {
      s.taskList.forEach((t) => {
        out.push({
          id: t.taskId,
          name: "　↳ " + t.taskName,
          start: parse(t.startTime),
          end: parse(t.endTime),
          progress: t.progress || 0,
          color,
          parentId: s.stoneId,
          isTask: true,
          stoneId: s.stoneId,
        });
      });
    }

    if (Array.isArray(s.childStone) && !collapsedSet.value.has(s.stoneId)) {
      out.push(...flatten(s.childStone, s.stoneId));
    }
  });
  return out;
}
const flat = computed(() => flatten(stones.value));
const visibleItems = computed(() => flat.value);

/* ===== Time scale ===== */
const minStart = computed(() => {
  const p = props.projectStart ? new Date(props.projectStart) : null;
  const d = flat.value.length ? new Date(Math.min(...flat.value.map((s) => s.start))) : null;
  if (p && d) return new Date(Math.min(p, d));
  return p || d || new Date();
});
const maxEnd = computed(() => {
  const p = props.projectEnd ? new Date(props.projectEnd) : null;
  const d = flat.value.length ? new Date(Math.max(...flat.value.map((s) => s.end))) : null;
  if (p && d) return new Date(Math.max(p, d));
  return p || d || new Date();
});

// 뷰 모드별 기본 픽셀 값
const pxPerDayBaseByMode = computed(() => {
  switch (viewMode.value) {
    case 'day': return 60;
    case 'week': return 25;
    case 'month':
    default: return 40;
  }
});

const pxPerDay = computed(() => pxPerDayBaseByMode.value * zoom.value);
const totalDays = computed(() => Math.max(1, dayDiff(maxEnd.value, minStart.value) + 1));
const timelineWidth = computed(() => totalDays.value * pxPerDay.value);
const bodyHeight = computed(() => flat.value.length * rowHeight);

/* ===== Axis ===== */
const visibleMonths = computed(() => {
  if (viewMode.value === 'day' || !flat.value.length) return [];
  const arr = [];
  const start0 = new Date(minStart.value);
  start0.setDate(1);
  let cursor = start0;
  while (cursor <= maxEnd.value) {
    const label = viewMode.value === 'week' 
      ? `${cursor.getFullYear()}.${String(cursor.getMonth() + 1).padStart(2, "0")}`
      : `${cursor.getFullYear()}.${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const start = new Date(cursor);
    // 해당 월의 마지막 날과 maxEnd 중 작은 값으로 설정
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const actualEnd = monthEnd > maxEnd.value ? maxEnd.value : monthEnd;
    
    // 시작일이 minStart보다 작으면 minStart부터 시작
    const actualStart = start < minStart.value ? minStart.value : start;
    
    arr.push({
      key: label,
      label,
      x: Math.max(0, dayDiff(actualStart, minStart.value) * pxPerDay.value),
      w: (dayDiff(actualEnd, actualStart) + 1) * pxPerDay.value,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return arr;
});

const visibleDays = computed(() => {
  if (!flat.value.length) return [];
  const arr = [];
  const d = new Date(minStart.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 주 모드: 주 단위로 표시
  if (viewMode.value === 'week') {
    let weekStart = getWeekStart(d);
    while (weekStart <= maxEnd.value) {
      const weekEnd = getWeekEnd(weekStart);
      const displayEnd = weekEnd > maxEnd.value ? maxEnd.value : weekEnd;
      const isToday = today >= weekStart && today <= displayEnd;
      
      arr.push({
        key: `week-${toDateOnly(weekStart)}`,
        x: dayDiff(weekStart, minStart.value) * pxPerDay.value,
        w: (dayDiff(displayEnd, weekStart) + 1) * pxPerDay.value,
        label: `${String(weekStart.getMonth() + 1).padStart(2, '0')}.${String(weekStart.getDate()).padStart(2, '0')}`,
        isToday,
        isWeekend: false,
      });
      weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() + 1);
    }
  } else {
    // 일/월 모드: 일 단위로 표시
    while (d <= maxEnd.value) {
      const dayDate = new Date(d);
      const isToday = dayDate.getTime() === today.getTime();
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      arr.push({
        key: toDateOnly(d),
        x: dayDiff(d, minStart.value) * pxPerDay.value,
        w: pxPerDay.value,
        label: String(d.getDate()),
        isToday,
        isWeekend,
      });
      d.setDate(d.getDate() + 1);
    }
  }
  return arr;
});

/* ===== Bars ===== */
const bars = computed(() =>
  flat.value.map((s, i) => {
    const x = dayDiff(s.start, minStart.value) * pxPerDay.value;
    const w = Math.max(pxPerDay.value, (dayDiff(s.end, s.start) + 1) * pxPerDay.value);
    const y = i * rowHeight + (rowHeight - barHeight) / 2;
    return {
      key: s.id,
      id: s.id,
      x, y, w,
      name: s.name,
      progress: s.progress,
      start: toDateOnly(s.start),
      end: toDateOnly(s.end),
      color: s.color,
      parentId: s.parentId,
      isTask: s.isTask,
      hasChildren: s.hasChildren,
      stoneId: s.stoneId,
    };
  })
);
const visibleBars = computed(() => bars.value);

/* ===== Today pointer ===== */
const todayX = computed(() => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const s = new Date(minStart.value); s.setHours(0, 0, 0, 0);
  const e = new Date(maxEnd.value);   e.setHours(0, 0, 0, 0);
  if (t < s || t > e) return -1;
  return dayDiff(t, minStart.value) * pxPerDay.value + pxPerDay.value / 2;
});

/* ===== Tooltip ===== */
const tooltip = ref({ visible: false, data: {}, style: {}, isToday: false });
function showTooltip(b, ev) {
  tooltip.value.visible = true;
  tooltip.value.data = b;
  const today = new Date().toISOString().slice(0, 10);
  tooltip.value.isToday = b.start <= today && b.end >= today;
  
  const rect = scrollHost.value?.getBoundingClientRect();
  if (rect) {
    tooltip.value.style = { 
      left: `${ev.clientX - rect.left + 12}px`, 
      top: `${ev.clientY - rect.top + 12}px` 
    };
  }
}
function hideTooltip() {
  tooltip.value.visible = false;
}

/* ===== Collapse ===== */
function toggleCollapse(b) {
  if (!b.hasChildren) return;
  if (collapsedSet.value.has(b.id)) collapsedSet.value.delete(b.id);
  else collapsedSet.value.add(b.id);
}

/* ===== Bar selection ===== */
function selectBar(b) {
  console.log('Selected bar:', b);
}

/* ===== Scroll/Zoom/Drag ===== */
let dragging = false;
let dragStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

function fitScrollHeight() {
  if (!scrollHost.value) return;
  // 마일스톤 탭과 동일한 크기로 설정 (fixed positioning)
  const available = window.innerHeight - 240 - 15; // top: 240px, bottom: 15px
  hostHeight.value = Math.max(400, available);
  scrollHost.value.style.height = hostHeight.value + "px";
}

function onWheelScroll(e) {
  if (!scrollHost.value) return;
  if (e.shiftKey) {
    scrollHost.value.scrollLeft += e.deltaY * 1.2;
  } else {
    scrollHost.value.scrollTop += e.deltaY * 1.2;
  }
  e.preventDefault();
}
function onMouseDown(e) {
  if (e.target.closest('.gantt-bar-wrapper')) return;
  dragging = true;
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    scrollLeft: scrollHost.value.scrollLeft,
    scrollTop: scrollHost.value.scrollTop,
  };
  scrollHost.value.style.cursor = 'grabbing';
}
function onMouseUp() {
  dragging = false;
  if (scrollHost.value) scrollHost.value.style.cursor = 'grab';
}
function onMouseDrag(e) {
  if (!dragging || !scrollHost.value) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  scrollHost.value.scrollLeft = dragStart.scrollLeft - dx;
  scrollHost.value.scrollTop = dragStart.scrollTop - dy;
}
function zoomIn() {
  zoom.value = Math.min(3, zoom.value + 0.1);
}
function zoomOut() {
  zoom.value = Math.max(0.5, zoom.value - 0.1);
}
function scrollToday() {
  if (!scrollHost.value || todayX.value < 0) return;
  scrollHost.value.scrollTo({ 
    left: Math.max(0, todayX.value - hostWidth.value * 0.3), 
    behavior: "smooth" 
  });
}

/* ===== Data load ===== */
async function loadData(projectId) {
  ready.value = false;
  stones.value = [];
  colorMap.clear();

  const root = await fetchStones(projectId);
  const ids = collectIds(root);
  const results = await Promise.allSettled(ids.map((id) => fetchTasks(id)));
  const map = new Map();
  results.forEach((r, i) => map.set(ids[i], r.status === "fulfilled" ? r.value : []));

  assignColors(root);
  attachTasks(root, map);
  stones.value = root;

  ready.value = true;
  await nextTick();
  fitScrollHeight();
}
function collectIds(arr) {
  const out = [];
  arr.forEach((s) => {
    out.push(s.stoneId);
    if (Array.isArray(s.childStone)) out.push(...collectIds(s.childStone));
  });
  return out;
}

/* ===== Effects ===== */
watch(
  () => props.projectId,
  (v) => v && loadData(v),
  { immediate: true }
);
watch(
  () => [props.projectStart, props.projectEnd],
  async () => {
    await loadData(props.projectId);
    await nextTick();
  }
);
watch(
  () => viewMode.value,
  () => {
    // 뷰 모드 변경 시 줌 리셋 또는 조정
    nextTick(() => {
      if (scrollHost.value && todayX.value >= 0) {
        scrollToday();
      }
    });
  }
);

onMounted(() => {
  const roHost = new ResizeObserver(([e]) => (hostWidth.value = e.contentRect.width));
  if (scrollHost.value) roHost.observe(scrollHost.value);

  const roDoc = new ResizeObserver(() => fitScrollHeight());
  roDoc.observe(document.body);

  fitScrollHeight();
  window.addEventListener("resize", fitScrollHeight);

  watchEffect(() => {
    if (todayX.value >= 0 && ready.value) scrollToday();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", fitScrollHeight);
});
</script>

<style scoped>
/* === 컨테이너 - 마일스톤 탭과 동일한 크기 === */
.orbit-gantt-wrap {
  position: fixed;
  top: 240px;
  left: 280px;
  right: 16px;
  bottom: 15px;
  width: auto;
  height: auto;
  background: #FFFFFF;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* === 툴바 === */
.gantt-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #E5E5E5;
  background: #FAFAFA;
  flex-shrink: 0;
}

.gantt-toolbar .left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.gantt-toolbar .left strong {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.view-mode {
  display: flex;
  gap: 0;
  border: 1px solid #DDD;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.view-btn {
  padding: 6px 16px;
  border: none;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  border-right: 1px solid #DDD;
}

.view-btn:last-child {
  border-right: none;
}

.view-btn:hover {
  background: #F7F7F7;
}

.view-btn.active {
  background: #4C9AFF;
  color: #fff;
  font-weight: 600;
}

.view-btn.active:hover {
  background: #3A8AEF;
}

.gantt-toolbar .right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  border: 1px solid #DDD;
  border-radius: 6px;
  background: #fff;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  color: #333;
}

.btn:hover {
  background: #F7F7F7;
  border-color: #BBB;
}

.btn-today {
  background: #333;
  color: #fff;
  border-color: #333;
  font-weight: 500;
}

.btn-today:hover {
  background: #444;
  border-color: #444;
}

.zoom {
  font-size: 13px;
  color: #666;
  min-width: 50px;
  text-align: center;
  font-weight: 500;
}

/* === 스크롤 박스 === */
.gantt-scroll {
  flex: 1;
  overflow: auto;
  cursor: grab;
  position: relative;
  display: flex;
  min-height: 0;
}

.gantt-scroll:active {
  cursor: grabbing;
}

/* === 빈 상태 === */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #888;
  gap: 16px;
  width: 100%;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4c9aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* === 작업 목록 영역 === */
.gantt-task-list {
  position: sticky;
  left: 0;
  z-index: 10;
  background: #fff;
  border-right: 2px solid #E5E5E5;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.task-list-header {
  position: sticky;
  top: 0;
  z-index: 11;
  background: #F8F9FA;
  border-bottom: 2px solid #E5E5E5;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.task-list-body {
  flex: 1;
}

.task-row {
  height: 40px;
  border-bottom: 1px solid #F0F0F0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.task-row.even {
  background: #fff;
}

.task-row:not(.even) {
  background: #FAFAFA;
}

.task-row:hover {
  background: #F0F7FF;
}

.task-row.is-task {
  padding-left: 32px;
  font-size: 13px;
}

.task-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  font-size: 14px;
  color: #333;
}

.task-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.task-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-icon {
  color: #999;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
  padding: 2px 6px;
  margin-left: 4px;
}

.collapse-icon:hover {
  color: #4C9AFF;
}

/* === 타임라인 영역 === */
.gantt-timeline {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.timeline-header {
  position: sticky;
  top: 0;
  z-index: 9;
  background: #fff;
}

.month-row {
  height: 32px;
  position: relative;
  display: flex;
  border-bottom: 1px solid #E5E5E5;
}

.month-cell {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  border-right: 1px solid #E5E5E5;
}

.month-cell:last-child {
  border-right: none;
}

.day-row {
  height: 36px;
  position: relative;
  border-bottom: 1px solid #E5E5E5;
  display: flex;
}

.day-cell {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  border-right: 1px solid #F0F0F0;
}

.day-cell.is-weekend {
  background: #FAFAFA;
}

.day-cell.is-today {
  color: #4C9AFF;
  font-weight: 700;
  background: #F0F7FF;
}

.today-indicator {
  position: absolute;
  top: -10px;
  z-index: 12;
  pointer-events: none;
}

.today-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #4C9AFF;
  background: #fff;
  box-shadow: 0 2px 4px rgba(76, 154, 255, 0.3);
}

/* === 본문 영역 === */
.timeline-body {
  position: relative;
  flex: 1;
}

.grid-row {
  position: absolute;
  left: 0;
  right: 0;
  border-bottom: 1px solid #F0F0F0;
}

.grid-row.even {
  background: #fff;
}

.grid-row:not(.even) {
  background: #FAFAFA;
}

.today-vertical-line {
  position: absolute;
  top: 0;
  width: 2px;
  background: #4C9AFF;
  z-index: 5;
  pointer-events: none;
}

.today-vertical-line::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -5px;
  width: 12px;
  height: 12px;
  background: #4C9AFF;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(76, 154, 255, 0.4);
}

/* === 간트 바 === */
.gantt-bar-wrapper {
  position: absolute;
  z-index: 6;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.gantt-bar-wrapper:hover {
  transform: translateY(-1px);
  z-index: 7;
}

.bar-background {
  width: 100%;
  height: 100%;
  border: 1.5px solid;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}

.gantt-bar-wrapper:hover .bar-background {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bar-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  opacity: 0.95;
  transition: width 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.bar-hover {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(255, 255, 255, 0.15);
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 6px;
}

.gantt-bar-wrapper:hover .bar-hover {
  opacity: 1;
}

/* === 툴팁 === */
.tooltip {
  position: absolute;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  color: #333;
  z-index: 1000;
  backdrop-filter: blur(8px);
  min-width: 220px;
  pointer-events: none;
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #F0F0F0;
}

.tooltip-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.tooltip-name {
  font-weight: 600;
  color: #333;
  flex: 1;
  font-size: 14px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.tooltip-label {
  color: #666;
  font-size: 12px;
}

.tooltip-value {
  font-weight: 500;
  color: #333;
  font-size: 12px;
}

.today-mark {
  color: #4C9AFF;
  font-weight: 600;
  margin-top: 4px;
  font-size: 12px;
}
</style>
