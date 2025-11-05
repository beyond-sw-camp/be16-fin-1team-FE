<template>
  <v-container fluid class="search-results-container" style="padding: 0 !important; max-width: 100% !important;">
    <div class="search-results-wrapper">
      <!-- 검색어 헤더 -->
      <div class="search-header">
        <div class="search-header-top">
          <div class="search-header-left">
            <h1 class="search-title">"{{ searchKeyword }}" 검색 결과</h1>
          </div>
        </div>
      </div>

      <!-- 탭 -->
      <div class="tabs-section">
        <div class="tabs-wrapper">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab-button', { active: activeTab === tab.value }]"
            @click="activeTab = tab.value"
          >
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- 결과 영역 -->
      <div class="results-content">
        <!-- 로딩 -->
        <div v-if="loading" class="loading-container">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <div class="mt-4">검색 중...</div>
        </div>

        <!-- 결과 없음 -->
        <div v-else-if="currentTabResults.length === 0" class="empty-container">
          <v-icon size="64" color="grey lighten-1">mdi-magnify</v-icon>
          <div class="mt-4 text-h6 grey--text">검색 결과가 없습니다</div>
          <div class="text-body-2 grey--text">다른 검색어를 시도해보세요</div>
        </div>

        <!-- 테이블 형식 (문서, 파일, 스톤, 작업 탭) -->
        <div v-else-if="(activeTab === 'DOCUMENT' || activeTab === 'FILE' || activeTab === 'STONE' || activeTab === 'TASK')" class="table-results" :data-active-tab="activeTab">
          <v-data-table
            :headers="activeTab === 'STONE' ? stoneTableHeaders : (activeTab === 'TASK' ? taskTableHeaders : tableHeaders)"
            :items="sortedTableResults"
            :sort-by="[{ key: sortBy, order: sortOrder }]"
            class="search-table elevation-0"
            :items-per-page="-1"
            :hide-default-footer="true"
            @click:row="handleTableRowClick"
          >
            <template v-slot:header.name>
              <div class="d-flex align-center clickable-header" @click="handleSort('name')">
                <span class="table-header-text">
                  {{ activeTab === 'STONE' ? '스톤명' : (activeTab === 'TASK' ? '작업명' : '이름') }}
                </span>
                <v-icon v-if="sortBy === 'name'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>
            <template v-slot:header.owner>
              <span class="table-header-text">생성자</span>
            </template>
            <template v-slot:header.modified>
              <div class="d-flex align-center clickable-header" @click="handleSort('modified')">
                <span class="table-header-text">생성일</span>
                <v-icon v-if="sortBy === 'modified'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>
            <template v-if="activeTab === 'STONE'" v-slot:header.manager>
              <span class="table-header-text">스톤 담당자</span>
            </template>
            <template v-if="activeTab === 'TASK'" v-slot:header.manager>
              <span class="table-header-text">작업 담당자</span>
            </template>
            <template v-if="activeTab === 'STONE'" v-slot:header.deadline>
              <div class="d-flex align-center clickable-header" @click="handleSort('deadline')">
                <span class="table-header-text">마감일</span>
                <v-icon v-if="sortBy === 'deadline'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>
            <template v-if="activeTab === 'STONE'" v-slot:header.participants>
              <span class="table-header-text">참여자 목록</span>
            </template>
            <template v-if="activeTab === 'STONE'" v-slot:header.status>
              <span class="table-header-text">상태</span>
            </template>
            <template v-if="activeTab === 'TASK'" v-slot:header.deadline>
              <div class="d-flex align-center clickable-header" @click="handleSort('deadline')">
                <span class="table-header-text">마감일</span>
                <v-icon v-if="sortBy === 'deadline'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>
            <template v-if="activeTab === 'TASK'" v-slot:header.status>
              <span class="table-header-text">상태</span>
            </template>
            <template v-slot:header.size>
              <div class="d-flex align-center clickable-header" @click="handleSort('size')">
                <span class="table-header-text">크기</span>
                <v-icon v-if="sortBy === 'size'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>

            <template v-slot:item.name="{ item }">
              <div class="d-flex align-center py-2 clickable-row" @click="openResult(item)">
                <v-icon :color="getDocTypeIconColor(item.docType)" class="mr-3" size="24">
                  {{ getDocTypeIcon(item.docType) }}
                </v-icon>
                <span class="item-name" v-html="highlightKeyword(item.searchTitle)"></span>
              </div>
            </template>

            <template v-if="activeTab !== 'STONE'" v-slot:item.shortcut="{ item }">
              <div class="d-flex align-center justify-center">
                <v-btn
                  v-if="item.parentId || (item.rootType && item.rootId)"
                  size="small"
                  variant="outlined"
                  class="folder-shortcut-btn"
                  @click.stop="navigateToFolder(item)"
                >
                  <v-icon size="16" class="mr-1">mdi-folder-outline</v-icon>
                  문서함 이동
                </v-btn>
                <span v-else class="text-grey">-</span>
              </div>
            </template>

            <template v-slot:item.owner="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="24" class="mr-2">
                  <v-img v-if="item.profileImageUrl" :src="item.profileImageUrl" alt="프로필" />
                  <v-icon v-else small>mdi-account-circle</v-icon>
                </v-avatar>
                <span>{{ item.creatorName || '알 수 없음' }}</span>
              </div>
            </template>

            <template v-slot:item.modified="{ item }">
              <span>{{ formatDate(item.dateTime || item.modified) }}</span>
            </template>

            <template v-slot:item.size="{ item }">
              <span>{{ formatFileSize(item.size) || '-' }}</span>
            </template>

            <!-- 스톤/작업 전용 슬롯 -->
            <template v-if="activeTab === 'STONE' || activeTab === 'TASK'" v-slot:item.manager="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="24" class="mr-2">
                  <v-img v-if="item.profileImageUrl" :src="item.profileImageUrl" alt="프로필" />
                  <v-icon v-else small>mdi-account-circle</v-icon>
                </v-avatar>
                <span>{{ item.creatorName || '알 수 없음' }}</span>
              </div>
            </template>

            <template v-if="activeTab === 'STONE' || activeTab === 'TASK'" v-slot:item.deadline="{ item }">
              <span>{{ formatDate(item.dateTime) }}</span>
            </template>

            <template v-if="activeTab === 'STONE'" v-slot:item.participants="{ item }">
              <div class="d-flex align-center participants-list">
                <template v-if="item.participantInfos && Array.isArray(item.participantInfos) && item.participantInfos.length > 0">
                  <v-tooltip
                    v-for="(participant, index) in item.participantInfos.slice(0, 5)"
                    :key="participant.id || `participant-${index}`"
                    location="top"
                  >
                    <template v-slot:activator="{ props }">
                      <v-avatar
                        v-bind="props"
                        size="28"
                        class="participant-avatar"
                        :style="{ marginLeft: index > 0 ? '-8px' : '0', zIndex: 10 - index }"
                      >
                        <v-img
                          v-if="participant.profileImageUrl"
                          :src="participant.profileImageUrl"
                          alt="참여자"
                        />
                        <v-icon v-else size="20">mdi-account-circle</v-icon>
                      </v-avatar>
                    </template>
                    <span>{{ participant.name || '알 수 없음' }}</span>
                  </v-tooltip>
                  <span v-if="item.participantInfos.length > 5" class="participant-more">
                    +{{ item.participantInfos.length - 5 }}
                  </span>
                </template>
                <span v-else class="text-grey">-</span>
              </div>
            </template>

            <template v-if="activeTab === 'STONE'" v-slot:item.status="{ item }">
              <v-chip
                :color="getStoneStatusColor(item.stoneStatus)"
                size="small"
                variant="flat"
                class="status-chip"
              >
                {{ getStoneStatusLabel(item.stoneStatus) }}
              </v-chip>
            </template>

            <template v-if="activeTab === 'TASK'" v-slot:item.status="{ item }">
              <v-chip
                :color="getTaskStatusColor(item.isDone)"
                size="small"
                variant="flat"
                class="status-chip"
              >
                {{ getTaskStatusLabel(item.isDone) }}
              </v-chip>
            </template>
          </v-data-table>
        </div>

        <!-- 리스트 형식 (전체 탭) -->
        <div v-else class="results-list">
          <div 
            v-for="result in currentTabResults" 
            :key="result.id"
            class="result-item"
            @click="openResult(result)"
          >
            <div class="result-icon" :style="{ color: getDocTypeIconColor(result.docType) }">
              <v-icon size="20">
                {{ getDocTypeIcon(result.docType) }}
              </v-icon>
            </div>
            <div class="result-body">
              <div class="result-title-row">
                <div class="result-title" v-html="highlightKeyword(result.searchTitle)"></div>
                <div class="result-type-label" :style="{ backgroundColor: getDocTypeBackgroundColor(result.docType), color: getDocTypeIconColor(result.docType) }">
                  {{ getDocTypeLabel(result.docType) }}
                </div>
              </div>
              <div v-if="result.searchContent" class="result-snippet" v-html="formatSearchContent(result.searchContent)"></div>
              <div class="result-footer">
                <div class="result-creator">
                  <v-avatar size="20">
                    <v-img v-if="result.profileImageUrl" :src="result.profileImageUrl" alt="프로필" />
                    <v-icon v-else size="20">mdi-account-circle</v-icon>
                  </v-avatar>
                  <span class="creator-name">{{ result.creatorName || '알 수 없음' }}</span>
                </div>
                <span v-if="activeTab !== 'all' && (result.docType === 'DOCUMENT' || result.docType === 'FILE')" class="result-date">{{ formatDateShort(result.dateTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script>
import searchService from '@/services/searchService';

export default {
  name: 'SearchResults',
  data() {
    return {
      searchKeyword: '',
      loading: false,
      activeTab: 'all',
      searchResults: [],
      sortBy: 'name',
      sortOrder: 'asc',
    };
  },
  computed: {
    allResults() {
      return this.searchResults;
    },
    documentResults() {
      return this.searchResults.filter(r => r.docType === 'DOCUMENT');
    },
    fileResults() {
      return this.searchResults.filter(r => r.docType === 'FILE');
    },
    stoneResults() {
      return this.searchResults.filter(r => r.docType === 'STONE');
    },
    taskResults() {
      return this.searchResults.filter(r => r.docType === 'TASK');
    },
    currentTabResults() {
      if (this.activeTab === 'all') {
        return this.allResults;
      }
      return this.searchResults.filter(r => r.docType === this.activeTab);
    },
    totalResults() {
      return this.searchResults.length;
    },
    tabs() {
      return [
        { value: 'all', label: '전체', count: this.allResults.length },
        { value: 'DOCUMENT', label: '문서', count: this.documentResults.length },
        { value: 'FILE', label: '파일', count: this.fileResults.length },
        { value: 'STONE', label: '스톤', count: this.stoneResults.length },
        { value: 'TASK', label: '작업', count: this.taskResults.length },
      ];
    },
    tableHeaders() {
      return [
        { text: '이름', value: 'name', width: '38%', sortable: true },
        { text: '생성자', value: 'owner', width: '22%', sortable: false },
        { text: '수정일', value: 'modified', width: '18%', sortable: true },
        { text: '크기', value: 'size', width: '12%', sortable: true },
        { text: '바로가기', value: 'shortcut', width: '10%', sortable: false },
      ];
    },
    stoneTableHeaders() {
      return [
        { text: '스톤명', value: 'name', width: '25%', sortable: true },
        { text: '스톤 담당자', value: 'manager', width: '20%', sortable: false },
        { text: '마감일', value: 'deadline', width: '18%', sortable: true },
        { text: '참여자 목록', value: 'participants', width: '25%', sortable: false },
        { text: '상태', value: 'status', width: '12%', sortable: false },
      ];
    },
    taskTableHeaders() {
      return [
        { text: '작업명', value: 'name', width: '30%', sortable: true },
        { text: '작업 담당자', value: 'manager', width: '25%', sortable: false },
        { text: '마감일', value: 'deadline', width: '25%', sortable: true },
        { text: '상태', value: 'status', width: '20%', sortable: false },
      ];
    },
    sortedTableResults() {
      if (this.activeTab !== 'DOCUMENT' && this.activeTab !== 'FILE' && this.activeTab !== 'STONE' && this.activeTab !== 'TASK') {
        return this.currentTabResults;
      }

      const results = [...this.currentTabResults];
      
      return results.sort((a, b) => {
        let aVal, bVal;

        switch (this.sortBy) {
          case 'name':
            aVal = (a.searchTitle || '').toLowerCase();
            bVal = (b.searchTitle || '').toLowerCase();
            break;
          case 'modified':
          case 'deadline':
            // dateTime: 파일/문서는 생성일, 스톤/테스크는 마감일 (백엔드에서 설정됨)
            aVal = new Date(a.dateTime || 0).getTime();
            bVal = new Date(b.dateTime || 0).getTime();
            break;
          case 'size':
            aVal = this.parseSize(a.size) || 0;
            bVal = this.parseSize(b.size) || 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },
  },
  async mounted() {
    // URL 쿼리에서 검색어 가져오기, 없으면 '테스트'로 기본값 설정
    const keyword = this.$route.query.keyword || '테스트';
    this.searchKeyword = keyword;
    await this.performSearch();
  },
  watch: {
    '$route.query.keyword'(newKeyword) {
      if (newKeyword && newKeyword !== this.searchKeyword) {
        this.searchKeyword = newKeyword;
        this.performSearch();
      }
    },
  },
  methods: {
    async performSearch() {
      const keyword = this.searchKeyword.trim();
      
      if (!keyword) {
        return;
      }

      if (keyword.length < 2) {
        this.searchResults = [];
        return;
      }

      this.loading = true;
      this.activeTab = 'all';

      try {
        const response = await searchService.search(keyword);
        if (response.result && Array.isArray(response.result)) {
          this.searchResults = response.result;
          
          // 검색 결과 전체 로그
          console.log('=== 검색 결과 전체 ===', this.searchResults);
          
          // 스톤 타입 결과 상세 로그
          const stoneResults = this.searchResults.filter(r => r.docType === 'STONE');
          if (stoneResults.length > 0) {
            console.log('=== 스톤 검색 결과 ===', stoneResults);
            stoneResults.forEach((stone, index) => {
              console.log(`[스톤 ${index + 1}]`, {
                id: stone.id,
                searchTitle: stone.searchTitle,
                participants: stone.participants,
                participants타입: typeof stone.participants,
                participants배열여부: Array.isArray(stone.participants),
                전체데이터: stone
              });
            });
          }
        } else {
          this.searchResults = [];
        }
      } catch (error) {
        console.error('검색 실패:', error);
        this.searchResults = [];
      } finally {
        this.loading = false;
      }
    },

    // 검색어 하이라이트
    highlightKeyword(text) {
      if (!text || !this.searchKeyword) return text;
      const keyword = this.searchKeyword.trim();
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark class="highlight-match">$1</mark>');
    },

    // 검색 콘텐츠 포맷 (em 태그 처리)
    formatSearchContent(content) {
      if (!content) return '';
      // em 태그가 이미 포함되어 있는 경우 스타일 적용
      return content.replace(/<em>/g, '<mark class="highlight-match">').replace(/<\/em>/g, '</mark>');
    },

    // 문서 타입 아이콘 (자동완성과 동일하게)
    getDocTypeIcon(docType) {
      const iconMap = {
        DOCUMENT: 'mdi-file-document-outline',
        FILE: 'mdi-file-outline',
        STONE: 'mdi-folder-star-outline',
        PROJECT: 'mdi-folder-outline',
        TASK: 'mdi-folder-outline',
      };
      return iconMap[docType] || 'mdi-file-outline';
    },

    // 문서 타입 아이콘 색상 (자동완성과 동일하게)
    getDocTypeIconColor(docType) {
      const colorMap = {
        DOCUMENT: '#1976d2',
        FILE: '#ff9800',
        STONE: '#9c27b0',
        PROJECT: '#1976d2',
        TASK: '#1976d2',
      };
      return colorMap[docType] || '#757575';
    },

    // 문서 타입 라벨
    getDocTypeLabel(docType) {
      const labelMap = {
        DOCUMENT: '문서',
        FILE: '파일',
        STONE: '스톤',
        TASK: '작업',
      };
      return labelMap[docType] || docType;
    },

    // 문서 타입 Chip 색상
    getDocTypeChipColor(docType) {
      const colorMap = {
        DOCUMENT: '#1976d2',
        FILE: '#ff9800',
        STONE: '#9c27b0',
        TASK: '#1976d2',
      };
      return colorMap[docType] || 'grey';
    },

    // 문서 타입 배경색
    getDocTypeBackgroundColor(docType) {
      const colorMap = {
        DOCUMENT: '#e3f2fd',
        FILE: '#fff3e0',
        STONE: '#f3e5f5',
        TASK: '#e3f2fd',
      };
      return colorMap[docType] || '#f5f5f5';
    },

    // 날짜 포맷 (테이블용)
    formatDate(dateString) {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '');
      } catch {
        return dateString;
      }
    },

    // 파일 크기 포맷
    formatFileSize(bytes) {
      if (!bytes) return '';
      if (typeof bytes === 'string') return bytes;
      if (bytes < 1024) return bytes + 'B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
    },

    // 파일 크기 파싱 (정렬용)
    parseSize(size) {
      if (!size) return 0;
      if (typeof size === 'number') return size;
      if (typeof size !== 'string') return 0;
      
      const match = size.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      
      switch (unit) {
        case 'B': return value;
        case 'KB': return value * 1024;
        case 'MB': return value * 1024 * 1024;
        case 'GB': return value * 1024 * 1024 * 1024;
        default: return 0;
      }
    },

    // 정렬 핸들러
    handleSort(column) {
      if (this.sortBy === column) {
        // 같은 컬럼 클릭 시 정렬 순서 변경
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        // 다른 컬럼 클릭 시 해당 컬럼으로 정렬 (기본 오름차순)
        this.sortBy = column;
        this.sortOrder = 'asc';
      }
    },

    // 짧은 날짜 포맷 (아사나 스타일)
    formatDateShort(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '어제';
        if (diffDays < 7) return `${diffDays}일 전`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
        return `${Math.floor(diffDays / 365)}년 전`;
      } catch {
        return dateString;
      }
    },

    // 테이블 행 클릭 핸들러
    handleTableRowClick(event, item) {
      // 모든 탭에서 클릭 가능하도록 변경
      this.openResult(event, item);
    },

    // 검색 결과 열기
    openResult(event, item) {
      // v-data-table의 click:row 이벤트는 (event, item) 형태로 전달됨
      const result = item || event;
      
      // 문서 타입에 따라 라우팅
      if (result.docType === 'DOCUMENT') {
        const routeData = this.$router.resolve(`/viewer/${result.id}`);
        window.open(routeData.href, '_blank');
      } else if (result.docType === 'STONE') {
        // 스톤 상세 모달을 열기 위해 프로젝트 페이지로 이동
        // 필요: 프로젝트 ID (rootId), 스톤 ID (id)
        const projectId = result.rootId; // 프로젝트 ID
        const stoneId = result.id; // 스톤 ID
        
        if (projectId && stoneId) {
          this.$router.push({ 
            path: '/project', 
            query: { 
              id: projectId,
              stoneId: stoneId
            } 
          });
        } else {
          console.warn('스톤 상세 페이지 이동에 필요한 정보가 없습니다:', {
            projectId,
            stoneId,
            result
          });
        }
      } else if (result.docType === 'TASK') {
        // 작업 클릭 시 프로젝트 페이지로 이동 (스톤 모달 열기)
        // 필요: 프로젝트 ID (projectId), 스톤 ID (rootId)
        const projectId = result.projectId; // 프로젝트 ID
        const stoneId = result.rootId; // 스톤 ID (rootId)
        
        if (projectId && stoneId) {
          this.$router.push({ 
            path: '/project', 
            query: { 
              id: projectId,
              stoneId: stoneId
            } 
          });
        } else {
          console.warn('작업 상세 페이지 이동에 필요한 정보가 없습니다:', {
            projectId,
            stoneId,
            result
          });
        }
      } else if (result.docType === 'FILE') {
        // 파일은 fileUrl이 있으면 새 창에서 열기
        if (result.fileUrl) {
          window.open(result.fileUrl, '_blank');
        } else {
          console.warn('파일 URL이 없습니다:', result);
        }
      }
    },

    // 폴더로 이동
    navigateToFolder(result) {
      if (!result.rootType || !result.rootId) {
        console.warn('rootType 또는 rootId가 없습니다:', result);
        return;
      }

      // 하이라이트할 파일 ID를 query parameter로 전달
      const query = result.id ? { highlightItemId: result.id } : {};

      // parentId가 null이면 루트 경로의 문서함으로 이동
      if (!result.parentId) {
        this.$router.push({
          name: 'driveRoot',
          params: {
            rootType: result.rootType,
            rootId: result.rootId
          },
          query
        });
      } else {
        // parentId가 있으면 해당 폴더로 이동
        this.$router.push({
          name: 'driveFolder',
          params: {
            rootType: result.rootType,
            rootId: result.rootId,
            folderId: result.parentId
          },
          query
        });
      }
    },

    // 스톤 상태 색상
    getStoneStatusColor(status) {
      const statusMap = {
        'TODO': '#9e9e9e',
        'IN_PROGRESS': '#2196f3',
        'DONE': '#4caf50',
        'BLOCKED': '#f44336',
      };
      return statusMap[status] || '#9e9e9e';
    },

    // 스톤 상태 라벨
    getStoneStatusLabel(status) {
      const labelMap = {
        'TODO': '할 일',
        'IN_PROGRESS': '진행 중',
        'DONE': '완료',
        'BLOCKED': '차단됨',
      };
      return labelMap[status] || status || '-';
    },

    // 작업 상태 색상 (isDone: boolean)
    getTaskStatusColor(isDone) {
      if (isDone === true) {
        return '#4caf50'; // 완료 - 초록색
      } else if (isDone === false) {
        return '#2196f3'; // 진행 중 - 파란색
      }
      // null 또는 undefined인 경우
      return '#9e9e9e'; // 미정 - 회색
    },

    // 작업 상태 라벨 (isDone: boolean)
    getTaskStatusLabel(isDone) {
      if (isDone === true) {
        return '완료';
      } else if (isDone === false) {
        return '진행 중';
      }
      // null 또는 undefined인 경우
      return '미정';
    },

    // 참여자 목록 가져오기
    getParticipantsList(item) {
      // 실제 필드명: participantInfos (백엔드는 participants로 정의했지만 JSON에서는 participantInfos로 직렬화됨)
      // participantInfo 객체 구조: { id, name, profileImageUrl }
      const participants = item.participantInfos || item.participants || [];
      
      if (!Array.isArray(participants)) {
        return [];
      }
      
      return participants;
    },
  },
};
</script>

<style scoped>
.search-results-container {
  padding: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
  margin: 0 !important;
  background: #fafbfc;
  min-height: calc(100vh - 64px);
}

.search-results-wrapper {
  background: transparent;
  min-height: calc(100vh - 64px);
}

.search-header {
  padding: 32px 48px 8px;
  background: white;
  border-bottom: none;
}

.search-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.search-header-left {
  flex: 1;
}

.search-title {
  font-size: 28px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.search-keyword {
  font-size: 15px;
  font-weight: 500;
  color: #6366f1;
  letter-spacing: -0.1px;
}

.search-header-right {
  display: flex;
  align-items: center;
}

.result-count {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 6px;
}

.tabs-section {
  background: white;
  border-bottom: 1px solid #e4e6eb;
  padding: 0 48px;
}

.tabs-wrapper {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 4px 0;
}

.tabs-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  letter-spacing: -0.1px;
  outline: none !important;
}

.tab-button:focus,
.tab-button:focus-visible,
.tab-button:active {
  outline: none !important;
  box-shadow: none !important;
}

.tab-button:hover {
  background: #f3f4f6;
  color: #1d2129;
}

.tab-button.active {
  background: #eef2ff;
  color: #6366f1;
  font-weight: 600;
}

.tab-count {
  font-size: 12px;
  opacity: 0.7;
  font-weight: 500;
}

.tab-button.active .tab-count {
  opacity: 1;
}

.results-content {
  min-height: 400px;
  padding: 8px 48px 40px;
  background: transparent;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 24px;
  text-align: center;
}

.loading-container {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.empty-container .v-icon {
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty-container .text-h6 {
  font-size: 17px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
}

.empty-container .text-body-2 {
  color: #6b7280;
  font-size: 14px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-item {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover {
  background: #fafbfc;
  border-color: #e4e6eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.result-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
}

.result-body {
  flex: 1;
  min-width: 0;
}

.result-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.result-title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-shortcut-btn {
  color: #1976d2 !important;
  border-color: #1976d2 !important;
  text-transform: none !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  letter-spacing: -0.1px !important;
  padding: 4px 10px !important;
  min-width: auto !important;
  transition: all 0.2s ease;
}

.folder-shortcut-btn:hover {
  background-color: #e3f2fd !important;
  border-color: #1565c0 !important;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
  letter-spacing: -0.1px;
  flex: 1;
  min-width: 0;
}

.result-type-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 0.2px;
  text-transform: uppercase;
}

.result-snippet {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.1px;
}

.result-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.result-creator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.creator-name {
  font-weight: 500;
  color: #6b7280;
}

.result-date {
  color: #9ca3af;
  font-weight: 400;
}

/* 하이라이트 스타일 */
.result-title :deep(.highlight-match),
.result-snippet :deep(.highlight-match) {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 3px;
  box-shadow: none;
}

/* 스크롤바 스타일링 */
.tabs-wrapper {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 테이블 스타일 */
.table-results {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.search-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.search-table :deep(thead) {
  background: #fafbfc;
  border-bottom: 1px solid #e4e6eb;
}

.search-table :deep(thead th) {
  font-weight: 600;
  color: #1d2129;
  padding: 14px 16px;
  border-bottom: 1px solid #e4e6eb;
  text-transform: none;
  background-color: transparent;
  font-size: 13px;
}

.search-table :deep(tbody td) {
  padding: 12px 16px;
  color: #1d2129;
  font-size: 14px;
  border-bottom: 1px solid #f3f4f6;
}

.search-table :deep(tbody tr:hover) {
  background-color: #fafbfc;
  cursor: pointer;
}

/* 기본적으로 모든 행은 클릭 가능 */
.search-table :deep(tbody tr) {
  cursor: pointer;
}

/* TASK 탭에서도 클릭 가능하도록 커서 유지 */
.table-results[data-active-tab="TASK"] .search-table :deep(tbody tr) {
  cursor: pointer;
}

.search-table :deep(tbody tr:last-child td) {
  border-bottom: none;
}

.clickable-row {
  cursor: pointer;
}

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.clickable-header {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}

.clickable-header:hover {
  opacity: 0.7;
}

.table-header-text {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  letter-spacing: 0.3px;
}

/* 스톤 테이블 전용 스타일 */
.participants-list {
  position: relative;
  min-height: 32px;
}

.participant-avatar {
  border: 2px solid white;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.participant-avatar:hover {
  transform: scale(1.1);
  z-index: 20 !important;
}

.participant-more {
  margin-left: 4px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.status-chip {
  font-size: 12px !important;
  font-weight: 500 !important;
  text-transform: none !important;
}
</style>
