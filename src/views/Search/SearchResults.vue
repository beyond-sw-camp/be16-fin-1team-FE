<template>
  <v-container fluid class="search-results-container">
    <div class="search-results-wrapper">
      <!-- 검색어 헤더 -->
      <div class="search-header">
        <div class="search-header-content">
          <v-icon class="mr-2" color="#1976d2" size="24">mdi-magnify</v-icon>
          <h2 class="search-title">검색 결과: "{{ searchKeyword }}"</h2>
        </div>
        <div class="search-meta">
          <span class="result-count">총 {{ totalResults }}개</span>
        </div>
      </div>

      <!-- 탭 -->
      <v-tabs v-model="activeTab" class="search-tabs" color="#1976d2">
        <v-tab value="all">
          전체 ({{ allResults.length }})
        </v-tab>
        <v-tab value="DOCUMENT">
          <v-icon small class="mr-1" color="#1976d2">mdi-file-document-outline</v-icon>
          문서 ({{ documentResults.length }})
        </v-tab>
        <v-tab value="FILE">
          <v-icon small class="mr-1" color="#ff9800">mdi-file-outline</v-icon>
          파일 ({{ fileResults.length }})
        </v-tab>
        <v-tab value="STONE">
          <v-icon small class="mr-1" color="#9c27b0">mdi-folder-star-outline</v-icon>
          스톤 ({{ stoneResults.length }})
        </v-tab>
        <v-tab value="PROJECT">
          <v-icon small class="mr-1" color="#1976d2">mdi-folder-outline</v-icon>
          프로젝트 ({{ projectResults.length }})
        </v-tab>
      </v-tabs>

      <v-divider></v-divider>

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

        <!-- 검색 결과 리스트 -->
        <div v-else class="results-list">
          <div 
            v-for="result in currentTabResults" 
            :key="result.id"
            class="result-item"
            @click="openResult(result)"
          >
            <div class="result-main">
              <div class="result-icon-wrapper">
                <v-icon :color="getDocTypeIconColor(result.docType)" size="32">
                  {{ getDocTypeIcon(result.docType) }}
                </v-icon>
              </div>
              <div class="result-content">
                <div class="result-header">
                  <v-chip 
                    small 
                    :color="getDocTypeChipColor(result.docType)" 
                    text-color="white" 
                    class="mr-2"
                  >
                    {{ getDocTypeLabel(result.docType) }}
                  </v-chip>
                  <div class="result-title" v-html="highlightKeyword(result.searchTitle)"></div>
                </div>
                
                <div v-if="result.searchContent" class="result-content-text" v-html="highlightKeyword(result.searchContent)"></div>
                
                <div class="result-meta">
                  <div class="result-creator">
                    <v-avatar size="20" class="mr-1">
                      <img v-if="result.profileImageUrl" :src="result.profileImageUrl" alt="프로필" />
                      <v-icon v-else small>mdi-account-circle</v-icon>
                    </v-avatar>
                    <span>{{ result.creatorName || '알 수 없음' }}</span>
                  </div>
                  <div class="result-date">
                    {{ formatDate(result.dateTime) }}
                  </div>
                </div>
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
    projectResults() {
      return this.searchResults.filter(r => r.docType === 'PROJECT');
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
  },
  async mounted() {
    // URL 쿼리에서 검색어 가져오기
    const keyword = this.$route.query.keyword || '';
    if (keyword) {
      this.searchKeyword = keyword;
      await this.performSearch();
    } else {
      // 검색어가 없으면 홈으로 리다이렉트
      this.$router.push('/');
    }
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

      this.loading = true;
      this.activeTab = 'all';

      try {
        const response = await searchService.search(keyword);
        if (response.result && Array.isArray(response.result)) {
          this.searchResults = response.result;
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
      return text.replace(regex, '<strong style="background-color: #fff3cd; font-weight: 600; padding: 0 2px;">$1</strong>');
    },

    // 문서 타입 아이콘
    getDocTypeIcon(docType) {
      const iconMap = {
        DOCUMENT: 'mdi-file-document-outline',
        FILE: 'mdi-file-outline',
        STONE: 'mdi-folder-star-outline',
        PROJECT: 'mdi-folder-outline',
      };
      return iconMap[docType] || 'mdi-file-outline';
    },

    // 문서 타입 아이콘 색상
    getDocTypeIconColor(docType) {
      const colorMap = {
        DOCUMENT: '#1976d2',
        FILE: '#ff9800',
        STONE: '#9c27b0',
        PROJECT: '#1976d2',
      };
      return colorMap[docType] || '#757575';
    },

    // 문서 타입 라벨
    getDocTypeLabel(docType) {
      const labelMap = {
        DOCUMENT: '문서',
        FILE: '파일',
        STONE: '스톤',
        PROJECT: '프로젝트',
      };
      return labelMap[docType] || docType;
    },

    // 문서 타입 Chip 색상
    getDocTypeChipColor(docType) {
      const colorMap = {
        DOCUMENT: '#1976d2',
        FILE: '#ff9800',
        STONE: '#9c27b0',
        PROJECT: '#1976d2',
      };
      return colorMap[docType] || 'grey';
    },

    // 날짜 포맷
    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    },

    // 검색 결과 열기
    openResult(result) {
      // 문서 타입에 따라 라우팅
      if (result.docType === 'DOCUMENT') {
        const routeData = this.$router.resolve(`/viewer/${result.id}`);
        window.open(routeData.href, '_blank');
      } else if (result.docType === 'STONE') {
        this.$router.push({ path: '/project', query: { id: result.id } });
      } else if (result.docType === 'PROJECT') {
        this.$router.push({ path: '/project', query: { id: result.id } });
      } else if (result.docType === 'FILE') {
        // 파일은 다운로드 또는 미리보기
        console.log('파일 상세:', result);
        // TODO: 파일 처리 로직 추가
      }
    },
  },
};
</script>

<style scoped>
.search-results-container {
  padding: 24px !important;
  max-width: 1200px;
  margin: 0 auto;
}

.search-results-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.search-header {
  padding: 24px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.search-header-content {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.search-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.search-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.result-count {
  font-size: 14px;
  color: #666;
}

.search-tabs {
  background: white;
}

.search-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
}

.results-content {
  min-height: 400px;
  padding: 24px;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.result-item:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.result-main {
  display: flex;
  gap: 16px;
}

.result-icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
  min-width: 0;
}

.result-content-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.6;
  word-break: break-word;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #999;
  flex-wrap: wrap;
}

.result-creator {
  display: flex;
  align-items: center;
}

.result-date {
  color: #999;
}

/* 하이라이트 스타일 */
.result-title :deep(strong),
.result-content-text :deep(strong) {
  background-color: #fff3cd;
  font-weight: 600;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
