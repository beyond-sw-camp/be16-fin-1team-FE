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
            <text :x="m.x + 8" :y="headerMonthHeight - 10" class="axis-month-text">
              {{ m.label }}
            </text>
          </g>

          <g v-for="d in days" :key="d.key">
            <rect
              :x="d.x"
              :y="headerMonthHeight"
              :width="d.w"
              :height="headerDayHeight"
              class="axis-day-bg"
            />
            <text
              :x="d.x + 6"
              :y="headerMonthHeight + headerDayHeight - 8"
              class="axis-day-text"
            >
              {{ d.label }}
            </text>
          </g>

          <!-- 오늘 가이드 -->
          <g v-if="todayX >= 0">
            <line :x1="todayX" y1="0" :x2="todayX" :y2="headerHeight" class="today-dashed-line" />
            <circle :cx="todayX" :cy="headerMonthHeight + headerDayHeight - 13" r="10" class="today-circle" />
          </g>
        </svg>

        <!-- 본문 -->
        <svg :width="svgWidth" :height="bodyHeight" class="gantt-body">
          <!-- 줄무늬 -->
          <g v-for="(row, i) in visibleRows" :key="row.key">
            <rect
              :x="0"
              :y="row.y"
              :width="svgWidth"
              :height="rowHeight"
              :class="['grid-row', row.even ? 'even' : 'odd']"
            />
          </g>

          <!-- 오늘 라인 -->
          <line v-if="todayX >= 0" :x1="todayX" y1="0" :x2="todayX" :y2="bodyHeight" class="today-line" />

          <!-- 연결선 -->
          <g v-for="dep in dependencies" :key="dep.key">
            <path :d="dep.path" class="dep-link" />
          </g>

          <!-- 바 -->
          <g
            v-for="b in visibleBars"
            :key="b.key"
            @mouseenter="showTooltip(b, $event)"
            @mouseleave="hideTooltip"
            @click="toggleCollapse(b)"
          >
            <!-- 배경 바: 스톤=진한(88), 태스크=연한(44) -->
            <rect
              :x="b.x"
              :y="b.y"
              :width="b.w"
              :height="barHeight"
              rx="6"
              :fill="b.isTask ? b.color + '44' : b.color + '88'"
              :stroke="b.color"
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
              :fill="b.color"
              class="bar-progress"
            />

            <!-- 라벨 -->
            <text :x="b.x + b.w + 10" :y="b.y + barHeight / 1.5" class="bar-label">

              <tspan :fill="b.color">●</tspan>
              {{ b.name }}
              <!-- ▼/▶ 접기 아이콘 -->
              <tspan
                v-if="b.hasChildren"
                class="collapse-icon"
                @click.stop="toggleCollapse(b)"
              >
                {{ collapsedSet.has(b.id) ? '▶' : '▼' }}
              </tspan>
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

/* ===== Props ===== */
const props = defineProps({
  projectId: { type: String, required: true },
  projectStart: { type: String, default: null },
  projectEnd:   { type: String, default: null },
});

/* ===== Layout consts ===== */
const rowHeight = 40;
const barHeight = 20;
const headerMonthHeight = 26;
const headerDayHeight = 32;
const headerHeight = headerMonthHeight + headerDayHeight;
const pxPerDayBase = 32;

/* ===== Refs ===== */
const zoom = ref(1);
const ready = ref(false);
const scrollHost = ref(null);
const hostWidth = ref(1200);
const hostHeight = ref(480);
const collapsedSet = ref(new Set());

/* ===== Data ===== */
const stones = ref([]);
const colorPalette = ["#9B6BFF", "#4C9AFF", "#FF5A8A", "#FFD93D", "#6ECB63", "#FF9F68"];
const colorMap = new Map(); // stoneId -> color

/* ===== Utils ===== */
const parse = (x) => new Date(x);
const toDateOnly = (d) => d.toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((a - b) / 86400000);

/* ===== API ===== */
async function fetchStones(projectId) {
  const { data } = await axios.get(`/workspace-service/project/stones/${projectId}`);
  return data.result || [];
}
async function fetchTasks(stoneId) {
  const { data } = await axios.get(`/workspace-service/task/${stoneId}`);
  return data.result || [];
}

