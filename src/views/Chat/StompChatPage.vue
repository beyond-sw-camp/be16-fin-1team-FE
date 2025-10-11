<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row justify="center">
                <v-col cols="12" md="8">
                    <v-card>
                        <v-card-title class="text-center text-h5">
                            채팅
                        </v-card-title>
                        <v-card-text>
                            <div class="chat-box">
                                <div
                                    v-for="(msg, index) in messages"
                                    :key="index"
                                    :class="['chat-message', msg.senderEmail === senderEmail ? 'sent' : 'received']"
                                >
                                <strong>{{ msg.senderEmail }}: </strong> {{ msg.message }}
                                </div>
                            </div>
                            <v-text-field
                                v-model="newMessage"
                                label="메시지 입력"
                                @keyup.enter="sendMessage"
                            />
                            <v-btn color="primary" block @click="sendMessage">전송</v-btn>
                        </v-card-text>
                    </v-card>

                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
import stompManager from '@/services/stompService.js';
import axios from 'axios';


    export default {
        props: {
            roomId: {
                type: [String, Number],
                default: null,
            },
            embedded: { type: Boolean, default: false }
        },
        data() {
            return {
                messages: [],
                newMessage: "",
                roomUnsub: null,
                senderEmail: null,
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
                const message = { senderEmail: this.senderEmail, message: this.newMessage }
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
                    try { this.roomUnsub(); } catch (_) {}
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
}
.chat-message{
    margin-bottom: 10px;

}
.sent{
    text-align: right;
}
.received{
    text-align: left;
}

</style>