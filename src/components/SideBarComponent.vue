<template>
  <v-navigation-drawer class="app-sidebar" permanent>
    <!-- 로고 섹션 -->
    <div class="logo-section" @click="toggleWorkspaceDropdown">
      <img src="@/assets/icons/logo/1_2.svg" alt="Logo" class="logo-icon" />
      <div class="logo-text-container">
        <div class="logo-text">{{ selectedWorkspace?.workspaceName || '워크스페이스 선택' }}</div>
      </div>
      <div class="dropdown-arrow" :class="{ 'rotated': showWorkspaceDropdown }">▼</div>
    </div>
    
    <!-- 워크스페이스 드롭다운 -->
    <div v-if="showWorkspaceDropdown" class="workspace-dropdown">
      <div 
        v-for="workspace in workspaces" 
        :key="workspace.workspaceId"
        class="workspace-item"
        :class="{ 'selected': selectedWorkspace?.workspaceId === workspace.workspaceId }"
        @click="selectWorkspace(workspace)"
      >
        <div class="workspace-circle"></div>
        <div class="workspace-name">{{ workspace.workspaceName }}</div>
      </div>
      <div v-if="workspaces.length === 0" class="workspace-empty">
        <div class="empty-message">워크스페이스가 없습니다</div>
        <div class="empty-submessage">새 워크스페이스를 생성하거나 초대를 받아보세요</div>
      </div>
      <!-- 워크스페이스 생성 버튼 -->
      <div class="workspace-create-item" @click="createWorkspace">
        <img src="@/assets/icons/project/plus.svg" alt="추가" class="workspace-create-icon" />
        <div class="workspace-create-text">워크스페이스 생성</div>
      </div>
    </div>
    
    
    
    <!-- 저작권 -->
    <div class="copyright">
      copyright © 2025 all rights
    </div>
    
    <!-- 네비게이션 메뉴 -->
    <div class="nav-section">
      <!-- 홈 -->
      <div class="nav-item" :class="{ active: currentRoute === '/' }" @click="navigateToHome">
        <img src="@/assets/icons/sidebar/home.svg" alt="홈" class="nav-icon" />
        <div class="nav-text">홈</div>
      </div>
      
      <!-- 내 일정 -->
      <div class="nav-item" @click="navigateToSchedule">
        <img src="@/assets/icons/sidebar/schedule.svg" alt="내 일정" class="nav-icon" />
        <div class="nav-text">내 일정</div>
      </div>
      
      <!-- 채팅 -->
      <div class="nav-item" :class="{ active: currentRoute.startsWith('/chat') }" @click="navigateToChat">
        <img src="@/assets/icons/sidebar/chat.svg" alt="채팅" class="nav-icon" />
        <div class="nav-text">스톤 메신저</div>
        <div v-if="chatUnreadCount > 0" class="badge">{{ chatUnreadCount }}</div>
      </div>
      
      <!-- 문서함 -->
      <div class="nav-item" :class="{ active: currentRoute.startsWith('/drive') }" @click="navigateToDrive">
        <img src="@/assets/icons/sidebar/document.svg" alt="문서함" class="nav-icon" />
        <div class="nav-text">문서함</div>
      </div>
      
      <!-- 프로젝트 -->
      <div class="project-nav-container">
        <div class="nav-item" @click="toggleProjectDropdown" :class="{ active: currentRoute === '/project' }">
          <img src="@/assets/icons/sidebar/project.svg" alt="프로젝트" class="nav-icon" />
          <div class="nav-text">프로젝트</div>
          <div class="dropdown-arrow" :class="{ 'rotated': showProjectDropdown }">▼</div>
        </div>
        
        <!-- 프로젝트 드롭다운 -->
        <div v-if="showProjectDropdown" class="project-dropdown">
          <div 
            v-for="project in projects" 
            :key="project.id"
            class="project-item"
            :class="{ 'selected': isProjectSelected(project.id) }"
            @click="selectProject(project)"
          >
            <div class="project-circle" :style="{ background: project.color }"></div>
            <div class="project-name">{{ project.name }}</div>
          </div>
          <div class="project-create-item" @click="createProject">
            <div class="project-create-icon-wrapper">
              <svg class="project-create-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 0V12M0 6H12" stroke="#FFE364" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="project-create-text">새 프로젝트 생성</div>
          </div>
        </div>
      </div>
      
      <!-- 관리자 페이지 (관리자 권한이 있고 PERSONAL 워크스페이스가 아닐 때만 표시) -->
      <div v-if="isAdmin && !isPersonalWorkspace" class="nav-item admin-nav-item" :class="{ active: currentRoute === '/admin' }" @click="navigateToAdmin">
        <img src="@/assets/icons/sidebar/admin.svg" alt="관리자 페이지" class="nav-icon" />
        <div class="nav-text">관리자 페이지</div>
      </div>
    </div>
    
    <!-- 스토리지 사용량 -->
    <div class="storage-section">
      <div class="storage-indicator">
        <img src="@/assets/icons/header/database.svg" alt="Storage" class="storage-icon" />
        <div class="storage-text">스토리지 사용량</div>
      </div>
      
      <div class="storage-progress">
        <div class="storage-bar">
          <div class="storage-fill" :style="{ width: getStoragePercentage() + '%' }"></div>
        </div>
      </div>
      
      <div class="storage-info">{{ formatStorage(currentStorage) }}/{{ formatStorage(maxStorage) }}</div>
    </div>
  </v-navigation-drawer>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import { workspaceWatcher } from '@/mixins/workspaceWatcher';
