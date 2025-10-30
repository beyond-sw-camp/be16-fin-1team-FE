<template>
  <div class="d3-tree-chart">
    <div class="chart-container" ref="chartContainer">
      <svg ref="svg" class="tree-svg"></svg>
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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';

export default {
  name: 'D3TreeChart',
  props: {
    projectMilestones: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const chartContainer = ref(null);
    const svg = ref(null);
    const selectedNode = ref(null);
    const tooltipStyle = ref({});
    
    let treeData = null;
    let width = 0;
    let height = 0;
    let svgElement = null;
    let g = null;
    
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
    
    // 스톤 상태에 따른 색상 결정
    const getNodeColor = (milestone) => {
      const progress = milestone || 0;
      if (progress === 100) return '#4CAF50'; // 완료 - 초록색
      if (progress === 0) return '#F44336';   // 미시작 - 빨간색
      return '#FF9800'; // 진행중 - 주황색
    };
    
    // 스톤 상태에 따른 배경색 결정
    const getNodeBackgroundColor = (milestone) => {
      const progress = milestone || 0;
      if (progress === 100) return '#E8F5E8'; // 완료 - 연한 초록색
      if (progress === 0) return '#FFEBEE';   // 미시작 - 연한 빨간색
      return '#FFF3E0'; // 진행중 - 연한 주황색
    };
    
    // 데이터를 D3 트리 형식으로 변환
    const transformData = (projectMilestones) => {
      if (!projectMilestones || projectMilestones.length === 0) return null;
      
      const projects = projectMilestones.map(project => {
        const rootNode = {
          name: project.projectName,
          type: 'project',
          children: project.milestoneResDtoList.map(milestone => ({
            name: `${milestone.stoneName}: ${Math.round(milestone.milestone || 0)}%`,
            stoneName: milestone.stoneName,
            milestone: milestone.milestone || 0,
            endTime: milestone.endTime,
            stoneId: milestone.stoneId,
            type: 'milestone',
            children: transformChildren(milestone.children || [])
          }))
        };
        return rootNode;
      });
      
      return projects[0]; // 첫 번째 프로젝트만 표시
    };
    
    // 자식 노드 변환
    const transformChildren = (children) => {
      return children.map(child => ({
        name: `${child.stoneName}: ${Math.round(child.milestone || 0)}%`,
        stoneName: child.stoneName,
        milestone: child.milestone || 0,
        endTime: child.endTime,
        stoneId: child.stoneId,
        type: 'stone',
        children: transformChildren(child.children || [])
      }));
    };
    
    // 트리 차트 생성
    const createTree = () => {
      if (!svgElement || !treeData) return;
      
      // 기존 내용 제거
      svgElement.selectAll('*').remove();
      
      // SVG 설정 (세로 트리에 맞게 높이 증가)
      width = chartContainer.value.clientWidth || 800;
      height = Math.max(chartContainer.value.clientHeight || 800, 600); // 최소 높이 보장
      
      svgElement
        .attr('width', width)
        .attr('height', height);
      
      // 마진 설정 (세로 트리에 맞게 조정)
      const margin = { top: 40, right: 40, bottom: 40, left: 40 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      
      // 그룹 생성
      g = svgElement.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // 트리 레이아웃 설정 (세로 방향)
      const tree = d3.tree()
        .size([innerWidth, innerHeight]);
      
      // 계층 구조 생성
      const root = d3.hierarchy(treeData);
      const treeData_hierarchy = tree(root);
      
      // 노드 그리기 (세로 배치: x, y 순서로 변경)
      const nodes = g.selectAll('.node')
        .data(treeData_hierarchy.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);
      
      // 노드 박스 그리기
      nodes.append('rect')
        .attr('width', 120)
        .attr('height', 40)
        .attr('x', -60)
        .attr('y', -20)
        .attr('rx', 6)
        .attr('fill', d => {
          if (d.data.type === 'project') return '#E3F2FD';
          return getNodeBackgroundColor(d.data.milestone);
        })
        .attr('stroke', d => {
          if (d.data.type === 'project') return '#2196F3';
          return getNodeColor(d.data.milestone);
        })
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');
      
      // 노드 텍스트 (세로 정렬을 위한 중앙 정렬)
      nodes.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .style('font-family', 'Pretendard, sans-serif')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', d => {
          if (d.data.type === 'project') return '#1976D2';
          const progress = d.data.milestone || 0;
          if (progress === 100) return '#2E7D32';
          if (progress === 0) return '#C62828';
          return '#E65100';
        })
        .text(d => d.data.name);
      
      // 연결선 그리기 (세로 방향: linkVertical 사용)
      g.selectAll('.link')
        .data(treeData_hierarchy.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
          .x(d => d.x)
          .y(d => d.y))
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-width', 2);
      
      // 노드 클릭 이벤트
      nodes.on('click', (event, d) => {
        if (d.data.type !== 'project') {
          selectedNode.value = d.data;
          tooltipStyle.value = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000
          };
        }
      });
      
      // 호버 효과
      nodes.on('mouseover', function(event, d) {
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('stroke-width', 3)
          .attr('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('rect')
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .attr('filter', 'none');
      });
    };
    
    // 데이터 변경 감지
    watch(() => props.projectMilestones, (newData) => {
      console.log('D3TreeChart - 데이터 변경 감지:', newData);
      treeData = transformData(newData);
      if (treeData) {
        nextTick(() => {
          createTree();
        });
      }
    }, { immediate: true });
    
    onMounted(() => {
      svgElement = d3.select(svg.value);
      treeData = transformData(props.projectMilestones);
      
      if (treeData) {
        nextTick(() => {
          createTree();
        });
      }
      
      // 윈도우 리사이즈 이벤트
      window.addEventListener('resize', createTree);
    });
    
    onUnmounted(() => {
      window.removeEventListener('resize', createTree);
    });
    
    return {
      chartContainer,
      svg,
      selectedNode,
      tooltipStyle,
      formatDate
    };
  }
};
</script>

<style scoped>
.d3-tree-chart {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: 800px; /* 세로 트리에 맞게 높이 증가 */
  overflow: auto;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  background: #FAFAFA;
}

.tree-svg {
  width: 100%;
  height: 100%;
  min-width: 600px; /* 세로 트리에서는 너비를 줄임 */
  min-height: 800px; /* 세로 트리에 맞게 높이 증가 */
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

/* 반응형 디자인 (세로 트리에 맞게 조정) */
@media (max-width: 768px) {
  .chart-container {
    height: 600px; /* 모바일에서도 충분한 높이 보장 */
  }
  
  .tree-svg {
    min-width: 400px; /* 모바일에서는 너비를 더 줄임 */
    min-height: 600px; /* 세로 트리에 맞게 높이 유지 */
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
