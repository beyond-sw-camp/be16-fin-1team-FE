<template>
  <div class="home-container">
    <div class="main-content page-padding">
      <!-- 상단 헤더 -->
      <div class="content-header">
        <div class="date-section">
          <p class="today-date">{{ todayDate }}</p>
        </div>
      </div>

      <!-- 대시보드 그리드 -->
      <div class="dashboard">
        <!-- 왼쪽 영역 -->
        <div class="dashboard-left min-h-0">
          <!-- 진행중인 프로젝트 카드 -->
          <Card class="project-card">
            <template #header>
              <div class="card-header-content">
                <h3 class="card-title">
                  <img src="/src/assets/icons/home/project-management.svg" alt="프로젝트" class="title-icon" />
                  진행중인 프로젝트
                </h3>
                <div class="card-actions">
                  <button class="add-button" @click="openProjectCreateModal">+ 프로젝트 추가</button>
                </div>
              </div>
            </template>
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
                    <div 
                      class="gantt-bar" 
                      :style="{ 
                        ...project.style, 
                        background: `linear-gradient(180deg, ${project.backgroundColor}FF 0%, ${project.backgroundColor}E6 100%)`,
                        borderColor: project.progress > 0 ? project.progressColor + '40' : 'rgba(0, 0, 0, 0.1)'
                      }" 
                      @click="goToProject(project)"
                    >
                      <div 
                        class="progress-fill" 
                        :style="{ 
                          width: project.progress + '%',
                          background: project.progress > 0 
                            ? `linear-gradient(180deg, ${project.progressColor}E6 0%, ${project.progressColor}FF 100%)`
                            : 'transparent'
                        }"
                      ></div>
                      <div class="bar-content">
                        <div class="project-name">{{ project.name }}</div>
                        <div class="project-progress" :class="{ 'progress-zero': project.progress === 0 }">
                          {{ project.progress }}%
                        </div>
                      </div>
                    </div>
                    <div class="project-period" :style="{ left: project.style.left }">{{ formatProjectPeriod(project.startTime, project.endTime) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <!-- 하단 왼쪽 영역: 채팅 + Task -->
          <div class="dashboard-bottom min-h-0">
            <!-- 스톤 채팅방 목록 카드 -->
            <Card class="chat-card h-full self-stretch">
              <template #header>
                <div class="card-header-content">
                  <h3 class="card-title">
                    <img src="/src/assets/icons/home/chat-email-envelope-8-svgrepo-com.svg" alt="채팅" class="title-icon" />
                    스톤 채팅방 목록
                  </h3>
                  <div class="card-actions hidden"></div>
                </div>
              </template>
              <ul class="chat-list" v-if="chatRooms.length > 0">
                <li
                  v-for="room in sortedChatRooms"
                  :key="room.roomId"
                  class="chat-item"
                  @click="handleChatRoomSelect(room)"
                  @mouseenter="hoveredRoomId = room.roomId"
                  @mouseleave="hoveredRoomId = null"
                >
                  <div class="chat-avatar">
                    <img v-if="room.userProfileImageUrlList && room.userProfileImageUrlList[0]"
                         :src="room.userProfileImageUrlList[0]"
                         @error="onAvatarError"
                         alt="user"
                         class="avatar-img" />
                    <img v-else :src="userDefault" alt="user" class="avatar-img" />
                  </div>
                  <div class="chat-info">
                    <div class="chat-title">
                      <span class="chat-name">{{ room.roomName }}</span>
                      <span class="chat-count">({{ room.participantCount }})</span>
                      <span v-if="room.isVideoCallActive" class="video-call-indicator"></span>
                    </div>
                    <div class="chat-subtitle">
                      {{ (room.messageType === 'FILE' && !room.lastMessage) ? '파일이 전송되었습니다.' : (room.lastMessage || '메시지가 없습니다.') }}
                    </div>
                  </div>
                  <div class="chat-meta">
                    <div class="chat-time">{{ formatChatTime(room.lastSendTime) }}</div>
                    <div
                      v-if="(room.unreadCount ?? 0) > 0"
                      :class="['chat-badge', { 'chat-badge-preview': hoveredRoomId === room.roomId }]"
                      @click.stop="hoveredRoomId === room.roomId && handlePreviewSummary(room)"
                    >
                      {{ hoveredRoomId === room.roomId ? '요약 미리보기' : (room.unreadCount ?? 0) }}
                    </div>
                  </div>
                </li>
              </ul>
              <div v-else class="empty-message">채팅방이 없습니다.</div>
            </Card>

            <!-- 나의 Task 카드 -->
            <Card class="task-card h-full self-stretch">
              <template #header>
                <div class="card-header-content">
                  <h3 class="card-title">
                    <img src="/src/assets/icons/home/task-svgrepo-com.svg" alt="태스크" class="title-icon" />
                    나의 Task
                  </h3>
                </div>
              </template>
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
                  <div class="task-timeline-bars" :style="taskBarsStyle">
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
            </Card>
          </div>
        </div>

        <!-- 우측 영역: 나의 스톤 문서함 카드 -->
        <Card class="docs-card min-h-0" h-full>
          <template #header>
            <div class="card-header-content">
              <h3 class="card-title">
                <img src="/src/assets/icons/home/files-and-folder.svg" alt="문서함" class="title-icon" />
                나의 스톤 문서함
              </h3>
              <div class="card-actions">
                <button 
                  class="icon-button" 
                  @click="toggleAllDocs" 
                  :aria-label="isAllDocsExpanded ? '모두 접기' : '모두 펼치기'" 
                  :title="isAllDocsExpanded ? '모두 접기' : '모두 펼치기'"
                >
                  <img 
                    v-if="isAllDocsExpanded"
                    src="/src/assets/icons/home/arrow-collapse-vertical.svg"
                    alt="모두 접기"
                    class="icon"
                  />
                  <img 
                    v-else
                    src="/src/assets/icons/home/arrow-expand-vertical.svg"
                    alt="모두 펼치기"
                    class="icon"
                  />
                </button>
              </div>
            </div>
          </template>
          <div 
            class="docs-tree"
            @dragenter.prevent="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
          >
            <ul class="docs-list" v-if="docTreeData.length > 0">
              <template v-for="node in docTreeData" :key="node.id">
                <!-- 폴더/파일 항목 -->
                <li
                  class="docs-item"
                  :class="{ 
                    'docs-item-folder': node.type === 'folder',
                    'docs-item-highlight': dropTargetId === node.id,
                    'docs-item-selected': selectedNodeId === node.id
                  }"
                  :style="{ paddingLeft: `${10 + node.depth * 16}px` }"
                  :data-node-id="node.id"
                  :data-id="node.type === 'folder' ? node.folderId : node.stoneId"
                  tabindex="0"
                  @click="handleDocItemClick(node)"
                  @focus="selectedNodeId = node.id"
                  @blur="selectedNodeId = null"
                >
                  <button
                    class="docs-toggle"
                    v-if="node.type === 'folder'"
                    :aria-expanded="node.expanded"
                    @click.stop="toggleDocNode(node)"
                    aria-label="toggle"
                  >
                    <img
                      src="/src/assets/icons/header/chevron-right.svg"
                      alt="토글"
                      class="toggle-icon"
                      :class="{ rotated: node.expanded }"
                    />
                  </button>
                  <span v-else class="docs-toggle-placeholder"></span>
                  <img
                    :src="node.type === 'folder' ? '/src/assets/icons/sidebar/project.svg' : '/src/assets/icons/home/folder-open.svg'"
                    alt="아이콘"
                    class="docs-icon"
                  />
                  <span class="docs-name">{{ node.name }}</span>
                  <span v-if="node.type === 'folder' && node.childCount" class="docs-chip">
                    {{ node.childCount }}
                  </span>
                  <span v-if="node.updatedAt" class="docs-meta">
                    {{ formatDate(node.updatedAt) }}
                  </span>
                </li>
                <!-- 자식 항목들 (transition으로 접힘/펼침) -->
                <transition name="collapse" v-if="node.type === 'folder'">
                  <ul v-if="node.expanded && node.children && node.children.length > 0" class="docs-children" key="children">
                    <li
                      v-for="child in node.children"
                      :key="child.id"
                      class="docs-item"
                      :class="{ 
                        'docs-item-highlight': dropTargetId === child.id,
                        'docs-item-selected': selectedNodeId === child.id
                      }"
                      :style="{ paddingLeft: `${10 + child.depth * 16}px` }"
                      :data-node-id="child.id"
                      :data-id="child.stoneId"
                      tabindex="0"
                      @click="handleDocItemClick(child)"
                      @focus="selectedNodeId = child.id"
                      @blur="selectedNodeId = null"
                    >
                      <span class="docs-toggle-placeholder"></span>
                      <img
                        src="/src/assets/icons/home/folder-open.svg"
                        alt="아이콘"
                        class="docs-icon"
                      />
                      <span class="docs-name">{{ child.name }}</span>
                      <span v-if="child.updatedAt" class="docs-meta">
                        {{ formatDate(child.updatedAt) }}
                      </span>
                    </li>
                  </ul>
                </transition>
              </template>
            </ul>
            <div v-else class="empty-message">나의 스톤이 없습니다.</div>
          </div>
        </Card>
      </div>
    </div>
  
    <!-- 요약 미리보기 다이얼로그 -->
    <v-dialog v-model="isSummaryDialogOpen" max-width="360px">
      <v-card class="summary-card">
        <v-card-title class="text-h6 summary-title">요약 미리보기</v-card-title>
        <v-card-text class="summary-body">
          <div v-if="summaryDialogLoading" class="d-flex align-center justify-center" style="min-height:150px">
            <v-progress-circular indeterminate :size="42" :width="4" color="#FFE364" />
          </div>
          <div v-else v-html="formatMultiline(summaryDialogText)" style="white-space: normal; line-height: 1.5;"></div>
        </v-card-text>
        <v-card-actions class="justify-end summary-actions">
          <v-btn class="summary-btn" variant="flat" @click="isSummaryDialogOpen = false">닫기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { workspaceWatcher } from '@/mixins/workspaceWatcher';
