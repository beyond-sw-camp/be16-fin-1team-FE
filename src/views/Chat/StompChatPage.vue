<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row justify="center">
                <v-col cols="12" md="8">
                    <v-card>
                        <v-card-title class="text-h5 chat-header">
                            <v-btn class="back-btn-top" variant="text" size="small" @click="refreshPage" icon>
                                <v-icon icon="mdi-chevron-left"></v-icon>
                            </v-btn>
                            <span class="title-text">{{ computedTitle }}</span>
                        </v-card-title>
                        <v-card-text>
                            <div class="chat-box">
                                <div
                                    v-for="(msg, index) in messages"
                                    :key="index"
                                    :class="['chat-row', msg.senderId === senderId ? 'sent' : 'received']"
                                >
                                    <div v-if="msg.senderId !== senderId" class="avatar">
                                        <img :src="msg.userProfileImageUrl || userDefault" alt="user" @error="onAvatarError($event)" />
                                    </div>
                                    <div :class="['content', msg.senderId === senderId ? 'content-sent' : 'content-received']">
                                        <div v-if="msg.senderId !== senderId" class="name">{{ msg.senderName || msg.senderId }}</div>
                                        <div v-if="msg.message && msg.message.length" :class="['line', msg.senderId === senderId ? 'line-sent' : 'line-received']">
                                            <div class="bubble">{{ msg.message }}</div>
                                            <div class="time">{{ formatChatTime(msg.lastSendTime) }}</div>
                                        </div>
                                        <div v-if="showFiles(msg)" :class="['files', msg.senderId === senderId ? 'files-sent' : 'files-received']">
                                            <div v-for="(file, fIdx) in (msg.chatFileListDtoList || [])" :key="fIdx" class="file-item">
                                                <template v-if="isImage(file?.fileUrl || file?.fileName)">
                                                    <a :href="file?.fileUrl" target="_blank" rel="noopener">
                                                        <img v-if="file?.fileUrl" :src="file.fileUrl" alt="file" class="image-thumb" />
                                                        <div v-else class="file-chip">{{ file?.fileName || '파일' }}</div>
                                                    </a>
                                                </template>
                                                <template v-else>
                                                    <a :href="file?.fileUrl" target="_blank" rel="noopener" class="file-chip">{{ file?.fileName || '파일' }}</a>
                                                </template>
                                            </div>
                                        </div>
                                        <div v-if="showFiles(msg) && !(msg.message && msg.message.length)" :class="['line', msg.senderId === senderId ? 'line-sent' : 'line-received']">
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
                            <div class="attach-row">
                                <input ref="fileInput" type="file" multiple @change="onFilesSelected" style="display:none" />
                                <v-btn class="attach-btn" variant="text" size="small" @click="openFilePicker">
                                    <v-icon icon="mdi-plus"></v-icon>
                                </v-btn>
                                <span v-if="selectedFiles && selectedFiles.length" class="attach-count">{{ selectedFiles.length }}개 선택됨</span>
                            </div>
                            <v-overlay :model-value="uploading" class="align-center justify-center" scrim="rgba(0,0,0,0.12)" persistent>
                                <v-progress-circular indeterminate :size="42" :width="4" color="#FFE364" />
                            </v-overlay>
                            <v-overlay :model-value="reconnecting" class="align-center justify-center" scrim="rgba(0,0,0,0.25)" persistent>
                                <div class="reconnect-banner">
                                    <v-progress-circular indeterminate :size="36" :width="4" color="#FFE364" class="mr-3" />
                                    <span>연결이 끊어졌습니다. 재연결 중…</span>
                                </div>
                            </v-overlay>
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
                senderId: null,
                userDefault,
                selectedFiles: [],
                uploading: false,
                reconnecting: false,
                _reconnectTimer: null,
            }
        },
        created() {
            this.senderId = localStorage.getItem("id");
        },
        beforeRouteLeave(to, from, next) {
            this.teardownRoomSubscription();
            next();
        },
        beforeUnmount() {
            this.teardownRoomSubscription();
            if (this._offClose) { try { this._offClose(); } catch(_) {} this._offClose = null; }
            if (this._reconnectTimer) { clearInterval(this._reconnectTimer); this._reconnectTimer = null; }
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
            showFiles(msg) {
                if (!msg) return false;
                if (Array.isArray(msg.chatFileListDtoList) && msg.chatFileListDtoList.length > 0) return true;
                return msg.messageType && msg.messageType !== 'TEXT';
            },
            isImage(nameOrUrl) {
                if (!nameOrUrl) return false;
                const s = String(nameOrUrl).toLowerCase();
                return /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/.test(s);
            },
            normalizeMessage(msg) {
                const m = msg ? { ...msg } : {};
                if (!Array.isArray(m.chatFileListDtoList)) m.chatFileListDtoList = [];
                if (!m.messageType) {
                    if (m.chatFileListDtoList.length > 0 && (!m.message || m.message.length === 0)) {
                        m.messageType = 'FILE';
                    } else if (m.chatFileListDtoList.length > 0) {
                        m.messageType = 'TEXT_WITH_FILE';
                    } else {
                        m.messageType = 'TEXT';
                    }
                }
                return m;
            },
            async loadHistory() {
                if (!this.roomId) return;
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                try {
                    const { data } = await axios.get(`${baseURL}/chat-service/chat/room/${this.roomId}/history`);
                    const list = data?.result || [];
                    this.messages = Array.isArray(list) ? list.map(this.normalizeMessage) : [];
                    this.scrollToBottom();
                } catch (e) {
                    console.warn('load history failed', e);
                }
            },
            async connectWebsocket() {
                const topic = `/topic/${this.roomId}`;
                this.roomUnsub = await stompManager.subscribe(topic, (message) => {
                    this.messages.push(this.normalizeMessage(message));
                    this.scrollToBottom();
                });
                // listen for connection close to trigger reconnect
                if (!this._offClose) {
                    this._offClose = stompManager.on('close', () => {
                        this.startReconnectLoop();
                    });
                }
            },
            startReconnectLoop() {
                if (this._reconnectTimer) return;
                this.reconnecting = true;
                this._reconnectTimer = setInterval(async () => {
                    try {
                        await stompManager.connect();
                        // On successful reconnect: refresh history and resubscribe
                        this.teardownRoomSubscription();
                        this.messages = [];
                        await this.loadHistory();
                        await this.connectWebsocket();
                        this.reconnecting = false;
                        clearInterval(this._reconnectTimer);
                        this._reconnectTimer = null;
                    } catch (_) {
                        // keep trying
                    }
                }, 5000);
            },
            async sendMessage() {
                const hasText = this.newMessage.trim().length > 0;
                const hasFiles = this.selectedFiles && this.selectedFiles.length > 0;
                if (!hasText && !hasFiles) return;

                let uploadedFileIds = [];
                if (hasFiles) {
                    this.uploading = true;
                    try {
                        const res = await this.uploadSelectedFiles();
                        const data = res?.data;
                        const list = (data && data.statusCode === 200 && Array.isArray(data.result)) ? data.result : [];
                        uploadedFileIds = list.map(item => item.fileId).filter((v) => v !== undefined && v !== null);
                        if (!list.length) {
                            console.warn('upload response unexpected shape', data);
                        }
                    } catch (e) {
                        console.warn('upload failed', e);
                    } finally {
                        this.uploading = false;
                        this.selectedFiles = [];
                        if (this.$refs.fileInput) this.$refs.fileInput.value = '';
                    }
                }

                const messageType = hasText && uploadedFileIds.length > 0
                    ? 'TEXT_WITH_FILE'
                    : hasText
                        ? 'TEXT'
                        : 'FILE';

                const message = {
                    roomId: this.roomId,
                    senderId: this.senderId,
                    message: hasText ? this.newMessage : '',
                    lastSendTime: this.getNowLocalDateTime(),
                    messageType,
                    chatFileListDtoList: uploadedFileIds.map((id) => ({ fileId: id })),
                };

                stompManager.send(`/publish/${this.roomId}`, JSON.stringify(message));
                this.newMessage = "";
            },
            openFilePicker() {
                this.$refs.fileInput && this.$refs.fileInput.click();
            },
            onFilesSelected(event) {
                const files = Array.from(event.target.files || []);
                this.selectedFiles = files;
            },
            async uploadSelectedFiles() {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                const form = new FormData();
                this.selectedFiles.forEach((f) => form.append('fileList', f));
                return await axios.post(`${baseURL}/chat-service/chat/upload`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            },
            refreshPage() {
                window.location.reload();
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
    position: relative;
}
.back-btn{ position: absolute; top: 4px; left: 4px; min-width: 28px; height: 28px; padding: 0; }
.chat-header{ display: flex; align-items: center; gap: 8px; }
.chat-header .title-text{ flex: 1; text-align: left; }
.back-btn-top{ min-width: 28px; height: 28px; padding: 0; }
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
.attach-row{ display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.attach-btn{ min-width: 28px; height: 28px; padding: 0; }
.attach-count{ font-size: 12px; color: #757575; }

.files{ display: flex; gap: 6px; flex-wrap: wrap; margin: 4px 0; }
.files .file-item{ max-width: 160px; }
.files .image-thumb{ width: 120px; height: 120px; object-fit: cover; border-radius: 8px; display: block; }
.files .file-chip{ display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 12px; background: #F1F3F4; color: #455A64; font-size: 12px; text-decoration: none; }
.files-sent{ justify-content: flex-end; }
.files-received{ justify-content: flex-start; }

.reconnect-banner{ background: rgba(255,255,255,0.95); color: #2A2828; padding: 12px 16px; border-radius: 12px; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

</style>