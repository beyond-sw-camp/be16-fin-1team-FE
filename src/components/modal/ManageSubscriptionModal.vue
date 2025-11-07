<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <!-- 헤더 -->
      <header class="modal-header">
        <h2>구독 관리</h2>
        <p>워크스페이스 내 다른 사용자의 일정을 구독하거나 삭제할 수 있습니다.</p>
      </header>

      <!-- 본문 -->
      <div class="modal-body">
        <!-- 왼쪽: 새 구독 추가 -->
        <div class="section add-section">
          <h3>새 구독 추가</h3>

          <div class="search-wrapper">
            <input
              v-model="keyword"
              lang="en"
              @keyup.enter="searchUsers"
              placeholder="이메일로 검색"
              class="search-input"
            />
            <button @click="searchUsers" class="search-btn">검색</button>
          </div>

          <div class="user-list">
            <template v-if="users.length > 0">
              <div
                v-for="user in users"
                :key="user.id"
                class="user-row"
              >
                <label>
                  <input
                    type="checkbox"
                    v-model="selectedUserIds"
                    :value="user.id"
                    class="checkbox"
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

          <button class="add-btn" @click="addSubscriptions">＋ 구독 추가</button>
        </div>

        <!-- 오른쪽: 구독 리스트 -->
        <div class="section list-section">
          <h3>구독 리스트</h3>
          <p class="hint-text">현재 구독 중인 사용자 목록입니다.</p>

          <div class="subscription-list">
            <template v-if="subscribers.length > 0">
              <div
                v-for="user in subscribers"
                :key="user.subscriptionId"
                class="subscriber-item"
              >
                <div class="subscriber-info">
                  <span class="dot" :style="{ backgroundColor: user.color }"></span>
                  <span class="subscriber-name">{{ user.targetUserName }}</span>
                </div>
                <img
                  src="@/assets/icons/calendar/trash-can.svg"
                  alt="삭제"
                  class="trash-icon"
                  @click="deleteSubscription(user)"
                />
              </div>
            </template>
            <div v-else class="empty-list">현재 구독 중인 사용자가 없습니다.</div>
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <footer class="modal-footer">
        <button class="close-btn" @click="close">닫기</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { showSnackbar } from '@/services/snackbar.js';

const props = defineProps({
  visible: Boolean,
  workspaceId: String,
  subscribers: Array,
});
const emit = defineEmits(["update:visible", "subscribed"]);

const keyword = ref("");
const users = ref([]);
const selectedUserIds = ref([]);

const searchUsers = async () => {
  if (!keyword.value.trim()) return alert("검색어를 입력하세요.");
  try {
    const { data } = await axios.post(
      `/workspace-service/workspace/participants/search`,
      {
        workspaceId: props.workspaceId,
        searchKeyword: keyword.value,
      },
      {
        headers: { "X-User-Id": localStorage.getItem("id") },
      }
    );
    users.value = (data.result?.userInfoList || []).map((u) => ({
      id: u.userId,
      name: u.userName,
      email: u.userEmail,
    }));
  } catch (err) {
    console.error("❌ 검색 실패:", err);
    alert("검색 실패");
  }
};

const addSubscriptions = async () => {
  if (selectedUserIds.value.length === 0) {
    // alert("구독할 유저를 선택하세요.");
    showSnackbar('구독할 유저를 선택하세요.', { color: 'error', timeout: 5000 });

    return;
  }
  try {
    await axios.post(
      `/user-service/subscriptions`,
      {
        workspaceId: props.workspaceId,
        targetUserIdList: selectedUserIds.value,
      },
      {
        headers: { "X-User-Id": localStorage.getItem("id") },
      }
    );
    // alert("✅ 구독이 추가되었습니다.");
    showSnackbar('구독이 추가되었습니다.', { color: 'success', timeout: 5000 });

    emit("subscribed");
    keyword.value = "";
    users.value = [];
    selectedUserIds.value = [];
  } catch (err) {
    console.error("❌ 구독 추가 실패:", err);
    // alert("구독 추가 실패");
    showSnackbar('구독 추가 실패', { color: 'error', timeout: 5000 });

  }
};

const deleteSubscription = async (user) => {
  if (!confirm(`'${user.targetUserName}' 구독을 삭제하시겠습니까?`)) return;
  try {
    await axios.delete(`/user-service/subscriptions`, {
      headers: { "X-User-Id": localStorage.getItem("id") },
      data: {
        workspaceId: props.workspaceId,
        subscriptionIdList: [user.subscriptionId],
      },
    });
    // alert("🗑️ 구독이 삭제되었습니다.");
    showSnackbar('구독이 삭제되었습니다.', { color: 'success', timeout: 5000 });

    emit("subscribed");
  } catch (err) {
    console.error("❌ 구독 삭제 실패:", err);
    // alert("구독 삭제 실패");
    showSnackbar('구독 삭제 실패', { color: 'error', timeout: 5000 });

  }
};

const close = () => {
    keyword.value = "";
    users.value = [];
    selectedUserIds.value = [];
    
    emit("update:visible", false);
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
  width: 760px;
  height: 520px; /* ✅ 고정된 높이 */
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
  flex: 1; /* ✅ 공간 채움 */
  overflow: hidden; /* ✅ 내부 스크롤만 허용 */
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
  margin-bottom: 10px;
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
.user-name {
  color: #2a2828;
  font-weight: 500;
  font-size: 14px;
  padding: 0 4px; /* ✅ 좌우 여백 추가 */
  border-radius: 4px; /* ✅ 클릭/hover 감 추가 시 자연스러움 */
}
.user-text {
  font-size: 14px;
}

.user-email {
  color: #999;
  font-size: 13px;
}

/* ===== Subscription List ===== */
.subscriber-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px;
  border-bottom: 1px solid #f4f4f4;
}

.subscriber-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
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

.close-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e8e8e8;
}

/* ===== Footer ===== */
.modal-footer {
  padding: 12px 20px;
  text-align: right;
  background: #fafafa;
  border-top: 1px solid #eee;
}
</style>
