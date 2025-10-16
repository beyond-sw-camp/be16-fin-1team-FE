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
const emit = defineEmits(['document-line-updated', 'document-line-deleted']);

// 반응형 변수 선언
const editor = ref(null);
const connectionStatus = ref('connecting'); // 'connecting' | 'connected' | 'offline'
const isUpdatingFromRemote = ref(false);
const editorContainerRef = ref(null); // 에디터 컨테이너 DOM 참조
const remoteCursorsMap = ref({}); // 다른 사용자 커서 정보 객체
const lastCursorUpdate = ref(0); // 커서 업데이트 throttle용
const previousNodesById = ref(new Map()); // "이전 상태"를 저장

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
      // 에디터 생성 시, 초기 상태를 "이전 상태"로 저장
      editor.state.doc.descendants((node) => {
        if (node.isBlock && node.attrs.id) {
          previousNodesById.value.set(node.attrs.id, node.toJSON());
        }
      });
    },
    onUpdate: ({ editor, transaction }) => {
      if (isUpdatingFromRemote.value || !transaction.docChanged) {
        return;
      }

      // 1. 현재 상태 수집
      const currentNodes = [];
      const currentNodesById = new Map();
      editor.state.doc.descendants((node) => {
        if (node.isBlock && node.attrs.id) {
          const nodeJSON = node.toJSON();
          currentNodes.push(nodeJSON);
          currentNodesById.set(node.attrs.id, nodeJSON);
        }
      });
      
      // 2. "수정"된 라인 찾아 UPDATE 메시지 전송
      for (const [id, nodeJSON] of previousNodesById.value.entries()) {
        const currentNode = currentNodesById.get(id);
        if (currentNode && JSON.stringify(currentNode.content) !== JSON.stringify(nodeJSON.content)) {
          nextTick(() => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
              sendStompMessage({
                destination: '/publish/editor/update',
                body: {
                  messageType: 'UPDATE',
                  documentId: props.documentId,
                  senderId: user.name,
                  lineId: id,
                  content: element.outerHTML,
                },
              });
            }
          });
        }
      }

      // 3. "생성"된 라인 찾아 CREATE 메시지 전송
      for (let i = 0; i < currentNodes.length; i++) {
        const currentNode = currentNodes[i];
        const id = currentNode.attrs.id;

        if (!previousNodesById.value.has(id)) {
          const prevLineId = i > 0 ? currentNodes[i-1].attrs.id : null;
          
          nextTick(() => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
              sendStompMessage({
                destination: '/publish/editor/create',
                body: {
                  messageType: 'CREATE',
                  documentId: props.documentId,
                  senderId: user.name,
                  lineId: id,
                  prevLineId: prevLineId,
                  content: element.outerHTML,
                },
              });
            }
          });
        }
      }

      // 4. 현재 상태를 "이전 상태"로 갱신
      previousNodesById.value = currentNodesById;
    },
    onSelectionUpdate: ({ editor }) => {
      if (isUpdatingFromRemote.value || connectionStatus.value !== 'connected') return;
      
      const now = Date.now();
      if (now - lastCursorUpdate.value < 100) return; // 100ms throttle
      lastCursorUpdate.value = now;
      
      sendStompMessage({
        destination: '/publish/editor/cursor',
        body: {
          messageType: 'CURSOR_UPDATE',
          documentId: props.documentId,
          senderId: user.name,
          content: JSON.stringify({ pos: editor.state.selection.from, user }), // 객체를 문자열로 변환
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
  if (!editor.value || message.senderId === user.name) {
    return;
  }

  isUpdatingFromRemote.value = true;
  const { from, to } = editor.value.state.selection; // 현재 커서/선택 위치 저장

  if (message.messageType === 'CREATE') {
    let insertPos = 1; // 기본값: 문서 시작
    if (message.prevLineId) {
      let found = false;
      editor.value.state.doc.descendants((node, pos) => {
        if (!found && node.isBlock && node.attrs.id === message.prevLineId) {
          insertPos = pos + node.nodeSize;
          found = true;
        }
      });
      if (!found) { // 이전 노드를 못찾으면 맨 끝에 추가
        insertPos = editor.value.state.doc.content.size;
      }
    }
    editor.value.chain()
      .insertContentAt(insertPos, message.content)
      .setTextSelection({ from, to }) // 커서 위치 복원
      .run();

  } else if (message.messageType === 'UPDATE') {
    let nodeToUpdate = null;
    let nodeToUpdatePos = -1;
    editor.value.state.doc.descendants((node, pos) => {
      if (node.isBlock && node.attrs.id === message.lineId) {
        nodeToUpdate = node;
        nodeToUpdatePos = pos;
      }
    });

    if (nodeToUpdate) {
      editor.value.chain()
        .deleteRange({ from: nodeToUpdatePos, to: nodeToUpdatePos + nodeToUpdate.nodeSize })
        .insertContentAt(nodeToUpdatePos, message.content)
        .setTextSelection({ from, to }) // 커서 위치 복원
        .run();
    }

  } else if (message.messageType === 'CURSOR_UPDATE') {
    const cursorData = JSON.parse(message.content);
    remoteCursorsMap.value = {
      ...remoteCursorsMap.value,
      [message.senderId]: {
        user: cursorData.user,
        pos: cursorData.pos,
      }
    };
  }

  // isUpdatingFromRemote 플래그가 너무 빨리 해제되어 다른 로직에 영향을 주는 것을 방지
  setTimeout(() => {
    isUpdatingFromRemote.value = false;
  }, 50);
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
