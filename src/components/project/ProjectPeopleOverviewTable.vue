<template>
  <div class="people-overview-section">
    <div class="pis-header with-inset-hr">
      <h3 class="pis-title">인원 현황</h3>
    </div>
    
    <div v-if="loading" class="people-overview-loading">
      <p>인원 정보를 불러오는 중...</p>
    </div>
    
    <div v-else-if="error" class="people-overview-error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="!overview || !overview.people || overview.people.length === 0" class="people-overview-empty">
      <p>데이터가 없습니다.</p>
    </div>
    
    <div v-else class="people-overview-content">
      <!-- 메트릭 카드 -->
      <div class="people-metrics-grid">
        <div class="people-metric-card">
          <div class="people-metric-value">{{ overview.totalPeopleCount || 0 }}</div>
          <div class="people-metric-label">총 인원</div>
        </div>
        <div class="people-metric-card">
          <div class="people-metric-value">{{ overview.managerCount || 0 }}</div>
          <div class="people-metric-label">담당자 수</div>
        </div>
        <div class="people-metric-card">
          <div class="people-metric-value">{{ overview.participantOnlyCount || 0 }}</div>
          <div class="people-metric-label">참여만 하는 인원 수</div>
        </div>
      </div>
      
      <!-- 테이블 -->
      <div class="people-table-container">
        <div v-if="filteredAndSortedPeople.length === 0" class="people-table-empty">
          <p v-if="selectedParticipatingStoneFilter">
            선택한 스톤에 참여하는 인원이 없습니다.
          </p>
          <p v-else>데이터가 없습니다.</p>
        </div>
        <table v-else class="people-table">
          <colgroup>
            <col style="width:12%">
            <col style="width:9%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:10%">
            <col style="width:24.5%">
            <col style="width:24.5%">
          </colgroup>
          <thead>
            <tr>
              <th class="email-col">회원 이메일</th>
              <th class="name-col">이름</th>
              <th 
                class="count-col sortable" 
                :class="{ 'sort-asc': sortColumn === 'ownedStoneCount' && sortOrder === 'asc', 'sort-desc': sortColumn === 'ownedStoneCount' && sortOrder === 'desc' }"
                @click="handleSort('ownedStoneCount')"
              >
                담당 스톤 수
                <span v-if="sortColumn === 'ownedStoneCount'" class="sort-icon">
                  {{ sortOrder === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th 
                class="count-col sortable"
                :class="{ 'sort-asc': sortColumn === 'participatingStoneCount' && sortOrder === 'asc', 'sort-desc': sortColumn === 'participatingStoneCount' && sortOrder === 'desc' }"
                @click="handleSort('participatingStoneCount')"
              >
                참여 스톤 수
                <span v-if="sortColumn === 'participatingStoneCount'" class="sort-icon">
                  {{ sortOrder === 'asc' ? '▲' : '▼' }}
                </span>
              </th>
              <th class="task-col">담당 태스크<span class="th-sub">({{ taskHeaderFractionLabel }})</span></th>
              <th class="stones-col">담당 스톤</th>
              <th class="stones-col">
                <div class="header-with-filter-inline">
                  <span>참여 스톤</span>
                  <select 
                    v-model="selectedParticipatingStoneFilter" 
                    class="header-filter-select-inline"
                    @change="handleFilterChange"
                    @click.stop
                  >
                    <option value="">전체</option>
                    <option 
                      v-for="stone in availableStones" 
                      :key="stone.stoneId + '_participating'" 
                      :value="stone.stoneId"
                    >
                      {{ stone.stoneName }}
                    </option>
                  </select>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in paginatedPeople" :key="person.user.userId">
              <td class="email-col">
                <div class="user-email">{{ person.user.userEmail || person.user.email || '-' }}</div>
              </td>
              <td class="name-col">
                <div class="user-name">{{ person.user.userName || person.user.username || '-' }}</div>
              </td>
              <td class="count-col">{{ person.ownedStoneCount || 0 }}개</td>
              <td class="count-col">{{ person.participatingStoneCount || 0 }}개</td>
              <td class="task-col">
                <span v-if="person.myTaskTotal !== undefined && person.myTaskTotal !== null">
                  {{ (person.myTaskCompleted || 0) + '개 / ' + (person.myTaskTotal || 0) + '개' }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="stones-col">
                <div class="stone-tags">
                  <span
                    v-for="(stone, idx) in getVisibleStones(person.ownedStones)"
                    :key="stone.stoneId"
                    class="stone-tag"
                  >
                    {{ stone.stoneName }}
                  </span>
                  <button
                    v-if="person.ownedStones && person.ownedStones.length > 3"
                    class="more-button"
                    @click="openStoneModal('owned', person.ownedStones, person.user.userName)"
                  >
                    +{{ person.ownedStones.length - 3 }} more
                  </button>
                </div>
              </td>
              <td class="stones-col">
                <div class="stone-tags">
                  <span
                    v-for="(stone, idx) in getVisibleStones(person.participatingStones)"
                    :key="stone.stoneId"
                    class="stone-tag"
                  >
                    {{ stone.stoneName }}
                  </span>
                  <button
                    v-if="person.participatingStones && person.participatingStones.length > 3"
                    class="more-button"
                    @click="openStoneModal('participating', person.participatingStones, person.user.userName)"
                  >
                    +{{ person.participatingStones.length - 3 }} more
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
          
          <!-- 페이지네이션 -->
          <div v-if="totalPages > 1" class="pagination-container">
            <div class="pagination-info">
              총 {{ filteredAndSortedPeople.length }}명 중 {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredAndSortedPeople.length) }}명 표시
            </div>
            <div class="pagination-controls">
              <button 
                class="pagination-btn"
                :class="{ disabled: currentPage === 1 }"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                이전
              </button>
              <div class="pagination-pages">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  class="pagination-page-btn"
                  :class="{ active: page === currentPage }"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>
              <button 
                class="pagination-btn"
                :class="{ disabled: currentPage === totalPages }"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
    
    <!-- 스톤 목록 모달 -->
    <div v-if="showStoneModal" class="stone-modal-overlay" @click="closeStoneModal">
      <div class="stone-modal-content" @click.stop>
        <div class="stone-modal-header">
          <h4>{{ modalTitle }}</h4>
          <button class="stone-modal-close" @click="closeStoneModal">×</button>
        </div>
        <div class="stone-modal-body">
          <div v-if="modalStones && modalStones.length > 0" class="stone-list">
            <div
              v-for="stone in modalStones"
              :key="stone.stoneId"
              class="stone-list-item"
            >
              {{ stone.stoneName }}
            </div>
          </div>
          <div v-else class="stone-modal-empty">스톤이 없습니다.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProjectPeopleOverviewTable",
  components: {},
  props: {
    overview: {
      type: Object,
      default: () => null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  },
  
  data() {
    return {
      sortColumn: 'ownedStoneCount',
      sortOrder: 'desc',
      showStoneModal: false,
      modalStones: [],
      modalTitle: '',
      selectedParticipatingStoneFilter: '',
      currentPage: 1,
      itemsPerPage: 12 // 10~15명 사이로 설정
    };
  },
  
  computed: {
    // 모든 사용 가능한 스톤 목록 (중복 제거)
    availableStones() {
      if (!this.overview || !this.overview.people) {
        return [];
      }
      
      const stoneMap = new Map();
      
      this.overview.people.forEach(person => {
        // 담당 스톤 추가
        if (person.ownedStones && Array.isArray(person.ownedStones)) {
          person.ownedStones.forEach(stone => {
            if (!stoneMap.has(stone.stoneId)) {
              stoneMap.set(stone.stoneId, stone);
            }
          });
        }
        
        // 참여 스톤 추가
        if (person.participatingStones && Array.isArray(person.participatingStones)) {
          person.participatingStones.forEach(stone => {
            if (!stoneMap.has(stone.stoneId)) {
              stoneMap.set(stone.stoneId, stone);
            }
          });
        }
      });
      
      return Array.from(stoneMap.values()).sort((a, b) => {
        return (a.stoneName || '').localeCompare(b.stoneName || '');
      });
    },
    
    // 필터링된 사람 목록
    filteredPeople() {
      if (!this.overview || !this.overview.people) {
        return [];
      }
      
      // 필터가 없으면 전체 반환
      if (!this.selectedParticipatingStoneFilter) {
        return this.overview.people;
      }
      
      return this.overview.people.filter(person => {
        // 참여 스톤 필터 체크
        if (person.participatingStones && Array.isArray(person.participatingStones)) {
          return person.participatingStones.some(stone => stone.stoneId === this.selectedParticipatingStoneFilter);
        }
        return false;
      });
    },
    
    // 필터링 + 정렬된 사람 목록
    filteredAndSortedPeople() {
      if (this.filteredPeople.length === 0) {
        return [];
      }
      
      const people = [...this.filteredPeople];
      
      return people.sort((a, b) => {
        // 첫 번째 정렬 기준
        let comparison = 0;
        if (this.sortColumn === 'ownedStoneCount') {
          comparison = (b.ownedStoneCount || 0) - (a.ownedStoneCount || 0);
        } else if (this.sortColumn === 'participatingStoneCount') {
          comparison = (b.participatingStoneCount || 0) - (a.participatingStoneCount || 0);
        }
        
        // 두 번째 정렬 기준 (사용자 이름 오름차순)
        if (comparison === 0) {
          const nameA = (a.user.userName || '').toLowerCase();
          const nameB = (b.user.userName || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
        }
        
        // 정렬 순서 적용
        return this.sortOrder === 'asc' ? -comparison : comparison;
      });
    },
    
    // 헤더 분수 라벨 (동적 설명)
    taskHeaderFractionLabel() {
      // 현재 데이터 구조상 완료/전체 구조를 사용
      return '완료/전체';
    },
    
    // 전체 페이지 수
    totalPages() {
      if (this.filteredAndSortedPeople.length === 0) {
        return 1;
      }
      return Math.ceil(this.filteredAndSortedPeople.length / this.itemsPerPage);
    },
    
    // 현재 페이지에 표시할 사람 목록
    paginatedPeople() {
      if (this.filteredAndSortedPeople.length === 0) {
        return [];
      }
      
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredAndSortedPeople.slice(start, end);
    },
    
    // 표시할 페이지 번호들 (최대 5개)
    visiblePages() {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(this.totalPages, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    }
  },
  
  watch: {
    selectedParticipatingStoneFilter() {
      // 필터 변경 시 첫 페이지로 이동
      this.currentPage = 1;
    },
    filteredAndSortedPeople() {
      // 필터링 결과가 변경되면 현재 페이지가 범위를 벗어났는지 확인
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
      }
    }
  },
  
  methods: {
    getVisibleStones(stones) {
      if (!stones || stones.length === 0) {
        return [];
      }
      return stones.slice(0, 3);
    },
    
    handleSort(column) {
      if (this.sortColumn === column) {
        // 같은 컬럼이면 정렬 순서 토글
        this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
      } else {
        // 다른 컬럼이면 내림차순으로 설정
        this.sortColumn = column;
        this.sortOrder = 'desc';
      }
    },
    
    openStoneModal(type, stones, userName) {
      this.modalStones = stones || [];
      const typeText = type === 'owned' ? '담당' : '참여';
      this.modalTitle = `${userName}님의 ${typeText} 스톤 목록`;
      this.showStoneModal = true;
    },
    
    closeStoneModal() {
      this.showStoneModal = false;
      this.modalStones = [];
      this.modalTitle = '';
    },
    
    handleFilterChange() {
      // 필터 변경 시 첫 페이지로 이동 (watch에서 처리)
    },
    
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        // 페이지 이동 시 테이블 상단으로 스크롤
        this.$nextTick(() => {
          const tableContainer = this.$el.querySelector('.people-table-container');
          if (tableContainer) {
            tableContainer.scrollTop = 0;
          }
        });
      }
    }
  }
};
</script>

