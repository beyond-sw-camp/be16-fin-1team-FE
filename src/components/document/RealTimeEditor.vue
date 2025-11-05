<template>
  <v-card class="editor-wrapper" elevation="2">
    <!-- 연결 상태 표시 -->
    <v-alert
      v-if="showConnectionStatus"
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

        <v-divider vertical class="mx-2"></v-divider>

        <v-btn-toggle v-model="toggleColor" variant="outlined" divided>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" :class="{ 'is-active': editor.isActive('textStyle') || editor.isActive('highlight') }">
                <v-icon>mdi-format-color-text</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <div class="color-picker-container">
                  <h4>텍스트 색상</h4>
                  <div class="color-grid">
                    <div 
                      v-for="color in textColors" 
                      :key="color"
                      class="color-option"
                      :style="{ backgroundColor: color }"
                      @click="setTextColor(color)"
                      :class="{ 'selected': editor.getAttributes('textStyle').color === color }"
                    ></div>
                  </div>
                  
                  <h4>배경 색상</h4>
                  <div class="color-grid">
                    <div 
                      v-for="color in backgroundColors" 
                      :key="color"
                      class="color-option"
                      :style="{ backgroundColor: color }"
                      @click="setBackgroundColor(color)"
                      :class="{ 'selected': editor.getAttributes('highlight').color === color }"
                    ></div>
                  </div>
                  
                  <v-btn 
                    variant="outlined" 
                    size="small" 
                    @click="clearColors"
                    class="mt-2"
                  >
                    색상 제거
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-btn-toggle>

        <v-divider vertical class="mx-2"></v-divider>

        <!-- 폰트 사이즈 선택 -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="outlined">
              <v-icon>mdi-format-size</v-icon>
              <span class="ml-1">{{ getCurrentFontSize() }}</span>
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <div class="font-size-picker">
                <h4>폰트 사이즈</h4>
                <div class="font-size-options">
                  <v-btn
                    v-for="size in fontSizes"
                    :key="size"
                    :variant="editor.getAttributes('textStyle').fontSize === size ? 'flat' : 'outlined'"
                    size="small"
                    @click="setFontSize(size)"
                    class="font-size-btn"
                  >
                    {{ size }}
                  </v-btn>
                </div>
                <v-btn 
                  variant="outlined" 
                  size="small" 
                  @click="clearFontSize"
                  class="mt-2"
                >
                  기본 크기
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>

        <v-divider vertical class="mx-2"></v-divider>

        <!-- 기타 스타일 버튼들 -->
        <v-btn-toggle v-model="toggleStyles" variant="outlined" divided>
          <v-btn @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }">
            <v-icon>mdi-format-underline</v-icon>
          </v-btn>
          <v-btn @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }">
            <v-icon>mdi-format-strikethrough</v-icon>
          </v-btn>
        </v-btn-toggle>

        <v-divider vertical class="mx-2"></v-divider>

        <!-- 이모지/기호 삽입 -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="outlined" title="이모지/기호">
              <v-icon>mdi-emoticon-outline</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <div class="emoji-picker">
                <h4>이모지</h4>
                <div class="emoji-grid">
                  <button
                    v-for="e in emojiList"
                    :key="e"
                    class="emoji-item"
                    @click="insertEmoji(e)"
                  >{{ e }}</button>
                </div>

                <h4 class="mt-3">기호</h4>
                <div class="emoji-grid">
                  <button
                    v-for="s in symbolList"
                    :key="s"
                    class="emoji-item"
                    @click="insertEmoji(s)"
                  >{{ s }}</button>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>

        <v-spacer></v-spacer>

        <div class="online-users-container">
          <v-tooltip
            v-for="onlineUser in onlineUsers"
            :key="onlineUser.userId"
            location="bottom"
          >
            <template v-slot:activator="{ props }">
              <v-avatar
                v-bind="props"
                :color="onlineUser.profileImage ? 'transparent' : onlineUser.color"
                size="32"
                class="user-avatar"
              >
                <v-img v-if="onlineUser.profileImage" :src="onlineUser.profileImage" />
                <span v-else class="white--text text-h6">{{ onlineUser.userName ? onlineUser.userName.charAt(0).toUpperCase() : 'U' }}</span>
              </v-avatar>
            </template>
            <span>{{ onlineUser.userName || onlineUser.userId }}</span>
          </v-tooltip>
        </div>

      </v-toolbar>

      <v-card-text>
        <div 
          class="editor-container" 
          ref="editorContainerRef"
        >
          <div
            v-for="highlight in remoteSelectionHighlights"
            :key="highlight.key"
            :style="highlight.style"
            class="remote-selection-highlight"
          ></div>

          <editor-content :editor="editor" />
          
          <div
            v-for="cursor in remoteCursors"
            :key="cursor.senderId"
            class="remote-cursor"
            :style="{
              top: `${cursor.coords.top}px`,
              left: `${cursor.coords.left}px`,
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
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { DOMSerializer } from 'prosemirror-model';
import { Decoration, DecorationSet } from 'prosemirror-view';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import axios from 'axios';
import { connectStomp, sendStompMessage, disconnectStomp } from '../../services/editorStompService';