import { getMyTasks, getMyProjects, getMyStones } from '@/api/task.js';
import { useWorkspaceStore } from '@/stores/workspace.js';
import Card from '@/components/Card.vue';
import stompManager from '@/services/stompService.js';
import axios from 'axios';
import userDefault from '@/assets/icons/chat/user_defualt.svg';

// Vue 3에서는 $set이 없으므로 제거됨

export default {
  name: "Home",
  mixins: [workspaceWatcher],
  components: {
    Card
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
      chatRooms: [], // 채팅방 목록
      loading: false,
      summariesByRoomId: {},
      summaryUnsub: null,
      isSummaryDialogOpen: false,
      summaryDialogLoading: false,
      summaryDialogText: '',
      hoveredRoomId: null,
      userDefault,
      docTreeState: {}, // 문서 트리 상태 (expanded 여부)
      dropTargetId: null, // DnD 드롭 타겟 ID
      selectedNodeId: null, // 키보드 포커스된 노드 ID
      isAllDocsExpanded: true // 문서함 전체 펼침/접힘 상태
    };
  },
  
    async mounted() {
    // store 초기화
    const workspaceStore = useWorkspaceStore();
    workspaceStore.initialize();
    
    await Promise.all([
      this.loadMyTasks(),
      this.loadMyProjects(),
      this.loadMyStones(),
      this.loadChatRooms()
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
    
    // Today 라인 표시 여부 (프로젝트)
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
    },
    
    // 정렬된 채팅방 목록 (최근 메시지 시간 순)
    sortedChatRooms() {
      return this.chatRooms.map(room => {
        const summary = this.summariesByRoomId[room.roomId] || {};
        
        // isVideoCallActive 계산
        let isVideoCallActive = room.isVideoCallActive ?? false;
        
        // summary에 messageType이 있으면 그걸로 업데이트
        if (summary.messageType === 'VIDEO_CALL_START') {
          isVideoCallActive = true;
        } else if (summary.messageType === 'VIDEO_CALL_END') {
          isVideoCallActive = false;
        }
        
        return {
          ...room,
          lastMessage: summary.lastMessage ?? room.lastMessage,
          lastSendTime: summary.lastSendTime ?? room.lastSendTime,
          unreadCount: summary.unreadCount ?? room.unreadCount,
          messageType: summary.messageType ?? room.messageType,
          isVideoCallActive: isVideoCallActive,
        };
      }).sort((a, b) => {
        const parse = (t) => {
          if (!t) return 0;
          const d = new Date(t);
          if (!isNaN(d)) return d.getTime();
          const normalized = String(t).replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{3})\d+$/, '$1.$2');
          const d2 = new Date(normalized);
          return isNaN(d2) ? 0 : d2.getTime();
        };
        return parse(b.lastSendTime) - parse(a.lastSendTime);
      });
    },
    
    // 플랫 문서 트리 (들여쓰기 계산) - 호환성 유지
    flatDocTree() {
      return this.docTreeData.flatMap(node => {
        const items = [node];
        if (node.type === 'folder' && node.expanded && node.children) {
          items.push(...node.children);
        }
        return items;
      });
    },
    
    // 문서 트리 데이터 (계층 구조)
    docTreeData() {
      const result = this.documentFolders.map((folder, folderIndex) => {
        const folderId = `folder-${folder.id}`;
        // undefined일 때 기본값 true, 명시적으로 false일 때만 false
        const isExpanded = this.docTreeState[folderId] === undefined ? true : this.docTreeState[folderId] !== false;
        
        const children = folder.documents.map((doc, docIndex) => ({
          id: doc.id,
          name: doc.name,
          type: 'file',
          depth: 1,
          stoneId: doc.stoneId,
          updatedAt: doc.updatedAt || null
        }));
        
        return {
          id: folderId,
          name: folder.name,
          type: 'folder',
          depth: 0,
          expanded: isExpanded,
          folderId: folder.id,
          childCount: children.length,
          children: children,
          updatedAt: folder.updatedAt || null
        };
      });
      
      console.log('[docTreeData] computed 재계산:', {
        docTreeState: { ...this.docTreeState },
        result: result.map(n => ({ id: n.id, name: n.name, expanded: n.expanded }))
      });
      
      return result;
    },
    
    // Task 바 영역 높이(행수 기반) - 데이터 적을 때는 낮게, 많을 때만 커짐
    taskBarsStyle() {
      const rowHeight = 60; // nth-child 오프셋과 동일한 행 간격
      const rows = Math.max(this.pendingTasks.length, 1);
      const minHeightPx = Math.max(rows * rowHeight, 120);
      return { minHeight: `${minHeightPx}px` };
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
              style: this.calculateProjectStyle(startDate, endDate, now),
              backgroundColor: this.getProjectColor(project.id),
              progressColor: this.getProjectColorStrong(project.id)
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
          isExpanded: true, // 기본적으로 펼쳐진 상태
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
      
      // 마지막 라벨 위치에 맞춰 오른쪽 여백 조정 (라벨이 왼쪽으로 20px 이동했으므로)
      // 컨테이너 너비 기준으로 약 5-8% 여백 (라벨 위치에 맞춤)
      const rightMargin = 8; // 퍼센트 단위
      const maxWidth = Math.min(100 - rightMargin, widthPercent);
      // 오른쪽 끝에 닿지 않도록 조정
      const adjustedLeftPercent = leftPercent;
      const adjustedWidthPercent = Math.min(maxWidth, 100 - leftPercent - rightMargin);
      
      return {
        left: `${Math.max(0, adjustedLeftPercent)}%`,
        width: `${Math.max(0, Math.min(adjustedWidthPercent, 100 - leftPercent - rightMargin))}%`
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
      // 사이드바 프로젝트 메뉴 열기 이벤트 발생
      window.dispatchEvent(new CustomEvent('openProjectDropdown'));
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
          width: '100%',
          backgroundColor: this.getTaskColor(task.id)
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
      
      // 마지막 라벨 위치에 맞춰 오른쪽 여백 조정 (라벨이 왼쪽으로 20px 이동했으므로)
      // 컨테이너 너비 기준으로 약 5-8% 여백 (라벨 위치에 맞춤)
      const rightMargin = 8; // 퍼센트 단위
      const maxWidth = Math.min(100 - rightMargin, widthPercent);
      // 오른쪽 끝에 닿지 않도록 조정
      const adjustedLeftPercent = leftPercent;
      const adjustedWidthPercent = Math.min(maxWidth, 100 - leftPercent - rightMargin);
      
      return {
        left: `${Math.max(0, adjustedLeftPercent)}%`,
        width: `${Math.max(0, Math.min(adjustedWidthPercent, 100 - leftPercent - rightMargin))}%`,
        backgroundColor: this.getTaskColor(task.id)
      };
    },
    
    // Task ID 기반 밝은 색상 생성
    getTaskColor(taskId) {
      // taskId를 숫자로 변환 (해시 함수)
      let hash = 0;
      const str = String(taskId);
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // 밝은 파스텔 색상 팔레트
      const lightColors = [
        '#FFE4E1', // 연한 핑크
        '#FFE4B5', // 연한 주황
        '#FFFACD', // 연한 노랑
        '#E0FFE0', // 연한 민트
        '#E0F2FF', // 연한 하늘
        '#E6E6FA', // 연한 라벤더
        '#FFE4F0', // 연한 장미
        '#FFF4E6', // 연한 살구
        '#E8F5E9', // 연한 초록
        '#F3E5F5', // 연한 보라
        '#E1F5FE', // 연한 파랑
        '#FFF9C4', // 연한 레몬
      ];
      
      return lightColors[Math.abs(hash) % lightColors.length];
    },
    
    // Project ID 기반 색상 생성 (파란색 제외, 태스크처럼 다양하게)
    getProjectColor(projectId) {
      // projectId를 숫자로 변환 (해시 함수)
      let hash = 0;
      const str = String(projectId);
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // 파란색 계열 제외한 다양한 색상 팔레트 (배경용 - 연한 색상)
      const lightColors = [
        '#FFE4E1', // 연한 핑크
        '#FFE4B5', // 연한 주황
        '#FFFACD', // 연한 노랑
        '#E0FFE0', // 연한 민트
        '#E6E6FA', // 연한 라벤더
        '#FFE4F0', // 연한 장미
        '#FFF4E6', // 연한 살구
        '#E8F5E9', // 연한 초록
        '#F3E5F5', // 연한 보라
        '#FFF9C4', // 연한 레몬
        '#F0E6FF', // 연한 라일락
        '#FFE8E8', // 연한 코랄
      ];
      
      return lightColors[Math.abs(hash) % lightColors.length];
    },
    
    // Project ID 기반 진한 색상 생성 (진행률 fill용)
    getProjectColorStrong(projectId) {
      // projectId를 숫자로 변환 (해시 함수)
      let hash = 0;
      const str = String(projectId);
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // 파란색 계열 제외한 다양한 색상 팔레트 (진행률용 - 진한 색상)
      const strongColors = [
        '#FF6B9D', // 진한 핑크
        '#FF8C42', // 진한 주황
        '#FFC947', // 진한 노랑
        '#4ECDC4', // 진한 민트
        '#9B6BFF', // 진한 라벤더
        '#FFAB6B', // 진한 살구
        '#66BB6A', // 진한 초록
        '#AB47BC', // 진한 보라
        '#FFD54F', // 진한 레몬
        '#BA68C8', // 진한 라일락
        '#FF8A80', // 진한 코랄
        '#F06292', // 진한 로즈
      ];
      
      return strongColors[Math.abs(hash) % strongColors.length];
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
        // 사이드바 프로젝트 메뉴 열기 이벤트 발생
        window.dispatchEvent(new CustomEvent('openProjectDropdown'));
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
    },
    
    // 문서함 폴더 접기/펼치기 토글
    toggleFolder(folderId) {
      const folder = this.documentFolders.find(f => f.id === folderId);
      if (folder) {
        folder.isExpanded = !folder.isExpanded;
      }
    },
    
    // 문서 트리 노드 토글
    toggleDocNode(node) {
      console.log('[toggleDocNode] 호출됨:', {
        node,
        nodeId: node.id,
        nodeType: node.type,
        nodeFolderId: node.folderId,
        nodeExpanded: node.expanded
      });
      
      if (node.type === 'folder') {
        const key = `folder-${node.folderId}`;
        // 현재 node.expanded 값을 기준으로 토글 (computed에서 계산된 실제 값 사용)
        const currentExpanded = node.expanded;
        const newState = !currentExpanded;
        
        console.log('[toggleDocNode] 상태 변경:', {
          key,
          currentExpanded,
          newState,
          docTreeStateBefore: { ...this.docTreeState },
          docTreeStateKey: this.docTreeState[key]
        });
        
        // Vue 3에서는 직접 할당으로 반응성 작동
        // 반응성을 보장하기 위해 스프레드 연산자 사용
        this.docTreeState = {
          ...this.docTreeState,
          [key]: newState
        };
        
        console.log('[toggleDocNode] 상태 변경 후:', {
          key,
          updatedState: this.docTreeState[key],
          fullState: { ...this.docTreeState }
        });
        
        // docTreeData 재확인
        this.$nextTick(() => {
          const updatedNode = this.docTreeData.find(n => n.id === node.id);
          console.log('[toggleDocNode] nextTick 후 docTreeData:', {
            nodeId: node.id,
            updatedExpanded: updatedNode?.expanded,
            updatedChildren: updatedNode?.children?.length,
            fullDocTreeData: this.docTreeData.map(n => ({ 
              id: n.id, 
              name: n.name, 
              expanded: n.expanded,
              childrenCount: n.children?.length || 0
            }))
          });
        });
      } else {
        console.log('[toggleDocNode] 폴더가 아님:', node);
      }
    },
    
    // 문서 항목 클릭 처리
    handleDocItemClick(node) {
      if (node.type === 'folder') {
        this.toggleDocNode(node);
      } else {
        this.goToStoneDrive(node);
      }
    },
    
    // 날짜 포맷팅
    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;
        
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
      } catch (e) {
        return '';
      }
    },
    
    // 문서함 모두 접기/펼치기 토글
    toggleAllDocs() {
      if (this.isAllDocsExpanded) {
        this.collapseAllDocs();
      } else {
        this.expandAllDocs();
      }
      this.isAllDocsExpanded = !this.isAllDocsExpanded;
    },
    
    // 문서함 모두 접기
    collapseAllDocs() {
      const newState = { ...this.docTreeState };
      this.documentFolders.forEach(folder => {
        const key = `folder-${folder.id}`;
        newState[key] = false;
      });
      this.docTreeState = newState;
      console.log('[collapseAllDocs] 모든 폴더 접기 완료:', { ...this.docTreeState });
    },
    
    // 문서함 모두 펼치기
    expandAllDocs() {
      const newState = { ...this.docTreeState };
      this.documentFolders.forEach(folder => {
        const key = `folder-${folder.id}`;
        newState[key] = true;
      });
      this.docTreeState = newState;
      console.log('[expandAllDocs] 모든 폴더 펼치기 완료:', { ...this.docTreeState });
    },
    
    // 채팅방 목록 로드
    async loadChatRooms() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const workspaceId = localStorage.getItem('selectedWorkspaceId') || 'ws_1';
        const response = await axios.get(`${baseURL}/chat-service/chat/room/list/${workspaceId}`);
        this.chatRooms = response.data.result || [];
      } catch (error) {
        console.error('채팅방 목록 로드 실패:', error);
        this.chatRooms = [];
      }
    },
    
    // 채팅방 목록 새로고침
    async refreshChatRooms() {
      await this.loadChatRooms();
    },
    
    // 채팅 시간 포맷팅
    formatChatTime(timestamp) {
      if (!timestamp) return '';
      let date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        const normalized = String(timestamp).replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{3})\d+$/, '$1.$2');
        date = new Date(normalized);
      }
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const isToday = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();

      if (isToday) {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }

      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    },
    
    // 아바타 에러 핸들링
    onAvatarError(e) {
      e.target.src = this.userDefault;
    },
    
    // DnD: 드래그 이벤트에서 폴더 ID 추출
    getFolderIdFromEvent(e) {
      const li = e.target.closest('li.docs-item') || e.target.closest('li[data-node-id]');
      return li?.dataset?.nodeId ?? null;
    },
    
    // DnD: 드래그 엔터
    onDragEnter(e) {
      this.dropTargetId = this.getFolderIdFromEvent(e);
    },
    
    // DnD: 드래그 오버
    onDragOver(e) {
      const folderId = this.getFolderIdFromEvent(e);
      // 폴더 타입만 드롭 타겟으로 설정
      if (folderId) {
        const node = this.docTreeData.find(n => n.id === folderId || n.children?.find(c => c.id === folderId));
        if (node && (node.type === 'folder' || (node.children && node.children.find(c => c.id === folderId)))) {
          this.dropTargetId = node.type === 'folder' ? node.id : folderId;
        }
      }
    },
    
    // DnD: 드래그 리브
    onDragLeave() {
      this.dropTargetId = null;
    },
    
    // DnD: 드롭 처리
    async onDrop(e) {
      const li = e.target.closest('li.doc-row') || e.target.closest('li.docs-item');
      if (!li) return;
      
      li.classList.remove('drop-hot');
      const nodeId = li.dataset?.nodeId || li.dataset?.id;
      
      // 폴더만 드롭 타겟
      let folderId = null;
      if (nodeId) {
        const node = this.docTreeData.find(n => n.id === nodeId || n.folderId?.toString() === nodeId);
        if (node && node.type === 'folder') {
          folderId = node.folderId;
        }
      }
      
      if (!folderId) {
        folderId = this.currentOpenedFolderId();
      }
      
      this.dropTargetId = null;
      
      const files = [...(e.dataTransfer?.files || [])];
      if (!files.length || !folderId) return;
      
      await this.uploadFilesToFolder(folderId, files);
      await this.refreshFolder(folderId);
    },
    
    // 현재 열린 폴더 ID (기본값)
    currentOpenedFolderId() {
      const firstFolder = this.docTreeData.find(node => node.type === 'folder' && node.expanded);
      return firstFolder?.folderId || this.docTreeData[0]?.folderId || null;
    },
    
    // 파일 업로드 (TODO: 실제 API 연결)
    async uploadFilesToFolder(folderId, files) {
      console.log('[DnD] 파일 업로드:', { folderId, files });
      // TODO: API 호출
      // const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      // await axios.post(`${baseURL}/drive/upload`, { folderId, files });
    },
    
    // 폴더 새로고침 (TODO: 실제 API 연결)
    async refreshFolder(folderId) {
      console.log('[DnD] 폴더 새로고침:', folderId);
      // TODO: 해당 폴더만 재조회
      // await this.loadMyStones();
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

/* 페이지 외곽 여백 */
.page-padding {
  padding-left: 24px;
  padding-right: 24px;
}

@media (min-width: 768px) {
  .page-padding {
    padding-left: 32px;
    padding-right: 32px;
  }
}

@media (min-width: 1280px) {
  .page-padding {
    padding-left: 40px;
    padding-right: 40px;
  }
}

.content-header {
  margin-bottom: 10px;
  padding: 0;
}

.today-date {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin: 0;
}

/* 대시보드 그리드 */
.dashboard {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 24px;
  width: 100%;
  padding: 0 0 20px 0;
  height: calc(100% - 50px);
  box-sizing: border-box;
  min-height: 0;
}

@media (min-width: 1280px) {
  .dashboard {
    gap: 32px;
  }
}

.dashboard-left {
  display: grid;
  grid-template-rows: auto 1fr; /* 상단(프로젝트) 자동, 하단(채팅+Task) 남은 높이 */
  gap: 24px;
  height: 100%;
  min-height: 0;
  grid-row: 1 / span 2; /* 대시보드 2행 전체 점유 (강제) */
}

@media (min-width: 1280px) {
  .dashboard-left {
    gap: 32px;
  }
}

.dashboard-bottom {
  display: grid;
  grid-template-columns: minmax(320px, 1.3fr) 1.7fr;
  gap: 24px;
  align-items: stretch;
  align-content: stretch;
  flex: 1;
  min-height: 650px;
}

@media (min-width: 1280px) {
  .dashboard-bottom {
    gap: 32px;
  }
}

.min-h-0 {
  min-height: 0;
}

.self-stretch {
  align-self: stretch;
  height: 100%;
}

/* 카드 헤더 공통 스타일 */
.card-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.card-header-content .hidden {
  display: none;
}

/* 카드 루트 마진 제거 */
.card,
.card-wrapper {
  margin-top: 0 !important;
}

/* 카드 헤더 높이 통일 */
.card > .card-header,
.card-wrapper > .card-header {
  min-height: 44px;
  display: flex;
  align-items: center;
}

/* 그리드 아이템 상단 정렬 */
.grid.items-start > * {
  align-self: start;
}

/* 하단 좌측 카드들이 트랙 높이를 가득 채우도록 강제 */
.dashboard-bottom > * {
  align-self: stretch;
  height: 100%;
}

/* 카드 제목 스타일 (CSS 변수는 Card.vue에서 전역 선언) */
.card-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: var(--card-title-weight, 700);
  font-size: var(--card-title-size, 18px);
  line-height: 28px;
  color: #1C0F0F;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.icon-button:hover {
  transform: scale(1.1);
}

