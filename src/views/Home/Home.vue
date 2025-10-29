<template>
  <div class="home-container">
    <!-- 메인 컨텐츠 영역 -->
    <div class="main-content">
      <!-- 상단 헤더 -->
      <div class="content-header">
        <div class="date-section">
          <h1 class="main-title">오늘의 일정</h1>
          <p class="today-date">{{ todayDate }}</p>
        </div>
      </div>

      <!-- 컨텐츠 그리드 -->
      <div class="content-grid">
        <!-- 첫 번째 열: 프로젝트 + Task -->
        <div class="left-column">
          <!-- 프로젝트 목록 섹션 -->
          <div class="project-section">
            <div class="section-header">
              <h2 class="section-title">프로젝트 목록</h2>
              <button class="add-button">+ 프로젝트 추가</button>
            </div>
            <div class="gantt-chart">
              <div class="gantt-header">
                <div class="month-labels">
                  <span v-for="(label, index) in projectTimelineLabels" :key="index">{{ label.label }}</span>
                </div>
                <div v-if="showTodayLine" class="today-line" :style="{ left: todayLinePosition }"></div>
              </div>
              <div class="gantt-bars">
                <div v-if="loading" class="loading-message">
                  프로젝트 로딩 중...
                </div>
                <div v-else-if="myProjects.length === 0" class="no-tasks-message">
                  참여 중인 프로젝트가 없습니다.
                </div>
                <div v-else>
                  <div class="gantt-bar" v-for="project in myProjects" :key="project.id" :style="project.style">
                    <div class="bar-content">
                      <div class="project-name">{{ project.name }}</div>
                      <div class="project-period">{{ formatProjectPeriod(project.startTime, project.endTime) }}</div>
                      <div class="project-progress">{{ project.progress }}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 나의 Task 섹션 -->
          <div class="urgent-tasks-section">
            <div class="section-header">
              <h2 class="section-title">📋 나의 Task</h2>
              <div class="task-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ taskStats.total }}</span>
                  <span class="stat-label">총 Task</span>
                </div>
                <div class="stat-item completed">
                  <span class="stat-number">{{ taskStats.completed }}</span>
                  <span class="stat-label">완료</span>
                </div>
                <div class="stat-item pending">
                  <span class="stat-number">{{ taskStats.pending }}</span>
                  <span class="stat-label">진행중</span>
                </div>
                <div class="stat-item rate">
                  <span class="stat-number">{{ taskStats.completionRate }}%</span>
                  <span class="stat-label">완료율</span>
                </div>
              </div>
            </div>
            
            <div class="progress-section">
              <div v-if="loading" class="loading-message">
                로딩 중...
              </div>
              <div v-else-if="myTasks.length === 0" class="no-tasks-message">
                할당된 Task가 없습니다.
              </div>
              <div v-else class="task-sections">
                <!-- 미완료 태스크 -->
                <div v-if="pendingTasks.length > 0" class="task-group">
                  <h4 class="task-group-title">🔄 진행중인 Task ({{ pendingTasks.length }})</h4>
                  <div class="task-list">
                    <div class="task-item" v-for="task in pendingTasks" :key="task.id">
                      <div class="task-progress-bar">
                        <div class="progress-fill" :style="{ width: task.progress + '%', background: task.color }"></div>
                      </div>
                      <div class="task-content">
                        <div class="task-info">
                          <span class="task-name">{{ task.name }}</span>
                          <span class="task-project">{{ task.projectName }} - {{ task.stoneName }}</span>
                        </div>
                        <span class="task-deadline">{{ task.deadline }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 두 번째 열: 문서함 (60% 비중) -->
        <div class="middle-column">
          <div class="stone-documents-section">
            <h2 class="section-title">나의 스톤 문서함</h2>
            <div class="document-list">
              <div class="document-folder" v-for="folder in documentFolders" :key="folder.id">
                <div class="folder-header" :style="{ backgroundColor: folder.color }">
                  <span class="folder-name">📁 {{ folder.name }}</span>
                </div>
                <div class="folder-content">
                  <div class="document-item" v-for="doc in folder.documents" :key="doc.id">
                    <span class="doc-icon">📄</span>
                    <span class="doc-name">{{ doc.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 세 번째 열: 채팅 알림 (40% 비중) -->
        <div class="right-column">
          <div class="chat-notifications-section">
            <div class="notifications-header">
              <h2 class="section-title">채팅 알림</h2>
              <div class="notification-badge">8</div>
            </div>
            <div class="notifications-list">
              <div class="notification-item" v-for="notification in chatNotifications" :key="notification.id">
                <div class="notification-avatar"></div>
                <div class="notification-content">
                  <div class="notification-header">
                    <span class="sender-name">{{ notification.sender }}</span>
                    <span class="notification-time">{{ notification.time }}</span>
                  </div>
                  <div class="notification-message">{{ notification.message }}</div>
                </div>
                <div class="notification-menu">
                  <div class="menu-dot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { workspaceWatcher } from '@/mixins/workspaceWatcher';
import { getMyTasks, getMyProjects } from '@/api/task.js';
import { useWorkspaceStore } from '@/stores/workspace.js';

export default {
  name: "Home",
  mixins: [workspaceWatcher],
  
  data() {
    return {
      myProjects: [], // API에서 가져온 실제 프로젝트 데이터
      milestones: [
        { id: 1, progress: 60, name: '프로젝트 설계' },
        { id: 2, progress: 80, name: '개발 완료' }
      ],
      myTasks: [], // API에서 가져온 실제 데이터
      documentFolders: [
        {
          id: 1,
          name: '한화시스템 일정관리 웹서비스',
          color: 'linear-gradient(90deg, #FFE364 0%, #FFD700 100%)',
          documents: [
            { id: 1, name: '요구사항 문서' },
            { id: 2, name: '설계 문서' },
            { id: 3, name: '테스트 계획서' }
          ]
        },
        {
          id: 2,
          name: '인프런 강의 플랫폼',
          color: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
          documents: [
            { id: 4, name: '기획서' },
            { id: 5, name: 'UI/UX 디자인' }
          ]
        },
        {
          id: 3,
          name: 'React Native 모바일 앱',
          color: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)',
          documents: [
            { id: 6, name: '앱 설계서' },
            { id: 7, name: 'API 문서' }
          ]
        }
      ],
      chatNotifications: [
        {
          id: 1,
          sender: '조민형',
          message: '어제 미팅자료 잘 정리해놓으세요~~',
          time: '15분 전'
        },
        {
          id: 2,
          sender: '조민형 외 2명',
          message: '어제 미팅자료 잘 정리해놓으세요~~',
          time: '어제'
        },
        {
          id: 3,
          sender: '김현지 외 4명',
          message: '어제 미팅자료 잘 정리하시고 각자 맡은 업...',
          time: '2025-09-23'
        }
      ],
      loading: false
    };
  },
  
  async mounted() {
    // store 초기화
    const workspaceStore = useWorkspaceStore();
    workspaceStore.initialize();
    
    await Promise.all([
      this.loadMyTasks(),
      this.loadMyProjects()
    ]);
  },
  
  computed: {
    // 오늘 날짜 (실시간 업데이트)
    todayDate() {
      return this.getTodayDate();
    },
    
    // 프로젝트 기간 기반 X축 라벨
    projectTimelineLabels() {
      if (this.myProjects.length === 0) return [];
      
      // 모든 프로젝트의 시작일과 종료일 찾기
      const allDates = [];
      this.myProjects.forEach(project => {
        allDates.push(new Date(project.startTime));
        allDates.push(new Date(project.endTime));
      });
      
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      
      // 30일 간격으로 라벨 생성
      const labels = [];
      const current = new Date(minDate);
      const end = new Date(maxDate);
      
      while (current <= end) {
        labels.push({
          date: new Date(current),
          label: `${current.getMonth() + 1}/${current.getDate()}`
        });
        current.setDate(current.getDate() + 30);
      }
      
      return labels;
    },
    
    // 프로젝트 기간 범위
    projectDateRange() {
      if (this.myProjects.length === 0) {
        return { start: new Date(), end: new Date() };
      }
      
      const allDates = [];
      this.myProjects.forEach(project => {
        allDates.push(new Date(project.startTime));
        allDates.push(new Date(project.endTime));
      });
      
      return {
        start: new Date(Math.min(...allDates)),
        end: new Date(Math.max(...allDates))
      };
    },
    
    // Today 라인 위치 계산 (프로젝트 기간 기준)
    todayLinePosition() {
      if (this.myProjects.length === 0) return '0%';
      
      const today = new Date();
      const range = this.projectDateRange;
      
      // 프로젝트 기간 내에 오늘이 있는지 확인
      if (today < range.start || today > range.end) {
        return '0%'; // 프로젝트 기간 밖이면 표시하지 않음
      }
      
      // 프로젝트 기간 내에서의 오늘의 위치 계산
      const totalDays = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24));
      const daysFromStart = Math.ceil((today - range.start) / (1000 * 60 * 60 * 24));
      
      const position = (daysFromStart / totalDays) * 100;
      return `${Math.max(0, Math.min(100, position))}%`;
    },
    
    // Today 라인 표시 여부
    showTodayLine() {
      if (this.myProjects.length === 0) return false;
      
      const today = new Date();
      const range = this.projectDateRange;
      
      return today >= range.start && today <= range.end;
    },
    
    // 태스크 통계 계산
    taskStats() {
      const totalTasks = this.myTasks.length;
      const completedTasks = this.myTasks.filter(task => task.isDone).length;
      const pendingTasks = totalTasks - completedTasks;
      
      return {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    },
    
    // 미완료 태스크 목록
    pendingTasks() {
      return this.myTasks.filter(task => !task.isDone);
    }
  },
  
  methods: {
    // 워크스페이스 변경 감지 메서드 오버라이드
    onWorkspaceChanged(workspaceData) {
      console.log('Home: 워크스페이스 변경됨', workspaceData);
      this.refreshHomeData();
    },
    
    async refreshHomeData() {
      console.log('홈 페이지 데이터 새로고침');
      await Promise.all([
        this.loadMyTasks(),
        this.loadMyProjects()
      ]);
    },
    
    // 나의 프로젝트 목록 로드
    async loadMyProjects() {
      try {
        const workspaceStore = useWorkspaceStore();
        const workspaceId = workspaceStore.getCurrentWorkspaceId || 'ws_2';
        
        const response = await getMyProjects(workspaceId);
        
        if (response.statusCode === 200) {
          this.myProjects = response.result.map(project => {
            const startDate = new Date(project.startTime);
            const endDate = new Date(project.endTime);
            const now = new Date();
            
            // 프로젝트 기간 계산 (일 단위)
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.max(0, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
            const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
            
            return {
              id: project.projectId,
              name: project.projectName,
              startTime: project.startTime,
              endTime: project.endTime,
              milestone: project.milestone,
              progress: progress,
              totalDays: totalDays,
              elapsedDays: elapsedDays,
              style: this.calculateProjectStyle(startDate, endDate, now)
            };
          });
        }
      } catch (error) {
        console.error('나의 프로젝트 로드 실패:', error);
        this.myProjects = [];
      }
    },
    
    // 나의 Task 목록 로드
    async loadMyTasks() {
      try {
        this.loading = true;
        
        // Pinia store에서 워크스페이스 ID 가져오기
        const workspaceStore = useWorkspaceStore();
        const workspaceId = workspaceStore.getCurrentWorkspaceId || 'ws_2';
        
        const response = await getMyTasks(workspaceId);
        
        if (response.statusCode === 200) {
          this.myTasks = response.result.map(task => {
            const isDone = task.done; // API 응답의 'done' 필드 사용
            
            return {
              id: task.taskId,
              name: task.taskName,
              projectName: task.projectName,
              stoneName: task.stoneName,
              startTime: task.startTime,
              endTime: task.endTime,
              isDone: isDone,
              deadline: isDone ? '완료' : this.calculateDeadline(task.endTime),
              progress: isDone ? 100 : this.calculateProgress(task.startTime, task.endTime),
              color: isDone ? 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)' : this.getTaskColor(task.endTime)
            };
          });
        }
      } catch (error) {
        console.error('나의 Task 로드 실패:', error);
        this.myTasks = [];
      } finally {
        this.loading = false;
      }
    },
    
    // 마감일 계산
    calculateDeadline(endTime) {
      const now = new Date();
      const end = new Date(endTime);
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return '기한 초과';
      } else if (diffDays === 0) {
        return 'D-Day';
      } else {
        return `D-${diffDays}`;
      }
    },
    
    // 진행률 계산 (시작일과 종료일 기준)
    calculateProgress(startTime, endTime) {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (now < start) {
        return 0;
      } else if (now > end) {
        return 100;
      } else {
        const totalDuration = end - start;
        const elapsed = now - start;
        return Math.round((elapsed / totalDuration) * 100);
      }
    },
    
    // Task 색상 결정
    getTaskColor(endTime) {
      const now = new Date();
      const end = new Date(endTime);
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)'; // 기한 초과
      } else if (diffDays <= 1) {
        return 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)'; // 긴급
      } else if (diffDays <= 3) {
        return 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)'; // 주의
      } else if (diffDays <= 7) {
        return 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)'; // 보통
      } else {
        return 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'; // 여유
      }
    },
    
    // 프로젝트 간트 차트 스타일 계산 (프로젝트 기간 기준)
    calculateProjectStyle(startDate, endDate, now) {
      const range = this.projectDateRange;
      
      if (range.start.getTime() === range.end.getTime()) {
        return {
          left: '0%',
          width: '100%',
          backgroundColor: '#FFE364'
        };
      }
      
      // 전체 프로젝트 기간에서의 위치 계산
      const totalRangeDays = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24));
      const projectStartOffset = Math.ceil((startDate - range.start) / (1000 * 60 * 60 * 24));
      const projectDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      const leftPercent = (projectStartOffset / totalRangeDays) * 100;
      const widthPercent = (projectDuration / totalRangeDays) * 100;
      
      return {
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.min(100, widthPercent)}%`,
        backgroundColor: '#FFE364'
      };
    },
    
    // 프로젝트 기간 포맷팅
    formatProjectPeriod(startTime, endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const startMonth = start.getMonth() + 1;
      const startDay = start.getDate();
      const endMonth = end.getMonth() + 1;
      const endDay = end.getDate();
      
      return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
    },
    
    // 오늘 날짜 포맷팅
    getTodayDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      return `Today ${year}.${month}.${day}`;
    }
  }
};
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
  overflow: hidden;
}

.main-content {
  padding: 20px 0 0 0;
  height: 100vh;
  overflow-y: auto;
  width: 100%;
}

.content-header {
  margin-bottom: 30px;
  padding: 0 20px;
}

.main-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  margin: 0 0 8px 0;
}

.today-date {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.8fr;
  gap: 20px;
  margin-bottom: 20px;
  height: calc(100vh - 120px);
  padding: 0 20px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
}

.middle-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.right-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 프로젝트 섹션 */
.project-section {
  background: #FFFFFF;
  border-radius: 15px;
  padding: 20px;
  flex: 1;
  min-height: 280px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0;
}

.add-button {
  background: #2A2828;
  border-radius: 8px;
  border: none;
  color: #FFFFFF;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  padding: 5px 12px;
  cursor: pointer;
}

/* 간트 차트 */
.gantt-chart {
  height: 200px;
  position: relative;
}

.gantt-header {
  position: relative;
  height: 40px;
  margin-bottom: 20px;
}

.month-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #666666;
}

.today-line {
  position: absolute;
  top: 20px;
  width: 2px;
  height: 20px;
  background: #FF4444;
  border: 2px dashed #FF4444;
}

.today-line::before {
  content: 'Today';
  position: absolute;
  top: -15px;
  left: -15px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #FF4444;
  background: #FFFFFF;
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
}

.gantt-bars {
  position: relative;
  height: 120px;
}

.gantt-bar {
  position: absolute;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  top: 0;
}

.gantt-bar:nth-child(1) {
  top: 0px;
}

.gantt-bar:nth-child(2) {
  top: 30px;
}

.gantt-bar:nth-child(3) {
  top: 60px;
}

.gantt-bar:nth-child(4) {
  top: 90px;
}

.bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.project-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 8px;
  line-height: 10px;
  color: #2A2828;
  flex: 1;
}

.project-period {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 8px;
  line-height: 10px;
  color: #666666;
}

.project-progress {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 8px;
  line-height: 10px;
  color: #000000;
}

/* 마일스톤 섹션 완전 제거 */

/* 나의 Task 섹션 */
.urgent-tasks-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
  border-radius: 15px;
  padding: 20px;
  flex: 1;
  min-height: 280px;
  overflow-y: auto;
}

.task-stats {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: #F8F9FA;
  border-radius: 8px;
  min-width: 60px;
}

.stat-item.completed {
  background: #E8F5E8;
}

.stat-item.pending {
  background: #FFF3E0;
}

.stat-item.rate {
  background: #E3F2FD;
}

.stat-number {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
}

.stat-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
  color: #666666;
  margin-top: 2px;
}

.task-sections {
  margin-top: 20px;
}

.task-group {
  margin-bottom: 20px;
}

.task-group:last-child {
  margin-bottom: 0;
}

.task-group-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  color: #1C0F0F;
  margin: 0 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #E9ECEF;
}

.progress-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  color: #1C0F0F;
  margin: 10px 0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.task-item:last-child {
  margin-bottom: 0;
}

.task-progress-bar {
  width: 200px;
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #1C0F0F;
}

.task-project {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 8px;
  line-height: 10px;
  color: #666666;
}

.task-deadline {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 9px;
  line-height: 11px;
  color: #FF6B6B;
  text-align: right;
}

.loading-message,
.no-tasks-message {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
  text-align: center;
  padding: 20px;
}


/* 나의 스톤 문서함 섹션 */
.stone-documents-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
  border-radius: 15px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.document-folder {
  border-radius: 8px;
  overflow: hidden;
}

.folder-header {
  padding: 8px 12px;
  border-radius: 8px 8px 0 0;
}

.folder-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #000000;
}

.folder-content {
  background: #F8FAFC;
  padding: 8px 12px;
  border-radius: 0 0 8px 8px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.doc-icon {
  font-size: 10px;
}

.doc-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
  color: #666666;
}

/* 채팅 알림 섹션 */
.chat-notifications-section {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.notification-badge {
  background: #FF1717;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #FFFFFF;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.notification-avatar {
  width: 32px;
  height: 32px;
  background: #2A2828;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.sender-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #000000;
}

.notification-time {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #484646;
}

.notification-message {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #484646;
}

.notification-menu {
  position: relative;
  cursor: pointer;
}

.menu-dot {
  width: 4px;
  height: 4px;
  background: #2A2828;
  border-radius: 50%;
}

.menu-dot::before,
.menu-dot::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: #2A2828;
  border-radius: 50%;
}

.menu-dot::before {
  top: -6px;
}

.menu-dot::after {
  top: 6px;
}

/* 반응형 레이아웃 */
@media (max-width: 1400px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    height: auto;
  }
  
  .middle-column {
    grid-column: 1;
    grid-row: 2;
  }
  
  .right-column {
    grid-column: 2;
    grid-row: 2;
  }
  
  .left-column {
    grid-column: 1 / -1;
    grid-row: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .project-section,
  .urgent-tasks-section {
    min-height: 300px;
  }
  
  .stone-documents-section,
  .chat-notifications-section {
    min-height: 400px;
  }
}

@media (max-width: 1000px) {
  .content-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    height: auto;
  }
  
  .left-column {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    flex-direction: column;
  }
  
  .middle-column {
    grid-column: 1;
    grid-row: 2;
  }
  
  .right-column {
    grid-column: 1;
    grid-row: 3;
  }
  
  .project-section,
  .urgent-tasks-section,
  .stone-documents-section,
  .chat-notifications-section {
    min-height: 250px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 10px;
  }
  
  .content-grid {
    gap: 15px;
  }
  
  .project-section,
  .urgent-tasks-section,
  .stone-documents-section,
  .chat-notifications-section {
    min-height: 200px;
    padding: 15px;
  }
}
</style>

