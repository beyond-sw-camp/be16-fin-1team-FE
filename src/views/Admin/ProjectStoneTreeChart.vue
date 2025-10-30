<template>
  <div class="project-stone-tree-chart">
    <div class="chart-container" ref="chartContainer">
      <!-- 로딩 상태 -->
      <div v-if="!treeData" class="loading-state">
        <p>트리 데이터를 로딩 중...</p>
      </div>
      
      <!-- 트리 구조 -->
      <div v-else class="tree-wrapper">
        <div v-for="project in treeData" :key="project.projectId" class="project-tree">
          <h3 class="project-title">{{ project.projectName }}</h3>
          <div class="tree-container">
            <div v-for="milestone in project.milestoneResDtoList" :key="milestone.stoneId" class="milestone-tree">
              <div class="stone-tree-node">
                <!-- 루트 스톤 -->
                <div class="stone-item" 
                     :class="getStoneStatusClass(milestone.milestone)" 
                     @click="onNodeClick(milestone)">
                  <span class="stone-name">{{ milestone.stoneName }}: {{ Math.round(milestone.milestone || 0) }}%</span>
                </div>
                
                <!-- 자식 스톤들 -->
                <div v-if="milestone.children && milestone.children.length > 0" class="children-container">
                  <div v-for="child in milestone.children" :key="child.stoneId" class="child-stone">
                    <div class="stone-item" 
                         :class="getStoneStatusClass(child.milestone)" 
                         @click="onNodeClick(child)">
                      <span class="stone-name">{{ child.stoneName }}: {{ Math.round(child.milestone || 0) }}%</span>
                    </div>
                    
                    <!-- 손자 스톤들 -->
                    <div v-if="child.children && child.children.length > 0" class="grandchildren-container">
                      <div v-for="grandchild in child.children" :key="grandchild.stoneId" class="grandchild-stone">
                        <div class="stone-item" 
                             :class="getStoneStatusClass(grandchild.milestone)" 
                             @click="onNodeClick(grandchild)">
                          <span class="stone-name">{{ grandchild.stoneName }}: {{ Math.round(grandchild.milestone || 0) }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 툴팁 -->
    <div v-if="selectedNode" class="tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        <h4>{{ selectedNode.stoneName }}</h4>
        <p><strong>진행률:</strong> {{ selectedNode.milestone }}%</p>
        <p><strong>마감일:</strong> {{ formatDate(selectedNode.endTime) }}</p>
        <p><strong>스톤 ID:</strong> {{ selectedNode.stoneId }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

export default {
  name: 'ProjectStoneTreeChart',
  props: {
    projectMilestones: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const chartContainer = ref(null);
    const selectedNode = ref(null);
    const tooltipStyle = ref({});
    
    // 트리 데이터 변환
    const treeData = computed(() => {
      console.log('ProjectStoneTreeChart - props.projectMilestones:', props.projectMilestones);
      
      if (!props.projectMilestones || props.projectMilestones.length === 0) {
        console.log('ProjectStoneTreeChart - 데이터가 없습니다');
        return null;
      }
      
      const result = props.projectMilestones.map(project => ({
        projectId: project.projectId,
        projectName: project.projectName,
        milestoneResDtoList: project.milestoneResDtoList || []
      }));
      
      console.log('ProjectStoneTreeChart - 변환된 treeData:', result);
      return result;
    });
    
    
    // 날짜 포맷팅
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 스톤 상태 클래스 결정
    const getStoneStatusClass = (milestone) => {
      const progress = milestone || 0;
      if (progress === 100) {
        return 'completed';
      } else if (progress > 0) {
        return 'in-progress';
      } else {
        return 'not-started';
      }
    };
    
    // 노드 클릭 이벤트
    const onNodeClick = (stone) => {
      console.log('클릭된 스톤:', stone);
      selectedNode.value = stone;
      
      // 툴팁 위치 설정
      tooltipStyle.value = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      };
    };
    
    onMounted(() => {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.project-stone-tree-chart')) {
          selectedNode.value = null;
        }
      });
    });
    
    onUnmounted(() => {
      // 정리 작업
    });
    
    return {
      chartContainer,
      treeData,
      selectedNode,
      tooltipStyle,
      getStoneStatusClass,
      onNodeClick,
      formatDate
    };
  }
};
</script>

<style scoped>
.project-stone-tree-chart {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: 600px;
  overflow: auto;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  background: #FAFAFA;
  padding: 20px;
}

.tree-wrapper {
  width: 100%;
  height: 100%;
}

.project-tree {
  margin-bottom: 30px;
  padding: 20px;
  background: #FAFAFA;
  border-radius: 8px;
  border: 1px solid #E0E0E0;
}

.project-title {
  margin: 0 0 20px 0;
  color: #1C0F0F;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Pretendard', sans-serif;
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.milestone-tree {
  margin-bottom: 15px;
}

.stone-tree-node {
  position: relative;
}

.stone-item {
  display: inline-block;
  padding: 8px 16px;
  margin: 5px;
  border-radius: 6px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  min-width: 120px;
  text-align: center;
}

.stone-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stone-item.completed {
  background: #E8F5E8;
  border-color: #4CAF50;
  color: #2E7D32;
}

.stone-item.in-progress {
  background: #FFF3E0;
  border-color: #FF9800;
  color: #E65100;
}

.stone-item.not-started {
  background: #FFEBEE;
  border-color: #F44336;
  color: #C62828;
}

.children-container {
  margin-left: 30px;
  margin-top: 10px;
  position: relative;
}

.children-container::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #E0E0E0;
}

.child-stone {
  position: relative;
  margin-bottom: 10px;
}

.child-stone::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 50%;
  width: 15px;
  height: 2px;
  background: #E0E0E0;
}

.grandchildren-container {
  margin-left: 30px;
  margin-top: 10px;
  position: relative;
}

.grandchildren-container::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #E0E0E0;
}

.grandchild-stone {
  position: relative;
  margin-bottom: 8px;
}

.grandchild-stone::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 50%;
  width: 15px;
  height: 2px;
  background: #E0E0E0;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #666666;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
}

.tooltip {
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  max-width: 300px;
  pointer-events: none;
}

.tooltip-content h4 {
  margin: 0 0 8px 0;
  color: #1C0F0F;
  font-size: 16px;
  font-weight: 700;
}

.tooltip-content p {
  margin: 4px 0;
  color: #666666;
  font-size: 14px;
  line-height: 1.4;
}

.tooltip-content strong {
  color: #1C0F0F;
  font-weight: 600;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .chart-container {
    height: 400px;
    padding: 10px;
  }
  
  .tree-chart {
    min-width: 600px;
    min-height: 300px;
  }
  
  .tooltip {
    max-width: 250px;
    padding: 12px;
  }
  
  .tooltip-content h4 {
    font-size: 14px;
  }
  
  .tooltip-content p {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    height: 300px;
    padding: 5px;
  }
  
  .tree-chart {
    min-width: 400px;
    min-height: 200px;
  }
}

/* 스크롤바 스타일링 */
.chart-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.chart-container::-webkit-scrollbar-track {
  background: #F5F5F5;
  border-radius: 4px;
}

.chart-container::-webkit-scrollbar-thumb {
  background: #CCCCCC;
  border-radius: 4px;
}

.chart-container::-webkit-scrollbar-thumb:hover {
  background: #999999;
}
</style>
