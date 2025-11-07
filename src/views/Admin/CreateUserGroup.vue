<template>
  <div class="modal-overlay" @click.self="goBack">
    <div class="modal-container">
      <!-- 헤더 -->
      <header class="modal-header">
        <h2>사용자 그룹 생성</h2>
        <p>새로운 사용자 그룹을 생성하고 멤버를 추가하세요.</p>
      </header>

      <!-- 그룹명 입력 -->
      <div class="group-name-section">
        <label class="group-name-label">사용자 그룹명</label>
        <input 
          type="text" 
          class="group-name-input" 
          placeholder="그룹명을 입력하세요"
          v-model="newGroupName"
        />
      </div>

      <!-- 본문 -->
      <div class="modal-body">
        <!-- 왼쪽: 사용자 목록 -->
        <div class="section add-section">
          <h3>사용자 목록</h3>
          <p class="hint-text">그룹에 추가할 사용자를 검색하거나 목록에서 선택하세요.</p>

          <div class="search-wrapper">
            <input
              v-model="userSearchQuery"
              lang="en"
              @keyup.enter="searchUsers"
              @input="handleSearchInput"
              placeholder="이메일로 검색"
              class="search-input"
            />
            <button @click="searchUsers" class="search-btn">검색</button>
          </div>

          <div class="user-list">
            <template v-if="availableUsers.length > 0">
              <div
                v-for="user in availableUsers"
                :key="user.userId"
                class="user-row"
              >
                <label>
                  <input
                    type="checkbox"
                    v-model="selectedUserIds"
                    :value="user.userId"
                    class="checkbox"
                    :disabled="selectedUsers.find(u => u.userId === user.userId)"
                  />
                  <img :src="user.profileImageUrl || userDefaultIcon" alt="user" class="user-avatar" @error="handleAvatarError($event)" />
                  <span class="user-text">
                    <span class="user-name">{{ user.userName }}</span>
                    <span class="user-email">({{ user.userEmail }})</span>
                  </span>
                </label>
              </div>
            </template>
            <div v-else class="empty-msg">사용자가 없습니다.</div>
          </div>

          <button class="add-btn" @click="addSelectedUsers">＋ 멤버 추가</button>
        </div>

        <!-- 오른쪽: 선택된 멤버 -->
        <div class="section list-section">
          <h3>선택된 멤버</h3>
          <p class="hint-text">그룹에 추가될 멤버 목록입니다.</p>

          <div class="subscription-list">
            <template v-if="selectedUsers.length > 0">
              <div
                v-for="user in selectedUsers"
                :key="user.userId"
                class="subscriber-item"
              >
                <div class="subscriber-info">
                  <img :src="user.profileImageUrl || userDefaultIcon" alt="user" class="user-avatar-small" @error="handleAvatarError($event)" />
                  <span class="subscriber-name">{{ user.userName }}</span>
                  <span class="user-email-small">({{ user.userEmail }})</span>
                </div>
                <img
                  src="@/assets/icons/calendar/trash-can.svg"
                  alt="삭제"
                  class="trash-icon"
                  @click="removeUser(user.userId)"
                />
              </div>
            </template>
            <div v-else class="empty-list">선택된 멤버가 없습니다.</div>
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <footer class="modal-footer">
        <button class="cancel-btn" @click="goBack">취소</button>
        <button class="create-btn" @click="createGroup">그룹 생성</button>
      </footer>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import { showSnackbar } from '@/services/snackbar.js';
import userDefaultIcon from '@/assets/icons/user/user_default_icon.svg';