import { scheduleRouter } from '../router/ScheduleRouter';
import { notificationState, setChatUnreadCount } from '@/services/notificationState.js';
import driveService from '@/services/driveService';

export default {
  name: "SideBarComponent",
  mixins: [workspaceWatcher],
  data() {
    return {
      showWorkspaceDropdown: false,
      showProjectDropdown: false,
      currentStorage: 0,
      maxStorage: 0,
      projectList: [] // API에서 받아온 프로젝트 목록
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore, notificationState };
  },
  computed: {
    workspaces() {
      return this.workspaceStore.getWorkspaces;
    },
    selectedWorkspace() {
      return this.workspaceStore.getCurrentWorkspace;
    },
    projects() {
      // API에서 받아온 프로젝트 목록을 시작일 기준으로 정렬하여 반환
      const sortedProjects = [...this.projectList].sort((a, b) => {
        const dateA = new Date(a.startedAt || a.startTime || 0);
        const dateB = new Date(b.startedAt || b.startTime || 0);
        return dateA - dateB; // 시작일이 빠른 순서로 정렬
      });
      
      return sortedProjects.map(project => ({
        id: project.projectId,
        name: project.projectName,
        color: '#FDF5EB'
      }));
    },
    currentRoute() {
      return this.$route.path;
    },
    isAdmin() {
      // 스토어의 현재 워크스페이스에서 role 확인 (반응형)
      const currentWorkspace = this.workspaceStore.getCurrentWorkspace;
      return currentWorkspace && currentWorkspace.role === 'ADMIN';
    },
    isPersonalWorkspace() {
      const isPersonal = this.workspaceStore.isPersonalWorkspace;
      const workspaceType = this.workspaceStore.getCurrentWorkspaceType;
      console.log('워크스페이스 타입 체크:', { 
        workspaceType, 
        isPersonal, 
        currentWorkspace: this.workspaceStore.getCurrentWorkspace 
      });
      return isPersonal;
    },
    chatUnreadCount() {
      return this.notificationState.chatUnreadCount || 0;
    }
  },
  async mounted() {
    // 스토어 초기화 (localStorage에서 데이터 로드)
    this.workspaceStore.initialize();
    
    // 워크스페이스 로드 (이 과정에서 setCurrentWorkspace가 호출되어 watch가 트리거됨)
    await this.loadWorkspaces();
    // 워크스페이스의 안 읽은 채팅 수 로드
    await this.fetchWorkspaceUnreadCount();

    // 프로젝트 목록 로드
    await this.loadProjectList();
    
    // 워크스페이스 로드 후 스토리지 사용량 로드 (로그인 직후 반영을 위해)
    await this.loadWorkspaceStorage();
    
    // 프로젝트 생성 이벤트 리스너 추가
    window.addEventListener('projectCreated', this.onProjectCreated);
    // 프로젝트 수정 이벤트 리스너 추가
    window.addEventListener('projectUpdated', this.onProjectUpdated);
    // 프로젝트 삭제 이벤트 리스너 추가
    window.addEventListener('projectDeleted', this.onProjectDeleted);
    // 프로젝트 드롭다운 열기 이벤트 리스너 추가
    window.addEventListener('openProjectDropdown', this.openProjectDropdown);
  },
  
  beforeUnmount() {
    // 이벤트 리스너 제거
    window.removeEventListener('projectCreated', this.onProjectCreated);
    window.removeEventListener('projectUpdated', this.onProjectUpdated);
    window.removeEventListener('projectDeleted', this.onProjectDeleted);
    window.removeEventListener('openProjectDropdown', this.openProjectDropdown);
  },
  watch: {
    // 워크스페이스 변경 감지
    'workspaceStore.currentWorkspace': {
      handler(newWorkspace, oldWorkspace) {
        if (newWorkspace && newWorkspace.workspaceId !== oldWorkspace?.workspaceId) {
          this.loadWorkspaceStorage();
          this.loadProjectList(); // 워크스페이스 변경 시 프로젝트 목록 새로고침
          this.fetchWorkspaceUnreadCount(); // 워크스페이스 변경 시 안읽은 개수 새로고침
        }
      },
      deep: true
    }
  },
  methods: {
    async fetchWorkspaceUnreadCount(){
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const storeWs = this.workspaceStore.getCurrentWorkspace?.workspaceId;
        const lsWs = localStorage.getItem('selectedWorkspaceId');
        const workspaceId = storeWs || lsWs;
        if (!workspaceId) return;
        const { data } = await axios.get(`${baseURL}/chat-service/chat/${workspaceId}/message-count`);
        const count = (data && typeof data.result === 'number') ? data.result : 0;
        setChatUnreadCount(count);
      } catch(_) {}
    },
    async loadWorkspaces() {
      try {
        // localStorage에서 사용자 ID 가져오기 (id 키 사용)
        const userId = localStorage.getItem('id') || 'user123';
        console.log('현재 사용자 ID:', userId);
        
        const response = await axios.get('http://localhost:8080/workspace-service/workspace', {
          headers: {
            'X-User-Id': userId
          }
        });
        
        
        if (response.data.statusCode === 200) {
          console.log('워크스페이스 목록 로드:', response.data.result);
          this.workspaceStore.setWorkspaces(response.data.result);
          
          // API에서 워크스페이스가 있으면 사용, 없으면 기본 워크스페이스 사용
          if (response.data.result.length > 0) {
            // localStorage에 저장된 워크스페이스가 있으면 그것을 사용, 없으면 첫 번째 워크스페이스 선택
            const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
            if (savedWorkspaceId) {
              const savedWorkspace = response.data.result.find(w => w.workspaceId === savedWorkspaceId);
              if (savedWorkspace) {
                this.workspaceStore.setCurrentWorkspace(savedWorkspace);
              } else {
                this.selectWorkspace(response.data.result[0]);
              }
            } else {
              this.selectWorkspace(response.data.result[0]);
            }
          } else {
            // API에서 워크스페이스가 없으면 기본 워크스페이스 사용
            this.setDefaultWorkspace();
          }
        } else {
          this.setDefaultWorkspace();
        }
      } catch (error) {
        console.error('워크스페이스 목록 로드 실패:', error);
        console.error('에러 상세:', error.response?.data || error.message);
        this.setDefaultWorkspace();
      }
    },
    
    setDefaultWorkspace() {
      // API 실패 시 기본 워크스페이스 설정
      const defaultWorkspace = {
        workspaceId: 'default',
        workspaceName: '기본 워크스페이스',
        role: 'MEMBER'
      };
      this.workspaceStore.setWorkspaces([defaultWorkspace]);
      this.workspaceStore.setCurrentWorkspace(defaultWorkspace);
    },
    
    selectWorkspace(workspace) {
      // 현재 선택된 워크스페이스와 다른 워크스페이스인지 확인
      const currentWorkspace = this.workspaceStore.getCurrentWorkspace;
      const isDifferentWorkspace = !currentWorkspace || currentWorkspace.workspaceId !== workspace.workspaceId;
      
      this.workspaceStore.setCurrentWorkspace(workspace);
      this.showWorkspaceDropdown = false;
      
      // 워크스페이스 변경 시 스토리지 사용량 새로고침
      this.loadWorkspaceStorage();
      
      // 다른 워크스페이스로 변경될 때만 라우팅
      if (isDifferentWorkspace) {
        // 워크스페이스 변경 시 항상 홈으로 라우팅
        this.$router.push('/');
      }
    },
    
    
    toggleWorkspaceDropdown() {
      this.showWorkspaceDropdown = !this.showWorkspaceDropdown;
    },
    
    toggleProjectDropdown() {
      this.showProjectDropdown = !this.showProjectDropdown;
    },
    
    openProjectDropdown() {
      this.showProjectDropdown = true;
    },
    
    navigateToHome() {
      this.$router.push('/');
    },
    navigateToAdmin() {
      this.$router.push('/admin');
    },
    navigateToDrive() {
      // localStorage에서 selectedWorkspaceId 가져오기
      const workspaceId = localStorage.getItem('selectedWorkspaceId');
      
      if (workspaceId) {
        this.$router.push(`/drive/WORKSPACE/${workspaceId}`);
      } else {
        // 워크스페이스 ID가 없으면 기본 드라이브로
        this.$router.push('/drive');
      }
    },
    navigateToChat() {
      this.$router.push('/chat/main');
    },
    
    selectProject(project) {
      console.log('프로젝트 선택:', project);
      // 프로젝트 선택 후에도 드롭다운 유지
      this.$router.push({ path: '/project', query: { id: project.id } });
    },
    
    isProjectSelected(projectId) {
      // 현재 라우트가 프로젝트 페이지이고 query의 id가 일치하는지 확인
      return this.currentRoute === '/project' && this.$route.query.id === projectId;
    },
    
    createProject() {
      console.log('프로젝트 생성');
      this.showProjectDropdown = false;
      // 프로젝트 생성 모달 열기
      window.dispatchEvent(new CustomEvent('openCreateProjectModal'));
    },
    
    createWorkspace() {
      // 전역 이벤트 발생 (Vue 3 방식)
      window.dispatchEvent(new CustomEvent('openCreateWorkspaceModal'));
    },
    
    async loadWorkspaceStorage() {
      try {
        const currentWorkspace = this.workspaceStore.getCurrentWorkspace;
        if (!currentWorkspace || !currentWorkspace.workspaceId) {
          console.log('워크스페이스가 선택되지 않음');
          return;
        }
        
        const userId = localStorage.getItem('id') || 'user123';
        const token = localStorage.getItem('accessToken');
        console.log('스토리지 사용량 조회 시작:', currentWorkspace.workspaceId);

        // 1. 워크스페이스 API - maxStorage 가져오기
        const workspaceResponse = await axios.get(
          `http://localhost:8080/workspace-service/workspace/${currentWorkspace.workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // 2. 드라이브 API - 실제 파일 사용량 가져오기
        const driveResponse = await driveService.getStorageUsage();
        
        console.log('워크스페이스 정보:', workspaceResponse.data);
        console.log('드라이브 사용량:', driveResponse);
        
        // 워크스페이스 API에서 maxStorage 가져오기
        if (workspaceResponse.data.statusCode === 200 && workspaceResponse.data.result) {
          this.maxStorage = workspaceResponse.data.result.maxStorage || (50 * 1024 * 1024 * 1024);
        }
        
        // 드라이브 API에서 currentStorage 가져오기
        if (driveResponse.statusCode === 200 && driveResponse.result !== undefined) {
          this.currentStorage = driveResponse.result || 0;
        }
        
        console.log('스토리지 정보 업데이트:', { 
          current: this.formatStorage(this.currentStorage), 
          max: this.formatStorage(this.maxStorage) 
        });
      } catch (error) {
        console.error('스토리지 사용량 조회 실패:', error);
        console.error('Error details:', error.response?.data || error.message);
        // 에러 발생 시 기본값 사용
        this.currentStorage = 0;
        this.maxStorage = 50 * 1024 * 1024 * 1024; // 50GB in bytes
      }
    },
    
    formatStorage(bytes) {
      if (!bytes) return '0GB';
      const gb = bytes / (1024 * 1024 * 1024);
      return gb.toFixed(1) + 'GB';
    },
    
    getStoragePercentage() {
      if (!this.maxStorage || this.maxStorage === 0) return 0;
      return Math.round((this.currentStorage / this.maxStorage) * 100);
    },
    
    // 워크스페이스 변경 감지 메서드 오버라이드
    onWorkspaceChanged(workspaceData) {
      console.log('SideBarComponent: 워크스페이스 변경됨', workspaceData);
      
      // 워크스페이스 변경 시 스토리지 정보 새로고침
      this.loadWorkspaceStorage();
      
      // 워크스페이스명이 변경된 경우 사이드바의 워크스페이스명도 즉시 반영
      // (이미 스토어가 업데이트되어 있으므로 computed 속성이 자동으로 반영됨)
    },
    
    // 프로젝트 목록 조회 API 호출
    async loadProjectList() {
      try {
        const currentWorkspace = this.workspaceStore.getCurrentWorkspace;
        if (!currentWorkspace || !currentWorkspace.workspaceId) {
          this.projectList = [];
          return;
        }
        
        const userId = localStorage.getItem('id') || 'user123';
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/project/${currentWorkspace.workspaceId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          this.projectList = response.data.result || [];
          console.log('프로젝트 목록 로드:', this.projectList);
        } else {
          this.projectList = [];
        }
      } catch (error) {
        console.error('프로젝트 목록 로드 실패:', error);
        this.projectList = [];
      }
    },
    
    // 프로젝트 생성 이벤트 핸들러
    async onProjectCreated() {
      console.log('프로젝트 생성 이벤트 수신 - 목록 새로고침');
      await this.loadProjectList();
    },

    // 내 일정
    navigateToSchedule() {
      this.$router.push("/schedule");
    },

    
    // 프로젝트 수정 이벤트 핸들러
    async onProjectUpdated(event) {
      console.log('프로젝트 수정 이벤트 수신:', event.detail);
      
      // 프로젝트 목록에서 해당 프로젝트 정보 업데이트
      const updatedProject = event.detail;
      const projectIndex = this.projectList.findIndex(p => p.projectId === updatedProject.projectId);
      
      if (projectIndex !== -1) {
        // 기존 프로젝트 정보 업데이트
        this.projectList[projectIndex] = {
          ...this.projectList[projectIndex],
          projectName: updatedProject.projectName,
          projectManagerName: updatedProject.manager,
          projectStatus: updatedProject.status
        };
        console.log('프로젝트 정보 업데이트됨:', this.projectList[projectIndex]);
      } else {
        // 프로젝트를 찾을 수 없으면 전체 목록 새로고침
        console.log('프로젝트를 찾을 수 없음 - 전체 목록 새로고침');
        await this.loadProjectList();
      }
    },
    
    // 프로젝트 삭제 이벤트 핸들러
    async onProjectDeleted(event) {
      console.log('프로젝트 삭제 이벤트 수신:', event.detail);
      
      // 프로젝트 목록에서 해당 프로젝트 제거
      const deletedProjectId = event.detail.projectId;
      const projectIndex = this.projectList.findIndex(p => p.projectId === deletedProjectId);
      
      if (projectIndex !== -1) {
        this.projectList.splice(projectIndex, 1);
        console.log('프로젝트가 목록에서 제거됨:', deletedProjectId);
      } else {
        // 프로젝트를 찾을 수 없으면 전체 목록 새로고침
        console.log('삭제된 프로젝트를 찾을 수 없음 - 전체 목록 새로고침');
        await this.loadProjectList();
      }
    }
  }
};
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  z-index: 100;
  background: #2A2828;
  color: #FDF5EB;
  padding: 20px;
  box-sizing: border-box;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .app-sidebar {
    width: 240px;
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .app-sidebar {
    width: 200px;
    padding: 10px;
  }
}

.logo-section {
  position: relative;
  height: 50px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  padding: 8px;
}

.logo-section:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo-icon {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 25px;
  height: 25px;
  border-radius: 5px;
  object-fit: contain;
}

.logo-text-container {
  position: absolute;
  left: 32px;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  min-height: 20px;
}

.logo-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 16px;
  line-height: 20px;
  color: #FDF5EB;
  word-wrap: break-word;
  white-space: normal;
  width: 100%;
}

@media (max-width: 768px) {
  .logo-text-container {
    left: 28px;
    right: 28px;
  }
  
  .logo-text {
    font-size: 14px;
    line-height: 18px;
  }
}

@media (max-width: 480px) {
  .logo-text-container {
    left: 25px;
    right: 25px;
  }
  
  .logo-text {
    font-size: 12px;
    line-height: 16px;
  }
}

.dropdown-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #FDF5EB;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: translateY(-50%) rotate(180deg);
}

.workspace-dropdown {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.workspace-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.workspace-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.workspace-item.selected {
  background: rgba(255, 221, 68, 0.2);
}

.workspace-item:last-child {
  border-bottom: none;
}

.workspace-circle {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #FDF5EB;
  flex-shrink: 0;
}

.workspace-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #FDF5EB;
}

.workspace-empty {
  padding: 20px 16px;
  text-align: center;
}

.empty-message {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #FDF5EB;
  margin-bottom: 8px;
}

.empty-submessage {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #CCCCCC;
}

.workspace-create-item {
  padding: 12px 16px;
  cursor: pointer;
  border-top: 1px solid #333;
  transition: background-color 0.2s;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.workspace-create-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.workspace-create-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  filter: brightness(0) saturate(100%) invert(86%) sepia(61%) saturate(406%) hue-rotate(340deg) brightness(104%) contrast(101%);
}

.workspace-create-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #FFE364;
}

.copyright {
  position: absolute;
  left: 20px;
  top: 71px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
  color: #888888;
}

.nav-section {
  position: absolute;
  left: 20px;
  right: 20px;
  top: 112px;
  bottom: 86px;
}

.nav-item {
  position: relative;
  height: 44px;
  margin-bottom: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.badge {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: #EF5350;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 221, 68, 0.2);
}

.nav-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  filter: brightness(0) saturate(100%) invert(97%) sepia(8%) saturate(584%) hue-rotate(324deg) brightness(103%) contrast(96%);
}

.nav-text {
  position: absolute;
  left: 52px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 16px;
  line-height: 19px;
  color: #FDF5EB;
}

@media (max-width: 768px) {
  .nav-text {
    left: 40px;
    font-size: 14px;
    line-height: 17px;
  }
}

@media (max-width: 480px) {
  .nav-text {
    left: 35px;
    font-size: 12px;
    line-height: 15px;
  }
}

.nav-item .dropdown-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #FDF5EB;
  transition: transform 0.3s ease;
}

.nav-item .dropdown-arrow.rotated {
  transform: translateY(-50%) rotate(180deg);
}

.project-nav-container {
  margin-bottom: 8px;
}

.project-dropdown {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin-top: 4px;
  max-height: 250px;
  overflow-y: auto;
}

.project-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #333;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.project-item.selected {
  background: rgba(255, 221, 68, 0.2);
}

.project-item .project-circle {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
}

.project-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #FDF5EB;
}

.project-create-item {
  padding: 12px 16px;
  cursor: pointer;
  border-top: 1px solid #333;
  transition: background-color 0.2s;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-create-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.project-create-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.project-create-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.project-create-icon svg {
  width: 100%;
  height: 100%;
}

.project-create-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #FFE364;
}

.storage-section {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;
}

.storage-indicator {
  position: relative;
  height: 16px;
  margin-bottom: 10px;
}

.storage-icon {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  /* 노란색 #F4CE53 필터 적용 */
  filter: brightness(0) saturate(100%) invert(81%) sepia(35%) saturate(730%) hue-rotate(359deg) brightness(102%) contrast(93%);
}

.storage-text {
  position: absolute;
  left: 22px;
  top: 0;
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 12px;
  line-height: 14px;
  color: #FDF5EB;
}

.storage-progress {
  position: relative;
  height: 6px;
  margin-bottom: 10px;
}

.storage-bar {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.storage-fill {
  position: absolute;
  left: 0;
  top: 0;
  width: 48%;
  height: 100%;
  background: #FFDD44;
  border-radius: 3px;
}

.storage-info {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
  color: #CCCCCC;
}

/* 관리자 페이지 메뉴 */
/* .admin-nav-item는 nav-item 기본 스타일을 그대로 사용 */

.admin-nav-item.active {
  background: #554C2E;
  border-radius: 8px;
}
</style>
