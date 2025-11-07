<template>
  <div class="add-permission-group-users-page">
    <!-- 메인 콘텐츠 -->
    <div class="page-content">
      <div class="content-container">
        <!-- 제목 섹션 -->
        <div class="title-section">
          <h1 class="main-title">사용자 편집</h1>
          <p class="sub-title">권한그룹에 사용자를 추가/제거 하세요</p>
        </div>

      <!-- 개별 사용자 검색 섹션 -->
      <div class="section">
        <div class="panel">
          <div class="form-container">
            <label class="section-label">개별 사용자 검색</label>
            <div class="search-input-wrapper">
            <input 
              type="text" 
              class="user-search-input" 
              placeholder="사용자명 또는 이메일을 입력하세요"
              v-model="individualSearchQuery"
              @keyup.enter="searchIndividualUsers"
            />
            <button class="search-btn" @click="searchIndividualUsers">검색</button>
          </div>
          <!-- 개별 사용자 목록 -->
          <div class="individual-users-container">
            <div 
              v-for="user in individualUsers" 
              :key="user.userId" 
              class="individual-user-item"
            >
              <img :src="user.profileImageUrl || '/user_default_icon.svg'" alt="user" class="user-avatar" @error="handleAvatarError($event)" />
              <div class="user-info">
                <div class="user-name">{{ user.userName }}</div>
                <div class="user-email">{{ user.userEmail }}</div>
              </div>
              <button 
                class="add-user-btn" 
                @click="addIndividualUser(user)"
                :disabled="selectedUsers.find(u => u.userId === user.userId)"
              >
                추가
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- 사용자 그룹 검색 섹션 -->
      <div class="section">
        <div class="panel">
          <div class="form-container">
            <label class="section-label">사용자 그룹 검색</label>
            <div class="group-search-input-wrapper">
            <input 
              type="text" 
              class="group-search-input-field" 
              placeholder="그룹명을 입력하세요"
              v-model="groupSearchQuery"
              @keyup.enter="searchUserGroups"
            />
            <button class="group-search-btn" @click="searchUserGroups">검색</button>
          </div>
          <!-- 사용자 그룹 목록 -->
          <div class="user-groups-container">
            <div 
              v-for="group in userGroups" 
              :key="group.groupId" 
              class="user-group-item"
            >
              <div class="group-info">
                <div class="group-name">{{ group.groupName }}</div>
                <div class="group-members">{{ group.memberCount }}명의 멤버</div>
              </div>
              <button 
                class="add-group-btn" 
                @click="addGroup(group)"
                :disabled="selectedGroups.find(g => g.groupId === group.groupId)"
              >
                추가
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- 선택된 사용자 섹션 -->
      <div class="section">
        <div class="panel">
          <div class="form-container">
            <label class="section-label">선택된 사용자</label>
            <div class="selected-count">총 {{ selectedUsers.length }}명의 사용자가 선택되었습니다</div>
          <div class="selected-users-container">
            <div 
              v-for="user in selectedUsers" 
              :key="user.userId" 
              class="selected-user-item"
            >
              <img :src="user.profileImageUrl || '/user_default_icon.svg'" alt="user" class="user-avatar" @error="handleAvatarError($event)" />
              <div class="user-info">
                <div class="user-name">{{ user.userName }}</div>
                <div v-if="user.userEmail" class="user-email">{{ user.userEmail }}</div>
              </div>
              <button class="remove-user-btn" @click="removeUser(user.userId)">✕</button>
            </div>
          </div>
          <button class="clear-all-btn" @click="clearAllUsers">전체 삭제</button>
          </div>
          </div>
        </div>
      </div>

      <!-- 액션 버튼들 -->
      <div class="action-section">
        <div class="action-buttons">
          <button class="cancel-btn" @click="goBack">취소</button>
          <button class="add-users-btn" @click="addUsersToPermissionGroup">사용자 추가</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: 'AddPermissionGroupUsers',
  data() {
    return {
      individualSearchQuery: '',
      groupSearchQuery: '',
      individualUsers: [],
      userGroups: [],
      selectedUsers: [],
      selectedGroups: [],
      permissionGroupId: null,
      userDefaultIcon: '/user_default_icon.svg'
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  mounted() {
    this.permissionGroupId = this.$route.params.groupId;
    this.loadUserGroups();
    this.loadIndividualUsers();
    this.loadExistingMembers();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    
    // 권한 그룹의 기존 멤버 로드
    async loadExistingMembers() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(
          `${baseURL}/workspace-service/access/group-detail/${this.permissionGroupId}`,
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const groupDetail = response.data.result;
          const userList = groupDetail.userList || [];
          this.selectedUsers = userList.map(user => ({
            userId: user.userInfo.userId,
            userName: user.userInfo.userName,
            userEmail: user.userInfo.userEmail,
            profileImageUrl: user.userInfo.profileImageUrl,
            groupName: '기존 멤버'
          }));
        }
      } catch (error) {
        console.error('기존 멤버 로드 실패:', error);
        // 에러가 발생해도 빈 배열로 시작
        this.selectedUsers = [];
      }
    },
    
    // 사용자 그룹 목록 로드
    async loadUserGroups() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(
          `${baseURL}/workspace-service/groups/search`,
          {
            workspaceId: this.workspaceStore.getCurrentWorkspaceId,
            groupName: ""
          },
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const pageData = response.data.result;
          const groups = pageData.content || [];
          
          this.userGroups = groups.map(group => ({
            groupId: group.userGroupName, // userGroupName을 groupId로 사용
            groupName: group.userGroupName,
            memberCount: group.userGroupParticipantsCount,
            participants: group.participants || []
          }));
        }
      } catch (error) {
        console.error('사용자 그룹 목록 로드 실패:', error);
        this.userGroups = [];
      }
    },
    
    // 개별 사용자 목록 로드 (권한그룹 미소속 사용자)
    async loadIndividualUsers() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(
          `${baseURL}/workspace-service/workspace/participants/search`,
          {
            workspaceId: this.workspaceStore.getCurrentWorkspaceId,
            searchKeyword: ""
          },
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const allUsers = response.data.result.userInfoList || [];
          const adminUserId = this.workspaceStore.getAdminUserId || localStorage.getItem('adminUserId');
          // 관리자 사용자 제외
          this.individualUsers = allUsers.filter(user => 
            user.userId !== adminUserId
          ).map(user => ({
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            profileImageUrl: user.profileImageUrl
          }));
        }
      } catch (error) {
        console.error('개별 사용자 목록 로드 실패:', error);
        this.individualUsers = [];
      }
    },
    
    // 개별 사용자 검색
    async searchIndividualUsers() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(
          `${baseURL}/workspace-service/workspace/participants/search`,
          {
            workspaceId: this.workspaceStore.getCurrentWorkspaceId,
            searchKeyword: this.individualSearchQuery.trim()
          },
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const allUsers = response.data.result.userInfoList || [];
          const adminUserId = this.workspaceStore.getAdminUserId || localStorage.getItem('adminUserId');
          // 관리자 사용자 제외
          this.individualUsers = allUsers.filter(user => 
            user.userId !== adminUserId
          ).map(user => ({
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            profileImageUrl: user.profileImageUrl
          }));
        }
      } catch (error) {
        console.error('개별 사용자 검색 실패:', error);
        this.individualUsers = [];
      }
    },
    
    // 사용자 그룹 검색
    async searchUserGroups() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(
          `${baseURL}/workspace-service/groups/search`,
          {
            workspaceId: this.workspaceStore.getCurrentWorkspaceId,
            groupName: this.groupSearchQuery.trim()
          },
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const pageData = response.data.result;
          const groups = pageData.content || [];
          
          this.userGroups = groups.map(group => ({
            groupId: group.userGroupName, // userGroupName을 groupId로 사용
            groupName: group.userGroupName,
            memberCount: group.userGroupParticipantsCount,
            participants: group.participants || []
          }));
        }
      } catch (error) {
        console.error('사용자 그룹 검색 실패:', error);
        this.userGroups = [];
      }
    },
    
    // 그룹 추가
    addGroup(group) {
      if (!this.selectedGroups.find(g => g.groupId === group.groupId)) {
        this.selectedGroups.push(group);
        // 그룹의 참여자들을 선택된 사용자에 추가
        if (group.participants && group.participants.length > 0) {
          group.participants.forEach(participant => {
            if (!this.selectedUsers.find(u => u.userId === participant.userId)) {
              this.selectedUsers.push({
                userId: participant.userId,
                userName: participant.userName,
                userEmail: participant.userEmail,
                profileImageUrl: participant.profileImageUrl,
                groupName: group.groupName
              });
            }
          });
        }
      }
    },
    
    // 개별 사용자 추가
    addIndividualUser(user) {
      if (!this.selectedUsers.find(u => u.userId === user.userId)) {
        this.selectedUsers.push({
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          profileImageUrl: user.profileImageUrl,
          groupName: '개별 사용자'
        });
      }
    },
    
    // 아바타 이미지 로드 실패 시 기본 아이콘으로 대체
    handleAvatarError(event) {
      event.target.src = this.userDefaultIcon;
    },
    
    // 사용자 제거
    removeUser(userId) {
      this.selectedUsers = this.selectedUsers.filter(user => user.userId !== userId);
    },
    
    // 전체 삭제
    clearAllUsers() {
      this.selectedUsers = [];
      this.selectedGroups = [];
    },
    
    // 권한 그룹에 사용자 추가/제거
    async addUsersToPermissionGroup() {
      try {
        // 선택된 사용자들의 userId 리스트 생성
        const userIdList = this.selectedUsers.map(user => user.userId);
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        
        // 백엔드 API 호출 - 빈 배열이어도 요청을 보냄 (백엔드에서 모든 사용자 제거 처리)
        const response = await axios.patch(
          `${baseURL}/workspace-service/access/${this.permissionGroupId}/users`,
          {
            userIdList: userIdList
          },
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode !== 200) {
          throw new Error('사용자 관리에 실패했습니다.');
        }
        
        alert('사용자 관리가 성공적으로 완료되었습니다.');
        this.$router.go(-1);
      } catch (error) {
        console.error('사용자 관리 실패:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          alert(`사용자 관리 실패: ${error.response.data.statusMessage}`);
        } else {
          alert('사용자 관리에 실패했습니다.');
        }
      }
    },
    
    // 모든 기존 멤버 조회 (제거된 멤버 확인용)
    async getAllExistingMembers() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(
          `${baseURL}/workspace-service/access/group-detail/${this.permissionGroupId}`,
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const groupDetail = response.data.result;
          const userList = groupDetail.userList || [];
          return userList.map(user => ({
            userId: user.userInfo.userId,
            userName: user.userInfo.userName,
            userEmail: user.userInfo.userEmail
          }));
        }
        return [];
      } catch (error) {
        console.error('기존 멤버 조회 실패:', error);
        return [];
      }
    }
  }
};
</script>

