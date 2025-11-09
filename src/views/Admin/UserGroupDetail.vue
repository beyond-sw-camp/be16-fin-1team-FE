<template>
  <div class="user-group-detail-page">
    <!-- 메인 컨텐츠 -->
    <div class="main-content">
      <!-- 헤더 섹션 -->
      <div class="header-section">
        <h1 class="page-title">{{ groupDetail.groupName || '사용자 그룹 상세' }}</h1>
      </div>

      <!-- 그룹 정보 섹션 -->
      <div class="group-info-section">
        <div class="form-container">
          <label class="section-label">그룹 정보</label>
          <div class="group-info-content">
            <div class="info-item">
              <span class="info-label">그룹명:</span>
              <span class="info-value">{{ groupDetail.groupName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">그룹 ID:</span>
              <span class="info-value">{{ groupDetail.groupId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">총 멤버 수:</span>
              <span class="info-value">{{ members.length }}명</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 멤버 목록 섹션 -->
      <div class="members-section">
        <div class="form-container">
          <label class="section-label">그룹 멤버</label>
          
          <!-- 로딩 상태 -->
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <span class="loading-text">멤버 목록을 불러오는 중...</span>
          </div>
          
          <!-- 멤버 목록이 비어있을 때 -->
          <div v-else-if="members.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <div class="empty-text">
              이 그룹에 속한 멤버가 없습니다.
            </div>
          </div>
          
          <!-- 멤버 목록 -->
          <div v-else class="members-container">
            <div 
              v-for="member in members" 
              :key="member.userId" 
              class="member-item"
            >
              <div class="user-avatar">
                <img :src="member.profileImageUrl || userDefaultIcon" alt="user" @error="handleAvatarError($event)" />
              </div>
              <div class="user-info">
                <div class="user-name">{{ member.userName }}</div>
                <div class="user-email">{{ member.userEmail }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import userDefaultIcon from '@/assets/icons/user/user_default_icon.svg';

export default {
  name: 'UserGroupDetail',
  data() {
    return {
      groupDetail: {
        groupId: '',
        groupName: '',
        members: []
      },
      members: [],
      loading: false,
      userDefaultIcon
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  mounted() {
    this.loadUserGroupDetail();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    
    // 사용자 그룹 상세 조회
    async loadUserGroupDetail() {
      try {
        this.loading = true;
        const groupId = this.$route.params.groupId;
        
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(
          `${baseURL}/workspace-service/groups/${groupId}`,
          {
            headers: {
              'X-User-Id': localStorage.getItem('id'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          this.groupDetail = response.data.result;
          const allMembers = response.data.result.members.content || [];
          const adminUserId = this.workspaceStore.getAdminUserId || localStorage.getItem('adminUserId');
          
          // 관리자 사용자 제외
          this.members = allMembers.filter(member => 
            member.userId !== adminUserId
          ).map(member => ({
            userId: member.userId,
            userName: member.userName,
            userEmail: member.userEmail,
            profileImageUrl: member.profileImageUrl
          }));
        }
      } catch (error) {
        console.error('사용자 그룹 상세 조회 실패:', error);
        // 에러 발생 시 빈 상태로 설정
        this.groupDetail = {
          groupId: this.$route.params.groupId,
          groupName: '사용자 그룹',
          members: []
        };
        this.members = [];
      } finally {
        this.loading = false;
      }
    },
    
    // 아바타 이미지 로드 실패 시 기본 아이콘으로 대체
    handleAvatarError(event) {
      event.target.src = this.userDefaultIcon;
    }
  }
};
</script>

<style scoped>
.user-group-detail-page {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  background: #F5F5F5 !important;
  font-family: 'Pretendard', sans-serif;
  overflow-y: auto;
  z-index: 100;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

/* 메인 컨텐츠 */
.main-content {
  padding: 20px;
  width: 100%;
  max-width: none;
  margin: 0;
}

/* 헤더 섹션 */
.header-section {
  margin-bottom: 20px;
}

.page-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin: 0;
  text-align: left;
}


/* 폼 컨테이너 */
.form-container {
  background: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 20px;
  width: 100%;
}

.section-label {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1C0F0F;
  margin-bottom: 12px;
  text-align: left;
}

/* 그룹 정보 섹션 */
.group-info-section {
  margin-bottom: 20px;
}

.group-info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-label {
  font-size: 14px;
  font-weight: 700;
  color: #1C0F0F;
  min-width: 80px;
}

.info-value {
  font-size: 14px;
  font-weight: 400;
  color: #666666;
}

/* 멤버 섹션 */
.members-section {
  margin-bottom: 20px;
}

.members-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  padding: 8px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #FFFFFF;
  gap: 16px;
  border-radius: 4px;
  border: 1px solid #E9ECEF;
}

.user-avatar {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.user-info {
  flex: 1;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: #1C0F0F;
  line-height: 18px;
}

.user-email {
  font-size: 13px;
  color: #555555;
  line-height: 18px;
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
  .user-group-detail-page {
    left: 240px;
    width: calc(100vw - 240px);
  }
}

@media (max-width: 768px) {
  .user-group-detail-page {
    left: 0;
    top: 83px;
    width: 100vw;
    height: calc(100vh - 83px);
  }
  
  
  .main-content {
    padding: 15px;
  }
  
}
</style>
