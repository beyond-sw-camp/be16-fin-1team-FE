<script setup lang="ts">
import { ref, onMounted } from "vue";
import axios from "axios";
import CalendarBase from "@/components/CalendarBase.vue";
import StoneDetailModal from "@/views/Project/StoneDetailModal.vue";
import { useRoute } from "vue-router";
import { getStoneDetail } from "@/services/stoneService.js";

const route = useRoute();
const workspaceId = ref(
  route.query.workspaceId || 
  route.params.workspaceId || 
  localStorage.getItem("selectedWorkspaceId") || ""
);
const showModal = ref(false);
const selectedStoneId = ref(null);
const selectedStoneData = ref(null);
const isLoadingStoneDetail = ref(false);
const projectId = ref('');

// 참여자 수정 모달 관련
const showParticipantEditModal = ref(false);
const selectedStoneForParticipants = ref(null);
const participantSearchKeyword = ref('');
const emailSearchResults = ref([]);
const allSelectedUsers = ref([]);
const selectedUser = ref(null);
const selectedGroup = ref('');
const userGroupList = ref([]);
const isParticipantSearching = ref(false);
const isParticipantUpdating = ref(false);

// ✅ 일정 배열
const events = ref([]);
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
      allSelectedUsers.value = participants.map(participant => ({
        id: participant.userId,
        name: participant.participantName,
        email: participant.userEmail || participant.participantEmail || '',
        participantId: participant.participantId,
        group: '기존 참여자'
      }));
    } else {
      allSelectedUsers.value = [];
    }
  } catch (error) {
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
    
    if (!selectedGroupItem) {
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
    
    if (!selectedGroupItem) {
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
      
      const newMembers = members.map(member => ({
        id: member.userId,
        name: member.userName,
        email: member.userEmail,
        group: selectedGroup.value
      }));
      
      // 기존 선택된 사용자들과 중복 제거하면서 추가
      newMembers.forEach(member => {
        const existingIndex = allSelectedUsers.value.findIndex(user => user.id === member.id);
        if (existingIndex === -1) {
          allSelectedUsers.value.push(member);
        }
      });
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
    allSelectedUsers.value.push(user);
  }
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
    alert('선택된 스톤이 없습니다.');
    return;
  }
  
  if (allSelectedUsers.value.length === 0) {
    alert('최소 한 명의 참여자를 선택해주세요.');
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
      alert('참여자가 성공적으로 변경되었습니다.');
      
      // 스톤 데이터 새로고침
      if (stoneId) {
        await refreshStoneData(stoneId);
      }
      
      closeParticipantEditModal();
    } else {
      alert('참여자 변경에 실패했습니다.');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.statusMessage || error.message || '참여자 변경 중 오류가 발생했습니다.';
    alert(errorMessage);
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
  const id = localStorage.getItem("id");

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
        <select v-model="currentView" class="view-select">
          <option value="timeGridDay">일</option>
          <option value="timeGridWeek">주</option>
          <option value="dayGridMonth">월</option>
        </select>
      </div>
    </div>

    <!-- 📅 캘린더 -->
    <div class="calendar-container">
      <CalendarBase
        :events="events"
        :initial-date="currentDate"
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
      <div class="user-select-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">참여자 선택</h2>
        </div>
        
        <div class="modal-body">
          <!-- 1. 사용자 그룹 섹션 -->
          <div class="search-section">
            <h3 class="section-title">사용자 그룹</h3>
            <div class="group-list">
              <div 
                v-for="group in userGroupList" 
                :key="group.groupId"
                class="group-item"
                @click="selectGroup(group.groupName)"
              >
                <span class="group-name">{{ group.groupName }}</span>
                <span class="group-count">{{ group.participantCount }}명</span>
                <button 
                  class="btn-add-group"
                  @click.stop="addGroupToSelected(group.groupName)"
                >
                  추가
                </button>
              </div>
              <div v-if="userGroupList.length === 0" class="no-groups">
                그룹이 없습니다.
              </div>
            </div>
          </div>
          
          <!-- 2. 이메일 검색 섹션 -->
          <div class="search-section">
            <h3 class="section-title">이메일 검색</h3>
            <div class="search-group">
              <input 
                type="text" 
                class="search-input"
                v-model="participantSearchKeyword"
                @keyup.enter="searchUsers"
                placeholder="이메일로 검색..."
              />
              <button class="btn-search" @click="searchUsers" :disabled="isParticipantSearching">
                {{ isParticipantSearching ? '검색 중...' : '검색' }}
              </button>
            </div>
          </div>
          
          <!-- 3. 이메일 검색 결과 섹션 -->
          <div class="search-section">
            <h3 class="section-title">이메일 검색 결과</h3>
            <div class="user-list">
              <div 
                v-for="user in emailSearchResults" 
                :key="user.id"
                class="user-item search-result-item"
              >
                <div class="user-info search-result-info" @click="selectUser(user)">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                <button class="btn-add-user" @click="selectUser(user)">
                  추가
                </button>
              </div>
              <div v-if="emailSearchResults.length === 0" class="no-results">
                검색 결과가 없습니다.
              </div>
            </div>
          </div>
          
          <!-- 4. 선택된 사용자 섹션 -->
          <div class="search-section">
            <h3 class="section-title">선택된 사용자</h3>
            <div v-if="allSelectedUsers.length > 0" class="selected-group-members">
              <div 
                v-for="member in allSelectedUsers" 
                :key="member.id"
                class="selected-member-item"
              >
                <div class="user-info">
                  <div class="user-name">{{ member.name }}</div>
                  <div class="user-email">{{ member.email }}</div>
                </div>
                <button 
                  class="btn-remove-member" 
                  @click="removeMember(member.id)"
                >
                  ×
                </button>
              </div>
              <button class="btn-clear-all" @click="clearAllMembers">
                전체 해제
              </button>
            </div>
            <div v-else-if="selectedUser" class="selected-user-item">
              <div class="user-info">
                <div class="user-name">{{ selectedUser.name }}</div>
                <div class="user-email">{{ selectedUser.email }}</div>
              </div>
              <button class="btn-remove-selection" @click="removeSelectedUser">
                선택 해제
              </button>
            </div>
            <div v-else class="no-selection">
              사용자를 선택해주세요.
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-confirm" @click="confirmUserSelection" :disabled="isParticipantUpdating || allSelectedUsers.length === 0">
            {{ isParticipantUpdating ? '저장 중...' : '확인' }}
          </button>
          <button class="btn-cancel" @click="closeParticipantEditModal">
            취소
          </button>
        </div>
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

.view-select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 10px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: border-color 0.2s;
}
.view-select:hover {
  border-color: #ffcd4d;
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

/* ===== 참여자 수정 모달 (프로젝트 홈과 동일) ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.user-select-modal {
  width: 500px;
  min-height: 400px;
  max-height: 80vh;
  background: #F5F5F5;
  border: 1px solid #000000;
  box-shadow: 4px 4px 32px rgba(0, 0, 0, 0.25), -4px -4px 32px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.user-select-modal .modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #DDDDDD;
  background: #FFFFFF;
}

.user-select-modal .modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: #1C0F0F;
  margin: 0;
}

.user-select-modal .modal-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.search-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.section-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #1C0F0F;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #F4CE53;
}

.group-list {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  background: #FFFFFF;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid #F5F5F5;
  transition: background-color 0.2s ease;
}

.group-item:hover {
  background-color: #F8F8F8;
}

.group-item:last-child {
  border-bottom: none;
}

.group-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #1C0F0F;
  flex: 1;
}

.group-count {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #666666;
  margin-right: auto;
}

.btn-add-group {
  height: 24px;
  padding: 0 10px;
  background: #F4CE53;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 11px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-add-group:hover {
  background: #E6B800;
}

.no-groups {
  padding: 20px;
  text-align: center;
  color: #999999;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
}

.search-input {
  height: 48px;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  padding: 0 16px;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  flex: 1;
}

.search-input:focus {
  outline: none;
  border-color: #F4CE53;
}

.btn-search {
  height: 40px;
  padding: 0 12px;
  background: #F4CE53;
  border: none;
  border-radius: 6px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-left: 8px;
  min-width: 50px;
  flex-shrink: 0;
}

.btn-search:hover:not(:disabled) {
  background: #E6B800;
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  background: #FFFFFF;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}

.search-section .user-list {
  display: block;
  padding: 8px;
  gap: 0;
}

.user-item {
  padding: 6px 8px;
  cursor: pointer;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #FFFFFF;
  transition: all 0.2s ease;
  min-width: 100px;
  flex: 0 0 auto;
}

.search-result-item {
  width: 100%;
  padding: 3px 8px;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F5F5F5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
}

.search-result-info .user-name {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
}

.search-result-info .user-email {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  font-weight: 400;
  font-size: 10px;
  color: #666666;
}

.btn-add-user {
  height: 24px;
  padding: 0 8px;
  background: #F4CE53;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 11px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.btn-add-user:hover {
  background: #E6B800;
}

.user-item:hover {
  background-color: #F8F8F8;
  border-color: #F4CE53;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  color: #666666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #999999;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
}

.no-selection {
  padding: 20px;
  text-align: center;
  color: #999999;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  background: #F8F8F8;
  border: 1px dashed #DDDDDD;
  border-radius: 8px;
}

.selected-user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F8F8F8;
  border: 2px solid #F4CE53;
  border-radius: 8px;
}

.btn-remove-selection {
  height: 32px;
  padding: 0 12px;
  background: #FF6B6B;
  border: none;
  border-radius: 6px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #FFFFFF;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-remove-selection:hover {
  background: #FF5252;
}

.selected-group-members {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  background: #FFFFFF;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.selected-member-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: #F8F8F8;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  flex: 0 0 auto;
  min-width: 120px;
}

.btn-remove-member {
  position: absolute;
  top: 2px;
  right: 2px;
  background: none;
  border: none;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #FF6B6B;
  cursor: pointer;
  padding: 0;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s ease;
}

.btn-remove-member:hover {
  color: #FF5252;
}

.btn-clear-all {
  width: 100%;
  height: 28px;
  margin-top: 8px;
  background: #FF6B6B;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #FFFFFF;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex: 1 1 100%;
}

.btn-clear-all:hover {
  background: #FF5252;
}

.user-select-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #DDDDDD;
  background: #FFFFFF;
}

.user-select-modal .btn-confirm {
  padding: 10px 20px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-select-modal .btn-confirm:hover:not(:disabled) {
  background: #E6B800;
}

.user-select-modal .btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-select-modal .btn-cancel {
  padding: 10px 20px;
  background: #F5F5F5;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-select-modal .btn-cancel:hover {
  background: #E8E8E8;
}
</style>
