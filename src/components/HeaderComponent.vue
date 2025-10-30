<template>
  <v-app-bar class="app-header" flat density="comfortable" style="overflow: visible !important;">
    <!-- 검색바 -->
    <div class="search-container">
      <div class="search-input">
        <input 
          type="text" 
          v-model="searchKeyword"
          @input="onSearchInput"
          @keyup.enter="performSearch"
          @focus="onSearchFocus"
          placeholder="검색" 
          class="search-field" 
        />
        <img 
          src="@/assets/icons/header/search.svg" 
          alt="검색" 
          class="search-icon"
          @click="performSearch"
        />
        
        <!-- 자동완성 드롭다운 -->
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
          <div 
            v-for="(suggestion, index) in suggestions" 
            :key="index"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(suggestion)"
          >
            <v-icon small class="mr-2">mdi-magnify</v-icon>
            <span>{{ suggestion }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 알림 아이콘 -->
    <v-btn icon class="notification-btn">
      <img src="@/assets/icons/header/bell.svg" alt="알림" class="bell-icon" />
    </v-btn>
    
    <!-- 사용자 아이콘 -->
    <v-btn icon class="user-btn">
      <img src="@/assets/icons/header/user.svg" alt="사용자" class="user-icon" />
    </v-btn>

    <!-- 검색 결과 모달 -->
    <v-dialog v-model="searchDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title class="search-result-header">
          <v-icon class="mr-2">mdi-magnify</v-icon>
          검색 결과: "{{ currentSearchKeyword }}"
          <v-spacer></v-spacer>
          <v-btn icon @click="searchDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        
        <v-card-text class="search-results-container">
          <!-- 로딩 -->
          <div v-if="searchLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-3">검색 중...</div>
          </div>

          <!-- 검색 결과 -->
          <div v-else-if="searchResults.length > 0">
            <div 
              v-for="result in searchResults" 
              :key="result.id"
              class="search-result-item"
              @click="openResult(result)"
            >
              <div class="result-header">
                <v-chip small :color="getTypeColor(result.docType)" text-color="white" class="mr-2">
                  {{ getTypeName(result.docType) }}
                </v-chip>
                <div class="result-title" v-html="result.searchTitle"></div>
              </div>
              
              <div v-if="result.searchContent" class="result-content" v-html="result.searchContent"></div>
              
              <div class="result-meta">
                <div class="result-creator">
                  <v-avatar size="20" class="mr-1">
                    <img v-if="result.profileImageUrl" :src="result.profileImageUrl" />
                    <v-icon v-else small>mdi-account-circle</v-icon>
                  </v-avatar>
                  {{ result.creatorName }}
                </div>
                <div class="result-date">
                  {{ formatDate(result.dateTime) }}
                </div>
                <div v-if="result.participants && result.participants.length > 0" class="result-participants">
                  <v-avatar-group size="20" max="3">
                    <v-avatar v-for="participant in result.participants" :key="participant.id" size="20">
                      <img v-if="participant.profileImage" :src="participant.profileImage" />
                      <v-icon v-else small>mdi-account</v-icon>
                    </v-avatar>
                  </v-avatar-group>
                </div>
              </div>
            </div>
          </div>

          <!-- 결과 없음 -->
          <div v-else class="text-center py-8 grey--text">
            <v-icon size="64" color="grey lighten-1">mdi-magnify</v-icon>
            <div class="mt-4 text-h6">검색 결과가 없습니다</div>
            <div class="text-body-2">다른 검색어를 시도해보세요</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-app-bar>
</template>

<script>
import searchService from '@/services/searchService';
import { showSnackbar } from '@/services/snackbar';

export default {
  name: "HeaderComponent",
  data() {
    return {
      searchKeyword: '',
      currentSearchKeyword: '',
      suggestions: [],
      showSuggestions: false,
      searchDialog: false,
      searchResults: [],
      searchLoading: false,
      suggestTimer: null,
    };
  },

  mounted() {
    // 클릭 이벤트로 자동완성 닫기
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    if (this.suggestTimer) {
      clearTimeout(this.suggestTimer);
    }
  },

  methods: {
    // 검색창 포커스
    onSearchFocus() {
      console.log('Search input focused');
      if (this.suggestions.length > 0) {
        this.showSuggestions = true;
      }
    },

    // 검색어 입력 시 자동완성
    onSearchInput() {
      console.log('onSearchInput called, keyword:', this.searchKeyword);
      
      if (this.suggestTimer) {
        clearTimeout(this.suggestTimer);
      }

      if (!this.searchKeyword || this.searchKeyword.trim().length === 0) {
        this.suggestions = [];
        this.showSuggestions = false;
        return;
      }

      // 최소 2글자 이상 입력 시 자동완성
      if (this.searchKeyword.trim().length < 2) {
        this.suggestions = [];
        this.showSuggestions = false;
        return;
      }

      // 디바운싱 (300ms)
      this.suggestTimer = setTimeout(async () => {
        try {
          console.log('Calling suggest API with keyword:', this.searchKeyword.trim());
          const response = await searchService.suggest(this.searchKeyword.trim());
          console.log('Suggest API response:', response);
          
          if (response.result && Array.isArray(response.result)) {
            this.suggestions = response.result;
            this.showSuggestions = this.suggestions.length > 0;
            console.log('Suggestions:', this.suggestions, 'showSuggestions:', this.showSuggestions);
          } else {
            console.warn('Invalid response format:', response);
            this.suggestions = [];
            this.showSuggestions = false;
          }
        } catch (error) {
          console.error('자동완성 실패:', error);
          console.error('Error details:', error.response);
        }
      }, 300);
    },

    // 자동완성 항목 선택
    selectSuggestion(suggestion) {
      console.log('Suggestion selected:', suggestion);
      this.searchKeyword = suggestion;
      this.showSuggestions = false;
      this.performSearch();
    },

    // 검색 수행
    async performSearch() {
      const keyword = this.searchKeyword.trim();
      
      if (!keyword) {
        showSnackbar('검색어를 입력해주세요.', 'warning');
        return;
      }

      this.currentSearchKeyword = keyword;
      this.showSuggestions = false;
      this.searchDialog = true;
      this.searchLoading = true;

      try {
        const response = await searchService.search(keyword);
        if (response.result && Array.isArray(response.result)) {
          this.searchResults = response.result;
        } else {
          this.searchResults = [];
        }
      } catch (error) {
        console.error('검색 실패:', error);
        showSnackbar('검색에 실패했습니다.', 'error');
        this.searchResults = [];
      } finally {
        this.searchLoading = false;
      }
    },

    // 검색어 하이라이트
    highlightKeyword(text) {
      if (!this.searchKeyword) return text;
      const keyword = this.searchKeyword.trim();
      const regex = new RegExp(`(${keyword})`, 'gi');
      return text.replace(regex, '<strong>$1</strong>');
    },

    // 문서 타입 이름
    getTypeName(docType) {
      const typeMap = {
        stones: '프로젝트',
        documents: '문서',
        files: '파일',
        tasks: '태스크',
      };
      return typeMap[docType] || docType;
    },

    // 문서 타입 색상
    getTypeColor(docType) {
      const colorMap = {
        stones: 'blue',
        documents: 'green',
        files: 'orange',
        tasks: 'purple',
      };
      return colorMap[docType] || 'grey';
    },

    // 날짜 포맷
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR');
    },

    // 검색 결과 열기
    openResult(result) {
      this.searchDialog = false;
      
      // 문서 타입에 따라 라우팅
      if (result.docType === 'documents') {
        // 문서는 독립적인 뷰어로 새 탭에서 열기
        const routeData = this.$router.resolve(`/viewer/${result.id}`);
        window.open(routeData.href, '_blank');
      } else if (result.docType === 'stones') {
        this.$router.push({ path: '/project', query: { id: result.id } });
      } else if (result.docType === 'files') {
        // 파일은 다운로드 또는 미리보기
        showSnackbar('파일 미리보기 기능은 준비 중입니다.', 'info');
      } else if (result.docType === 'tasks') {
        showSnackbar('태스크 상세 페이지는 준비 중입니다.', 'info');
      }
    },

    // 외부 클릭 처리
    handleClickOutside(event) {
      const searchContainer = this.$el.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        this.showSuggestions = false;
      }
    },
  },
};
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 280px;
  right: 0;
  height: 83px;
  z-index: 1000;
  background: #F5F5F5;
  color: #000000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  overflow: visible !important;
}