<style scoped>
.people-overview-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-top: 16px;
}

.people-overview-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.people-overview-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

/* 프로젝트 정보와 동일한 헤더 배치/타이포 */

.pis-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pis-title {
  margin: 0;
  font-size: var(--card-title-size, 18px);
  font-weight: var(--card-title-weight, 700);
  color: #1a1a1a;
}

/* 인셋 밑줄 유틸 */
.with-inset-hr {
  position: relative;
  padding-bottom: 12px;
  --hr-inset: 16px;
  --hr-color: #e9eaee;
}

@media (min-width: 1280px) {
  .with-inset-hr { --hr-inset: 20px; }
}

.with-inset-hr::after {
  content: "";
  position: absolute;
  left: var(--hr-inset);
  right: var(--hr-inset);
  bottom: 0;
  height: 1px;
  background: var(--hr-color);
  pointer-events: none;
}

.people-overview-loading,
.people-overview-empty,
.people-overview-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
}

.people-overview-error {
  color: #d32f2f;
}

/* 헤더 내 필터 (인라인) */
.header-with-filter-inline {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  width: 100%;
  justify-content: flex-end;
}

.header-with-filter-inline span {
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
}

.header-filter-select-inline {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  background-color: white;
  color: #1a1a1a;
  cursor: pointer;
  flex: 1;
  min-width: 120px;
  max-width: 200px;
  transition: border-color 0.2s;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px 14px;
  padding-right: 28px;
}

