<template>
  <div class="document-viewer">
    <!-- Google Docs 스타일 헤더 -->
    <div class="docs-header" v-if="isContentLoaded">
      <div class="header-left">
        <v-icon class="docs-icon" color="#4285f4">mdi-file-document</v-icon>
        <div class="title-section">
          <input 
            v-model="documentTitle" 
            class="document-title"
            placeholder="제목 없는 문서"
            @blur="updateDocumentTitle"
            @keypress.enter="$event.target.blur()"
          />
          <div v-if="folderName" class="folder-name">
            <v-icon size="14" color="#5f6368">mdi-folder-outline</v-icon>
            <span>{{ folderName }}</span>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <!-- 상태 및 액션 -->
        <div class="status-pill" :class="connectionStatus">
          <span class="dot"></span>
          {{ connectionStatusText }}
        </div>

        <div class="divider"></div>

        <div class="actions">
          <v-btn icon size="small" variant="text" class="action-btn" :disabled="!canUndo" title="되돌리기" @click="onUndo">
            <v-icon>mdi-undo</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" class="action-btn" :disabled="!canRedo" title="다시 실행" @click="onRedo">
            <v-icon>mdi-redo</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" class="action-btn" title="DOCX로 내보내기" @click="exportDocx">
            <v-icon>mdi-file-word-outline</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" class="action-btn" title="인쇄" @click="printDocument">
            <v-icon>mdi-printer</v-icon>
          </v-btn>
        </div>

        <div class="divider"></div>

        <!-- 온라인 사용자 표시 -->
        <div class="online-users">
          <v-chip size="small" class="presence-chip" color="primary" variant="tonal">
            <v-icon start size="16">mdi-account-group</v-icon>
            {{ onlineUsers.length }}명 참여 중
          </v-chip>
          <div class="avatars">
            <v-tooltip
              v-for="onlineUser in onlineUsers"
              :key="onlineUser.userId"
              location="bottom"
            >
              <template v-slot:activator="{ props }">
                <v-avatar
                  v-bind="props"
                  :color="onlineUser.profileImage ? 'transparent' : onlineUser.color"
                  size="28"
                  class="user-avatar-small"
                >
                  <v-img v-if="onlineUser.profileImage" :src="onlineUser.profileImage" />
                  <span v-else class="avatar-text">{{ onlineUser.userName ? onlineUser.userName.charAt(0).toUpperCase() : 'U' }}</span>
                </v-avatar>
              </template>
              <span>{{ onlineUser.userName || onlineUser.userId }}</span>
            </v-tooltip>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 확대/축소 -->
        <div class="zoom-select">
          <v-select
            :items="[ '75%', '90%', '100%', '125%', '150%' ]"
            v-model="zoom"
            density="compact"
            variant="outlined"
            hide-details
            style="width: 124px; min-width: 124px;"
          />
        </div>
      </div>
    </div>

    <!-- 문서 편집기 -->
    <div class="editor-content" v-if="isContentLoaded">
      <div class="editor-scale" :style="zoomStyle">
        <RealTimeEditor
          :initialContent="editorInitialContent"
          :documentId="documentId"
          :initial-locked-lines="lockedLinesMap"
          :user-id="userId"
          :user-name="userName"
          :profile-image="profileImage"
          :show-connection-status="false"
          @online-users-updated="updateOnlineUsers"
          @connection-status-changed="onConnectionStatusChanged"
          ref="editorRef"
        />
      </div>
    </div>

    <!-- 로딩 화면 -->
    <div v-else class="loading-container">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <p class="mt-4">문서를 불러오는 중입니다...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import axios from 'axios';
import RealTimeEditor from '@/components/document/RealTimeEditor.vue';
import { disconnectStomp } from '@/services/editorStompService.js';
import driveService from '@/services/driveService';
import { showSnackbar } from '@/services/snackbar.js';

