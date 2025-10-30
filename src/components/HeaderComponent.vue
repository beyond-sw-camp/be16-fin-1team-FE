<template>
  <v-app-bar class="app-header" flat density="comfortable" style="overflow: visible !important;">
    <!-- 좌측 뒤로/앞으로 이동 버튼 -->
    <div class="nav-buttons">
      <v-btn class="nav-btn" variant="text" density="compact" v-ripple="false" @click="goBack">
        <img src="@/assets/icons/header/chevron-left.svg" alt="뒤로" class="nav-icon" />
      </v-btn>
      <v-btn class="nav-btn" variant="text" density="compact" v-ripple="false" @click="goForward">
        <img src="@/assets/icons/header/chevron-right.svg" alt="앞으로" class="nav-icon" />
      </v-btn>
    </div>
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
          src="@/assets/icons/header/magnify.svg" 
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
    
    <!-- 알림 메뉴 -->
    <v-menu v-model="notifMenu" :close-on-content-click="false" location="bottom end" offset="8" content-class="notif-overlay">
      <template #activator="{ props }">
        <v-btn icon class="notification-btn" v-bind="props">
          <img src="@/assets/icons/header/bell.svg" alt="알림" class="bell-icon" />
          <span v-if="notifCount > 0" class="notif-badge">{{ notifBadgeText }}</span>
        </v-btn>
      </template>
      <v-list density="compact" class="notif-menu-list">
        <div class="notif-menu-header">
          <div class="notif-title">알림</div>
          <div class="notif-count-pill">{{ notifList.length }}</div>
        </div>
        <v-divider class="user-menu-divider"></v-divider>
        <div v-if="notifLoading" class="notif-loading">불러오는 중…</div>
        <template v-else>
          <div v-if="notifList.length === 0" class="notif-empty">알림이 없습니다</div>
          <div v-else class="notif-list">
            <div v-for="(n, idx) in notifList" :key="n.id" class="notif-item" :class="{ unread: (n.readStatus||'').toUpperCase()==='UNREAD' }">
              <button class="notif-dismiss" title="닫기" @click.stop="onDismissNotif(n.id, idx)">
                <img src="@/assets/icons/user/close.svg" alt="닫기" />
              </button>
              <div class="notif-item-title">{{ n.title }}</div>
              <div class="notif-item-content">{{ n.content }}</div>
              <div class="notif-item-time">{{ formatDateTime(n.createdAt) }}</div>
            </div>
          </div>
        </template>
      </v-list>
    </v-menu>
    
    <!-- 사용자 메뉴 -->
    <v-menu v-model="userMenu" :close-on-content-click="true" location="bottom end" offset="8" content-class="user-overlay">
      <template #activator="{ props }">
        <v-btn icon class="user-btn" v-bind="props">
          <img src="@/assets/icons/header/account.svg" alt="사용자" class="user-icon" />
        </v-btn>
      </template>
      <v-list density="compact" class="user-menu-list">
        <div class="user-menu-header">
          <img v-if="userInfo?.profileImageUrl" :src="userInfo.profileImageUrl" alt="프로필" class="user-menu-avatar" />
          <div v-else class="user-menu-avatar default">
            <img src="@/assets/icons/user/account-circle.svg" alt="기본 사용자" class="user-menu-avatar-icon" />
          </div>
          <div class="user-menu-meta">
            <div class="user-menu-name">{{ userInfo?.name || '이름 없음' }}</div>
            <div class="user-menu-email">{{ userInfo?.email || '-' }}</div>
          </div>
        </div>
        <v-divider class="user-menu-divider"></v-divider>
        <v-list-item class="user-menu-item" @click="goMyPage">
          <template #prepend>
            <img src="@/assets/icons/user/account-circle.svg" alt="프로필" class="menu-icon" />
          </template>
          <v-list-item-title>마이 페이지</v-list-item-title>
        </v-list-item>
        <v-divider class="user-menu-divider"></v-divider>
        <v-list-item class="user-menu-item" @click="logout">
          <template #prepend>
            <img src="@/assets/icons/user/logout.svg" alt="로그아웃" class="menu-icon" />
          </template>
          <v-list-item-title>로그아웃</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

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
import axios from 'axios';
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
      userMenu: false,
      notifMenu: false,
      notifLoading: false,
      notifList: [],
      notifCount: 0,
      userInfo: { name: '', email: '', profileImageUrl: null },
    };
  },
  computed: {
    notifBadgeText() {
      const n = Number(this.notifCount) || 0;
      return n <= 9 ? String(n) : '9+';
    }
  },

  mounted() {
    // 클릭 이벤트로 자동완성 닫기
    document.addEventListener('click', this.handleClickOutside);
    // 초기 알림 카운트 로드
    this.loadNotifications();
    // realtime incoming notification
    window.addEventListener('pushNotification', this.onPushNotif);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
    if (this.suggestTimer) {
      clearTimeout(this.suggestTimer);
    }
    window.removeEventListener('pushNotification', this.onPushNotif);
  },

  methods: {
    // 앞으로/뒤로 이동
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      }
    },
    async loadUserInfo() {
      try {
        const id = localStorage.getItem('id');
        if (!id) return;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const { data } = await axios.get(`${baseURL}/user-service/user/${id}`);
        this.userInfo = data?.result || this.userInfo;
      } catch (_) {}
    },
    goForward() {
      this.$router.forward();
    },
    goMyPage() {
      this.userMenu = false;
      this.$router.push('/my-info');
    },
    async logout() {
      this.userMenu = false;
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const accessToken = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        await axios.post(`${baseURL}/user-service/user/auth/logout`, {}, { headers });
      } catch (_) {
        // 서버 요청 실패하더라도 클라이언트 로그아웃은 진행
      } finally {
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('id');
        } catch (_) {}
        this.$router.push('/landing');
        try { showSnackbar('로그아웃되었습니다.', 'info'); } catch(_) {}
      }
    },
    async loadNotifications() {
      try {
        this.notifLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const accessToken = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const { data } = await axios.get(`${baseURL}/user-service/notification/list`, { headers });
        const list = Array.isArray(data?.result) ? data.result : [];
        this.notifList = list;
      } catch (_) {
        this.notifList = [];
      } finally {
        this.notifLoading = false;
      }
      this.notifCount = this.notifList.length;
    },
    async onDismissNotif(id, index) {
      // optimistic remove
      const removed = this.notifList.splice(index, 1);
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const accessToken = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        if (id !== undefined && id !== null) {
          await axios.delete(`${baseURL}/user-service/notification/${id}`, { headers });
        }
      } catch (_) {
        // rollback on failure
        if (removed && removed.length) this.notifList.splice(index, 0, removed[0]);
      }
    },
    formatDateTime(iso) {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        const date = d.toLocaleDateString('ko-KR');
        const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        return `${date} ${time}`;
      } catch (_) { return iso; }
    },
    onPushNotif(e) {
      try {
        const n = e?.detail || {};
        const createdAt = n.createdAt || new Date().toISOString();
        const item = {
          id: n.id,
          title: n.title || '알림',
          content: n.content || '',
          readStatus: (n.readStatus || 'UNREAD'),
          createdAt,
        };
        this.notifList = [item, ...(this.notifList || [])];
        this.notifCount = this.notifList.length;
      } catch(_) {}
    },
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
        this.$router.push(`/document/${result.id}`);
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
  watch: {
    userMenu(val) {
      if (val) this.loadUserInfo();
    },
    notifMenu(val) {
      if (val) this.loadNotifications();
    }
  }
};
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 280px;
  right: 0;
  height: 64px;
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

