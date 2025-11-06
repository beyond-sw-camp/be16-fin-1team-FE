<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <!-- 헤더 -->
      <header class="modal-header">
        <h2>회원 삭제</h2>
        <p>워크스페이스에서 회원을 삭제하세요.</p>
      </header>

      <!-- 본문 -->
      <div class="modal-body">
        <!-- 왼쪽: 검색 결과 -->
        <div class="section add-section">
          <h3>사용자 검색</h3>
          <p class="hint-text">이메일로 사용자를 검색하고 삭제할 수 있습니다.</p>

          <div class="search-wrapper">
            <input
              v-model="emailQuery"
              type="email"
              lang="en"
              @keyup.enter="searchByEmail"
              placeholder="이메일 주소를 입력하세요"
              class="search-input"
            />
            <button @click="searchByEmail" class="search-btn">검색</button>
          </div>

          <div class="user-list">
            <template v-if="results.length > 0">
              <div
                v-for="user in results"
                :key="user.userId"
                class="user-row"
              >
                <label>
                  <input
                    type="checkbox"
                    v-model="selectedUserIds"
                    :value="user.userId"
                    class="checkbox"
                    :disabled="selectedUsers.some(u => u.userId === user.userId)"
                  />
                  <img :src="user.profileImageUrl || userDefaultIcon" alt="user" class="user-avatar" @error="handleAvatarError($event)" />
                  <span class="user-text">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-email">({{ user.email }})</span>
                  </span>
                </label>
              </div>
            </template>
            <div v-else class="empty-msg">검색 결과가 없습니다.</div>
          </div>

          <button class="add-btn" @click="addSelectedUsers">＋ 삭제 목록 추가</button>
        </div>

        <!-- 오른쪽: 선택한 사용자 -->
        <div class="section list-section">
          <h3>삭제할 사용자</h3>
          <p class="hint-text">워크스페이스에서 삭제될 사용자 목록입니다.</p>

          <div class="subscription-list">
            <template v-if="selectedUsers.length > 0">
              <div
                v-for="user in selectedUsers"
                :key="user.userId"
                class="subscriber-item"
              >
                <div class="subscriber-info">
                  <img :src="user.profileImageUrl || userDefaultIcon" alt="user" class="user-avatar-small" @error="handleAvatarError($event)" />
                  <span class="subscriber-name">{{ user.name }}</span>
                  <span class="user-email-small">({{ user.email }})</span>
                </div>
                <img
                  src="@/assets/icons/calendar/trash-can.svg"
                  alt="삭제"
                  class="trash-icon"
                  @click="removeSelected(user.userId)"
                />
              </div>
            </template>
            <div v-else class="empty-list">선택된 사용자가 없습니다.</div>
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <footer class="modal-footer">
        <button class="cancel-btn" @click="handleClose">취소</button>
        <button class="delete-btn" @click="openDeleteConfirmModal" :disabled="deleting">삭제하기</button>
      </footer>
    </div>
    
    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :show="showDeleteConfirmModal"
      title="회원 삭제"
      :message="deleteConfirmMessage"
      warning-text="이 작업은 되돌릴 수 없습니다."
      confirm-button-text="삭제"
      loading-text="삭제 중..."
      :loading="deleting"
      @close="closeDeleteConfirmModal"
      @confirm="confirmDeleteMembers"
    />
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import { showSnackbar } from '@/services/snackbar.js';
import ConfirmModal from '@/components/modal/ConfirmModal.vue';
import userDefaultIcon from '@/assets/icons/user/user_default_icon.svg';

