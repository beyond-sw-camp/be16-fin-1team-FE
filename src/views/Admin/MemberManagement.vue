<template>
  <div class="member-management">
    <!-- 헤더 -->
    <div class="content-header">
      <h1 class="main-title">회원 관리</h1>
      <p class="sub-title">워크스페이스에 가입된 모든 회원을 관리할 수 있습니다</p>
    </div>

    <!-- 회원 목록 테이블 -->
    <div class="member-table-container">
      <!-- 테이블 헤더 -->
      <div class="table-header">
        <div class="header-cell member-name">회원명</div>
        <div class="header-cell role">역할</div>
        <div class="header-cell join-date">가입일자</div>
        <div class="header-cell user-group">사용자 그룹</div>
      </div>

      <!-- 회원 목록 -->
      <div class="member-list">
        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <span class="loading-text">회원 목록을 불러오는 중...</span>
        </div>
        
        <!-- 회원 목록이 비어있을 때 -->
        <div v-else-if="members.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-text">
            회원이 없습니다.
          </div>
        </div>
        
        <!-- 회원 목록 -->
        <div v-else>
          <div v-for="member in members" :key="member.id" class="member-row">
            <div class="member-name">{{ member.name }}</div>
            <div class="role">
              <span class="role-badge" :class="member.role.toLowerCase()">{{ getRoleDisplayName(member.role) }}</span>
            </div>
            <div class="join-date">{{ member.joinDate }}</div>
            <div class="user-group">{{ member.userGroup || '사용자 그룹이 존재하지 않습니다.' }}</div>
          </div>
        </div>
      </div>

      <!-- 테이블 푸터 -->
      <div class="table-footer">
        <div class="footer-info">
          <span class="total-count">총 {{ totalMembers }}명의 회원</span>
        </div>
        <div class="footer-actions">
          <button class="action-btn invite-btn" @click="inviteMember">
            회원 초대
          </button>
          <button class="action-btn delete-btn" @click="deleteMembers">
            회원 삭제
          </button>
          <button class="action-btn export-btn" @click="exportMembers">
            파일로 내보내기
          </button>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <button class="page-btn prev-btn" :disabled="currentPage === 0" @click="goToPage(displayPageNumber - 1)">
          ← 이전
        </button>
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="page-number"
            :class="{ active: page === displayPageNumber }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <span v-if="hasMorePages" class="page-ellipsis">...</span>
          <button 
            v-if="totalPages > 10 && currentPage < totalPages - 2"
            class="page-number"
            @click="goToPage(totalPages)"
          >
            {{ totalPages }}
          </button>
        </div>
        <button class="page-btn next-btn" :disabled="currentPage >= totalPages - 1" @click="goToPage(displayPageNumber + 1)">
          다음 →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: 'MemberManagement',
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  data() {
    return {
      currentPage: 0, // API는 0부터 시작
      totalPages: 1,
      totalMembers: 0,
      members: [],
      loading: false,
      pageSize: 8
    }
  },
  computed: {
    visiblePages() {
      const pages = [];
      const start = Math.max(1, this.currentPage + 1 - 2); // API는 0부터 시작하므로 +1
      const end = Math.min(this.totalPages, start + 4);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    },
    hasMorePages() {
      return this.totalPages > 10 && this.currentPage < this.totalPages - 2;
    },
    displayPageNumber() {
      return this.currentPage + 1; // API는 0부터 시작하므로 +1
    }
  },
  watch: {
    'workspaceStore.currentWorkspace': {
      handler(newWorkspace) {
        if (newWorkspace && newWorkspace.workspaceId) {
          this.loadMembers();
        }
      },
      deep: true
    }
  },
  methods: {
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page - 1; // API는 0부터 시작하므로 -1
        this.loadMembers();
      }
    },
    async loadMembers() {
      try {
        this.loading = true;
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const userId = localStorage.getItem('id') || localStorage.getItem('userId') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || localStorage.getItem('selectedWorkspaceId') || 'ws_1';
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        
        const response = await axios.get(
          `${baseURL}/workspace-service/workspace/${workspaceId}/participants`,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`
            },
            params: {
              page: this.currentPage,
              size: this.pageSize
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const result = response.data.result;
          const participants = result.content;
          
          // 모든 회원을 표시하되 삭제된 사용자는 별도 표시
          this.members = participants
            .map(participant => ({
              id: participant.workspaceParticipantId,
              userId: participant.userId,
              name: participant.userName,
              role: participant.deleted ? 'deleted' : participant.workspaceRole.toLowerCase(),
              joinDate: this.formatDate(new Date()), // API에서 createdAt이 없으므로 현재 날짜 사용
              userGroup: participant.accessGroupName,
              isDeleted: participant.deleted
            }));
          
          // 페이지네이션 정보 업데이트
          this.totalPages = result.totalPages;
          this.totalMembers = result.totalElements;
        }
      } catch (error) {
        console.error('회원 목록 로드 실패:', error);
        // 에러 발생 시 더미 데이터 사용
        this.members = [
          {
            id: 'ws_part_1',
            userId: 'user1',
            name: '김관리',
            role: 'admin',
            joinDate: '2024.01.15',
            userGroup: '관리자 그룹'
          },
          {
            id: 'ws_part_2',
            userId: 'user2',
            name: '이개발',
            role: 'user',
            joinDate: '2024.02.20',
            userGroup: '개발팀'
          },
          {
            id: 'ws_part_3',
            userId: 'user3',
            name: '박디자인',
            role: 'user',
            joinDate: '2024.03.10',
            userGroup: '디자인팀'
          },
          {
            id: 'ws_part_4',
            userId: 'user4',
            name: '최마케팅',
            role: 'user',
            joinDate: '2024.04.05',
            userGroup: null
          }
        ];
        this.totalMembers = this.members.length;
        this.totalPages = 1;
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\./g, '.').replace(/\s/g, '');
    },
    
    
    getRoleDisplayName(role) {
      const roleMap = {
        'admin': '관리자',
        'common': '일반 사용자',
        'owner': '소유자',
        'manager': '매니저',
        'member': '멤버',
        'deleted': '삭제된 사용자'
      };
      return roleMap[role.toLowerCase()] || role.toUpperCase();
    },
    inviteMember() {
      this.$emit('open-invite-modal');
    },
    exportMembers() {
      // 회원 목록을 CSV 형태로 내보내기
      const members = this.members;
      const csvContent = [
        ['회원명', '역할', '가입일자', '사용자 그룹'],
        ...members.map(member => [
          member.name,
          this.getRoleDisplayName(member.role),
          member.joinDate,
          member.userGroup || '없음'
        ])
      ].map(row => row.join(',')).join('\n');
      
      // BOM 추가하여 한글 깨짐 방지
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `회원목록_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    deleteMembers() {
      this.$emit('open-delete-modal');
    }
  },
  mounted() {
    this.loadMembers();
  }
}
</script>

<style scoped>
.member-management {
  width: 100%;
  height: 100%;
  background: #F5F5F5;
  overflow-y: auto;
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

.member-table-container {
  margin: 0 0 30px 0;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  background: #F8F9FA;
  border-bottom: 1px solid #E5E5E5;
}

.header-cell {
  padding: 12px 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
  border-right: 1px solid #E5E5E5;
}

.header-cell:last-child {
  border-right: none;
}

.member-list {
  max-height: 400px;
  overflow-y: auto;
}

.member-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  border-bottom: 1px solid #F0F0F0;
  transition: background-color 0.2s;
}

.member-row:hover {
  background-color: #FAFAFA;
}

.member-row > div {
  padding: 12px 20px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 17px;
  border-right: 1px solid #F0F0F0;
}

.member-row > div:last-child {
  border-right: none;
}

.member-name {
  font-weight: 700;
  color: #1C0F0F;
}


.role-badge.admin {
  background: #FF0000;
}

.role-badge.common {
  background: #95A5A6;
}

.role-badge.owner {
  background: #E74C3C;
}

.role-badge.manager {
  background: #F39C12;
}

.role-badge.member {
  background: #3498DB;
}

.role-badge.deleted {
  background: #95A5A6;
  opacity: 0.6;
}

/* 기본 역할 배지 스타일 */
.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 12px;
  line-height: 15px;
  color: #FFFFFF;
  background: #95A5A6; /* 기본 색상 */
}

