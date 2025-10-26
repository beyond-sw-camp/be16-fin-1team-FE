<template>
  <div class="permission-group-detail">
    <!-- 헤더 -->
    <div class="detail-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="main-title">{{ groupDetail.groupName || '권한 그룹 상세' }}</h1>
          <p class="sub-title">권한 그룹에 속한 멤버들을 확인할 수 있습니다</p>
        </div>
        <button class="back-btn" @click="goBack">
          ← 뒤로가기
        </button>
      </div>
    </div>

    <!-- 멤버 목록 테이블 -->
    <div class="member-table-container">
      <!-- 테이블 헤더 -->
      <div class="table-header">
        <div class="header-cell member-name">회원명</div>
        <div class="header-cell email">이메일</div>
        <div class="header-cell role">역할</div>
      </div>

      <!-- 멤버 목록 -->
      <div class="member-list">
        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <span class="loading-text">멤버 목록을 불러오는 중...</span>
        </div>
        
        <!-- 멤버 목록이 비어있을 때 -->
        <div v-else-if="members.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-text">
            이 권한 그룹에 속한 멤버가 없습니다.
          </div>
        </div>
        
        <!-- 멤버 목록 -->
        <div v-else>
          <div v-for="member in members" :key="member.userInfo.userId" class="member-row">
            <div class="member-name">
              <div class="user-avatar">
                <img 
                  src="/src/assets/icons/user/user_default_icon.svg" 
                  :alt="member.userInfo.userName"
                  class="avatar-img"
                />
              </div>
              <span class="name-text">{{ member.userInfo.userName }}</span>
            </div>
            <div class="email">{{ member.userInfo.userEmail }}</div>
            <div class="role">
              <span class="role-badge" :class="member.workspaceRole.toLowerCase()">
                {{ getRoleDisplayName(member.workspaceRole) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 테이블 푸터 -->
      <div class="table-footer">
        <div class="footer-info">
          <span class="total-count">총 {{ members.length }}명의 멤버</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: 'PermissionGroupDetail',
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  data() {
    return {
      groupDetail: {
        groupId: '',
        groupName: '',
        userList: []
      },
      members: [],
      loading: false
    }
  },
  methods: {
    async loadGroupDetail() {
      try {
        this.loading = true;
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123';
        const groupId = this.$route.params.groupId;
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/access/group-detail/${groupId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          this.groupDetail = response.data.result;
          this.members = response.data.result.userList || [];
        }
      } catch (error) {
        console.error('권한 그룹 상세 조회 실패:', error);
        // 에러 발생 시 더미 데이터 사용
        this.groupDetail = {
          groupId: this.$route.params.groupId,
          groupName: '일반 유저 그룹',
          userList: []
        };
        this.members = [
          {
            userInfo: {
              userId: '9081531a-2ba3-4be6-8a70-a2c8da60cd66',
              userName: 'hong3',
              userEmail: 'hong3@naver.com',
              profileImageUrl: null
            },
            workspaceRole: 'COMMON'
          },
          {
            userInfo: {
              userId: 'a68dadd8-be54-4673-8dd4-684118e4eb43',
              userName: 'hong6',
              userEmail: 'hong6@naver.com',
              profileImageUrl: null
            },
            workspaceRole: 'COMMON'
          },
          {
            userInfo: {
              userId: 'c73b6e3f-c90a-48b6-8a3c-a7ba153533e9',
              userName: 'hong7',
              userEmail: 'hong7@naver.com',
              profileImageUrl: null
            },
            workspaceRole: 'COMMON'
          }
        ];
      } finally {
        this.loading = false;
      }
    },
    
    getInitials(name) {
      if (!name) return '?';
      return name.charAt(0).toUpperCase();
    },
    
    getRoleDisplayName(role) {
      const roleMap = {
        'ADMIN': '관리자',
        'COMMON': '일반 사용자',
        'OWNER': '소유자',
        'MANAGER': '매니저',
        'MEMBER': '멤버'
      };
      return roleMap[role] || role;
    },
    
    goBack() {
      this.$router.go(-1);
    }
  },
  mounted() {
    this.loadGroupDetail();
  }
}
</script>

<style>
.permission-group-detail {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

.detail-header {
  padding: 30px 30px 0 30px;
  margin-bottom: 30px;
  text-align: left;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-section {
  flex: 1;
}

.back-btn {
  background: none;
  border: none;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  display: block;
  margin: 0;
}

.back-btn:hover {
  color: #1C0F0F;
  background-color: rgba(0, 0, 0, 0.05);
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


.permission-group-detail .member-table-container {
  margin: 0 30px 30px 30px !important;
  background: #FFFFFF !important;
  border: 1px solid rgba(0, 0, 0, 0.1) !important;
  border-radius: 2px !important;
  overflow: hidden !important;
  flex: 1 !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 200px) !important;
  min-height: 400px !important;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  background: #F8F9FA;
  border-bottom: 1px solid #E5E5E5;
}

.header-cell {
  padding: 12px 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
  border-right: 1px solid #E5E5E5;
}

.header-cell:last-child {
  border-right: none;
}

.permission-group-detail .member-list {
  max-height: 600px !important;
  overflow-y: auto !important;
  min-height: 0 !important;
}

.member-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  border-bottom: 1px solid #F0F0F0;
  transition: background-color 0.2s;
}

.member-row:hover {
  background-color: #FAFAFA;
}

.member-row > div {
  padding: 12px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 17px;
  border-right: 1px solid #F0F0F0;
  display: flex;
  align-items: center;
}

.member-row > div:last-child {
  border-right: none;
}

.member-name {
  font-weight: 700;
  color: #1C0F0F;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.name-text {
  font-weight: 700;
  color: #1C0F0F;
}

.email {
  font-weight: 400;
  color: #666666;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.role {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12px;
  line-height: 15px;
  color: #FFFFFF;
  background: #95A5A6;
}

.role-badge.admin {
  background: #FF0000;
}

.role-badge.common {
  background: #95A5A6;
}

.role-badge.owner {
  background: #E74C3C;
}

.role-badge.manager {
  background: #F39C12;
}

.role-badge.member {
  background: #3498DB;
}


.table-footer {
  background: #F8F9FA !important;
  padding: 15px 20px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  border-top: 1px solid #E5E5E5 !important;
  flex-shrink: 0 !important;
  margin-top: auto !important;
}

.footer-info {
  flex: 1;
  text-align: left;
}

.total-count {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}


/* 로딩 상태 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #F0F0F0;
  border-top: 4px solid #FFDD44;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.6;
}

.empty-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  text-align: center;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .permission-group-detail {
    left: 240px;
    width: calc(100vw - 240px);
  }
}

@media (max-width: 768px) {
  .permission-group-detail {
    left: 0;
    top: 83px;
    width: 100vw;
    height: calc(100vh - 83px);
  }
  
  .detail-header {
    padding: 20px 20px 0 20px;
  }
  
  .member-table-container {
    margin: 0 20px 20px 20px;
  }
  
  .table-header,
  .member-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .header-cell,
  .member-row > div {
    border-right: none;
    border-bottom: 1px solid #F0F0F0;
  }
}
</style>
