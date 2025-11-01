<template>
  <div class="forest">
    <div
      v-for="p in projects"
      :key="p.projectId"
      class="project-card"
    >
      <!-- 프로젝트 제목 -->
      <div class="project-title">
        <h3>{{ p.projectName }}</h3>
      </div>
      
      <div class="tree-container">
        <svg
          class="tree-svg"
          :width="svgWidth"
          :height="layouts[p.projectId]?.height || 260"
          :viewBox="`0 0 ${svgWidth} ${layouts[p.projectId]?.height || 260}`"
        >
          <!-- 링크(연결선) -->
          <g class="links">
            <path
              v-for="(l, i) in layouts[p.projectId]?.links || []"
              :key="i"
              class="link"
              :d="linkPath(l)"
            />
          </g>

          <!-- 노드 -->
          <g class="nodes">
            <g
              v-for="n in layouts[p.projectId]?.nodes || []"
              :key="n.data.id"
              class="node"
              :transform="`translate(${n.x}, ${n.y})`"
            >
              <g>
                <rect
                  v-if="n.depth === 0"
                  :x="-rootNodeWidth/2" :y="-rootNodeHeight/2"
                  :width="rootNodeWidth" :height="rootNodeHeight"
                  class="node-rect node-root"
                />
                <rect
                  v-else
                  :x="-nodeWidth/2" :y="-nodeHeight/2"
                  :width="nodeWidth" :height="nodeHeight"
                  class="node-rect"
                />
                <text class="node-text" text-anchor="middle" :dy="n.depth === 0 ? '5' : '-2'">
                  {{ n.data.name }}
                </text>
                <text class="node-percent" text-anchor="middle" :dy="n.depth === 0 ? '18' : '14'">
                  {{ Math.round(n.data.percent) }}%
                </text>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, watch } from 'vue'
import { hierarchy, tree } from 'd3-hierarchy'

// Props
const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  }
})

/** SVG/노드 크기 */
const svgWidth = 520
const rootNodeWidth = 180
const rootNodeHeight = 50
const nodeWidth = 140
const nodeHeight = 40
const headerWidth = 220
const headerHeight = 44
const nodeVerticalSpacing = 60 // 레벨 간 간격
const nodeHorizontalSpacing = 120 // 형제 노드 간 간격

/** 프로젝트별 레이아웃 캐시 */
const layouts = reactive({})

/** d3 tree 설정 */
function buildLayout(rootData) {
  const root = hierarchy(rootData)
  // 형제 간 간격, 레벨 간 간격 조절
  const layout = tree().nodeSize([nodeHorizontalSpacing, nodeVerticalSpacing]).separation((a, b) => (a.parent === b.parent ? 1 : 1.5))
  const t = layout(root)

  // 노드 개수에 따라 동적 높이 계산
  const descendants = t.descendants()
  const maxDepth = descendants.length > 0 ? descendants.reduce((max, d) => Math.max(max, d.depth), 0) : 0
  const dynamicHeight = Math.max(260, (maxDepth + 1) * nodeVerticalSpacing + 100) // 최소 높이 260, 상하 여백 100

  // d3 tree는 x,y를 반대로 쓰기도 하므로, 여기선 x=가로, y=세로로 유지
  const nodes = t.descendants().map(d => ({
    ...d,
    x: clamp(d.x + svgWidth / 2, 80, svgWidth - 80),
    y: 60 + d.depth * nodeVerticalSpacing,
  }))
  const links = t.links().map(l => ({
    source: {
      x: clamp(l.source.x + svgWidth / 2, 80, svgWidth - 80),
      y: 60 + l.source.depth * nodeVerticalSpacing,
      depth: l.source.depth,
    },
    target: {
      x: clamp(l.target.x + svgWidth / 2, 80, svgWidth - 80),
      y: 60 + l.target.depth * nodeVerticalSpacing,
      depth: l.target.depth,
    },
  }))
  return { nodes, links, height: dynamicHeight }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/** 직선 링크 경로 */
function linkPath(l) {
  const sx = l.source.x
  // 소스가 루트(depth 0)인지 확인하고 높이 조정
  const sourceHeight = l.source.depth === 0 ? rootNodeHeight : nodeHeight
  const sy = l.source.y + sourceHeight/2
  const tx = l.target.x
  const ty = l.target.y - nodeHeight/2
  return `M ${sx},${sy} L ${tx},${ty}`
}

/** props 변경 시마다 레이아웃 생성 */
function computeAll() {
  props.projects?.forEach(p => {
    if (p.root) {
      layouts[p.projectId] = buildLayout(p.root)
    }
  })
}

onMounted(computeAll)
watch(() => props.projects, computeAll, { deep: true })
</script>

<style scoped>
.forest {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.project-card {
  flex: 1 1 520px;
  max-width: 540px;
  background-color: #ffffff;
  background-image: radial-gradient(#dcdcdc 1.5px, transparent 1.5px);
  background-size: 24px 24px;
  border: 1px solid #ddd;
  padding: 16px;
}

.project-title {
  padding: 12px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #ddd;
}

.project-title h3 {
  font-family: 'Pretendard', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #212121;
  margin: 0;
}

.tree-container {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: auto;
  padding: 16px;
}

.tree-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.tree-container::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.tree-container::-webkit-scrollbar-thumb {
  background: #bdbdbd;
}

.tree-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.tree-svg {
  overflow: visible;
  display: block;
}

.link {
  fill: none;
  stroke: #444;
  stroke-width: 1px;
}

.node-rect {
  fill: #eaf3ff;
  stroke: #1565c0;
  stroke-width: 1.5px;
}

.node-root {
  fill: #bbdefb;
  stroke: #0d47a1;
  stroke-width: 2px;
}

.node-text {
  font-family: 'Pretendard', sans-serif;
  font-size: 12px;
  font-weight: 600;
  fill: #212121;
}

.node-root .node-text {
  font-weight: 700;
}

.node-percent {
  font-family: 'Pretendard', sans-serif;
  font-size: 11px;
  font-weight: 400;
  fill: #666;
}

/* 반응형 */
@media (max-width: 900px) {
  .project-card {
    flex: 1 1 100%;
  }
}
</style>

