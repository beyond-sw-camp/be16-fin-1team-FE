<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row>
                <v-col>
                        <div class="chatlist-wrapper">
                        <v-card class="chatlist-card">
                        <div class="chatlist-banner">
                            <span class="chatlist-banner-title">스톤 채팅방 목록</span>
                        </div>
                        <v-card-text class="chatlist-body">
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
                                            <div
                                                v-if="Array.isArray(chat.userProfileImageUrlList) && visibleAvatars(chat.userProfileImageUrlList, chat.participantCount).length"
                                                :class="['avatar-stack', avatarStackClass(chat)]"
                                            >
                                                <div
                                                    v-for="(url, idx) in visibleAvatars(chat.userProfileImageUrlList, chat.participantCount)"
                                                    :key="idx"
                                                    :class="['avatar-item', 'av-' + (idx + 1)]"
                                                    :style="{ zIndex: 10 - idx }"
                                                >
                                                    <img :src="url || userDefault" alt="user" @error="onAvatarError($event)" />
                                                </div>
                                                <div v-if="hiddenOthersCount(chat) > 0" class="avatar-item more" :style="{ zIndex: 6 }">
                                                    +{{ hiddenOthersCount(chat) }}
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
                                                <span class="row-subtitle text-ellipsis-2">
                                                    {{ (chat.messageType === 'FILE' && !chat.lastMessage) ? '파일이 전송되었습니다.' : (chat.lastMessage || '메시지가 없습니다.') }}
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
                    </div>
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
                const merged = (this.chatRoomList || []).map((room) => {
                    const s = this.summariesByRoomId[room.roomId] || {};
                    return {
                        ...room,
                        lastMessage: s.lastMessage ?? room.lastMessage,
                        lastSendTime: s.lastSendTime ?? room.lastSendTime,
                        unreadCount: s.unreadCount ?? room.unreadCount,
                        messageType: s.messageType ?? room.messageType,
                    };
                });
                // 최근 메시지 시간 순(내림차순) 정렬
                return merged.sort((a, b) => {
                    const parse = (t) => {
                        if (!t) return 0;
                        const d = new Date(t);
                        if (!isNaN(d)) return d.getTime();
                        // 마이크로초가 붙은 문자열 등 보정
                        const normalized = String(t).replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{3})\d+$/, '$1.$2');
                        const d2 = new Date(normalized);
                        return isNaN(d2) ? 0 : d2.getTime();
                    };
                    return parse(b.lastSendTime) - parse(a.lastSendTime);
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
                const totalParticipants = Number(participantCount) || 0;
                const othersMax = Math.max(0, totalParticipants - 1); // 본인 제외한 표시 가능 최대 수
                const slots = Math.max(0, Math.min(4, othersMax)); // 항상 슬롯 개수 보장
                const out = [];
                for (let i = 0; i < slots; i++) {
                    out.push(filtered[i] || null); // 없으면 기본 아이콘으로 대체
                }
                return out;
            },
            hiddenOthersCount(chat) {
                const totalParticipants = Number(chat?.participantCount) || 0;
                const othersMax = Math.max(0, totalParticipants - 1);
                const slots = Math.max(0, Math.min(4, othersMax));
                return Math.max(0, othersMax - slots); // 슬롯을 초과한 나머지를 +N으로 표시
            },
            avatarStackClass(chat){
                const count = this.visibleAvatars(chat?.userProfileImageUrlList || [], chat?.participantCount).length;
                return `count-${count}`;
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
                const workspaceId = localStorage.getItem('selectedWorkspaceId') || 'ws_1';
                const response = await axios.get(`${baseURL}/chat-service/chat/room/list/${workspaceId}`);
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
.chatlist-wrapper{ display: flex; justify-content: center; padding: 24px 12px 24px 24px; min-height: calc(100vh - 64px - 72px); }
.chatlist-card{ border-radius: 15px; overflow: hidden; border: 1px solid #E5E5E5; width: 384px; display: flex; flex-direction: column; min-height: calc(100vh - 64px - 80px); }
.chatlist-card{ border-radius: 15px; overflow: hidden; border: 1px solid #E5E5E5; }
.chatlist-banner{ height: 56px; background: #FFE364; display: flex; align-items: center; padding: 0 25px; }
.chatlist-banner-title{ color: #1C0F0F; font-weight: 700; font-size: 18px; line-height: 22px; }
.chatlist-body{ flex: 1 1 auto; display: flex; padding: 0; }
.chatlist-body .v-table{ width: 100%; }
.chatlist-body .v-table .v-table__wrapper{ max-height: none; }
.room-row{
    cursor: pointer;
    height: 68px;
    --stack-gap-color: #FFFFFF; /* 아바타 겹침 경계선 색(행 배경과 동일) */
}
.room-row:hover{
    background: #F0F7FF;
    --stack-gap-color: #F0F7FF;
}
.room-row.selected{
    background: #E3F2FD;
    font-weight: 600;
    --stack-gap-color: #E3F2FD;
}
.v-table .v-table__wrapper table{ table-layout: fixed; width: 100%; }
.v-table tbody tr.room-row{ display: table-row !important; }
.v-table tbody tr:not(:last-child) td{ border-bottom: 1px solid #E5E5E5; }
.room-row > td{ vertical-align: middle; padding: 8px 8px; }
.col-avatar{ width: 48px; padding-right: 4px; }
.avatar-img{ width: 36px; height: 36px; display: block; border-radius: 50%; object-fit: cover; }
.avatar-stack{ position: relative; height: 28px; }
.avatar-stack .avatar-item{ position: absolute; border-radius: 50%; overflow: hidden; border: 0; box-shadow: none; }
.avatar-stack .avatar-item img{ width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-stack .avatar-item.more{ background: #ECEFF1; color: #546E7A; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
.avatar-stack.count-1{ height: 40px; width: 40px; }
.avatar-stack.count-1 .avatar-item{ width: 45px; height: 45px; left: 0; top: -2px; align-items: center; justify-content: center; }

/* 2개: 2x2 격자에서 (0,0)과 (1,1)에 배치, 살짝 겹침 */
.avatar-stack.count-2{ height: 32px; width: 48px; position: relative; }
.avatar-stack.count-2 .av-1{ width: 32px; height: 32px; left: 0; top: -5px; }
.avatar-stack.count-2 .av-2{ width: 32px; height: 32px; left: 18px; top:10px; }
/* 겹침 경계 라인 (좌우 + 상하) */
.avatar-stack.count-2 .av-1{ box-shadow: 2px 0 0 0 var(--stack-gap-color), 0 2px 0 0 var(--stack-gap-color); }
.avatar-stack.count-2 .av-2{ box-shadow: -2px 0 0 0 var(--stack-gap-color), 0 -2px 0 0 var(--stack-gap-color); }

/* 3개: 상단 두 개(0,0)(0,1), 가운데 아래 하나가 끼어드는 형태 */
.avatar-stack.count-3{ height: 34px; width: 48px; position: relative; }
.avatar-stack.count-3 .av-1{ width: 30px; height: 30px; left: 0; top: -5px; }
.avatar-stack.count-3 .av-2{ width: 30px; height: 30px; left: 22px; top: -5px; }
.avatar-stack.count-3 .av-3{ width: 30px; height: 30px; left: 11px; top: 13px; z-index: 12; }
/* 겹침 경계 라인 (상/하/좌/우) */
.avatar-stack.count-3 .av-1{ box-shadow: 2px 0 0 0 var(--stack-gap-color), 0 2px 0 0 var(--stack-gap-color); }
.avatar-stack.count-3 .av-2{ box-shadow: -2px 0 0 0 var(--stack-gap-color), 0 2px 0 0 var(--stack-gap-color); }
.avatar-stack.count-3 .av-3{ box-shadow: 0 -2px 0 0 var(--stack-gap-color); }

/* 4개: 2x2 그리드 배치 */
.avatar-stack.count-4{ height: 34px; width: 48px; position: relative; }
.avatar-stack.count-4 .av-1{ width: 22px; height: 22px; left: 0; top: -5px; box-shadow: 2px 0 0 0 var(--stack-gap-color), 0 2px 0 0 var(--stack-gap-color); }
.avatar-stack.count-4 .av-2{ width: 22px; height: 22px; left: 22px; top: -5px; box-shadow: -2px 0 0 0 var(--stack-gap-color), 0 2px 0 0 var(--stack-gap-color); }
.avatar-stack.count-4 .av-3{ width: 22px; height: 22px; left: 0; top: 17px; box-shadow: 2px 0 0 0 var(--stack-gap-color), 0 -2px 0 0 var(--stack-gap-color); }
.avatar-stack.count-4 .av-4{ width: 22px; height: 22px; left: 22px; top: 17px; box-shadow: -2px 0 0 0 var(--stack-gap-color), 0 -2px 0 0 var(--stack-gap-color); }

/* +N indicator position */
.avatar-stack .avatar-item.more{ width: 18px; height: 18px; right: -6px; bottom: -6px; left: auto; top: auto; font-size: 10px; }
.col-main { padding-top: 4px; padding-bottom: 4px; }
.row-title{ display: flex; align-items: baseline; gap: 4px; line-height: 1.3; margin-bottom: 4px; }
.row-title .title{ font-size: 13px; font-weight: 500; color: #212121; display: block; }
.row-title .member-count{ font-size: 11px; color: #9E9E9E; }
.row-subtitle{ font-size: 11px; color: #555; line-height: 1.3; margin: 0; }
.text-ellipsis-2{
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 최대 2줄 */
  -webkit-box-orient: vertical;
  line-clamp: 2; /* 표준 속성 (지원 브라우저 한정) */
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: calc(1.2em * 2); /* line-height * 2줄 */
  word-break: break-word;
}
.text-ellipsis{ overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.row-subtitle-wrap{ display: flex; align-items: baseline; }
.col-meta{ width: 80px; text-align: right; white-space: nowrap; position: relative; padding-bottom: 20px; --last-time-top: 10px; --last-time-right: 12px; --badge-right: 18px; --badge-bottom: 18px; }
.last-time{ font-size: 11px; color: #757575; margin: 0; white-space: nowrap; position: absolute; top: var(--last-time-top); right: var(--last-time-right); }
.badge-unread{
    display: inline-flex;
    min-width: 16px;
    height: 16px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #EF5350;
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 600;
    position: absolute;
    right: var(--badge-right);
    bottom: var(--badge-bottom);
}
.badge-unread.preview{
    height: 24px;
    min-width: 88px;
    padding: 0 10px;
    border-radius: 8px;
    cursor: pointer;
    background: #FFE364; /* 프리뷰 버튼 노란색 */
    color: #2A2828; /* 가독성 있는 어두운 텍스트 */
}

/* Vuetify v-table 기본 셀 패딩 오버라이드 (간격 축소) */
:deep(.v-table .v-table__wrapper table tbody tr.room-row > td){
  padding: 8px 8px !important;
}
:deep(.v-table .v-table__wrapper table tbody tr.room-row > td.col-avatar){
  padding-right: 8px !important;
}
:deep(.v-table .v-table__wrapper table tbody tr.room-row > td.col-main){
  padding-left: 8px !important;
}
</style>