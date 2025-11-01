<template>
  <div class="forest">
      <div
        v-for="p in projects"
        :key="p.projectId"
        class="project-card"
      >
        <div class="tree-container">
        <svg
          class="tree-svg"
          :viewBox="`0 0 ${svgWidth} ${layouts[p.projectId]?.height || 260}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <g class="tree-svg-group" :transform="layouts[p.projectId]?.groupTransform || 'translate(0, 40) scale(0.5)'">
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
                  :x="-(n.rectWidth || rootNodeWidth)/2" :y="-rootNodeHeight/2"
                  :width="n.rectWidth || rootNodeWidth" :height="rootNodeHeight"
                  rx="5"
                  ry="5"
                  class="node-rect node-root"
                />
                <rect
                  v-else
                  :x="-(n.rectWidth || nodeWidth)/2" :y="-nodeHeight/2"
                  :width="n.rectWidth || nodeWidth" :height="nodeHeight"
                  rx="5"
                  ry="5"
                  class="node-rect"
                />
                <text 
                  class="node-text" 
                  text-anchor="middle" 
                  :x="0" 
                  :y="n.depth === 0 ? '-6' : '-6'"
                  dominant-baseline="middle"
                >
                  {{ n.data.name }}
                </text>
                <text 
                  class="node-percent" 
                  text-anchor="middle" 
                  :x="0" 
                  :y="n.depth === 0 ? '6' : '6'"
                  dominant-baseline="middle"
                >
                  {{ Math.round(n.data.percent) }}%
                </text>
              </g>
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
const rootNodeWidth = 85
const rootNodeHeight = 38
const nodeWidth = 85
const nodeHeight = 38
const headerWidth = 220
const headerHeight = 44
const nodeVerticalSpacing = 60 // 레벨 간 간격 (60px)
const nodeHorizontalSpacing = 120 // 형제 노드 간 간격 (120px)

/** 프로젝트별 레이아웃 캐시 */
const layouts = reactive({})

/** d3 tree 설정 */
function buildLayout(rootData) {
  const root = hierarchy(rootData)
  // 형제 간 간격, 레벨 간 간격 조절 - 하위 노드 간격 확대
  const layout = tree()
    .nodeSize([nodeHorizontalSpacing, nodeVerticalSpacing])
    .separation((a, b) => (a.parent === b.parent ? 1.8 : 2.2)) // 형제 간 간격 조정
  const t = layout(root)

  // 노드 개수에 따라 동적 높이 계산
  const descendants = t.descendants()
  const maxDepth = descendants.length > 0 ? descendants.reduce((max, d) => Math.max(max, d.depth), 0) : 0
  const dynamicHeight = Math.max(260, (maxDepth + 1) * nodeVerticalSpacing + 50) // 최소 높이 260, 상하 여백 50

  // 트리의 실제 너비 계산 (최소/최대 x 좌표)
  const xValues = descendants.map(d => d.x)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const treeWidth = maxX - minX
  
  // scale 값
  const scale = 0.5
  const yOffset = 40

  // 중앙 정렬: scale 적용 후의 트리 너비를 기준으로 중앙 정렬
  const scaledTreeWidth = treeWidth * scale
  const xOffset = (svgWidth - scaledTreeWidth) / 2

  // 텍스트 폭 측정을 위한 임시 SVG 요소 생성 (DOM에 추가하지 않고 메모리에서만)
  const measureText = (text, fontSize = 9) => {
    // 대략적인 문자 너비 계산 (9px 폰트 기준)
    // 한글은 약 9px, 영문은 약 5px
    let width = 0
    for (let char of text) {
      if (/[가-힣]/.test(char)) {
        width += fontSize * 1.0 // 한글
      } else if (/[A-Za-z0-9]/.test(char)) {
        width += fontSize * 0.55 // 영문/숫자
      } else {
        width += fontSize * 0.6 // 기타 문자
      }
    }
    return width
  }

  // d3 tree는 x,y를 반대로 쓰기도 하므로, 여기선 x=가로, y=세로로 유지
  // 노드 위치는 원래 좌표 유지 (transform에서 스케일 적용)
  const nodes = t.descendants().map(d => {
    // 텍스트 크기에 따라 rect 폭 계산 (15% 확대: +10px)
    const textWidth = measureText(d.data.name || '', 9)
    const minWidth = d.depth === 0 ? rootNodeWidth : nodeWidth
    const padding = 24 // 좌우 여백
    const calculatedWidth = Math.max(minWidth, textWidth + padding) + 10 // 폭 10px 추가
    
    return {
      ...d,
      x: d.x,
      y: 60 + d.depth * nodeVerticalSpacing,
      rectWidth: calculatedWidth, // 동적 폭 저장 (15% 확대)
    }
  })
  const links = t.links().map(l => ({
    source: {
      x: l.source.x,
      y: 60 + l.source.depth * nodeVerticalSpacing,
      depth: l.source.depth,
    },
    target: {
      x: l.target.x,
      y: 60 + l.target.depth * nodeVerticalSpacing,
      depth: l.target.depth,
    },
  }))
  
  // SVG 그룹 transform 계산 (중앙 정렬 + 스케일)
  // 트리의 최소 x 좌표를 기준으로 중앙 정렬
  const transformXOffset = xOffset - minX * scale
  const groupTransform = `translate(${transformXOffset}, ${yOffset}) scale(${scale})`
  
  return { nodes, links, height: dynamicHeight, treeWidth, groupTransform }
}

// clamp 함수는 더 이상 사용하지 않음 (중앙 정렬로 대체)

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
  flex-direction: column;
  gap: 0;
  width: 100%;
  align-items: center;
}

.project-card {
  width: 100%;
  background-color: transparent;
  background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1.5px, transparent 1.5px);
  background-size: 24px 24px;
  border: none;
  border-radius: 12px;
  padding: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: visible;
  overflow-x: visible;
}

.tree-container {
  width: 100%;
  margin: 0;
  background: transparent;
  border-radius: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: visible;
  max-height: none;
  min-height: 0;
  position: relative;
}

.tree-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.tree-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.tree-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.tree-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tree-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  display: block;
  margin: 0 auto;
  max-width: 100%;
}

.tree-svg-group {
  /* SVG transform은 SVG 속성으로 직접 적용됨 */
}

.link {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1px;
}

.node-rect {
  fill: rgba(255, 255, 255, 0.1);
  stroke: rgba(255, 255, 255, 0.4);
  stroke-width: 1px;
}

.node-root {
  fill: rgba(255, 255, 255, 0.15);
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 1px;
}

.node-text {
  font-family: 'Pretendard', sans-serif;
  font-size: 9px;
  font-weight: 600;
  fill: #ffffff;
  line-height: 1.2;
  dominant-baseline: middle;
  white-space: nowrap;
  overflow: hidden;
}

.node-root .node-text {
  font-weight: 700;
  font-size: 9px;
}

.node-percent {
  font-family: 'Pretendard', sans-serif;
  font-size: 8px;
  font-weight: 400;
  fill: rgba(255, 255, 255, 0.7);
}

/* 반응형 */
@media (max-width: 900px) {
  .tree-container {
    padding: 16px;
  }
  
  .project-title h3 {
    font-size: 18px;
  }
}
</style>

