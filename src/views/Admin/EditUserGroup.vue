<template>
  <div class="edit-group-page">
    <!-- 메인 컨텐츠 -->
    <div class="main-content">
      <!-- 헤더 섹션 -->
      <div class="header-section">
        <h1 class="page-title">사용자 그룹</h1>
        <p class="page-subtitle">사용자 그룹의 정보를 수정하세요.</p>
      </div>

      <!-- 그룹명 입력 및 사용자 검색 섹션 -->
      <div class="form-section">
        <div class="form-container-left">
          <label class="section-label">사용자 그룹명</label>
          <input 
            type="text" 
            class="group-name-input" 
            :placeholder="originalGroupName || '그룹명을 입력하세요'"
            v-model="groupName"
          />
          
          <label class="section-label">사용자 검색</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              class="user-search-input" 
              placeholder="사용자 이름으로 검색"
              v-model="userSearchQuery"
              @keyup.enter="searchUsers"
            />
            <button class="search-btn" @click="searchUsers">검색</button>
          </div>
        </div>
      </div>

      <!-- 사용자 목록과 선택된 멤버 섹션 -->
      <div class="user-selection-section">
        <div class="user-lists-container">
          <!-- 사용자 목록 -->
          <div class="user-list-section">
            <div class="form-container">
              <label class="section-label">사용자 목록</label>
              <div class="user-list-container">
                <div 
                  v-for="user in availableUsers" 
                  :key="user.userId" 
                  class="user-item"
                >
                  <img :src="user.profileImageUrl || userDefaultIcon" alt="user" class="user-avatar" @error="handleAvatarError($event)" />
                  <div class="user-info">
                    <div class="user-name">{{ user.userName }}</div>
                    <div class="user-email">{{ user.userEmail }}</div>
                  </div>
                  <button 
                    class="add-user-btn" 
                    @click="addUser(user)"
                    :disabled="selectedUsers.find(u => u.userId === user.userId)"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <!-- 페이지네이션 -->
              <div class="pagination">
                <button class="page-btn prev-btn">← 이전</button>
                <button class="page-btn active">1</button>
                <button class="page-btn">2</button>
                <button class="page-btn">3</button>
                <span class="page-ellipsis">...</span>
                <button class="page-btn">10</button>
                <button class="page-btn next-btn">다음 →</button>
              </div>
              
              <!-- 더보기 버튼 -->
              <button class="more-btn">더보기</button>
            </div>
          </div>
          
          <!-- 화살표 -->
          <div class="arrow-container">
            <div class="arrow">→</div>
          </div>
          
          <!-- 선택된 멤버 -->
          <div class="selected-members-section">
            <div class="form-container">
              <label class="section-label">선택된 멤버</label>
              <div class="selected-members-container">
                <div 
                  v-for="user in selectedUsers" 
                  :key="user.userId" 
                  class="selected-user-item"
                >
                  <img :src="user.profileImageUrl || userDefaultIcon" alt="user" class="user-avatar" @error="handleAvatarError($event)" />
                  <div class="user-info">
                    <div class="user-name">{{ user.userName }}</div>
                    <div class="user-email">{{ user.userEmail }}</div>
                  </div>
                  <button class="remove-user-btn" @click="removeUser(user.userId)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 액션 버튼들 -->
      <div class="action-section">
        <div class="action-buttons">
          <button class="cancel-btn" @click="goBack">취소</button>
          <button class="edit-btn" @click="updateGroup">그룹 수정</button>
        </div>
      </div>

      <!-- 안내 메시지 -->
      <div class="info-section">
        <div class="info-text">• 그룹 생성 후 멤버를 추가하거나 제거할 수 있습니다</div>
        <div class="info-text">• 그룹명은 2-10자 사이로 입력해주세요</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import userDefaultIcon from '@/assets/icons/user/user_default_icon.svg';

