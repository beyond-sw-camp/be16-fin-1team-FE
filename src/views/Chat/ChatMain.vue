<template>
    <div class="main-fill">
        <div class="chat-layout">
            <div class="room-list-panel">
                <ChatRoomList embedded @select-room="handleSelectRoom" />
            </div>
            <div class="chat-panel">
                <StompChatPage embedded :room-id="selectedRoomId" />
            </div>
        </div>
    </div>
    
</template>

<script>
import ChatRoomList from './ChatRoomList.vue';
import StompChatPage from './StompChatPage.vue';

export default {
    components: { ChatRoomList, StompChatPage },
    data() {
        return {
            selectedRoomId: null,
        };
    },
    methods: {
        handleSelectRoom(roomId) {
            this.selectedRoomId = roomId;
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
</style>