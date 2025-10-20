<template>
  <v-card class="editor-wrapper" elevation="2">
    <!-- 연결 상태 표시 -->
    <v-alert
      :model-value="true"
      :type="connectionStatusType"
      :icon="connectionStatusIcon"
      density="compact"
      class="ma-2"
      variant="tonal"
    >
      {{ connectionStatusText }}
    </v-alert>

    <div v-if="editor">
      <v-toolbar density="compact" class="editor-toolbar">
        <v-btn-toggle v-model="toggleBold" variant="outlined" divided>
          <v-btn @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }">
            <v-icon>mdi-format-bold</v-icon>
          </v-btn>
        </v-btn-toggle>
        
        <v-divider vertical class="mx-2"></v-divider>

        <v-btn-toggle v-model="toggleHeading" variant="outlined" divided>
          <v-btn @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">
            <v-icon>mdi-format-header-1</v-icon>
          </v-btn>
          <v-btn @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">
            <v-icon>mdi-format-header-2</v-icon>
          </v-btn>
          <v-btn @click="editor.chain().focus().setParagraph().run()" :class="{ 'is-active': editor.isActive('paragraph') }">
            <v-icon>mdi-format-paragraph</v-icon>
          </v-btn>
        </v-btn-toggle>

        <v-divider vertical class="mx-2"></v-divider>

        <v-btn-toggle v-model="toggleAlign" variant="outlined" divided>
          <v-btn @click="editor.chain().focus().setTextAlign('left').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }">
            <v-icon>mdi-format-align-left</v-icon>
          </v-btn>
          <v-btn @click="editor.chain().focus().setTextAlign('center').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }">
            <v-icon>mdi-format-align-center</v-icon>
          </v-btn>
          <v-btn @click="editor.chain().focus().setTextAlign('right').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }">
            <v-icon>mdi-format-align-right</v-icon>
          </v-btn>
        </v-btn-toggle>

      </v-toolbar>

      <v-card-text>
        <div 
          class="editor-container" 
          ref="editorContainerRef"
        >
          <editor-content :editor="editor" />
          
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
      </v-card-text>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
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
          const duplicateIds = new Set();

          // 첫 번째 순회: 중복된 ID를 모두 찾습니다.
          newState.doc.descendants((node) => {
            if (!this.options.types.includes(node.type.name)) return;
            const id = node.attrs[this.options.attributeName];
            if (id) {
              if (seenIds.has(id)) {
                duplicateIds.add(id);
              } else {
                seenIds.add(id);
              }
            }
          });

          // 중복된 ID가 없으면, ID가 없는 노드만 처리합니다.
          if (duplicateIds.size === 0) {
            newState.doc.descendants((node, pos) => {
              if (!this.options.types.includes(node.type.name)) return;
              const id = node.attrs[this.options.attributeName];
              if (id === null || id === undefined) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  [this.options.attributeName]: randomUUID(),
                });
                modified = true;
              }
            });
          } else {
            // 두 번째 순회: 중복된 ID의 첫 번째 등장(붙여넣기된 노드)에 새 ID를 부여합니다.
            const rewrittenDuplicates = new Set();
            newState.doc.descendants((node, pos) => {
              if (!this.options.types.includes(node.type.name)) return;
              
              const id = node.attrs[this.options.attributeName];
              
              if (id && duplicateIds.has(id) && !rewrittenDuplicates.has(id)) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  [this.options.attributeName]: randomUUID(),
                });
                modified = true;
                rewrittenDuplicates.add(id);
              } else if (id === null || id === undefined) {
                // ID가 없는 노드도 처리합니다.
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  [this.options.attributeName]: randomUUID(),
                });
                modified = true;
              }
            });
          }

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
const changesQueue = ref([]);
const typingTimer = ref(null);
const batchSendInterval = ref(null);

const toggleBold = ref(null);
const toggleHeading = ref(null);
const toggleAlign = ref(null);


const user = {
  name: 'User ' + Math.floor(Math.random() * 100),
  color: '#' + Math.floor(Math.random()*16777215).toString(16),
};

