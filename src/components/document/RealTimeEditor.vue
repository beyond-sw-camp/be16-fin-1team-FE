<template>
  <div class="editor-wrapper">
    <!-- 연결 상태 표시 -->
    <div class="connection-status" :class="connectionStatusClass">
      <span v-if="connectionStatus === 'connecting'">🔄 서버 연결 중...</span>
      <span v-else-if="connectionStatus === 'connected'">✅ 실시간 협업 활성화</span>
      <span v-else-if="connectionStatus === 'offline'">⚠️ 오프라인 모드 (변경사항이 저장되지 않습니다)</span>
    </div>
    <div v-if="editor">
      <div class="toolbar">
        <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">Bold</button>
        <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">H1</button>
        <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
        <button @click="editor.chain().focus().setParagraph().run()" :class="{ 'is-active': editor.isActive('paragraph') }">Paragraph</button>
      </div>
      <div class="editor-container" ref="editorContainerRef">
        <editor-content :editor="editor" />
        <!-- 다른 사용자들의 커서를 렌더링하는 부분 -->
        <div
          v-for="cursor in remoteCursors"
          :key="cursor.senderId"
          class="remote-cursor"
          :style="{
            transform: `translate(${cursor.coords.left}px, ${cursor.coords.top}px)`,
            backgroundColor: cursor.user.color,
            height: cursor.height ? `${cursor.height}px` : '1.3em'
          }"
        >
          <div class="cursor-flag" :style="{ backgroundColor: cursor.user.color }">
            {{ cursor.user.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import StarterKit from '@tiptap/starter-kit';
import { connectStomp, sendStompMessage, disconnectStomp } from '../../services/editorStompService';

function randomUUID() {
  return 'line-' + Math.random().toString(36).substring(2, 11);
}

const UniqueIdExtension = Extension.create({
  name: 'uniqueId',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      attributeName: 'id',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          [this.options.attributeName]: {
            default: null,
            parseHTML: element => element.getAttribute('data-id'),
            renderHTML: attributes => {
              if (!attributes[this.options.attributeName]) {
                return {};
              }
              return { 'data-id': attributes[this.options.attributeName] };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('uniqueId'),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanged = transactions.some(transaction => transaction.docChanged);
          if (!docChanged) {
            return;
          }

          const tr = newState.tr;
          let modified = false;
          const seenIds = new Set();

          newState.doc.descendants((node, pos) => {
            if (!this.options.types.includes(node.type.name)) {
              return;
            }

            const id = node.attrs[this.options.attributeName];

            if (id === null || id === undefined) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                [this.options.attributeName]: randomUUID(),
              });
              modified = true;
            } else if (seenIds.has(id)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                [this.options.attributeName]: randomUUID(),
              });
              modified = true;
            } else {
              seenIds.add(id);
            }
          });

          if (modified) {
            return tr;
          }
        },
      }),
    ];
  },
});

// Props 정의
const props = defineProps({
  initialContent: {
    type: String,
    default: '',
  },
  documentId: {
    type: String,
    required: true,
  }
});

// Emits 정의
const emit = defineEmits(['document-line-created', 'document-line-updated', 'document-line-deleted']);

// 반응형 변수 선언
const editor = ref(null);
const connectionStatus = ref('connecting'); // 'connecting' | 'connected' | 'offline'
const isUpdatingFromRemote = ref(false);
const editorContainerRef = ref(null); // 에디터 컨테이너 DOM 참조
const remoteCursorsMap = ref({}); // 다른 사용자 커서 정보 객체
const lastCursorUpdate = ref(0); // 커서 업데이트 throttle용
const savedLineIds = ref(new Set()); // "저장된" 라인 ID를 추적

const user = {
  name: 'User ' + Math.floor(Math.random() * 100),
  color: '#' + Math.floor(Math.random()*16777215).toString(16),
};

const connectionStatusClass = computed(() => ({
  'status-connecting': connectionStatus.value === 'connecting',
  'status-connected': connectionStatus.value === 'connected',
  'status-offline': connectionStatus.value === 'offline',
}));

const remoteCursors = computed(() => {
  if (!editor.value || !editor.value.view || !editorContainerRef.value) {
    return [];
  }

  const editorDom = editor.value.view.dom;
  if (!editorDom) return [];
  
  const containerRect = editorContainerRef.value.getBoundingClientRect();
  const cursors = [];

  for (const senderId in remoteCursorsMap.value) {
    const cursor = remoteCursorsMap.value[senderId];
    try {
      const maxPos = editor.value.state.doc.content.size;
      const safePos = maxPos > 1
        ? Math.min(Math.max(cursor.pos, 1), maxPos - 1)
        : 0;

      const coords = editor.value.view.coordsAtPos(safePos, -1);
      const cursorHeight = coords.bottom - coords.top;
      const relativeLeft = coords.left - containerRect.left;
      const relativeTop = coords.top - containerRect.top;

      cursors.push({
        senderId,
        user: cursor.user,
        coords: {
          left: relativeLeft,
          top: relativeTop,
        },
        height: cursorHeight,
      });
    } catch (error) {
      console.warn('Invalid cursor position:', cursor.pos, error);
    }
  }

  return cursors;
});

