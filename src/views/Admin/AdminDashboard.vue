<template>
  <div class="admin-dashboard">
    <!-- 관리자 페이지 헤더 -->
    <div class="admin-header">
      <div class="admin-nav-tabs">
        <div class="nav-tab active" @click="setActiveTab('permission')">권한 그룹</div>
        <div class="nav-tab" @click="setActiveTab('user')">사용자 그룹</div>
        <div class="nav-tab" @click="setActiveTab('dashboard')">대시보드</div>
        <div class="nav-tab" @click="setActiveTab('member')">회원 관리</div>
        <div class="nav-tab" @click="setActiveTab('workspace')">워크스페이스 관리</div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="admin-content">
      <!-- 권한 그룹 -->
      <div v-if="activeTab === 'permission'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">권한 그룹</h1>
          <p class="sub-title">역할을 사용하면 서버 멤버를 그룹화하고 권한을 지정할 수 있어요.</p>
        </div>
        
        <!-- 권한 그룹 목록 -->
        <div class="permission-groups-container">
          <!-- 권한 생성 버튼 -->
          <div class="button-container">
            <div class="create-permission-btn" @click="createPermissionGroup">
              <span>권한 생성</span>
            </div>
          </div>

          <!-- 권한 그룹 헤더 -->
          <div class="permission-groups-header">
            <div class="header-left">
              <span class="header-title">역할 - {{ permissionGroups.length }}</span>
            </div>
            <div class="header-right">
              <span class="header-title">멤버</span>
            </div>
          </div>

          <!-- API에서 가져온 권한 그룹들 -->
          <div v-for="group in permissionGroups" :key="group.accessGroupId" class="permission-group-card">
            <div class="group-header">
              <div class="group-icon">
                <img 
                  :src="group.accessGroupName === '관리자 그룹' ? '/src/assets/icons/sidebar/admin.svg' : '/src/assets/icons/user/user_default_icon.svg'" 
                  :alt="group.accessGroupName"
                  class="group-icon-img"
                />
              </div>
              <div class="group-info">
                <h3 class="group-title">{{ group.accessGroupName }}</h3>
              </div>
              <div class="group-member-count">
                <span class="member-count">{{ group.groupParticipantCount }}명</span>
              </div>
              <div class="group-actions">
                <div class="action-menu" @click="toggleActionMenu(group.accessGroupId)">
                  <span>⋯</span>
                </div>
              </div>
            </div>
            
            <!-- 액션 메뉴 -->
            <div v-if="activeActionMenu === group.accessGroupId" class="action-dropdown">
              <div class="action-item" @click="editGroup(group)">수정하기</div>
              <div class="action-item" @click="manageMembers(group)">사용자 추가/제거</div>
              <div class="action-item delete" @click="deleteGroup(group)">삭제하기</div>
            </div>
          </div>

          <!-- 더보기 버튼 -->
          <div class="button-container">
            <div class="more-permissions-btn" @click="loadMorePermissions">
              <span>더보기</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 사용자 그룹 -->
      <div v-if="activeTab === 'user'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">사용자 그룹 관리</h1>
          <p class="sub-title">사용자 그룹을 관리합니다</p>
        </div>
        
        <div class="admin-cards">
          <div class="admin-card">
            <h3>개발팀</h3>
            <p>총 멤버: 15명</p>
            <p>활성 멤버: 12명</p>
          </div>
          
          <div class="admin-card">
            <h3>디자인팀</h3>
            <p>총 멤버: 8명</p>
            <p>활성 멤버: 6명</p>
          </div>
          
          <div class="admin-card">
            <h3>마케팅팀</h3>
            <p>총 멤버: 10명</p>
            <p>활성 멤버: 8명</p>
          </div>
        </div>
      </div>

      <!-- 대시보드 -->
      <div v-if="activeTab === 'dashboard'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">오늘의 일정</h1>
          <p class="sub-title">적을 거 있으면 적으십쇼</p>
        </div>
        
        <div class="admin-cards">
          <div class="admin-card">
            <h3>사용자 통계</h3>
            <p>총 사용자: 1,234명</p>
            <p>활성 사용자: 856명</p>
          </div>
          
          <div class="admin-card">
            <h3>워크스페이스 통계</h3>
            <p>총 워크스페이스: 45개</p>
            <p>활성 워크스페이스: 38개</p>
          </div>
          
          <div class="admin-card">
            <h3>시스템 상태</h3>
            <p>서버 상태: 정상</p>
            <p>데이터베이스: 정상</p>
          </div>
        </div>
      </div>

      <!-- 회원 관리 -->
      <div v-if="activeTab === 'member'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">회원 관리</h1>
          <p class="sub-title">회원 정보를 관리합니다</p>
        </div>
        
        <div class="admin-cards">
          <div class="admin-card">
            <h3>신규 가입자</h3>
            <p>이번 주: 25명</p>
            <p>이번 달: 120명</p>
          </div>
          
          <div class="admin-card">
            <h3>탈퇴 회원</h3>
            <p>이번 주: 3명</p>
            <p>이번 달: 15명</p>
          </div>
          
          <div class="admin-card">
            <h3>활성 회원</h3>
            <p>일일 활성: 856명</p>
            <p>주간 활성: 1,200명</p>
          </div>
        </div>
      </div>

      <!-- 워크스페이스 관리 -->
      <div v-if="activeTab === 'workspace'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">워크스페이스 관리</h1>
          <p class="sub-title">워크스페이스를 관리합니다</p>
        </div>
        
        <div class="admin-cards">
          <div class="admin-card">
            <h3>전체 워크스페이스</h3>
            <p>총 워크스페이스: 45개</p>
            <p>활성 워크스페이스: 38개</p>
          </div>
          
          <div class="admin-card">
            <h3>새로운 워크스페이스</h3>
            <p>이번 주: 3개</p>
            <p>이번 달: 12개</p>
          </div>
          
          <div class="admin-card">
            <h3>스토리지 사용량</h3>
            <p>전체 사용량: 4.8GB</p>
            <p>사용 가능: 5.2GB</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: "AdminDashboard",
  data() {
    return {
      activeTab: 'permission',
      permissionGroups: [],
      activeActionMenu: null,
      loading: false,
      currentPage: 0,
      totalPages: 1
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  async mounted() {
    if (this.activeTab === 'permission') {
      await this.loadPermissionGroups();
    }
  },
  
  watch: {
    'workspaceStore.currentWorkspace': {
      handler(newWorkspace, oldWorkspace) {
        if (newWorkspace && newWorkspace.workspaceId !== oldWorkspace?.workspaceId) {
          console.log('워크스페이스 변경 감지:', newWorkspace.workspaceId);
          if (this.activeTab === 'permission') {
            this.currentPage = 0;
            this.loadPermissionGroups();
          }
        }
      },
      deep: true
    }
  },
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;
      // 모든 탭에서 active 클래스 제거
      document.querySelectorAll('.nav-tab').forEach(el => {
        el.classList.remove('active');
      });
      // 클릭된 탭에 active 클래스 추가
      event.target.classList.add('active');
      
      // 권한 그룹 탭이 활성화되면 데이터 로드
      if (tab === 'permission') {
        this.loadPermissionGroups();
      }
    },
    
    async loadPermissionGroups() {
      try {
        this.loading = true;
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123'; // 실제 사용자 ID로 교체 필요
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_1';
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/access/group-list/${workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            },
            params: {
              page: this.currentPage,
              size: 10
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          this.permissionGroups = response.data.result.content;
          this.totalPages = response.data.result.totalPages;
        }
      } catch (error) {
        console.error('권한 그룹 목록 로드 실패:', error);
        // 에러 발생 시 더미 데이터 사용
        this.permissionGroups = [
          {
            accessGroupId: "ws_acc_grp_1",
            accessGroupName: "관리자 그룹",
            createdAt: "2025-10-16T18:38:04.030423",
            groupParticipantCount: 1
          },
          {
            accessGroupId: "ws_acc_grp_2", 
            accessGroupName: "일반 유저 그룹",
            createdAt: "2025-10-16T18:38:04.046983",
            groupParticipantCount: 1
          }
        ];
      } finally {
        this.loading = false;
      }
    },
    
    async loadMorePermissions() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        await this.loadPermissionGroups();
      }
    },
    
    toggleActionMenu(groupId) {
      this.activeActionMenu = this.activeActionMenu === groupId ? null : groupId;
    },
    
    createPermissionGroup() {
      // 권한 그룹 생성 로직
      console.log('권한 그룹 생성');
    },
    
    editGroup(group) {
      // 권한 그룹 수정 로직
      console.log('권한 그룹 수정:', group);
      this.activeActionMenu = null;
    },
    
    manageMembers(group) {
      // 멤버 관리 로직
      console.log('멤버 관리:', group);
      this.activeActionMenu = null;
    },
    
    deleteGroup(group) {
      // 권한 그룹 삭제 로직
      if (confirm(`${group.accessGroupName} 그룹을 삭제하시겠습니까?`)) {
        console.log('권한 그룹 삭제:', group);
        this.activeActionMenu = null;
      }
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  background: #F5F5F5 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

.admin-header {
  background: #F5F5F5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  flex-shrink: 0;
  overflow-x: auto;
  z-index: 200;
}

.admin-nav-tabs {
  display: flex;
  gap: 0;
  flex-wrap: nowrap;
  width: 100%;
  justify-content: space-between;
}

.nav-tab {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  cursor: pointer;
  padding: 10px 8px;
  border-bottom: 4px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
  flex: 1;
  text-align: center;
}

.nav-tab:hover {
  color: #FFDD44;
}

.nav-tab.active {
  color: #1C0F0F;
  border-bottom-color: #FFDD44;
}

.admin-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: #F5F5F5;
}