.icon-button:focus,
.icon-button:focus-visible {
  outline: none;
}

.icon-button .icon {
  width: 24px;
  height: 24px;
}

.icon-text {
  font-size: 14px;
  line-height: 1;
  color: #666666;
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

/* 프로젝트 카드 */
.project-card {
  min-height: 360px; /* 강제 상승 */
  border: 1px solid #E0E0E0;
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
  border-bottom: 1px solid var(--grid, #E5E7EB);
  overflow: visible;
  z-index: 1;
}

.month-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  color: var(--ink-2, #6B7280);
  padding-bottom: 6px;
  padding-right: 8px; /* 오른쪽 여백 추가 */
}

.month-labels span:last-child {
  transform: translateX(-20px); /* 마지막 라벨을 왼쪽으로 이동 */
}

.month-labels span {
  position: relative;
}

.month-labels span::after {
  display: none; /* 헤더의 세로선은 제거 (배경으로 처리) */
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
  font-size: 12px;
  line-height: 14px;
  color: #fff;
  background: var(--warn, #F59E0B);
  padding: 4px 8px;
  border-radius: 8px;
  white-space: nowrap;
  z-index: 11;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.today-line::after {
  content: '';
  position: absolute;
  top: 32px;
  bottom: 0;
  left: 0;
  width: 2px;
  border-left: 2px dashed var(--warn, #F59E0B);
  opacity: 0.8;
}

.gantt-bars {
  position: relative;
  flex: 1;
  min-height: 320px; /* 강제 상승 */
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden; /* 가로 스크롤바 제거 */
  z-index: 1;
  background-color: #FFFFFF;
  padding-right: 0;
  padding-left: 8px;
  padding-top: 8px;
  padding-bottom: 0;
  border-radius: 0 0 8px 8px;
  margin-right: 0;
}

.gantt-bars::-webkit-scrollbar {
  width: 6px;
}

.gantt-bars::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.gantt-bars::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 3px;
}

.gantt-bars::-webkit-scrollbar-thumb:hover {
  background: #B0B0B0;
}

.gantt-bar-wrapper {
  position: relative;
  width: 100%;
  height: 60px;
  margin-bottom: 0;
}

.gantt-bar {
  position: absolute;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 2;
  background: linear-gradient(180deg, var(--gantt-bar-bg, #F3F4F6) 0%, rgba(243, 244, 246, 0.9) 100%);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.gantt-bar:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow, 0 6px 20px rgba(0,0,0,.08));
  filter: brightness(1.05);
  border-color: rgba(0, 0, 0, 0.12);
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 10px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  z-index: 1;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  position: relative;
  z-index: 2;
  min-width: 0;
}

.project-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 16px;
  color: var(--ink-1, #111827);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
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
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-1, #111827);
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.project-progress.progress-zero {
  background: rgba(243, 244, 246, 0.9);
  color: var(--ink-muted, #9CA3AF);
  border-color: rgba(0, 0, 0, 0.08);
  font-weight: 600;
}

/* 채팅 카드 */
.chat-card {
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #E0E0E0;
}

.dashboard-bottom > * {
  align-self: stretch;
  height: 100%;
}

.chat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #E0E0E0;
}

.chat-item:last-child {
  border-bottom: none;
}

.chat-item:hover {
  background: #F0F7FF;
}

.chat-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-title {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.chat-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: #212121;
}

.chat-count {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 11px;
  color: #9E9E9E;
}

.video-call-indicator {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #EF5350;
  border-radius: 50%;
  margin-left: 4px;
  animation: videoIndicatorPulse 2s ease-in-out infinite;
}

@keyframes videoIndicatorPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

.chat-subtitle {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 11px;
  color: #555;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  position: relative;
}

.chat-time {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 11px;
  color: #757575;
  white-space: nowrap;
}

.chat-badge {
  display: inline-flex;
  min-width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #EF5350;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 600;
  padding: 0 4px;
}

.chat-badge-preview {
  height: 24px;
  min-width: 88px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  color: #1C0F0F;
  font-weight: 700;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

/* 오로라 효과 */
.chat-badge-preview::before {
  content: "";
  position: absolute;
  inset: -100%;
  background: conic-gradient(
    from 0deg,
    rgba(0, 255, 255, 0.3),
    rgba(255, 0, 255, 0.3),
    rgba(255, 255, 0, 0.3),
    rgba(0, 255, 255, 0.3)
  );
  filter: blur(20px);
  animation: chatBadgeAuroraFlow 6s linear infinite;
  z-index: 0;
}

@keyframes chatBadgeAuroraFlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 문서 카드 */
.docs-card {
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  grid-column: 2;
  grid-row: 1 / span 2;
  border: 1px solid #E0E0E0;
}


.docs-card > .card-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
}

.docs-tree {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  position: relative;
  padding-left: 14px;
}

.docs-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  position: relative;
  z-index: 1;
}

.docs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  min-height: 44px;
  cursor: pointer;
  transition: background-color 0.2s ease, outline 0.2s ease;
  border-radius: 6px;
  margin: 2px 0;
}

.docs-item:hover {
  background: #f7f7f8;
}

.docs-item-folder {
  margin-top: 6px;
}

.docs-item:focus-within {
  outline: 2px solid #e7eafc;
  background: #f7f8ff;
}

.docs-item-highlight,
.docs-item.drop-hot {
  background: #fff7e6 !important;
  outline: 1px dashed #ffd591;
}

.docs-item-selected .docs-name {
  font-weight: 600;
}

.docs-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.docs-toggle-placeholder {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toggle-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.toggle-icon.rotated {
  transform: rotate(90deg);
}

.docs-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.7;
  filter: brightness(1.2);
}

.docs-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #2A2828;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

.docs-chip {
  font-family: 'Pretendard', sans-serif;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #f1f3f5;
  color: #2A2828;
  font-weight: 500;
  flex-shrink: 0;
}

.docs-meta {
  font-family: 'Pretendard', sans-serif;
  font-size: 11px;
  color: #9aa1a9;
  margin-left: 6px;
  flex-shrink: 0;
}

/* 자식 목록 래퍼 */
.docs-children {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
}

/* 접힘 애니메이션 */
.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
}

.collapse-enter-from {
  max-height: 0;
  opacity: 0;
}

.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* Task 카드 */
.task-card {
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #E0E0E0;
}

/* 공통 메시지 스타일 */
.empty-message {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
  text-align: center;
  padding: 20px;
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

/* Task 타임라인 스타일 */
.task-timeline-wrapper {
  flex: 1;
  overflow-y: auto; /* 내용이 넘칠 때만 스크롤바 표시 */
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-right: 0;
}

.task-timeline-wrapper::-webkit-scrollbar {
  width: 6px;
}

.task-timeline-wrapper::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.task-timeline-wrapper::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 3px;
}

.task-timeline-wrapper::-webkit-scrollbar-thumb:hover {
  background: #B0B0B0;
}

.task-timeline-chart {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible; /* Today 라인이 끝까지 보이도록 */
}

/* Task 타임라인 헤더 */
.task-timeline-header {
  position: relative;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--grid, #E5E7EB);
  overflow: visible;
  z-index: 1;
}

.task-timeline-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  color: var(--ink-2, #6B7280);
  padding-right: 8px; /* 오른쪽 여백 추가 */
}

.task-timeline-labels .task-label:last-child {
  transform: translateX(-20px); /* 마지막 라벨을 왼쪽으로 이동 */
}

.task-label {
  position: relative;
}

.task-label::after {
  display: none; /* 헤더의 세로선은 제거 (배경으로 처리) */
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
  font-size: 12px;
  line-height: 14px;
  color: #fff;
  background: var(--warn, #F59E0B);
  padding: 4px 8px;
  border-radius: 8px;
  white-space: nowrap;
  z-index: 11;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-today-line::after {
  content: '';
  position: absolute;
  top: 32px;
  bottom: 0;
  left: 0;
  width: 2px;
  border-left: 2px dashed var(--warn, #F59E0B);
  opacity: 0.8;
}

/* Task 바들 영역 */
.task-timeline-bars {
  position: relative;
  flex: 1;
  min-height: 0; /* 동적 높이로 대체 */
  z-index: 1;
  background-color: #FFFFFF;
  padding: 8px;
  padding-right: 0;
  padding-bottom: 0;
  padding-left: 8px;
  padding-top: 8px;
  border-radius: 0 0 8px 8px;
  overflow-y: auto;
  overflow-x: hidden; /* 가로 스크롤바 제거 */
  margin-right: 0;
}

.task-timeline-bars::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.task-timeline-bars::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.task-timeline-bars::-webkit-scrollbar-track {
  background: transparent !important;
  border-radius: 0 !important;
  margin: 0 !important;
  border: none !important;
}

.task-timeline-bars::-webkit-scrollbar-thumb {
  background: #D0D0D0 !important;
  border-radius: 3px !important;
  transition: background 0.2s ease;
  border: none !important;
}

.task-timeline-bars::-webkit-scrollbar-thumb:hover {
  background: #B0B0B0 !important;
}

.task-timeline-bars::-webkit-scrollbar-corner {
  background: transparent !important;
  border: none !important;
}

/* Firefox 스크롤바 */
.task-timeline-bars {
  scrollbar-width: thin;
  scrollbar-color: #D0D0D0 transparent;
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
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 60px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: var(--brand-chart, #5BA8FF);
}

.task-bar:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow, 0 6px 20px rgba(0,0,0,.06));
  filter: brightness(1.1);
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

/* Summary dialog styling */
.summary-card { 
  --v-card-border-radius: 15px; 
  border-radius: 15px !important; 
  overflow: hidden;
  min-height: 300px;
}

.summary-title { 
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  color: #1C0F0F; 
  font-weight: 700;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

/* 오로라 효과 */
.summary-title::before {
  content: "";
  position: absolute;
  inset: -100%;
  background: conic-gradient(
    from 0deg,
    rgba(0, 255, 255, 0.3),
    rgba(255, 0, 255, 0.3),
    rgba(255, 255, 0, 0.3),
    rgba(0, 255, 255, 0.3)
  );
  filter: blur(40px);
  animation: summaryTitleAuroraFlow 8s linear infinite;
  z-index: 0;
}

@keyframes summaryTitleAuroraFlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 타이틀 내용이 오로라 위에 보이도록 */
.summary-title :deep(*) {
  position: relative;
  z-index: 1;
}

.summary-body { 
  padding: 20px 16px;
  min-height: 180px;
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
  .dashboard {
    grid-template-columns: 1fr 1fr;
  }
  
  .dashboard-bottom {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
}

@media (max-width: 1000px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  
  .dashboard-bottom {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
}

@media (max-width: 768px) {
  .dashboard {
    gap: 15px;
    padding: 0 10px 20px 10px;
  }
  
  .dashboard-bottom {
    gap: 15px;
  }
}
</style>