function generateUniqueId(userId) {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  // 사용자 ID, 타임스탬프, 랜덤 문자열을 조합하여 고유성을 크게 높임
  return `line-${userId}-${timestamp}-${randomPart}`;
}

// 폰트 사이즈 확장
const FontSizeExtension = Extension.create({
  name: 'fontSize',
  
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace('px', ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },
});

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
                   [this.options.attributeName]: generateUniqueId(user.name),
                 });
                 modified = true;
               }
             });
           } else {
             // 중복된 ID가 있는 경우: 문서 순서상 나중에 등장하는 노드(붙여넣기된 노드)에 새 ID를 부여
             const processedIds = new Set();
             newState.doc.descendants((node, pos) => {
               if (!this.options.types.includes(node.type.name)) return;
               
               const id = node.attrs[this.options.attributeName];
               
               if (id && duplicateIds.has(id)) {
                 // 이미 처리된 ID가 아닌 경우 (첫 번째 등장은 유지, 두 번째부터 변경)
                 if (!processedIds.has(id)) {
                   processedIds.add(id);
                   // 첫 번째 등장은 원본 ID 유지
                 } else {
                   // 두 번째 등장부터는 새 ID 부여 (붙여넣기된 노드)
                   tr.setNodeMarkup(pos, undefined, {
                     ...node.attrs,
                     [this.options.attributeName]: generateUniqueId(user.name),
                   });
                   modified = true;
                 }
               } else if (id === null || id === undefined) {
                 // ID가 없는 노드도 처리합니다.
                 tr.setNodeMarkup(pos, undefined, {
                   ...node.attrs,
                   [this.options.attributeName]: generateUniqueId(user.name),
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

const LineLockingExtension = Extension.create({
  name: 'lineLocking',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('lineLocking'),
        props: {
          decorations(state) {
            const decorations = [];
            const lockedLinesValue = lockedLines.value; 
            if (!lockedLinesValue) return DecorationSet.empty;
            
            state.doc.descendants((node, pos) => {
              if (node.isBlock && node.attrs.id) {
                const isLocked = lockedLinesValue.has(node.attrs.id);
                if (isLocked) {
                  const lockingUser = lockedLinesValue.get(node.attrs.id);
                  if (lockingUser !== user.name) {
                    decorations.push(
                      Decoration.node(pos, pos + node.nodeSize, {
                        class: 'locked-line',
                      })
                    );
                  }
                }
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
        filterTransaction: (transaction, state) => {
          // 원격 업데이트는 항상 허용
          if (isUpdatingFromRemote.value) {
            return true;
          }

          if (!transaction.docChanged) {
            return true;
          }

          let isAllowed = true;
          const lockedLinesValue = lockedLines.value;

          transaction.steps.forEach(step => {
            step.getMap().forEach((oldStart, oldEnd) => {
              state.doc.nodesBetween(oldStart, oldEnd, (node, pos) => {
                if (node.isBlock && node.attrs.id) {
                  if (lockedLinesValue.has(node.attrs.id)) {
                    const lockingUser = lockedLinesValue.get(node.attrs.id);
                    if (lockingUser !== user.name) {
                      isAllowed = false;
                    }
                  }
                }
              });
            });
          });

          return isAllowed;
        }
      })
    ];
  }
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
  },
  initialLockedLines: {
    type: Object, // Map is passed as an object
    default: () => new Map(),
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: '사용자',
  },
  profileImage: {
    type: String,
    default: '',
  },
  showConnectionStatus: {
    type: Boolean,
    default: true,
  },
});

// Emits 정의
const emit = defineEmits(['document-line-updated', 'document-line-deleted', 'online-users-updated', 'connection-status-changed']);

// 반응형 변수 선언
const editor = ref(null);
const connectionStatus = ref('connecting'); // 'connecting' | 'connected' | 'offline'
const isUpdatingFromRemote = ref(false);
const editorContainerRef = ref(null); // 에디터 컨테이너 DOM 참조
const remoteCursorsMap = ref({}); // 다른 사용자 커서 정보 객체
const lastCursorUpdate = ref(0); // 커서 업데이트 throttle용
const previousNodesById = ref(new Map()); // "이전 상태"를 저장
const changesQueue = ref([]);
const typingTimer = ref(null); // 타이핑 감지 타이머
const currentSelectionIds = ref(new Set()); // 현재 내가 선택한 라인 ID 목록
const lockedLines = ref(new Map()); // 잠긴 라인 목록 {lineId: userId}
const onlineUsers = ref([]); // 온라인 사용자 목록

const toggleBold = ref(null);
const toggleHeading = ref(null);
const toggleAlign = ref(null);
const toggleColor = ref(null);
const toggleStyles = ref(null);

// 색상 옵션들
const textColors = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#008000', '#FFC0CB', '#A52A2A', '#808080', '#FFFFFF'
];

const backgroundColors = [
  '#FFFFFF', '#FFFF00', '#FFA500', '#FF0000', '#00FF00', '#0000FF', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#000000', '#F0F0F0', '#E6E6FA', '#FFE4E1'
];

// 폰트 사이즈 옵션들
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];


const user = {
  id: props.userId,
  name: props.userName,
  color: '#' + Math.floor(Math.random() * 16777215).toString(16),
};

// --- 유틸리티 함수 ---
const userColors = {};
const availableColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7D842', '#8A63D2', '#F29E4C'];

const getUserColor = (userId) => {
  if (!userColors[userId]) {
    userColors[userId] = availableColors[Object.keys(userColors).length % availableColors.length];
  }
  return userColors[userId];
};

// 이모지/기호 간단 목록
const emojiList = [
  '😀','😂','😊','😍','😎','🥳','😇','🙌','👍','🙏',
  '💡','🔥','✨','💯','✅','❗','❓','📝','📎','📌'
];
const symbolList = [
  '•','–','—','→','⇒','⇨','✓','✗','★','☆','■','□','▲','△','◆','◇','™','©','®','§'
];

const insertEmoji = (ch) => {
  if (!editor.value) return;
  editor.value.chain().focus().insertContent(ch).run();
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
    const remoteUser = remoteCursorsMap.value[senderId];
    if (!remoteUser.selections || remoteUser.selections.length === 0) continue;

    // Use the start of the first selection for the cursor position
    const firstSelection = remoteUser.selections[0];

    try {
      let nodePos = -1;
      editor.value.state.doc.descendants((node, pos) => {
        if (nodePos !== -1) return false;
        if (node.isBlock && node.attrs.id === firstSelection.lineId) {
          nodePos = pos;
        }
      });
      if (nodePos === -1) continue;

      const node = editor.value.state.doc.nodeAt(nodePos);
      if (!node) continue;

      const safeOffset = Math.min(firstSelection.startOffset, node.content.size);
      const absolutePos = nodePos + 1 + safeOffset;

      const maxPos = editor.value.state.doc.content.size;
      const safePos = maxPos > 1
        ? Math.min(Math.max(absolutePos, 1), maxPos - 1)
        : 0;

      const coords = editor.value.view.coordsAtPos(safePos, -1);
      const cursorHeight = coords.bottom - coords.top;
      const relativeLeft = coords.left - containerRect.left;
      const relativeTop = coords.top - containerRect.top;

      cursors.push({
        senderId,
        user: remoteUser.user,
        coords: {
          left: relativeLeft,
          top: relativeTop,
        },
        height: cursorHeight,
      });
    } catch (error) {
      // console.warn('Error calculating remote cursor position:', error);
    }
  }

  return cursors;
});

const remoteSelectionHighlights = computed(() => {
  if (!editor.value || !editor.value.view || !editorContainerRef.value) {
    return [];
  }
  const containerRect = editorContainerRef.value.getBoundingClientRect();
  const highlights = [];

  for (const senderId in remoteCursorsMap.value) {
    const remoteUser = remoteCursorsMap.value[senderId];
    if (!remoteUser.selections) continue;

    const userColor = remoteUser.user.color;

    remoteUser.selections.forEach((selection, index) => {
      let nodeWithPos = null;
      editor.value.state.doc.descendants((node, pos) => {
        if (nodeWithPos) return false;
        if (node.isBlock && node.attrs.id === selection.lineId) {
          nodeWithPos = { node, pos };
        }
      });

      if (!nodeWithPos) return;

      const { node: selectedNode, pos: nodePos } = nodeWithPos;
      
      const contentStartPos = nodePos + 1;
      const contentEndPos = contentStartPos + selectedNode.content.size;

      const from = Math.max(nodePos + selection.startOffset, contentStartPos);
      const to = Math.min(nodePos + selection.endOffset, contentEndPos);

      if (from >= to) return;

      try {
        const fromDom = editor.value.view.domAtPos(from);
        const toDom = editor.value.view.domAtPos(to);
        const range = document.createRange();
        range.setStart(fromDom.node, fromDom.offset);
        range.setEnd(toDom.node, toDom.offset);

        const rects = range.getClientRects();
        for (let i = 0; i < rects.length; i++) {
          const rect = rects[i];
          highlights.push({
            key: `${senderId}-${selection.lineId}-${index}-${i}`,
            style: {
              position: 'absolute',
              left: `${rect.left - containerRect.left}px`,
              top: `${rect.top - containerRect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              backgroundColor: userColor,
            }
          });
        }
      } catch (error) {
        // console.warn('Could not calculate selection highlight rects', error);
      }
    });
  }
  return highlights;
});

// 온라인 사용자 목록 가져오기
const fetchOnlineUsers = async () => {
  try {
    const response = await axios.get(`http://localhost:8080/drive-service/documentLine/document/${props.documentId}/online-users`);
    if (response.data && response.data.result) {
      onlineUsers.value = response.data.result.map(user => ({
        userId: user.userId,
        userName: user.userName || user.userId, // userName이 없으면 userId 사용
        profileImage: user.profileImage || '', // profileImage 추가
        color: getUserColor(user.userId)
      }));
    }
  } catch (error) {
    console.error('온라인 사용자 목록을 가져오는 데 실패했습니다:', error);
  }
};


const sendBatchChanges = () => {
  if (changesQueue.value.length === 0) {
    return;
  }

  const payload = {
    messageType: 'EDITOR_BATCH_MESSAGE',
    documentId: props.documentId,
    senderId: user.id,
    changesList: changesQueue.value,
    content: ''
  };

  sendStompMessage({
    destination: '/publish/editor/batch-update',
    body: payload,
  });

  changesQueue.value = [];
};

// 색상 관련 함수들
const setTextColor = (color) => {
  if (editor.value) {
    editor.value.chain().focus().setColor(color).run();
  }
};

const setBackgroundColor = (color) => {
  if (editor.value) {
    editor.value.chain().focus().setHighlight({ color: color }).run();
  }
};

const clearColors = () => {
  if (editor.value) {
    editor.value.chain().focus().unsetColor().unsetHighlight().run();
  }
};

// 폰트 사이즈 관련 함수들
const getCurrentFontSize = () => {
  if (!editor.value) return '16';
  const fontSize = editor.value.getAttributes('textStyle').fontSize;
  return fontSize || '16';
};

const setFontSize = (size) => {
  if (editor.value) {
    editor.value.chain().focus().setMark('textStyle', { fontSize: size }).run();
  }
};

const clearFontSize = () => {
  if (editor.value) {
    editor.value.chain().focus().unsetMark('textStyle').run();
  }
};

// 페이지 visibility 변경 감지 함수
const handleVisibilityChange = () => {
  if (document.hidden && connectionStatus.value === 'connected' && currentSelectionIds.value.size > 0) {
    // 페이지가 숨겨질 때 (탭 전환, 최소화 등) 모든 잠긴 라인 해제
    const linesToRelease = [...currentSelectionIds.value];
    
    // 로컬에서 먼저 잠금 해제
    linesToRelease.forEach(lineId => {
      if (lockedLines.value.get(lineId) === user.name) {
        lockedLines.value.delete(lineId);
      }
    });
    
    // 서버에 잠금 해제 요청 전송
    const changesList = linesToRelease.map(lineId => ({ lineId }));
    sendStompMessage({
      destination: '/publish/editor/unlock-line',
      body: {
        messageType: 'UNLOCK_LINE',
        documentId: props.documentId,
        senderId: user.id,
        changesList: changesList,
        content: '',
      },
    });
    
    // 현재 선택 상태 초기화
    currentSelectionIds.value = new Set();
    lockedLines.value = new Map(lockedLines.value);
    
    if (editor.value) {
      editor.value.view.dispatch(editor.value.state.tr);
    }
  }
};

// 온라인 사용자 변경 감지
watch(onlineUsers, (newUsers) => {
  emit('online-users-updated', newUsers);
}, { deep: true });

// 연결 상태 변경 감지
watch(connectionStatus, (newVal) => {
  try { emit('connection-status-changed', newVal); } catch (_) {}
});

// 부모에서 사용할 수 있도록 undo/redo 및 가능 여부 노출
const undo = () => { try { if (editor.value) editor.value.chain().focus().undo().run(); } catch(_) {} };
const redo = () => { try { if (editor.value) editor.value.chain().focus().redo().run(); } catch(_) {} };
const canUndo = () => { try { return !!editor.value && editor.value.can().undo(); } catch(_) { return false; } };
const canRedo = () => { try { return !!editor.value && editor.value.can().redo(); } catch(_) { return false; } };

// 현재 문서를 HTML로 내보내기
const getHtml = () => {
  try { return editor.value ? editor.value.getHTML() : ''; } catch (_) { return ''; }
};

defineExpose({ undo, redo, canUndo, canRedo, getHtml });

// 라이프사이클 훅
onMounted(async () => {
  // 온라인 사용자 목록을 먼저 가져옵니다.
  await fetchOnlineUsers();
  
  // Visibility API 이벤트 리스너 등록
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 자기 자신을 온라인 사용자 목록에 추가합니다.
  if (!onlineUsers.value.some(u => u.userId === user.id)) {
    onlineUsers.value.unshift({
      userId: user.id,
      userName: user.name,
      profileImage: props.profileImage || '',
      color: getUserColor(user.id)
    });
  }

  // 전달받은 prop으로 초기 잠금 상태를 설정합니다.
  if (props.initialLockedLines) {
    lockedLines.value = new Map(props.initialLockedLines);
  }

  editor.value = new Editor({
    extensions: [
      StarterKit,
      UniqueIdExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      FontFamily,
      FontSizeExtension,
      LineLockingExtension,
    ],
    content: props.initialContent || '<p></p>', // 초기 콘텐츠가 비어있을 경우를 대비
    editorProps: {
      handleDOMEvents: {
        blur: (view, event) => {
          // 에디터가 포커스를 잃을 때 모든 잠긴 라인 해제
          if (connectionStatus.value === 'connected' && currentSelectionIds.value.size > 0) {
            const linesToRelease = [...currentSelectionIds.value];
            
            // 로컬에서 먼저 잠금 해제 (Optimistic Unlock)
            linesToRelease.forEach(lineId => {
              if (lockedLines.value.get(lineId) === user.name) {
                lockedLines.value.delete(lineId);
              }
            });
            
            // 서버에 잠금 해제 요청 전송
            const changesList = linesToRelease.map(lineId => ({ lineId }));
            sendStompMessage({
              destination: '/publish/editor/unlock-line',
              body: {
                messageType: 'UNLOCK_LINE',
                documentId: props.documentId,
                senderId: user.id,
                changesList: changesList,
                content: '',
              },
            });
            
            // 현재 선택 상태 초기화
            currentSelectionIds.value = new Set();
            lockedLines.value = new Map(lockedLines.value);
            
            // UI 갱신
            if (editor.value) {
              editor.value.view.dispatch(editor.value.state.tr);
            }
          }
          return false;
        },
      },
      handleDrop: (view, event, slice, moved) => {
        // 드롭 위치 계산
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!pos) { 
            return false;
        }

        // 드롭 대상이 잠긴 라인인지 확인
        const resolvedPos = view.state.doc.resolve(pos.pos);
        let targetNode = null;
        for (let i = resolvedPos.depth; i > 0; i--) {
          const node = resolvedPos.node(i);
          if (node.isBlock && node.attrs.id) {
            targetNode = node;
            break;
          }
        }

        if (targetNode) {
          const lockingUser = lockedLines.value.get(targetNode.attrs.id);
          if (lockingUser && lockingUser !== user.name) {
            // 다른 사용자가 잠근 라인이므로 드롭을 막습니다.
            return true;
          }
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
          previousNodesById.value.set(node.attrs.id, {
            json: node.toJSON(),
            node,
          });
        }
      });
    },
    onUpdate: ({ editor, transaction }) => {
      if (isUpdatingFromRemote.value || !transaction.docChanged) {
        return;
      }

      const serializer = DOMSerializer.fromSchema(editor.state.schema);

      // 1. 현재 상태 수집
      const currentNodesById = new Map();
      editor.state.doc.descendants((node) => {
        if (node.isBlock && node.attrs.id) {
          currentNodesById.set(node.attrs.id, { 
            json: node.toJSON(), 
            node: node 
          });
        }
      });
      
      // 2. "수정"된 라인 찾아 큐에 추가
      const allChanges = [];
      for (const [id, prevNodeData] of previousNodesById.value.entries()) {
        const currentNodeData = currentNodesById.get(id);
        if (currentNodeData && JSON.stringify(currentNodeData.json) !== JSON.stringify(prevNodeData.json)) {
          const domNode = serializer.serializeNode(currentNodeData.node);
          const wrapper = document.createElement('div');
          wrapper.appendChild(domNode);
          const content = wrapper.innerHTML.replace(/<br class="ProseMirror-trailingBreak">/g, '');

          allChanges.push({
            type: 'UPDATE',
            lineId: id,
            content: content,
          });
        }
      }

      // 3. "삭제"된 라인 찾아 큐에 추가 (앞에서부터 순서대로)
      const previousIds = Array.from(previousNodesById.value.keys());
      const deletedChanges = [];
      
      for (let i = 0; i < previousIds.length; i++) {
        const oldId = previousIds[i];
        if (!currentNodesById.has(oldId)) {
          const prevLineId = i > 0 ? previousIds[i - 1] : null;
          deletedChanges.push({
            type: 'DELETE',
            lineId: oldId,
            prevLineId: prevLineId,
          });
        }
      }
      
      // 삭제된 변경사항을 앞에서부터 순서대로 추가
      allChanges.push(...deletedChanges);

      // 4. "생성"된 라인 찾아 큐에 추가
      const currentNodes = Array.from(currentNodesById.values());
      for (let i = 0; i < currentNodes.length; i++) {
        const currentNodeData = currentNodes[i];
        const id = currentNodeData.json.attrs.id;

        if (!previousNodesById.value.has(id)) {
          const prevLineId = i > 0 ? currentNodes[i-1].json.attrs.id : null;
          
          const domNode = serializer.serializeNode(currentNodeData.node);
          const wrapper = document.createElement('div');
          wrapper.appendChild(domNode);
          const content = wrapper.innerHTML.replace(/<br class="ProseMirror-trailingBreak">/g, '');

          allChanges.push({
            type: 'CREATE',
            lineId: id,
            prevLineId: prevLineId,
            content: content,
          });
        }
      }

      // 5. 현재 상태를 "이전 상태"로 갱신
      previousNodesById.value = currentNodesById;

      // 변경사항을 '즉시 전송'과 '지연 전송'으로 분리
      const immediateChanges = [];
      const debouncedChanges = [];

      allChanges.forEach(change => {
        if (change.type === 'CREATE' || change.type === 'DELETE') {
          immediateChanges.push(change);
        } else {
          debouncedChanges.push(change);
        }
      });

      // '생성', '삭제' 변경사항은 즉시 전송
      if (immediateChanges.length > 0) {
        const payload = {
          messageType: 'EDITOR_BATCH_MESSAGE',
          documentId: props.documentId,
          senderId: user.id,
          changesList: immediateChanges,
          content: ''
        };
        sendStompMessage({
          destination: '/publish/editor/batch-update',
          body: payload,
        });
      }

      // '수정' 변경사항은 지능적으로 디바운싱하여 전송
      if (debouncedChanges.length > 0) {
        // 큐에 추가하기 전, 같은 lineId를 가진 기존 UPDATE 작업을 제거하고 최신으로 덮어씀
        debouncedChanges.forEach(change => {
          const index = changesQueue.value.findIndex(c => c.lineId === change.lineId);
          if (index !== -1) {
            changesQueue.value.splice(index, 1);
          }
          changesQueue.value.push(change);
        });

        if (typingTimer.value) {
          clearTimeout(typingTimer.value);
        }
        typingTimer.value = setTimeout(() => {
          if (changesQueue.value.length > 0) {
            sendBatchChanges();
          }
        }, 250); // 충돌 방지를 위해 지연시간을 250ms로 약간 늘립니다.
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (isUpdatingFromRemote.value || connectionStatus.value !== 'connected') return;

      // --- 잠금 로직 (서버 중재 모델) ---
      const { from, to } = editor.state.selection;
      
      // 1. 현재 선택된 모든 라인의 ID를 수집
      const newSelectionIds = new Set();
      editor.state.doc.nodesBetween(from, to, (node) => {
        if (node.isBlock && node.attrs.id) {
          newSelectionIds.add(node.attrs.id);
        }
      });
      
      // 2. 이전에 선택했던 라인과 비교하여 잠금 해제/요청할 라인 식별
      const oldSelectionIds = currentSelectionIds.value;
      const linesToRelease = [...oldSelectionIds].filter(id => !newSelectionIds.has(id));
      const linesToRequest = [...newSelectionIds].filter(id => !oldSelectionIds.has(id));

      // 3. 잠금 해제 요청 전송
      if (linesToRelease.length > 0) {
        // UI 반응성을 위해 내가 잠근 라인은 로컬에서 먼저 해제 (Optimistic Unlock)
        linesToRelease.forEach(lineId => {
          if (lockedLines.value.get(lineId) === user.name) {
            lockedLines.value.delete(lineId);
          }
        });

        const changesList = linesToRelease.map(lineId => ({ lineId }));
        sendStompMessage({
          destination: '/publish/editor/unlock-line',
          body: {
            messageType: 'UNLOCK_LINE',
            documentId: props.documentId,
            senderId: user.id,
            changesList: changesList,
            content: '',
          },
        });
      }

      // 4. 잠금 요청 전송 (개별 메시지 유지)
      if (linesToRequest.length > 0) {
        linesToRequest.forEach(lineId => {
          sendStompMessage({
            destination: '/publish/editor/lock-line',
            body: {
              messageType: 'LOCK_LINE',
              documentId: props.documentId,
              senderId: user.id,
              content: JSON.stringify({ lineId }),
            },
          });
        });
      }
      
      // 5. 현재 선택 상태를 업데이트하고, UI 갱신
      if (linesToRelease.length > 0 || linesToRequest.length > 0) {
        currentSelectionIds.value = newSelectionIds;
        lockedLines.value = new Map(lockedLines.value); // reactivity for optimistic unlock
        if (editor.value) {
          editor.value.view.dispatch(editor.value.state.tr);
        }
      }

      // --- 커서 위치 전송 로직 (100ms 지연 적용) ---
      const now = Date.now();
      if (now - lastCursorUpdate.value < 100) return;
      lastCursorUpdate.value = now;

      // 현재 커서 및 선택 영역 정보 계산
      const selections = [];
      if (from !== to) { // 드래그 선택
        editor.state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.isBlock && node.attrs.id) {
            const nodeStart = pos;
            const nodeEnd = pos + node.nodeSize;
            const selectionStartInNode = Math.max(from, nodeStart);
            const selectionEndInNode = Math.min(to, nodeEnd);
            selections.push({
              lineId: node.attrs.id,
              startOffset: selectionStartInNode - nodeStart,
              endOffset: selectionEndInNode - nodeStart,
            });
          }
        });
      } else { // 단순 커서
        const resolvedPos = editor.state.doc.resolve(from);
        for (let i = resolvedPos.depth; i > 0; i--) {
          const node = resolvedPos.node(i);
          if (node.isBlock && node.attrs.id) {
            const nodePos = resolvedPos.start(i);
            const offset = from - (nodePos + 1);
            selections.push({
              lineId: node.attrs.id,
              startOffset: offset + 1,
              endOffset: offset + 1,
            });
            break;
          }
        }
      }

      // 커서 정보 메시지 전송
      if (selections.length > 0) {
        sendStompMessage({
          destination: '/publish/editor/cursor',
          body: {
            messageType: 'CURSOR_UPDATE',
            documentId: props.documentId,
            senderId: user.id,
            content: JSON.stringify({ selections, user }),
          },
        });
      }
    },
  });

  connectStomp(
    props.documentId,
    user.id,
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
  sendBatchChanges(); // 컴포넌트 파괴 전 마지막으로 변경사항 전송
  
  // Visibility API 이벤트 리스너 제거
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  // disconnectStomp(props.documentId, user.name);
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
  
  // 문서 순서대로 앞에서부터 찾기
  editor.value.state.doc.descendants((node, pos) => {
    if (node.isBlock && node.attrs.id === change.lineId) {
      // 첫 번째로 찾은 노드만 삭제 (앞에서부터)
      if (nodeToDelete === null) {
        nodeToDelete = node;
        nodeToDeletePos = pos;
      }
    }
  });

  if (nodeToDelete) {
    editor.value.chain()
      .deleteRange({ from: nodeToDeletePos, to: nodeToDeletePos + nodeToDelete.nodeSize })
      .run();
  }
};

const handleIncomingMessage = (message) => {
  if (!editor.value || message.senderId === user.id) {
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
      startOffset = selection.from - (nodePos + 1);
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
    
    // 1. 수신된 선택 정보(selections)의 첫 번째 항목을 사용하여 커서 위치를 계산합니다.
    // 현재는 선택 영역의 시작점에 커서를 표시합니다.
    const firstSelection = cursorData.selections[0];
    let absolutePos = -1;

    editor.value.state.doc.descendants((node, pos) => {
      if (absolutePos === -1 && node.isBlock && node.attrs.id === firstSelection.lineId) {
        // 원격 커서의 offset이 현재 라인의 콘텐츠 길이를 넘지 않도록 보정합니다.
        // 이렇게 하면 다른 사용자가 라인을 수정했을 때 커서가 잘못된 위치에 표시되는 것을 방지합니다.
        const safeOffset = Math.min(firstSelection.startOffset, node.content.size);
        absolutePos = pos + 1 + safeOffset;
      }
    });

    // 2. 계산된 위치에 커서 정보 업데이트
    if (absolutePos !== -1) {
      remoteCursorsMap.value = {
        ...remoteCursorsMap.value,
        [message.senderId]: {
          user: cursorData.user,
          selections: cursorData.selections,
        }
      };
    }
  } else if (message.messageType === 'LOCK_LINE') {
    const lockData = JSON.parse(message.content);
    const { lineId } = lockData;
    const { senderId } = message;
    
    // 서버가 브로드캐스트한 메시지를 수신하여 잠금 상태를 업데이트합니다.
    // 서버가 이미 중재했으므로, 클라이언트는 이 메시지를 신뢰합니다.
    lockedLines.value.set(lineId, senderId);
    lockedLines.value = new Map(lockedLines.value); // reactivity
    if (editor.value) {
      editor.value.view.dispatch(editor.value.state.tr);
    }
  } else if (message.messageType === 'UNLOCK_LINE') {
    const { changesList } = message;
    let changed = false;
    if (changesList && Array.isArray(changesList)) {
      changesList.forEach(change => {
        const { lineId } = change;
        if (lineId && lockedLines.value.has(lineId)) {
          lockedLines.value.delete(lineId);
          changed = true;
        }
      });
    }
    if (changed) {
      lockedLines.value = new Map(lockedLines.value);
      if (editor.value) {
        editor.value.view.dispatch(editor.value.state.tr);
      }
    }
  } else if (message.messageType === 'JOIN') {
    const joiningUser = {
      userId: message.senderId,
      userName: message.senderName || message.senderId,
      profileImage: message.profileImage || '',
      color: getUserColor(message.senderId),
    };
    // 중복 추가 방지
    if (!onlineUsers.value.some(u => u.userId === joiningUser.userId)) {
      onlineUsers.value.push(joiningUser);
    }
  } else if (message.messageType === 'LEAVE') {
    const leavingUserId = message.senderId;
    
    // 온라인 사용자 목록에서 제거
    onlineUsers.value = onlineUsers.value.filter(u => u.userId !== leavingUserId);

    let changed = false;

    // 떠난 사용자가 잠근 라인을 모두 해제합니다.
    for (const [lineId, userId] of lockedLines.value.entries()) {
      if (userId === leavingUserId) {
        lockedLines.value.delete(lineId);
        changed = true;
      }
    }
    if (changed) {
      lockedLines.value = new Map(lockedLines.value);
      if (editor.value) {
        editor.value.view.dispatch(editor.value.state.tr);
      }
    }

    // 떠난 사용자의 커서 정보를 삭제합니다.
    if (remoteCursorsMap.value[leavingUserId]) {
      delete remoteCursorsMap.value[leavingUserId];
      // Vue의 반응성을 위해 새로운 객체로 할당
      remoteCursorsMap.value = { ...remoteCursorsMap.value };
    }
  } else if (message.messageType === 'LOCK_DENIED') {
      // (Optional) Handle lock denial, e.g., show a temporary visual cue
      // For now, we do nothing, the line simply won't appear locked for the user.
      // console.log(`Lock denied for line: ${JSON.parse(message.content).lineId}`);
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
  padding: 0 16px; /* 가로 여백 확대 */
}

.online-users-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 8px;
}

.user-avatar {
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.1);
}

.color-picker-container {
  min-width: 200px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin: 8px 0;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: #333;
}

.color-option.selected {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.3);
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

.ProseMirror p {
  margin: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.editor-container .ProseMirror p {
  margin: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
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
  transition: top 0.1s linear, left 0.1s linear;
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

.remote-selection-highlight {
  opacity: 0.3;
  pointer-events: none;
  z-index: 5;
}

.locked-line {
  background-color: rgba(255, 0, 0, 0.1);
  cursor: not-allowed;
}

.ProseMirror .locked-line {
  pointer-events: none;
}

/* 폰트 사이즈 선택기 스타일 */
.font-size-picker {
  min-width: 200px;
}

.font-size-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin: 8px 0;
}

.font-size-btn {
  min-width: 40px;
  height: 32px;
}

/* 인라인 스타일 버튼들 */
.v-btn.is-active {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 이모지/기호 픽커 */
.emoji-picker { min-width: 260px; }
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
}
.emoji-item {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.05s ease;
}
.emoji-item:hover { background: #f5f5f5; }
.emoji-item:active { transform: scale(0.98); }
</style>
