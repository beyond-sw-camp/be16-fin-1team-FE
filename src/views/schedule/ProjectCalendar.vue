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

// ✅ OrbitGantt와 동일한 색상 팔레트 및 할당 로직 (확장된 색상 팔레트)
const colorPalette = [
  "#9B6BFF", // 보라색
  "#4C9AFF", // 파란색
  "#FF5A8A", // 핑크색
  "#FFD93D", // 노란색
  "#6ECB63", // 초록색
  "#FF9F68", // 주황색
  "#A78BFA", // 연보라색
  "#FF4B4B", // 코랄색색
  "#F472B6", // 연핑크색
  "#FBBF24", // 연노란색
  "#34D399", // 민트색
  "#FB923C", // 연주황색
  "#C084FC", // 라벤더색
  "#3B82F6", // 진파란색
  "#EC4899", // 진핑크색
  "#F59E0B", // 골드색
  "#10B981", // 에메랄드색
  "#F97316", // 오렌지색
];
const colorMap = new Map<string, string>(); // stoneId -> color

// ✅ stoneId별 색상 할당 함수 (OrbitGantt와 동일)
function getColorForStoneId(stoneId: string | number | null | undefined): string {
  if (!stoneId) return colorPalette[0]; // 기본 색상
  
  const stoneIdStr = String(stoneId);
  if (!colorMap.has(stoneIdStr)) {
    // 새로운 stoneId면 팔레트에서 순차적으로 할당
    const color = colorPalette[colorMap.size % colorPalette.length];
    colorMap.set(stoneIdStr, color);
  }
  return colorMap.get(stoneIdStr)!;
}

// ✅ hex를 rgba로 변환 (불투명도 조절용)
function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ✅ 불투명도 설정 (필요시 수정 가능)
const EVENT_BACKGROUND_OPACITY = 0.35; // 배경 불투명도 (0.0 ~ 1.0)
const EVENT_BORDER_OPACITY = 1.0; // 테두리 불투명도 (0.0 ~ 1.0)

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

    // ✅ 색상 맵 초기화 (새로고침 시 재할당)
    colorMap.clear();

    // ✅ 스톤 이벤트 생성 (stoneId별 색상 할당)
    const stoneEvents = (stoneRes.data.result || []).map((s) => {
      const stoneColor = getColorForStoneId(s.stoneId);
      const startDate = new Date(s.startTime);
      const endDate = new Date(s.endTime);
      // ✅ 날짜만 비교 (시간 제외)
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const isSingleDay = startDate.getTime() === endDate.getTime();
      
      // ✅ 1일짜리 이벤트는 end 속성 제거 (FullCalendar가 제대로 표시하도록)
      const eventData = {
        id: s.stoneId,
        title: `[스톤] ${s.stoneName}`,
        start: s.startTime,
        project: s.projectName,
        type: "STONE",
        // ✅ FullCalendar 색상 속성 설정
        color: "#FFFFFF", // 텍스트 색상: 흰색으로 고정
        backgroundColor: hexToRgba(stoneColor, EVENT_BACKGROUND_OPACITY), // 배경 색상 (불투명도 적용)
        borderColor: hexToRgba(stoneColor, EVENT_BORDER_OPACITY), // 테두리 색상
        stoneId: s.stoneId,
        projectId: s.projectId,
        allDay: true, // ✅ 하루 종일 이벤트로 표시
      };
      
      // ✅ 2일 이상인 경우만 end 속성 추가
      if (!isSingleDay) {
        eventData.end = s.endTime;
      }
      
      return eventData;
    });

    // ✅ 태스크 이벤트 생성 (stoneId별 색상 할당)
    const taskEvents = (taskRes.data.result || []).map((t) => {
      const taskColor = getColorForStoneId(t.stoneId);
      const startDate = new Date(t.startTime);
      const endDate = new Date(t.endTime);
      // ✅ 날짜만 비교 (시간 제외)
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const isSingleDay = startDate.getTime() === endDate.getTime();
      
      // ✅ 1일짜리 이벤트는 end 속성 제거 (FullCalendar가 제대로 표시하도록)
      const eventData = {
        id: t.taskId,
        title: `[태스크] ${t.taskName}`,
        start: t.startTime,
        project: t.projectName,
        stone: t.stoneName,
        type: "TASK",
        // ✅ FullCalendar 색상 속성 설정
        color: "#FFFFFF", // 텍스트 색상: 흰색으로 고정
        backgroundColor: hexToRgba(taskColor, EVENT_BACKGROUND_OPACITY), // 배경 색상 (불투명도 적용)
        borderColor: hexToRgba(taskColor, EVENT_BORDER_OPACITY), // 테두리 색상
        stoneId: t.stoneId,
        allDay: true, // ✅ 하루 종일 이벤트로 표시
      };
      
      // ✅ 2일 이상인 경우만 end 속성 추가
      if (!isSingleDay) {
        eventData.end = t.endTime;
      }
      
      return eventData;
    });

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
  padding: var(--gap-l);
  position: relative;
  font-family: 'Pretendard', sans-serif;
  background: var(--bg);
  min-height: 100vh;
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--gap-m);
  padding: var(--gap-s) var(--gap-m);
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--border);
}

