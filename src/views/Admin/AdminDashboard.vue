<template>
  <div class="admin-dashboard">
    <!-- 관리자 페이지 헤더 -->
    <div class="admin-header">
      <div class="admin-nav-tabs">
        <div class="nav-tab active" @click="setActiveTab('permission')">권한 그룹</div>
        <div class="nav-tab" @click="setActiveTab('user')">사용자 그룹</div>
        <div class="nav-tab" @click="setActiveTab('dashboard')">대시보드</div>
        <div class="nav-tab" @click="setActiveTab('member')">회원 관리</div>
        <div class="nav-tab" @click="setActiveTab('workspace')">워크스페이스 관리</div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="admin-content">
      <!-- 권한 그룹 -->
      <div v-if="activeTab === 'permission'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">권한 그룹</h1>
          <p class="sub-title">역할을 사용하면 서버 멤버를 그룹화하고 권한을 지정할 수 있어요.</p>
        </div>
        
        <!-- 권한 그룹 목록 -->
        <div class="permission-groups-container">
          <!-- 권한 생성 버튼 -->
          <div class="button-container">
            <div class="create-permission-btn" @click="createPermissionGroup">
              <span>권한 생성</span>
            </div>
          </div>

          <!-- 권한 그룹 헤더 -->
          <div class="permission-groups-header">
            <div class="header-left">
              <span class="header-title">역할 - {{ permissionGroups.length }}</span>
            </div>
            <div class="header-right">
              <span class="header-title">멤버</span>
            </div>
          </div>

          <!-- API에서 가져온 권한 그룹들 -->
          <div v-for="group in permissionGroups" :key="group.accessGroupId" class="permission-group-card" :class="{ 'default-group': isDefaultGroup(group.accessGroupName) }">
            <div class="group-header" @click="viewPermissionGroupDetail(group)">
              <div class="left">
                <div class="group-icon">
                  <img 
                    :src="group.accessGroupName === '관리자 그룹' ? '/src/assets/icons/sidebar/admin.svg' : '/src/assets/icons/user/user_default_icon.svg'" 
                    :alt="group.accessGroupName"
                    class="group-icon-img"
                  />
                </div>
                <div class="group-info">
                  <h3 class="group-title" :class="{ 'default-group-title': isDefaultGroup(group.accessGroupName) }">
                    {{ group.accessGroupName }}
                    <span v-if="isDefaultGroup(group.accessGroupName)" class="default-badge">기본 그룹</span>
                  </h3>
                </div>
              </div>
              <div class="right" @click.stop>
                <div class="group-member-count">
                  <span class="member-count">{{ group.groupParticipantCount }}명</span>
                </div>
                <div class="group-actions">
                  <div class="action-menu" @click.stop="toggleActionMenu(group.accessGroupId)">
                    <span>⋯</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 액션 메뉴 -->
            <div v-if="activeActionMenu === group.accessGroupId" class="action-dropdown" @click.stop>
              <div class="action-item" @click="editGroup(group)">수정하기</div>
              <div class="action-item" @click="manageMembers(group)">사용자 추가/제거</div>
              <div 
                class="action-item delete" 
                :class="{ 'disabled': group.accessGroupName === '일반 유저 그룹' || group.accessGroupName === '관리자 그룹' }"
                @click="deleteGroup(group)"
              >
                삭제하기
              </div>
            </div>
          </div>

          <!-- 더보기 버튼 -->
          <div class="button-container">
            <div class="more-permissions-btn" @click="loadMorePermissions">
              <span>더보기</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 사용자 그룹 -->
      <div v-if="activeTab === 'user'" class="tab-content">
        <div class="content-header">
          <div class="header-left">
            <h1 class="main-title">사용자 그룹</h1>
            <p class="sub-title">사용자 그룹을 관리하고 멤버를 조회할 수 있습니다.</p>
          </div>
        </div>
        
        <!-- 검색 바 -->
        <div class="search-bar">
          <div class="search-group">
            <input 
              type="text" 
              placeholder="그룹명으로 검색" 
              class="group-search-input"
              v-model="groupSearchQuery"
              @keyup.enter="filterUserGroups"
            />
            <button class="search-btn" @click="filterUserGroups">검색</button>
          </div>
          <button class="create-group-btn" @click="createUserGroup">
            그룹 생성
          </button>
        </div>

        <!-- 사용자 그룹 목록 -->
        <div class="user-groups-list">
          <div 
            v-for="group in filteredUserGroups" 
            :key="group.id" 
            class="user-group-item"
          >
            <div class="group-info">
              <div class="user-group-icon"></div>
              <div class="group-details">
                <h3 class="group-name" @click="viewUserGroupDetail(group)">{{ group.name }}</h3>
                <p class="group-date">생성일: {{ group.createdAt }}</p>
              </div>
            </div>
            <div class="group-actions">
              <span class="member-count">{{ group.memberCount }}명</span>
              <button class="action-btn edit-btn" @click="editUserGroup(group)">
                수정
              </button>
              <button class="action-btn delete-btn" @click="deleteUserGroup(group)">
                삭제
              </button>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination">
          <button class="page-btn prev-btn">← 이전</button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <span class="page-ellipsis">...</span>
          <button class="page-btn">10</button>
          <button class="page-btn next-btn">다음 →</button>
        </div>
      </div>

      <!-- 대시보드 -->
      <div v-if="activeTab === 'dashboard'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">대시보드</h1>
          <p class="sub-title">워크스페이스의 현황을 확인하세요</p>
        </div>
        
        <!-- 프로젝트 스톤 마일스톤 섹션 -->
        <div class="dashboard-section milestone-section">
          <div class="section-header">
            <h2 class="section-title">프로젝트 스톤 마일스톤</h2>
            <p class="section-subtitle">프로젝트별 마일스톤 트리 구조</p>
          </div>
          
          <div v-if="loadingMilestones" class="loading-container">
            <div class="loading-spinner"></div>
            <p>마일스톤 데이터를 불러오는 중...</p>
          </div>
          
          <div v-else-if="projectMilestones.length === 0" class="no-data">
            <p>마일스톤 데이터가 없습니다.</p>
          </div>
          
          <!-- D3 트리 차트 -->
          <d3-tree-chart
            v-else
            :project-milestones="projectMilestones"
            class="tree-chart-wrapper"
          />
        </div>
        
        <!-- 워크스페이스별 프로젝트 현황 섹션 -->
        <div class="dashboard-section workspace-section">
          <div class="section-header">
            <h2 class="section-title">워크스페이스별 프로젝트 현황</h2>
            <p class="section-subtitle">프로젝트별 스톤 진행률 및 현황</p>
          </div>
          
          <!-- 로딩 상태 -->
          <div v-if="loadingWorkspaceProjects" class="loading-container">
            <div class="loading-spinner"></div>
            <p>프로젝트 현황을 불러오는 중...</p>
          </div>
          
          <!-- 데이터가 없을 때 -->
          <div v-else-if="!workspaceProjects || workspaceProjects.length === 0" class="no-data">
            <p>프로젝트 현황 데이터가 없습니다.</p>
          </div>
          
          <!-- 프로젝트 현황 카드들 -->
          <div v-else class="workspace-projects">
            <div class="project-cards-container">
              <div class="project-card">
                <div class="project-card-header">
                  <button class="nav-btn prev-btn">◀</button>
                  <button class="nav-btn next-btn">▶</button>
                </div>
                <div class="project-stats">
                  <div 
                    v-for="(project, index) in workspaceProjects" 
                    :key="project.projectId" 
                    class="stat-item"
                  >
                    <div class="circular-progress">
                      <div class="progress-ring">
                        <div 
                          class="progress-fill-ring" 
                          :style="{ '--progress': Math.round(project.milestone) + '%' }"
                        ></div>
                        <span class="progress-text">{{ Math.round(project.milestone) }}%</span>
                      </div>
                    </div>
                    <div class="stat-info">
                      <span class="stat-label">스톤 {{ project.stoneCount }}개</span>
                      <span class="project-name">{{ project.projectName }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 사용자 그룹별 프로젝트 현황 섹션 -->
        <div class="dashboard-section user-group-section">
          <div class="section-header">
            <h2 class="section-title">사용자 그룹별 프로젝트 현황</h2>
            <p class="section-subtitle">사용자 그룹별 프로젝트 수 및 진행 상태</p>
          </div>
          
          <!-- 로딩 상태 -->
          <div v-if="loadingUserGroupProgress" class="loading-container">
            <div class="loading-spinner"></div>
            <p>사용자 그룹별 프로젝트 현황을 불러오는 중...</p>
          </div>
          
          <!-- 데이터가 없을 때 -->
          <div v-else-if="!userGroupProgress || userGroupProgress.length === 0" class="no-data">
            <p>사용자 그룹별 프로젝트 현황 데이터가 없습니다.</p>
          </div>
          
          <!-- 사용자 그룹별 프로젝트 현황 -->
          <div v-else class="user-group-stats">
            <div 
              v-for="(group, index) in userGroupProgress" 
              :key="group.groupName" 
              class="group-stat-item"
            >
              <div class="group-circular-progress">
                <div class="group-progress-ring">
                  <div 
                    class="group-progress-fill-ring" 
                    :class="getGroupProgressClass(group.averageProgress)"
                    :style="{ '--progress': Math.round(group.averageProgress) + '%' }"
                  ></div>
                  <span class="group-progress-text">{{ Math.round(group.averageProgress) }}%</span>
                </div>
              </div>
              <div class="group-info">
                <span class="group-name">{{ group.groupName }}</span>
                <span class="group-count">{{ group.projectCount }}개 프로젝트</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 회원 관리 -->
      <div v-if="activeTab === 'member'" class="tab-content">
        <MemberManagement />
      </div>

      <!-- 워크스페이스 관리 -->
      <div v-if="activeTab === 'workspace'" class="tab-content">
        <div class="content-header">
          <h1 class="main-title">워크스페이스 관리</h1>
          <p class="sub-title">워크스페이스와 관련된 사항을 확인하세요</p>
        </div>
        
        <!-- 워크스페이스 정보 카드 -->
        <div class="workspace-info-card">
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>워크스페이스 정보를 불러오는 중...</p>
          </div>
          <div v-else class="workspace-details">
            <div class="detail-row">
              <div class="detail-item">
                <label>템플릿 종류</label>
                <div class="detail-value">{{ workspaceDetail.workspaceTemplates || 'Enterprise' }}</div>
              </div>
              <div class="detail-item workspace-name-item">
                <label>워크스페이스명</label>
                <div class="detail-value">
                  <span class="workspace-name-text">{{ workspaceDetail.workspaceName || 'Orbit' }}</span>
                  <button class="change-workspace-btn" @click="changeWorkspaceName">변경</button>
                </div>
              </div>
              <div class="detail-item">
                <label>생성시간</label>
                <div class="detail-value">{{ formatDate(workspaceDetail.createdAt) || '2024년 1월 15일' }}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <div class="detail-item">
                <label>프로젝트</label>
                <div class="detail-value">{{ workspaceStats.projects || 0 }}개</div>
              </div>
              <div class="detail-item">
                <label>스톤</label>
                <div class="detail-value">{{ workspaceStats.stones || 0 }}개</div>
              </div>
              <div class="detail-item">
                <label>task</label>
                <div class="detail-value">{{ workspaceStats.tasks || 0 }}개</div>
              </div>
              <div class="detail-item">
                <label>구성원 수</label>
                <div class="detail-value">{{ workspaceDetail.memberCount || 0 }}명</div>
              </div>
            </div>
            
            <!-- 사용량 통계 -->
            <div class="usage-stats">
              <h4 class="stats-title">사용량 통계</h4>
              
              <div class="storage-info">
                <div class="storage-label">스토리지: {{ formatStorage(workspaceDetail.currentStorage) }} / {{ formatStorage(workspaceDetail.maxStorage) }}</div>
                <div class="storage-bar">
                  <div class="storage-progress" :style="{ width: getStoragePercentage() + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 삭제 버튼 -->
        <div class="workspace-actions">
          <button class="action-btn delete-btn" @click="openDeleteWorkspaceModal">삭제</button>
        </div>
      </div>
    </div>
    
    <!-- 워크스페이스명 변경 모달 -->
    <div v-if="showWorkspaceNameModal" class="modal-overlay" @click="closeWorkspaceNameModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">워크스페이스 이름 변경</h3>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">새로운 워크스페이스 이름을 입력하세요</label>
            <input 
              v-model="newWorkspaceName" 
              type="text" 
              class="form-input" 
              placeholder="워크스페이스 이름을 입력하세요"
              @keyup.enter="confirmWorkspaceNameChange"
            />
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeWorkspaceNameModal">취소</button>
          <button 
            class="modal-btn confirm-btn" 
                   :class="{ 'disabled': !newWorkspaceName.trim() }"
                   :disabled="!newWorkspaceName.trim()"
                   @click="confirmWorkspaceNameChange"
            >
              확인
            </button>
        </div>
      </div>
    </div>
    
    <!-- 워크스페이스 삭제 모달 -->
    <DeleteWorkspaceModal
      v-model="showDeleteWorkspaceModal"
      :workspace-name="workspaceDetail.workspaceName"
      :workspace-id="workspaceDetail.workspaceId"
      @confirm-delete="confirmDeleteWorkspace"
    />
    
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import { workspaceWatcher } from '@/mixins/workspaceWatcher';
import MemberManagement from './MemberManagement.vue';
import DeleteWorkspaceModal from '../Workspace/DeleteWorkspaceModal.vue';
import StoneTreeNode from './StoneTreeNode.vue';
import D3TreeChart from './D3TreeChart.vue';

export default {
  name: "AdminDashboard",
  mixins: [workspaceWatcher],
  components: {
    MemberManagement,
    DeleteWorkspaceModal,
    StoneTreeNode,
    D3TreeChart
  },
  data() {
    return {
      activeTab: 'permission',
      permissionGroups: [],
      activeActionMenu: null,
      loading: false,
      currentPage: 0,
      totalPages: 1,
      workspaceStats: {
        projects: null,
        stones: null,
        tasks: null
      },
      workspaceDetail: {
        workspaceId: '',
        workspaceName: '',
        workspaceTemplates: '',
        createdAt: '',
        subscribe: null,
        memberCount: 0,
        currentStorage: 0,
        maxStorage: 0,
        projectCount: null,
        storageCount: null,
        taskCount: null
      },
      loading: false,
      showWorkspaceNameModal: false,
      newWorkspaceName: '',
      showDeleteWorkspaceModal: false,
      
      // 사용자 그룹 관련 데이터
      groupSearchQuery: '',
      userGroups: [],
      filteredUserGroups: [],
      
      // 마일스톤 관련 데이터
      projectMilestones: [],
      loadingMilestones: false,
      
      // 워크스페이스 프로젝트 현황 관련 데이터
      workspaceProjects: [],
      loadingWorkspaceProjects: false,
      
      // 사용자 그룹별 프로젝트 현황 관련 데이터
      userGroupProgress: [],
      loadingUserGroupProgress: false,
      
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  async mounted() {
    // PERSONAL 워크스페이스인 경우 접근 차단
    if (this.workspaceStore.isPersonalWorkspace) {
      alert('개인 워크스페이스에서는 관리자 페이지에 접근할 수 없습니다.');
      this.$router.push('/');
      return;
    }
    
    if (this.activeTab === 'permission') {
      await this.loadPermissionGroups();
    }
    
    // 바깥쪽 클릭 시 액션 메뉴 닫기
    document.addEventListener('click', this.handleOutsideClick);
  },
  
  beforeUnmount() {
    // 이벤트 리스너 제거
    document.removeEventListener('click', this.handleOutsideClick);
  },
  
  watch: {
    'workspaceStore.currentWorkspace': {
      handler(newWorkspace, oldWorkspace) {
        if (newWorkspace && newWorkspace.workspaceId !== oldWorkspace?.workspaceId) {
          if (this.activeTab === 'permission') {
            this.currentPage = 0;
            this.loadPermissionGroups();
          }
          if (this.activeTab === 'workspace') {
            this.loadWorkspaceDetail();
          }
        }
      },
      deep: true
    }
  },
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;
      // 모든 탭에서 active 클래스 제거
      document.querySelectorAll('.nav-tab').forEach(el => {
        el.classList.remove('active');
      });
      // 클릭된 탭에 active 클래스 추가
      event.target.classList.add('active');
      
      // 권한 그룹 탭이 활성화되면 데이터 로드
      if (tab === 'permission') {
        this.loadPermissionGroups();
      }
      
      // 워크스페이스 관리 탭이 활성화되면 워크스페이스 상세 정보 로드
      if (tab === 'workspace') {
        this.loadWorkspaceDetail();
      }
      
      // 사용자 그룹 탭이 활성화되면 사용자 그룹 목록 로드
      if (tab === 'user') {
        console.log('사용자 그룹 탭 활성화, loadUserGroups 호출');
        this.loadUserGroups();
      }
      
      // 대시보드 탭이 활성화되면 모든 데이터 로드
      if (tab === 'dashboard') {
        console.log('대시보드 탭 활성화, 데이터 로드 시작');
        this.loadProjectMilestones();
        this.loadWorkspaceProjects();
        this.loadUserGroupProgress();
      }
      
    },
    
    async loadPermissionGroups() {
      try {
        this.loading = true;
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123'; // 실제 사용자 ID로 교체 필요
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_1';
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/access/group-list/${workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            },
            params: {
              page: this.currentPage,
              size: 10
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          this.permissionGroups = response.data.result.content || [];
          this.totalPages = response.data.result.totalPages;
          this.permissionGroups = this.sortPermissionGroups(this.permissionGroups);
        }
      } catch (error) {
        console.error('권한 그룹 목록 로드 실패:', error);
        // 에러 발생 시 더미 데이터 사용
        this.permissionGroups = [
          {
            accessGroupId: "ws_acc_grp_1",
            accessGroupName: "관리자 그룹",
            createdAt: "2025-10-16T18:38:04.030423",
            groupParticipantCount: 1
          },
          {
            accessGroupId: "ws_acc_grp_2", 
            accessGroupName: "일반 유저 그룹",
            createdAt: "2025-10-16T18:38:04.046983",
            groupParticipantCount: 1
          }
        ];
        this.permissionGroups = this.sortPermissionGroups(this.permissionGroups);
      } finally {
        this.loading = false;
      }
    },
    
    async loadMorePermissions() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        await this.loadPermissionGroups();
      }
    },
    
    // 권한 그룹 정렬: 관리자 그룹 → 일반 유저 그룹 → 기타(이름 오름차순)
    sortPermissionGroups(groups) {
      const getPriority = (name) => {
        if (name === '관리자 그룹') return 0;
        if (name === '일반 유저 그룹') return 1;
        return 2;
      };
      return [...(groups || [])].sort((a, b) => {
        const pa = getPriority(a.accessGroupName);
        const pb = getPriority(b.accessGroupName);
        if (pa !== pb) return pa - pb;
        const an = a.accessGroupName || '';
        const bn = b.accessGroupName || '';
        return an.localeCompare(bn, 'ko');
      });
    },
    
    async loadWorkspaceDetail() {
      try {
        this.loading = true;
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_2';
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/workspace/${workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          this.workspaceDetail = response.data.result;
          
          // workspaceStats 업데이트
          this.workspaceStats = {
            projects: response.data.result.projectCount,
            stones: response.data.result.storageCount,
            tasks: response.data.result.taskCount
          };
        }
      } catch (error) {
        console.error('워크스페이스 상세 조회 실패:', error);
        // 에러 발생 시 기본값 사용
        this.workspaceDetail = {
          workspaceId: 'ws_2',
          workspaceName: '두번째 워크스페이스',
          workspaceTemplates: 'PRO',
          createdAt: '2025-10-21T15:54:09.763586',
          subscribe: null,
          memberCount: 1,
          currentStorage: 0,
          maxStorage: 53687091200,
          projectCount: null,
          storageCount: null,
          taskCount: null
        };
      } finally {
        this.loading = false;
      }
    },
    
    toggleActionMenu(groupId) {
      this.activeActionMenu = this.activeActionMenu === groupId ? null : groupId;
    },
    
    handleOutsideClick(event) {
      // 액션 메뉴가 열려있고, 클릭된 요소가 액션 메뉴나 관련 요소가 아닌 경우
      if (this.activeActionMenu && !event.target.closest('.action-menu') && !event.target.closest('.action-dropdown')) {
        this.activeActionMenu = null;
      }
    },
    
    createPermissionGroup() {
      // 권한 그룹 생성 페이지로 이동
      this.$router.push('/admin/create-permission-group');
    },
    
    editGroup(group) {
      // 권한 그룹 수정 페이지로 이동
      this.$router.push(`/admin/edit-permission-group/${group.accessGroupId}`);
      this.activeActionMenu = null;
    },
    
    manageMembers(group) {
      // 관리자 그룹만 변경 불가
      if (group.accessGroupName === '관리자 그룹') {
        alert('관리자 그룹은 변경할 수 없습니다.');
        this.activeActionMenu = null;
        return;
      }
      
      // 권한 그룹 사용자 추가/제거 페이지로 이동
      this.$router.push(`/admin/permission-group/${group.accessGroupId}/add-users`);
      this.activeActionMenu = null;
    },
    
    async deleteGroup(group) {
      // 기본 그룹 삭제 방지
      if (group.accessGroupName === '일반 유저 그룹' || group.accessGroupName === '관리자 그룹') {
        alert('기본 권한 그룹은 삭제할 수 없습니다.');
        this.activeActionMenu = null;
        return;
      }

      // 권한 그룹 삭제 확인
      if (confirm(`${group.accessGroupName} 그룹을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        try {
          const token = localStorage.getItem('token');
          const userId = localStorage.getItem('userId') || 'user123';
          
          const response = await axios.delete(
            `http://localhost:8080/workspace-service/access/${group.accessGroupId}/delete`,
            {
              headers: {
                'X-User-Id': userId,
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data.statusCode === 200) {
            alert('권한 그룹이 성공적으로 삭제되었습니다.');
            // 목록 새로고침
            await this.loadPermissionGroups();
          } else {
            alert('권한 그룹 삭제에 실패했습니다.');
          }
        } catch (error) {
          console.error('권한 그룹 삭제 실패:', error);
          
          // 백엔드에서 반환하는 구체적인 오류 메시지 처리
          if (error.response && error.response.data) {
            const errorMessage = error.response.data.statusMessage || error.response.data.message;
            if (errorMessage) {
              alert(`삭제 실패: ${errorMessage}`);
            } else {
              alert('권한 그룹 삭제 중 오류가 발생했습니다.');
            }
          } else {
            alert('권한 그룹 삭제 중 오류가 발생했습니다.');
          }
        } finally {
          this.activeActionMenu = null;
        }
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    formatStorage(bytes) {
      if (!bytes) return '0GB';
      const gb = bytes / (1024 * 1024 * 1024);
      return gb.toFixed(1) + 'GB';
    },
    
    getStoragePercentage() {
      if (!this.workspaceDetail.maxStorage || this.workspaceDetail.maxStorage === 0) return 0;
      return Math.round((this.workspaceDetail.currentStorage / this.workspaceDetail.maxStorage) * 100);
    },
    
    // 워크스페이스 변경 감지 메서드 오버라이드
    onWorkspaceChanged(workspaceData) {
      console.log('AdminDashboard: 워크스페이스 변경됨', workspaceData);
      
      // 권한 그룹 탭이 활성화되어 있으면 권한 그룹 새로고침
      if (this.activeTab === 'permission') {
        this.currentPage = 0;
        this.loadPermissionGroups();
      }
      
      // 워크스페이스 관리 탭이 활성화되어 있으면 워크스페이스 상세 정보 새로고침
      if (this.activeTab === 'workspace') {
        this.loadWorkspaceDetail();
      }
    },
    
    // 워크스페이스명 변경 버튼 클릭
    changeWorkspaceName() {
      this.newWorkspaceName = this.workspaceDetail.workspaceName || '';
      this.showWorkspaceNameModal = true;
    },
    
    // 모달 닫기
    closeWorkspaceNameModal() {
      this.showWorkspaceNameModal = false;
      this.newWorkspaceName = '';
    },
    
    // 워크스페이스명 변경 확인
    confirmWorkspaceNameChange() {
      if (!this.newWorkspaceName.trim()) return;
      
      if (this.newWorkspaceName.trim() === this.workspaceDetail.workspaceName) {
        this.closeWorkspaceNameModal();
        return;
      }
      
      this.updateWorkspaceName(this.newWorkspaceName.trim());
    },
    
    // 워크스페이스명 업데이트 API 호출
    async updateWorkspaceName(newName) {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_2';
        
        const response = await axios.patch(
          `http://localhost:8080/workspace-service/workspace/${workspaceId}/name`,
          { workspaceName: newName },
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          alert('워크스페이스명이 성공적으로 변경되었습니다.');
          
          // 워크스페이스 스토어 업데이트
          const currentWorkspace = this.workspaceStore.getCurrentWorkspace;
          if (currentWorkspace) {
            const updatedWorkspace = {
              ...currentWorkspace,
              workspaceName: newName
            };
            this.workspaceStore.setCurrentWorkspace(updatedWorkspace);
          }
          
          // 모달 닫기
          this.closeWorkspaceNameModal();
          // 워크스페이스 상세 정보 새로고침
          await this.loadWorkspaceDetail();
        } else {
          alert('워크스페이스명 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('워크스페이스명 변경 실패:', error);
        alert('워크스페이스명 변경 중 오류가 발생했습니다.');
      }
    },
    
    // 삭제 모달 열기
    openDeleteWorkspaceModal() {
      if (!this.workspaceDetail.workspaceId) {
        alert('워크스페이스 정보를 불러올 수 없습니다.');
        return;
      }
      this.showDeleteWorkspaceModal = true;
    },
    
    // 워크스페이스 삭제 확인
    async confirmDeleteWorkspace(workspaceData) {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || localStorage.getItem('id');
        
        const response = await axios.delete(
          `http://localhost:8080/workspace-service/workspace/${workspaceData.workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          // 삭제된 워크스페이스를 현재 워크스페이스에서 제거
          if (this.workspaceStore.getCurrentWorkspaceId === workspaceData.workspaceId) {
            // 다른 워크스페이스로 자동 이동
            await this.switchToAnotherWorkspace();
          }
          
          alert('워크스페이스가 성공적으로 삭제되었습니다.');
        }
      } catch (error) {
        console.error('워크스페이스 삭제 실패:', error);
        alert('워크스페이스 삭제 중 오류가 발생했습니다.');
      } finally {
        this.showDeleteWorkspaceModal = false;
      }
    },
    
    // 다른 워크스페이스로 자동 이동
    async switchToAnotherWorkspace() {
      try {
        // 워크스페이스 목록 새로고침
        const workspaces = await this.workspaceStore.loadWorkspaces();
        
        if (workspaces && workspaces.length > 0) {
          // 첫 번째 워크스페이스로 이동
          const newWorkspace = workspaces[0];
          this.workspaceStore.setCurrentWorkspace(newWorkspace);
          
          // 워크스페이스 상세 정보도 새로고침
          await this.loadWorkspaceDetail();
          
          console.log(`삭제된 워크스페이스에서 "${newWorkspace.workspaceName}"으로 자동 이동`);
        } else {
          // 워크스페이스가 없는 경우 메인 페이지로 이동
          this.workspaceStore.setCurrentWorkspace(null);
          this.$router.push('/');
        }
      } catch (error) {
        console.error('워크스페이스 전환 실패:', error);
        // 에러 발생 시 메인 페이지로 이동
        this.workspaceStore.setCurrentWorkspace(null);
        this.$router.push('/');
      }
    },
    
    // 사용자 그룹 목록 로드
    async loadUserGroups() {
      try {
        this.loading = true;
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || localStorage.getItem('id');
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId;
        
        console.log('API 호출 시작:', { token, userId, workspaceId });
        console.log('현재 워크스페이스 정보:', this.workspaceStore.getCurrentWorkspace);
        
        // GET 방식으로 사용자 그룹 목록 조회
        const url = `http://localhost:8080/workspace-service/groups?workspaceId=${workspaceId}`;
        console.log('API 요청 URL:', url);
        
        const response = await axios.get(url, {
          headers: {
            'X-User-Id': userId,
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.statusCode === 200) {
          console.log('API 응답 데이터:', response.data);
          console.log('result:', response.data.result);
          console.log('result 타입:', typeof response.data.result);
          console.log('result가 배열인가?', Array.isArray(response.data.result));
          
          // API 응답 데이터 구조 확인 및 변환
          let groups = [];
          
          // result가 배열인 경우
          if (Array.isArray(response.data.result)) {
            groups = response.data.result;
          }
          // result가 객체이고 content 속성이 있는 경우 (페이지네이션)
          else if (response.data.result && Array.isArray(response.data.result.content)) {
            groups = response.data.result.content;
          }
          // result가 객체이고 다른 배열 속성이 있는 경우
          else if (response.data.result && response.data.result.userGroups) {
            groups = response.data.result.userGroups;
          }
          // result가 객체이고 직접 그룹 배열이 있는 경우
          else if (response.data.result && response.data.result.groups) {
            groups = response.data.result.groups;
          }
          
          console.log('추출된 groups:', groups);
          
          this.userGroups = groups.map(group => ({
            id: group.userGroupId || group.groupId,
            name: group.userGroupName || group.groupName,
            createdAt: group.createdAt ? group.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            memberCount: group.userGroupParticipantsCount || group.participantCount || 0
          }));
          
          console.log('변환된 userGroups:', this.userGroups);
          
          this.filteredUserGroups = [...this.userGroups];
          console.log('filteredUserGroups:', this.filteredUserGroups);
        }
      } catch (error) {
        console.error('사용자 그룹 목록 로드 실패:', error);
        console.error('에러 상세:', error.response?.data);
        
        // 에러 발생 시 빈 배열로 설정
        this.userGroups = [];
        this.filteredUserGroups = [];
        
        // 사용자에게 에러 메시지 표시
        if (error.response?.data?.statusMessage) {
          alert(`사용자 그룹 목록을 불러오는데 실패했습니다: ${error.response.data.statusMessage}`);
        } else {
          alert('사용자 그룹 목록을 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.');
        }
      } finally {
        this.loading = false;
      }
    },
    
    // 사용자 그룹 검색 (API 호출)
    async filterUserGroups() {
      if (!this.groupSearchQuery.trim()) {
        // 검색어가 비어있으면 전체 목록 로드
        await this.loadUserGroups();
        return;
      }

      try {
        this.loading = true;
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || localStorage.getItem('id');
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId;
        
        const response = await axios.post(
          'http://localhost:8080/workspace-service/groups/search',
          {
            workspaceId: workspaceId,
            groupName: this.groupSearchQuery.trim()
          },
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          // 페이지 객체에서 content 추출
          const pageData = response.data.result;
          const groups = pageData.content || [];
          
          this.userGroups = groups.map(group => ({
            id: group.userGroupId || group.groupId,
            name: group.userGroupName || group.groupName,
            createdAt: group.createdAt ? group.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            memberCount: group.userGroupParticipantsCount || group.participantCount || 0
          }));
          
          this.filteredUserGroups = [...this.userGroups];
        }
      } catch (error) {
        console.error('사용자 그룹 검색 실패:', error);
        // 검색 실패 시 전체 목록으로 폴백
        await this.loadUserGroups();
      } finally {
        this.loading = false;
      }
    },
    
    // 사용자 그룹 수정
    async editUserGroup(group) {
      const newName = prompt('그룹명을 수정하세요:', group.name);
      if (newName && newName.trim() !== group.name) {
        try {
          const token = localStorage.getItem('token');
          const userId = localStorage.getItem('userId') || localStorage.getItem('id');
          
          const response = await axios.put(
            `http://localhost:8080/workspace-service/groups/${group.id}`,
            {
              groupName: newName.trim()
            },
            {
              headers: {
                'X-User-Id': userId,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.data.statusCode === 200) {
            // 로컬 데이터 업데이트
            group.name = newName.trim();
            this.filterUserGroups();
            alert('그룹명이 수정되었습니다.');
          } else {
            alert('그룹 수정에 실패했습니다.');
          }
        } catch (error) {
          console.error('사용자 그룹 수정 실패:', error);
          alert('그룹 수정에 실패했습니다.');
        }
      }
    },
    
    // 사용자 그룹 삭제
    async deleteUserGroup(group) {
      if (confirm(`"${group.name}" 그룹을 삭제하시겠습니까?`)) {
        try {
          const token = localStorage.getItem('token');
          const userId = localStorage.getItem('userId') || localStorage.getItem('id');
          
          const response = await axios.delete(
            `http://localhost:8080/workspace-service/groups/${group.id}`,
            {
              headers: {
                'X-User-Id': userId,
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data.statusCode === 200) {
            // 로컬 데이터에서 제거
            const index = this.userGroups.findIndex(g => g.id === group.id);
            if (index > -1) {
              this.userGroups.splice(index, 1);
              this.filterUserGroups();
            }
            alert('그룹이 삭제되었습니다.');
          } else {
            alert('그룹 삭제에 실패했습니다.');
          }
        } catch (error) {
          console.error('사용자 그룹 삭제 실패:', error);
          alert('그룹 삭제에 실패했습니다.');
        }
      }
    },
    
    // 사용자 그룹 상세 페이지로 이동
    viewUserGroupDetail(group) {
      this.$router.push(`/admin/user-group/${group.id}/detail`);
    },
    
    // 사용자 그룹 생성
    createUserGroup() {
      this.$router.push('/admin/create-group');
    },
    
    // 사용자 그룹 수정
    editUserGroup(group) {
      this.$router.push(`/admin/edit-group/${group.id}`);
    },
    
    // 사용자 그룹에 멤버 추가
    async addUsersToGroup(groupId, userIdList) {
      try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        
        const response = await axios.post(
          `http://localhost:8080/workspace-service/groups/${groupId}/grouping`,
          {
            userIdList: userIdList
          },
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 201) {
          alert('사용자 그룹에 멤버가 성공적으로 추가되었습니다.');
          // 사용자 그룹 목록 새로고침
          await this.loadUserGroups();
          return true;
        } else {
          alert('멤버 추가에 실패했습니다.');
          return false;
        }
      } catch (error) {
        console.error('사용자 그룹 멤버 추가 실패:', error);
        alert('멤버 추가 중 오류가 발생했습니다.');
        return false;
      }
    },
    
    // 기본 그룹인지 확인하는 메서드
    isDefaultGroup(groupName) {
      return groupName === '관리자 그룹' || groupName === '일반 유저 그룹';
    },
    
    // 권한 그룹 상세 조회
    viewPermissionGroupDetail(group) {
      this.$router.push(`/admin/permission-group/${group.accessGroupId}/detail`);
    },
    
    // 프로젝트 마일스톤 데이터 로드
    async loadProjectMilestones() {
      try {
        console.log('loadProjectMilestones 시작');
        this.loadingMilestones = true;
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_2';
        console.log('워크스페이스 ID:', workspaceId);
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/workspace/admin/tree/${workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          console.log('API 응답 성공:', response.data.result);
          this.projectMilestones = response.data.result;
          console.log('projectMilestones 설정됨:', this.projectMilestones);
        }
      } catch (error) {
        console.error('마일스톤 데이터 로드 실패:', error);
        // 테스트용 예시 데이터
        this.projectMilestones = [
          {
            projectId: 'pjt_1',
            projectName: '3번째 프로젝트!',
            milestoneResDtoList: [
              {
                stoneId: 'pjt_s_1',
                stoneName: '3번째 프로젝트',
                milestone: 75.0,
                endTime: '2025-11-15T18:00:00',
                children: [
                  {
                    stoneId: 'pjt_s_2',
                    stoneName: '백엔드5 수정 스톤',
                    milestone: 100.0,
                    endTime: '2025-10-20T18:00:00',
                    children: [
                      {
                        stoneId: 'pjt_s_3',
                        stoneName: '수정된 스톤 명',
                        milestone: 100.0,
                        endTime: '2025-10-23T18:00:00',
                        children: []
                      }
                    ]
                  },
                  {
                    stoneId: 'pjt_s_4',
                    stoneName: '개발',
                    milestone: 0.0,
                    endTime: '2025-10-30T18:00:00',
                    children: []
                  },
                  {
                    stoneId: 'pjt_s_5',
                    stoneName: '프론트',
                    milestone: 0.0,
                    endTime: '2025-10-30T18:00:00',
                    children: []
                  },
                  {
                    stoneId: 'pjt_s_6',
                    stoneName: '네트워크',
                    milestone: 100.0,
                    endTime: '2025-11-06T18:00:00',
                    children: [
                      {
                        stoneId: 'pjt_s_9',
                        stoneName: 'ㅎㅎㅎㅎㅎ',
                        milestone: 100.0,
                        endTime: '2025-10-31T18:00:00',
                        children: []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ];
        console.log('예시 데이터 설정됨:', this.projectMilestones);
      } finally {
        this.loadingMilestones = false;
        console.log('로딩 완료, loadingMilestones:', this.loadingMilestones);
      }
    },
    
    // 프로젝트 전체 진행률 계산
    getProjectProgress(project) {
      if (!project.milestoneResDtoList || project.milestoneResDtoList.length === 0) {
        return 0;
      }
      
      let totalProgress = 0;
      let totalCount = 0;
      
      const calculateProgress = (milestones) => {
        milestones.forEach(milestone => {
          totalProgress += milestone.milestone || 0;
          totalCount++;
          
          if (milestone.children && milestone.children.length > 0) {
            calculateProgress(milestone.children);
          }
        });
      };
      
      calculateProgress(project.milestoneResDtoList);
      
      return totalCount > 0 ? totalProgress / totalCount : 0;
    },
    
    // 워크스페이스 프로젝트 현황 데이터 로드
    async loadWorkspaceProjects() {
      try {
        console.log('loadWorkspaceProjects 시작');
        this.loadingWorkspaceProjects = true;
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_2';
        console.log('워크스페이스 ID:', workspaceId);
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/workspace/admin/${workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          console.log('워크스페이스 프로젝트 API 응답 성공:', response.data.result);
          this.workspaceProjects = response.data.result;
          console.log('workspaceProjects 설정됨:', this.workspaceProjects);
        }
      } catch (error) {
        console.error('워크스페이스 프로젝트 데이터 로드 실패:', error);
        // 테스트용 예시 데이터
        this.workspaceProjects = [
          {
            projectId: 'pjt_1',
            projectName: '3번째 프로젝트!',
            milestone: 0.0,
            stoneCount: 6,
            completedCount: 0
          },
          {
            projectId: 'pjt_2',
            projectName: '새로운 프로젝트',
            milestone: 75.5,
            stoneCount: 10,
            completedCount: 7
          },
          {
            projectId: 'pjt_3',
            projectName: '완료된 프로젝트',
            milestone: 100.0,
            stoneCount: 5,
            completedCount: 5
          }
        ];
        console.log('예시 워크스페이스 프로젝트 데이터 설정됨:', this.workspaceProjects);
      } finally {
        this.loadingWorkspaceProjects = false;
        console.log('워크스페이스 프로젝트 로딩 완료, loadingWorkspaceProjects:', this.loadingWorkspaceProjects);
      }
    },
    
    // 사용자 그룹별 프로젝트 현황 데이터 로드
    async loadUserGroupProgress() {
      try {
        console.log('loadUserGroupProgress 시작');
        this.loadingUserGroupProgress = true;
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_2';
        console.log('워크스페이스 ID:', workspaceId);
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/workspace/admin/group-progress/${workspaceId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          console.log('사용자 그룹별 프로젝트 현황 API 응답 성공:', response.data.result);
          this.userGroupProgress = response.data.result;
          console.log('userGroupProgress 설정됨:', this.userGroupProgress);
        }
      } catch (error) {
        console.error('사용자 그룹별 프로젝트 현황 데이터 로드 실패:', error);
        // 테스트용 예시 데이터
        this.userGroupProgress = [
          {
            groupName: '관리팀',
            projectCount: 1,
            averageProgress: 75.0
          },
          {
            groupName: '생산팀',
            projectCount: 1,
            averageProgress: 75.0
          },
          {
            groupName: '개발팀',
            projectCount: 3,
            averageProgress: 60.5
          },
          {
            groupName: '디자인팀',
            projectCount: 2,
            averageProgress: 45.0
          }
        ];
        console.log('예시 사용자 그룹별 프로젝트 현황 데이터 설정됨:', this.userGroupProgress);
      } finally {
        this.loadingUserGroupProgress = false;
        console.log('사용자 그룹별 프로젝트 현황 로딩 완료, loadingUserGroupProgress:', this.loadingUserGroupProgress);
      }
    },
    
    // 그룹 진행률에 따른 색상 클래스 결정
    getGroupProgressClass(progress) {
      const roundedProgress = Math.round(progress);
      if (roundedProgress === 100) {
        return 'progress-completed';
      } else if (roundedProgress === 0) {
        return 'progress-not-started';
      } else {
        return 'progress-in-progress';
      }
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  background: #F5F5F5 !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

.admin-header {
  background: #F5F5F5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  flex-shrink: 0;
  overflow-x: auto;
  z-index: 200;
}

.admin-nav-tabs {
  display: flex;
  gap: 0;
  flex-wrap: nowrap;
  width: 100%;
  justify-content: space-between;
}

.nav-tab {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  cursor: pointer;
  padding: 10px 8px;
  border-bottom: 4px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
  flex: 1;
  text-align: center;
}

.nav-tab:hover {
  color: #FFDD44;
}

.nav-tab.active {
  color: #1C0F0F;
  border-bottom-color: #FFDD44;
}

.admin-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: #F5F5F5;
}

.tab-content {
  width: 100%;
  height: 100%;
}

.content-header {
  margin-bottom: 30px;
  text-align: left;
}

.main-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 24px;
  line-height: 28px;
  color: #1C0F0F;
  margin: 0 0 15px 0;
  text-align: left;
}

.sub-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: #666666;
  margin: 0;
  text-align: left;
}

.admin-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-width: 100%;
}

.admin-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  max-width: 100%;
}

.admin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.admin-card h3 {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: #1C0F0F;
  margin: 0 0 15px 0;
}

.admin-card p {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #666666;
  margin: 6px 0;
}


@media (max-width: 1200px) {
  .admin-dashboard {
    left: 240px;
    width: calc(100vw - 240px);
  }
  
  .nav-tab {
    font-size: 18px;
    line-height: 22px;
    padding: 8px 6px;
  }
  
  .admin-cards {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    left: 0;
    top: 83px;
    width: 100vw;
    height: calc(100vh - 83px);
  }
  
  .admin-nav-tabs {
    flex-direction: column;
    gap: 5px;
  }
  
  .nav-tab {
    font-size: 16px;
    line-height: 20px;
    padding: 8px 12px;
    flex: none;
    text-align: left;
  }
  
  .admin-content {
    padding: 20px;
  }
  
  .admin-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .admin-card {
    padding: 20px;
  }
}

/* 권한 그룹 관련 스타일 */
.permission-groups-container {
  max-width: 100%;
  margin: 0 auto;
}

.button-container {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.permission-groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
}

.header-left {
  flex: 1;
  text-align: left;
}

.header-right {
  flex: 1;
  text-align: right;
  padding-right: 60px;
}

.header-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
}

.permission-group-card {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.permission-group-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.default-group {
  background: #F0F8FF;
  border: 1px solid #4A90E2;
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.1);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-header:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.group-icon {
  width: 24px;
  height: 24px;
  margin-right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  filter: brightness(0);
}

.default-group .group-icon-img {
  filter: brightness(0) saturate(100%) invert(40%) sepia(100%) saturate(2000%) hue-rotate(200deg) brightness(100%) contrast(100%);
}

.group-info {
  flex-grow: 1;
  text-align: left;
}

.group-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.default-group-title {
  color: #4A90E2 !important;
}

.default-badge {
  background: #4A90E2;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 12px;
}

.group-member-count {
  margin-left: 0;
}

.member-count {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
}

.group-arrow {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin-left: 16px;
}

.group-actions {
  position: relative;
}

.action-menu {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-menu:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-menu span {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
}

.action-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
}

.action-item {
  padding: 12px 16px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #000000;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #DDDDDD;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-item.delete {
  color: #FF4444;
}

.action-item.delete.disabled {
  color: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.6;
}

.action-item.delete.disabled:hover {
  background: transparent;
}

.create-permission-btn,
.more-permissions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  margin: 8px 0;
  background: #FFE364;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
  text-align: center;
  width: 200px;
}

.create-permission-btn:hover,
.more-permissions-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}

.btn-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 16px;
  font-weight: bold;
}

/* 워크스페이스 관리 관련 스타일 */
.workspace-info-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}


.workspace-details {
  margin-bottom: 25px;
}

.detail-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.detail-item {
  flex: 1;
  min-width: 150px;
}

.workspace-name-item {
  flex: 2; /* 워크스페이스명 박스를 2배로 늘림 */
}

.detail-item label {
  display: block;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 21px;
  color: #666666;
  margin-bottom: 8px;
  text-align: left;
}

.detail-value {
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  padding: 12px 16px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  min-height: 19px;
}

.workspace-name-item .detail-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.workspace-name-text {
  flex: 1;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
}

.change-workspace-btn {
  padding: 4px 8px;
  background: #FFE364;
  border: none;
  border-radius: 3px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 11px;
  line-height: 13px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-left: 8px;
}

.change-workspace-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}

.change-workspace-btn:active {
  transform: translateY(0);
}


.workspace-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  margin-left: auto;
  width: fit-content;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.change-btn {
  background: #FFE364;
  color: #1C0F0F;
}

.change-btn:hover {
  background: #FFDD44;
}

.delete-btn {
  background: #FFE364;
  color: #1C0F0F;
  font-size: 16px;
  line-height: 19px;
  padding: 12px 20px;
}

.delete-btn:hover {
  background: #FFDD44;
}


.usage-stats {
  margin-top: 20px;
  padding: 15px;
}

.stats-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  margin: 0 0 15px 0;
}

.storage-info {
  margin-bottom: 20px;
}

.storage-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
  margin-bottom: 8px;
}

.storage-bar {
  width: 100%;
  height: 6px;
  background: #E9ECEF;
  border-radius: 3px;
  overflow: hidden;
}

.storage-progress {
  height: 100%;
  background: #FFDD44;
  border-radius: 3px;
  transition: width 0.3s ease;
}


@media (max-width: 768px) {
  .detail-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .detail-item {
    min-width: auto;
  }
  
  /* 4개 항목이 한 줄에 들어가는 경우를 위한 조정 */
  .detail-row:last-child {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .workspace-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-btn {
    text-align: center;
  }
  
  @media (max-width: 600px) {
    .detail-row:last-child {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 480px) {
  .permission-group-card {
    margin-bottom: 6px;
  }
  
  .group-header {
    padding: 12px 16px;
  }
  
  .group-title {
    font-size: 14px;
    line-height: 17px;
  }
  
  .group-description {
    font-size: 12px;
    line-height: 15px;
  }
  
  .workspace-info-card {
    padding: 20px;
  }
  
  .workspace-name-item .detail-value {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .workspace-name-text {
    text-align: center;
  }
  
  .change-workspace-btn {
    width: 100%;
    text-align: center;
    margin-left: 0;
  }
}

/* 로딩 스타일 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #FFDD44;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
  margin: 0;
}

/* 워크스페이스명 변경 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}


.modal-content {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #E9ECEF;
  margin-bottom: 20px;
}

.modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0 0 20px 0;
}

.modal-body {
  padding: 0 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  background: #FFFFFF;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #FFDD44;
  box-shadow: 0 0 0 2px rgba(255, 221, 68, 0.2);
}

.form-input::placeholder {
  color: #757575;
}


.modal-footer {
  padding: 20px 24px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #E9ECEF;
  margin-top: 20px;
}

.modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.cancel-btn {
  background: #F8F9FA;
  color: #666666;
  border: 1px solid #E9ECEF;
}

.cancel-btn:hover {
  background: #E9ECEF;
}

.confirm-btn {
  background: #FFDD44;
  color: #1C0F0F;
  border: 1px solid #FFDD44;
}

.confirm-btn:hover:not(.disabled) {
  background: #FFE364;
  transform: translateY(-1px);
}

.confirm-btn.disabled {
  background: #E9ECEF;
  color: #ADB5BD;
  border-color: #E9ECEF;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-btn {
    width: 100%;
  }
}

/* 사용자 그룹 관련 스타일 */
.content-header {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  align-items: center;
  justify-content: space-between;
}

.search-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.create-group-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Pretendard', sans-serif;
}

.create-group-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}

.group-search-input {
  width: 300px;
  height: 42px;
  padding: 0 17px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #FFFFFF;
  font-size: 14px;
  color: #757575;
  outline: none;
  font-family: 'Pretendard', sans-serif;
}

.group-search-input::placeholder {
  color: #757575;
}

.search-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Pretendard', sans-serif;
}

.search-btn:hover {
  background: #FFDD44;
}

.user-groups-list {
  margin-bottom: 30px;
}

.user-group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 10px;
  transition: background-color 0.2s;
}

.user-group-item:hover {
  background: #F8F9FA;
}

.group-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-group-icon {
  width: 20px;
  height: 20px;
  background: #2A2828;
  border-radius: 2px;
  margin-right: 15px;
}

.group-details {
  flex: 1;
}

.group-name {
  font-size: 18px;
  font-weight: 700;
  color: #1C0F0F;
  margin: 0 0 5px 0;
  font-family: 'Pretendard', sans-serif;
  cursor: pointer;
  transition: color 0.2s;
}

.group-name:hover {
  color: #007bff;
  text-decoration: underline;
}

.group-date {
  font-size: 12px;
  color: #999999;
  margin: 0;
  font-family: 'Pretendard', sans-serif;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.member-count {
  font-size: 16px;
  font-weight: 700;
  color: #1C0F0F;
  font-family: 'Pretendard', sans-serif;
}

.action-btn {
  padding: 6px 8px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #F5F5F5;
  color: #666666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Pretendard', sans-serif;
  width: 50px;
  height: 28px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.action-btn:hover {
  background: #E9ECEF;
}

.delete-btn:hover {
  background: #ffebee;
  color: #d32f2f;
  border-color: #ffcdd2;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  padding: 15px;
}

.page-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-family: 'Pretendard', sans-serif;
}

.page-btn:hover {
  background: #E9ECEF;
}

.page-btn.active {
  background: #FFFFFF;
  color: #1C0F0F;
  font-weight: 700;
}

.page-ellipsis {
  color: #666666;
  font-size: 14px;
  font-family: 'Pretendard', sans-serif;
}

/* 대시보드 섹션 스타일 */
.dashboard-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 25px;
}

.section-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 29px;
  color: #1C0F0F;
  margin: 0 0 8px 0;
}

.section-subtitle {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
  margin: 0;
}

/* 프로젝트 스톤 마일스톤 섹션 */
.milestone-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
}

.milestone-tree {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.project-node {
  flex: 1;
  min-width: 300px;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  padding: 20px;
  position: relative;
}

.project-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.project-progress-bar {
  width: 100%;
  height: 20px;
  background: #E3F2FD;
  border: 2px solid #2196F3;
  border-radius: 10px;
  overflow: hidden;
  margin-right: 15px;
  position: relative;
}

.project-progress-bar .progress-fill {
  height: 100%;
  background: #2196F3;
  border-radius: 8px;
  transition: width 0.3s ease;
}

.project-name {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1976D2;
  text-align: center;
  z-index: 1;
}

.stones-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stone-tree {
  margin-bottom: 15px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666666;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
}

.tree-chart-wrapper {
  width: 100%;
  height: 800px; /* 세로 트리에 맞게 높이 증가 */
  margin-top: 20px;
}

/* 워크스페이스별 프로젝트 현황 섹션 */
.workspace-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
}

.workspace-projects {
  display: flex;
  justify-content: center;
}

.project-cards-container {
  width: 100%;
  max-width: 800px;
}

.project-card {
  background: #F8F9FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  padding: 20px;
}

.project-card-header {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.nav-btn {
  width: 40px;
  height: 40px;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #E9ECEF;
}

.project-stats {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 200px;
  position: relative;
  padding: 20px 10px;
  box-sizing: border-box;
}

.circular-progress {
  position: relative;
  width: 100px;
  height: 100px;
  order: 1;
}

.progress-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #F8F9FA;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 8px solid #E0E0E0;
  box-sizing: border-box;
}

.progress-fill-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  width: calc(100% + 16px);
  height: calc(100% + 16px);
  border-radius: 50%;
  background: conic-gradient(from -90deg, #4CAF50 0deg, #4CAF50 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
  mask: radial-gradient(circle at center, transparent 40%, black 40%);
  -webkit-mask: radial-gradient(circle at center, transparent 40%, black 40%);
  z-index: 1;
}

/* 프로젝트별 색상 (동적으로 적용) */
.stat-item:nth-child(1) .progress-fill-ring {
  background: conic-gradient(from -90deg, #4CAF50 0deg, #4CAF50 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

.stat-item:nth-child(2) .progress-fill-ring {
  background: conic-gradient(from -90deg, #FF9800 0deg, #FF9800 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

.stat-item:nth-child(3) .progress-fill-ring {
  background: conic-gradient(from -90deg, #9C27B0 0deg, #9C27B0 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

.stat-item:nth-child(4) .progress-fill-ring {
  background: conic-gradient(from -90deg, #2196F3 0deg, #2196F3 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

.stat-item:nth-child(5) .progress-fill-ring {
  background: conic-gradient(from -90deg, #F44336 0deg, #F44336 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

.progress-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: #000000;
  z-index: 2;
  position: relative;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 4px;
  order: 2;
}

.stat-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
}

.project-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  color: #1C0F0F;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  text-align: center;
  margin-top: 15px;
  order: 3;
}

/* 사용자 그룹별 프로젝트 현황 섹션 */
.user-group-section {
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
}

.user-group-stats {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.group-stat-item {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 20px;
  background: #F8F9FA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  min-height: 140px;
  text-align: center;
}


.group-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  order: 2;
}

.group-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
  text-align: center;
}

.group-count {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
  text-align: center;
}

.group-progress {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  color: #1C0F0F;
  margin-top: 4px;
  display: block;
}

/* 그룹별 도넛 모양 진행률 게이지 */
.group-circular-progress {
  position: relative;
  width: 80px;
  height: 80px;
  order: 1;
}

.group-progress-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #F8F9FA;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6px solid #E0E0E0;
  box-sizing: border-box;
}

.group-progress-fill-ring {
  position: absolute;
  top: -6px;
  left: -6px;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  border-radius: 50%;
  mask: radial-gradient(circle at center, transparent 40%, black 40%);
  -webkit-mask: radial-gradient(circle at center, transparent 40%, black 40%);
  z-index: 1;
}

.group-progress-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 16px;
  color: #000000;
  z-index: 2;
  position: relative;
}

/* 그룹 진행률에 따른 동적 색상 */
.group-progress-fill-ring.progress-completed {
  background: conic-gradient(from -90deg, #4CAF50 0deg, #4CAF50 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

.group-progress-fill-ring.progress-in-progress {
  background: conic-gradient(from -90deg, #FF9800 0deg, #FF9800 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

.group-progress-fill-ring.progress-not-started {
  background: conic-gradient(from -90deg, #F44336 0deg, #F44336 calc(var(--progress) * 3.6deg), #E0E0E0 calc(var(--progress) * 3.6deg), #E0E0E0 360deg);
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .milestone-tree {
    flex-direction: column;
    gap: 20px;
  }
  
  .project-stats {
    justify-content: center;
  }
  
  .user-group-stats {
    flex-direction: column;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-section {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 20px;
    line-height: 24px;
  }
  
  
  .project-stats {
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }
  
  .group-stat-item {
    min-width: auto;
  }
}
</style>
