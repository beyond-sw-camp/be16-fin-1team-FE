<template>
  <div class="orbit-gantt-wrap">
    <!-- 헤더/컨트롤 -->
    <div class="gantt-toolbar">
      <div class="left">
        <strong>간트차트</strong>
      </div>
      <div class="right">
        <button class="btn" @click="zoomOut">－</button>
        <span class="zoom">{{ Math.round(zoom * 100) }}%</span>
        <button class="btn" @click="zoomIn">＋</button>
        <button class="btn" @click="scrollToday">Today</button>
      </div>
    </div>

    <!-- 스크롤 영역 -->
    <div ref="scrollHost" class="gantt-scroll">
      <!-- 날짜 축 -->
      <svg
        :width="svgWidth"
        :height="headerHeight"
        class="gantt-axis"
        role="img"
        aria-label="date axis"
      >
        <!-- 월 헤더 -->
        <g v-for="m in months" :key="m.key">
          <rect :x="m.x" y="0" :width="m.w" :height="headerMonthHeight" class="axis-month-bg" />
          <text :x="m.x + 8" :y="headerMonthHeight - 10" class="axis-month-text">{{ m.label }}</text>
        </g>
        <!-- 일 헤더 -->
        <g v-for="d in days" :key="d.key">
          <rect :x="d.x" :y="headerMonthHeight" :width="d.w" :height="headerDayHeight" class="axis-day-bg" />
          <text :x="d.x + 6" :y="headerMonthHeight + headerDayHeight - 8" class="axis-day-text">{{ d.label }}</text>
        </g>
      </svg>

      <!-- 본문 -->
      <svg
        :width="svgWidth"
        :height="bodyHeight"
        class="gantt-body"
        role="img"
        aria-label="gantt chart"
        @mousemove="onMouseMove"
        @mouseleave="hideTooltip"
      >
        <!-- 그리드 줄 -->
        <g v-for="row in rows" :key="row.key">
          <rect :x="0" :y="row.y" :width="svgWidth" :height="rowHeight" :class="['grid-row', row.even ? 'even':'odd']"/>
        </g>

        <!-- Today 라인 -->
        <line
          v-if="todayX >= 0"
          :x1="todayX" y1="0"
          :x2="todayX" :y2="bodyHeight"
          class="today-line"
        />

        <!-- 의존선 (부모→자식) -->
        <g v-for="dep in dependencies" :key="dep.key">
          <path :d="dep.path" class="dep-link"/>
        </g>

        <!-- 바/프로그레스/라벨 -->
        <g v-for="b in bars" :key="b.key" class="bar-group"
           @mouseenter="showTooltip(b, $event)" @mouseleave="hideTooltip">
          <rect :x="b.x" :y="b.y" :width="b.w" :height="barHeight" rx="6" class="bar"/>
          <rect :x="b.x" :y="b.y" :width="Math.max(2, b.w * (b.progress/100))" :height="barHeight" rx="6" class="bar-progress"/>
          <text :x="b.x + 8" :y="b.y + barHeight - 6" class="bar-label">{{ b.name }}</text>
        </g>
      </svg>

      <!-- 툴팁 -->
      <div v-show="tooltip.visible" class="tooltip" :style="tooltip.style">
        <div class="t-name">{{ tooltip.data.name }}</div>
        <div class="t-line">
          <span>기간</span><span>{{ tooltip.data.start }} ~ {{ tooltip.data.end }}</span>
        </div>
        <div class="t-line">
          <span>진행률</span><span>{{ tooltip.data.progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  /** 스톤 배열 (상위/하위 포함 가능) */
  stones: { type: Array, default: () => [] },
});

/* ===================== 기본 상수/상태 ===================== */
const rowHeight = 40;            // 각 행 세로
const barHeight = 22;            // 막대 높이
const headerMonthHeight = 28;
const headerDayHeight = 24;
const headerHeight = headerMonthHeight + headerDayHeight;

const pxPerDayBase = 32;         // 기본 1일 픽셀
const zoom = ref(1);

const scrollHost = ref(null);
const hostWidth = ref(1200);     // 컨테이너 너비