<style scoped>
.add-permission-group-users-page {
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
}


/* 콘텐츠 영역 */
.page-content { flex: 1; padding: 30px; overflow-y: auto; background: #F5F5F5; }
.content-container { max-width: 1200px; margin: 0 auto; }

/* 타이틀 섹션 */
.title-section { margin-bottom: 40px; }
.main-title { font-family: 'Pretendard', sans-serif; font-weight: 800; font-size: 28px; line-height: 33px; color: #1C0F0F; margin: 0 0 15px 0; text-align: left; }
.sub-title { font-family: 'Pretendard', sans-serif; font-weight: 700; font-size: 16px; line-height: 19px; color: #666666; margin: 0; text-align: left; }

/* 공통 섹션 */
.section { margin-bottom: 24px; }
.section-heading { font-family: 'Pretendard', sans-serif; font-weight: 700; font-size: 18px; line-height: 21px; color: #1C0F0F; margin-bottom: 12px; text-align: left; }
.panel { background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 2px; padding: 12px; }

/* 폼 컨테이너 */
.form-container {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 2px;
  padding: 12px;
  margin-bottom: 0;
  width: 100%;
}

.section-label {
  display: block;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 21px;
  color: #1C0F0F;
  margin-bottom: 12px;
  text-align: left;
}


.search-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.user-search-input {
  flex: 1;
  height: 42px;
  padding: 0 17px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #FFFFFF;
  font-size: 14px;
  color: #757575;
  box-sizing: border-box;
}

.user-search-input:focus {
  outline: none;
  border-color: #FFDD44;
}

.search-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #2A2828;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover {
  background: #FFDD44;
}


.group-search-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.group-search-input-field {
  flex: 1;
  height: 42px;
  padding: 0 17px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #FFFFFF;
  font-size: 14px;
  color: #757575;
  box-sizing: border-box;
}

.group-search-input-field:focus {
  outline: none;
  border-color: #FFDD44;
}

.group-search-input-field::placeholder {
  color: #757575;
}

.group-search-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #2A2828;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.group-search-btn:hover {
  background: #FFDD44;
}

/* 사용자 그룹 목록 */
.user-groups-section {
  margin-bottom: 20px;
}

.user-groups-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  padding: 8px;
  min-height: 150px;
}

.user-group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #E9ECEF;
  background: #FFFFFF;
  margin-bottom: 6px;
  border-radius: 4px;
}

