<template>
  <div class="orbit-gantt-wrap">
    <!-- ✅ 상단 툴바 -->
    <div class="gantt-toolbar">
      <div class="left"><strong>간트차트</strong></div>
      <div class="right">
        <button class="btn" @click="zoomOut">－</button>
        <span class="zoom">{{ Math.round(zoom * 100) }}%</span>
        <button class="btn" @click="zoomIn">＋</button>
        <button class="btn" @click="scrollToday">Today</button>
      </div>
    </div>

    <!-- ✅ 스크롤 컨테이너 -->
    <div
      ref="scrollHost"
      class="gantt-scroll"
      @wheel="onWheelScroll"
      @mousedown="onMouseDown"
      @mouseup="onMouseUp"
      @mousemove="onMouseDrag"
    >
      <div v-if="!ready" class="empty">데이터 불러오는 중…</div>

      <template v-else>
        <!-- 날짜 헤더 -->
        <svg :width="svgWidth" :height="headerHeight" class="gantt-axis">
        <g v-for="(m, i) in months" :key="m.key">
          <rect
            :x="m.x"
            y="0"
            :width="m.w"
            :height="headerMonthHeight"
            :class="['axis-month-bg', i % 2 === 0 ? 'even' : 'odd']"
          />
          <text
            :x="m.x + 8"
            :y="headerMonthHeight - 10"
            class="axis-month-text"
          >
            {{ m.label }}
          </text>
        </g>
          <g v-for="d in days" :key="d.key">
            <rect :x="d.x" :y="headerMonthHeight" :width="d.w" :height="headerDayHeight" class="axis-day-bg" />
            <text :x="d.x + 6" :y="headerMonthHeight + headerDayHeight - 8" class="axis-day-text">{{ d.label }}</text>
          </g>
          
          <!-- 오늘 날짜 하이라이트 -->
          <g v-if="todayX >= 0">
            <!-- 오늘 날짜 점선 -->
            <line
              :x1="todayX"
              :y1="0"
              :x2="todayX"
              :y2="headerHeight"
              class="today-dashed-line"
            />

            <!-- 오늘 날짜 원형 테두리 -->
            <circle
              :cx="todayX"
              :cy="headerMonthHeight + headerDayHeight - 13"
              r="10"
              class="today-circle"
            />
          </g>
        </svg>

        <!-- 본문 -->
        <svg :width="svgWidth" :height="bodyHeight" class="gantt-body">
          <g v-for="(row, i) in visibleRows" :key="row.key">
            <rect :x="0" :y="row.y" :width="svgWidth" :height="rowHeight" :class="['grid-row', row.even ? 'even' : 'odd']" />
          </g>

          <!-- 오늘 라인 -->
          <line v-if="todayX >= 0" :x1="todayX" y1="0" :x2="todayX" :y2="bodyHeight" class="today-line" />

          <!-- 연결선 -->
          <g v-for="dep in dependencies" :key="dep.key">
            <path :d="dep.path" class="dep-link" />
          </g>

          <!-- 바 -->
          <g
            v-for="(b, i) in visibleBars"
            :key="b.key"
            @mouseenter="showTooltip(b, $event)"
            @mouseleave="hideTooltip"
            @click="toggleCollapse(b)"
          >
            <!-- 색상 계산 -->
            <rect
              :x="b.x"
              :y="b.y"
              :width="b.w"
              :height="barHeight"
              rx="6"
              :fill="getBarColor(b, i).base"
              :stroke="getBarColor(b, i).border"
              class="bar"
              :data-task="b.isTask"
            />

            <!-- 진행률 -->
            <rect
              :x="b.x"
              :y="b.y"
              :width="Math.max(2, b.w * (b.progress / 100))"
              :height="barHeight"
              rx="6"
              :fill="getBarColor(b, i).progress"
              class="bar-progress"
            />

            <!-- 바 오른쪽 텍스트 -->
            <text
              :x="b.x + b.w + 10"
              :y="b.y + barHeight / 1.5"
              class="bar-label"
            >
              {{ b.name }}
            </text>
          </g>

        </svg>

        <!-- 툴팁 -->
        <div v-show="tooltip.visible" class="tooltip" :style="tooltip.style">
          <div class="t-name">{{ tooltip.data.name }}</div>
          <div class="t-line"><span>기간</span><span>{{ tooltip.data.start }} ~ {{ tooltip.data.end }}</span></div>
          <div class="t-line"><span>진행률</span><span>{{ tooltip.data.progress }}%</span></div>
          <div v-if="tooltip.isToday" class="t-line today-mark">🌟 오늘 해당</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, watchEffect, nextTick } from "vue";