/* ===================== 날짜 유틸 ===================== */
const parse = (x) => {
  if (!x) return null;
  // 'YYYY-MM-DD' 혹은 'YYYY-MM-DDTHH:mm:ss' 모두 허용
  const d = new Date(x);
  return isNaN(d.getTime()) ? null : d;
}
const toDateOnly = (d) => d.toISOString().slice(0,10);
const dayDiff = (a,b) => Math.round((a - b) / 86400000);

/* ===================== 데이터 평탄화 ===================== */
function flatten(stones) {
  const out = [];
  const walk = (arr, depth = 0, parentId = null) => {
    arr?.forEach((s) => {
      out.push({
        id: s.stoneId ?? s.id,
        name: s.stoneName ?? s.name ?? '이름 없음',
        start: parse(s.startTime),
        end: parse(s.endTime),
        progress: Number(s.milestone ?? s.progress ?? 0),
        parentId,
      });
      if (Array.isArray(s.childStone) && s.childStone.length) {
        walk(s.childStone, depth + 1, s.stoneId ?? s.id);
      }
    });
  };
  walk(stones);
  return out.filter(v => v.start && v.end && v.start <= v.end);
}

const flat = computed(() => flatten(props.stones));

/* ===================== 타임라인 범위 ===================== */
const minStart = computed(() => new Date(Math.min(...flat.value.map(s => s.start))));
const maxEnd   = computed(() => new Date(Math.max(...flat.value.map(s => s.end))));
const totalDays = computed(() => Math.max(1, dayDiff(maxEnd.value, minStart.value) + 1));
const pxPerDay  = computed(() => pxPerDayBase * zoom.value);

/* ===================== 가로/세로 크기 ===================== */
const svgWidth = computed(() => Math.ceil(totalDays.value * pxPerDay.value) + 200);
const bodyHeight = computed(() => Math.max(1, flat.value.length * rowHeight));

/* ===================== 행/바 데이터 ===================== */
const rows = computed(() =>
  flat.value.map((_, i) => ({
    key: `row_${i}`,
    y: i * rowHeight,
    even: i % 2 === 0,
  }))
);

const bars = computed(() =>
  flat.value.map((s, i) => {
    const x = Math.max(0, dayDiff(s.start, minStart.value) * pxPerDay.value);
    const w = Math.max(2, (dayDiff(s.end, s.start) + 1) * pxPerDay.value);
    const y = i * rowHeight + (rowHeight - barHeight) / 2;
    return {
      key: s.id ?? `bar_${i}`,
      x, y, w,
      name: s.name,
      start: toDateOnly(s.start),
      end: toDateOnly(s.end),
      progress: Math.min(100, Math.max(0, s.progress ?? 0)),
      id: s.id,
      parentId: s.parentId
    };
  })
);

/* ===================== Today 라인 ===================== */
const todayX = computed(() => {
  const t = new Date();
  t.setHours(0,0,0,0);
  if (t < minStart.value || t > maxEnd.value) return -1;
  return dayDiff(t, minStart.value) * pxPerDay.value + pxPerDay.value/2;
});

/* ===================== 의존선 (부모-자식) ===================== */
const dependencies = computed(() => {
  const byId = new Map(bars.value.map(b => [b.id, b]));
  const out = [];
  bars.value.forEach((b) => {
    if (b.parentId && byId.has(b.parentId)) {
      const p = byId.get(b.parentId);
      const x1 = p.x + p.w;               // 부모 끝
      const y1 = p.y + barHeight/2;
      const x2 = b.x;                     // 자식 시작
      const y2 = b.y + barHeight/2;
      const mx = Math.max(x1 + 16, (x1 + x2)/2);
      const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      out.push({ key: `${p.key}->${b.key}`, path });
    }
  });
  return out;
});

/* ===================== 날짜축 데이터 ===================== */
const months = computed(() => {
  const arr = [];
  let cursor = new Date(minStart.value);
  cursor.setDate(1);
  while (cursor <= maxEnd.value) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0); // 그 달의 마지막날
    const start = monthStart < minStart.value ? minStart.value : monthStart;
    const end   = monthEnd > maxEnd.value ? maxEnd.value : monthEnd;

    const x = dayDiff(start, minStart.value) * pxPerDay.value;
    const w = (dayDiff(end, start) + 1) * pxPerDay.value;
    const label = `${start.getFullYear()}.${String(start.getMonth()+1).padStart(2,'0')}`;

    arr.push({ key: `m_${label}`, x, w, label });
    cursor.setMonth(cursor.getMonth()+1, 1);
  }
  return arr;
});