.user-group-item:last-child {
  border-bottom: none;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 9px;
  font-weight: 700;
  color: #1C0F0F;
  line-height: 11px;
  margin-bottom: 1px;
}

.group-members {
  font-size: 8px;
  color: #666666;
  line-height: 10px;
}

.add-group-btn {
  height: 20px;
  padding: 0 8px;
  background: #FFE364;
  border: none;
  border-radius: 3px;
  color: #2A2828;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.add-group-btn:disabled {
  background: #DDDDDD;
  cursor: not-allowed;
}

/* 개별 사용자 목록 */
.individual-users-section {
  margin-bottom: 20px;
}

.individual-users-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  padding: 8px;
  min-height: 150px;
}

.individual-user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #E9ECEF;
  background: #FFFFFF;
  gap: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.individual-user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  background: none;
}

.user-info {
  flex: 1;
  text-align: left;
}

.user-name {
  font-size: 10px;
  font-weight: 700;
  color: #1C0F0F;
  line-height: 12px;
  margin-bottom: 2px;
  text-align: left;
}

.user-email {
  font-size: 10px;
  color: #666666;
  line-height: 12px;
}

.add-user-btn {
  height: 24px;
  padding: 0 12px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #2A2828;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.add-user-btn:disabled {
  background: #DDDDDD;
  cursor: not-allowed;
}


.selected-count {
  font-size: 14px;
  color: #666666;
  margin-bottom: 12px;
}

.selected-users-container {
  max-height: 200px;
  overflow-x: hidden;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  padding: 8px;
  margin-bottom: 12px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #FFFFFF;
  gap: 12px;
  border-radius: 4px;
  border: 1px solid #E9ECEF;
  flex-shrink: 0;
  min-width: 200px;
}


.user-email {
  font-size: 9px;
  color: #999999;
  line-height: 11px;
  margin-top: 2px;
}

.remove-user-btn {
  background: none;
  border: none;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.clear-all-btn {
  width: 100%;
  height: 32px;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  color: #666666;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #DDDDDD;
}

/* 액션 섹션 */
.action-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.cancel-btn {
  height: 42px;
  padding: 0 20px;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  color: #666666;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #DDDDDD;
}

.add-users-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #2A2828;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.add-users-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}
</style>
