<template>
  <div class="project-dashboard-container">
    <div v-if="loading" class="loading-container">
      <p class="loading-text">대시보드 데이터를 불러오는 중...</p>
    </div>
    
    <div v-else class="dashboard-content">
      <!-- 통계 카드 영역 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon progress-icon">
            <div class="progress-circle">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path 
                  class="circle" 
                  :stroke-dasharray="`${projectStats.progress}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
              </svg>
              <span class="progress-text">{{ projectStats.progress }}%</span>
            </div>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.progress }}%</div>
            <div class="stat-label">프로젝트 진행률</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stone-icon">
            <img src="@/assets/icons/project/stones_1.svg" alt="스톤" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.totalStones }}</div>
            <div class="stat-label">총 스톤 수</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon task-icon">
            <img src="@/assets/icons/home/file-document.svg" alt="Task" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.totalTasks }}</div>
            <div class="stat-label">총 태스크 수</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed-stone-icon">
            <img src="@/assets/icons/project/stones_1.svg" alt="완료된 스톤" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.completedStones }} / {{ projectStats.totalStones }}</div>
            <div class="stat-label">완료된 스톤 수</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed-task-icon">
            <img src="@/assets/icons/home/file-document.svg" alt="완료된 Task" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.completedTasks }} / {{ projectStats.totalTasks }}</div>
            <div class="stat-label">완료된 태스크 수</div>
          </div>
        </div>
      </div>

      <!-- 인원 현황 영역 -->
      <ProjectPeopleOverviewTable 
        :overview="peopleOverview" 
        :loading="loadingPeople"
        :error="peopleError"
      />

    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ProjectPeopleOverviewTable from '@/components/project/ProjectPeopleOverviewTable.vue';
import { getProjectPeopleOverview } from '@/services/projectService.js';

