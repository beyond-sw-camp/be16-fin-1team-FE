<template>
  <div class="milestone-view-container">
    <div class="milestone-controls">
      <button class="add-stone-btn" @click="addStone">
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 0V18M0 9H18" stroke="#B5B5B5" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>스톤 생성</span>
      </button>
    </div>
    
    <div class="flow-wrapper">
      <VueFlow 
        v-model="elements" 
        :fit-view="true" 
        class="flow-container"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
      >
        <Controls />
        <MiniMap />
      </VueFlow>
    </div>

    <!-- 스톤 상세 모달 -->
    <StoneDetailModal 
      :is-visible="showStoneModal"
      :stone-data="selectedStoneData"
      @close="closeStoneModal"
      @expand="expandStoneModal"
      @delete="deleteStone"
      @stone-deleted="handleStoneDeleted"
      @stone-completed="handleStoneCompleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import StoneDetailModal from '@Project/StoneDetailModal.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// Props
const props = defineProps({
  stones: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['edit-stone', 'delete-stone', 'add-stone'])

// Reactive data
const elements = ref([])
const showStoneModal = ref(false)
const selectedStoneData = ref({})
let nodeIdCounter = 1

// 더미 데이터
const dummyStones = [
  {
    stoneId: 'stone-1',
    stoneName: '오르빗 출시 D-53',
    startTime: '2025-09-12',
    endTime: '2025-09-17',
    manager: '김올빗',
    participants: '비어 있음',
    documentLink: '바로가기',
    stoneStatus: 'PROGRESS',
    tasks: [
      {
        id: 1,
        name: '채팅방',
        completed: true,
        startTime: '2025-09-12',
        endTime: '2025-09-17'
      },
      {
        id: 2,
        name: '기획안 작성',
        completed: true,
        startTime: '2025-09-12',
        endTime: '2025-09-14'
      },
      {
        id: 3,
        name: '요구사항 정의',
        completed: false,
        startTime: '2025-09-14',
        endTime: '2025-09-16'
      },
      {
        id: 4,
        name: 'WBS 작성',
        completed: false,
        startTime: '2025-09-16',
        endTime: '2025-09-17'
      }
    ]
  },
  {
    stoneId: 'stone-2',
    stoneName: '기획 D-4',
    startTime: '2025-09-12',
    endTime: '2025-09-16',
    manager: '김올빗',
    participants: '비어 있음',
    documentLink: '바로가기',
    tasks: [
      {
        id: 1,
        name: '기획안 작성',
        completed: true,
        startTime: '2025-09-12',
        endTime: '2025-09-14'
      },
      {
        id: 2,
        name: '요구사항 정의',
        completed: false,
        startTime: '2025-09-14',
        endTime: '2025-09-16'
      }
    ]
  },
  {
    stoneId: 'stone-3',
    stoneName: '백엔드 개발 D-21',
    startTime: '2025-09-12',
    endTime: '2025-10-03',
    manager: '김올빗',
    participants: '비어 있음',
    documentLink: '바로가기',
    tasks: [
      {
        id: 1,
        name: 'API 설계',
        completed: false,
        startTime: '2025-09-12',
        endTime: '2025-09-20'
      },
      {
        id: 2,
        name: '데이터베이스 설계',
        completed: false,
        startTime: '2025-09-15',
        endTime: '2025-09-25'
      },
      {
        id: 3,
        name: '백엔드 구현',
        completed: false,
        startTime: '2025-09-20',
        endTime: '2025-10-03'
      }
    ]
  }
]

// Default edge options
const defaultEdgeOptions = {
  animated: true,
  style: { stroke: '#FFDD44', strokeWidth: 2 }
}

// Computed
const stoneNodes = computed(() => {
  return elements.value.filter(el => el.type !== 'edge')
})

const stoneEdges = computed(() => {
  return elements.value.filter(el => el.type === 'edge')
})

// Methods
const convertStonesToElements = (stones, parentId = null, level = 0) => {
  const nodes = []
  const edges = []
  
  stones.forEach((stone, index) => {
    const nodeId = stone.stoneId || `stone-${nodeIdCounter++}`
    
    // 노드 생성
    const node = {
      id: nodeId,
      type: level === 0 ? 'input' : 'default',
      data: { 
        label: stone.stoneName,
        milestone: stone.milestone,
        startTime: stone.startTime,
        endTime: stone.endTime,
        stoneId: stone.stoneId
      },
      position: calculateNodePosition(level, index, stones.length),
      style: {
        background: level === 0 ? '#FFDD44' : '#FFEE93',
        borderRadius: '50%',
        width: 120,
        height: 120,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '3px solid #FFFFFF',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '12px',
        fontWeight: '700',
        color: '#1C0F0F',
        cursor: 'pointer'
      }
    }
    
    nodes.push(node)
    
    // 부모와 연결선 생성
    if (parentId) {
      const edge = {
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        animated: true,
        style: { stroke: '#FFDD44', strokeWidth: 2 }
      }
      edges.push(edge)
    }
    
    // 자식 노드들 재귀 처리
    if (stone.childStone && stone.childStone.length > 0) {
      const childElements = convertStonesToElements(stone.childStone, nodeId, level + 1)
      nodes.push(...childElements.filter(el => !el.source))
      edges.push(...childElements.filter(el => el.source))
    }
  })
  
  return [...nodes, ...edges]
}

const calculateNodePosition = (level, index, totalCount) => {
  const baseX = 400
  const baseY = 100
  const levelSpacing = 200
  const nodeSpacing = 200
  
  if (level === 0) {
    // 루트 레벨: 가로로 배치
    return {
      x: baseX + (index * nodeSpacing),
      y: baseY
    }
  } else {
    // 자식 레벨: 부모 아래에 배치
    const parentX = baseX
    const startX = parentX - ((totalCount - 1) * nodeSpacing) / 2
    return {
      x: startX + (index * nodeSpacing),
      y: baseY + (level * levelSpacing)
    }
  }
}

const onNodeClick = (event, node) => {
  console.log('노드 클릭:', node.data)
  
  // 더미 데이터에서 해당 스톤 정보 찾기
  const stoneData = dummyStones.find(stone => stone.stoneId === node.data.stoneId)
  if (stoneData) {
    selectedStoneData.value = stoneData
    showStoneModal.value = true
  } else {
    // 기본 데이터로 모달 열기
    selectedStoneData.value = {
      stoneId: node.data.stoneId,
      stoneName: node.data.label,
      startTime: node.data.startTime || '2025-09-12',
      endTime: node.data.endTime || '2025-09-17',
      manager: '김올빗',
      participants: '비어 있음',
      documentLink: '바로가기',
      stoneStatus: 'PROGRESS',
      tasks: [
        {
          id: 1,
          name: '기본 태스크',
          completed: false,
          startTime: '2025-09-12',
          endTime: '2025-09-17'
        }
      ]
    }
    showStoneModal.value = true
  }
  
  emit('edit-stone', {
    stoneId: node.data.stoneId,
    stoneName: node.data.label,
    milestone: node.data.milestone,
    startTime: node.data.startTime,
    endTime: node.data.endTime
  })
}

const onEdgeClick = (event, edge) => {
  console.log('연결선 클릭:', edge)
}

const addStone = () => {
  const newStoneId = `new-stone-${Date.now()}`
  const newNode = {
    id: newStoneId,
    type: 'default',
    data: { 
      label: '새 스톤',
      milestone: null,
      startTime: null,
      endTime: null,
      stoneId: newStoneId
    },
    position: { x: 200, y: 200 },
    style: {
      background: '#FFEE93',
      borderRadius: '50%',
      width: 120,
      height: 120,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '3px solid #FFFFFF',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontSize: '12px',
      fontWeight: '700',
      color: '#1C0F0F',
      cursor: 'pointer'
    }
  }
  
  elements.value.push(newNode)
  emit('add-stone', newNode.data)
}

// 모달 관련 메서드들
const closeStoneModal = () => {
  showStoneModal.value = false
  selectedStoneData.value = {}
}

const expandStoneModal = () => {
  // 전체 화면으로 확장하는 로직 (필요시 구현)
  console.log('모달 확장')
}

const deleteStone = (stoneData) => {
  console.log('스톤 삭제:', stoneData)
  // 스톤 삭제 로직
  const stoneIndex = elements.value.findIndex(el => el.data.stoneId === stoneData.stoneId)
  if (stoneIndex !== -1) {
    elements.value.splice(stoneIndex, 1)
  }
  closeStoneModal()
  emit('delete-stone', stoneData)
}

// 스톤 삭제 완료 처리 (API 삭제 후 호출)
const handleStoneDeleted = (deletedStone) => {
  console.log('스톤 삭제 완료:', deletedStone)
  
  // elements 배열에서 해당 스톤 노드 제거
  const stoneIndex = elements.value.findIndex(el => 
    el.data.stoneId === deletedStone.stoneId || el.id === deletedStone.stoneId
  )
  
  if (stoneIndex !== -1) {
    const deletedNode = elements.value[stoneIndex]
    
    // 해당 노드와 연결된 모든 엣지 제거
    elements.value = elements.value.filter(el => 
      !(el.source === deletedNode.id || el.target === deletedNode.id)
    )
    
    // 노드 자체 제거
    elements.value.splice(stoneIndex, 1)
    
    console.log('스톤이 UI에서 제거되었습니다:', deletedStone.stoneName)
  }
  
  // 부모 컴포넌트에 삭제 완료 알림
  emit('delete-stone', deletedStone)
}

// 스톤 완료 처리
const handleStoneCompleted = (completedStone) => {
  console.log('스톤 완료:', completedStone)
  
  // elements 배열에서 해당 스톤 노드의 상태 업데이트
  const stoneIndex = elements.value.findIndex(el => 
    el.data.stoneId === completedStone.stoneId || el.id === completedStone.stoneId
  )
  
  if (stoneIndex !== -1) {
    // 노드의 상태를 완료로 업데이트
    elements.value[stoneIndex].data.status = 'COMPLETED'
    elements.value[stoneIndex].data.milestone = 100
    
    console.log('스톤이 완료 상태로 업데이트되었습니다:', completedStone.stoneName)
  }
}

// Watchers
watch(() => props.stones, (newStones) => {
  if (newStones && newStones.length > 0) {
    elements.value = convertStonesToElements(newStones)
  } else {
    // 테스트용 기본 노드들 (더미 데이터와 연결)
    elements.value = [
      {
        id: '1',
        type: 'input',
        data: { 
          label: '오르빗 출시 D-53',
          stoneId: 'stone-1'
        },
        position: { x: 400, y: 100 },
        style: {
          background: '#FFDD44',
          borderRadius: '50%',
          width: 120,
          height: 120,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '3px solid #FFFFFF',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '12px',
          fontWeight: '700',
          color: '#1C0F0F',
          cursor: 'pointer'
        }
      },
      {
        id: '2',
        type: 'default',
        data: { 
          label: '기획 D-4',
          stoneId: 'stone-2'
        },
        position: { x: 200, y: 300 },
        style: {
          background: '#FFEE93',
          borderRadius: '50%',
          width: 120,
          height: 120,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '3px solid #FFFFFF',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '12px',
          fontWeight: '700',
          color: '#1C0F0F',
          cursor: 'pointer'
        }
      },
      {
        id: '3',
        type: 'default',
        data: { 
          label: '백엔드 개발 D-21',
          stoneId: 'stone-3'
        },
        position: { x: 600, y: 300 },
        style: {
          background: '#FFEE93',
          borderRadius: '50%',
          width: 120,
          height: 120,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '3px solid #FFFFFF',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '12px',
          fontWeight: '700',
          color: '#1C0F0F',
          cursor: 'pointer'
        }
      },
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        animated: true,
        style: { stroke: '#FFDD44', strokeWidth: 2 }
      },
      {
        id: 'e1-3',
        source: '1',
        target: '3',
        animated: true,
        style: { stroke: '#FFDD44', strokeWidth: 2 }
      }
    ]
  }
}, { immediate: true, deep: true })