const days = computed(() => {
  const arr = [];
  const d = new Date(minStart.value);
  while (d <= maxEnd.value) {
    const x = dayDiff(d, minStart.value) * pxPerDay.value;
    arr.push({
      key: `d_${toDateOnly(d)}`,
      x,
      w: pxPerDay.value,
      label: String(d.getDate()).padStart(2,'0')
    });
    d.setDate(d.getDate()+1);
  }
  return arr;
});

/* ===================== 툴팁 ===================== */
const tooltip = ref({ visible: false, data: {}, style: {} });

function showTooltip(b, ev) {
  tooltip.value.visible = true;
  tooltip.value.data = { name: b.name, start: b.start, end: b.end, progress: b.progress };
  tooltip.value.style = {
    left: `${ev.clientX + 12}px`,
    top:  `${ev.clientY + 12}px`,
  };
}
function hideTooltip() { tooltip.value.visible = false; }
function onMouseMove(ev) {
  if (!tooltip.value.visible) return;
  tooltip.value.style = { left: `${ev.clientX + 12}px`, top: `${ev.clientY + 12}px` };
}

/* ===================== 컨트롤 ===================== */
function zoomIn(){ zoom.value = Math.min(3, +(zoom.value + 0.1).toFixed(2)); }
function zoomOut(){ zoom.value = Math.max(0.4, +(zoom.value - 0.1).toFixed(2)); }
function scrollToday() {
  if (!scrollHost.value || todayX.value < 0) return;
  scrollHost.value.scrollTo({ left: Math.max(0, todayX.value - hostWidth.value * 0.4), behavior: 'smooth' });
}

/* 컨테이너 리사이즈 감지 */
onMounted(() => {
  const ro = new ResizeObserver(entries => {
    for (const e of entries) hostWidth.value = e.contentRect.width;
  });
  if (scrollHost.value) ro.observe(scrollHost.value);
});

/* stones 변경 시 자동 스크롤(처음만) */
let firstRendered = false;
watch(() => props.stones, () => {
  if (!firstRendered && todayX.value >= 0) {
    firstRendered = true;
    requestAnimationFrame(scrollToday);
  }
}, { deep: true, immediate: true });
</script>

<style scoped>
.orbit-gantt-wrap {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,.06);
  overflow: hidden;
}

/* toolbar */
.gantt-toolbar {
  display:flex; align-items:center; justify-content:space-between;
  padding: 10px 14px; border-bottom: 1px solid #eee;
  background: #fafafa;
}
.gantt-toolbar .btn{
  border:1px solid #ddd; background:#fff; padding:4px 10px;
  border-radius:8px; cursor:pointer; margin-left:6px;
}
.gantt-toolbar .btn:hover{ background:#f7f7f7; }
.gantt-toolbar .zoom{ display:inline-block; min-width:48px; text-align:center; }

/* scroll host */
.gantt-scroll {
  overflow: auto;
  max-height: 640px;
}

/* axis */
.gantt-axis { display:block; }
.axis-month-bg { fill:#f3f3f3; }
.axis-month-text { fill:#333; font-size:12px; }
.axis-day-bg { fill:#fafafa; }
.axis-day-text { fill:#666; font-size:11px; }

/* body / rows */
.gantt-body { display:block; }
.grid-row.even { fill: #ffffff; }
.grid-row.odd  { fill: #fcfcfc; }

/* bars */
.bar {
  fill: #fff7c2;
  stroke: #f3cc3d;
  stroke-width: 1.2px;
}
.bar-progress { fill:#ffd93d; }
.bar-label { fill:#333; font-size:12px; pointer-events:none; }

/* today & dependency */
.today-line { stroke:#ffb400; stroke-width:2; stroke-dasharray:4 4; }
.dep-link   { fill:none; stroke:#c3c3c3; stroke-width:1.4; }

/* tooltip */
.tooltip{
  position: fixed;
  background:#fff; border:1px solid #e5e5e5; border-radius:8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  padding:10px 12px; font-size:12px; z-index: 9999;
}
.tooltip .t-name{ font-weight:600; margin-bottom:6px; }
.tooltip .t-line{ display:flex; justify-content:space-between; gap:12px; color:#555; }
</style>
