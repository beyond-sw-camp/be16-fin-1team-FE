<!-- src/components/modal/SearchUserModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <h3>유저 검색 및 구독 추가</h3>

      <div class="search-bar">
        <input
          v-model="keyword"
          @keyup.enter="searchUsers"
          placeholder="email을 입력하세요."
        />
        <button @click="searchUsers" class="search-btn">검색</button>
      </div>

      <div v-if="users.length > 0" class="user-list">
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
            />
            <span class="user-info">
              <strong>{{ user.name }}</strong>
              <span class="user-email">({{ user.email }})</span>
            </span>
          </label>
        </div>
      </div>

      <div v-else class="empty">검색 결과가 없습니다.</div>

      <div class="modal-actions">
        <button class="cancel-btn" @click="close">취소</button>
        <button class="submit-btn" @click="addSubscriptions">구독 추가</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const props = defineProps({
  visible: Boolean,
  workspaceId: String,
});
const emit = defineEmits(["update:visible", "subscribed"]);

const keyword = ref("");
const users = ref([]);
const selectedUserIds = ref([]);

const searchUsers = async () => {
  if (!keyword.value.trim()) {
    alert("이름을 입력하세요.");
    return;
  }

  try {
    const { data } = await axios.post(
      `/workspace-service/workspace/participants/search`,
      {
        workspaceId: props.workspaceId,
        searchKeyword: keyword.value,
      },
      {
        headers: {
          "X-User-Id": localStorage.getItem("id"),
        },
      }
    );

    // 응답 구조에 맞게 result.userInfoList 파싱
    users.value = (data.result?.userInfoList || []).map((u) => ({
      id: u.userId,
      name: u.userName,
      email: u.userEmail,
    }));
  } catch (err) {
    console.error("❌ 워크스페이스 내 사용자 검색 실패:", err);
    alert("워크스페이스 내에서 사용자를 찾을 수 없습니다.");
  }
};

const addSubscriptions = async () => {
  if (selectedUserIds.value.length === 0) {
    alert("구독할 유저를 선택하세요.");
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
    alert("✅ 구독이 추가되었습니다.");
    emit("subscribed"); // 부모에서 다시 fetchSharedData 실행

    // 모달 닫기 전에 상태 초기화
    keyword.value = "";
    users.value = [];
    selectedUserIds.value = [];

    emit("update:visible", false);
  } catch (err) {
    console.error("❌ 구독 추가 실패:", err);

    // 백엔드에서 전달된 에러 메시지 확인
    const msg = err.response?.data?.statusMessage || err.message;

    if (msg.includes("이미 구독")) {
      alert("⚠️ 이미 구독 중인 유저입니다.");
    } else if (msg.includes("중복") || msg.includes("exists")) {
      alert("⚠️ 이미 등록된 구독입니다.");
    } else {
      alert("❌ 구독 추가 실패");
    }
  }
};

const close = () => {
  // 상태 초기화
  keyword.value = "";
  users.value = [];
  selectedUserIds.value = [];

  emit("update:visible", false);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 10px;
  padding: 20px;
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeIn 0.2s ease-in-out;
}

.search-bar {
  display: flex;
  gap: 6px;
}

.search-bar input {
  flex: 1;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.search-btn {
  background: #ffd580;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.user-list {
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid #eee;
  padding-top: 8px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.user-info {
  font-size: 14px;
}

.user-email {
  color: #888;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.cancel-btn {
  background: #ddd;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.submit-btn {
  background: #ffd580;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
</style>
