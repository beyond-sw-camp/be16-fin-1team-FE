<template>
    <div class="main-fill">
        <div class="chat-layout">
            <div class="room-list-panel">
                <ChatRoomList embedded @select-room="handleSelectRoom" @preview-summary="handlePreviewSummary" :summaries-by-room-id="summariesByRoomId" :selected-room-id="selectedRoomId" />
            </div>
            <div class="chat-panel">
                  <StompChatPage v-if="selectedRoomId" embedded :room-id="selectedRoomId" :room-title="selectedRoomTitle" :participant-count="selectedRoomParticipantCount" />
                  <div v-else class="empty-state">
                    <div class="empty-icon" aria-hidden="true"></div>
                    <div class="empty-text">채팅방을 선택하세요.</div>
                  </div>
            </div>
        </div>
    </div>
    
    <!-- 우하단 챗봇 버튼 및 오버레이 -->
    <v-btn class="chatbot-fab" icon @click="isChatBotOpen = true">
        <v-icon>mdi-robot-outline</v-icon>
    </v-btn>
    <v-overlay :model-value="isChatBotOpen" scrim="rgba(0,0,0,0.25)" @click:outside="isChatBotOpen = false" class="align-end justify-end" persistent>
        <ChatBotPage />
    </v-overlay>

    <!-- 요약 미리보기 다이얼로그 -->
    <v-dialog v-model="isSummaryDialogOpen" max-width="520px">
        <v-card class="summary-card">
            <v-card-title class="text-h6 summary-title">요약 미리보기</v-card-title>
            <v-card-text class="summary-body" :key="summaryDialogVersion">
                <div v-if="summaryDialogLoading" class="d-flex align-center justify-center" style="min-height:120px">
                    <v-progress-circular indeterminate :size="42" :width="4" color="#FFE364" />
                </div>
                <div v-else v-html="formatMultiline(summaryDialogText)" style="white-space: normal; line-height: 1.5;"></div>
            </v-card-text>
            <v-card-actions class="justify-end summary-actions">
                <v-btn class="summary-btn" variant="flat" @click="isSummaryDialogOpen = false">닫기</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

</template>

<script>
import ChatRoomList from './ChatRoomList.vue';
import StompChatPage from './StompChatPage.vue';
import stompManager from '@/services/stompService.js';
import ChatBotPage from '../ChatBot/ChatBotPage.vue';
import axios from 'axios';