.left {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.arrow {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  font-size: 14px;
  color: var(--text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow:hover {
  background-color: var(--brand-weak);
  border-color: var(--brand);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 204, 51, 0.15);
}

.arrow:active {
  transform: translateY(0);
}

.left strong {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.02em;
  margin: 0 var(--gap-xs);
}

/* ===== Right Controls ===== */
.right {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
}

.icon-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.icon-btn:hover {
  background: var(--brand-weak);
  border-color: var(--brand);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 204, 51, 0.15);
}

/* 월/주/일 변경 버튼 */
.view-toggle {
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.view-btn {
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  background: transparent;
  color: var(--text);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  position: relative;
}

.view-btn:hover {
  background: var(--surface-2);
}

.view-btn.active {
  background: var(--brand);
  color: var(--text-strong);
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(255, 204, 51, 0.2);
}

/* ===== Calendar Container ===== */
.calendar-container {
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  padding: var(--gap-l);
  overflow: hidden;
  border: 1px solid var(--border);
}

/* ===== FullCalendar Customization ===== */

/* ✅ FullCalendar 기본 헤더 숨김 */
.fc-toolbar,
.fc-header-toolbar {
  display: none !important;
}

/* 배경 및 경계선 정리 */
#calendar {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
}

/* 날짜 숫자 */
.fc-daygrid-day-number {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

/* 요일 헤더 */
.fc-col-header-cell {
  background-color: var(--surface-2);
  border: none;
  color: var(--text);
  font-weight: 600;
  font-size: 13px;
  padding: var(--gap-s) 0;
}

/* 오늘 날짜 강조 - 유지 */
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

/* 이벤트 카드 - 개선된 디자인 */
.fc-event {
  border: none !important;
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--text-strong) !important;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  margin: 2px 0;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.fc-event:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  filter: brightness(1.05);
}

/* 경계선 최소화 */
.fc-scrollgrid,
.fc-scrollgrid-section > td {
  border: none !important;
}

/* 날짜 셀 호버 효과 */
.fc-daygrid-day:hover {
  background-color: var(--surface-2);
}

/* ===== Sidebar ===== */
.sidebar {
  position: absolute;
  top: 90px;
  right: 0;
  width: 300px;
  height: calc(100% - 110px);
  background: var(--surface);
  box-shadow: var(--shadow-hover);
  border-radius: var(--radius-xl) 0 0 var(--radius-xl);
  padding: var(--gap-l);
  border: 1px solid var(--border);
  border-right: none;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: var(--gap-m);
  padding-bottom: var(--gap-s);
  border-bottom: 1px solid var(--divider);
}

.close-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text);
}

.close-btn:hover {
  background: var(--brand-weak);
  border-color: var(--brand);
  transform: translateY(-1px);
}

