<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row justify="center">
                <v-col cols="12" md="16" lg="16" xl="12">
                    <v-card class="chat-card">
                        <div class="chat-banner">
                            <v-btn class="banner-btn back" variant="text" size="small" @click="refreshPage" icon>
                                <v-icon icon="mdi-chevron-left"></v-icon>
                            </v-btn>
                            <div class="banner-title">{{ computedTitle }}</div>
                            <v-btn class="banner-btn menu" variant="text" size="small" icon>
                                <img src="@/assets/icons/chat/menu.svg" alt="menu" class="menu-icon" />
                            </v-btn>
                        </div>
                        <v-card-text class="chat-body">
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
                            <div class="chat-footer">
                                <div class="composer">
                                    <input ref="fileInput" type="file" multiple @change="onFilesSelected" style="display:none" />
                                    <button class="icon-btn left" @click="openFilePicker" aria-label="파일 추가">
                                        <v-icon icon="mdi-plus"></v-icon>
                                    </button>
                                    <v-text-field
                                        ref="composerInput"
                                        v-model="newMessage"
                                        placeholder="메시지 입력..."
                                        @keyup.enter="sendMessage"
                                        class="composer-input"
                                        hide-details
                                        variant="plain"
                                        density="compact"
                                    />
                                    <v-menu v-model="isEmojiOpen" :close-on-content-click="false" offset-y>
                                        <template #activator="{ props }">
                                            <button class="icon-btn right" v-bind="props" aria-label="이모지">
                                                <v-icon icon="mdi-emoticon-outline"></v-icon>
                                            </button>
                                        </template>
                                        <div class="emoji-panel">
                                            <button v-for="e in emojiList" :key="e" class="emoji-btn" @click="insertEmoji(e)">{{ e }}</button>
                                        </div>
                                    </v-menu>
                                </div>
                                <v-btn class="send-btn" variant="flat" elevation="0" rounded="xl" height="48" @click="sendMessage">전송</v-btn>
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
                isEmojiOpen: false,
                emojiList: [
                    "😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😢",
                    "👍","👏","🙏","🔥","🎉","💡","✅","⚠️","❗","❓"
                ],
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
            insertEmoji(e) {
                const start = this.newMessage?.length ? this.newMessage.length : 0;
                // 단순히 끝에 추가; 필요시 커서 위치 처리는 ref로 확장 가능
                this.newMessage = (this.newMessage || "") + e;
                this.isEmojiOpen = false;
                this.$nextTick(() => {
                    try { this.$refs.composerInput?.focus(); } catch(_) {}
                });
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
.chat-card{ --v-card-border-radius: 15px; border-radius: 15px !important; overflow: hidden; margin: 24px 0; border: 1px solid #E5E5E5; --chat-accent: #FFE364; }
.chat-banner{ height: 56px; background: var(--chat-accent); display: grid; grid-template-columns: 40px 1fr 40px; align-items: center; }
.banner-title{ color: #1C0F0F; font-weight: 700; font-size: 18px; line-height: 22px; text-align: center; }
.banner-btn{ min-width: 32px; height: 32px; padding: 0; }
.banner-btn.back{ justify-self: start; }
.banner-btn.menu{ justify-self: end; }
.menu-icon{ width: 24px; height: 24px; display: block; }

/* 헤더 좌우 버튼 포커스 테두리 제거 */
.banner-btn:focus,
.banner-btn:focus-visible,
.banner-btn:active {
  outline: none !important;
  box-shadow: none !important;
}

.chat-body{ display: flex; flex-direction: column; padding: 0; height: calc(100vh - 64px - 80px - 56px); }
/* v-card-text 기본 좌우 패딩 제거 (배너와 동일 폭 맞춤) */
.chat-card > .v-card-text.chat-body{ padding: 0 !important; }
.chat-box{
    flex: 1 1 auto;
    overflow-y: auto;
    border-bottom: 1px solid #ddd;
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
.chat-row .line-sent .bubble{ background: var(--chat-accent); }
.chat-row .line-sent .time{ margin-right: 0; }
.chat-row .line-received .time{ margin-left: 0; }
.content-sent{ align-items: flex-end; }

.chat-footer{ background: #2A2828; border-radius: 0 0 15px 15px; padding: 16px; display: flex; align-items: center; gap: 12px; width: 100%; align-self: stretch; box-sizing: border-box; margin-left: 0; margin-right: 0; --composer-height: 36px; }
.composer{ flex: 1 1 auto; display: grid; grid-template-columns: var(--composer-height) 1fr var(--composer-height); align-items: center; background: #FFFFFF; border: 1px solid #DDDDDD; border-radius: calc(var(--composer-height) / 2); padding: 0 10px; height: var(--composer-height); box-sizing: border-box; }
.icon-btn{ width: var(--composer-height); height: var(--composer-height); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; }
.icon-btn:focus{ outline: none; }
.icon-btn.left v-icon{ color: #000000; }
.icon-btn.right v-icon{ color: #FFDD44; }
.icon-btn .v-icon{ font-size: 18px; }
.composer-input{ padding: 0 8px; height: 100%; }
.composer-input .v-field{ background: transparent; height: 100% !important; min-height: 0 !important; padding: 0 !important; align-items: center; border-radius: calc(var(--composer-height) / 2); display: flex; }
.composer-input .v-field__overlay{ height: 100% !important; }
.composer-input .v-field__loader{ height: 100% !important; }
.composer-input .v-field__input{ padding: 0 !important; height: 100% !important; min-height: 0 !important; display: flex; align-items: center; font-size: 12px; }
.composer-input input{ height: 100%; line-height: 1; font-size: 12px; display: flex; align-items: center; }
.composer-input input::placeholder{ color: #9E9E9E; font-size: 12px; }
.emoji-panel{ display: grid; grid-template-columns: repeat(8, 28px); gap: 6px; padding: 8px; }
.emoji-btn{ width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; font-size: 18px; }
.emoji-btn:focus{ outline: none; }
.send-btn{ flex: 0 0 112px; height: var(--composer-height) !important; border-radius: calc(var(--composer-height) / 2) !important; background-color: var(--chat-accent) !important; border-color: var(--chat-accent) !important; color: #000000 !important; font-weight: 400 !important; font-size: 12px !important; line-height: 15px !important; text-transform: none; letter-spacing: 0; }

.files{ display: flex; gap: 6px; flex-wrap: wrap; margin: 4px 0; }
.files .file-item{ max-width: 160px; }
.files .image-thumb{ width: 120px; height: 120px; object-fit: cover; border-radius: 8px; display: block; }
.files .file-chip{ display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 12px; background: #F1F3F4; color: #455A64; font-size: 12px; text-decoration: none; }
.files-sent{ justify-content: flex-end; }
.files-received{ justify-content: flex-start; }

.reconnect-banner{ background: rgba(255,255,255,0.95); color: #2A2828; padding: 12px 16px; border-radius: 12px; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

</style>