.app-header :deep(.v-toolbar__content) {
  overflow: visible !important;
}

.search-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: min(640px, calc(100vw - 400px));
  max-width: 640px;
  min-width: 300px;
  height: 42px;
  display: flex;
  align-items: center;
  z-index: 9999;
}

.search-input {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

.search-field {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-radius: 25px;
  padding: 13px 17px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #757575;
  box-sizing: border-box;
}

.search-field:focus {
  outline: none;
  border-color: #1976d2;
}

.search-field::placeholder {
  color: #757575;
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  opacity: 0.7;
  cursor: pointer;
}

.search-icon:hover {
  opacity: 1;
}

/* 자동완성 드롭다운 */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10000;
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  font-size: 14px;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.suggestion-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item strong {
  color: #1976d2;
  font-weight: 600;
}

/* 검색 결과 모달 */
.search-result-header {
  background-color: #f5f5f5;
  font-weight: 600;
}

.search-results-container {
  max-height: 600px;
  padding: 16px;
}

.search-result-item {
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-result-item:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.result-title >>> em {
  background-color: #fff3cd;
  font-style: normal;
  font-weight: 700;
  padding: 0 2px;
}

.result-content {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.result-content >>> em {
  background-color: #fff3cd;
  font-style: normal;
  font-weight: 600;
  padding: 0 2px;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.result-creator {
  display: flex;
  align-items: center;
}

.result-date {
  color: #999;
}

.notification-btn {
  position: absolute;
  right: 80px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #F5F5F5 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1200px) {
  .notification-btn {
    right: 60px;
  }
}

@media (max-width: 768px) {
  .notification-btn {
    right: 50px;
  }
}

.bell-icon {
  width: 20px;
  height: 20px;
  opacity: 0.8;
}

.user-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #F5F5F5 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .user-btn {
    right: 10px;
  }
}

.user-icon {
  width: 20px;
  height: 20px;
  opacity: 0.8;
  filter: brightness(0);
}
</style>