export default {
    components: { ChatRoomList, StompChatPage, ChatBotPage },
    data() {
        return {
            selectedRoomId: null,
            selectedRoomTitle: '',
            selectedRoomParticipantCount: 0,
            summariesByRoomId: {},
            summaryUnsub: null,
            summaryTopic: null,
            _offClose: null,
            _reconnectTimerSummary: null,
            isChatBotOpen: false,
            isSummaryDialogOpen: false,
            summaryDialogLoading: false,
            summaryDialogText: '',
            summaryDialogVersion: 0,
        };
    },
    async created() {
                        const id = localStorage.getItem('id');
        if (id) {
            const topic = `/topic/summary/${id}`;
                            this.summaryUnsub = await stompManager.subscribe(topic, (summary) => {
                                // summary: { roomId, lastMessage, lastSendTime, lastSenderEmail, unreadCount, messageType }
                                try { console.log('[summary] incoming', summary); } catch(_) {}
                if (summary && summary.roomId != null) {
                                    this.summariesByRoomId = {
                        ...this.summariesByRoomId,
                        [summary.roomId]: {
                            ...(this.summariesByRoomId[summary.roomId] || {}),
                            ...summary,
                        },
                    };
                                    try { console.log('[summary] merged for room', summary.roomId, this.summariesByRoomId[summary.roomId]); } catch(_) {}
                                } else {
                                    try { console.warn('[summary] malformed payload', summary); } catch(_) {}
                }
            });
            this.summaryTopic = topic;
        }
        // Connection close detection
        this._offClose = stompManager.on('close', (evt) => {
            this.startSummaryReconnectLoop();
        });
    },
    beforeRouteLeave(to, from, next) {
        if (this.summaryUnsub) {
            try { this.summaryUnsub(); } catch (_) {}
            this.summaryUnsub = null;
        }
        try { stompManager.disconnect(); } catch (_) {}
        if (this._offClose) { try { this._offClose(); } catch (_) {} this._offClose = null; }
        if (this._reconnectTimerSummary) { clearInterval(this._reconnectTimerSummary); this._reconnectTimerSummary = null; }
        next();
    },
    beforeUnmount() {
        if (this.summaryUnsub) {
            try { this.summaryUnsub(); } catch (_) {}
            this.summaryUnsub = null;
        }
        try { stompManager.disconnect(); } catch (_) {}
        if (this._offClose) { try { this._offClose(); } catch (_) {} this._offClose = null; }
        if (this._reconnectTimerSummary) { clearInterval(this._reconnectTimerSummary); this._reconnectTimerSummary = null; }
    },
    methods: {
        handleSelectRoom(room) {
            this.selectedRoomId = room.roomId;
            this.selectedRoomTitle = room.roomName || '';
            this.selectedRoomParticipantCount = room.participantCount || 0;
            // Clear unread badge for the selected room in summary map
            const prev = this.summariesByRoomId[room.roomId] || {};
            this.summariesByRoomId = {
                ...this.summariesByRoomId,
                [room.roomId]: { ...prev, unreadCount: 0 }
            };
        },
        async resubscribeSummary() {
            if (!this.summaryTopic) return;
                            try {
                if (this.summaryUnsub) { try { this.summaryUnsub(); } catch(_) {} }
                                this.summaryUnsub = await stompManager.subscribe(this.summaryTopic, (summary) => {
                                    try { console.log('[summary][resub] incoming', summary); } catch(_) {}
                                    if (summary && summary.roomId != null) {
                                        this.summariesByRoomId = {
                                            ...this.summariesByRoomId,
                                            [summary.roomId]: {
                                                ...(this.summariesByRoomId[summary.roomId] || {}),
                                                ...summary,
                                            },
                                        };
                                        try { console.log('[summary][resub] merged for room', summary.roomId, this.summariesByRoomId[summary.roomId]); } catch(_) {}
                                    } else {
                                        try { console.warn('[summary][resub] malformed payload', summary); } catch(_) {}
                                    }
                                });
            } catch(_) {}
        },
        startSummaryReconnectLoop() {
            if (this._reconnectTimerSummary) return;
            this._reconnectTimerSummary = setInterval(async () => {
                try {
                    await stompManager.connect();
                    await this.resubscribeSummary();
                    clearInterval(this._reconnectTimerSummary);
                    this._reconnectTimerSummary = null;
                } catch(_) {}
            }, 5000);
        },
        async handlePreviewSummary(room) {
            this.isSummaryDialogOpen = true;
            this.summaryDialogLoading = true;
            this.summaryDialogText = '';
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                console.log('[summary] request roomId=', room?.roomId);
                const { data } = await axios.get(`${baseURL}/workspace-service/chatbot/message/chat-room/${room.roomId}`);
                console.log('[summary] response data=', data);
                const text = (data && data.result && typeof data.result === 'object') ? (data.result.text || '') : (typeof data?.result === 'string' ? data.result : '');
                this.summaryDialogText = String(text || '');
                this.summaryDialogLoading = false;
                console.log('[summary] set text & stop loading');
                try { await this.$nextTick(); } catch(_) {}
            } catch (e) {
                console.error('[summary] request failed', e);
                this.summaryDialogText = '요약을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
            } finally {
                this.summaryDialogLoading = false;
                console.log('[summary] loading ->', this.summaryDialogLoading, 'text len=', (this.summaryDialogText||'').length);
                this.summaryDialogVersion++;
                try { await this.$nextTick(); } catch(_) {}
                // 안전망: 혹시 반영이 지연될 경우 200ms 후 한 번 더 로딩 해제
                setTimeout(() => { this.summaryDialogLoading = false; }, 200);
            }
        },
        formatMultiline(text) {
            if (!text) return '';
            return String(text).replace(/\n/g, '<br/>');
        }
    }
};
</script>

<style scoped>
.main-fill {
  position: fixed;
  top: 64px;
  left: 240px;
  right: 0;
  bottom: 0;
  background-color: #F5F5F5;
}
.chat-layout {
  display: flex;
  height: 100%;
}
.room-list-panel {
  flex: 0 0 30%;
  min-width: 240px; /* 너무 좁아지지 않도록 하한 */
  border-right: none;
  overflow: auto;
}
.chat-panel {
  flex: 1 1 80%;
  overflow: auto;
}
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9E9E9E;
  font-size: 14px;
  flex-direction: column;
}
.empty-icon{
  width: 64px; height: 64px; margin-bottom: 12px; opacity: 0.9;
  mask: url('@/assets/icons/chat/chat-processing.svg') no-repeat center / contain;
  -webkit-mask: url('@/assets/icons/chat/chat-processing.svg') no-repeat center / contain;
  background-color: #9E9E9E; /* 텍스트와 동일 색상 */
}
.empty-text{ font-size: 14px; color: #9E9E9E; }
.chatbot-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  background: #FFE364;
  color: #2A2828;
}

/* Summary dialog styling */
.summary-card{ --v-card-border-radius: 15px; border-radius: 15px !important; overflow: hidden; }
.summary-title{ background: #FFE364; color: #1C0F0F; font-weight: 700; }
.summary-body{ padding-top: 16px; }
.summary-actions{ padding: 12px 16px; }
.summary-btn{ background: #FFE364 !important; color: #2A2828 !important; font-weight: 600; }
</style>