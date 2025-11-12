<template>
  <div v-if="!hideLayout && !hideChatbot" class="chatbot-container" :style="{ left: fabX + 'px', top: fabY + 'px' }">
    <!-- 말풍선 애니메이션 -->
    <transition name="bubble-fade">
      <div v-if="showThinkingBubble" class="thinking-bubble">
        <span class="dot">.</span>
        <span class="dot">.</span>
        <span class="dot">.</span>
      </div>
    </transition>
    
    <!-- 챗봇 버튼 -->
    <v-btn
      class="chatbot-fab"
      :class="{ dragging: isFabDragging }"
      icon
      @mousedown.prevent="onFabPointerDown($event)"
      @touchstart.passive="onFabPointerDown($event)"
      @click.stop.prevent="onFabClick"
    >
      <v-icon>mdi-robot-outline</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'ChatBotButton',
  props: {
    hideLayout: {
      type: Boolean,
      default: false
    },
    hideChatbot: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fabX: 0,
      fabY: 0,
      fabXPct: null,
      fabYPct: null,
      isFabDragging: false,
      hasFabMoved: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      fabSize: 56,
      showThinkingBubble: false,
      thinkingBubbleTimer: null
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.applyInitialFabPosition();
      window.addEventListener('mousemove', this.onFabPointerMove, { passive: false });
      window.addEventListener('mouseup', this.onFabPointerUp, { passive: true });
      window.addEventListener('touchmove', this.onFabPointerMove, { passive: false });
      window.addEventListener('touchend', this.onFabPointerUp, { passive: true });
      window.addEventListener('resize', this.onWindowResize, { passive: true });
      
      // 10초마다 말풍선 애니메이션 시작
      this.startThinkingBubbleAnimation();
    });
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onFabPointerMove);
    window.removeEventListener('mouseup', this.onFabPointerUp);
    window.removeEventListener('touchmove', this.onFabPointerMove);
    window.removeEventListener('touchend', this.onFabPointerUp);
    window.removeEventListener('resize', this.onWindowResize);
    
    // 타이머 정리
    if (this.thinkingBubbleTimer) {
      clearInterval(this.thinkingBubbleTimer);
      this.thinkingBubbleTimer = null;
    }
  },
  methods: {
    applyInitialFabPosition() {
      const apply = () => {
        this.loadFabPosition();
      };
      apply();
      // 레이아웃 계산이 끝난 다음 한 번 더 적용해 위치가 덮어쓰여도 복원
      window.requestAnimationFrame(() => {
        apply();
      });
    },
    onFabClick() {
      if (this.hasFabMoved) { 
        this.hasFabMoved = false; 
        return; 
      }
      this.$emit('open-chatbot');
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
      // 스크롤 방지를 위해 touchmove 에서만 기본 동작 취소
      if (e.cancelable && (e.type === 'touchmove' || (e.touches && e.touches.length))) e.preventDefault();
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
      // 상대값(퍼센트) 기준으로 다시 픽셀 위치 환산
      const baseXPct = (this.fabXPct != null) ? this.fabXPct : (this.fabX / window.innerWidth);
      const baseYPct = (this.fabYPct != null) ? this.fabYPct : (this.fabY / window.innerHeight);
      const nextX = baseXPct * window.innerWidth;
      const nextY = baseYPct * window.innerHeight;
      const clamped = this.clampToViewport(nextX, nextY);
      this.fabX = clamped.x;
      this.fabY = clamped.y;
    },
    loadFabPosition() {
      try {
        // 1) 우선 최신 방식: 퍼센트 저장값을 사용
        const xp = Number(localStorage.getItem('chatbotFabXPct'));
        const yp = Number(localStorage.getItem('chatbotFabYPct'));
        if (Number.isFinite(xp) && Number.isFinite(yp) && xp >= 0 && xp <= 1 && yp >= 0 && yp <= 1) {
          // 저장된 값이 왼쪽 상단 근처(10% 이하)인 경우 기본값으로 재설정
          if (xp < 0.1 && yp < 0.1) {
            console.log('챗봇 위치가 왼쪽 상단에 있어 기본값(우측 하단)으로 재설정');
            this.setDefaultPosition();
            return;
          }
          this.fabXPct = xp;
          this.fabYPct = yp;
          const pxX = xp * window.innerWidth;
          const pxY = yp * window.innerHeight;
          const clamped = this.clampToViewport(pxX, pxY);
          this.fabX = clamped.x;
          this.fabY = clamped.y;
          return;
        }

        // 2) 레거시: 픽셀 저장값이 있으면 그것을 사용 후 퍼센트로 승격 저장
        const x = Number(localStorage.getItem('chatbotFabX'));
        const y = Number(localStorage.getItem('chatbotFabY'));
        if (Number.isFinite(x) && Number.isFinite(y)) {
          // 저장된 값이 왼쪽 상단 근처(100px 이하)인 경우 기본값으로 재설정
          if (x < 100 && y < 100) {
            console.log('챗봇 위치가 왼쪽 상단에 있어 기본값(우측 하단)으로 재설정');
            this.setDefaultPosition();
            return;
          }
          if (!(x <= 24 && y <= 24)) {
            const clampedStored = this.clampToViewport(x, y);
            this.fabX = clampedStored.x;
            this.fabY = clampedStored.y;
            this.fabXPct = this.fabX / window.innerWidth;
            this.fabYPct = this.fabY / window.innerHeight;
            this.saveFabPosition();
            return;
          }
        }
      } catch (_) {}
      // 3) 기본: 우하단 기준 상대값으로 배치
      this.setDefaultPosition();
    },
    setDefaultPosition() {
      // 우측 하단으로 기본 위치 설정
      const margin = 24;
      const defX = window.innerWidth - margin - this.fabSize;
      const defY = window.innerHeight - margin - this.fabSize;
      const clampedDefault = this.clampToViewport(defX, defY);
      this.fabX = clampedDefault.x;
      this.fabY = clampedDefault.y;
      this.fabXPct = this.fabX / window.innerWidth;
      this.fabYPct = this.fabY / window.innerHeight;
      this.saveFabPosition();
    },
    saveFabPosition() {
      try {
        // 퍼센트(상대값)로 저장
        const xp = Math.min(Math.max(this.fabX / window.innerWidth, 0), 1);
        const yp = Math.min(Math.max(this.fabY / window.innerHeight, 0), 1);
        this.fabXPct = xp;
        this.fabYPct = yp;
        localStorage.setItem('chatbotFabXPct', String(xp));
        localStorage.setItem('chatbotFabYPct', String(yp));
        // 레거시 호환을 위해 픽셀 값도 함께 저장
        localStorage.setItem('chatbotFabX', String(this.fabX));
        localStorage.setItem('chatbotFabY', String(this.fabY));
      } catch (_) {}
    },
    startThinkingBubbleAnimation() {
      // 20초마다 말풍선을 3초간 표시
      this.thinkingBubbleTimer = setInterval(() => {
        if (!this.isFabDragging) {
          this.showThinkingBubble = true;
          // 3초 후 말풍선 숨김
          setTimeout(() => {
            this.showThinkingBubble = false;
          }, 3000);
        }
      }, 20000);
    }
  }
}
</script>