.tab-content {
  width: 100%;
  height: 100%;
}

.content-header {
  margin-bottom: 30px;
  text-align: left;
}

.main-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 24px;
  line-height: 28px;
  color: #1C0F0F;
  margin: 0 0 15px 0;
  text-align: left;
}

.sub-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: #666666;
  margin: 0;
  text-align: left;
}

.admin-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 100%;
}

.admin-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  max-width: 100%;
}

.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.admin-card h3 {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: #1C0F0F;
  margin: 0 0 15px 0;
}

.admin-card p {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #666666;
  margin: 6px 0;
}


@media (max-width: 1200px) {
  .admin-dashboard {
    left: 240px;
    width: calc(100vw - 240px);
  }
  
  .nav-tab {
    font-size: 18px;
    line-height: 22px;
    padding: 8px 6px;
  }
  
  .admin-cards {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    left: 0;
    top: 83px;
    width: 100vw;
    height: calc(100vh - 83px);
  }
  
  .admin-nav-tabs {
    flex-direction: column;
    gap: 5px;
  }
  
  .nav-tab {
    font-size: 16px;
    line-height: 20px;
    padding: 8px 12px;
    flex: none;
    text-align: left;
  }
  
  .admin-content {
    padding: 20px;
  }
  
  .admin-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .admin-card {
    padding: 20px;
  }
}