// Lifecycle
onMounted(() => {
  // 테스트용 기본 노드들 (더미 데이터와 연결)
  elements.value = [
    {
      id: '1',
      type: 'input',
      data: { 
        label: '오르빗 출시 D-53',
        stoneId: 'stone-1'
      },
      position: { x: 400, y: 100 },
      style: {
        background: '#FFDD44',
        borderRadius: '50%',
        width: 120,
        height: 120,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '3px solid #FFFFFF',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '12px',
        fontWeight: '700',
        color: '#1C0F0F',
        cursor: 'pointer'
      }
    },
    {
      id: '2',
      type: 'default',
      data: { 
        label: '기획 D-4',
        stoneId: 'stone-2'
      },
      position: { x: 200, y: 300 },
      style: {
        background: '#FFEE93',
        borderRadius: '50%',
        width: 120,
        height: 120,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '3px solid #FFFFFF',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '12px',
        fontWeight: '700',
        color: '#1C0F0F',
        cursor: 'pointer'
      }
    },
    {
      id: '3',
      type: 'default',
      data: { 
        label: '백엔드 개발 D-21',
        stoneId: 'stone-3'
      },
      position: { x: 600, y: 300 },
      style: {
        background: '#FFEE93',
        borderRadius: '50%',
        width: 120,
        height: 120,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '3px solid #FFFFFF',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '12px',
        fontWeight: '700',
        color: '#1C0F0F',
        cursor: 'pointer'
      }
    },
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      animated: true,
      style: { stroke: '#FFDD44', strokeWidth: 2 }
    },
    {
      id: 'e1-3',
      source: '1',
      target: '3',
      animated: true,
      style: { stroke: '#FFDD44', strokeWidth: 2 }
    }
  ]
})
</script>

<style scoped>
.milestone-view-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.milestone-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.add-stone-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #2A2828;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  color: #FFFFFF;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
}

.add-stone-btn:hover {
  background: #1a1818;
}

.flow-wrapper {
  width: 100%;
  height: 100%;
}

.flow-container {
  background-color: #fffdf7;
  background-image: radial-gradient(circle, rgba(217, 217, 217, 0.5) 1px, transparent 1px);
  background-size: 20px 20px;
  background-repeat: repeat;
}

/* Vue Flow 커스텀 스타일 */
:deep(.vue-flow__node) {
  font-family: 'Pretendard', sans-serif;
}

:deep(.vue-flow__node-input) {
  background: #FFDD44 !important;
}

:deep(.vue-flow__node-default) {
  background: #FFEE93 !important;
}

:deep(.vue-flow__edge) {
  stroke: #FFDD44 !important;
  stroke-width: 2px !important;
}

:deep(.vue-flow__edge.animated) {
  stroke-dasharray: 5;
  animation: dash 0.5s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

:deep(.vue-flow__controls) {
  bottom: 20px;
  left: 20px;
}

:deep(.vue-flow__minimap) {
  bottom: 20px;
  right: 20px;
}
</style>
