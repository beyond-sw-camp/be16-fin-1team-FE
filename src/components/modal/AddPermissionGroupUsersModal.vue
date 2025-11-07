<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <!-- 헤더 -->
      <header class="modal-header">
        <h2>사용자 편집</h2>
        <p>권한그룹에 사용자를 추가/제거 하세요</p>
      </header>

      <!-- 본문 -->
      <div class="modal-body">
        <!-- 사용자 그룹 섹션 -->
        <div class="section group-section">
          <h3>사용자 그룹</h3>
          <p class="hint-text">그룹을 선택하여 멤버를 추가할 수 있습니다.</p>
          
          <div class="search-wrapper">
            <input
              v-model="groupSearchQuery"
              @keyup.enter="searchUserGroups"
              placeholder="그룹명을 입력하세요"
              class="search-input"
            />
            <button @click="searchUserGroups" class="search-btn">검색</button>
          </div>

          <div class="user-list">
            <template v-if="userGroups.length > 0">
              <div
                v-for="group in userGroups"
                :key="group.groupId"
                class="user-row"
              >
                <div class="group-info">
                  <div class="group-name">{{ group.groupName }}</div>
                  <div class="group-members">({{ group.memberCount }}명)</div>
                </div>
                <button
                  class="add-btn-small"
                  @click="addGroup(group)"
                  :disabled="selectedGroups.find(g => g.groupId === group.groupId)"
                >
                  추가
                </button>
              </div>
            </template>
            <div v-else class="empty-msg">검색 결과가 없습니다.</div>
          </div>
        </div>

        <!-- 새 참여자 추가 섹션 -->
        <div class="section add-participant-section">
          <h3>새 참여자 추가</h3>
          
          <div class="search-wrapper">
            <input
              v-model="individualSearchQuery"
              @keyup.enter="searchIndividualUsers"
              placeholder="이메일로 검색"
              class="search-input"
            />
            <button @click="searchIndividualUsers" class="search-btn">검색</button>
          </div>

          <div class="user-list">
            <template v-if="individualUsers.length > 0">
              <div
                v-for="user in individualUsers"
                :key="user.userId"
                class="user-row"
              >
                <div class="user-info-inline">
                  <span class="user-name">{{ user.userName }}</span>
                  <span class="user-email">({{ user.userEmail }})</span>
                </div>
                <button
                  class="add-btn-small"
                  @click="addIndividualUser(user)"
                  :disabled="selectedUsers.find(u => u.userId === user.userId)"
                >
                  추가
                </button>
              </div>
            </template>
            <div v-else class="empty-msg">검색 결과가 없습니다.</div>
          </div>
          
          <button class="add-participant-btn">＋ 참여자 추가</button>
        </div>

        <!-- 선택된 사용자 리스트 섹션 -->
        <div class="section selected-section">
          <h3>선택된 참여자 리스트</h3>
          <p class="hint-text">현재 선택된 참여자 목록입니다.</p>

          <div class="selected-list">
            <template v-if="selectedUsers.length > 0">
              <div
                v-for="user in selectedUsers"
                :key="user.userId"
                class="selected-item"
              >
                <div class="user-info-inline">
                  <span class="user-name">{{ user.userName }}</span>
                  <span v-if="user.userEmail" class="user-email">({{ user.userEmail }})</span>
                </div>
                <img
                  src="@/assets/icons/calendar/trash-can.svg"
                  alt="삭제"
                  class="trash-icon"
                  @click="removeUser(user.userId)"
                />
              </div>
            </template>
            <div v-else class="empty-list">현재 선택된 그룹이 없습니다.</div>
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <footer class="modal-footer">
        <button class="submit-btn" @click="addUsersToPermissionGroup">확인</button>
        <button class="cancel-btn" @click="close">닫기</button>
      </footer>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import { showSnackbar } from '@/services/snackbar.js';

