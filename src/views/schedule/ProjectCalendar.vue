<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
// @ts-ignore
import CalendarBase from "@/components/CalendarBase.vue";
// @ts-ignore
import StoneDetailModal from "@/views/Project/StoneDetailModal.vue";
import { useRoute } from "vue-router";
// @ts-ignore
import { getStoneDetail } from "@/services/stoneService.js";
// @ts-ignore
import { showSnackbar } from '@/services/snackbar.js';

const route = useRoute();
const workspaceId = ref(
  route.query.workspaceId || 
  route.params.workspaceId || 
  localStorage.getItem("selectedWorkspaceId") || ""
);
const showModal = ref(false);
const selectedStoneId = ref<string | null>(null);
const selectedStoneData = ref<any>(null);
const isLoadingStoneDetail = ref(false);
const projectId = ref('');

// 참여자 수정 모달 관련
const showParticipantEditModal = ref(false);
const selectedStoneForParticipants = ref<any>(null);
const participantSearchKeyword = ref('');
const emailSearchResults = ref<any[]>([]);
const allSelectedUsers = ref<any[]>([]);
const selectedUser = ref<any>(null);
const selectedGroup = ref('');
const userGroupList = ref<any[]>([]);
const isParticipantSearching = ref(false);
const isParticipantUpdating = ref(false);



const viewOptions = [
  { value: "dayGridMonth", label: "월" },
  { value: "timeGridWeek", label: "주" },
  { value: "timeGridDay", label: "일" },
];

// ✅ 일정 배열
const events = ref<any[]>([]);
const currentView = ref("dayGridMonth");
const showSidebar = ref(false);
const currentDate = ref(new Date());

async function handleEditParticipants(stoneData) {
  // 참여자 수정 모달 열기
  selectedStoneForParticipants.value = stoneData;
  
  // 기존 참여자 정보 로드
  await loadExistingParticipants(stoneData?.stoneId || stoneData?.id);
  
  // 사용자 그룹 목록 로드
  await loadUserGroupList();
  
  showParticipantEditModal.value = true;
  participantSearchKeyword.value = '';
  emailSearchResults.value = [];
  selectedUser.value = null;
  selectedGroup.value = '';
}

