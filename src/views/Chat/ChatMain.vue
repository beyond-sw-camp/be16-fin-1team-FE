<template>
    <div class="main-fill">
        <div class="chat-layout">
            <div class="room-list-panel">
                <ChatRoomList embedded @select-room="handleSelectRoom" :summaries-by-room-id="summariesByRoomId" :selected-room-id="selectedRoomId" />
            </div>
            <div class="chat-panel">
                <StompChatPage v-if="selectedRoomId" embedded :room-id="selectedRoomId" :room-title="selectedRoomTitle" :participant-count="selectedRoomParticipantCount" />
                <div v-else class="empty-state">채팅방을 선택하세요</div>
            </div>
        </div>
    </div>
    
</template>

<script>
import ChatRoomList from './ChatRoomList.vue';
import StompChatPage from './StompChatPage.vue';
import stompManager from '@/services/stompService.js';

export default {
    components: { ChatRoomList, StompChatPage },
    data() {
        return {
            selectedRoomId: null,
            selectedRoomTitle: '',
            selectedRoomParticipantCount: 0,
            summariesByRoomId: {},
            summaryUnsub: null,
        };
    },
    async created() {
        const id = localStorage.getItem('id');
        if (id) {
            const topic = `/topic/summary/${id}`;
            this.summaryUnsub = await stompManager.subscribe(topic, (summary) => {
                // summary: { roomId, lastMessage, lastSendTime, lastSenderEmail, unreadCount }
                if (summary && summary.roomId != null) {
                    this.summariesByRoomId = {
                        ...this.summariesByRoomId,
                        [summary.roomId]: {
                            ...(this.summariesByRoomId[summary.roomId] || {}),
                            ...summary,
                        },
                    };
                }
            });
        }
    },
    beforeRouteLeave(to, from, next) {
        if (this.summaryUnsub) {
            try { this.summaryUnsub(); } catch (_) {}
            this.summaryUnsub = null;
        }
        try { stompManager.disconnect(); } catch (_) {}
        next();
    },
    beforeUnmount() {
        if (this.summaryUnsub) {
            try { this.summaryUnsub(); } catch (_) {}
            this.summaryUnsub = null;
        }
        try { stompManager.disconnect(); } catch (_) {}
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
  border-right: 1px solid #E0E0E0;
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
}
</style>