export default {
  name: 'DeleteMembers',
  emits: ['close', 'deleted'],
  components: {
    ConfirmModal
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  data() {
    return {
      emailQuery: '',
      results: [],
      selectedUsers: [],
      selectedUserIds: [],
      loading: false,
      deleting: false,
      userDefaultIcon,
      showDeleteConfirmModal: false,
      deleteConfirmMessage: ''
    };
  },
  methods: {
    handleClose() {
      this.$emit('close');
    },
    
    goBack() {
      this.handleClose();
    },
    
    async searchByEmail() {
      const keyword = (this.emailQuery || '').trim();
      if (!keyword) {
        this.results = [];
        return;
      }
      try {
        this.loading = true;
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const lsUserIdRaw = localStorage.getItem('id') || '';
        const lsUserEmailRaw = localStorage.getItem('email') || localStorage.getItem('userEmail') || '';

        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || localStorage.getItem('selectedWorkspaceId') || 'ws_1';
        
        const response = await axios.post(
          'http://localhost:8080/workspace-service/workspace/participants/search',
          { 
            workspaceId: workspaceId,
            searchKeyword: keyword 
          },
          {
            headers: {
              'X-User-Id': lsUserIdRaw || 'user123',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }
        );

        const normalizeUuid = (v) => String(v || '').trim().toLowerCase();
        const normalizeEmail = (v) => String(v || '').trim().toLowerCase();

        if (response?.data?.statusCode === 200) {
          const list = response.data.result?.userInfoList || [];
          const requesterId = normalizeUuid(lsUserIdRaw);

          const filtered = list.filter(u => {
            const uid = normalizeUuid(u.userId);
            const notSelfById = requesterId ? uid !== requesterId : true;
            return notSelfById;
          });

          this.results = filtered.map(u => ({
            userId: u.userId,
            name: u.userName,
            email: u.userEmail || u.email || '',
            profileImageUrl: u.profileImageUrl || '',
          }));
        } else {
          this.results = [];
        }
      } catch (e) {
        console.error('회원 검색 실패:', e);
        this.results = [];
        showSnackbar(e?.response?.data?.statusMessage || '회원 검색 중 오류가 발생했습니다.', { color: 'error' });
      } finally {
        this.loading = false;
      }
    },
    
    addSelected(user) {
      if (!this.selectedUsers.some(u => u.userId === user.userId)) {
        this.selectedUsers.push(user);
      }
      this.results = this.results.filter(u => u.userId !== user.userId);
    },
    
    addSelectedUsers() {
      if (this.selectedUserIds.length === 0) {
        showSnackbar('사용자를 선택하세요.', { color: 'error' });
        return;
      }
      this.selectedUserIds.forEach(userId => {
        const user = this.results.find(u => u.userId === userId);
        if (user && !this.selectedUsers.some(u => u.userId === user.userId)) {
          this.selectedUsers.push(user);
          this.results = this.results.filter(u => u.userId !== user.userId);
        }
      });
      this.selectedUserIds = [];
    },
    
    removeSelected(userId) {
      const removed = this.selectedUsers.find(u => u.userId === userId);
      this.selectedUsers = this.selectedUsers.filter(u => u.userId !== userId);
      if (removed && !this.results.some(u => u.userId === removed.userId)) {
        this.results = [removed, ...this.results];
      }
    },
    
    handleAvatarError(event) {
      event.target.src = this.userDefaultIcon;
    },
    
    openDeleteConfirmModal() {
      if (this.selectedUsers.length === 0) {
        showSnackbar('삭제할 사용자를 선택하세요.', { color: 'error' });
        return;
      }

      const userIdList = this.selectedUsers
        .map(u => u.userId)
        .filter(Boolean);

      if (userIdList.length === 0) {
        showSnackbar('선택된 사용자에 유효한 사용자 ID가 없습니다. 검색을 통해 다시 선택해주세요.', { color: 'error' });
        return;
      }

      this.deleteConfirmMessage = `<strong>${this.selectedUsers.length}명</strong>의 회원을 삭제하시겠습니까?`;
      this.showDeleteConfirmModal = true;
    },
    
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false;
    },
    
    async confirmDeleteMembers() {
      try {
        this.deleting = true;
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const requesterId = localStorage.getItem('id') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || localStorage.getItem('selectedWorkspaceId') || 'ws_1';
        
        const userIdList = this.selectedUsers
          .map(u => u.userId)
          .filter(Boolean);
        
        const deleteUrl = `http://localhost:8080/workspace-service/workspace/${workspaceId}/participants`;
        
        const requestData = {
          userIdList: userIdList
        };
        
        const response = await axios.delete(deleteUrl, {
          headers: {
            'X-User-Id': requesterId,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          data: requestData
        });

        if (response?.data?.statusCode === 200) {
          showSnackbar('선택한 회원들이 성공적으로 삭제되었습니다.', { color: 'success' });
          this.closeDeleteConfirmModal();
          setTimeout(() => {
            this.$emit('deleted');
          }, 100);
        } else {
          showSnackbar(response?.data?.statusMessage || '회원 삭제에 실패했습니다.', { color: 'error' });
          this.deleting = false;
        }
      } catch (e) {
        console.error('회원 삭제 실패:', e);
        showSnackbar(e?.response?.data?.statusMessage || '회원 삭제 중 오류가 발생했습니다.', { color: 'error' });
        this.deleting = false;
      }
    }
  }
}
</script>

<style scoped>
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
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 32px 40px 24px;
  border-bottom: 1px solid #E5E5E5;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 800;
  color: #1C0F0F;
  margin: 0 0 8px 0;
}

.modal-header p {
  font-size: 14px;
  font-weight: 400;
  color: #666666;
  margin: 0;
}

.modal-body {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  display: flex;
  gap: 24px;
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1C0F0F;
  margin: 0 0 8px 0;
}

.hint-text {
  font-size: 13px;
  font-weight: 400;
  color: #666666;
  margin: 0 0 20px 0;
}

.search-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 400;
  color: #1C0F0F;
  background: #FFFFFF;
}