// 기존 참여자 로드
async function loadExistingParticipants(stoneId) {
  try {
    const userId = localStorage.getItem('id');
    
    const response = await axios.get(
      `/workspace-service/stone/${stoneId}`,
      {
        headers: {
          'X-User-Id': userId
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      const stoneDetail = response.data.result;
      const participants = stoneDetail.stoneParticipantDtoList || [];
      
      // 기존 참여자들을 allSelectedUsers에 추가
      allSelectedUsers.value = await Promise.all(
        participants.map(async (participant) => {
          let email = participant.userEmail || participant.participantEmail || '';
          
          // 이메일이 없으면 사용자 정보 조회
          if (!email && participant.userId) {
            try {
              const userResponse = await axios.get(
                `/user-service/user/${participant.userId}`,
                {
                  headers: {
                    'X-User-Id': userId
                  }
                }
              );
              
              if (userResponse.data.statusCode === 200) {
                email = userResponse.data.result.email || '';
              }
            } catch (error) {
              console.warn(`사용자 ${participant.userId}의 이메일 조회 실패:`, error);
            }
          }
          
          return {
            id: participant.userId,
            name: participant.participantName,
            email: email,
            participantId: participant.participantId,
            group: '기존 참여자'
          };
        })
      );
      
      console.log('로드된 참여자 목록:', allSelectedUsers.value);
    } else {
      allSelectedUsers.value = [];
    }
  } catch (error) {
    console.error('기존 참여자 로드 실패:', error);
    allSelectedUsers.value = [];
  }
}

// 사용자 그룹 목록 로드
async function loadUserGroupList() {
  try {
    const userId = localStorage.getItem('id');
    
    const response = await axios.get(
      `/workspace-service/groups?workspaceId=${workspaceId.value}`,
      {
        headers: {
          'X-User-Id': userId
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      userGroupList.value = response.data.result.content || [];
    } else {
      userGroupList.value = [];
    }
  } catch (error) {
    userGroupList.value = [];
  }
}

// 그룹 선택
async function selectGroup(groupName) {
  selectedGroup.value = groupName;
  await loadGroupMembers();
}

// 그룹 멤버 조회
async function loadGroupMembers() {
  try {
    const userId = localStorage.getItem('id');
    const selectedGroupItem = userGroupList.value.find(group => group.groupName === selectedGroup.value);
    
    if (!selectedGroupItem || !selectedGroupItem.groupId) {
      return;
    }
    
    const response = await axios.get(
      `/workspace-service/groups/${selectedGroupItem.groupId}`,
      {
        headers: {
          'X-User-Id': userId
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      const members = response.data.result.members.content || [];
      
      const groupMembers = members.map(member => ({
        id: member.userId,
        name: member.userName,
        email: member.userEmail,
        group: selectedGroup.value
      }));
      
      emailSearchResults.value = [];
      selectedUser.value = groupMembers[0] || null;
    } else {
      emailSearchResults.value = [];
      selectedUser.value = null;
    }
  } catch (error) {
    emailSearchResults.value = [];
    selectedUser.value = null;
  }
}

// 그룹을 선택된 사용자에 추가
async function addGroupToSelected(groupName) {
  selectedGroup.value = groupName;
  await loadGroupMembersForSelection();
}

// 그룹 멤버들을 선택된 사용자에 추가
async function loadGroupMembersForSelection() {
  try {
    const userId = localStorage.getItem('id');
    const selectedGroupItem = userGroupList.value.find(group => group.groupName === selectedGroup.value);
    
    if (!selectedGroupItem || !selectedGroupItem.groupId) {
      return;
    }
    
    const response = await axios.get(
      `/workspace-service/groups/${selectedGroupItem.groupId}`,
      {
        headers: {
          'X-User-Id': userId
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      const members = response.data.result.members.content || [];
      
      if (members.length === 0) {
        return;
      }
      
      const newMembers = members.map(member => ({
        id: member.userId,
        name: member.userName,
        email: member.userEmail,
        group: selectedGroup.value
      }));
      
      // 기존 선택된 사용자들과 중복 제거하면서 추가
      for (const member of newMembers) {
        const existingIndex = allSelectedUsers.value.findIndex(user => user.id === member.id);
        if (existingIndex === -1) {
          // 이메일이 없으면 사용자 정보 조회
          if (!member.email && member.id) {
            const memberWithEmail = await loadUserEmail(member);
            allSelectedUsers.value.push(memberWithEmail);
          } else {
            allSelectedUsers.value.push(member);
          }
        }
      }
    }
  } catch (error) {
    // 에러 처리 (로그 없음)
  }
}

// 참여자 검색
async function searchUsers() {
  if (!participantSearchKeyword.value.trim()) {
    emailSearchResults.value = [];
    return;
  }
  
  try {
    isParticipantSearching.value = true;
    const userId = localStorage.getItem('id');
    
    const response = await axios.post(
      `/workspace-service/workspace/participants/search`,
      {
        workspaceId: workspaceId.value,
        searchKeyword: participantSearchKeyword.value.trim()
      },
      {
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      const users = response.data.result.userInfoList || [];
      
      emailSearchResults.value = users.map(user => ({
        id: user.userId,
        name: user.userName,
        email: user.userEmail,
        group: '검색결과'
      }));
    } else {
      emailSearchResults.value = [];
    }
  } catch (error) {
    emailSearchResults.value = [];
  } finally {
    isParticipantSearching.value = false;
  }
}

// 사용자 선택
function selectUser(user) {
  selectedUser.value = user;
  
  // 기존 선택된 사용자들과 중복 제거하면서 추가
  const existingIndex = allSelectedUsers.value.findIndex(selectedUser => selectedUser.id === user.id);
  if (existingIndex === -1) {
    // 이메일이 없으면 사용자 정보 조회
    if (!user.email && user.id) {
      loadUserEmail(user).then(userWithEmail => {
        allSelectedUsers.value.push(userWithEmail);
      });
    } else {
      allSelectedUsers.value.push(user);
    }
  }
}

// 사용자 이메일 조회
async function loadUserEmail(user) {
  if (user.email) {
    return user;
  }
  
  try {
    const userId = localStorage.getItem('id');
    const response = await axios.get(
      `/user-service/user/${user.id}`,
      {
        headers: {
          'X-User-Id': userId
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      return {
        ...user,
        email: response.data.result.email || ''
      };
    }
  } catch (error) {
    console.warn(`사용자 ${user.id}의 이메일 조회 실패:`, error);
  }
  
  return user;
}

// 체크박스로 사용자 선택 토글
async function toggleUserSelection(user) {
  const existingIndex = allSelectedUsers.value.findIndex(u => u.id === user.id);
  if (existingIndex === -1) {
    // 이메일이 없으면 사용자 정보 조회
    if (!user.email && user.id) {
      const userWithEmail = await loadUserEmail(user);
      allSelectedUsers.value.push(userWithEmail);
    } else {
      allSelectedUsers.value.push(user);
    }
  } else {
    allSelectedUsers.value.splice(existingIndex, 1);
  }
}

// 선택된 사용자들을 추가
function addSelectedUsers() {
  // 체크박스로 선택된 사용자 확인
  const selectedFromResults = emailSearchResults.value.filter(user => 
    allSelectedUsers.value.find(u => u.id === user.id) !== undefined
  );
  
  if (selectedFromResults.length === 0) {
    return;
  }
  
  // 추가 작업은 이미 toggleUserSelection에서 처리됨
}

// 선택된 사용자 해제
function removeSelectedUser() {
  selectedUser.value = null;
}

// 개별 멤버 제거
function removeMember(memberId) {
  allSelectedUsers.value = allSelectedUsers.value.filter(member => member.id !== memberId);
}

// 모든 멤버 해제
function clearAllMembers() {
  allSelectedUsers.value = [];
}

// 참여자 수정 확인
async function confirmUserSelection() {
  if (!selectedStoneForParticipants.value) {
    return;
  }
  
  if (allSelectedUsers.value.length === 0) {
    return;
  }
  
  try {
    isParticipantUpdating.value = true;
    const userId = localStorage.getItem('id');
    const stoneId = selectedStoneForParticipants.value.stoneId || selectedStoneForParticipants.value.id;
    const participantIds = allSelectedUsers.value.map(p => p.id);
    
    const response = await axios.patch(
      `/workspace-service/stone/participant/join`,
      {
        stoneId: stoneId,
        stoneParticipantList: participantIds
      },
      {
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      showSnackbar('참여자가 성공적으로 변경되었습니다.', { color: 'success' });
      
      // 스톤 데이터 새로고침
      if (stoneId) {
        await refreshStoneData(stoneId);
      }
      
      closeParticipantEditModal();
    } else {
      console.error('참여자 변경 실패:', response.data);
    }
  } catch (error) {
    console.error('참여자 변경 API 호출 실패:', error);
  } finally {
    isParticipantUpdating.value = false;
  }
}

// 스톤 데이터 새로고침
async function refreshStoneData(stoneId) {
  try {
    const response = await getStoneDetail(stoneId);
    
    if (response.statusCode === 200) {
      const stoneDetail = response.result;
      const participants = stoneDetail.stoneParticipantDtoList || [];
      const participantNames = participants.map(p => p.participantName);
      const participantsText = participantNames.length > 0 ? participantNames.join(', ') : '비어 있음';
      
      selectedStoneData.value = {
        ...selectedStoneData.value,
        participants: participantsText,
        stoneParticipantDtoList: participants
      };
    }
  } catch (error) {
    // 에러 처리 (로그 없음)
  }
}

// 참여자 수정 모달 닫기
function closeParticipantEditModal() {
  showParticipantEditModal.value = false;
  selectedStoneForParticipants.value = null;
  participantSearchKeyword.value = '';
  emailSearchResults.value = [];
  allSelectedUsers.value = [];
  selectedUser.value = null;
  selectedGroup.value = '';
  isParticipantSearching.value = false;
}

async function openStoneModal(eventData) {
  const stoneId = eventData.stoneId || eventData.id;
  
  if (!stoneId) {
    return;
  }
  
  try {
    isLoadingStoneDetail.value = true;
    selectedStoneId.value = stoneId;
    
    // 스톤 상세 정보 API 호출
    const response = await getStoneDetail(stoneId);
    
    if (response.statusCode === 200) {
      const stoneDetail = response.result;
      
      // 참여자 목록 처리
      const participants = stoneDetail.stoneParticipantDtoList || [];
      const participantNames = participants.map(p => p.participantName);
      const participantsText = participantNames.length > 0 ? participantNames.join(', ') : '비어 있음';
      
      // API 응답 데이터를 모달에 맞는 형태로 변환
      selectedStoneData.value = {
        stoneId: stoneId,
        stoneName: stoneDetail.stoneName,
        startTime: stoneDetail.startTime,
        endTime: stoneDetail.endTime,
        manager: stoneDetail.stoneManagerName,
        participants: participantsText,
        documentLink: '바로가기',
        chatCreation: stoneDetail.chatCreation,
        stoneStatus: stoneDetail.stoneStatus,
        stoneDescribe: stoneDetail.stoneDescribe,
        milestone: stoneDetail.milestone || stoneDetail.projectMilestone || 0, // 진행률 추가
        stoneParticipantDtoList: participants, // 참여자 원본 데이터도 포함
        projectId: stoneDetail.projectId || eventData.projectId, // 프로젝트 ID 추가
        tasks: (stoneDetail.taskResDtoList || []).map((task, index) => ({
          id: task.taskId || index + 1,
          name: task.taskName || '태스크',
          completed: task.taskStatus === 'COMPLETED' || false,
          startTime: task.startTime || stoneDetail.startTime,
          endTime: task.endTime || stoneDetail.endTime
        })),
        isProject: false
      };
      
      showModal.value = true;
    } else {
      alert(response.statusMessage || '스톤 정보를 불러오는데 실패했습니다.');
    }
  } catch (error) {
    const errorMessage = error.message || '스톤 정보를 불러오는데 실패했습니다.';
    alert(errorMessage);
  } finally {
    isLoadingStoneDetail.value = false;
  }
}

// // ✅ 모달 제어
// const showStoneModal = ref(false);
// // const selectedStoneId = ref<string | null>(null);

// ✅ 참여 스톤 & 태스크 불러오기
const fetchEvents = async () => {
  if (!workspaceId.value) {
    return;
  }

  try {
    const userId = localStorage.getItem("id");

    const [stoneRes, taskRes] = await Promise.all([
      axios.get(`/workspace-service/workspace/${workspaceId.value}/my-stones`, {
        headers: { "X-User-Id": userId },
      }),
      axios.get(`/workspace-service/workspace/${workspaceId.value}/my-tasks`, {
        headers: { "X-User-Id": userId },
      }),
    ]);

    const stoneEvents = (stoneRes.data.result || []).map((s) => ({
      id: s.stoneId,
      title: `[스톤] ${s.stoneName}`,
      start: s.startTime,
      end: s.endTime,
      project: s.projectName,
      type: "STONE",
      color: "#A3B8FF",
      stoneId: s.stoneId,
      projectId: s.projectId, // 프로젝트 ID 추가
    }));

    const taskEvents = (taskRes.data.result || []).map((t) => ({
      id: t.taskId,
      title: `[태스크] ${t.taskName}`,
      start: t.startTime,
      end: t.endTime,
      project: t.projectName,
      stone: t.stoneName,
      type: "TASK",
      color: "#FFD93D",
      stoneId: t.stoneId,
    }));

    events.value = [...stoneEvents, ...taskEvents];
  } catch (e) {
    // 에러 처리 (로그 없음)
  }
};

onMounted(fetchEvents);

// ✅ 월 이동
function changeMonth(delta) {
  const date = new Date(currentDate.value);
  date.setMonth(date.getMonth() + delta);
  currentDate.value = date;
}
function formatYearMonth(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
}

// ✅ 사이드바
const sidebarItems = ref([
  { name: "스톤 일정", color: "#A3B8FF", visible: true },
  { name: "태스크 일정", color: "#FFD93D", visible: true },
]);
function toggleVisibility(item) {
  item.visible = !item.visible;
}

</script>

<template>
  <div class="project-calendar-wrap">
    <!-- 툴바 -->
    <div class="toolbar">
      <div class="left">
        <button class="arrow" @click="changeMonth(-1)">◀</button>
        <strong>{{ formatYearMonth(currentDate) }}</strong>
        <button class="arrow" @click="changeMonth(1)">▶</button>
      </div>

      <div class="right">
        <button class="icon-btn" @click="toggleSidebar">👁️</button>
        <div class="view-toggle">
          <button
            v-for="type in viewOptions"
            :key="type.value"
            :class="['view-btn', { active: currentView === type.value }]"
            @click="currentView = type.value"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 📅 캘린더 -->
    <div class="calendar-container">
      <CalendarBase
        :events="events"
        :initial-date="currentDate"
        :view-type="currentView"
        @event-click="openStoneModal"
      />

      <!-- ✅ 스톤 상세 모달 -->
      <StoneDetailModal
        :is-visible="showModal"
        :key="selectedStoneId"
        :stone-data="selectedStoneData"
        :workspace-id="workspaceId"
        @close="showModal = false"
        @edit-participants="handleEditParticipants"
      />
    </div>

    <!-- 참여자 수정 모달 -->
    <div v-if="showParticipantEditModal" class="modal-overlay" @click="closeParticipantEditModal">
      <div class="user-select-modal-container" @click.stop>
        <!-- 헤더 -->
        <header class="user-select-modal-header">
          <h2>참여자 선택</h2>
          <p>워크스페이스 내 사용자를 검색하여 참여자로 추가할 수 있습니다.</p>
        </header>

        <!-- 본문 -->
        <div class="user-select-modal-body">
          <!-- 왼쪽: 사용자 그룹 -->
          <div class="user-select-section group-section">
            <h3>사용자 그룹</h3>
            <p class="hint-text">그룹을 선택하여 멤버를 추가할 수 있습니다.</p>

            <div class="group-list">
              <template v-if="userGroupList.length > 0">
                <div
                  v-for="group in userGroupList"
                  :key="group.groupId"
                  class="group-item"
                >
                  <div class="group-info">
                    <span class="group-name">{{ group.groupName }}</span>
                    <span class="group-count">({{ group.participantCount }}명)</span>
                  </div>
                  <button
                    class="group-add-btn"
                    @click="addGroupToSelected(group.groupName)"
                  >
                    추가
                  </button>
                </div>
              </template>
              <div v-else class="empty-msg">그룹이 없습니다.</div>
            </div>
          </div>

          <!-- 중간: 새 참여자 추가 -->
          <div class="user-select-section add-section">
            <h3>새 참여자 추가</h3>

            <div class="search-wrapper">
              <input
                v-model="participantSearchKeyword"
                lang="en"
                @keyup.enter="searchUsers"
                placeholder="이메일로 검색"
                class="search-input"
              />
              <button @click="searchUsers" class="search-btn" :disabled="isParticipantSearching">
                {{ isParticipantSearching ? '검색 중...' : '검색' }}
              </button>
            </div>

            <div class="user-list">
              <template v-if="emailSearchResults.length > 0">
                <div
                  v-for="user in emailSearchResults"
                  :key="user.id"
                  class="user-row"
                >
                  <label>
                    <input
                      type="checkbox"
                      :checked="allSelectedUsers.find(u => u.id === user.id) !== undefined"
                      @change="toggleUserSelection(user)"
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

            <button class="add-btn" @click="addSelectedUsers">＋ 참여자 추가</button>
          </div>

          <!-- 오른쪽: 선택된 참여자 리스트 -->
          <div class="user-select-section list-section">
            <h3>선택된 참여자 리스트</h3>
            <p class="hint-text">현재 선택된 참여자 목록입니다.</p>

            <div class="subscription-list">
              <template v-if="allSelectedUsers.length > 0">
                <div
                  v-for="user in allSelectedUsers"
                  :key="user.id"
                  class="subscriber-item"
                >
                  <div class="subscriber-info">
                    <span class="subscriber-name">{{ user.name }}</span>
                    <span class="user-email" v-if="user.email">({{ user.email }})</span>
                  </div>
                  <img
                    src="@/assets/icons/calendar/trash-can.svg"
                    alt="삭제"
                    class="trash-icon"
                    @click="removeMember(user.id)"
                  />
                </div>
              </template>
              <div v-else class="empty-list">현재 선택된 참여자가 없습니다.</div>
            </div>
          </div>
        </div>

        <!-- 푸터 -->
        <footer class="user-select-modal-footer">
          <button class="btn-confirm" @click="confirmUserSelection" :disabled="isParticipantUpdating || allSelectedUsers.length === 0">
            {{ isParticipantUpdating ? '저장 중...' : '확인' }}
          </button>
          <button class="close-btn" @click="closeParticipantEditModal">닫기</button>
        </footer>
      </div>
    </div>

    <!-- 👁️ 사이드바 -->
    <transition name="slide">
      <aside v-if="showSidebar" class="sidebar">
        <div class="sidebar-header">
          <button class="close-btn" @click="toggleSidebar">←</button>
        </div>
        <div class="sidebar-body">
          <div v-for="item in sidebarItems" :key="item.name" class="sidebar-item">
            <button class="eye-btn" :class="{ off: !item.visible }" @click="toggleVisibility(item)">
              {{ item.visible ? "👁️" : "🚫" }}
            </button>
            <span class="dot" :style="{ background: item.color }"></span>
            <span>{{ item.name }}</span>
          </div>
        </div>
      </aside>
    </transition>
  </div>
</template>

<style scoped>
.project-calendar-wrap {
  padding: 20px;
  position: relative;
  font-family: 'Pretendard', sans-serif;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.arrow {
  border: 1px solid #ddd; /* ✅ 공유 캘린더와 동일한 얇은 테두리 */
  background: #fff;
  border-radius: 8px;
  width: 32px;          /* ✅ 크기 통일 */
  height: 32px;
  font-size: 16px;
  color: #333;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); /* ✅ 동일한 그림자 */
  cursor: pointer;
  transition: all 0.2s ease;
}

.arrow:hover {
  background-color: #fff8db; /* ✅ 살짝 노란 hover 효과 */
  border-color: #ffcd4d;
}


.left strong {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* ===== Right Controls ===== */
.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  border: none;
  background: #fff;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}
.icon-btn:hover {
  background: #fffae0;
}

/* 월/주/일 변경 버튼 */
.view-toggle {
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.view-btn {
  border: none;
  padding: 6px 14px;
  cursor: pointer;
  font-weight: 500;
  background: #fff;
  color: #555;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #f8f8f8;
}

.view-btn.active {
  background: #ffd580;
  color: #333;
  font-weight: 600;
}

/* ===== Calendar Container ===== */
.calendar-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  overflow: hidden;
}

/* ===== FullCalendar Customization ===== */

/* ✅ FullCalendar 기본 헤더 숨김 */
.fc-toolbar,
.fc-header-toolbar {
  display: none !important;
}

/* 배경 및 경계선 정리 */
#calendar {
  background: #fff;
  border-radius: 12px;
  box-shadow: none;
  padding: 12px;
}

/* 날짜 숫자 */
.fc-daygrid-day-number {
  font-size: 13px;
  font-weight: 500;
  color: #444;
}

/* 요일 헤더 */
.fc-col-header-cell {
  background-color: #f9f9f9;
  border: none;
  color: #555;
  font-weight: 600;
  font-size: 14px;
}

/* 오늘 날짜 강조 */
.fc-day-today {
  background-color: transparent !important;
  box-shadow: 0 0 0 2px #ffcd4d inset, 0 0 6px rgba(255, 205, 77, 0.4);
  z-index: 2;
}

.fc-day-today .fc-daygrid-day-number {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #ffcd4d;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(255, 205, 77, 0.5);
}

/* 이벤트 카드 */
.fc-event {
  border: none !important;
  border-radius: 6px;
  padding: 2px 4px;
  color: #333 !important;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.fc-event:hover {
  filter: brightness(1.05);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* 경계선 최소화 */
.fc-scrollgrid,
.fc-scrollgrid-section > td {
  border: none !important;
}

/* ===== Sidebar ===== */
.sidebar {
  position: absolute;
  top: 70px;
  right: 0;
  width: 280px;
  height: calc(100% - 70px);
  background: #fff;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px 0 0 12px;
  padding: 20px;
}

.sidebar-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.close-btn {
  border: none;
  background: #fff;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: background 0.2s;
}
.close-btn:hover {
  background: #fffae0;
}

.sidebar-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #444;
}

.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
.eye-btn.off {
  opacity: 0.3;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* ===== Animation ===== */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ===== 참여자 수정 모달 - 구독 관리 모달과 동일한 디자인 ===== */
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

.user-select-modal-container {
  width: 1100px;
  height: 600px;
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

.user-select-modal-header {
  background: #fff8e1;
  padding: 20px 24px;
  border-bottom: 1px solid #f2e3a5;
}

.user-select-modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.user-select-modal-header p {
  margin-top: 6px;
  font-size: 13px;
  color: #777;
}

.user-select-modal-body {
  display: flex;
  gap: 20px;
  padding: 20px 24px;
  background: #fffdf9;
  flex: 1;
  overflow: hidden;
}

.user-select-section {
  flex: 1;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-select-section h3 {
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

.search-wrapper {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.search-wrapper .search-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-wrapper .search-input:focus {
  border-color: #ffcd4d;
  outline: none;
}

.search-wrapper .search-btn {
  background: #ffcd4d;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.search-wrapper .search-btn:hover:not(:disabled) {
  background: #ffd86c;
}

.search-wrapper .search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-select-section .user-list,
.user-select-section .subscription-list,
.user-select-section .group-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #f3f3f3;
  border-radius: 8px;
  padding: 8px;
  background: #fffefc;
  scrollbar-width: thin;
  scrollbar-color: #ffde7d transparent;
}

.user-select-section .user-list::-webkit-scrollbar,
.user-select-section .subscription-list::-webkit-scrollbar,
.user-select-section .group-list::-webkit-scrollbar {
  width: 6px;
}

.user-select-section .user-list::-webkit-scrollbar-thumb,
.user-select-section .subscription-list::-webkit-scrollbar-thumb,
.user-select-section .group-list::-webkit-scrollbar-thumb {
  background: #ffd86c;
  border-radius: 4px;
}

.user-select-section .user-list::-webkit-scrollbar-track,
.user-select-section .subscription-list::-webkit-scrollbar-track,
.user-select-section .group-list::-webkit-scrollbar-track {
  background: transparent;
}

.user-select-section .user-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-select-section .user-row:hover {
  background: #fff8e6;
}

.user-select-section .user-name {
  color: #2a2828;
  font-weight: 500;
  font-size: 14px;
  padding: 0 4px;
  border-radius: 4px;
}

.user-select-section .user-text {
  font-size: 14px;
}

.user-select-section .user-email {
  color: #999;
  font-size: 13px;
}

.user-select-section .subscriber-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 4px;
  border-bottom: 1px solid #f4f4f4;
}

.user-select-section .subscriber-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-select-section .subscriber-name {
  font-weight: 500;
  font-size: 14px;
  color: #2a2828;
}

.user-select-section .trash-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.user-select-section .trash-icon:hover {
  opacity: 1;
}

.user-select-section .add-btn {
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

.user-select-section .add-btn:hover {
  background: #ffd86c;
}

.user-select-section .group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #f4f4f4;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-select-section .group-item:hover {
  background: #fff8e6;
}

.user-select-section .group-item:last-child {
  border-bottom: none;
}

.user-select-section .group-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.user-select-section .group-name {
  font-weight: 500;
  font-size: 14px;
  color: #2a2828;
}

.user-select-section .group-count {
  font-size: 13px;
  color: #999;
}

.user-select-section .group-add-btn {
  background: #ffcd4d;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.user-select-section .group-add-btn:hover {
  background: #ffd86c;
}

.user-select-modal-footer {
  padding: 12px 20px;
  text-align: right;
  background: #fafafa;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.user-select-modal-footer .btn-confirm {
  background: #ffcd4d;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
  width: 80px;
  height: 40px;
  white-space: nowrap;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.user-select-modal-footer .btn-confirm:hover:not(:disabled) {
  background: #ffd86c;
}

.user-select-modal-footer .btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-select-modal-footer .close-btn {
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
  width: 80px;
  height: 40px;
  white-space: nowrap;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.user-select-modal-footer .close-btn:hover {
  background: #e8e8e8;
}

.user-select-section .empty-msg,
.user-select-section .empty-list {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
