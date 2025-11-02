<template>
  <v-app>
    <SideBarComponent v-if="!hideLayout" />
    <HeaderComponent v-if="!hideLayout" />
    <v-main :class="hideLayout ? 'no-offset' : 'with-offset'">
      <router-view />
      <GlobalSnackbar />
    </v-main>

    <!-- 전역 챗봇 버튼 및 오버레이 -->
    <v-btn
      v-if="!hideLayout && !hideChatbot"
      class="chatbot-fab"
      :class="{ dragging: isFabDragging }"
      icon
      :style="{ left: fabX + 'px', top: fabY + 'px' }"
      @mousedown.prevent="onFabPointerDown($event)"
      @touchstart.passive="onFabPointerDown($event)"
      @click.stop.prevent="onFabClick"
    >
      <v-icon>mdi-robot-outline</v-icon>
    </v-btn>
    <v-overlay v-if="!hideLayout && !hideChatbot" :model-value="isChatBotOpen" scrim="rgba(0,0,0,0.25)" @click:outside="isChatBotOpen = false" class="align-end justify-end" persistent>
      <ChatBotPage @close="isChatBotOpen = false" />
    </v-overlay>
    
    <!-- 워크스페이스 생성 모달 (전체 화면에서 렌더링) -->
    <CreateWorkspaceModal 
      :show="showCreateModal" 
      @close="closeCreateModal"
    />
    
    <!-- 프로젝트 생성 모달 (전체 화면에서 렌더링) -->
    <CreateProjectModal v-model="showProjectModal" />
    <!-- 전역 캘린더 상세 모달 -->
    <CalendarDetailModal v-model="isCalendarModalOpen" :details="calendarModalDetails" @save="onCalendarModalSave" />
  </v-app>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue';
import SideBarComponent from './components/SideBarComponent.vue';
import CreateWorkspaceModal from './views/Workspace/CreateWorkspaceModal.vue';
import CreateProjectModal from './views/Project/CreateProjectModal.vue';
import GlobalSnackbar from './components/GlobalSnackbar.vue';
import ChatBotPage from './views/ChatBot/ChatBotPage.vue';
import CalendarDetailModal from './components/schedule/CalendarDetailModal.vue';
import axios from 'axios';
import { showSnackbar } from './services/snackbar.js';
import notificationStompManager from './services/notificationStompService.js';
import { setChatUnreadCount } from './services/notificationState.js';

