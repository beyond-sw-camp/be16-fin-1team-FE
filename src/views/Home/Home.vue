<template>
  <div class="home-container">
    <!-- 메인 컨텐츠 영역 -->
    <div class="main-content">
      <!-- 상단 헤더 -->
      <div class="content-header">
        <div class="date-section">
          <p class="today-date">{{ todayDate }}</p>
        </div>
      </div>

      <!-- 컨텐츠 그리드 -->
      <div class="dashboard-layout">
        <!-- 1행 -->
        <!-- 진행중인 프로젝트 -->
        <section class="project-section">
          <div class="section-header">
            <h2 class="section-title">진행중인 프로젝트</h2>
            <button class="add-button" @click="openProjectCreateModal">+ 프로젝트 추가</button>
          </div>
          <div class="gantt-chart">
            <div class="gantt-header">
              <div class="month-labels">
                <span v-for="(label, index) in projectTimelineLabels" :key="index">{{ label.label }}</span>
              </div>
            </div>
            <div v-if="showTodayLine" class="today-line" :style="{ left: todayLinePosition }"></div>
            <div class="gantt-bars">
              <div v-if="loading" class="loading-message">
                프로젝트 로딩 중...
              </div>
              <div v-else-if="myProjects.length === 0" class="no-projects-message">
                <div class="no-projects-text">진행중인 프로젝트가 없습니다.</div>
                <div class="no-projects-subtext">새롭게 시작해보세요!</div>
              </div>
              <div v-else>
                <div class="gantt-bar-wrapper" v-for="project in myProjects" :key="project.id">
                  <div class="gantt-bar" :style="project.style" @click="goToProject(project)">
                    <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
                    <div class="bar-content">
                      <div class="project-name">{{ project.name }}</div>
                      <div class="project-progress">{{ project.progress }}%</div>
                    </div>
                  </div>
                  <div class="project-period" :style="{ left: project.style.left }">{{ formatProjectPeriod(project.startTime, project.endTime) }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 스톤 채팅방 목록 -->
        <aside class="chat-section">
          <ChatRoomList 
            embedded 
            @select-room="handleChatRoomSelect"
            @preview-summary="handlePreviewSummary"
            :summaries-by-room-id="summariesByRoomId"
            :selected-room-id="null"
          />
        </aside>

        <!-- 2행 -->
        <!-- 나의 스톤 문서함 -->
        <section class="docs-section">
          <h2 class="section-title">나의 스톤 문서함</h2>
          <div class="document-list">
            <div v-if="documentFolders.length === 0" class="no-stones-message">
              <div class="no-stones-text">나의 스톤이 없습니다.</div>
            </div>
            <div v-else>
              <div class="document-folder" v-for="folder in documentFolders" :key="folder.id">
                <div class="folder-header" :style="{ backgroundColor: folder.color }">
                  <span class="folder-name">📁 {{ folder.name }}</span>
                </div>
                <div class="folder-content">
                  <div class="document-item" v-for="doc in folder.documents" :key="doc.id" @click="goToStoneDrive(doc)">
                    <span class="doc-icon">📄</span>
                    <span class="doc-name">{{ doc.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 나의 Task -->
        <section class="task-section">
          <div class="section-header">
            <h2 class="section-title">나의 Task</h2>
          </div>
          
          <div class="task-timeline-wrapper">
            <div v-if="loading" class="loading-message">
              로딩 중...
            </div>
            <div v-else-if="pendingTasks.length === 0" class="no-tasks-message">
              할당된 Task가 없습니다.
            </div>
            <div v-else class="task-timeline-chart">
              <!-- 타임라인 헤더 -->
              <div class="task-timeline-header">
                <div class="task-timeline-labels">
                  <span v-for="(label, index) in taskTimelineLabels" :key="index" class="task-label">
                    {{ label.label }}
                  </span>
                </div>
              </div>
              <div v-if="showTaskTodayLine" class="task-today-line" :style="{ left: taskTodayLinePosition }"></div>
              
              <!-- Task 바들 -->
              <div class="task-timeline-bars">
                <div class="task-bar-wrapper" v-for="task in pendingTasks" :key="task.id">
                  <div class="task-bar" :style="calculateTaskBarStyle(task)" @click="goToTask(task)">
                    <div class="task-bar-content">
                      <div class="task-bar-name">{{ task.name }}</div>
                      <div class="task-bar-deadline">{{ task.deadline }}</div>
                    </div>
                  </div>
                  <div class="task-bar-period" :style="{ left: calculateTaskBarStyle(task).left }">
                    {{ formatTaskPeriod(task.startTime, task.endTime) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
  
  <!-- 요약 미리보기 다이얼로그 -->
  <v-dialog v-model="isSummaryDialogOpen" max-width="520px">
    <v-card class="summary-card">
      <v-card-title class="text-h6 summary-title">요약 미리보기</v-card-title>
      <v-card-text class="summary-body">
        <div v-if="summaryDialogLoading" class="d-flex align-center justify-center" style="min-height:120px">
          <v-progress-circular indeterminate :size="42" :width="4" color="#FFE364" />
        </div>
        <div v-else v-html="formatMultiline(summaryDialogText)" style="white-space: normal; line-height: 1.5;"></div>
      </v-card-text>
      <v-card-actions class="justify-end summary-actions">
        <v-btn class="summary-btn" variant="flat" @click="isSummaryDialogOpen = false">닫기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { workspaceWatcher } from '@/mixins/workspaceWatcher';
import { getMyTasks, getMyProjects, getMyStones } from '@/api/task.js';
import { useWorkspaceStore } from '@/stores/workspace.js';
import ChatRoomList from '@/views/Chat/ChatRoomList.vue';
import stompManager from '@/services/stompService.js';
import axios from 'axios';

export default {
  name: "Home",
  mixins: [workspaceWatcher],
  components: {
    ChatRoomList
  },
  
  data() {
    return {
      myProjects: [], // API에서 가져온 실제 프로젝트 데이터
      milestones: [
        { id: 1, progress: 60, name: '프로젝트 설계' },
        { id: 2, progress: 80, name: '개발 완료' }
      ],
      myTasks: [], // API에서 가져온 실제 데이터
      myStones: [], // API에서 가져온 실제 스톤 데이터
      documentFolders: [], // 프로젝트별로 그룹화된 스톤 데이터
      loading: false,
      summariesByRoomId: {},
      summaryUnsub: null,
      isSummaryDialogOpen: false,
      summaryDialogLoading: false,
      summaryDialogText: ''
    };
  },
  
    async mounted() {
    // store 초기화
    const workspaceStore = useWorkspaceStore();
    workspaceStore.initialize();
    
    await Promise.all([
      this.loadMyTasks(),
      this.loadMyProjects(),
      this.loadMyStones()
    ]);
    
    // 프로젝트 생성 후 목록 새로고침
    window.addEventListener('projectCreated', this.onProjectCreated);
    
    // 채팅 요약 STOMP 구독
    this.initChatSummarySubscription();
  },
  
  beforeUnmount() {
    window.removeEventListener('projectCreated', this.onProjectCreated);
    
    // 채팅 요약 구독 해제
    if (this.summaryUnsub) {
      try { this.summaryUnsub(); } catch (_) {}
      this.summaryUnsub = null;
    }
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
      
      // 4개의 날짜 라벨 생성 (첫 날짜 + 2개 중간 + 마지막 날짜)
      const labels = [];
      const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
      const interval = totalDays / 3; // 3등분
      
      // 첫 번째 날짜
      labels.push({
        date: new Date(minDate),
        label: `${minDate.getMonth() + 1}/${minDate.getDate()}`
      });
      
      // 중간 날짜 2개
      for (let i = 1; i <= 2; i++) {
        const intermediateDate = new Date(minDate);
        intermediateDate.setDate(minDate.getDate() + Math.round(interval * i));
        labels.push({
          date: new Date(intermediateDate),
          label: `${intermediateDate.getMonth() + 1}/${intermediateDate.getDate()}`
        });
      }
      
      // 마지막 날짜
      labels.push({
        date: new Date(maxDate),
        label: `${maxDate.getMonth() + 1}/${maxDate.getDate()}`
      });
      
      return labels;
    },
    
    
    // Today 라인 위치 계산 (프로젝트 기간 기준)
    todayLinePosition() {
      if (this.myProjects.length === 0) return '0%';
      
      const today = new Date();
      const range = this.getProjectDateRange();
      
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
      const range = this.getProjectDateRange();
      
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
    },
    
    // Task 타임라인 라벨 (Task 전체 기간 기준 MM/DD)
    taskTimelineLabels() {
      if (this.pendingTasks.length === 0) return [];
      
      // 모든 Task의 시작일과 종료일 찾기
      const allDates = [];
      this.pendingTasks.forEach(task => {
        allDates.push(new Date(task.startTime));
        allDates.push(new Date(task.endTime));
      });
      
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      
      // 4개의 날짜 라벨 생성 (첫 날짜 + 2개 중간 + 마지막 날짜)
      const labels = [];
      const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
      const interval = totalDays / 3; // 3등분
      
      // 첫 번째 날짜
      labels.push({
        date: new Date(minDate),
        label: `${minDate.getMonth() + 1}/${minDate.getDate()}`
      });
      
      // 중간 날짜 2개
      for (let i = 1; i <= 2; i++) {
        const intermediateDate = new Date(minDate);
        intermediateDate.setDate(minDate.getDate() + Math.round(interval * i));
        labels.push({
          date: new Date(intermediateDate),
          label: `${intermediateDate.getMonth() + 1}/${intermediateDate.getDate()}`
        });
      }
      
      // 마지막 날짜
      labels.push({
        date: new Date(maxDate),
        label: `${maxDate.getMonth() + 1}/${maxDate.getDate()}`
      });
      
      return labels;
    },
    
    // Task Today 라인 위치
    taskTodayLinePosition() {
      if (this.pendingTasks.length === 0) return '0%';
      
      const today = new Date();
      const range = this.getTaskDateRange();
      
      // Task 기간 내에 오늘이 있는지 확인
      if (today < range.start || today > range.end) {
        return '0%'; // Task 기간 밖이면 표시하지 않음
      }
      
      // Task 기간 내에서의 오늘의 위치 계산
      const totalDays = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24));
      const daysFromStart = Math.ceil((today - range.start) / (1000 * 60 * 60 * 24));
      
      const position = (daysFromStart / totalDays) * 100;
      return `${Math.max(0, Math.min(100, position))}%`;
    },
    
    // Task Today 라인 표시 여부
    showTaskTodayLine() {
      if (this.pendingTasks.length === 0) return false;
      
      const today = new Date();
      const range = this.getTaskDateRange();
      
      return today >= range.start && today <= range.end;
    }
  },
  
  methods: {
    // 프로젝트 기간 범위 계산 메서드
    getProjectDateRange() {
      if (this.myProjects.length === 0) {
        console.log('프로젝트가 없음, 기본 날짜 반환');
        return { start: new Date(), end: new Date() };
      }
      
      const allDates = [];
      this.myProjects.forEach(project => {
        allDates.push(new Date(project.startTime));
        allDates.push(new Date(project.endTime));
      });
      
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      
      console.log('projectDateRange 계산:', {
        projectCount: this.myProjects.length,
        allDates: allDates.map(d => d.toISOString().split('T')[0]),
        minDate: minDate.toISOString().split('T')[0],
        maxDate: maxDate.toISOString().split('T')[0]
      });
      
      return {
        start: minDate,
        end: maxDate
      };
    },
    
    // 워크스페이스 변경 감지 메서드 오버라이드
    onWorkspaceChanged(workspaceData) {
      console.log('Home: 워크스페이스 변경됨', workspaceData);
      this.refreshHomeData();
    },
    
    async refreshHomeData() {
      console.log('홈 페이지 데이터 새로고침');
      await Promise.all([
        this.loadMyTasks(),
        this.loadMyProjects(),
        this.loadMyStones()
      ]);
    },
    
    // 나의 프로젝트 목록 로드
    async loadMyProjects() {
      try {
        const workspaceStore = useWorkspaceStore();
        const workspaceId = workspaceStore.getCurrentWorkspaceId || 'ws_2';
        
        const response = await getMyProjects(workspaceId);
        
        if (response.statusCode === 200) {
          // 먼저 기본 프로젝트 데이터 설정
          this.myProjects = response.result.map(project => {
            const startDate = new Date(project.startTime);
            const endDate = new Date(project.endTime);
            const now = new Date();
            
            // 프로젝트 기간 계산 (일 단위)
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const elapsedDays = Math.max(0, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
            
            // 마일스톤 진행률 (서버에서 이미 계산된 값)
            const progress = Number(project.milestone) || 0;
            
            return {
              id: project.projectId,
              name: project.projectName,
              startTime: project.startTime,
              endTime: project.endTime,
              milestone: project.milestone,
              progress: progress,
              totalDays: totalDays,
              elapsedDays: elapsedDays,
              style: {} // 임시로 빈 객체 설정
            };
          });
          
          // 시작 일자가 빠른 순으로 정렬
          this.myProjects.sort((a, b) => {
            return new Date(a.startTime) - new Date(b.startTime);
          });
          
          // myProjects 설정 후 스타일 계산
          this.myProjects = this.myProjects.map(project => {
            const startDate = new Date(project.startTime);
            const endDate = new Date(project.endTime);
            const now = new Date();
            
            return {
              ...project,
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
        const response = await getMyTasks();
        
        if (response.statusCode === 200) {
          this.myTasks = response.result.map(task => {
            const isDone = task.done; // API 응답의 'done' 필드 사용
            
            return {
              id: task.taskId,
              name: task.taskName,
              projectName: task.projectName,
              stoneName: task.stoneName,
              stoneId: task.stoneId,
              startTime: task.startTime,
              endTime: task.endTime,
              isDone: isDone,
              deadline: isDone ? '완료' : this.calculateDeadline(task.endTime),
              stoneMilestone: task.stoneMilestone || 0
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
    
    // 나의 스톤 목록 로드 및 프로젝트별 그룹화
    async loadMyStones() {
      try {
        const workspaceStore = useWorkspaceStore();
        const workspaceId = workspaceStore.getCurrentWorkspaceId || localStorage.getItem('selectedWorkspaceId') || 'ws_2';
        
        const response = await getMyStones(workspaceId);
        
        if (response.statusCode === 200) {
          this.myStones = response.result.map(stone => ({
            stoneId: stone.stoneId,
            stoneName: stone.stoneName,
            projectName: stone.projectName,
            milestone: stone.milestone,
            startTime: stone.startTime,
            endTime: stone.endTime
          }));
          
          // 프로젝트별로 그룹화
          this.groupStonesByProject();
        } else {
          this.myStones = [];
          this.documentFolders = [];
        }
      } catch (error) {
        console.error('나의 스톤 로드 실패:', error);
        this.myStones = [];
        this.documentFolders = [];
      }
    },
    
    // 프로젝트별로 스톤 그룹화
    groupStonesByProject() {
      const projectMap = new Map();
      
      // 프로젝트별로 스톤 그룹화
      this.myStones.forEach(stone => {
        if (!projectMap.has(stone.projectName)) {
          projectMap.set(stone.projectName, []);
        }
        projectMap.get(stone.projectName).push(stone);
      });
      
      // 그룹화된 데이터를 documentFolders 형식으로 변환
      const colors = [
        'linear-gradient(90deg, #FFE364 0%, #FFD700 100%)',
        'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
        'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)',
        'linear-gradient(135deg, #AB47BC 0%, #8E24AA 100%)',
        'linear-gradient(135deg, #EF5350 0%, #E53935 100%)',
        'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)'
      ];
      
      let colorIndex = 0;
      this.documentFolders = Array.from(projectMap.entries()).map(([projectName, stones], index) => {
        const color = colors[colorIndex % colors.length];
        colorIndex++;
        
        return {
          id: index + 1,
          name: projectName,
          color: color,
          documents: stones.map(stone => ({
            id: stone.stoneId,
            name: stone.stoneName,
            stoneId: stone.stoneId
          }))
        };
      });
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
    
    // 프로젝트 간트 차트 스타일 계산 (프로젝트 기간 기준)
    calculateProjectStyle(startDate, endDate, now) {
      const range = this.getProjectDateRange();
      
      console.log('calculateProjectStyle 호출:', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        rangeStart: range.start.toISOString().split('T')[0],
        rangeEnd: range.end.toISOString().split('T')[0]
      });
      
      if (range.start.getTime() === range.end.getTime()) {
        console.log('동일한 날짜 범위, 0% 위치 반환');
        return {
          left: '0%',
          width: '100%'
        };
      }
      
      // 전체 프로젝트 기간에서의 위치 계산
      const totalRangeDays = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24));
      const projectStartOffset = Math.ceil((startDate - range.start) / (1000 * 60 * 60 * 24));
      const projectDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      const leftPercent = (projectStartOffset / totalRangeDays) * 100;
      const widthPercent = (projectDuration / totalRangeDays) * 100;
      
      console.log('계산 결과:', {
        totalRangeDays,
        projectStartOffset,
        projectDuration,
        leftPercent,
        widthPercent
      });
      
      return {
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.min(100, widthPercent)}%`
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
    },
    
    // 프로젝트 생성 모달 열기
    openProjectCreateModal() {
      window.dispatchEvent(new CustomEvent('openCreateProjectModal'));
    },
    
    // 프로젝트 생성 후 목록 새로고침
    async onProjectCreated() {
      console.log('Home: 프로젝트 생성됨, 목록 새로고침');
      await this.loadMyProjects();
    },
    
    // 프로젝트 페이지로 이동
    goToProject(project) {
      console.log('프로젝트로 이동:', project);
      this.$router.push({ path: '/project', query: { id: project.id } });
    },
    
    // 채팅 요약 STOMP 구독 초기화
    async initChatSummarySubscription() {
      try {
        const id = localStorage.getItem('id');
        if (!id) return;
        
        await stompManager.connect();
        const topic = `/topic/summary/${id}`;
        
        this.summaryUnsub = await stompManager.subscribe(topic, (summary) => {
          try {
            console.log('[Home][summary] incoming', summary);
            if (summary && summary.roomId != null) {
              this.summariesByRoomId = {
                ...this.summariesByRoomId,
                [summary.roomId]: {
                  ...(this.summariesByRoomId[summary.roomId] || {}),
                  ...summary,
                },
              };
            }
          } catch(_) {}
        });
      } catch (error) {
        console.warn('[Home] 채팅 요약 구독 실패:', error);
      }
    },
    
    // 채팅방 선택 시 채팅 페이지로 이동
    handleChatRoomSelect(room) {
      console.log('채팅방 선택:', room);
      // 채팅방 ID를 localStorage에 저장
      if (room && room.roomId) {
        localStorage.setItem('selectedChatRoomId', room.roomId);
      }
      this.$router.push({ path: '/chat/main' });
    },
    
    // 채팅 요약 미리보기
    async handlePreviewSummary(room) {
      this.isSummaryDialogOpen = true;
      this.summaryDialogLoading = true;
      this.summaryDialogText = '';
      
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        console.log('[summary] request roomId=', room?.roomId);
        const { data } = await axios.get(`${baseURL}/workspace-service/chatbot/message/chat-room/${room.roomId}`);
        console.log('[summary] response data=', data);
        const text = (data && data.result && typeof data.result === 'object') 
          ? (data.result.text || '') 
          : (typeof data?.result === 'string' ? data.result : '');
        this.summaryDialogText = String(text || '');
      } catch (e) {
        console.error('[summary] request failed', e);
        this.summaryDialogText = '요약을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
      } finally {
        this.summaryDialogLoading = false;
      }
    },
    
    // 멀티라인 텍스트 포맷팅
    formatMultiline(text) {
      if (!text) return '';
      return String(text).replace(/\n/g, '<br/>');
    },
    
    // Task 기간 범위 계산
    getTaskDateRange() {
      if (this.pendingTasks.length === 0) {
        return { start: new Date(), end: new Date() };
      }
      
      const allDates = [];
      this.pendingTasks.forEach(task => {
        allDates.push(new Date(task.startTime));
        allDates.push(new Date(task.endTime));
      });
      
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      
      return {
        start: minDate,
        end: maxDate
      };
    },
    
    // Task 바 스타일 계산 (startTime ~ endTime 기준)
    calculateTaskBarStyle(task) {
      const range = this.getTaskDateRange();
      
      if (range.start.getTime() === range.end.getTime()) {
        return {
          left: '0%',
          width: '100%'
        };
      }
      
      const startDate = new Date(task.startTime);
      const endDate = new Date(task.endTime);
      
      // 전체 Task 기간에서의 위치 계산
      const totalRangeDays = Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24));
      const taskStartOffset = Math.ceil((startDate - range.start) / (1000 * 60 * 60 * 24));
      const taskDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      const leftPercent = (taskStartOffset / totalRangeDays) * 100;
      const widthPercent = (taskDuration / totalRangeDays) * 100;
      
      return {
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.min(100, widthPercent)}%`
      };
    },
    
    // Task 기간 포맷팅
    formatTaskPeriod(startTime, endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const startMonth = start.getMonth() + 1;
      const startDay = start.getDate();
      const endMonth = end.getMonth() + 1;
      const endDay = end.getDate();
      
      return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
    },
    
    // 스톤 문서함으로 이동
    goToStoneDrive(doc) {
      console.log('스톤 문서함으로 이동:', doc);
      if (doc.stoneId) {
        this.$router.push({
          name: 'driveRoot',
          params: { rootType: 'STONE', rootId: doc.stoneId }
        });
      } else {
        console.error('stoneId를 찾을 수 없음:', doc);
      }
    },
    
    // Task 페이지로 이동 (stone 모달 열기)
    goToTask(task) {
      console.log('Task로 이동:', task);
      
      // 프로젝트 이름으로 myProjects에서 projectId 찾기
      const project = this.myProjects.find(p => p.name === task.projectName);
      
      if (project && task.stoneId) {
        // 프로젝트 페이지로 이동하면서 stoneId 쿼리 파라미터로 전달
        this.$router.push({ 
          path: '/project', 
          query: { 
            id: project.id,
            stoneId: task.stoneId
          } 
        });
      } else {
        console.error('프로젝트 또는 stoneId를 찾을 수 없음:', { project, task });
      }
    }
  }
};
</script>

<style scoped>
.home-container {
  width: 100%;
  height: calc(100vh - 64px);
  background: #F5F5F5;
  overflow: hidden;
}

.main-content {
  padding: 10px 0 0 0;
  height: 100%;
  overflow-y: auto;
  width: 100%;
}

.content-header {
  margin-bottom: 10px;
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

.dashboard-layout {
  display: grid;
  grid-template-columns: 1.4fr 1.4fr 1.2fr; /* 왼쪽 2칸(균등) + 오른쪽 좁게 */
  grid-template-rows: auto auto; /* 2행 구조 */
  gap: 20px;
  width: 100%;
  padding: 0 20px 10px 20px;
  height: calc(100% - 50px);
  box-sizing: border-box;
}

/* 프로젝트 섹션 */
.project-section {
  grid-column: 1 / 3; /* 왼쪽 2칸 차지 */
  grid-row: 1 / 2;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
  transition: box-shadow 0.3s ease;
}

.project-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 28px;
  color: #1C0F0F;
  margin: 0;
  padding: 8px 0;
  min-height: 44px;
}

.task-section .section-header {
  margin-bottom: 20px;
}

.add-button {
  background: #2A2828;
  border-radius: 8px;
  border: none;
  color: #FFFFFF;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-button:hover {
  background: #3A3838;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.add-button:focus,
.add-button:focus-visible,
.add-button:active {
  outline: none !important;
  box-shadow: none !important;
}

/* 간트 차트 */
.gantt-chart {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
}

.gantt-header {
  position: relative;
  height: auto;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E0E0E0;
  overflow: visible;
}

.month-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
  padding-bottom: 6px;
}

.month-labels span {
  position: relative;
}

.month-labels span::after {
  content: '';
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 8px;
  background: #E0E0E0;
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: transparent;
  z-index: 10;
  pointer-events: none;
}

.today-line::before {
  content: 'Today';
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #FF4444;
  background: #FFFFFF;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  z-index: 11;
  pointer-events: auto;
}

.today-line::after {
  content: '';
  position: absolute;
  top: 32px;
  bottom: 0;
  left: 0;
  width: 2px;
  border-left: 2px dashed rgba(255, 68, 68, 0.6);
}

.gantt-bars {
  position: relative;
  flex: 1;
  min-height: 230px;
  z-index: 1;
}

.gantt-bar-wrapper {
  position: relative;
  width: 100%;
  height: 60px;
  margin-bottom: 0;
}

.gantt-bar {
  position: absolute;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 2;
  background: #E9ECEF;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gantt-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #FFE364;
  border-radius: 8px;
  transition: width 0.3s ease;
  z-index: 1;
}

.bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  position: relative;
  z-index: 2;
  min-width: 0;
}

.project-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 13px;
  line-height: 16px;
  color: #2A2828;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-period {
  position: absolute;
  top: 32px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #666666;
  white-space: nowrap;
}

.project-progress {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 13px;
  line-height: 16px;
  color: #000000;
}

/* 마일스톤 섹션 완전 제거 */

/* 채팅 섹션 */
.chat-section {
  grid-column: 3 / 4;
  grid-row: 1 / 3; /* 세로 전체 확장 */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 0;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
}

.chat-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* 나의 스톤 문서함 섹션 */
.docs-section {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: hidden;
  transition: box-shadow 0.3s ease;
}

.docs-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* 나의 Task 섹션 */
.task-section {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
  transition: box-shadow 0.3s ease;
}

.task-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Task 타임라인 스타일 */
.task-timeline-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.task-timeline-chart {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
}

/* Task 타임라인 헤더 */
.task-timeline-header {
  position: relative;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E0E0E0;
}

.task-timeline-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
}

.task-label {
  position: relative;
}

.task-label::after {
  content: '';
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 8px;
  background: #E0E0E0;
}

.task-today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: transparent;
  z-index: 10;
  pointer-events: none;
}

.task-today-line::before {
  content: 'Today';
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #FF4444;
  background: #FFFFFF;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  z-index: 11;
  pointer-events: auto;
}

.task-today-line::after {
  content: '';
  position: absolute;
  top: 32px;
  bottom: 0;
  left: 0;
  width: 2px;
  border-left: 2px dashed rgba(255, 68, 68, 0.6);
}

/* Task 바들 영역 */
.task-timeline-bars {
  position: relative;
  flex: 1;
  min-height: 230px;
  z-index: 1;
}

.task-bar-wrapper {
  position: absolute;
  width: 100%;
}

.task-bar-wrapper:nth-child(1) {
  top: 0px;
}

.task-bar-wrapper:nth-child(2) {
  top: 60px;
}

.task-bar-wrapper:nth-child(3) {
  top: 120px;
}

.task-bar-wrapper:nth-child(4) {
  top: 180px;
}

.task-bar {
  position: absolute;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 2;
  background: #E9ECEF;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 60px;
}

.task-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.task-bar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  position: relative;
  z-index: 2;
}

.task-bar-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 13px;
  line-height: 16px;
  color: #2A2828;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-bar-deadline {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 13px;
  line-height: 16px;
  color: #000000;
  flex-shrink: 0;
}

.task-bar-period {
  position: absolute;
  top: 32px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 10px;
  line-height: 12px;
  color: #666666;
  white-space: nowrap;
}

.task-stats {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  background: #F8F9FA;
  border-radius: 8px;
  min-width: 55px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.stat-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
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

.progress-section {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 450px;
}

.matrix-chart-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: visible;
}

.task-group {
  margin-bottom: 15px;
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
  margin: 0 0 8px 0;
  padding-bottom: 4px;
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
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;
  padding: 12px;
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.task-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transform: translateX(2px);
  cursor: pointer;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.task-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 13px;
  line-height: 16px;
  color: #1C0F0F;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-project {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 11px;
  line-height: 13px;
  color: #666666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-deadline {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  color: #FF6B6B;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
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

.no-stones-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100px;
}

.no-stones-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
  text-align: center;
}

.no-projects-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
}

.no-projects-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}

.no-projects-subtext {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #999999;
}



.document-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.document-folder {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  cursor: pointer;
}

.document-folder:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
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
  cursor: pointer;
  transition: color 0.2s ease;
}

