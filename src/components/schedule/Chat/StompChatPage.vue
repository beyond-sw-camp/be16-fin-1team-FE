<template>
    <div :class="embedded ? '' : 'main-fill'">
        <v-container fluid>
            <v-row justify="center">
                <v-col cols="12" md="16" lg="16" xl="12">
                    <v-card class="chat-card">
                        <div :class="['chat-banner', { 'with-user-panel': isUserPanelOpen, 'with-side-panel': (isUserPanelOpen || isDocsPanelOpen || isSearchOpen) }]"><!-- header shifts with panel -->
                            <v-btn class="banner-btn back" variant="text" size="small" @click="refreshPage" icon>
                                <v-icon icon="mdi-chevron-left"></v-icon>
                            </v-btn>
                            <div class="banner-title">{{ computedTitle }}</div>
                            <template v-if="(isUserPanelOpen || isDocsPanelOpen)">
                                <v-btn class="banner-btn menu" variant="text" size="small" icon @click="closeUserPanel">
                                    <img src="@/assets/icons/user/close.svg" alt="close" class="menu-icon" />
                                </v-btn>
                            </template>
                            <template v-else>
                                <v-menu v-model="isHeaderMenuOpen" :close-on-content-click="true" offset-y>
                                    <template #activator="{ props }">
                                        <v-btn class="banner-btn menu" v-bind="props" variant="text" size="small" icon>
                                            <img src="@/assets/icons/chat/menu.svg" alt="menu" class="menu-icon" />
                                        </v-btn>
                                    </template>
                                    <div class="header-menu">
                                        <button class="header-menu-item" @click="onHeaderMenu('search')">
                                            <img src="@/assets/icons/chat/magnify.svg" alt="search" class="menu-item-icon" />
                                            <span>검색</span>
                                        </button>
                                        <button class="header-menu-item" @click="onHeaderMenu('users')">
                                            <img src="@/assets/icons/chat/account-supervisor.svg" alt="users" class="menu-item-icon" />
                                            <span>사용자 목록</span>
                                        </button>
                                        <button class="header-menu-item" @click="onHeaderMenu('docs')">
                                            <img src="@/assets/icons/chat/file-multiple.svg" alt="docs" class="menu-item-icon" />
                                            <span>문서함</span>
                                        </button>
                                    </div>
                                </v-menu>
                            </template>
                        </div>
                        <v-card-text :class="['chat-body', { 'with-user-panel': isUserPanelOpen, 'with-side-panel': (isUserPanelOpen || isDocsPanelOpen || isSearchOpen) }]
                        ">
                            <div class="chat-box">
                                <template v-for="(msg, index) in messages" :key="index">
                                    <div v-if="isDateBoundary(index)" class="date-sep">
                                        <div class="line"></div>
                                        <span class="label">{{ formatDateHeader(msg.lastSendTime) }}</span>
                                        <div class="line"></div>
                                    </div>
                                    <div
                                        :class="[
                                            'chat-row',
                                            msg.senderId === senderId ? 'sent' : 'received',
                                            isGroupStart(index) ? 'group-start' : 'group-cont',
                                            { highlight: index === highlightIndex }
                                        ]"
                                        :data-msg-idx="index"
                                    >
                                    <div v-if="msg.senderId !== senderId" :class="['avatar', { 'avatar-spacer': !isGroupStart(index) }]"><!---->
                                        <img v-if="isGroupStart(index)" :src="msg.userProfileImageUrl || userDefault" alt="user" @error="onAvatarError($event)" />
                                    </div>
                                    <div :class="['content', msg.senderId === senderId ? 'content-sent' : 'content-received']">
                                        <div v-if="msg.senderId !== senderId && isGroupStart(index)" class="name">{{ msg.senderName || msg.senderId }}</div>
                                        <div v-if="(msg.message && msg.message.length) && msg.messageType !== 'FILE'" :class="['line', msg.senderId === senderId ? 'line-sent' : 'line-received']">
                                            <div class="bubble">{{ msg.message }}</div>
                                            <div v-if="isTimeGroupEnd(index)" class="time">{{ formatChatTime(msg.lastSendTime) }}</div>
                                        </div>
                                        <div v-if="showFiles(msg) && msg.messageType !== 'TEXT'" :class="['files', msg.senderId === senderId ? 'files-sent' : 'files-received']">
                                            <div v-for="(file, fIdx) in (msg.chatFileListDtoList || [])" :key="fIdx" class="file-item">
                                                <template v-if="isImage(file?.fileUrl || file?.fileName)">
                                                <a href="#" @click.prevent="openImage(file.fileUrl)">
                                                    <img v-if="file?.fileUrl" :src="file.fileUrl" alt="file" class="image-thumb" />
                                                    <div v-else class="file-chip">{{ file?.fileName || '파일' }}</div>
                                                </a>
                                                </template>
                                                <template v-else>
                                                    <a :href="file?.fileUrl" target="_blank" rel="noopener" class="file-doc">
                                                        <span class="badge-doc">{{ fileExt(file?.fileName) }}</span>
                                                        <span class="doc-name text-ellipsis">{{ file?.fileName || '파일' }}</span>
                                                        <span v-if="file?.fileSize" class="doc-size">{{ formatFileSize(file.fileSize) }}</span>
                                                    </a>
                                                </template>
                                            </div>
                                        </div>
                                        <div v-if="showFiles(msg) && msg.messageType !== 'TEXT' && !((msg.message && msg.message.length) && msg.messageType !== 'FILE')" :class="['line', msg.senderId === senderId ? 'line-sent' : 'line-received']">
                                            <div v-if="isTimeGroupEnd(index)" class="time">{{ formatChatTime(msg.lastSendTime) }}</div>
                                        </div>
                                    </div>
                                    </div>
                                </template>
                            </div>
                            <div v-if="selectedFiles && selectedFiles.length" class="attach-preview">
                                <div v-for="(file, i) in selectedFiles" :key="i" class="preview-item">
                                    <div class="preview-wrap">
                                        <div class="preview-icon">
                                            <img v-if="isImage(file?.name || file?.type) && selectedPreviewUrls[i]" :src="selectedPreviewUrls[i]" alt="preview" class="preview-thumb" />
                                            <v-icon v-else :icon="getFileIcon(file?.name || file?.type)" size="32" :color="getFileIconColor(file?.name || file?.type)"></v-icon>
                                        </div>
                                        <div class="preview-info">
                                            <div class="preview-name">{{ file?.name || '파일' }}</div>
                                            <div v-if="file?.size" class="preview-size">{{ formatFileSize(file.size) }}</div>
                                        </div>
                                        <button class="remove-btn" @click="removeSelectedFile(i)" aria-label="첨부 삭제">×</button>
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
                                <v-btn class="send-btn" variant="flat" elevation="0" rounded="xl" height="48" @click="sendMessage" :loading="isSending || uploading" :disabled="isSending || uploading">전송</v-btn>
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
                        <transition name="slide-user">
                        <div v-if="isUserPanelOpen" class="user-panel">
                            <div class="user-panel-header">
                                <img src="@/assets/icons/chat/account-supervisor.svg" alt="users" class="user-panel-icon" />
                                <span class="user-panel-title">사용자 목록</span>
                                <span class="user-panel-count">{{ participantsList.length }}</span>
                            </div>
                            <div class="user-panel-body">
                                <div v-for="(u, idx) in participantsList" :key="idx" class="user-row">
                                    <div class="user-avatar">
                                        <img :src="u.profileImageUrl || userDefault" alt="user" @error="onAvatarError($event)" :style="{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }" />
                                    </div>
                                    <div class="user-name">{{ u.name }}</div>
                                </div>
                            </div>
                        </div>
                        </transition>
                        <transition name="slide-user">
                        <div v-if="isDocsPanelOpen" class="user-panel docs-mode">
                            <div class="user-panel-header docs-header">
                                <img src="@/assets/icons/chat/file-multiple.svg" alt="docs" class="user-panel-icon" />
                                <span class="user-panel-title">문서함</span>
                                <span class="user-panel-count">{{ filesList.length }}</span>
                            </div>
                            <div class="docs-panel-body">
                                <div v-for="(group, gIdx) in groupedFiles" :key="gIdx" class="docs-group">
                                    <div class="docs-date">{{ group.date }}</div>
                                    <div class="file-grid">
                                        <div v-for="file in group.items" :key="file.fileId" class="file-card">
                                            <template v-if="isImage(file.fileUrl || file.fileName)">
                                                <a href="#" @click.prevent="openImage(file.fileUrl)">
                                                    <img :src="file.fileUrl" alt="file" class="file-thumb" />
                                                </a>
                                            </template>
                                            <template v-else>
                                                <a :href="file.fileUrl" target="_blank" rel="noopener" class="file-doc">
                                                    <span class="badge-doc">{{ fileExt(file.fileName) }}</span>
                                                    <span class="doc-name text-ellipsis">{{ file.fileName }}</span>
                                                    <span class="doc-size">{{ formatFileSize(file.fileSize) }}</span>
                                                </a>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </transition>
                        <transition name="slide-user">
                        <div v-if="isSearchOpen" class="user-panel search-mode">
                            <div class="user-panel-header docs-header">
                                <img src="@/assets/icons/chat/magnify.svg" alt="search" class="user-panel-icon" />
                                <span class="user-panel-title">검색</span>
                                <v-btn class="banner-btn menu" variant="text" size="small" icon @click="toggleSearch(false)" style="justify-self:end">
                                    <img src="@/assets/icons/user/close.svg" alt="close" class="menu-icon" />
                                </v-btn>
                            </div>
                            <div class="docs-panel-body">
                                <div class="search-bar">
                                    <input class="search-input" type="text" v-model="searchQuery" placeholder="메시지 내용 검색" @keyup.enter="doSearch" />
                                    <button class="search-btn" @click="doSearch">검색</button>
                                </div>
                                <div class="search-results" :key="searchVersion">
                                    <div v-if="searching" class="search-empty">검색 중…</div>
                                    <template v-else>
                                        <div v-if="!searchResults.length" class="search-empty">검색 결과가 없습니다</div>
                                        <div v-else>
                                            <div v-for="r in searchResults" :key="r.index" class="result-row" @click="scrollToMessage(r.index)">
                                                <div class="result-sender" :title="r.sender">{{ r.sender }}</div>
                                                <div class="result-text">{{ r.snippet }}</div>
                                                <div class="result-meta">{{ formatChatTime(r.time) }}</div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                        </transition>
                    </v-card>

                </v-col>
            </v-row>
        </v-container>
        <v-dialog v-model="isImageModalOpen" max-width="820px">
            <v-card class="image-modal-card">
                <v-card-text class="image-modal-body">
                    <img :src="imageModalSrc" alt="preview" class="image-modal-img" />
                </v-card-text>
                <v-card-actions class="justify-end">
                    <v-btn class="image-modal-btn" variant="elevated" color="#FFE364" @click="isImageModalOpen=false">닫기</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import stompManager from '@/services/stompService.js';
