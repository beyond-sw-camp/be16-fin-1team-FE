<template>
  <v-navigation-drawer class="app-sidebar" permanent>
    <!-- 로고 섹션 -->
    <div class="logo-section" @click="toggleWorkspaceDropdown">
      <div class="logo-icon"></div>
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
        <div class="workspace-name">{{ workspace.workspaceName }}</div>
      </div>
      <div v-if="workspaces.length === 0" class="workspace-empty">
        <div class="empty-message">워크스페이스가 없습니다</div>
        <div class="empty-submessage">새 워크스페이스를 생성하거나 초대를 받아보세요</div>
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
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/schedule.svg" alt="내 일정" class="nav-icon" />
        <div class="nav-text">내 일정</div>
      </div>
      
      <!-- 채팅 -->
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/chat.svg" alt="채팅" class="nav-icon" />
        <div class="nav-text">채팅</div>
      </div>
      
      <!-- 문서함 -->
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/document.svg" alt="문서함" class="nav-icon" />
        <div class="nav-text">문서함</div>
      </div>
      
      <!-- 프로젝트 -->
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/project.svg" alt="프로젝트" class="nav-icon" />
        <div class="nav-text">프로젝트</div>
        <div class="dropdown-arrow">▼</div>
      </div>
      
      <!-- 관리자 페이지 (관리자 권한이 있을 때만 표시) -->
      <div v-if="isAdmin" class="nav-item admin-nav-item" :class="{ active: currentRoute === '/admin' }" @click="navigateToAdmin">
        <img src="@/assets/icons/sidebar/admin.svg" alt="관리자 페이지" class="nav-icon" />
        <div class="nav-text">관리자 페이지</div>
      </div>
    </div>
    
    <!-- 스토리지 사용량 -->
    <div class="storage-section">
      <div class="storage-indicator">
        <div class="storage-dot"></div>
        <div class="storage-text">스토리지 사용량</div>
      </div>
      
      <div class="storage-progress">
        <div class="storage-bar">
          <div class="storage-fill"></div>
        </div>
      </div>
      
      <div class="storage-info">4.8GB/10GB</div>
    </div>
  </v-navigation-drawer>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: "SideBarComponent",
  data() {
    return {
      showWorkspaceDropdown: false
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  computed: {
    workspaces() {
      return this.workspaceStore.getWorkspaces;
    },
    selectedWorkspace() {
      return this.workspaceStore.getCurrentWorkspace;
    },
    currentRoute() {
      return this.$route.path;
    },
    isAdmin() {
      // 스토어의 현재 워크스페이스에서 role 확인 (반응형)
      const currentWorkspace = this.workspaceStore.getCurrentWorkspace;
      return currentWorkspace && currentWorkspace.role === 'ADMIN';
    }
  },
  async mounted() {
    // 스토어 초기화 (localStorage에서 데이터 로드)
    this.workspaceStore.initialize();
    await this.loadWorkspaces();
  },
  methods: {
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
      
      // 다른 워크스페이스로 변경될 때만 라우팅
      if (isDifferentWorkspace) {
        // 관리자 권한이 있으면 관리자 페이지로, 없으면 홈으로
        if (workspace.role === 'ADMIN') {
          this.$router.push('/admin');
        } else {
          this.$router.push('/');
        }
      }
    },
    
    
    toggleWorkspaceDropdown() {
      this.showWorkspaceDropdown = !this.showWorkspaceDropdown;
    },
    
    navigateToHome() {
      this.$router.push('/');
    },
    navigateToAdmin() {
      this.$router.push('/admin');
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
  z-index: 900;
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
  width: 20px;
  height: 20px;
  background: #FFDD44;
  border-radius: 4px;
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
  background: #1A1A1A;
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
  width: 18px;
  height: 18px;
  opacity: 0.9;
}

.nav-text {
  position: absolute;
  left: 46px;
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
}

.storage-section {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;
}

.storage-indicator {
  position: relative;
  height: 14px;
  margin-bottom: 10px;
}

.storage-dot {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: #FFDD44;
  border-radius: 6px;
}

.storage-text {
  position: absolute;
  left: 18px;
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
.admin-nav-item {
  /* 일반 nav-item과 동일한 스타일 사용 */
}

.admin-nav-item.active {
  background: #554C2E;
  border-radius: 8px;
}
</style>
