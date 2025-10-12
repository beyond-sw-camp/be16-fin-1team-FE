<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row justify="center">
                <v-col cols="12" md="8">
                    <v-card>
                        <v-card-title class="text-center text-h5">
                            {{ computedTitle }}
                        </v-card-title>
                        <v-card-text>
                            <div class="chat-box">
                                <div
                                    v-for="(msg, index) in messages"
                                    :key="index"
                                    :class="['chat-row', msg.senderEmail === senderEmail ? 'sent' : 'received']"
                                >
                                    <div v-if="msg.senderEmail !== senderEmail" class="avatar">
                                        <img :src="msg.userProfileImageUrl || userDefault" alt="user" @error="onAvatarError($event)" />
                                    </div>
                                    <div :class="['content', msg.senderEmail === senderEmail ? 'content-sent' : 'content-received']">
                                        <div v-if="msg.senderEmail !== senderEmail" class="name">{{ msg.senderName || msg.senderEmail }}</div>
                                        <div :class="['line', msg.senderEmail === senderEmail ? 'line-sent' : 'line-received']">
                                            <div class="bubble">{{ msg.message }}</div>
                                            <div class="time">{{ formatChatTime(msg.lastSendTime) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="send-row">
                                <v-text-field
                                    v-model="newMessage"
                                    label="메시지 입력"
                                    @keyup.enter="sendMessage"
                                    class="send-input"
                                />
                                <v-btn color="#FFE364" class="send-btn" @click="sendMessage">전송</v-btn>
                            </div>
                        </v-card-text>
                    </v-card>

                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
import stompManager from '@/services/stompService.js';
import userDefault from '@/assets/icons/chat/user_defualt.svg';
import axios from 'axios';


    export default {
        props: {
            roomId: {
                type: [String, Number],
                default: null,
            },
            embedded: { type: Boolean, default: false },
            roomTitle: { type: String, default: '' },
            participantCount: { type: [Number, String], default: 0 }
        },
        computed: {
            computedTitle() {
                if (this.roomTitle) {
                    return `${this.roomTitle} (${this.participantCount})`;
                }
                return '채팅';
            }
        },
        data() {
            return {
                messages: [],
                newMessage: "",
                roomUnsub: null,
                senderEmail: null,
                userDefault,
            }
        },
        created() {
            this.senderEmail = localStorage.getItem("email");
        },
        beforeRouteLeave(to, from, next) {
            this.teardownRoomSubscription();
            next();
        },
        beforeUnmount() {
            this.teardownRoomSubscription();
        },
        methods: {
            getNowLocalDateTime() {
                const d = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const year = d.getFullYear();
                const month = pad(d.getMonth() + 1);
                const day = pad(d.getDate());
                const hours = pad(d.getHours());
                const minutes = pad(d.getMinutes());
                const seconds = pad(d.getSeconds());
                const millis = String(d.getMilliseconds()).padStart(3, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}`;
            },
            onAvatarError(e) {
                e.target.src = this.userDefault;
            },
            formatChatTime(timestamp) {
                if (!timestamp) return '';
                let date = new Date(timestamp);
                if (isNaN(date.getTime())) {
                    const normalized = String(timestamp).replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{3})\d+$/, '$1.$2');
                    date = new Date(normalized);
                }
                if (isNaN(date.getTime())) return '';
                const hh = String(date.getHours()).padStart(2, '0');
                const mm = String(date.getMinutes()).padStart(2, '0');
                return `${hh}:${mm}`;
            },
            async loadHistory() {
                if (!this.roomId) return;
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                try {
                    const { data } = await axios.get(`${baseURL}/chat-service/chat/room/${this.roomId}/history`);
                    const list = data?.result || [];
                    this.messages = Array.isArray(list) ? list : [];
                    this.scrollToBottom();
                } catch (e) {
                    console.warn('load history failed', e);
                }
            },
            async connectWebsocket() {
                const topic = `/topic/${this.roomId}`;
                this.roomUnsub = await stompManager.subscribe(topic, (message) => {
                    this.messages.push(message);
                    this.scrollToBottom();
                });
            },
            sendMessage() {
                if(this.newMessage.trim() === "") return;
                const message = {
                    roomId: this.roomId,
                    senderEmail: this.senderEmail,
                    message: this.newMessage,
                    lastSendTime: this.getNowLocalDateTime(),
                }
                stompManager.send(`/publish/${this.roomId}`, JSON.stringify(message));
                this.newMessage = ""
            },
            scrollToBottom() {
                this.$nextTick(() => {
                    const chatBox = this.$el.querySelector(".chat-box");
                    chatBox.scrollTop = chatBox.scrollHeight;
                });
            },
            teardownRoomSubscription() {
                if (this.roomUnsub) {
                    try {
                        if (typeof this.roomUnsub.unsubscribe === 'function') {
                            this.roomUnsub.unsubscribe();
                        } else {
                            this.roomUnsub();
                        }
                    } catch (_) {}
                    this.roomUnsub = null;
                }
            }
        }
        ,
        watch: {
            roomId: {
                immediate: true,
                handler(newVal, oldVal) {
                    if (!newVal) {
                        this.teardownRoomSubscription();
                        this.messages = [];
                        return;
                    }
                    // 방이 바뀌면 재연결
                    this.teardownRoomSubscription();
                    this.messages = [];
                    this.$nextTick(async () => {
                        await this.loadHistory();
                        this.connectWebsocket();
                    });
                }
            }
        }
    }
</script>

<style>
.main-fill {
  position: fixed;
  top: 64px;
  left: 240px;
  right: 0;
  bottom: 0;
  background-color: #F5F5F5;
}
.chat-box{
    height: 300px;
    overflow-y: auto;
    border: 1px solid #ddd;
    margin-bottom: 10px;
    padding: 8px 12px;
}
.chat-row{ display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-end; }
.chat-row.sent{ justify-content: flex-end; }
.chat-row .avatar{ width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex: 0 0 28px; }
.chat-row .avatar img{ width: 100%; height: 100%; object-fit: cover; display: block; }
.chat-row .content{ max-width: 70%; }
.chat-row .name{ font-size: 12px; color: #757575; margin: 0 0 2px 0; text-align: left; align-self: flex-start; }
.chat-row .line{ display: flex; align-items: flex-end; gap: 6px; }
.chat-row .bubble{ background: #F5F5F5; padding: 8px 10px; border-radius: 10px; font-size: 14px; color: #212121; }
.chat-row .time{ font-size: 11px; color: #9E9E9E; }
.chat-row .line-sent{ flex-direction: row-reverse; }
.chat-row .line-sent .bubble{ background: #FFE364; }
.chat-row .line-sent .time{ margin-right: 0; }
.chat-row .line-received .time{ margin-left: 0; }
.content-sent{ align-items: flex-end; }

.send-row{ display: flex; gap: 8px; }
.send-input{ flex: 1 1 auto; }
.send-btn{ flex: 0 0 104px; height: 56px; align-self: stretch; background-color: #FFE364 !important; border-color: #FFE364 !important; color: #212121 !important; }

</style>