/* 권한 그룹 관련 스타일 */
.permission-groups-container {
  max-width: 100%;
  margin: 0 auto;
}

.button-container {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.permission-groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
}

.header-left {
  flex: 1;
  text-align: left;
}

.header-right {
  flex: 1;
  text-align: right;
  padding-right: 60px;
}

.header-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
}

.permission-group-card {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.permission-group-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.default-group {
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
}

.group-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
}

.group-icon {
  width: 24px;
  height: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: brightness(0);
}

.group-info {
  flex: 1;
  text-align: left;
}

.group-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  margin: 0;
}

.group-member-count {
  flex: 1;
  text-align: right;
  margin-right: 16px;
}

.member-count {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
}

.group-arrow {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin-left: 16px;
}

.group-actions {
  position: relative;
  margin-left: 16px;
}

.action-menu {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-menu:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-menu span {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
}

.action-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
}

.action-item {
  padding: 12px 16px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 8px;
  line-height: 10px;
  color: #000000;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #DDDDDD;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-item.delete {
  color: #FF4444;
}

.create-permission-btn,
.more-permissions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  margin: 8px 0;
  background: #FFE364;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
  text-align: center;
  width: 200px;
}

.create-permission-btn:hover,
.more-permissions-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}

.btn-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 16px;
  font-weight: bold;
}

@media (max-width: 480px) {
  .permission-group-card {
    margin-bottom: 6px;
  }
  
  .group-header {
    padding: 12px 16px;
  }
  
  .group-title {
    font-size: 14px;
    line-height: 17px;
  }
  
  .group-description {
    font-size: 12px;
    line-height: 15px;
  }
}
</style>