export default {
  name: 'CreateUserGroup',
  data() {
    return {
      newGroupName: '',
      userSearchQuery: '',
      availableUsers: [],
      selectedUsers: [],
      selectedUserIds: [],
      userDefaultIcon
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  mounted() {
    // 초기 로드 시 사용자 목록을 자동으로 로드
    this.loadAvailableUsers();
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    
    // 사용 가능한 사용자 목록 로드 (그룹에 속하지 않은 참여자 조회)
    async loadAvailableUsers() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`${baseURL}/workspace-service/workspace/participants/not-in-groups/search`, {
          workspaceId: this.workspaceStore.getCurrentWorkspaceId,
          searchKeyword: ""
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
          console.log('그룹에 속하지 않은 참여자 목록:', this.availableUsers);
        }
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        this.availableUsers = [];
      }
    },
    
    // 검색어 입력 핸들러
    handleSearchInput() {
      // 검색어가 비어있으면 전체 목록 로드
      if (!this.userSearchQuery.trim()) {
        this.loadAvailableUsers();
      }
    },
    
    // 사용자 검색 (POST 방식)
    async searchUsers() {
      if (!this.userSearchQuery.trim()) {
        this.loadAvailableUsers();
        return;
      }
      
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`${baseURL}/workspace-service/workspace/participants/not-in-groups/search`, {
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
      }
    },
    
    // 선택된 사용자들 추가
    addSelectedUsers() {
      if (this.selectedUserIds.length === 0) {
        alert('멤버를 선택하세요.');
        return;
      }
      
      this.selectedUserIds.forEach(userId => {
        const user = this.availableUsers.find(u => u.userId === userId);
        if (user && !this.selectedUsers.find(u => u.userId === user.userId)) {
          this.selectedUsers.push({
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            profileImageUrl: user.profileImageUrl
          });
        }
      });
      
      // 체크박스 초기화
      this.selectedUserIds = [];
    },
    
    // 사용자 제거
    removeUser(userId) {
      this.selectedUsers = this.selectedUsers.filter(user => user.userId !== userId);
    },
    
    // 그룹 생성
    async createGroup() {
      if (!this.newGroupName.trim()) {
        showSnackbar('그룹명을 입력해주세요.', { color: 'error' });
        return;
      }
      
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.post(`${baseURL}/workspace-service/groups`, {
          workspaceId: this.workspaceStore.getCurrentWorkspaceId,
          userGroupName: this.newGroupName,
          userIdList: this.selectedUsers.map(user => user.userId)
        }, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.statusCode === 201) {
          showSnackbar('그룹이 성공적으로 생성되었습니다.', { color: 'success' });
          setTimeout(() => {
            this.$router.push('/admin');
          }, 100);
        } else {
          showSnackbar('그룹 생성에 실패했습니다.', { color: 'error' });
        }
      } catch (error) {
        console.error('그룹 생성 실패:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          showSnackbar(error.response.data.statusMessage, { color: 'error' });
        } else {
          showSnackbar('그룹 생성에 실패했습니다.', { color: 'error' });
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
/* ===== Modal Overlay ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(3px);
}

/* ===== Modal Container ===== */
.modal-container {
  width: 900px;
  max-width: 95%;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeIn 0.25s ease-out;
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== Header ===== */
.modal-header {
  background: #fff8e1;
  padding: 20px 24px;
  border-bottom: 1px solid #f2e3a5;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.modal-header p {
  margin-top: 6px;
  font-size: 13px;
  color: #777;
}

/* ===== Group Name Section ===== */
.group-name-section {
  padding: 20px 24px;
  background: #fffdf9;
  border-bottom: 1px solid #f2e3a5;
}

.group-name-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin-bottom: 8px;
}

.group-name-input {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.group-name-input:focus {
  border-color: #ffcd4d;
  outline: none;
}

/* ===== Body ===== */
.modal-body {
  display: flex;
  gap: 20px;
  padding: 20px 24px;
  background: #fffdf9;
  flex: 1;
  overflow: hidden;
  min-height: 400px;
  max-height: calc(90vh - 200px);
}

.section {
  flex: 1;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.add-section h3,
.list-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #444;
  margin-bottom: 6px;
}

.hint-text {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
}

/* ===== Scroll Lists ===== */
.user-list,
.subscription-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  padding: 8px;
  background: #fffefc;
  scrollbar-width: thin;
  scrollbar-color: #ffde7d transparent;
  min-height: 200px;
}

.user-list::-webkit-scrollbar,
.subscription-list::-webkit-scrollbar {
  width: 6px;
}
.user-list::-webkit-scrollbar-thumb,
.subscription-list::-webkit-scrollbar-thumb {
  background: #ffd86c;
  border-radius: 4px;
}
.user-list::-webkit-scrollbar-track,
.subscription-list::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== Search ===== */
.search-wrapper {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.search-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #ffcd4d;
  outline: none;
}

.search-btn {
  background: #ffcd4d;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.search-btn:hover {
  background: #ffd86c;
}

/* ===== User Row ===== */
.user-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-row:hover {
  background: #fff8e6;
}

.user-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: 100%;
}

.checkbox {
  accent-color: #ffcd4d;
  cursor: pointer;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-text {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  color: #2a2828;
  font-weight: 500;
  font-size: 14px;
}

.user-email {
  color: #999;
  font-size: 13px;
}

.empty-msg {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* ===== Subscription List ===== */
.subscriber-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px solid #f4f4f4;
}

.subscriber-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.user-avatar-small {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.subscriber-name {
  font-size: 14px;
  color: #2a2828;
  font-weight: 500;
}

.user-email-small {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

.trash-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.trash-icon:hover {
  opacity: 1;
}

.empty-list {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* ===== Buttons ===== */
.add-btn {
  margin-top: 12px;
  background: #ffcd4d;
  border: none;
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #ffd86c;
}

/* ===== Footer ===== */
.modal-footer {
  padding: 12px 20px;
  text-align: right;
  background: #fafafa;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.create-btn {
  background: #ffcd4d;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.create-btn:hover {
  background: #ffd86c;
}
</style>