.sidebar-body {
  display: flex;
  flex-direction: column;
  gap: var(--gap-s);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  font-size: 14px;
  color: var(--text);
  padding: var(--gap-xs);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.sidebar-item:hover {
  background: var(--surface-2);
}

.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  transition: transform 0.2s ease;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye-btn:hover {
  transform: scale(1.1);
}

.eye-btn.off {
  opacity: 0.3;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* ===== Animation ===== */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ===== 참여자 수정 모달 - Orbit 디자인 토큰 적용 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.user-select-modal-container {
  width: 1100px;
  height: 600px;
  background: var(--surface, #FFFFFF);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-hover, 0 10px 28px rgba(16, 24, 40, 0.09));
  overflow: hidden;
  animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border, #E4E7EC);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-select-modal-header {
  background: var(--brand-weak, #FFF4C2);
  padding: var(--gap-l, 20px) var(--gap-xl, 24px);
  border-bottom: 1px solid var(--border, #E4E7EC);
}

.user-select-modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-strong, #111418);
  letter-spacing: -0.01em;
}

.user-select-modal-header p {
  margin-top: var(--gap-xxs, 6px);
  font-size: 13px;
  color: var(--text-weak, #757B85);
}

.user-select-modal-body {
  display: flex;
  gap: var(--gap-l, 20px);
  padding: var(--gap-l, 20px) var(--gap-xl, 24px);
  background: var(--bg, #F5F6F8);
  flex: 1;
  overflow: hidden;
}

.user-select-section {
  flex: 1;
  border-radius: var(--radius-xl, 16px);
  background: var(--surface, #FFFFFF);
  padding: var(--gap-m, 16px);
  box-shadow: var(--shadow-soft, 0 8px 24px rgba(16, 24, 40, 0.06));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border, #E4E7EC);
}

.user-select-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-strong, #111418);
  margin-bottom: var(--gap-xs, 10px);
  letter-spacing: -0.01em;
}

.hint-text {
  font-size: 13px;
  color: var(--text-weak, #757B85);
  margin-bottom: var(--gap-xs, 10px);
}

.search-wrapper {
  display: flex;
  gap: var(--gap-xxs, 6px);
  margin-bottom: var(--gap-xs, 10px);
}

.search-wrapper .search-input {
  flex: 1;
  border: 1px solid var(--border, #E4E7EC);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--surface, #FFFFFF);
  color: var(--text, #2C2F36);
}

.search-wrapper .search-input:focus {
  border-color: var(--brand, #FFCC33);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 204, 51, 0.1);
}

.search-wrapper .search-btn {
  background: var(--brand, #FFCC33);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-strong, #111418);
  font-size: 14px;
}

.search-wrapper .search-btn:hover:not(:disabled) {
  background: #FFD64F;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 204, 51, 0.25);
}

.search-wrapper .search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.user-select-section .user-list,
.user-select-section .subscription-list,
.user-select-section .group-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--divider, #EEF0F3);
  border-radius: 8px;
  padding: var(--gap-xs, 10px);
  background: var(--surface-2, #F8F9FB);
  scrollbar-width: thin;
  scrollbar-color: var(--brand, #FFCC33) transparent;
}

.user-select-section .user-list::-webkit-scrollbar,
.user-select-section .subscription-list::-webkit-scrollbar,
.user-select-section .group-list::-webkit-scrollbar {
  width: 6px;
}

.user-select-section .user-list::-webkit-scrollbar-thumb,
.user-select-section .subscription-list::-webkit-scrollbar-thumb,
.user-select-section .group-list::-webkit-scrollbar-thumb {
  background: var(--brand, #FFCC33);
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
  gap: var(--gap-xxs, 6px);
  padding: var(--gap-xxs, 6px);
  border-radius: 8px;
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.user-select-section .user-row:hover {
  background: var(--brand-weak, #FFF4C2);
}

.user-select-section .user-name {
  color: var(--text-strong, #111418);
  font-weight: 500;
  font-size: 14px;
  padding: 0 4px;
}

.user-select-section .user-text {
  font-size: 14px;
}

.user-select-section .user-email {
  color: var(--text-weak, #757B85);
  font-size: 13px;
}

.user-select-section .subscriber-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--gap-xxs, 6px) 4px;
  border-bottom: 1px solid var(--divider, #EEF0F3);
  transition: background 0.2s ease;
}

.user-select-section .subscriber-item:hover {
  background: var(--surface-2, #F8F9FB);
}

.user-select-section .subscriber-info {
  display: flex;
  align-items: center;
  gap: var(--gap-xs, 10px);
}

.user-select-section .subscriber-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-strong, #111418);
}

.user-select-section .trash-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.user-select-section .trash-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

.user-select-section .add-btn {
  margin-top: var(--gap-s, 12px);
  background: var(--brand, #FFCC33);
  border: none;
  width: 100%;
  padding: var(--gap-xs, 10px);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-strong, #111418);
  font-size: 14px;
}

.user-select-section .add-btn:hover {
  background: #FFD64F;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 204, 51, 0.25);
}

.user-select-section .group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--gap-xs, 10px);
  border-bottom: 1px solid var(--divider, #EEF0F3);
  border-radius: 6px;
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.user-select-section .group-item:hover {
  background: var(--brand-weak, #FFF4C2);
}

.user-select-section .group-item:last-child {
  border-bottom: none;
}

.user-select-section .group-info {
  display: flex;
  align-items: center;
  gap: var(--gap-xxs, 6px);
  flex: 1;
}

.user-select-section .group-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-strong, #111418);
}

.user-select-section .group-count {
  font-size: 13px;
  color: var(--text-weak, #757B85);
}

.user-select-section .group-add-btn {
  background: var(--brand, #FFCC33);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-strong, #111418);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.user-select-section .group-add-btn:hover {
  background: #FFD64F;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(255, 204, 51, 0.2);
}

.user-select-modal-footer {
  padding: var(--gap-s, 12px) var(--gap-l, 20px);
  text-align: right;
  background: var(--surface-2, #F8F9FB);
  border-top: 1px solid var(--divider, #EEF0F3);
  display: flex;
  gap: var(--gap-xs, 10px);
  justify-content: flex-end;
}

.user-select-modal-footer .btn-confirm {
  background: var(--brand, #FFCC33);
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 80px;
  height: 40px;
  white-space: nowrap;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  color: var(--text-strong, #111418);
}

.user-select-modal-footer .btn-confirm:hover:not(:disabled) {
  background: #FFD64F;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 204, 51, 0.25);
}

.user-select-modal-footer .btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.user-select-modal-footer .close-btn {
  background: var(--chip, #F0F2F6);
  border: 1px solid var(--border, #E4E7EC);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 80px;
  height: 40px;
  white-space: nowrap;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  color: var(--text, #2C2F36);
}

.user-select-modal-footer .close-btn:hover {
  background: var(--surface-2, #F8F9FB);
  border-color: var(--border, #E4E7EC);
  transform: translateY(-1px);
}

.user-select-section .empty-msg,
.user-select-section .empty-list {
  padding: 40px var(--gap-l, 20px);
  text-align: center;
  color: var(--text-weak, #757B85);
  font-size: 14px;
}
</style>