// 라이프사이클 훅
onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
      UniqueIdExtension,
    ],
    content: props.initialContent || '<p></p>', // 초기 콘텐츠가 비어있을 경우를 대비
    onCreate: ({ editor }) => {
      // 에디터 생성 시, 초기 콘텐츠에 포함된 모든 ID를 "저장된" 것으로 간주
      editor.state.doc.descendants((node) => {
        if (node.isBlock && node.attrs.id) {
          savedLineIds.value.add(node.attrs.id);
        }
      });
    },
    onUpdate: ({ editor, transaction }) => {
      if (isUpdatingFromRemote.value) return;

      sendStompMessage({
        destination: '/publish/editor/update',
        body: {
          type: 'UPDATE',
          documentId: props.documentId,
          senderId: user.name,
          content: editor.getJSON(),
        },
      });

      if (!transaction.docChanged) {
        return;
      }

      // "저장되지 않은" 라인을 찾아 저장 로직 실행
      let unsavedNode = null;
      editor.state.doc.descendants((node) => {
        if (unsavedNode) return; // 첫 번째 하나만 찾으면 중단
        if (node.isBlock && node.attrs.id && !savedLineIds.value.has(node.attrs.id)) {
          unsavedNode = node;
        }
      });

      if (unsavedNode) {
        const newId = unsavedNode.attrs.id;
        
        // 다시 감지되지 않도록 즉시 저장된 것으로 표시
        savedLineIds.value.add(newId);

        nextTick(() => {
          const element = document.querySelector(`[data-id="${newId}"]`);
          console.log(`[prevId Debug] Looking for element with data-id: ${newId}. Found:`, element);

          if (element) {
            const prevElement = element.previousElementSibling;
            console.log('[prevId Debug] Previous sibling element:', prevElement);

            if(prevElement) {
              console.log('[prevId Debug] Previous sibling data-id:', prevElement.getAttribute('data-id'));
            }

            const prevLineId = prevElement ? prevElement.getAttribute('data-id') : null;

            emit('document-line-created', {
              lineId: newId,
              htmlContent: element.outerHTML,
              prevLineId: prevLineId,
            });
          }
        });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (isUpdatingFromRemote.value || connectionStatus.value !== 'connected') return;
      
      const now = Date.now();
      if (now - lastCursorUpdate.value < 100) return; // 100ms throttle
      lastCursorUpdate.value = now;
      
      sendStompMessage({
        destination: '/publish/editor/cursor',
        body: {
          type: 'CURSOR_UPDATE',
          documentId: props.documentId,
          senderId: user.name,
          content: { pos: editor.state.selection.from, user },
        },
      });
    },
  });

  connectStomp(
    props.documentId,
    handleIncomingMessage, // 메시지 수신 콜백
    () => { // 연결 성공 콜백
      connectionStatus.value = 'connected';
      editor.value.setOptions({ editable: true });
    }
  );

  setTimeout(() => {
    if (connectionStatus.value === 'connecting') {
      connectionStatus.value = 'offline';
      editor.value.setOptions({ editable: false });
    }
  }, 5000);
});

onBeforeUnmount(() => {
  disconnectStomp();
  if (editor.value) {
    editor.value.destroy();
  }
});

const handleIncomingMessage = (message) => {
  if (!editor.value) return;

  if (message.type === 'UPDATE' && message.senderId !== user.name) {
    isUpdatingFromRemote.value = true;
    const { from, to } = editor.value.state.selection;
    
    editor.value.chain()
      .setContent(message.content, false)
      .setTextSelection({ from, to })
      .run();
    
    isUpdatingFromRemote.value = false;
  } else if (message.type === 'CURSOR_UPDATE' && message.senderId !== user.name) {
    remoteCursorsMap.value = {
      ...remoteCursorsMap.value,
      [message.senderId]: {
        user: message.content.user,
        pos: message.content.pos,
      }
    };
  }
};

</script>

<style>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.connection-status {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
}

.status-connecting {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-connected {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-offline {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.editor-container {
  position: relative; /* 원격 커서 위치의 기준점 */
}

.toolbar button.is-active {
  font-weight: bold;
  background-color: #eee;
}
.ProseMirror {
  border: 1px solid #ccc;
  padding: 10px;
}

/* 원격 커서 스타일 */
.remote-cursor {
  position: absolute;
  pointer-events: none;
  width: 2px;
  z-index: 10;
  transform-origin: top left;
}

.cursor-flag {
  position: absolute;
  top: -1.5em;
  left: 2px;
  color: white;
  font-size: 0.75em;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  line-height: 1.2;
}
</style>