export default {
  name: "App",
  components: {
    SideBarComponent,
    HeaderComponent,
    GlobalSnackbar,
    CreateWorkspaceModal,
    CreateProjectModal,
    ChatBotPage,
    CalendarDetailModal,
  },
  data() {
    return {
      isChatBotOpen: false,
      fabX: 0,
      fabY: 0,
      isFabDragging: false,
      hasFabMoved: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      fabSize: 56,
      showCreateModal: false,
      showProjectModal: false,
      isCalendarModalOpen: false,
      calendarModalDetails: null
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.loadFabPosition();
      window.addEventListener('mousemove', this.onFabPointerMove, { passive: true });
      window.addEventListener('mouseup', this.onFabPointerUp, { passive: true });
      window.addEventListener('touchmove', this.onFabPointerMove, { passive: false });
      window.addEventListener('touchend', this.onFabPointerUp, { passive: true });
      window.addEventListener('resize', this.onWindowResize, { passive: true });
      // Global modal open events
      window.addEventListener('openCreateWorkspaceModal', () => {
        this.showCreateModal = true;
      });
      window.addEventListener('openCreateProjectModal', () => {
        this.showProjectModal = true;
      });
      window.addEventListener('openCalendarDetailModal', (e) => {
        try {
          this.calendarModalDetails = e?.detail || null;
          this.isCalendarModalOpen = true;
        } catch(_) {}
      });
      // Notifications STOMP subscribe
      this.initNotificationSubscription();
    });
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onFabPointerMove);
    window.removeEventListener('mouseup', this.onFabPointerUp);
    window.removeEventListener('touchmove', this.onFabPointerMove);
    window.removeEventListener('touchend', this.onFabPointerUp);
    window.removeEventListener('resize', this.onWindowResize);
  },
  computed: {
    hideLayout() {
      return this.$route.meta?.hideLayout === true;
    },
    hideChatbot() {
      return this.$route.meta?.hideChatbot === true;
    }
  },
  methods: {
    async initNotificationSubscription(){
      try {
        const id = localStorage.getItem('id');
        if (!id) return;
        await notificationStompManager.connect();
        const topic = `/topic/notification/${id}`;
        if (this._notifUnsub) { try { this._notifUnsub(); } catch(_) {} this._notifUnsub = null; }
        this._notifUnsub = await notificationStompManager.subscribe(topic, (payload) => {
          try {
            console.log('[notif] incoming', payload);
            let text = '';
            if (typeof payload === 'string') {
              text = payload;
            } else if (payload && typeof payload === 'object') {
              const title = payload.title || payload.subject || '';
              const body = payload.content || payload.message || payload.text || '';
              text = title ? `${title} - ${body}` : (body || JSON.stringify(payload));
              // Update chat unread badge when NEW_CHAT_MESSAGE
              if (String(payload.type).toUpperCase() === 'NEW_CHAT_MESSAGE') {
                setChatUnreadCount(title);
              }
            } else {
              text = '새 알림이 도착했습니다.';
            }
            showSnackbar(text, { color: 'info' });
          } catch(_) {}
        });
        // reconnect on close
        if (!this._notifOffClose) {
          this._notifOffClose = notificationStompManager.on('close', async () => {
            try { await notificationStompManager.connect(); this.initNotificationSubscription(); } catch(_) {}
          });
        }
      } catch(_) {}
    },
    onFabClick() {
      if (this.hasFabMoved) { this.hasFabMoved = false; return; }
      this.isChatBotOpen = true;
    },
    onFabPointerDown(e) {
      const point = this.getPoint(e);
      this.isFabDragging = true;
      this.hasFabMoved = false;
      this.dragOffsetX = point.x - this.fabX;
      this.dragOffsetY = point.y - this.fabY;
    },
    onFabPointerMove(e) {
      if (!this.isFabDragging) return;
      const point = this.getPoint(e);
      const nextX = point.x - this.dragOffsetX;
      const nextY = point.y - this.dragOffsetY;
      const clamped = this.clampToViewport(nextX, nextY);
      if (Math.abs(clamped.x - this.fabX) > 1 || Math.abs(clamped.y - this.fabY) > 1) {
        this.hasFabMoved = true;
      }
      this.fabX = clamped.x;
      this.fabY = clamped.y;
      if (e.cancelable) e.preventDefault();
    },
    onFabPointerUp() {
      if (!this.isFabDragging) return;
      this.isFabDragging = false;
      this.saveFabPosition();
    },
    getPoint(e) {
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    },
    clampToViewport(x, y) {
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - this.fabSize - margin);
      const maxY = Math.max(margin, window.innerHeight - this.fabSize - margin);
      const clampedX = Math.min(Math.max(x, margin), maxX);
      const clampedY = Math.min(Math.max(y, margin), maxY);
      return { x: clampedX, y: clampedY };
    },
    onWindowResize() {
      const clamped = this.clampToViewport(this.fabX, this.fabY);
      this.fabX = clamped.x;
      this.fabY = clamped.y;
      this.saveFabPosition();
    },
    loadFabPosition() {
      try {
        const x = Number(localStorage.getItem('chatbotFabX'));
        const y = Number(localStorage.getItem('chatbotFabY'));
        if (Number.isFinite(x) && Number.isFinite(y)) {
          // 레거시/이상치 보정: 좌상단에 너무 붙어있다면 기본값으로 재설정
          if (x <= 24 && y <= 24) {
            // fall through to default
          } else {
            const clampedStored = this.clampToViewport(x, y);
            this.fabX = clampedStored.x;
            this.fabY = clampedStored.y;
            return;
          }
        }
      } catch (_) {}
      const defX = window.innerWidth - 24 - this.fabSize;
      const defY = window.innerHeight - 24 - this.fabSize;
      const clampedDefault = this.clampToViewport(defX, defY);
      this.fabX = clampedDefault.x;
      this.fabY = clampedDefault.y;
    },
    saveFabPosition() {
      try {
        localStorage.setItem('chatbotFabX', String(this.fabX));
        localStorage.setItem('chatbotFabY', String(this.fabY));
      } catch (_) {}
    },
    closeCreateModal() {
      this.showCreateModal = false;
    },
    async onCalendarModalSave(form){
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const workspaceId = localStorage.getItem('selectedWorkspaceId') || 'ws_1';
      try {
        if (form.calendarType === 'ToDo' || form.calendarType === 'TODO') {
          const body = {
            workspaceId,
            calendarName: form.calendarName || '',
            calendarType: 'TODO',
            date: form.startedAtDate || (form.startedAt ? String(form.startedAt).slice(0,10) : ''),
            bookmark: !!form.bookmark,
          };
          await axios.post(`${baseURL}/user-service/todo`, body, { headers: { 'Content-Type': 'application/json' } });
          showSnackbar('ToDo가 등록되었습니다.', { color: 'success' });
        } else { // 개인 일정
          // repeatEndAt은 날짜+시간으로 전송: 날짜는 repeatEndAtDate, 시간은 endedAt의 시간부 사용(없으면 00:00:00)
          const endedAtStr = form.endedAt ? String(form.endedAt) : '';
          let timePart = '00:00:00';
          if (endedAtStr.includes('T')) {
            const t = endedAtStr.split('T')[1] || '';
            timePart = t.length === 5 ? `${t}:00` : (t || '00:00:00');
          }
          const repeatEndAtFull = form.repeatEndAtDate
            ? `${form.repeatEndAtDate}T${timePart}`
            : (endedAtStr || '');
          const body = {
            workspaceId,
            calendarName: form.calendarName || '',
            startedAt: form.startedAt || '',
            endedAt: form.endedAt || '',
            repeatCycle: form.recurrence || 'NONE',
            repeatEndAt: repeatEndAtFull,
            isShared: !!form.isShared,
          };
          await axios.post(`${baseURL}/user-service/shared-calendars`, body, { headers: { 'Content-Type': 'application/json' } });
          showSnackbar('일정이 등록되었습니다.', { color: 'success' });
        }
      } catch (e) {
        showSnackbar('등록에 실패했습니다. 다시 시도해 주세요.', { color: 'error' });
      }
    },
  },
}
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
.with-offset { padding-top: 64px; padding-left: 280px; }
.no-offset { padding: 0; }

.chatbot-fab { position: fixed; background: #FFE364; color: #2A2828; cursor: grab; z-index: 1500; width: 56px; height: 56px; }
.chatbot-fab.dragging { cursor: grabbing; }
.chatbot-fab:focus, .chatbot-fab:focus-visible { outline: none !important; box-shadow: none !important; }
.chatbot-fab { -webkit-tap-highlight-color: transparent; }
</style>

<style>
/* 관리자 페이지일 때 전체 배경을 회색으로 설정 */
body {
  background: #F5F5F5;
}

/* 관리자 페이지 라우트일 때 */
.v-main {
  background: #F5F5F5;
}
</style>