// data() 대신 ref/reactive 사용
const route = useRoute();
const router = useRouter();
const documentId = ref(route.params.documentId);
const editorInitialContent = ref('');
const isContentLoaded = ref(false);
const lockedLinesMap = ref(new Map());
const documentTitle = ref('제목 없는 문서');
const folderName = ref(null);
const onlineUsers = ref([]);
const connectionStatus = ref('connecting'); // 'connecting' | 'connected' | 'offline'
const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return '실시간 저장됨';
    case 'offline': return '오프라인 (저장 안됨)';
    default: return '연결 중...';
  }
});
const zoom = ref('100%');
const zoomStyle = computed(() => {
  const num = Number(String(zoom.value).replace('%','')) || 100;
  const factor = num / 100;
  return { zoom: String(factor) };
});
// 사용자 정보
const userId = ref('');
const userName = ref('');
const profileImage = ref('');
const editorRef = ref(null);

const handleDisconnect = () => {
  if (documentId.value && userId.value) {
    disconnectStomp(documentId.value, userId.value);
  }
};

// 401 에러 처리 함수
const handle401Error = () => {
  showSnackbar('접근 권한이 없습니다.', 'error');
  handleDisconnect();
  
  // 창 닫기 시도 (새 창에서 열린 경우에만 작동)
  setTimeout(() => {
    if (window.opener) {
      window.close();
    } else {
      // 새 창이 아닌 경우 이전 페이지로 이동
      router.go(-1);
    }
  }, 1500);
};