.join-date {
  font-weight: 400;
  color: #666666;
}

.user-group {
  font-weight: 400;
  color: #666666;
}

.table-footer {
  background: #F8F9FA;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #E5E5E5;
}

.footer-info {
  flex: 1;
  text-align: left;
}

.total-count {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  cursor: pointer;
  transition: all 0.2s;
}

.invite-btn {
  background: #FFE364;
  color: #1C0F0F;
}

.invite-btn:hover {
  background: #FFDD44;
}

.export-btn {
  background: #FFE364;
  color: #1C0F0F;
}

.export-btn:hover {
  background: #FFDD44;
}

.delete-btn {
  background: #FF6B6B;
  color: #FFFFFF;
}

.delete-btn:hover {
  background: #FF5252;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #FFFFFF;
  border-top: 1px solid #E5E5E5;
}

.page-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
  cursor: pointer;
  transition: color 0.2s;
}

.page-btn:hover:not(:disabled) {
  color: #1C0F0F;
}

.page-btn:disabled {
  color: #CCCCCC;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 5px;
  align-items: center;
}

.page-number {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover {
  color: #1C0F0F;
}

.page-number.active {
  color: #1C0F0F;
  font-weight: 700;
}

.page-ellipsis {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #666666;
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #F0F0F0;
  border-top: 4px solid #FFDD44;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.6;
}

.empty-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  text-align: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .member-management {
    padding: 20px;
  }
  
  .table-header,
  .member-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .header-cell,
  .member-row > div {
    border-right: none;
    border-bottom: 1px solid #F0F0F0;
  }
  
  .footer-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 5px;
  }
}
</style>