const connectionStatusType = computed(() => {
  switch (connectionStatus.value) {
    case 'connecting':
      return 'info';
    case 'connected':
      return 'success';
    case 'offline':
      return 'error';
    default:
      return 'info';
  }
});

const connectionStatusIcon = computed(() => {
  switch (connectionStatus.value) {
    case 'connecting':
      return 'mdi-lan-pending';
    case 'connected':
      return 'mdi-lan-connect';
    case 'offline':
      return 'mdi-lan-disconnect';
    default:
      return 'mdi-help-circle';
  }
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connecting':
      return '🔄 서버 연결 중...';
    case 'connected':
      return '✅ 실시간 협업 활성화';
    case 'offline':
      return '⚠️ 오프라인 모드 (변경사항이 저장되지 않습니다)';
    default:
      return '알 수 없는 상태';
  }
});

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

const sendBatchChanges = () => {
  if (changesQueue.value.length === 0) {
    return;
  }

  const payload = {
    messageType: 'EDITOR_BATCH_MESSAGE',
    documentId: props.documentId,
    senderId: user.name,
    changesList: changesQueue.value,
    content: ''
  };

  sendStompMessage({
    destination: '/publish/editor/batch-update',
    body: payload,
  });

  changesQueue.value = [];
};

// 라이프사이클 훅
onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
      UniqueIdExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
    ],
    content: props.initialContent || '<p></p>', // 초기 콘텐츠가 비어있을 경우를 대비
    editorProps: {
      handleDOMEvents: {
      },
      handleDrop: (view, event, slice, moved) => {
        // 드롭 위치 계산
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!pos) { 
            return false;
        }

        // 기존 ID를 제거하여 노드를 '새로운' 노드로 만듭니다.
        // 이렇게 하면 UniqueIdExtension이 새로운 ID를 할당합니다.
        const nodesWithoutIds = [];
        slice.content.forEach(node => {
            const newNodeAttrs = { ...node.attrs };
            delete newNodeAttrs.id; 
            
            const newNode = node.type.create(newNodeAttrs, node.content, node.marks);
            nodesWithoutIds.push(newNode);
        });

        const fragment = view.state.schema.node("doc", null, nodesWithoutIds).content;
        const newSlice = new slice.constructor(fragment, slice.openStart, slice.openEnd);

        // 트랜잭션 생성
        let tr = view.state.tr;
        if (moved) {
            tr.deleteSelection();
        }
        
        const insertPos = tr.mapping.map(pos.pos);
        tr.replace(insertPos, insertPos, newSlice);
        view.dispatch(tr.scrollIntoView());

        // 우리가 드롭 이벤트를 처리했음을 알립니다.
        return true;
      }
    },
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
      
      // 2. "수정"된 라인 찾아 큐에 추가
      for (const [id, nodeJSON] of previousNodesById.value.entries()) {
        const currentNode = currentNodesById.get(id);
        if (currentNode && JSON.stringify(currentNode) !== JSON.stringify(nodeJSON)) {
          nextTick(() => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
              const cleanedHtml = element.outerHTML.replace(/<br class="ProseMirror-trailingBreak">/g, '');
              changesQueue.value.push({
                type: 'UPDATE',
                lineId: id,
                content: cleanedHtml,
              });
            }
          });
        }
      }

      // 3. "삭제"된 라인 찾아 큐에 추가
      const previousIds = Array.from(previousNodesById.value.keys());
      for (let i = 0; i < previousIds.length; i++) {
        const oldId = previousIds[i];
        if (!currentNodesById.has(oldId)) {
          const prevLineId = i > 0 ? previousIds[i - 1] : null;
          changesQueue.value.push({
            type: 'DELETE',
            lineId: oldId,
            prevLineId: prevLineId,
          });
        }
      }

      // 4. "생성"된 라인 찾아 큐에 추가
      for (let i = 0; i < currentNodes.length; i++) {
        const currentNode = currentNodes[i];
        const id = currentNode.attrs.id;

        if (!previousNodesById.value.has(id)) {
          const prevLineId = i > 0 ? currentNodes[i-1].attrs.id : null;
          
          nextTick(() => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
              const cleanedHtml = element.outerHTML.replace(/<br class="ProseMirror-trailingBreak">/g, '');
              changesQueue.value.push({
                type: 'CREATE',
                lineId: id,
                prevLineId: prevLineId,
                content: cleanedHtml,
              });
            }
          });
        }
      }

      // 5. 현재 상태를 "이전 상태"로 갱신
      previousNodesById.value = currentNodesById;

      // 6. 타이머 로직으로 묶어서 전송
      if (typingTimer.value) {
        clearTimeout(typingTimer.value);
      }

      if (!batchSendInterval.value) {
        batchSendInterval.value = setInterval(sendBatchChanges, 500);
      }

      typingTimer.value = setTimeout(() => {
        if (batchSendInterval.value) {
          clearInterval(batchSendInterval.value);
          batchSendInterval.value = null;
        }
        sendBatchChanges(); // Send any remaining changes
      }, 700);
    },
    onSelectionUpdate: ({ editor }) => {
      if (isUpdatingFromRemote.value || connectionStatus.value !== 'connected') return;
      
      const now = Date.now();
      if (now - lastCursorUpdate.value < 100) return; // 100ms throttle
      lastCursorUpdate.value = now;

      // 1. 현재 커서 위치의 lineId와 offset 계산
      const { from } = editor.state.selection;
      const resolvedPos = editor.state.doc.resolve(from);
      let cursorLineId = null;
      let cursorOffset = 0;

      for (let i = resolvedPos.depth; i > 0; i--) {
        const node = resolvedPos.node(i);
        if (node.isBlock && node.attrs.id) {
          cursorLineId = node.attrs.id;
          const nodePos = resolvedPos.start(i);
          cursorOffset = from - nodePos;
          break;
        }
      }

      // 2. 계산된 정보로 메시지 전송
      if (cursorLineId) {
        sendStompMessage({
          destination: '/publish/editor/cursor',
          body: {
            messageType: 'CURSOR_UPDATE',
            documentId: props.documentId,
            senderId: user.name,
            content: JSON.stringify({ lineId: cursorLineId, offset: cursorOffset, user }),
          },
        });
      }
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
  if (typingTimer.value) {
    clearTimeout(typingTimer.value);
  }
  if (batchSendInterval.value) {
    clearInterval(batchSendInterval.value);
  }
  sendBatchChanges(); // 컴포넌트 파괴 전 마지막으로 변경사항 전송
  disconnectStomp();
  if (editor.value) {
    editor.value.destroy();
  }
});