.header-filter-select-inline:hover {
  border-color: #bbb;
}

.header-filter-select-inline:focus {
  outline: none;
  border-color: #1976d2;
}

/* 메트릭 카드 */
.people-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.people-metric-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.people-metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.people-metric-label {
  font-size: 14px;
  color: #666;
}

/* 테이블 */
.people-table-container {
  overflow-x: auto;
}

.people-table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
}

.people-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

.people-table thead {
  background-color: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
}

.people-table th {
  padding: 10px 12px;
  text-align: center;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  vertical-align: middle;
  border-right: 1px solid #e9eaee;
}

.th-sub {
  margin-left: 4px;
  font-weight: 500;
  color: #777;
  font-size: 12px;
}

.people-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
  text-align: center;
  border-right: 1px solid #e9eaee;
}

.people-table th:last-child,
.people-table td:last-child {
  border-right: none;
}

.people-table tbody tr:hover {
  background-color: #f9f9f9;
}

/* 짝수 행 가독성 향상 */
.people-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

/* 정렬 가능한 컬럼 */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background-color: #e8e8e8;
}

.sort-icon {
  margin-left: 4px;
  font-size: 10px;
}

/* 사용자 컬럼 */
.user-col {
  min-width: 200px;
}

/* 이메일 / 이름 분리 컬럼 */
.email-col {
  min-width: 180px;
}