<style scoped>
/* 챗봇 컨테이너 */
.chatbot-container {
  position: fixed;
  z-index: 1500;
  width: auto;
  height: auto;
}

/* 챗봇 버튼 */
.chatbot-fab { 
  background: #FFE364; 
  color: #2A2828; 
  cursor: grab; 
  width: 56px; 
  height: 56px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s ease;
}
.chatbot-fab:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}
.chatbot-fab.dragging { cursor: grabbing; }
.chatbot-fab:focus, .chatbot-fab:focus-visible { outline: none !important; box-shadow: none !important; }
.chatbot-fab { -webkit-tap-highlight-color: transparent; }

/* 말풍선 */
.thinking-bubble {
  position: absolute;
  left: 50%;
  bottom: 65px;
  transform: translateX(-50%);
  background: white;
  padding: 12px 18px;
  border-radius: 20px;
  border: 1px solid #E0E0E0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 24px;
  color: #2A2828;
  white-space: nowrap;
}

/* 말풍선 꼬리 (테두리) */
.thinking-bubble::before {
  content: '';
  position: absolute;
  bottom: -9px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-top: 10px solid #E0E0E0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
}

/* 말풍선 꼬리 (내부) */
.thinking-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-top: 10px solid white;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
}

/* 점 애니메이션 */
.thinking-bubble .dot {
  animation: dotPulse 1.5s infinite;
  opacity: 0.3;
}

.thinking-bubble .dot:nth-child(1) {
  animation-delay: 0s;
}

.thinking-bubble .dot:nth-child(2) {
  animation-delay: 0.3s;
}

.thinking-bubble .dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

/* 말풍선 페이드 인/아웃 효과 */
.bubble-fade-enter-active {
  animation: bubbleFadeIn 0.4s ease-out;
}

.bubble-fade-leave-active {
  animation: bubbleFadeOut 0.4s ease-in;
}

@keyframes bubbleFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes bubbleFadeOut {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px) scale(0.8);
  }
}
</style>