// methods 대신 const 함수 선언
const fetchUserInfo = async () => {
  try {
    const localUserId = localStorage.getItem('id');
    const token = localStorage.getItem('accessToken');
    
    const response = await axios.get('http://localhost:8080/drive-service/documentLine/userInfo', {
      headers: {
        'X-User-Id': localUserId,
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userInfo = response.data.result;
    userId.value = userInfo.userId;
    userName.value = userInfo.userName;
    profileImage.value = userInfo.profileImage;
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    if (error.response?.status === 401) {
      handle401Error();
      return;
    }
    // 실패 시 localStorage에서 fallback
    userId.value = localStorage.getItem('id') || 'Guest';
    userName.value = localStorage.getItem('name') || '게스트';
  }
};

const fetchDocumentInfo = async () => {
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const localUserId = localStorage.getItem('id');
    const token = localStorage.getItem('accessToken');
    const workspaceId = localStorage.getItem('selectedWorkspaceId');
    const res = await axios.get(`${baseURL}/drive-service/drive/document/${documentId.value}`, {
      headers: {
        'X-User-Id': localUserId || '',
        'Authorization': token ? `Bearer ${token}` : undefined,
        ...(workspaceId && { 'X-Workspace-Id': workspaceId }),
      }
    });
    const doc = res?.data?.result || res?.data;
    if (doc) {
      documentTitle.value = doc.title || doc.name || '제목 없는 문서';
      folderName.value = doc.folderName || null;
    } else {
      documentTitle.value = '제목 없는 문서';
      folderName.value = null;
    }
  } catch (error) {
    console.error('문서 정보 로딩 실패:', error);
    
    // 서버 응답값 추출 및 표시
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.statusMessage 
      || error.response?.data?.error 
      || error.response?.data?.result 
      || error.message
      || '문서를 불러오는 중 오류가 발생했습니다.';
    
    // 서버 응답 데이터 전체를 표시
    const serverResponse = error.response?.data 
      ? JSON.stringify(error.response.data, null, 2)
      : error.message;
    
    console.error('서버 응답:', serverResponse);
    showSnackbar(`오류: ${errorMessage}`, 'error');
    
    // 에러 발생 시 창 닫기
    handleDisconnect();
    
    setTimeout(() => {
      if (window.opener) {
        // 새 창에서 열린 경우 창 닫기
        window.close();
      } else {
        // 새 창이 아닌 경우 이전 페이지로 이동
        router.go(-1);
      }
    }, 2000);
    
    // 더 이상 진행하지 않음
    return;
  }
};

const fetchDocumentLines = async () => {
  try {
    const response = await axios.get(`http://localhost:8080/drive-service/documentLine/document/${documentId.value}/documentLines`);
    const lines = response.data.result;
    editorInitialContent.value = lines.map(line => line.content).join('');

    const locked = new Map();
    lines.forEach(line => {
      if (line.lockedBy) {
        locked.set(line.lineId, line.lockedBy);
      }
    });
    lockedLinesMap.value = locked;

    isContentLoaded.value = true;
  } catch (error) {
    console.error('문서 라인 로딩 실패:', error);
    if (error.response?.status === 401) {
      handle401Error();
      return;
    }
    isContentLoaded.value = true;
  }
};

const updateDocumentTitle = async () => {
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const token = localStorage.getItem('accessToken');
    const workspaceId = localStorage.getItem('selectedWorkspaceId');
    const body = { title: documentTitle.value };
    await axios.put(`${baseURL}/drive-service/drive/document/${documentId.value}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : undefined,
        ...(workspaceId && { 'X-Workspace-Id': workspaceId }),
      }
    });
    showSnackbar('문서 제목이 변경되었습니다.', 'success');
  } catch (error) {
    console.error('문서 제목 변경 실패:', error);
    if (error.response?.status === 401) {
      handle401Error();
      return;
    }
    const errorMessage = error.response?.data?.message || error.response?.data?.statusMessage || error.response?.data?.error || '문서 제목 변경에 실패했습니다.';
    showSnackbar(errorMessage, 'error');
  }
};

// 확대/축소 UI만 제공 (실제 확대 기능은 에디터 확대 옵션 연동 시 적용)

const updateOnlineUsers = (users) => {
  onlineUsers.value = users;
};

const onConnectionStatusChanged = (status) => {
  connectionStatus.value = status || 'connecting';
};

const canUndo = computed(() => {
  try { return !!editorRef.value?.canUndo?.(); } catch(_) { return false; }
});
const canRedo = computed(() => {
  try { return !!editorRef.value?.canRedo?.(); } catch(_) { return false; }
});
const onUndo = () => { try { editorRef.value?.undo?.(); } catch(_) {} };
const onRedo = () => { try { editorRef.value?.redo?.(); } catch(_) {} };

// DOCX 내보내기
const exportDocx = async () => {
  try {
    const html = editorRef.value?.getHtml?.() || '';
    if (!html) return showSnackbar('내보낼 내용이 없습니다.', 'info');
    
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
    const { saveAs } = await import('file-saver');
    
    // Helper function to parse text nodes with formatting
    const parseTextRun = (node) => {
      const textRuns = [];
      if (node.nodeType === 3) { // Text node
        const text = node.textContent || '';
        if (text.trim()) {
          textRuns.push(new TextRun(text));
        }
        return textRuns;
      }
      
      if (node.nodeType === 1) { // Element node
        const tagName = node.tagName?.toLowerCase();
        let options = { text: '' };
        
        // Get text content
        const text = node.textContent || '';
        
        // Apply formatting based on tag
        if (tagName === 'strong' || tagName === 'b') {
          options.bold = true;
        }
        if (tagName === 'em' || tagName === 'i') {
          options.italic = true;
        }
        if (tagName === 'u') {
          options.underline = {};
        }
      
      // Handle nested nodes
      if (node.childNodes.length > 0) {
        node.childNodes.forEach(child => {
          const childRuns = parseTextRun(child);
          textRuns.push(...childRuns);
        });
      } else if (text.trim()) {
        textRuns.push(new TextRun({ ...options, text }));
      }
    }
    
    return textRuns;
  };
  
  const parseParagraph = (node) => {
    const children = [];
    let alignment = undefined;
    
    // Check alignment
    const align = node.style?.textAlign || node.getAttribute('style')?.match(/text-align:\s*(\w+)/)?.[1];
    if (align === 'center') alignment = AlignmentType.CENTER;
    else if (align === 'right') alignment = AlignmentType.RIGHT;
    else if (align === 'justify') alignment = AlignmentType.JUSTIFIED;
    
    // Parse child nodes
    if (node.childNodes) {
      node.childNodes.forEach(child => {
        const runs = parseTextRun(child);
        children.push(...runs);
      });
    }
    
    // If no children, add empty text run
    if (children.length === 0) {
      children.push(new TextRun(''));
    }
    
    return new Paragraph({
      children,
      alignment,
      spacing: { after: 200 }
    });
  };
  
  const htmlToDocx = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const body = doc.body;
    const paragraphs = [];
    
    // Process all block elements
    const blockElements = body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, li');
    
    if (blockElements.length === 0) {
      // No block elements, process text content directly
      const textContent = body.textContent || '';
      if (textContent.trim()) {
        paragraphs.push(new Paragraph({
          children: [new TextRun(textContent)]
        }));
      }
    } else {
      blockElements.forEach(element => {
        const tagName = element.tagName?.toLowerCase();
        let paragraph;
        
        if (tagName.startsWith('h')) {
          const level = parseInt(tagName.charAt(1)) || 1;
          const headingLevels = [
            HeadingLevel.HEADING_1,
            HeadingLevel.HEADING_2,
            HeadingLevel.HEADING_3,
            HeadingLevel.HEADING_4,
            HeadingLevel.HEADING_5,
            HeadingLevel.HEADING_6
          ];
          paragraph = new Paragraph({
            children: parseTextRun(element),
            heading: headingLevels[Math.min(level - 1, 5)],
            spacing: { after: 200, before: level === 1 ? 240 : 120 }
          });
        } else {
          paragraph = parseParagraph(element);
        }
        
        paragraphs.push(paragraph);
      });
    }
    
    return paragraphs;
    };
    
    // Convert HTML to docx paragraphs
    const paragraphs = htmlToDocx(html);
    
    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({
        children: [new TextRun('')]
      }));
    }
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });
    
    // Generate blob and download
    const blob = await Packer.toBlob(doc);
    const fileName = `${(documentTitle.value || 'document').replace(/[/\\?%*:|"<>]/g, '_')}.docx`;
    saveAs(blob, fileName);
    
    showSnackbar('DOCX 파일이 다운로드되었습니다.', 'success');
  } catch (e) {
    console.error('DOCX 내보내기 실패:', e);
    showSnackbar('DOCX 내보내기에 실패했습니다.', 'error');
  }
};

const printDocument = () => {
  try {
    window.print();
  } catch (_) {}
};

// created() 훅 대신 onMounted() 사용
onMounted(async () => {
  await fetchUserInfo();
  await fetchDocumentInfo();
  await fetchDocumentLines();
  window.addEventListener('beforeunload', handleDisconnect);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleDisconnect);
});

// 컴포넌트를 떠나기 직전에 라우터 가드가 호출됩니다.
onBeforeRouteLeave((to, from, next) => {
  handleDisconnect();
  next();
});
</script>

<style scoped>
.document-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f9fbfd;
  display: flex;
  flex-direction: column;
  font-family: 'Roboto', 'Arial', sans-serif;
}

/* Google Docs 스타일 헤더 */
.docs-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 64px;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.1);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.docs-icon {
  font-size: 32px !important;
  flex-shrink: 0;
}

.title-section {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.document-title {
  font-size: 18px;
  font-weight: 400;
  border: none;
  outline: none;
  padding: 6px 8px;
  border-radius: 4px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 500px;
  transition: background-color 0.2s;
}

.document-title:hover {
  background-color: #f1f3f4;
}

.document-title:focus {
  background-color: #fff;
  box-shadow: 0 0 0 2px #4285f4;
}

.folder-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5f6368;
  padding: 4px 10px;
  background-color: #f1f3f4;
  border-radius: 16px;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-weight: 500;
}

.folder-name:hover {
  background-color: #e8eaed;
}

.folder-name .v-icon {
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.online-users {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-avatar-small {
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  transition: transform 0.2s ease;
  font-size: 14px;
}

.user-avatar-small:hover {
  transform: scale(1.1);
  z-index: 10;
}

.avatar-text {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.share-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.25px;
  padding: 0 24px !important;
  box-shadow: none !important;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
}
.status-pill .dot { width: 8px; height: 8px; border-radius: 50%; }
.status-pill.connecting { background: #eef3fe; color: #1967d2; }
.status-pill.connecting .dot { background: #9aa0a6; }
.status-pill.connected { background: #eef3fe; color: #1967d2; }
.status-pill.connected .dot { background: #34a853; }
.status-pill.offline { background: #fde8e7; color: #d93025; }
.status-pill.offline .dot { background: #d93025; }

.divider {
  width: 1px;
  height: 28px;
  background: #e0e0e0;
  margin: 0 12px;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.action-btn {
  color: #5f6368 !important;
}
.action-btn:hover {
  background: #f1f3f4 !important;
}

.presence-chip {
  margin-right: 8px;
}
.avatars {
  display: inline-flex;
  align-items: center;
}

/* 에디터 콘텐츠 영역 */
.editor-content {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #f9fbfd;
  padding: 24px 48px;
}

/* zoom 기준점 */
.editor-scale {
  transform-origin: top center;
}

/* Floating toolbar behavior when scrolled */
/* revert to simple sticky horizontal toolbar (default styles below remain) */

/* thin scrollbar inside floating toolbar */
.editor-content.scrolled :deep(.editor-toolbar::-webkit-scrollbar) {
  width: 8px;
}
.editor-content.scrolled :deep(.editor-toolbar::-webkit-scrollbar-thumb) {
  background: #e0e0e0;
  border-radius: 4px;
}

/* RealTimeEditor 스타일 오버라이드 */
.editor-content :deep(.editor-wrapper) {
  max-width: 980px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.15), 0 1px 2px rgba(60, 64, 67, 0.3);
  border-radius: 0;
  min-height: calc(100vh - 160px);
  overflow: visible; /* override inner card overflow so sticky can work */
}

.editor-content :deep(.v-alert) {
  border-radius: 0;
  margin: 0;
}

.editor-content :deep(.editor-toolbar) {
  background: #f8f9fa;
  border-bottom: 1px solid #e8eaed;
  padding: 8px 16px !important;
  border-radius: 0;
  position: sticky;
  top: 0;
  z-index: 50; /* above content */
}

.editor-content :deep(.editor-toolbar .v-btn) {
  border-radius: 4px;
}

.editor-content :deep(.editor-container) {
  padding: 48px 96px;
  min-height: 800px;
  background: white;
}

/* v-card-text가 자체 스크롤을 생성하지 않도록 해서 sticky가 정상 동작하게 함 */
.editor-content :deep(.v-card-text) {
  flex: 1;
  overflow: visible;
}

/* Some Vuetify cards set overflow hidden; ensure it's visible for sticky */
.editor-content :deep(.editor-wrapper.v-card) {
  overflow: visible;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  font-size: 11pt;
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  color: #202124;
}

.editor-content :deep(.ProseMirror p) {
  margin: 0 0 10pt 0;
}

.editor-content :deep(.ProseMirror h1) {
  font-size: 26pt;
  margin: 20pt 0 6pt 0;
  font-weight: 400;
}

.editor-content :deep(.ProseMirror h2) {
  font-size: 20pt;
  margin: 18pt 0 6pt 0;
  font-weight: 400;
}

.editor-content :deep(.online-users-container) {
  display: none;
}

/* 로딩 컨테이너 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #5f6368;
  background: #f9fbfd;
}

.loading-container p {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 400;
}

/* 스크롤바 스타일링 */
.editor-content::-webkit-scrollbar {
  width: 12px;
}

.editor-content::-webkit-scrollbar-track {
  background: #f9fbfd;
}

.editor-content::-webkit-scrollbar-thumb {
  background: #dadce0;
  border-radius: 6px;
  border: 2px solid #f9fbfd;
}

.editor-content::-webkit-scrollbar-thumb:hover {
  background: #bdc1c6;
}

/* Print only the editor content */
@media print {
  /* Page margins */
  @page { margin: 12mm; }

  /* Hide viewer chrome */
  .docs-header { display: none !important; }
  .document-viewer { background: #ffffff !important; }

  /* Collapse paddings to use page area efficiently */
  .editor-content { padding: 0 !important; overflow: visible !important; }

  /* Hide non-content UI inside editor */
  .editor-content :deep(.v-alert) { display: none !important; }
  .editor-content :deep(.editor-toolbar) { display: none !important; }
  .editor-content :deep(.online-users-container) { display: none !important; }
  .editor-content :deep(.remote-cursor) { display: none !important; }
  .editor-content :deep(.remote-selection-highlight) { display: none !important; }

  /* Remove card look and shadows */
  .editor-content :deep(.editor-wrapper) { box-shadow: none !important; border-radius: 0 !important; }
  .editor-content :deep(.editor-container) { padding: 0 0 !important; }

  /* Ensure full width content for print */
  .editor-content :deep(.editor-wrapper) { max-width: none !important; }
  .editor-content :deep(.editor-container),
  .editor-content :deep(.ProseMirror) { width: 100% !important; }

  /* Normalize zoom/scaling for print */
  .editor-scale { zoom: 1 !important; transform: none !important; }
}
</style>