.name-col {
  min-width: 140px;
}

.user-cell {
  display: flex;
  align-items: center;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.user-email {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 카운트 컬럼 */
.count-col {
  min-width: 120px;
  text-align: center;
}

/* 태스크 컬럼 */
.task-col {
  min-width: 120px;
  text-align: center;
}

/* 스톤 컬럼 */
.stones-col {
  min-width: 200px;
}

.stone-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.stone-tag {
  display: inline-block;
  padding: 6px 10px;
  background-color: #eeeeee;
  color: #555555;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.more-button {
  padding: 4px 12px;
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s, border-color 0.2s;
}

.more-button:hover {
  background-color: #e8e8e8;
  border-color: #bbb;
}

/* 모달 */
.stone-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.stone-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.stone-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.stone-modal-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.stone-modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.stone-modal-close:hover {
  background-color: #f5f5f5;
}

.stone-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.stone-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stone-list-item {
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #1a1a1a;
}

.stone-modal-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* 페이지네이션 */
.pagination-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  color: #1a1a1a;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  background-color: #f5f5f5;
  border-color: #bbb;
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  color: #1a1a1a;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-page-btn:hover {
  background-color: #f5f5f5;
  border-color: #bbb;
}

.pagination-page-btn.active {
  background-color: #1976d2;
  border-color: #1976d2;
  color: white;
  font-weight: 600;
}
</style>