const applyCreate = (change) => {
  let insertPos = 1;
  if (change.prevLineId) {
    let found = false;
    editor.value.state.doc.descendants((node, pos) => {
      if (!found && node.isBlock && node.attrs.id === change.prevLineId) {
        insertPos = pos + node.nodeSize;
        found = true;
      }
    });
    if (!found) {
      insertPos = editor.value.state.doc.content.size;
    }
  }
  editor.value.chain().insertContentAt(insertPos, change.content).run();
};

const applyUpdate = (change) => {
  let nodeToUpdate = null;
  let nodeToUpdatePos = -1;
  editor.value.state.doc.descendants((node, pos) => {
    if (node.isBlock && node.attrs.id === change.lineId) {
      nodeToUpdate = node;
      nodeToUpdatePos = pos;
    }
  });

  if (nodeToUpdate) {
    editor.value.chain()
      .deleteRange({ from: nodeToUpdatePos, to: nodeToUpdatePos + nodeToUpdate.nodeSize })
      .insertContentAt(nodeToUpdatePos, change.content)
      .run();
  }
};

const applyDelete = (change) => {
  let nodeToDelete = null;
  let nodeToDeletePos = -1;
  editor.value.state.doc.descendants((node, pos) => {
    if (node.isBlock && node.attrs.id === change.lineId) {
      nodeToDelete = node;
      nodeToDeletePos = pos;
    }
  });

  if (nodeToDelete) {
    editor.value.chain()
      .deleteRange({ from: nodeToDeletePos, to: nodeToDeletePos + nodeToDelete.nodeSize })
      .run();
  }
};

