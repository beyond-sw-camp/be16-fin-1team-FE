<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row>
                <v-col>
                    <v-card>
                        <v-card-title class="text-center text-h5">
                            채팅방목록
                            <div class="d-flex justify-end">
                                <!-- <v-btn color="secondary" @click="showCreateRoomModal=true">채팅방 생성</v-btn> -->
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-table>
                                <tbody>
                                    <tr
                                        v-for="chat in roomsWithSummary"
                                        :key="chat.roomId"
                                        @click="selectRoom(chat)"
                                        @mouseenter="hoveredRoomId = chat.roomId"
                                        @mouseleave="hoveredRoomId = null"
                                        :class="['room-row', { selected: selectedRoomId === chat.roomId }]"
                                    >
                                        <td class="col-avatar">
                                            <div v-if="Array.isArray(chat.userProfileImageUrlList) && visibleAvatars(chat.userProfileImageUrlList, chat.participantCount).length" class="avatar-stack">
                                                <div
                                                    v-for="(url, idx) in visibleAvatars(chat.userProfileImageUrlList, chat.participantCount)"
                                                    :key="idx"
                                                    class="avatar-item"
                                                    :style="{ zIndex: 10 - idx }"
                                                >
                                                    <img :src="url || userDefault" alt="user" @error="onAvatarError($event)" />
                                                </div>
                                                <div v-if="Number(chat.participantCount) > 4" class="avatar-item more" :style="{ zIndex: 6 }">
                                                    +{{ Number(chat.participantCount) - 4 }}
                                                </div>
                                            </div>
                                            <img v-else :src="userDefault" alt="user" class="avatar-img" />
                                        </td>
                                        <td class="col-main">
                                            <div class="row-title">
                                                <span class="title">{{ chat.roomName }}</span>
                                                <span class="member-count">({{ chat.participantCount }})</span>
                                            </div>
                                            <div class="row-subtitle-wrap">
                                                <span class="row-subtitle text-ellipsis">
                                                    {{ chat.lastMessage || '메시지가 없습니다' }}
                                                </span>
                                            </div>
                                        </td>
                                        <td class="col-meta">
                                            <div class="last-time">{{ formatChatTime(chat.lastSendTime) }}</div>
                                            <div
                                                v-if="(chat.unreadCount ?? 0) > 0"
                                                :class="['badge-unread', { preview: hoveredRoomId === chat.roomId }]"
                                                @click.stop="hoveredRoomId === chat.roomId && previewSummary(chat)"
                                            >
                                                {{ hoveredRoomId === chat.roomId ? '요약 미리보기' : (chat.unreadCount ?? 0) }}
                                            </div>
                                        </td>
                                        
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
            <v-dialog v-model="showCreateRoomModal" max-width="500px">
                <v-card>
                    <v-card-title class="text-h6">
                        채팅방 생성
                    </v-card-title>
                    <v-card-text>
                        <v-text-field label="방제목" v-model="newRoomTitle" />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn color="grey" @click="showCreateRoomModal = false">
                            취소
                        </v-btn>
                        <v-btn color="primary" @click="createChatRoom">
                            생성
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>
    </div>
</template>