import axios from "axios";

const props = defineProps({
  projectId: { type: String, required: true },
  projectStart: { type: String, default: null },
  projectEnd: { type: String, default: null },
});

watch(
  () => [props.projectStart, props.projectEnd],
  async ([newStart, newEnd]) => {
    console.log("📅 프로젝트 기간 변경됨:", newStart, newEnd);
    await loadData(props.projectId);
    await nextTick();
  }
);

/* === 기본 변수 === */
const rowHeight = 40;
const barHeight = 20;
const headerMonthHeight = 26;
const headerDayHeight = 32;
const headerHeight = headerMonthHeight + headerDayHeight;
const pxPerDayBase = 32;

const zoom = ref(1);
const scrollHost = ref(null);
const hostWidth = ref(1200);
const ready = ref(false);
const collapsedSet = ref(new Set());

/* === 날짜 계산 === */
const parse = (x) => new Date(x);
const dayDiff = (a, b) => Math.round((a - b) / 86400000);
const toDateOnly = (d) => d.toISOString().slice(0, 10);

function isToday(dateStr) {
  const today = new Date();
  return dateStr === toDateOnly(today);
}

const todayCircleX = computed(() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return dayDiff(t, minStart.value) * pxPerDay.value + pxPerDay.value / 2;
});


// === 날짜축 ===
const months = computed(() => {
  if (!flat.value.length) return [];
  const arr = [];
  const start0 = new Date(minStart.value);
  start0.setDate(1);
  let cursor = start0;
  while (cursor <= maxEnd.value) {
    const label =
      `${cursor.getFullYear()}.` + `${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const start = new Date(cursor);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    arr.push({
      key: label,
      label,
      x: Math.max(0, dayDiff(start, minStart.value) * pxPerDay.value),
      w: (dayDiff(end, start) + 1) * pxPerDay.value,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  console.log("✅ months:", arr);
  return arr;
});

const days = computed(() => {
  if (!flat.value.length) return [];
  const arr = [];
  const d = new Date(minStart.value);
  while (d <= maxEnd.value) {
    arr.push({
      key: toDateOnly(d),
      x: dayDiff(d, minStart.value) * pxPerDay.value,
      w: pxPerDay.value,
      label: String(d.getDate()).padStart(2, "0"),
    });
    d.setDate(d.getDate() + 1);
  }
  return arr;
});


/* === 색상 팔레트 === */
const colorPalette = ["#FFD93D", "#8CC0DE", "#C68FE6", "#6ECB63", "#FF9F68"];

// === 색상 자동 분배 (Phase별) ===
const phaseColors = [
  { base: "#E3D3FF", light: "#F4ECFF", border: "#BFA3FF", progress: "#9B6BFF" }, // 보라
  { base: "#BFDFFF", light: "#E5F3FF", border: "#8CC4FF", progress: "#4C9AFF" }, // 파랑
  { base: "#FFD1E3", light: "#FFE8F2", border: "#FF9EBE", progress: "#FF5A8A" }, // 분홍
  { base: "#FFF3C2", light: "#FFF9E3", border: "#FFE37E", progress: "#FFD93D" }, // 노랑
];

// index에 따라 자동 배정
function getBarColor(b, index) {
  const phaseIndex = index % phaseColors.length;
  const color = phaseColors[phaseIndex];

  // 스톤(상위) vs 태스크(하위)
  if (!b.isTask) {
    return {
      base: color.base,
      border: color.border,
      progress: color.progress,
    };
  } else {
    return {
      base: color.light,
      border: color.border,
      progress: color.progress,
    };
  }
}


/* === 데이터 === */
const stones = ref([]);

/* === API === */
async function fetchStones(projectId) {
  const { data } = await axios.get(`/workspace-service/project/stones/${projectId}`);
  return data.result || [];
}

async function fetchTasks(stoneId) {
  const { data } = await axios.get(`/workspace-service/task/${stoneId}`);
  return data.result || [];
}

async function loadData(projectId) {
  ready.value = false;
  stones.value = [];

  const root = await fetchStones(projectId);
  const ids = collectIds(root);
  const results = await Promise.allSettled(ids.map((id) => fetchTasks(id)));
  const map = new Map();
  results.forEach((r, i) => map.set(ids[i], r.status === "fulfilled" ? r.value : []));

  attachTasks(root, map);
  stones.value = root;
  ready.value = true;
  await nextTick();
  fitScrollHeight();   // 데이터 반영 후 세로 max-height 재계산
}

function collectIds(arr) {
  const out = [];
  arr.forEach((s) => {
    out.push(s.stoneId);
    if (Array.isArray(s.childStone)) out.push(...collectIds(s.childStone));
  });
  return out;
}

function attachTasks(arr, map, color = null) {
  arr.forEach((s, i) => {
    const baseColor = color || colorPalette[i % colorPalette.length];
    s.__color = baseColor;
    s.taskList = map.get(s.stoneId) || [];
    if (Array.isArray(s.childStone)) attachTasks(s.childStone, map, baseColor);
  });
}

/* === 평탄화 === */
function flatten(arr, parentId = null, color = null) {
  const out = [];
  arr.forEach((s, i) => {
    const baseColor = color || s.__color || colorPalette[i % colorPalette.length];
    out.push({
      id: s.stoneId,
      name: s.stoneName,
      start: parse(s.startTime),
      end: parse(s.endTime),
      progress: s.milestone || 0,
      color: baseColor,
      parentId,
      isTask: false,
      hasChildren: (s.taskList?.length || 0) + (s.childStone?.length || 0) > 0,
    });

    if (Array.isArray(s.taskList) && !collapsedSet.value.has(s.stoneId)) {
      s.taskList.forEach((t) =>
        out.push({
          id: t.taskId,
          name: "　↳ " + t.taskName,
          start: parse(t.startTime),
          end: parse(t.endTime),
          progress: t.progress || 0,
          color: baseColor + "99",
          parentId: s.stoneId,
          isTask: true,
        })
      );
    }

    if (Array.isArray(s.childStone) && !collapsedSet.value.has(s.stoneId)) {
      out.push(...flatten(s.childStone, s.stoneId, baseColor));
    }
  });
  return out;
}

const flat = computed(() => flatten(stones.value));

/* === 좌표 === */
// const minStart = computed(() => (flat.value.length ? new Date(Math.min(...flat.value.map((s) => s.start))) : new Date()));
// const maxEnd = computed(() => (flat.value.length ? new Date(Math.max(...flat.value.map((s) => s.end))) : new Date()));
const minStart = computed(() => {
  const projectStart = props.projectStart ? new Date(props.projectStart) : null;
  const dataStart = flat.value.length ? new Date(Math.min(...flat.value.map((s) => s.start))) : null;
  if (projectStart && dataStart) return new Date(Math.min(projectStart, dataStart));
  return projectStart || dataStart || new Date();
});

const maxEnd = computed(() => {
  const projectEnd = props.projectEnd ? new Date(props.projectEnd) : null;
  const dataEnd = flat.value.length ? new Date(Math.max(...flat.value.map((s) => s.end))) : null;
  if (projectEnd && dataEnd) return new Date(Math.max(projectEnd, dataEnd));
  return projectEnd || dataEnd || new Date();
});

const totalDays = computed(() => Math.max(1, dayDiff(maxEnd.value, minStart.value) + 1));
const pxPerDay = computed(() => pxPerDayBase * zoom.value);
const svgWidth = computed(() => totalDays.value * pxPerDay.value + 200);
const bodyHeight = computed(() => flat.value.length * rowHeight);

const bars = computed(() =>
  flat.value.map((s, i) => {
    const x = dayDiff(s.start, minStart.value) * pxPerDay.value;
    const w = Math.max(pxPerDay.value, (dayDiff(s.end, s.start) + 1) * pxPerDay.value);
    const y = i * rowHeight + 10;
    return {
      key: s.id,
      id: s.id,
      x,
      y,
      w,
      name: s.name,
      progress: s.progress,
      start: toDateOnly(s.start),
      end: toDateOnly(s.end),
      color: s.color + "33",
      colorDark: s.color,
      parentId: s.parentId,
      hasChildren: s.hasChildren,
    };
  })
);

const visibleBars = computed(() => bars.value);
const visibleRows = computed(() => flat.value.map((_, i) => ({ key: i, y: i * rowHeight, even: i % 2 === 0 })));

const todayX = computed(() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);

  // 하루 단위 비교를 위해 날짜만 비교
  const startDate = new Date(minStart.value);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(maxEnd.value);
  endDate.setHours(0, 0, 0, 0);

  console.log("✅ today:", t, "minStart:", minStart.value, "maxEnd:", maxEnd.value, "todayX:", todayX.value);

  if (t < startDate || t > endDate) return -1;

  return dayDiff(t, minStart.value) * pxPerDay.value + pxPerDay.value / 2;
});

const dependencies = computed(() => {
  const byId = new Map(bars.value.map((b) => [b.key, b]));
  const out = [];
  bars.value.forEach((b) => {
    if (b.parentId && byId.has(b.parentId)) {
      const p = byId.get(b.parentId);
      const x1 = p.x + p.w,
        y1 = p.y + barHeight / 2;
      const x2 = b.x,
        y2 = b.y + barHeight / 2;
      const mx = (x1 + x2) / 2;
      out.push({ key: `${p.key}->${b.key}`, path: `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}` });
    }
  });
  return out;
});

/* === 이벤트 === */
function toggleCollapse(b) {
  if (!b.hasChildren) return;
  if (collapsedSet.value.has(b.id)) collapsedSet.value.delete(b.id);
  else collapsedSet.value.add(b.id);
}

/* === 툴팁 === */
const tooltip = ref({ visible: false, data: {}, style: {} });
function showTooltip(b, ev) {
  tooltip.value.visible = true;
  tooltip.value.data = b;

  // 오늘 날짜 포함 여부 체크
  const today = new Date().toISOString().slice(0, 10);
  tooltip.value.isToday = b.start <= today && b.end >= today;
  
  tooltip.value.style = { left: `${ev.clientX + 12}px`, top: `${ev.clientY + 12}px` };
}
function hideTooltip() {
  tooltip.value.visible = false;
}

/* === 스크롤 === */
let dragging = false;
let dragStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };
const hostHeight = ref(480);

function fitScrollHeight() {
  if (!scrollHost.value) return;
  // 카드 안에서 스크롤 박스의 top 기준으로 남은 화면 높이 계산
  const rect = scrollHost.value.getBoundingClientRect();
  const available = window.innerHeight - rect.top - 16; // 하단 여백 16px
  hostHeight.value = Math.max(320, available); // 최소 320px 보장
  scrollHost.value.style.maxHeight = hostHeight.value + 'px';
}

onMounted(() => {
  const ro = new ResizeObserver(() => fitScrollHeight());
  ro.observe(document.body); // 레이아웃 변동 감지
  fitScrollHeight();
  window.addEventListener('resize', fitScrollHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', fitScrollHeight);
});

function onWheelScroll(e) {
  if (!scrollHost.value) return;
  // 기본: 세로 스크롤, Shift 키 눌렀을 때만 가로 스크롤
  if (e.shiftKey) {
    scrollHost.value.scrollLeft += e.deltaY * 1.2; // 좌우
  } else {
    scrollHost.value.scrollTop += e.deltaY * 1.2; // 상하
  }
  e.preventDefault(); // 휠 이벤트가 문서 전체로 전파되지 않도록
}

function onMouseDown(e) {
  dragging = true;
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    scrollLeft: scrollHost.value.scrollLeft,
    scrollTop: scrollHost.value.scrollTop,
  };
}

function onMouseUp() {
  dragging = false;
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
  scrollHost.value.scrollTo({ left: Math.max(0, todayX.value - hostWidth.value * 0.3), behavior: "smooth" });
}

/* === 마운트 === */
onMounted(() => {
  const ro = new ResizeObserver(([e]) => (hostWidth.value = e.contentRect.width));
  ro.observe(scrollHost.value);

  // 간트가 로드되면 오늘 날짜로 자동 스크롤
  watchEffect(() => {
    if (todayX.value >= 0 && ready.value) {
      scrollToday();
    }
  });
});

watch(
  () => props.projectId,
  (v) => {
    console.log("[OrbitGantt] projectId =", v);
    loadData(v);
  },
  { immediate: true }
);
</script>

<style scoped>
.orbit-gantt-wrap {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: auto;
}

/* === 상단 툴바 === */
.gantt-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}
.btn {
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  margin-left: 6px;
  padding: 4px 10px;
  cursor: pointer;
}
.btn:hover {
  background: #f7f7f7;
}

/* === 스크롤 === */
.gantt-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 60vh;
  min-height: 320px;
  cursor: grab;
  position: relative;
}

/* === 비어있는 상태 === */
.empty {
  padding: 24px;
  color: #888;
}

/* === 헤더 === */
.axis-month-bg {
  fill: #f3f3f3;
}
.axis-day-bg {
  fill: #ffffff;
}
.axis-month-text {
  font-size: 13px;
  fill: #333;
  font-weight: 600;
}
.axis-day-text {
  font-size: 11px;
  fill: #666;
}
.axis-month-bg.even {
  fill: #f6e787;
}
.axis-month-bg.odd {
  fill: #fbb980;
}

/* === 행 === */
.grid-row.even {
  fill: #fff;
}
.grid-row.odd {
  fill: #fcfcfc;
}

/* === 바 (스톤/태스크 구분) === */
.bar {
  rx: 6;
  transition: transform 0.2s ease, opacity 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
}

.bar:hover {
  transform: scale(1.02);
  opacity: 0.95;
}

.bar-progress {
  opacity: 0.85;
}

.bar-label {
  fill: #333;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  dominant-baseline: middle;
  text-anchor: start;
}

/* Phase 구분을 더 자연스럽게 보이게 */
.grid-row.odd {
  fill: #fafafa;
}
.grid-row.even {
  fill: #fff;
}

/* 접기 아이콘 */
.collapse-icon {
  font-size: 12px;
  fill: #888;
}

/* === 연결선 === */
.dep-link {
  stroke: #cfd3d8;
  stroke-width: 1.2;
  fill: none;
  opacity: 0.8;
}

/* === 오늘 === */
.today-line {
  stroke: #4c9aff;
  stroke-width: 2;
  stroke-dasharray: 4 4;
  opacity: 0.9;
}
.today-dashed-line {
  stroke: #4c9aff;
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
  opacity: 0.9;
}
.today-circle {
  fill: none;
  stroke: #4c9aff;
  stroke-width: 2;
}
.axis-day-text.today-text {
  fill: #4c9aff;
  font-weight: 700;
}

/* === 툴팁 === */
.tooltip {
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  color: #333;
  z-index: 9999;
  backdrop-filter: blur(4px);
}
.tooltip .t-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.tooltip .t-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.tooltip .today-mark {
  color: #4c9aff;
  font-weight: 600;
  margin-top: 4px;
}
</style>