import userDefault from '@/assets/icons/chat/user_defualt.svg';
import axios from 'axios';
import { showSnackbar } from '@/services/snackbar.js';


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
            },
            groupedFiles(){
                const groups = {};
                for (const f of (this.filesList||[])){
                    const d = new Date(f.createAt);
                    const date = isNaN(d) ? String(f.createAt).slice(0,10) : `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
                    if(!groups[date]) groups[date] = [];
                    groups[date].push(f);
                }
                return Object.entries(groups).sort((a,b)=> a[0]<b[0] ? 1 : -1).map(([date, items])=>({ date, items }));
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
                selectedPreviewUrls: [],
                uploading: false,
                isSending: false,
                reconnecting: false,
                _reconnectTimer: null,
                isEmojiOpen: false,
                emojiList: [
                    "😀","😁","😂","🤣","😊","😍","😘","😎","🤔","😢",
                    "👍","👏","🙏","🔥","🎉","💡","✅","⚠️","❗","❓"
                ],
                isHeaderMenuOpen: false,
                isUserPanelOpen: false,
                isDocsPanelOpen: false,
                participantsList: [],
                filesList: [],
                isImageModalOpen: false,
                imageModalSrc: '',
                // search
                isSearchOpen: false,
                searchQuery: '',
                searchResults: [],
                searching: false,
                searchVersion: 0,
                highlightIndex: -1,
            }
        },
        created() {
            this.senderId = localStorage.getItem("id");
        },
        watch: {
            roomId(){
                // 채팅방 변경 시 사이드 패널 닫기
                this.isUserPanelOpen = false;
                this.isDocsPanelOpen = false;
                this.isHeaderMenuOpen = false;
            }
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
                return Array.isArray(msg.chatFileListDtoList) && msg.chatFileListDtoList.length > 0;
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
                // 파일이 실제로 첨부되어 있는데 서버가 임시 텍스트를 넣은 경우 제거
                if (m.chatFileListDtoList.length > 0 && typeof m.message === 'string') {
                    const t = m.message.trim();
                    const looksLikePlaceholder = t.length <= 40 && /(FILE|파일)/i.test(t) && /\(|\)|\s/.test(t) && !/[a-zA-Z가-힣0-9].*[a-zA-Z가-힣0-9]/.test(t.replace(/\(|\)/g, ''));
                    if (looksLikePlaceholder) m.message = '';
                }
                return m;
            },
            isGroupStart(index) {
                if (index === 0) return true;
                const prev = this.messages[index - 1];
                const curr = this.messages[index];
                if (!prev || !curr) return true;
                return prev.senderId !== curr.senderId;
            },
            isTimeGroupEnd(index) {
                const curr = this.messages[index];
                const next = this.messages[index + 1];
                if (!curr) return true;
                // 마지막 메시지면 시간 표시
                if (!next) return true;
                // 다음 메시지가 동일 발신자이고 동일 분 단위 시간이면 현재는 시간 숨김
                const sameSender = next.senderId === curr.senderId;
                const sameMinute = this.sameMinute(curr.lastSendTime, next.lastSendTime);
                return !(sameSender && sameMinute);
            },
            sameMinute(a, b) {
                try {
                    const da = new Date(a);
                    const db = new Date(b);
                    if (isNaN(da) || isNaN(db)) return String(a).slice(0,16) !== String(b).slice(0,16) ? false : true;
                    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate() && da.getHours() === db.getHours() && da.getMinutes() === db.getMinutes();
                } catch(_) { return false; }
            },
            isDateBoundary(index){
                if (index === 0) return true;
                const prev = this.messages[index - 1];
                const curr = this.messages[index];
                if (!prev || !curr) return true;
                const pd = new Date(prev.lastSendTime);
                const cd = new Date(curr.lastSendTime);
                if (isNaN(pd) || isNaN(cd)) return String(prev.lastSendTime).slice(0,10) !== String(curr.lastSendTime).slice(0,10);
                return pd.getFullYear() !== cd.getFullYear() || pd.getMonth() !== cd.getMonth() || pd.getDate() !== cd.getDate();
            },
            formatDateHeader(t){
                const d = new Date(t);
                if (isNaN(d)) return String(t).slice(0,10);
                const y = d.getFullYear();
                const m = String(d.getMonth()+1).padStart(2,'0');
                const day = String(d.getDate()).padStart(2,'0');
                return `${y}.${m}.${day}`;
            },
            fileExt(name){
                const m = String(name||'').match(/\.([a-zA-Z0-9]+)$/);
                return (m && m[1] || 'FILE').toUpperCase();
            },
            formatFileSize(bytes){
                const b = Number(bytes)||0;
                if (b < 1024) return `${b} B`;
                const kb = b/1024;
                if (kb < 1024) return `${kb.toFixed(1)} KB`;
                const mb = kb/1024; return `${mb.toFixed(1)} MB`;
            },
            getFileIcon(nameOrType) {
                if (!nameOrType) return 'mdi-file';
                const ext = String(nameOrType).toLowerCase().match(/\.([a-zA-Z0-9]+)$/)?.[1] || '';
                const type = String(nameOrType).toLowerCase();
                
                // 이미지
                if (/(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(ext) || type.startsWith('image/')) {
                    return 'mdi-image';
                }
                // PDF
                if (ext === 'pdf' || type.includes('pdf')) {
                    return 'mdi-file-pdf-box';
                }
                // Word
                if (/(doc|docx)$/.test(ext) || type.includes('word') || type.includes('document')) {
                    return 'mdi-file-word-box';
                }
                // Excel
                if (/(xls|xlsx)$/.test(ext) || type.includes('excel') || type.includes('spreadsheet')) {
                    return 'mdi-file-excel-box';
                }
                // PowerPoint
                if (/(ppt|pptx)$/.test(ext) || type.includes('powerpoint') || type.includes('presentation')) {
                    return 'mdi-file-powerpoint-box';
                }
                // 동영상
                if (/(mp4|avi|mov|wmv|flv|mkv|webm)$/.test(ext) || type.startsWith('video/')) {
                    return 'mdi-file-video';
                }
                // 오디오
                if (/(mp3|wav|ogg|flac|aac)$/.test(ext) || type.startsWith('audio/')) {
                    return 'mdi-file-music';
                }
                // 압축파일
                if (/(zip|rar|7z|tar|gz)$/.test(ext) || type.includes('zip') || type.includes('compressed')) {
                    return 'mdi-folder-zip';
                }
                // 텍스트
                if (/(txt|md|log)$/.test(ext) || type.includes('text/')) {
                    return 'mdi-file-document';
                }
                // 코드 파일
                if (/(js|ts|jsx|tsx|html|css|json|xml|yaml|yml)$/.test(ext)) {
                    return 'mdi-code-tags';
                }
                // 기본 파일
                return 'mdi-file';
            },
            getFileIconColor(nameOrType) {
                if (!nameOrType) return '#757575';
                const ext = String(nameOrType).toLowerCase().match(/\.([a-zA-Z0-9]+)$/)?.[1] || '';
                const type = String(nameOrType).toLowerCase();
                
                // PDF - 빨간색
                if (ext === 'pdf' || type.includes('pdf')) {
                    return '#F44336';
                }
                // Word - 파란색
                if (/(doc|docx)$/.test(ext) || type.includes('word') || type.includes('document')) {
                    return '#2196F3';
                }
                // Excel - 초록색
                if (/(xls|xlsx)$/.test(ext) || type.includes('excel') || type.includes('spreadsheet')) {
                    return '#4CAF50';
                }
                // PowerPoint - 주황색
                if (/(ppt|pptx)$/.test(ext) || type.includes('powerpoint') || type.includes('presentation')) {
                    return '#FF9800';
                }
                // 이미지 - 보라색
                if (/(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(ext) || type.startsWith('image/')) {
                    return '#9C27B0';
                }
                // 동영상 - 빨간색
                if (/(mp4|avi|mov|wmv|flv|mkv|webm)$/.test(ext) || type.startsWith('video/')) {
                    return '#E91E63';
                }
                // 오디오 - 분홍색
                if (/(mp3|wav|ogg|flac|aac)$/.test(ext) || type.startsWith('audio/')) {
                    return '#E91E63';
                }
                // 압축파일 - 주황색
                if (/(zip|rar|7z|tar|gz)$/.test(ext) || type.includes('zip') || type.includes('compressed')) {
                    return '#FF9800';
                }
                // 기본 회색
                return '#757575';
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
                if (this.isSending) return; // guard for double trigger
                this.isSending = true;
                const text = (this.newMessage || "").trim();
                const hasText = text.length > 0;
                const hasFiles = this.selectedFiles && this.selectedFiles.length > 0;
                if (!hasText && !hasFiles) { this.isSending = false; return; }

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

                // 단일 메시지 전송 규칙
                const messageType = hasText && uploadedFileIds.length > 0
                    ? 'TEXT_WITH_FILE'
                    : hasText
                        ? 'TEXT'
                        : 'FILE';

                const message = {
                    roomId: this.roomId,
                    senderId: this.senderId,
                    message: hasText ? text : '',
                    lastSendTime: this.getNowLocalDateTime(),
                    messageType,
                    chatFileListDtoList: uploadedFileIds.map((id) => ({ fileId: id })),
                };
                try {
                    stompManager.send(`/publish/${this.roomId}`, JSON.stringify(message));
                } finally {
                    // 입력 초기화
                    this.newMessage = "";
                    // 미리보기 URL 해제 및 초기화
                    try {
                        const urls = Array.isArray(this.selectedPreviewUrls) ? [...this.selectedPreviewUrls] : [];
                        urls.forEach(u => { try { if (u) URL.revokeObjectURL(u); } catch(_) {} });
                    } catch(_) {}
                    this.selectedPreviewUrls = [];
                    this.isSending = false;
                }
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
            onHeaderMenu(what){
                this.isHeaderMenuOpen = false;
                // TODO: 실제 라우팅/동작 연결 지점
                if (what === 'search') {
                    this.isDocsPanelOpen = false;
                    this.isUserPanelOpen = false;
                    this.toggleSearch(true);
                } else if (what === 'users') {
                    // 사용자 목록 패널 토글
                    this.isSearchOpen = false;
                    this.isDocsPanelOpen = false;
                    this.isUserPanelOpen = !this.isUserPanelOpen;
                    if (this.isUserPanelOpen) {
                        this.fetchParticipants();
                    }
                } else if (what === 'docs') {
                    this.isSearchOpen = false;
                    this.isUserPanelOpen = false;
                    this.isDocsPanelOpen = !this.isDocsPanelOpen;
                    if (this.isDocsPanelOpen) {
                        this.fetchFiles();
                    }
                }
            },
            toggleSearch(open){
                this.isSearchOpen = open;
                if (!open) {
                    this.searchQuery = '';
                    this.searchResults = [];
                    this.searching = false;
                    this.highlightIndex = -1;
                }
                this.$nextTick(() => {
                    if (open) {
                        try { document.querySelector('.search-input')?.focus(); } catch(_) {}
                    }
                });
            },
            doSearch(){
                const q = (this.searchQuery || '').trim().toLowerCase();
                this.searchVersion++;
                if (!q) { this.searchResults = []; return; }
                this.searching = true;
                this.$nextTick(() => {
                    const results = [];
                    for (let i = 0; i < this.messages.length; i++) {
                        const m = this.messages[i];
                        const text = String(m?.message || '').toLowerCase();
                        if (!text) continue;
                        if (text.includes(q)) {
                            const snippet = m.message.length > 120 ? (m.message.slice(0, 117) + '...') : m.message;
                            const sender = m.senderName || m.senderId || '익명';
                            results.push({ index: i, snippet, time: m.lastSendTime, sender });
                        }
                    }
                    this.searchResults = results;
                    this.searching = false;
                });
            },
            scrollToMessage(index){
                if (typeof index !== 'number') return;
                this.highlightIndex = index;
                this.$nextTick(() => {
                    try {
                        const box = this.$el.querySelector('.chat-box');
                        const target = this.$el.querySelector(`[data-msg-idx="${index}"]`);
                        if (box && target) {
                            const top = target.offsetTop - 24; // some padding
                            box.scrollTo({ top, behavior: 'smooth' });
                        }
                    } catch(_) {}
                    setTimeout(() => { this.highlightIndex = -1; }, 1500);
                });
            },
            closeUserPanel(){
                this.isUserPanelOpen = false;
                this.isDocsPanelOpen = false;
            },
            async fetchParticipants(){
                try {
                    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                    const url = `${baseURL}/chat-service/chat/room/${this.roomId}/participants`;
                    const { data } = await axios.get(url);
                    const list = Array.isArray(data?.result) ? data.result : [];
                    this.participantsList = list.map(p => ({ name: p?.name || '', profileImageUrl: p?.profileImageUrl || '' }));
                } catch (e) {
                    console.warn('fetch participants failed', e);
                    this.participantsList = [];
                }
            },
            async fetchFiles(){
                try {
                    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                    const url = `${baseURL}/chat-service/chat/room/${this.roomId}/files`;
                    const { data } = await axios.get(url);
                    const list = Array.isArray(data?.result) ? data.result : [];
                    this.filesList = list;
                } catch (e) {
                    console.warn('fetch files failed', e);
                    this.filesList = [];
                }
            },
            openImage(url){
                if (!url) return;
                this.imageModalSrc = url;
                this.isImageModalOpen = true;
            },
            onFilesSelected(event) {
                const files = Array.from(event.target.files || []);
                if (!files.length) return;
                
                const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
                const validFiles = [];
                const invalidFiles = [];
                
                // 파일 크기 체크
                files.forEach(file => {
                    if (file.size > MAX_FILE_SIZE) {
                        invalidFiles.push(file);
                    } else {
                        validFiles.push(file);
                    }
                });
                
                // 크기 초과 파일이 있으면 스낵바 표시
                if (invalidFiles.length > 0) {
                    const fileNames = invalidFiles.map(f => f.name).join(', ');
                    showSnackbar(
                        `파일 크기가 50MB를 초과합니다: ${fileNames.length > 50 ? fileNames.substring(0, 50) + '...' : fileNames}`,
                        { color: 'error', timeout: 5000 }
                    );
                }
                
                // 유효한 파일만 추가
                if (validFiles.length === 0) {
                    try { if (this.$refs.fileInput) this.$refs.fileInput.value = ''; } catch(_) {}
                    return;
                }
                
                const nextFiles = (this.selectedFiles || []).concat(validFiles);
                // 미리보기 URL 생성 (신규만)
                const newUrls = validFiles.map(f => {
                    try { return URL.createObjectURL(f); } catch(_) { return null; }
                });
                const nextUrls = (this.selectedPreviewUrls || []).concat(newUrls);
                this.selectedFiles = nextFiles;
                this.selectedPreviewUrls = nextUrls;
                // 같은 파일 인풋으로 재선택 가능하도록 리셋
                try { if (this.$refs.fileInput) this.$refs.fileInput.value = ''; } catch(_) {}
            },
            removeSelectedFile(index) {
                if (!Array.isArray(this.selectedFiles)) return;
                const files = [...this.selectedFiles];
                const urls = [...this.selectedPreviewUrls];
                const removedUrl = urls[index];
                files.splice(index, 1);
                urls.splice(index, 1);
                this.selectedFiles = files;
                this.selectedPreviewUrls = urls;
                try { if (removedUrl) URL.revokeObjectURL(removedUrl); } catch(_) {}
                // 파일 인풋 초기화
                try { if (this.$refs.fileInput) this.$refs.fileInput.value = ''; } catch(_) {}
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
.chat-card{ --v-card-border-radius: 15px; border-radius: 15px !important; overflow: hidden; margin: 24px 0; border: 1px solid #E5E5E5; --chat-accent: #FFE364; --banner-height: 56px; }
.chat-banner{ height: var(--banner-height); background: var(--chat-accent); display: grid; grid-template-columns: 40px 1fr 40px; align-items: center; position: sticky; top: 0; z-index: 2; }
.search-banner{ grid-template-columns: 40px 1fr 40px; }
.chat-banner.with-user-panel, .chat-banner.with-side-panel{ margin-right: 280px; transition: margin-right 200ms ease; }
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

.chat-body{ display: flex; flex-direction: column; padding: 0; height: calc(100vh - 64px - 80px - 56px); position: relative; }
.chat-body.with-user-panel, .chat-body.with-side-panel{ margin-right: 280px; transition: margin-right 200ms ease; }
/* v-card-text 기본 좌우 패딩 제거 (배너와 동일 폭 맞춤) */
.chat-card > .v-card-text.chat-body{ padding: 0 !important; }
.chat-box{
    flex: 1 1 auto;
    overflow-y: auto;
    border-bottom: 1px solid #ddd;
    padding: 8px 12px;
    position: relative;
}
.search-bar{ display: grid; grid-template-columns: 1fr auto; gap: 6px; padding: 8px 8px; border-bottom: 1px solid #E5E5E5; background: #FFF; width: 100%; box-sizing: border-box; }
.search-input{ height: 36px; border: 1px solid #E3E3E3; border-radius: 8px; padding: 0 12px; box-sizing: border-box; outline: none; min-width: 0; }
.search-btn{ height: 36px; border-radius: 8px; border: 1px solid #E3E3E3; background: #FFE364; color: #2A2828; font-weight: 700; padding: 0 12px; min-width: 72px; box-sizing: border-box; white-space: nowrap; }
.search-results{ max-height: 220px; overflow-y: auto; border-bottom: 1px solid #EEE; background: #FFF; }
.result-row{ display: grid; grid-template-columns: 84px 1fr auto; gap: 8px; padding: 8px 12px; border-top: 1px solid #F7F7F7; cursor: pointer; align-items: center; }
.result-sender{ font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-row:hover{ background: #FAFAFA; }
.result-text{ font-size: 12px; color: #333; }
.result-meta{ font-size: 11px; color: #999; }
.chat-row.highlight .bubble{ outline: 2px solid #FFE364; box-shadow: 0 0 0 3px rgba(255,227,100,0.35); }
.back-btn{ position: absolute; top: 4px; left: 4px; min-width: 28px; height: 28px; padding: 0; }
.chat-header{ display: flex; align-items: center; gap: 8px; }
.chat-header .title-text{ flex: 1; text-align: left; }
.back-btn-top{ min-width: 28px; height: 28px; padding: 0; }
.chat-row{ display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-end; }
.chat-row.group-cont .avatar{ visibility: hidden; width: 28px; }
.avatar-spacer{ visibility: hidden; }
.chat-row.group-cont .name{ display: none; }
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

/* Date separator */
.date-sep{ display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; margin: 12px 0; }
.date-sep .line{ height: 1px; background: #E5E5E5; }
.date-sep .label{ font-size: 12px; color: #000; background: #FFF; border: 1px solid #E5E5E5; border-radius: 999px; padding: 4px 10px; }

.chat-footer{ background: #2A2828; border-radius: 0 0 15px 15px; padding: 16px; display: flex; align-items: center; gap: 12px; width: 100%; align-self: stretch; box-sizing: border-box; margin-left: 0; margin-right: 0; margin-top: 0; flex-shrink: 0; --composer-height: 36px; }
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
.emoji-panel{ display: grid; grid-template-columns: repeat(8, 28px); gap: 6px; padding: 8px; background: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 12px; box-shadow: 0 6px 16px rgba(0,0,0,0.12); }
.emoji-btn{ width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; font-size: 18px; }
.emoji-btn:focus{ outline: none; }

.header-menu{ width: 140px; background: #FFFFFF; border: 1px solid #EEEEEE; border-radius: 15px; box-shadow: 0 6px 16px rgba(0,0,0,0.12); padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.header-menu-item{ display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px; border: none; background: transparent; cursor: pointer; border-radius: 8px; font-size: 14px; color: #000; }
.header-menu-item:hover{ background: #F7F7F7; }
.menu-item-icon{ width: 18px; height: 18px; display: block; }
.send-btn{ flex: 0 0 112px; height: var(--composer-height) !important; border-radius: calc(var(--composer-height) / 2) !important; background-color: var(--chat-accent) !important; border-color: var(--chat-accent) !important; color: #000000 !important; font-weight: 400 !important; font-size: 12px !important; line-height: 15px !important; text-transform: none; letter-spacing: 0; }
.send-btn:focus,
.send-btn:focus-visible,
.send-btn:active{ outline: none !important; box-shadow: none !important; }

.files{ display: flex; gap: 6px; flex-wrap: wrap; margin: 4px 0; }
.files .file-item{ max-width: 160px; }
.files .image-thumb{ width: 120px; height: 120px; object-fit: cover; border-radius: 8px; display: block; }
.files .file-chip{ display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 12px; background: #F1F3F4; color: #455A64; font-size: 12px; text-decoration: none; }
.files-sent{ justify-content: flex-end; }
.files-received{ justify-content: flex-start; }

.reconnect-banner{ background: rgba(255,255,255,0.95); color: #2A2828; padding: 12px 16px; border-radius: 12px; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

.user-panel{ position: absolute; top: 0; right: 0; width: 280px; height: 100%; background: #FFFFFF; border-left: 1px solid #E5E5E5; box-shadow: -4px 0 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; }
.slide-user-enter-from{ transform: translateX(100%); opacity: 0; }
.slide-user-enter-active{ transition: transform 200ms ease, opacity 200ms ease; }
.slide-user-enter-to{ transform: translateX(0); opacity: 1; }
.slide-user-leave-from{ transform: translateX(0); opacity: 1; }
.slide-user-leave-active{ transition: transform 200ms ease, opacity 200ms ease; }
.slide-user-leave-to{ transform: translateX(100%); opacity: 0; }
.user-panel-header{ height: var(--banner-height); min-height: var(--banner-height); flex: 0 0 var(--banner-height); box-sizing: border-box; background: var(--chat-accent); display: grid; grid-template-columns: 40px 1fr 40px; align-items: center; padding: 0 8px; position: sticky; top: 0; z-index: 2; }
.user-panel.docs-mode .user-panel-header{ height: var(--banner-height); min-height: var(--banner-height); flex: 0 0 var(--banner-height); box-sizing: border-box; background: var(--chat-accent); display: grid; grid-template-columns: 40px 1fr 40px; align-items: center; padding: 0 8px; position: sticky; top: 0; z-index: 2; }
.user-panel-icon{ width: 24px; height: 24px; }
.user-panel-title{ color: #1C0F0F; font-weight: 700; text-align: center; }
.user-panel-count{ color: #1C0F0F; font-weight: 700; justify-self: end; }
.user-panel-body{ flex: 1 1 auto; overflow-y: auto; padding: 12px 8px; }
.docs-panel-body{ flex: 1 1 auto; overflow-y: auto; padding: 12px 10px; }
.user-row{ display: flex; align-items: center; justify-content: flex-start; gap: 64px; padding: 12px 8px 12px 36px; border-bottom: 1px solid #F1F1F1; }
.user-avatar{ width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: transparent; flex: 0 0 32px; border: 0; box-shadow: none; }
.user-avatar img{ width: 100%; height: 100%; object-fit: cover; display: block; }
.user-name{ font-size: 14px; color: #2A2828; text-align: center; }

/* Docs panel */
.docs-panel-body{ flex: 1 1 auto; overflow-y: auto; padding: 12px 10px; }
.docs-group{ margin-bottom: 12px; }
.docs-date{ font-size: 12px; color: #777; margin: 8px 4px; }
.file-grid{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.docs-mode .user-panel-header{ position: sticky; top: 0; }
.docs-mode{ display: flex; flex-direction: column; }
.file-card{ background: #F9F9F9; border: 1px solid #EAEAEA; border-radius: 8px; overflow: hidden; }
.file-thumb{ width: 100%; height: 120px; object-fit: cover; display: block; }
.file-doc{ display: flex; flex-direction: column; gap: 6px; align-items: flex-start; padding: 10px; text-decoration: none; color: #2A2828; background: #F9F9F9; border: 1px solid #EAEAEA; border-radius: 8px; }
.file-doc:hover{ background: #F7F7F7; }
.badge-doc{ background: #2A2828; color: #fff; font-size: 10px; border-radius: 4px; padding: 2px 4px; }
.doc-name{ font-size: 12px; max-width: 100%; }
.doc-size{ font-size: 11px; color: #777; }

/* Image modal */
.image-modal-body{ padding: 0; background: #FFF; display: grid; place-items: center; }
.image-modal-img{ max-width: 100%; max-height: 80vh; object-fit: contain; display: block; }
.image-modal-btn{ background: #FFE364 !important; color: #2A2828 !important; font-weight: 600; border-color: #FFE364 !important; }
.image-modal-btn:hover{ filter: brightness(0.98); }

.attach-preview{ 
    display: flex; 
    flex-direction: column;
    gap: 8px; 
    padding: 12px; 
    border-bottom: 1px solid #eee; 
    background: #FAFAFA; 
    max-height: 300px;
    overflow-y: auto;
    flex-shrink: 0;
    margin-bottom: 0;
}
.preview-item{ 
    position: relative;
    width: 100%;
}
.preview-wrap{ 
    position: relative; 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    padding: 8px 12px; 
    background: #fff; 
    border-radius: 8px; 
    border: 1px solid #e0e0e0;
    transition: box-shadow 0.2s;
    width: 100%;
    box-sizing: border-box;
}
.preview-wrap:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.preview-icon{ 
    flex-shrink: 0;
    width: 48px; 
    height: 48px; 
    border-radius: 6px; 
    overflow: hidden; 
    background: #F5F5F5; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
}
.preview-thumb{ 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
    display: block; 
}
.preview-info{ 
    flex: 1; 
    min-width: 0;
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
}
.preview-name{ 
    font-size: 14px; 
    font-weight: 500; 
    color: #333; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    white-space: nowrap; 
}
.preview-size{ 
    font-size: 12px; 
    color: #757575; 
}
.remove-btn{ 
    position: absolute; 
    top: 4px; 
    right: 4px; 
    width: 24px; 
    height: 24px; 
    aspect-ratio: 1 / 1; 
    border-radius: 50%; 
    background: rgba(0,0,0,0.6); 
    color: #fff; 
    border: none; 
    cursor: pointer; 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 16px; 
    line-height: 1; 
    padding: 0; 
    transition: background 0.2s;
}
.remove-btn:hover {
    background: rgba(0,0,0,0.8);
}

</style>