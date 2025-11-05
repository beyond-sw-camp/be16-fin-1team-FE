<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <!-- 헤더 -->
      <header class="modal-header">
        <h2>사용자 그룹 선택</h2>
        <p>워크스페이스 내 사용자 그룹을 선택하여 추가할 수 있습니다.</p>
      </header>

      <!-- 본문 -->
      <div class="modal-body">
        <!-- 왼쪽: 새 그룹 추가 -->
        <div class="section add-section">
          <h3>새 그룹 추가</h3>

          <div class="search-wrapper">
            <input
              v-model="keyword"
              lang="en"
              @keyup.enter="searchGroups"
              placeholder="그룹명으로 검색"
              class="search-input"
            />
            <button @click="searchGroups" class="search-btn">검색</button>
          </div>

          <div class="user-list">
            <template v-if="groups.length > 0">
              <div
                v-for="group in groups"
                :key="group.groupId"
                class="user-row"
              >
                <label>
                  <input
                    type="checkbox"
                    v-model="selectedGroupIds"
                    :value="group.groupId"
                    class="checkbox"
                  />
                  <span class="user-text">
                    <span class="user-name">{{ group.groupName }}</span>
                    <span class="user-email">({{ group.participantCount }}명)</span>
                  </span>
                </label>
              </div>
            </template>
            <div v-else class="empty-msg">검색 결과가 없습니다.</div>
          </div>

          <button class="add-btn" @click="addGroups">＋ 그룹 추가</button>
        </div>

        <!-- 오른쪽: 선택된 그룹 리스트 -->
        <div class="section list-section">
          <h3>선택된 그룹 리스트</h3>
          <p class="hint-text">현재 선택된 사용자 그룹 목록입니다.</p>

          <div class="subscription-list">
            <template v-if="selectedGroups.length > 0">
              <div
                v-for="group in selectedGroups"
                :key="group.groupId"
                class="subscriber-item"
              >
                <div class="subscriber-info">
                  <span class="subscriber-name">{{ group.groupName }}</span>
                  <span class="user-email">({{ group.participantCount }}명)</span>
                </div>
                <img
                  src="@/assets/icons/calendar/trash-can.svg"
                  alt="삭제"
                  class="trash-icon"
                  @click="removeGroup(group)"
                />
              </div>
            </template>
            <div v-else class="empty-list">현재 선택된 그룹이 없습니다.</div>
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
import { ref, watch } from "vue";
import axios from "axios";

const props = defineProps({
  visible: Boolean,
  workspaceId: String,
});
const emit = defineEmits(["update:visible", "groups-selected"]);

const keyword = ref("");
const groups = ref([]);
const selectedGroupIds = ref([]);
const selectedGroups = ref([]);

// 모달이 열릴 때 그룹 목록 로드
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    await loadGroupList();
    selectedGroupIds.value = [];
    selectedGroups.value = [];
  }
});

// 그룹 목록 조회
const loadGroupList = async () => {
  try {
    const userId = localStorage.getItem('id');
    const workspaceId = props.workspaceId || localStorage.getItem('selectedWorkspaceId');
    
    const response = await axios.get(
      `http://localhost:8080/workspace-service/groups?workspaceId=${workspaceId}`,
      {
        headers: {
          'X-User-Id': userId
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      groups.value = (response.data.result.content || []).map(group => ({
        groupId: group.groupId,
        groupName: group.groupName,
        participantCount: group.participantCount || 0
      }));
    } else {
      console.error('그룹 목록 조회 실패:', response.data);
      groups.value = [];
    }
  } catch (err) {
    console.error('❌ 그룹 목록 조회 실패:', err);
    groups.value = [];
  }
};

// 그룹 검색
const searchGroups = async () => {
  if (!keyword.value.trim()) {
    await loadGroupList();
    return;
  }
  
  try {
    const userId = localStorage.getItem('id');
    const workspaceId = props.workspaceId || localStorage.getItem('selectedWorkspaceId');
    
    const response = await axios.post(
      `http://localhost:8080/workspace-service/groups/search`,
      {
        workspaceId: workspaceId,
        groupName: keyword.value.trim()
      },
      {
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      const pageData = response.data.result;
      const foundGroups = pageData.content || [];
      
      groups.value = foundGroups.map(group => ({
        groupId: group.userGroupName || group.groupId,
        groupName: group.userGroupName || group.groupName,
        participantCount: group.userGroupParticipantsCount || group.participantCount || 0
      }));
    } else {
      console.error('그룹 검색 실패:', response.data);
      groups.value = [];
    }
  } catch (err) {
    console.error('❌ 그룹 검색 실패:', err);
    groups.value = [];
  }
};

// 그룹 추가
const addGroups = async () => {
  if (selectedGroupIds.value.length === 0) {
    alert("추가할 그룹을 선택하세요.");
    return;
  }
  
  // 선택된 그룹들을 찾아서 selectedGroups에 추가 (중복 제거)
  const newGroups = groups.value
    .filter(group => selectedGroupIds.value.includes(group.groupId))
    .filter(group => !selectedGroups.value.find(g => g.groupId === group.groupId));
  
  selectedGroups.value = [...selectedGroups.value, ...newGroups];
  
  // 선택 초기화
  selectedGroupIds.value = [];
  keyword.value = "";
  groups.value = [];
  
  // 부모 컴포넌트에 선택된 그룹들 전달
  emit("groups-selected", selectedGroups.value);
};

// 그룹 제거
const removeGroup = (group) => {
  selectedGroups.value = selectedGroups.value.filter(g => g.groupId !== group.groupId);
  emit("groups-selected", selectedGroups.value);
};

const close = () => {
  keyword.value = "";
  groups.value = [];
  selectedGroupIds.value = [];
  
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

.subscriber-name {
  font-weight: 500;
  font-size: 14px;
  color: #2a2828;
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

.empty-msg,
.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