const handleIncomingMessage = (message) => {
  if (!editor.value || message.senderId === user.name) {
    return;
  }

  isUpdatingFromRemote.value = true;
  
  // 1. 커서의 "상대 위치" 저장
  const { selection } = editor.value.state;
  const resolvedPos = editor.value.state.doc.resolve(selection.from);
  let anchorNodeId = null;
  let startOffset = 0;
  
  for (let i = resolvedPos.depth; i > 0; i--) {
    const node = resolvedPos.node(i);
    if (node.isBlock && node.attrs.id) {
      anchorNodeId = node.attrs.id;
      const nodePos = resolvedPos.start(i);
      startOffset = selection.from - nodePos;
      break;
    }
  }

  // 2. 메시지 종류에 따라 변경사항 적용
  if (message.messageType === 'EDITOR_BATCH_MESSAGE') {
    message.changesList.forEach(change => {
      if (change.type === 'CREATE') {
        applyCreate(change);
      } else if (change.type === 'UPDATE') {
        applyUpdate(change);
      } else if (change.type === 'DELETE') {
        applyDelete(change);
      }
    });
  } else if (message.messageType === 'CREATE') {
    applyCreate(message);
  } else if (message.messageType === 'UPDATE') {
    applyUpdate(message);
  } else if (message.messageType === 'DELETE') {
    applyDelete(message);
  } else if (message.messageType === 'CURSOR_UPDATE') {
    const cursorData = JSON.parse(message.content);
    
    // 1. lineId를 기반으로 절대 위치(pos) 계산
    let absolutePos = -1;
    editor.value.state.doc.descendants((node, pos) => {
      if (absolutePos === -1 && node.isBlock && node.attrs.id === cursorData.lineId) {
        absolutePos = pos + cursorData.offset;
      }
    });

    // 2. 계산된 위치에 커서 정보 업데이트
    if (absolutePos !== -1) {
      remoteCursorsMap.value = {
        ...remoteCursorsMap.value,
        [message.senderId]: {
          user: cursorData.user,
          pos: absolutePos,
        }
      };
    }
  }

  // 3. "상대 위치"를 기반으로 커서 위치 복원
  if (anchorNodeId && (message.messageType === 'CREATE' || message.messageType === 'UPDATE' || message.messageType === 'EDITOR_BATCH_MESSAGE')) {
    let newAnchorPos = -1;
    editor.value.state.doc.descendants((node, pos) => {
        if (newAnchorPos === -1 && node.isBlock && node.attrs.id === anchorNodeId) {
            newAnchorPos = pos;
        }
    });

    if (newAnchorPos !== -1) {
        const node = editor.value.state.doc.nodeAt(newAnchorPos);
        const newAbsolutePos = newAnchorPos + startOffset;
        const finalPos = Math.max(newAnchorPos + 1, Math.min(newAbsolutePos, newAnchorPos + node.nodeSize -1));
        editor.value.commands.setTextSelection(finalPos);
    }
  }

  setTimeout(() => {
    isUpdatingFromRemote.value = false;
  }, 50);
};

</script>

<style>
.editor-wrapper {
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  border-bottom: 1px solid #e0e0e0;
}

.v-btn.is-active {
  background-color: rgba(0, 0, 0, 0.1);
}

.editor-container {
  position: relative;
  padding: 1rem;
}

.ProseMirror {
  outline: none;
  height: 100%;
}

.ProseMirror-focused {
  outline: none;
}

/* 원격 커서 스타일 */
.remote-cursor {
  position: absolute;
  pointer-events: none;
  width: 2px;
  z-index: 10;
  transform-origin: top left;
  transition: transform 0.1s linear;
}

.cursor-flag {
  position: absolute;
  top: -1.6em;
  left: -2px;
  color: white;
  font-size: 0.8em;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  line-height: 1.3;
  transition: background-color 0.3s ease;
}
</style>