/* 좌측 내비게이션 버튼 영역 */
.nav-buttons {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 8px;
}

.nav-btn {
  width: auto !important;
  height: auto !important;
  min-width: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.nav-icon {
  width: 24px;
  height: 24px;
  opacity: 0.8;
}

/* Vuetify 내부 오버레이/리플 제거 */
.nav-btn :deep(.v-btn__overlay),
.nav-btn :deep(.v-btn__underlay),
.nav-btn :deep(.v-ripple__container) {
  display: none !important;
}

/* 화살표 버튼 포커스 링 제거 */
.nav-btn:focus,
.nav-btn:focus-visible,
.nav-btn:active,
.nav-btn:focus-within {
  outline: none !important;
  box-shadow: none !important;
}
.nav-btn *:focus,
.nav-btn *:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.app-header :deep(.v-toolbar__content) {
  overflow: visible !important;
  min-height: 64px !important;
}

.search-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: min(820px, calc(100vw - 360px));
  max-width: 820px;
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
  background: #FFFFFF;
  border-radius: 25px;
  box-shadow: inset 0 0 0 1px #DDDDDD;
}

.search-field {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  padding: 13px 17px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #757575;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: none;
}

.search-input:focus-within {
  outline: none;
  box-shadow: inset 0 0 0 1px #DDDDDD;
}