.search-input::placeholder {
  color: #999999;
}

.search-input:focus {
  outline: none;
  border-color: #FFDD44;
}

.search-btn {
  height: 40px;
  padding: 0 20px;
  background: #FFDD44;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1C0F0F;
  cursor: pointer;
  transition: background 0.2s;
}

.search-btn:hover {
  background: #FFD700;
}

.user-list {
  flex: 1;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  background: #FAFAFA;
}

.user-row {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  transition: all 0.2s;
}

.user-row:hover {
  background: #F9F9F9;
  border-color: #DDDDDD;
}

.user-row label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  width: 100%;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #FFDD44;
}

.checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-text {
  flex: 1;
  font-size: 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.user-name {
  font-weight: 700;
  color: #1C0F0F;
}

.user-email {
  font-weight: 400;
  color: #666666;
}

.empty-msg {
  text-align: center;
  padding: 40px 20px;
  color: #999999;
  font-size: 14px;
}

.add-btn {
  height: 40px;
  padding: 0 20px;
  background: #FFDD44;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1C0F0F;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #FFD700;
}

.subscription-list {
  flex: 1;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  padding: 12px;
  background: #FAFAFA;
}

.subscriber-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  transition: all 0.2s;
}

.subscriber-item:hover {
  background: #F9F9F9;
  border-color: #DDDDDD;
}

.subscriber-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.subscriber-name {
  font-size: 14px;
  font-weight: 700;
  color: #1C0F0F;
}

.user-email-small {
  font-size: 13px;
  font-weight: 400;
  color: #666666;
}

.trash-icon {
  width: 18px;
  height: 18px;
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
  color: #999999;
  font-size: 14px;
}

.modal-footer {
  padding: 24px 40px 32px;
  border-top: 1px solid #E5E5E5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  height: 44px;
  padding: 0 24px;
  background: #F5F5F5;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #E5E5E5;
}

.delete-btn {
  height: 44px;
  padding: 0 24px;
  background: #FF6B6B;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover:not(:disabled) {
  background: #FF5252;
}

.delete-btn:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>