.document-item:hover {
  color: #2A2828;
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

/* ChatRoomList 컴포넌트 임베드 스타일 조정 */
.chat-section :deep(.chatlist-wrapper) {
  padding: 0;
  min-height: 100%;
  height: 100%;
  display: flex;
}

.chat-section :deep(.chatlist-card) {
  border: none;
  border-radius: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}

.chat-section :deep(.chatlist-banner) {
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.chat-section :deep(.chatlist-body) {
  flex: 1;
  overflow-y: auto;
}

.chat-section :deep(.v-container) {
  padding: 0;
  height: 100%;
}

.chat-section :deep(.v-row) {
  margin: 0;
  height: 100%;
}

.chat-section :deep(.v-col) {
  padding: 0;
  height: 100%;
}

/* Summary dialog styling */
.summary-card { 
  --v-card-border-radius: 15px; 
  border-radius: 15px !important; 
  overflow: hidden; 
}

.summary-title { 
  background: #FFE364; 
  color: #1C0F0F; 
  font-weight: 700; 
}

.summary-body { 
  padding-top: 16px; 
}

.summary-actions { 
  padding: 12px 16px; 
}

.summary-btn { 
  background: #FFE364 !important; 
  color: #2A2828 !important; 
  font-weight: 600; 
}


/* 반응형 레이아웃 */
@media (max-width: 1400px) {
  .dashboard-layout {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto auto;
    height: auto;
  }
  
  .project-section {
    grid-column: 1 / -1;
    grid-row: 1 / 2;
  }
  
  .chat-section {
    grid-column: 2 / 3;
    grid-row: 2 / 5;
  }
  
  .docs-section {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
  }
  
  .task-section {
    grid-column: 1 / 2;
    grid-row: 3 / 4;
  }
  
  .project-section,
  .docs-section,
  .task-section {
    min-height: 300px;
  }
  
  .chat-section {
    min-height: 600px;
  }
}

@media (max-width: 1000px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto auto;
    height: auto;
  }
  
  .project-section {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }
  
  .chat-section {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
  }
  
  .docs-section {
    grid-column: 1 / 2;
    grid-row: 3 / 4;
  }
  
  .task-section {
    grid-column: 1 / 2;
    grid-row: 4 / 5;
  }
  
  .project-section,
  .docs-section,
  .task-section,
  .chat-section {
    min-height: 250px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 10px;
  }
  
  .dashboard-layout {
    gap: 15px;
    padding: 0 10px 10px 10px;
  }
  
  .project-section,
  .docs-section,
  .task-section,
  .chat-section {
    min-height: 200px;
    padding: 15px;
  }
}
</style>