<script>
import axios from 'axios';
import userDefault from '@/assets/icons/chat/user_defualt.svg';

    export default {
        props: {
            embedded: { type: Boolean, default: false },
            summariesByRoomId: { type: Object, default: () => ({}) },
            selectedRoomId: { type: [String, Number, null], default: null }
        },
        computed: {
            roomsWithSummary() {
                return (this.chatRoomList || []).map((room) => {
                    const s = this.summariesByRoomId[room.roomId] || {};
                    return {
                        ...room,
                        lastMessage: s.lastMessage ?? room.lastMessage,
                        lastSendTime: s.lastSendTime ?? room.lastSendTime,
                        unreadCount: s.unreadCount ?? room.unreadCount,
                    };
                });
            }
        },
        data() {
            return {
                chatRoomList: [],
                showCreateRoomModal: false,
                newRoomTitle: "",
                userDefault,
                hoveredRoomId: null,

            }
        },
        async created() {
            this.loadChatRooms();
        },
        methods: {
            selectRoom(room) {
                this.$emit('select-room', room);
            },
            previewSummary(room) {
                this.$emit('preview-summary', room);
            },
            visibleAvatars(list, participantCount) {
                const filtered = Array.isArray(list) ? list.filter((u) => !!u) : [];
                const count = Math.max(0, Math.min(4, Number(participantCount) || filtered.length));
                const out = [];
                for (let i = 0; i < count; i++) {
                    out.push(filtered[i] || null);
                }
                return out;
            },
            onAvatarError(e) {
                e.target.src = this.userDefault;
            },
            formatChatTime(timestamp) {
                if (!timestamp) return '';
                // Accept both ISO with or without millis; handle LocalDateTime-like strings
                let date = new Date(timestamp);
                if (isNaN(date.getTime())) {
                    // try adding 'Z' or normalizing microseconds to milliseconds
                    const normalized = String(timestamp).replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{3})\d+$/, '$1.$2');
                    date = new Date(normalized);
                }
                if (isNaN(date.getTime())) return '';

                const now = new Date();
                const isToday = date.getFullYear() === now.getFullYear()
                    && date.getMonth() === now.getMonth()
                    && date.getDate() === now.getDate();

                if (isToday) {
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mm = String(date.getMinutes()).padStart(2, '0');
                    return `${hh}:${mm}`;
                }

                const month = date.getMonth() + 1;
                const day = date.getDate();
                return `${month}월 ${day}일`;
            },
            async createChatRoom() {
                // const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                // await axios.post(`${baseURL}/chat/room/group/create?roomName=${this.newRoomTitle}`, null);
                // this.showCreateRoomModal = false;
                // this.loadChatRooms();
            },
            async loadChatRooms() {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                const response = await axios.get(`${baseURL}/chat-service/chat/room/list/ws_1`);
                this.chatRoomList = response.data.result;
            }
        }
    }
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
.room-row{
    cursor: pointer;
}
.room-row:hover{
    background: #F0F7FF;
}
.room-row.selected{
    background: #E3F2FD;
    font-weight: 600;
}
.v-table .v-table__wrapper table{ table-layout: fixed; width: 100%; }
.room-row > td{ vertical-align: top; }
.col-avatar{ width: 56px; }
.avatar-img{ width: 28px; height: 28px; display: block; border-radius: 50%; object-fit: cover; }
.avatar-stack{ position: relative; height: 28px; }
.avatar-stack .avatar-item{ position: absolute; top: 0; width: 28px; height: 28px; border-radius: 50%; overflow: hidden; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.06); }
.avatar-stack .avatar-item:nth-child(1){ left: 0; }
.avatar-stack .avatar-item:nth-child(2){ left: 16px; }
.avatar-stack .avatar-item:nth-child(3){ left: 32px; }
.avatar-stack .avatar-item:nth-child(4){ left: 48px; }
.avatar-stack .avatar-item img{ width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-stack .avatar-item.more{ background: #ECEFF1; color: #546E7A; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
.col-main{ width: 100%; display: flex; flex-direction: column; row-gap: 4px; overflow: hidden; }
.row-title{ display: flex; align-items: center; gap: 6px; line-height: 1.3; }
.row-title .title{ font-size: 14px; color: #212121; display: block; }
.row-title .member-count{ font-size: 12px; color: #9E9E9E; }
.row-subtitle{ font-size: 12px; color: #757575; line-height: 1.5; margin: 0; }
.text-ellipsis{ overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.row-subtitle-wrap{ display: flex; align-items: baseline; }
.col-meta{ width: 96px; text-align: right; }
.last-time{ font-size: 11px; color: #9E9E9E; margin-bottom: 6px; white-space: nowrap; }
.badge-unread{
    display: inline-flex;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: #EF5350; /* 빨간색 */
    color: #fff; /* 흰 글씨 */
    font-size: 11px;
    font-weight: 700;
}
.badge-unread.preview{
    height: 24px;
    min-width: 88px;
    padding: 0 10px;
    border-radius: 8px;
    cursor: pointer;
}
</style>