/* ===== Attach tasks & assign colors (stone 고정색 + 하위 계승) ===== */
function attachTasks(arr, map, parentColor = null, depth = 0) {
  arr.forEach((s, i) => {
    const color = parentColor || colorPalette[(i + depth) % colorPalette.length];
    colorMap.set(String(s.stoneId), color);
    s.__color = color;
    s.taskList = map.get(s.stoneId) || [];
    if (Array.isArray(s.childStone) && s.childStone.length) {
      attachTasks(s.childStone, map, color, depth + 1);
    }
  });
}

/* ===== Flatten (태스크는 부모색 그대로) ===== */
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
const totalDays = computed(() => Math.max(1, dayDiff(maxEnd.value, minStart.value) + 1));
const pxPerDay = computed(() => pxPerDayBase * zoom.value);
const svgWidth = computed(() => totalDays.value * pxPerDay.value + 200);
const bodyHeight = computed(() => flat.value.length * rowHeight);

/* ===== Axis ===== */
const months = computed(() => {
  if (!flat.value.length) return [];
  const arr = [];
  const start0 = new Date(minStart.value);
  start0.setDate(1);
  let cursor = start0;
  while (cursor <= maxEnd.value) {
    const label = `${cursor.getFullYear()}.${String(cursor.getMonth() + 1).padStart(2, "0")}`;
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

/* ===== Bars & links ===== */
const bars = computed(() =>
  flat.value.map((s, i) => {
    const x = dayDiff(s.start, minStart.value) * pxPerDay.value;
    const w = Math.max(pxPerDay.value, (dayDiff(s.end, s.start) + 1) * pxPerDay.value);
    const y = i * rowHeight + 10;
    return {
      key: s.id,
      id: s.id,
      x, y, w,
      name: s.name,
      progress: s.progress,
      start: toDateOnly(s.start),
      end: toDateOnly(s.end),
      color: s.color,        // HEX(예: #9B6BFF)
      parentId: s.parentId,
      isTask: s.isTask,
      hasChildren: s.hasChildren,
    };
  })
);
const visibleBars = computed(() => bars.value);
const visibleRows = computed(() => flat.value.map((_, i) => ({ key: i, y: i * rowHeight, even: i % 2 === 0 })));

const dependencies = computed(() => {
  const byId = new Map(bars.value.map((b) => [b.key, b]));
  const out = [];
  bars.value.forEach((b) => {
    if (b.parentId && byId.has(b.parentId)) {
      const p = byId.get(b.parentId);
      const x1 = p.x + p.w, y1 = p.y + barHeight / 2;
      const x2 = b.x,       y2 = b.y + barHeight / 2;
      const mx = (x1 + x2) / 2;
      out.push({ key: `${p.key}->${b.key}`, path: `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}` });
    }
  });
  return out;
});

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
  tooltip.value.style = { left: `${ev.clientX + 12}px`, top: `${ev.clientY + 12}px` };
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

/* ===== Scroll/Zoom/Drag ===== */
let dragging = false;
let dragStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

function fitScrollHeight() {
  if (!scrollHost.value) return;
  const rect = scrollHost.value.getBoundingClientRect();
  const available = window.innerHeight - rect.top - 16;
  hostHeight.value = Math.max(320, available);
  scrollHost.value.style.maxHeight = hostHeight.value + "px";
}
function onWheelScroll(e) {
  if (!scrollHost.value) return;
  if (e.shiftKey) scrollHost.value.scrollLeft += e.deltaY * 1.2;
  else            scrollHost.value.scrollTop  += e.deltaY * 1.2;
  e.preventDefault();
}
function onMouseDown(e) {
  dragging = true;
  dragStart = {
    x: e.clientX, y: e.clientY,
    scrollLeft: scrollHost.value.scrollLeft,
    scrollTop:  scrollHost.value.scrollTop,
  };
}
function onMouseUp()   { dragging = false; }
function onMouseDrag(e) {
  if (!dragging || !scrollHost.value) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  scrollHost.value.scrollLeft = dragStart.scrollLeft - dx;
  scrollHost.value.scrollTop  = dragStart.scrollTop  - dy;
}
function zoomIn()  { zoom.value = Math.min(3,   zoom.value + 0.1); }
function zoomOut() { zoom.value = Math.max(0.5, zoom.value - 0.1); }
function scrollToday() {
  if (!scrollHost.value || todayX.value < 0) return;
  scrollHost.value.scrollTo({ left: Math.max(0, todayX.value - hostWidth.value * 0.3), behavior: "smooth" });
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

  attachTasks(root, map);   // 색상 & 태스크 주입
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

onMounted(() => {
  // 가시영역 폭 추적
  const roHost = new ResizeObserver(([e]) => (hostWidth.value = e.contentRect.width));
  if (scrollHost.value) roHost.observe(scrollHost.value);

  // 높이 자동 맞춤
  const roDoc = new ResizeObserver(() => fitScrollHeight());
  roDoc.observe(document.body);

  fitScrollHeight();
  window.addEventListener("resize", fitScrollHeight);

  // 로드 후 오늘로 스크롤
  watchEffect(() => {
    if (todayX.value >= 0 && ready.value) scrollToday();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", fitScrollHeight);
});
</script>

<style scoped>
/* === 컨테이너 === */
.orbit-gantt-wrap {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
}

/* === 툴바 === */
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
.btn:hover { background: #f7f7f7; }

/* === 스크롤 박스 === */
.gantt-scroll {
  flex: 1;
  overflow: auto;
  min-height: 320px;
  cursor: grab;
  position: relative;
}

/* === 빈 상태 === */
.empty { padding: 24px; color: #888; }

/* === 헤더 === */
.axis-month-bg { fill: #f3f3f3; }
.axis-day-bg   { fill: #ffffff; }
.axis-month-text { font-size: 13px; fill: #333; font-weight: 600; }
.axis-day-text   { font-size: 11px; fill: #666; }
.axis-month-bg.even { fill: #f6e787; }
.axis-month-bg.odd  { fill: #fbb980; }

/* === 행 === */
.grid-row.even { fill: #fff; }
.grid-row.odd  { fill: #fafafa; }

/* === 바 === */
.bar {
  rx: 6;
  transition: transform 0.15s ease, opacity 0.15s ease;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.06));
  opacity: 0.9;      /* 기본 약간 투명 */
}
.bar:hover {
  transform: scale(1.02);
  opacity: 1;        /* hover 시 또렷하게 */
}
.bar-progress { opacity: 0.95; }
.bar-label {
  fill: #333;
  font-size: 12px;
  font-weight: 500;
  dominant-baseline: middle;
  pointer-events: none;
}

/* === 연결선 === */
.dep-link {
  stroke: #cfd3d8;
  stroke-width: 1.2;
  fill: none;
  opacity: 0.8;
}

/* === 오늘 === */
.today-line { stroke: #4c9aff; stroke-width: 2; stroke-dasharray: 4 4; opacity: 0.9; }
.today-dashed-line { stroke: #4c9aff; stroke-width: 1.5; stroke-dasharray: 4 4; opacity: 0.9; }
.today-circle { fill: none; stroke: #4c9aff; stroke-width: 2; }
.axis-day-text.today-text { fill: #4c9aff; font-weight: 700; }

/* === 툴팁 === */
.tooltip {
  position: fixed;
  background: rgba(255,255,255,0.95);
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
  font-size: 12px;
  color: #333;
  z-index: 9999;
  backdrop-filter: blur(4px);
}
.tooltip .t-name { font-weight: 600; margin-bottom: 4px; }
.tooltip .t-line { display: flex; justify-content: space-between; gap: 10px; }
.tooltip .today-mark { color: #4c9aff; font-weight: 600; margin-top: 4px; }
.collapse-icon {
  fill: #888;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  margin-right: 4px;
  transition: fill 0.2s ease;
}
.collapse-icon:hover {
  fill: #555;
}

</style>