export default {
  name: "ProjectDashboard",
  components: {
    ProjectPeopleOverviewTable
  },
  props: {
    projectId: {
      type: [String, Number],
      required: true
    }
  },
  
  data() {
    return {
      loading: false,
      loadingPeople: false,
      peopleOverview: null,
      peopleError: null,
      projectStats: {
        totalStones: 0,
        completedStones: 0,
        progress: 0,
        totalTasks: 0,
        completedTasks: 0
      }
    };
  },
  
  
  async mounted() {
    await this.loadDashboardData();
    await this.loadPeopleOverview();
    this.logContainerHeights();
  },
  
  updated() {
    this.logContainerHeights();
  },
  
  watch: {
    projectId() {
      this.loadDashboardData();
      this.loadPeopleOverview();
    }
  },
  
  methods: {
    async loadDashboardData() {
      this.loading = true;
      try {
        await this.loadDashboardStats();
      } catch (error) {
        console.error('대시보드 데이터 로딩 실패:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadDashboardStats() {
      try {
        const userId = localStorage.getItem('id');
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        
        const response = await axios.get(
          `${baseURL}/workspace-service/project/dashboard/${this.projectId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200 && response.data.result) {
          const dashboardData = response.data.result;
          
          // 프로젝트 마일스톤 (진행률)
          this.projectStats.progress = dashboardData.projectMilestone 
            ? Math.round(Number(dashboardData.projectMilestone)) 
            : 0;
          
          // 스톤 통계
          this.projectStats.totalStones = dashboardData.totalStoneCount || 0;
          this.projectStats.completedStones = dashboardData.completedStoneCount || 0;
          
          // 태스크 통계
          this.projectStats.totalTasks = dashboardData.totalTaskCount || 0;
          this.projectStats.completedTasks = dashboardData.completedTaskCount || 0;
        }
      } catch (error) {
        console.error('대시보드 통계 로딩 실패:', error);
      }
    },
    
    
    async loadPeopleOverview() {
      this.loadingPeople = true;
      this.peopleError = null;
      
      // Mock 모드 (테스트용)
      const useMock = false;
      
      if (useMock) {
        // 샘플 데이터
        this.peopleOverview = {
          totalPeopleCount: 5,
          managerCount: 3,
          participantOnlyCount: 2,
          people: [
            {
              user: {
                userId: "user1",
                userName: "홍길동",
                userEmail: "hong@example.com",
                profileImageUrl: null
              },
              ownedStoneCount: 3,
              participatingStoneCount: 5,
              ownedStones: [
                { stoneId: "s1", stoneName: "프론트엔드" },
                { stoneId: "s2", stoneName: "백엔드" },
                { stoneId: "s3", stoneName: "디자인" },
                { stoneId: "s4", stoneName: "기획" }
              ],
              participatingStones: [
                { stoneId: "s1", stoneName: "프론트엔드" },
                { stoneId: "s2", stoneName: "백엔드" },
                { stoneId: "s3", stoneName: "디자인" },
                { stoneId: "s4", stoneName: "기획" },
                { stoneId: "s5", stoneName: "QA" }
              ],
              myTaskTotal: 10,
              myTaskCompleted: 7
            },
            {
              user: {
                userId: "user2",
                userName: "김철수",
                userEmail: "kim@example.com",
                profileImageUrl: null
              },
              ownedStoneCount: 2,
              participatingStoneCount: 3,
              ownedStones: [
                { stoneId: "s6", stoneName: "인프라" },
                { stoneId: "s7", stoneName: "배포" }
              ],
              participatingStones: [
                { stoneId: "s1", stoneName: "프론트엔드" },
                { stoneId: "s2", stoneName: "백엔드" },
                { stoneId: "s6", stoneName: "인프라" }
              ],
              myTaskTotal: 8,
              myTaskCompleted: 5
            }
          ]
        };
        this.loadingPeople = false;
        return;
      }
      
      try {
        const overview = await getProjectPeopleOverview(this.projectId);
        this.peopleOverview = overview;
      } catch (error) {
        console.error('인원 현황 로딩 실패:', error);
        this.peopleError = error.message || '인원 현황을 불러오는 중 오류가 발생했습니다.';
        this.peopleOverview = null;
      } finally {
        this.loadingPeople = false;
      }
    },
    
    logContainerHeights() {
      this.$nextTick(() => {
        const container = this.$el;
        const dashboardContent = container?.querySelector('.dashboard-content');
        
        console.log('=== 대시보드 컨테이너 높이 정보 ===');
        
        if (container) {
          const containerStyle = window.getComputedStyle(container);
          console.log('프로젝트 대시보드 컨테이너:');
          console.log('  - offsetHeight:', container.offsetHeight, 'px');
          console.log('  - scrollHeight:', container.scrollHeight, 'px');
          console.log('  - clientHeight:', container.clientHeight, 'px');
          console.log('  - style.height:', container.style.height || 'none');
          console.log('  - computed height:', containerStyle.height);
          console.log('  - computed max-height:', containerStyle.maxHeight);
          console.log('  - computed overflow-y:', containerStyle.overflowY);
        }
        
        if (dashboardContent) {
          console.log('대시보드 콘텐츠:');
          console.log('  - offsetHeight:', dashboardContent.offsetHeight, 'px');
          console.log('  - scrollHeight:', dashboardContent.scrollHeight, 'px');
          console.log('  - clientHeight:', dashboardContent.clientHeight, 'px');
        }
        
        if (container) {
          const canScroll = container.scrollHeight > container.clientHeight;
          console.log('컨테이너 스크롤 가능 여부:');
          console.log('  - 스크롤 가능:', canScroll);
          console.log('  - scrollTop:', container.scrollTop, 'px');
          console.log('  - 최대 scrollTop:', container.scrollHeight - container.clientHeight, 'px');
        }
        
        // 부모 컨테이너도 확인
        const parentContainer = container?.parentElement;
        if (parentContainer) {
          const parentStyle = window.getComputedStyle(parentContainer);
          console.log('부모 컨테이너 (.dashboard-container):');
          console.log('  - offsetHeight:', parentContainer.offsetHeight, 'px');
          console.log('  - scrollHeight:', parentContainer.scrollHeight, 'px');
          console.log('  - clientHeight:', parentContainer.clientHeight, 'px');
          console.log('  - className:', parentContainer.className);
          console.log('  - style.height:', parentContainer.style.height || 'none');
          console.log('  - computed height:', parentStyle.height);
          console.log('  - computed overflow:', parentStyle.overflow);
        }
        
        // 최상위 부모도 확인
        const grandParent = parentContainer?.parentElement;
        if (grandParent) {
          const grandParentStyle = window.getComputedStyle(grandParent);
          console.log('조부모 컨테이너 (.other-tabs):');
          console.log('  - offsetHeight:', grandParent.offsetHeight, 'px');
          console.log('  - scrollHeight:', grandParent.scrollHeight, 'px');
          console.log('  - clientHeight:', grandParent.clientHeight, 'px');
          console.log('  - className:', grandParent.className);
          console.log('  - style.height:', grandParent.style.height || 'none');
          console.log('  - computed height:', grandParentStyle.height);
          console.log('  - computed flex:', grandParentStyle.flex);
        }
        
        console.log('=== 높이 정보 끝 ===\n');
      });
    }
    
  }
};
</script>

<style scoped>
.project-dashboard-container {
  width: 100%;
  height: 100%;
  max-height: 100%;
  padding: 30px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  position: relative;
}

.project-dashboard-container::-webkit-scrollbar {
  width: 8px;
}

.project-dashboard-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.project-dashboard-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.project-dashboard-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-text {
  font-size: 16px;
  color: #666;
}

.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: visible;
}

/* 통계 카드 영역 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon img {
  width: 28px;
  height: 28px;
}

.stone-icon {
  background: #e3f2fd;
}

.completed-stone-icon {
  background: #e8f5e9;
}

.completed-task-icon {
  background: #f3e5f5;
}

.progress-icon {
  background: #fff3e0;
}

.task-icon {
  background: #f3e5f5;
}

.progress-circle {
  position: relative;
  width: 56px;
  height: 56px;
}

.circular-chart {
  width: 56px;
  height: 56px;
  transform: rotate(-90deg);
}

.circle-bg {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke: #ffa726;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 600;
  color: #ffa726;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

</style>