/* 헤더 내 포커스 아웃라인 제거 */
:deep(.v-btn:focus),
:deep(.v-btn:focus-visible),
:deep(button:focus),
:deep(button:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

.search-field:focus,
.search-field:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.search-field::placeholder {
  color: #757575;
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
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
  right: 70px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px !important;
  height: 34px !important;
  min-width: 34px !important;
  padding: 0 !important;
  background: #E0E0E0 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn { position: absolute; }
.notification-btn .notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 50%;
  background: #EF5350;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 800;
  line-height: 18px;
  display: inline-flex;
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
  width: 34px !important;
  height: 34px !important;
  min-width: 34px !important;
  padding: 0 !important;
  background: #E0E0E0 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-menu-list {
  min-width: 260px;
  background: #2A2828 !important;
  color: #FFFFFF !important;
  border-radius: 0;
  padding: 0 0 8px;
}

.notif-menu-list {
  min-width: 380px;
  background: #2A2828 !important;
  color: #FFFFFF !important;
  border-radius: 0;
  padding: 0 0 8px;
  box-shadow: 0 10px 28px rgba(0,0,0,0.28);
  border: 1px solid rgba(255,255,255,0.06);
}
:deep(.notif-overlay) {
  border-radius: 12px !important;
  overflow: hidden !important;
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
.notif-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #343131;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.notif-title { font-weight: 800; font-size: 14px; }
.notif-count-pill {
  background: none;
  color: #FFE364;
  font-weight: 800;
  font-size: 13px;
}
.notif-loading, .notif-empty { padding: 16px 14px; font-size: 13px; color: #CFCFCF; }
.notif-list { max-height: 380px; overflow-y: auto; padding: 4px 8px; }
.notif-item {
  padding: 12px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  border-radius: 0;
  background: transparent;
  position: relative;
}
.notif-item:hover { background: rgba(255,255,255,0.03); }
.notif-item:last-child { border-bottom: none; }
.notif-item.unread { border-left: none; }
.notif-item-title { font-weight: 700; font-size: 13.5px; color: #FFFFFF; margin-bottom: 4px; line-height: 1.35; }
.notif-item-content { font-size: 12.5px; color: #DEDEDE; margin-bottom: 6px; line-height: 1.45; }
.notif-item-time { font-size: 11.5px; color: #BDBDBD; }

.notif-dismiss {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}
.notif-dismiss img { width: 100%; height: 100%; filter: invert(1) brightness(1.2); opacity: 0.75; }
.notif-dismiss:hover img { opacity: 1; }
.notif-dismiss:focus, .notif-dismiss:focus-visible { outline: none; box-shadow: none; }

.user-menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px 10px;
  background: #343131;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.user-menu-name { font-weight: 700; font-size: 14px; color: #FFFFFF; line-height: 1.2; }
.user-menu-email { font-size: 12px; color: #CFCFCF; line-height: 1.2; margin-top: 2px; }

:deep(.user-overlay) {
  border-radius: 12px !important;
  overflow: hidden !important;
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
.user-menu-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: #D9D9D9;
}
.user-menu-avatar.default {
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-menu-avatar-icon {
  width: 70%;
  height: 70%;
  filter: invert(1) brightness(1.2);
}
.user-menu-meta { display: flex; flex-direction: column; min-width: 0; }
.user-menu-name { font-weight: 700; font-size: 14px; color: #FFFFFF; line-height: 1.2; }
.user-menu-email { font-size: 12px; color: #CFCFCF; line-height: 1.2; margin-top: 2px; }

.user-menu-item {
  color: #FFFFFF !important;
}
.user-menu-item:hover {
  background: #3A3838 !important;
}
.user-menu-divider {
  border-color: rgba(255,255,255,0.12) !important;
}
.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  filter: invert(1) brightness(1.2);
}
.user-menu-list :deep(.v-list-item__overlay) {
  opacity: 0 !important;
}
.user-menu-list :deep(.v-list-item-title) {
  color: #FFFFFF !important;
  font-size: 14px;
}
.user-menu-list :deep(.v-list-item) {
  color: #FFFFFF !important;
}
.user-menu-list :deep(.v-list) { background: transparent !important; padding-top: 0 !important; padding-bottom: 8px !important; }
.user-menu-list :deep(.v-ripple__container) { display: none !important; }

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