export default {
  name: 'AddPermissionGroupUsersModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    permissionGroupId: {
      type: String,
      default: null
    }
  },
  emits: ['update:modelValue', 'users-updated'],
  data() {
    return {
      individualSearchQuery: '',
      groupSearchQuery: '',
      individualUsers: [],
      userGroups: [],
      selectedUsers: [],
      selectedGroups: [],
      adminUserId: null // 관리자 ID
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  watch: {
    modelValue(newVal) {
      if (newVal && this.permissionGroupId) {
        this.loadAdminUserId();
        this.loadUserGroups();
        this.loadIndividualUsers();
        this.loadExistingMembers();
      }
    }
  },
  methods: {
    close() {
      this.individualSearchQuery = '';
      this.groupSearchQuery = '';
      this.individualUsers = [];
      this.userGroups = [];
      this.selectedUsers = [];
      this.selectedGroups = [];
      this.adminUserId = null;
      this.$emit('update:modelValue', false);
    },
    
    // 관리자 ID 로드
    loadAdminUserId() {
      // 스토리지에서 관리자 ID 가져오기
      this.adminUserId = this.workspaceStore.getAdminUserId || localStorage.getItem('adminUserId');
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
        this.selectedUsers = [];
      }
    },
    
    // 사용자 그룹 목록 로드
    async loadUserGroups() {
      try {
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId;
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(
          `${baseURL}/workspace-service/groups?workspaceId=${workspaceId}`,
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
            groupId: group.groupId,
            groupName: group.groupName,
            memberCount: group.participantCount || 0,
            participants: [] // GET 요청 응답에는 participants가 없으므로 빈 배열
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
      // 검색어가 비어있으면 전체 목록 다시 로드
      if (!this.groupSearchQuery.trim()) {
        await this.loadUserGroups();
        return;
      }
      
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
          
          // 검색 API 응답 구조에 따라 파싱 (userGroupName 또는 groupName 사용)
          this.userGroups = groups.map(group => ({
            groupId: group.userGroupName || group.groupId,
            groupName: group.userGroupName || group.groupName,
            memberCount: group.userGroupParticipantsCount || group.participantCount || 0,
            participants: group.participants || []
          }));
        }
      } catch (error) {
        console.error('사용자 그룹 검색 실패:', error);
        this.userGroups = [];
      }
    },
    
    // 그룹 추가
    async addGroup(group) {
      if (this.selectedGroups.find(g => g.groupId === group.groupId)) {
        return; // 이미 선택된 그룹
      }
      
      try {
        // 그룹 상세 조회 API 호출
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(
          `${baseURL}/workspace-service/groups/${group.groupId}`,
          {
            headers: {
              'X-User-Id': localStorage.getItem('userId'),
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const groupDetail = response.data.result;
          const members = groupDetail.members?.content || [];
          
          // 그룹을 선택된 그룹 목록에 추가
          this.selectedGroups.push(group);
          
          // 그룹의 멤버들을 선택된 사용자에 추가 (관리자 제외)
          members.forEach(member => {
            // 관리자 ID와 일치하는 멤버는 제외
            if (this.adminUserId && member.userId === this.adminUserId) {
              return; // 관리자는 추가하지 않음
            }
            
            if (!this.selectedUsers.find(u => u.userId === member.userId)) {
              this.selectedUsers.push({
                userId: member.userId,
                userName: member.userName,
                userEmail: member.userEmail,
                profileImageUrl: member.profileImageUrl,
                groupName: group.groupName
              });
            }
          });
        }
      } catch (error) {
        console.error('그룹 상세 조회 실패:', error);
        alert('그룹 정보를 불러오는데 실패했습니다.');
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
        
        // 백엔드 API 호출
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
        
        showSnackbar('사용자 관리가 성공적으로 완료되었습니다.', { color: 'success' });
        this.$emit('users-updated');
        this.close();
      } catch (error) {
        console.error('사용자 관리 실패:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          showSnackbar(`사용자 관리 실패: ${error.response.data.statusMessage}`, { color: 'error' });
        } else {
          showSnackbar('사용자 관리에 실패했습니다.', { color: 'error' });
        }
      }
    }
  }
};
</script>

<style scoped>
/* ===== Overlay & Container ===== */
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

.modal-container {
  width: 1200px;
  max-width: 95vw;
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
  margin-bottom: 0;
  font-size: 13px;
  color: #777;
}

/* ===== Body ===== */
.modal-body {
  display: flex;
  gap: 20px;
  padding: 20px 24px;
  background: #fffdf9;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.section {
  flex: 1;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #444;
  margin-bottom: 10px;
}

.hint-text {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
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

/* ===== Scroll Lists ===== */
.user-list,
.selected-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  padding: 8px;
  background: #fffefc;
  scrollbar-width: thin;
  scrollbar-color: #ffde7d transparent;
  min-height: 150px;
}

.user-list::-webkit-scrollbar,
.selected-list::-webkit-scrollbar {
  width: 6px;
}
.user-list::-webkit-scrollbar-thumb,
.selected-list::-webkit-scrollbar-thumb {
  background: #ffd86c;
  border-radius: 4px;
}
.user-list::-webkit-scrollbar-track,
.selected-list::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== User Row ===== */
.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.user-row:hover {
  background: #fff8e6;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  color: #2a2828;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.user-email {
  color: #999;
  font-size: 12px;
}

.group-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-name {
  color: #2a2828;
  font-weight: 500;
  font-size: 14px;
}

.group-members {
  color: #999;
  font-size: 14px;
}

.add-btn-small {
  background: #ffcd4d;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.add-btn-small:hover:not(:disabled) {
  background: #ffd86c;
}

.add-btn-small:disabled {
  background: #ddd;
  cursor: not-allowed;
}

/* ===== Selected Item ===== */
.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #f4f4f4;
  margin-bottom: 4px;
}

.user-info-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.user-info-inline .user-name {
  color: #2a2828;
  font-weight: 500;
  font-size: 14px;
}

.user-info-inline .user-email {
  color: #999;
  font-size: 14px;
}

.trash-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.trash-icon:hover {
  opacity: 1;
}

.add-participant-btn {
  margin-top: 12px;
  background: #ffcd4d;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  color: #2a2828;
}

.add-participant-btn:hover {
  background: #ffd86c;
}

/* ===== Footer ===== */
.modal-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafafa;
  border-top: 1px solid #eee;
}

.cancel-btn {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.submit-btn {
  background: #ffcd4d;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #ffd86c;
}

.empty-msg,
.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>

