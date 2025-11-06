<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <!-- 헤더 -->
      <header class="modal-header">
        <h2>회원 초대</h2>
        <p>워크스페이스에 회원을 초대해보세요.</p>
      </header>

      <!-- 본문 -->
      <div class="modal-body">
        <!-- 왼쪽: 검색 결과 -->
        <div class="section add-section">
          <h3>사용자 검색</h3>
          <p class="hint-text">이메일로 사용자를 검색하고 초대할 수 있습니다.</p>

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
                :key="user.email"
                class="user-row"
              >
                <label>
                  <input
                    type="checkbox"
                    v-model="selectedUserIds"
                    :value="user.email"
                    class="checkbox"
                    :disabled="selectedUsers.some(u => u.email === user.email)"
                  />
                  <span class="user-text">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-email">({{ user.email }})</span>
                  </span>
                </label>
              </div>
            </template>
            <div v-else class="empty-msg">검색 결과가 없습니다.</div>
          </div>

          <button class="add-btn" @click="addSelectedUsers">＋ 초대 목록 추가</button>
        </div>

        <!-- 오른쪽: 선택한 사용자 -->
        <div class="section list-section">
          <h3>초대할 사용자</h3>
          <p class="hint-text">워크스페이스에 초대될 사용자 목록입니다.</p>

          <div class="subscription-list">
            <template v-if="selectedUsers.length > 0">
              <div
                v-for="user in selectedUsers"
                :key="user.email"
                class="subscriber-item"
              >
                <div class="subscriber-info">
                  <span class="subscriber-name">{{ user.name }}</span>
                  <span class="user-email-small">({{ user.email }})</span>
                </div>
                <img
                  src="@/assets/icons/calendar/trash-can.svg"
                  alt="삭제"
                  class="trash-icon"
                  @click="removeSelected(user.email)"
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
        <button class="invite-btn" @click="invite" :disabled="inviting">초대하기</button>
      </footer>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import { showSnackbar } from '@/services/snackbar.js';

export default {
  name: 'InviteMember',
  emits: ['close', 'invited'],
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
      inviting: false
    };
  },
  mounted() {
    // 컴포넌트 마운트 시 필요한 초기화 작업
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
          'http://localhost:8080/workspace-service/workspace/participants/search-outside',
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
          const requesterEmail = normalizeEmail(lsUserEmailRaw);

          // 디버깅: 실제 비교값 확인 (필요 시 주석 해제)
          // console.log('requesterId/email:', requesterId, requesterEmail);

          const filtered = list.filter(u => {
            const uid = normalizeUuid(u.userId);
            const uemail = normalizeEmail(u.userEmail);
            const notSelfById = requesterId ? uid !== requesterId : true;
            const notSelfByEmail = requesterEmail ? uemail !== requesterEmail : true;
            return notSelfById && notSelfByEmail;
          });

          this.results = filtered.map(u => ({
            userId: u.userId,
            name: u.userName,
            email: u.userEmail
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
      if (!this.selectedUsers.some(u => u.email === user.email)) {
        this.selectedUsers.push(user);
      }
      // 검색 결과에서 제거하여 중복 추가를 방지하고 UI에서 사라지게 함
      this.results = this.results.filter(u => u.email !== user.email);
    },
    
    // 선택된 사용자들 추가
    addSelectedUsers() {
      if (this.selectedUserIds.length === 0) {
        showSnackbar('사용자를 선택하세요.', { color: 'error' });
        return;
      }
      
      this.selectedUserIds.forEach(email => {
        const user = this.results.find(u => u.email === email);
        if (user && !this.selectedUsers.some(u => u.email === user.email)) {
          this.selectedUsers.push(user);
          // 검색 결과에서 제거
          this.results = this.results.filter(u => u.email !== user.email);
        }
      });
      
      // 체크박스 초기화
      this.selectedUserIds = [];
    },
    
    removeSelected(email) {
      const removed = this.selectedUsers.find(u => u.email === email);
      this.selectedUsers = this.selectedUsers.filter(u => u.email !== email);
      if (removed && !this.results.some(u => u.email === removed.email)) {
        this.results = [removed, ...this.results];
      }
    },
    async invite() {
      if (this.selectedUsers.length === 0) {
        showSnackbar('초대할 사용자를 선택하세요.', { color: 'error' });
        return;
      }

      const userIdList = this.selectedUsers
        .map(u => u.userId)
        .filter(Boolean);

      if (userIdList.length === 0) {
        showSnackbar('선택된 사용자에 유효한 사용자 ID가 없습니다. 검색을 통해 다시 선택해주세요.', { color: 'error' });
        return;
      }

      try {
        this.inviting = true;
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const requesterId = localStorage.getItem('id') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || localStorage.getItem('selectedWorkspaceId') || 'ws_1';

        const response = await axios.post(
          `http://localhost:8080/workspace-service/workspace/${workspaceId}/participants`,
          { userIdList },
          {
            headers: {
              'X-User-Id': requesterId,
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }
        );

        if (response?.data?.statusCode === 200) {
          showSnackbar('워크스페이스 사용자 추가 완료', { color: 'success' });
          setTimeout(() => {
            this.$emit('invited');
          }, 100);
        } else {
          showSnackbar(response?.data?.statusMessage || '초대에 실패했습니다.', { color: 'error' });
        }
      } catch (e) {
        console.error('워크스페이스 초대 실패:', e);
        showSnackbar(e?.response?.data?.statusMessage || '워크스페이스 초대 중 오류가 발생했습니다.', { color: 'error' });
      } finally {
        this.inviting = false;
      }
    }
  }
}
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

.user-text {
  font-size: 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
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

.invite-btn {
  background: #ffcd4d;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.invite-btn:hover {
  background: #ffd86c;
}

.invite-btn:disabled {
  background: #ddd;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
