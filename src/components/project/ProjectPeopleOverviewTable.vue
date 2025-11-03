<template>
  <div class="people-overview-section">
    <div class="people-overview-header">
      <h3 class="people-overview-title">인원 현황</h3>
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
        <table class="people-table">
          <thead>
            <tr>
              <th class="user-col">사용자</th>
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
              <th class="task-col">맡은 태스크</th>
              <th class="stones-col">담당 스톤</th>
              <th class="stones-col">참여 스톤</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in sortedPeople" :key="person.user.userId">
              <td class="user-col">
                <div class="user-cell">
                  <div class="user-info">
                    <div class="user-name">{{ person.user.userName || '-' }}</div>
                    <div class="user-email">{{ person.user.userEmail || '-' }}</div>
                  </div>
                </div>
              </td>
              <td class="count-col">{{ person.ownedStoneCount || 0 }}</td>
              <td class="count-col">{{ person.participatingStoneCount || 0 }}</td>
              <td class="task-col">
                <span v-if="person.myTaskTotal !== undefined && person.myTaskTotal !== null">
                  {{ person.myTaskCompleted || 0 }} / {{ person.myTaskTotal }}
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
      modalTitle: ''
    };
  },
  
  computed: {
    sortedPeople() {
      if (!this.overview || !this.overview.people) {
        return [];
      }
      
      const people = [...this.overview.people];
      
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
    }
  }
};
</script>

<style scoped>
.people-overview-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-top: 30px;
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

.people-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.people-table thead {
  background-color: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
}

.people-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
}

.people-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
}

.people-table tbody tr:hover {
  background-color: #f9f9f9;
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
  font-size: 12px;
  color: #666;
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
}

.stone-tag {
  display: inline-block;
  padding: 4px 12px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
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
</style>