export default {
  name: 'EditUserGroup',
  data() {
    return {
      groupId: null,
      groupName: '',
      originalGroupName: '',
      userSearchQuery: '',
      availableUsers: [],
      selectedUsers: [],
      userDefaultIcon
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  async mounted() {
    this.groupId = this.$route.params.groupId;
    // 그룹 정보를 먼저 로드한 후 사용자 목록 로드
    await this.loadGroupInfo();
    await this.loadAvailableUsers();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    
    // 기존 그룹 정보 로드
    async loadGroupInfo() {
      try {
        console.log('그룹 정보 로드 시작, groupId:', this.groupId);
        
        const response = await axios.get(`http://localhost:8080/workspace-service/groups/${this.groupId}`, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        console.log('그룹 정보 API 응답:', response.data);
        
        if (response.data.statusCode === 200) {
          const groupInfo = response.data.result;
          console.log('그룹 정보 result:', groupInfo);
          
          this.groupName = groupInfo.groupName;
          this.originalGroupName = groupInfo.groupName; // 원본 그룹명 저장
          
          // 기존 멤버들을 selectedUsers에 추가
          if (groupInfo.members && groupInfo.members.content) {
            this.selectedUsers = groupInfo.members.content.map(member => ({
              userId: member.userId,
              userName: member.userName,
              userEmail: member.userEmail,
              profileImageUrl: member.profileImageUrl
            }));
            console.log('기존 멤버들:', this.selectedUsers);
          } else {
            this.selectedUsers = [];
          }
          
          console.log('그룹명:', this.groupName);
          console.log('원본 그룹명:', this.originalGroupName);
        }
      } catch (error) {
        console.error('그룹 정보 로드 실패:', error);
        console.error('에러 상세:', error.response?.data);
        alert('그룹 정보를 불러오는데 실패했습니다.');
      }
    },
    
    // 사용 가능한 사용자 목록 로드 (그룹에 속하지 않은 참여자 조회)
    async loadAvailableUsers() {
      try {
        const response = await axios.post('http://localhost:8080/workspace-service/workspace/participants/not-in-groups/search', {
          workspaceId: this.workspaceStore.getCurrentWorkspaceId,
          searchKeyword: ""
        }, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.statusCode === 200) {
          const allUsers = response.data.result.userInfoList || [];
          
          // 이미 선택된 사용자들을 제외
          const selectedUserIds = this.selectedUsers.map(user => user.userId);
          this.availableUsers = allUsers.filter(user => !selectedUserIds.includes(user.userId)).map(user => ({
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            profileImageUrl: user.profileImageUrl
          }));
          
          console.log('전체 사용자 목록:', allUsers);
          console.log('선택된 사용자 ID들:', selectedUserIds);
          console.log('사용 가능한 사용자 목록:', this.availableUsers);
        }
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        this.availableUsers = [];
      }
    },
    
    // 사용자 검색 (POST 방식)
    async searchUsers() {
      if (!this.userSearchQuery.trim()) {
        this.loadAvailableUsers();
        return;
      }
      
      try {
        const response = await axios.post('http://localhost:8080/workspace-service/workspace/participants/not-in-groups/search', {
          workspaceId: this.workspaceStore.getCurrentWorkspaceId,
          searchKeyword: this.userSearchQuery.trim()
        }, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.statusCode === 200) {
          this.availableUsers = (response.data.result.userInfoList || []).map(user => ({
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            profileImageUrl: user.profileImageUrl
          }));
          console.log('검색 결과:', this.availableUsers);
        }
      } catch (error) {
        console.error('사용자 검색 실패:', error);
        alert('사용자 검색에 실패했습니다.');
      }
    },
    
    // 사용자 추가
    addUser(user) {
      if (!this.selectedUsers.find(u => u.userId === user.userId)) {
        this.selectedUsers.push({
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          profileImageUrl: user.profileImageUrl
        });
        // 사용 가능한 사용자 목록에서 제거
        this.availableUsers = this.availableUsers.filter(u => u.userId !== user.userId);
      }
    },
    
    // 사용자 제거
    removeUser(userId) {
      const removedUser = this.selectedUsers.find(user => user.userId === userId);
      this.selectedUsers = this.selectedUsers.filter(user => user.userId !== userId);
      
      // 제거된 사용자를 사용 가능한 사용자 목록에 다시 추가
      if (removedUser) {
        this.availableUsers.push(removedUser);
      }
    },
    
    // 그룹 수정
    async updateGroup() {
      if (!this.groupName.trim()) {
        alert('그룹명을 입력해주세요.');
        return;
      }
      
      try {
        const response = await axios.patch('http://localhost:8080/workspace-service/groups', {
          userGroupId: this.groupId,
          userGroupName: this.groupName,
          userIdList: this.selectedUsers.map(user => user.userId)
        }, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.statusCode === 200) {
          alert('그룹이 성공적으로 수정되었습니다.');
          this.$router.push('/admin');
        }
      } catch (error) {
        console.error('그룹 수정 실패:', error);
        console.error('에러 상세:', error.response?.data);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          alert(error.response.data.statusMessage);
        } else {
          alert('그룹 수정에 실패했습니다.');
        }
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
.edit-group-page {
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
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0 0 8px 0;
  text-align: left;
}

.page-subtitle {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin: 0;
  text-align: left;
}

/* 폼 섹션 */
.form-section {
  margin-bottom: 24px;
}

.form-container {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: 100%;
}

.form-container .section-label:not(:first-child) {
  margin-top: 20px;
}

.form-container-left {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: fit-content;
  max-width: 600px;
  text-align: left;
}

.form-container-left .section-label:not(:first-child) {
  margin-top: 20px;
}

.section-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #1C0F0F;
  margin-bottom: 12px;
  text-align: left;
}

.group-name-input {
  width: 400px;
  height: 42px;
  padding: 0 17px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #F5F5F5;
  font-size: 14px;
  color: #757575;
  box-sizing: border-box;
}

.group-name-input:focus {
  outline: none;
  border-color: #FFDD44;
  background: #FFFFFF;
}

/* 검색 섹션 */
.search-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-search-input {
  width: 300px;
  height: 42px;
  padding: 0 17px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #F5F5F5;
  font-size: 14px;
  color: #757575;
  box-sizing: border-box;
  text-align: left;
}

.search-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover {
  background: #FFDD44;
}

.user-search-input:focus {
  outline: none;
  border-color: #FFDD44;
  background: #FFFFFF;
}

/* 사용자 선택 섹션 */
.user-selection-section {
  margin-bottom: 24px;
}

/* 사용자 목록과 선택된 멤버 컨테이너 */
.user-lists-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
  margin: 0;
}

.user-list-section {
  flex: 1;
  min-width: 0;
}

.user-list-section .form-container {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: 100%;
}

.selected-members-section {
  flex: 1;
  min-width: 0;
}

.selected-members-section .form-container {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: 100%;
}

.arrow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 60px;
  padding: 0 20px;
}

.arrow {
  font-size: 24px;
  font-weight: bold;
  color: #2A2828;
}

/* 사용자 목록 */
.user-list-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  min-height: 400px;
  padding: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #E9ECEF;
  background: #FFFFFF;
  gap: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  background: none;
}

.user-info {
  flex: 1;
  margin-left: 12px;
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
  text-align: left;
}

.add-user-btn {
  width: 24px;
  height: 24px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-user-btn:disabled {
  background: #DDDDDD;
  cursor: not-allowed;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 15px 0;
  padding: 10px;
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
}

.page-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #666666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.page-btn.active {
  color: #1C0F0F;
  font-weight: 700;
}

.page-btn:hover {
  background: #DDDDDD;
}

.page-ellipsis {
  font-size: 12px;
  color: #666666;
  padding: 4px;
}

/* 더보기 버튼 */
.more-btn {
  width: 100%;
  height: 42px;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 10px;
}

.more-btn:hover {
  background: #DDDDDD;
}

/* 선택된 멤버 */
.selected-members-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  min-height: 400px;
  padding: 8px;
}

.selected-user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #E9ECEF;
  background: #FFFFFF;
  gap: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.selected-user-item:last-child {
  border-bottom: none;
}

.remove-user-btn {
  width: 20px;
  height: 20px;
  background: #FF0000;
  border: none;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(180deg);
}

/* 안내 메시지 */
.info-section {
  margin: 30px 0;
  width: 100%;
}

.info-text {
  font-size: 12px;
  color: #999999;
  margin: 5px 0;
  line-height: 14px;
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

.edit-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}
</style>
