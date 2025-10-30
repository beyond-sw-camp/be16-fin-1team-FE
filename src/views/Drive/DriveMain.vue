<template>
  <v-container fluid class="drive-container pa-0">
    <v-row no-gutters class="fill-height">
      <!-- Left Sidebar - Folder Tree -->
      <v-col cols="12" md="3" class="sidebar-col">
        <v-card class="folder-tree-card" elevation="0" tile>
          <div class="sidebar-header pa-4">
            <h3 class="text-h6 font-weight-bold">내 드라이브</h3>
          </div>
          <v-divider></v-divider>
          
          <!-- 폴더 트리뷰 -->
          <v-treeview
            :items="folderTree"
            :open.sync="openFolders"
            :active.sync="activeFolder"
            activatable
            dense
            open-on-click
            transition
            class="folder-tree pa-2"
            item-key="id"
            item-text="name"
            item-children="children"
            @update:active="onFolderSelect"
          >
            <template v-slot:prepend="{ item }">
              <v-icon :color="item.id === 'root' ? 'primary' : 'amber darken-2'">
                {{ item.id === 'root' ? 'mdi-folder-home' : 'mdi-folder' }}
              </v-icon>
            </template>
            <template v-slot:label="{ item }">
              <span class="folder-label">{{ item.name }}</span>
            </template>
          </v-treeview>

          <!-- 로딩 표시 -->
          <div v-if="loadingTree" class="text-center pa-4">
            <v-progress-circular
              indeterminate
              color="primary"
              size="24"
            ></v-progress-circular>
            <div class="text-caption mt-2 grey--text">폴더 로딩 중...</div>
          </div>
        </v-card>
      </v-col>

      <!-- Main Content Area -->
      <v-col cols="12" md="9" class="main-content-col">
        <v-card class="main-content-card" elevation="0" tile>
          <!-- Toolbar -->
          <v-toolbar flat color="white" class="px-4">
            <v-toolbar-title class="text-h6">{{ currentFolderName }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn text small @click="loadFolderContents(currentFolderId, currentRootType, currentRootId)">
              <v-icon small left>mdi-refresh</v-icon>
              새로고침
            </v-btn>
            
            <!-- 신규 메뉴 -->
            <v-menu v-model="isNewItemMenuOpen" :close-on-content-click="true" offset-y>
              <template #activator="{ props }">
                <v-btn color="primary" depressed small v-bind="props">
                  <v-icon small left>mdi-plus</v-icon>
                  신규
                </v-btn>
              </template>
              <div class="new-item-menu">
                <button class="menu-item" @click="openCreateFolderDialog">
                  <v-icon small class="menu-item-icon">mdi-folder-plus</v-icon>
                  <span>새 폴더</span>
                </button>
                <button class="menu-item" @click="openCreateDocumentDialog">
                  <v-icon small class="menu-item-icon">mdi-file-document-edit</v-icon>
                  <span>새 문서</span>
                </button>
                <button class="menu-item" @click="openUploadDialog">
                  <v-icon small class="menu-item-icon">mdi-upload</v-icon>
                  <span>새 파일</span>
                </button>
              </div>
            </v-menu>
          </v-toolbar>
          <v-divider></v-divider>

          <!-- Breadcrumbs -->
          <div class="px-4 py-2">
            <v-breadcrumbs :items="breadcrumbs" class="pa-0" dense>
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :disabled="item.disabled"
                  @click="navigateToBreadcrumb(item)"
                  class="breadcrumb-item"
                >
                  <v-icon v-if="item.icon" small class="mr-1">{{ item.icon }}</v-icon>
                  {{ item.text }}
                </v-breadcrumbs-item>
              </template>
            </v-breadcrumbs>
          </div>

          <!-- File info summary -->
          <div class="px-4 py-2">
            <div class="text-body-2 grey--text">
              {{ folderCount }}개 폴더, {{ fileCount }}개 파일
            </div>
          </div>
          <v-divider></v-divider>

          <!-- Loading -->
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <div class="mt-4 text-body-1">로딩 중...</div>
          </div>

          <!-- Data Table -->
          <v-data-table
            v-else
            :headers="headers"
            :items="items"
            class="elevation-0 drive-table"
            :items-per-page="15"
          >
            <template v-slot:item.name="{ item }">
              <div 
                class="d-flex align-center py-2 clickable-row" 
                :class="{ 'drag-over': dragOverItem && dragOverItem.id === item.id }"
                :draggable="item.type !== 'PROJECT' && item.type !== 'STONE'"
                @click="handleItemClick(item)"
                @dragstart="onDragStart($event, item)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, item)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item)"
              >
                <v-icon :color="getItemIconColor(item)" class="mr-3">
                  {{ getItemIcon(item) }}
                </v-icon>
                <span class="item-name">
                  {{ item.name }}
                </span>
              </div>
            </template>

            <template v-slot:item.owner="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="24" class="mr-2">
                  <v-img v-if="item.ownerImage" :src="item.ownerImage" />
                  <v-icon v-else small>mdi-account-circle</v-icon>
                </v-avatar>
                {{ item.owner }}
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <!-- PROJECT, STONE 타입은 액션 버튼 표시 안 함 -->
              <div v-if="item.type !== 'PROJECT' && item.type !== 'STONE'" @click.stop class="d-flex">
                <v-btn
                  v-if="item.type === 'folder'"
                  icon
                  x-small
                  @click.stop="openRenameDialog(item)"
                  title="이름 변경"
                >
                  <v-icon small>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  x-small
                  @click.stop="deleteItem(item)"
                  color="error"
                  title="삭제"
                >
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>

            <template v-slot:no-data>
              <div class="text-center py-8">
                <v-icon size="64" color="grey lighten-1">mdi-folder-open-outline</v-icon>
                <div class="text-h6 mt-4 grey--text">폴더가 비어있습니다</div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Folder Dialog -->
    <v-dialog v-model="createFolderDialog" max-width="500">
      <v-card>
        <v-card-title>새 폴더 만들기</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newFolderName"
            label="폴더 이름"
            outlined
            dense
            autofocus
            @keyup.enter="createFolder"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="createFolderDialog = false">취소</v-btn>
          <v-btn color="primary" @click="createFolder">만들기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rename Dialog -->
    <v-dialog v-model="renameDialog" max-width="500">
      <v-card>
        <v-card-title>이름 변경</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="renameName"
            label="새 이름"
            outlined
            dense
            autofocus
            @keyup.enter="confirmRename"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="renameDialog = false">취소</v-btn>
          <v-btn color="primary" @click="confirmRename">변경</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Document Dialog -->
    <v-dialog v-model="createDocumentDialog" max-width="500">
      <v-card>
        <v-card-title>새 문서 만들기</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newDocumentTitle"
            label="문서 제목"
            outlined
            dense
            autofocus
            @keyup.enter="createDocument"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="createDocumentDialog = false">취소</v-btn>
          <v-btn color="primary" @click="createDocument">만들기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Upload Dialog -->
    <v-dialog v-model="uploadDialog" max-width="600">
      <v-card>
        <v-card-title>파일 업로드</v-card-title>
        <v-card-text>
          <div
            class="upload-zone"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <v-icon size="64" color="primary">mdi-cloud-upload</v-icon>
            <div class="text-h6 mt-4">파일을 여기에 드래그하거나</div>
            <v-btn color="primary" class="mt-4" @click="$refs.fileInput.click()">
              파일 선택
            </v-btn>
            <input
              ref="fileInput"
              type="file"
              multiple
              style="display: none"
              @change="handleFileSelect"
            >
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="uploadDialog = false">닫기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import driveService from '@/services/driveService';
import { showSnackbar } from '@/services/snackbar';

export default {
  name: "DriveMain",
  data() {
    return {
      loading: false,
      loadingTree: false,
      currentFolderId: null,
      currentFolderName: '내 드라이브',
      currentRootType: null,
      currentRootId: null,
      folderPath: [],  // 폴더 경로 [{ id, name }, ...]
      
      // 폴더 트리
      folderTree: [],
      openFolders: ['root'],
      activeFolder: [],
      folderCache: {},
      
      // 테이블 데이터
      headers: [
        { text: '이름', value: 'name', width: '40%' },
        { text: '생성자', value: 'owner', width: '25%' },
        { text: '수정일', value: 'modified', width: '20%' },
        { text: '크기', value: 'size', width: '10%' },
        { text: '', value: 'actions', sortable: false, width: '5%' },
      ],
      items: [],
      
      // Breadcrumbs
      breadcrumbs: [
        { text: '내 드라이브', icon: 'mdi-home', disabled: false, folderId: null },
      ],
      
      // Dialogs
      isNewItemMenuOpen: false,
      createFolderDialog: false,
      newFolderName: '',
      createDocumentDialog: false,
      newDocumentTitle: '',
      renameDialog: false,
      renameItem: null,
      renameName: '',
      uploadDialog: false,
      
      // 드래그 앤 드롭
      draggingItem: null,
      dragOverItem: null,
    };
  },

  computed: {
    folderCount() {
      return this.items.filter(item => item.type === 'folder').length;
    },
    fileCount() {
      return this.items.filter(item => item.type === 'file' || item.type === 'document').length;
    },
  },

  mounted() {
    const { rootType, rootId, folderId } = this.$route.params;
    
    if (rootType && rootId && folderId) {
      // rootType/rootId/folder/folderId 형태로 접근한 경우 (폴더 내부)
      this.initializeDrive(folderId, rootType, rootId);
    } else if (rootType && rootId) {
      // rootType/rootId 형태로 접근한 경우 (루트)
      this.initializeDrive(null, rootType, rootId);
    } else if (folderId) {
      // 기존 folderId 형태로 접근한 경우 (deprecated)
      this.initializeDrive(folderId);
    } else {
      // 기본 드라이브
      this.initializeDrive(null, 'WORKSPACE', localStorage.getItem('selectedWorkspaceId'));
    }
  },

  watch: {
    '$route.params': {
      handler(newParams) {
        const { rootType, rootId, folderId } = newParams;
        
        if (rootType && rootId && folderId) {
          // 폴더 내부로 이동
          this.initializeDrive(folderId, rootType, rootId);
        } else if (rootType && rootId) {
          // 루트로 이동
          this.initializeDrive(null, rootType, rootId);
        } else if (folderId) {
          // deprecated
          this.loadFolderContents(folderId);
        }
      },
      deep: true
    }
  },

  methods: {
    // 드라이브 초기화
    async initializeDrive(folderId, rootType, rootId) {
      // 현재 루트 정보 저장
      if (rootType && rootId) {
        this.currentRootType = rootType;
        this.currentRootId = rootId;
      }
      
      // folderId가 있으면 폴더 내용 로드
      if (folderId && rootType && rootId) {
        console.log(`${rootType} 루트의 폴더 초기화:`, rootId, folderId);
        await Promise.all([
          this.loadFolderTree(),
          this.loadFolderContents(folderId, rootType, rootId)
        ]);
        return;
      }
      
      // rootType과 rootId가 있으면 루트 API 사용
      if (rootType && rootId) {
        console.log(`${rootType} 루트 초기화:`, rootId);
        
        try {
          this.loading = true;
          this.loadingTree = true;
          
          const response = await driveService.getContentsByRoot(rootType, rootId);
          
          if (response.result) {
            // 메인 콘텐츠 업데이트
            this.items = this.parseItems(response.result);
            this.currentFolderId = null;
            this.updateBreadcrumbs(null, response.result, rootType || this.currentRootType);
            
            // 폴더 트리 업데이트 (폴더만 추출)
            const folders = [];
            const items = Array.isArray(response.result) ? response.result : [];
            
            for (const item of items) {
              if (item.type === 'folder') {
                folders.push({
                  id: item.id,
                  name: item.name,
                  children: [],
                });
              }
            }
            
            this.folderCache['root'] = folders;
            const rootName = rootType === 'WORKSPACE' ? '내 드라이브' : 
                             rootType === 'PROJECT' ? '프로젝트 문서함' : 
                             rootType === 'STONE' ? '스톤 문서함' : '문서함';
            const rootFolder = {
              id: 'root',
              name: rootName,
              children: folders,
            };
            this.folderTree = [rootFolder];
          } else {
            this.items = [];
            this.folderTree = [{ id: 'root', name: '내 드라이브', children: [] }];
          }
        } catch (error) {
          console.error('드라이브 초기화 실패:', error);
          
          // 접근 권한 에러 등의 경우 이전 페이지로 이동
          const errorMessage = error.response?.data?.statusMessage || '접근 권한이 없거나 문서함을 불러올 수 없습니다.';
          showSnackbar(errorMessage, 'error');
          
          // 워크스페이스 드라이브 루트로 리디렉션
          const workspaceId = localStorage.getItem('selectedWorkspaceId');
          this.$router.replace({ 
            name: 'driveRoot',
            params: { 
              rootType: 'WORKSPACE',
              rootId: workspaceId
            }
          });
        } finally {
          this.loading = false;
          this.loadingTree = false;
        }
      }
      // 워크스페이스 루트인 경우
      else if (!folderId || this.isWorkspaceId(folderId)) {
        const workspaceId = folderId || localStorage.getItem('selectedWorkspaceId');
        await this.initializeDrive(null, 'WORKSPACE', workspaceId);
      }
      // 일반 폴더인 경우
      else {
        await Promise.all([
          this.loadFolderTree(),
          this.loadFolderContents(folderId)
        ]);
      }
    },

    // 폴더 트리 로드 (폴더만)
    async loadFolderTree() {
      try {
        this.loadingTree = true;
        
        const rootFolder = {
          id: 'root',
          name: '내 드라이브',
          children: await this.loadFolderChildren('root'),
        };

        this.folderTree = [rootFolder];
      } catch (error) {
        console.error('폴더 트리 로드 실패:', error);
      } finally {
        this.loadingTree = false;
      }
    },

    // 하위 폴더들 로드 (폴더만, 파일 제외)
    async loadFolderChildren(folderId) {
      try {
        if (this.folderCache[folderId]) {
          return this.folderCache[folderId];
        }

        let response;
        
        // 루트인 경우 워크스페이스 API 사용
        if (!folderId || folderId === 'root' || this.isWorkspaceId(folderId)) {
          const workspaceId = localStorage.getItem('selectedWorkspaceId');
          response = await driveService.getContentsByRoot('WORKSPACE', workspaceId);
        } else {
          response = await driveService.getFolderContents(folderId);
        }
        
        const folders = [];
        
        if (response.result) {
          const items = Array.isArray(response.result) ? response.result : [];
          
          // 폴더만 추출
          for (const item of items) {
            if (item.type === 'folder') {
              folders.push({
                id: item.id,
                name: item.name,
                children: [], // 펼칠 때 로드
              });
            }
          }
        }

        this.folderCache[folderId] = folders;
        return folders;
      } catch (error) {
        console.error(`폴더 로드 실패 ${folderId}:`, error);
        return [];
      }
    },

    // 트리에서 폴더 선택
    onFolderSelect(selectedIds) {
      if (selectedIds && selectedIds.length > 0) {
        const folderId = selectedIds[0];
        
        if (folderId === 'root') {
          // 루트로 이동 (현재 rootType/rootId 유지)
          if (this.currentRootType && this.currentRootId) {
            this.$router.push({ 
              name: 'driveRoot',
              params: { 
                rootType: this.currentRootType,
                rootId: this.currentRootId
              }
            });
          } else {
            this.$router.push({ name: 'drive' });
          }
        } else {
          // 폴더로 이동 (rootType/rootId 유지)
          this.$router.push({
            name: 'driveFolder',
            params: { 
              rootType: this.currentRootType || 'WORKSPACE',
              rootId: this.currentRootId || localStorage.getItem('selectedWorkspaceId'),
              folderId: folderId 
            }
          });
        }
      }
    },

    // 폴더 내용 로드 (폴더, 파일, 문서 모두)
    async loadFolderContents(folderId, rootType, rootId) {
      try {
        this.loading = true;
        let response;
        
        // rootType과 rootId 저장 (폴더 생성 시 필요)
        if (rootType && rootId) {
          this.currentRootType = rootType;
          this.currentRootId = rootId;
        }
        
        // folderId가 있으면 해당 폴더의 내용 로드
        if (folderId && !this.isWorkspaceId(folderId)) {
          console.log('폴더 내용 로드:', folderId);
          response = await driveService.getFolderContents(folderId);
          this.currentFolderId = folderId;
        }
        // folderId가 없고 rootType/rootId가 있으면 루트 내용 로드
        else if (rootType && rootId) {
          console.log(`${rootType} 루트 로드:`, rootId);
          response = await driveService.getContentsByRoot(rootType, rootId);
          this.currentFolderId = null;
        }
        // folderId가 워크스페이스 ID인 경우
        else if (!folderId || this.isWorkspaceId(folderId)) {
          const workspaceId = folderId || localStorage.getItem('selectedWorkspaceId');
          console.log('워크스페이스 루트 로드:', workspaceId);
          this.currentRootType = 'WORKSPACE';
          this.currentRootId = workspaceId;
          response = await driveService.getContentsByRoot('WORKSPACE', workspaceId);
          this.currentFolderId = null;
        }
        
        if (response.result) {
          // items 파싱
          const items = Array.isArray(response.result) 
            ? response.result 
            : response.result.items || [];
          
          // ancestors 추출 (하위 요소의 ancestors를 보면 현재 경로를 알 수 있음)
          if (folderId && items.length > 0 && items[0].ancestors) {
            // ancestors를 folderPath로 설정 (역순으로 되어있을 수 있으니 reverse)
            const ancestorsArray = items[0].ancestors;
            this.folderPath = ancestorsArray.slice().reverse().map(ancestor => ({
              id: ancestor.folderId,
              name: ancestor.folderName
            }));
          }
          // 빈 폴더인 경우 폴더 정보 조회
          else if (folderId && items.length === 0) {
            try {
              const folderInfo = await driveService.getFolderInfo(folderId);
              
              if (folderInfo.result && folderInfo.result.ancestors) {
                const ancestorsArray = folderInfo.result.ancestors;
                
                // ancestors를 folderPath로 설정 (역순 처리)
                this.folderPath = ancestorsArray.slice().reverse().map(ancestor => ({
                  id: ancestor.folderId,
                  name: ancestor.folderName
                }));
                
                // 현재 폴더도 추가
                this.folderPath.push({
                  id: folderInfo.result.folderId,
                  name: folderInfo.result.folderName
                });
                
                // 빈 폴더의 경우 여기서 브레드크럼 업데이트
                this.updateBreadcrumbs(folderId, items, rootType || this.currentRootType);
              }
            } catch (error) {
              console.error('폴더 정보 조회 실패:', error);
            }
          }
          
          this.items = this.parseItems(items);
          
          // 하위 요소가 있는 경우에만 여기서 브레드크럼 업데이트
          if (items.length > 0) {
            this.updateBreadcrumbs(folderId, items, rootType || this.currentRootType);
          }
        } else {
          this.items = [];
        }
      } catch (error) {
        console.error('폴더 내용 로드 실패:', error);
        
        // 접근 권한 에러 등의 경우
        const errorMessage = error.response?.data?.statusMessage || '폴더 내용을 불러오는데 실패했습니다.';
        showSnackbar(errorMessage, 'error');
        
        // 권한 에러인 경우 워크스페이스 드라이브 루트로 리디렉션
        if (error.response?.status === 403 || error.response?.status === 401) {
          const workspaceId = localStorage.getItem('selectedWorkspaceId');
          this.$router.replace({ 
            name: 'driveRoot',
            params: { 
              rootType: 'WORKSPACE',
              rootId: workspaceId
            }
          });
        } else {
          this.items = [];
        }
      } finally {
        this.loading = false;
      }
    },

    // 워크스페이스 ID인지 확인
    isWorkspaceId(id) {
      // 워크스페이스 ID는 'ws_'로 시작하고 폴더 ID 패턴이 아닌 경우
      return id && !id.includes('_fol_') && !id.includes('_file_') && !id.includes('_doc_');
    },

    // API 응답 파싱
    parseItems(data) {
      const items = [];
      const dataArray = Array.isArray(data) ? data : [];
      
      dataArray.forEach(item => {
        const type = item.type || 'file';
        const name = item.name || 'Unnamed';
        // creatorName이 우선, 없으면 createBy(ID) 사용
        const owner = item.creatorName || item.createBy || '-';
        const modified = this.formatDate(item.updateAt || item.updatedAt);
        
        items.push({
          id: item.id,
          name: name,
          owner: owner,
          ownerImage: item.profileImage || null,
          modified: modified,
          size: type === 'file' ? this.formatFileSize(item.size) : '',
          type: type,
          extension: type === 'file' ? this.getFileExtension(name) : '',
        });
      });
      
      return items;
    },

    // 날짜 포맷
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '');
    },

    // 파일 크기 포맷
    formatFileSize(bytes) {
      if (!bytes) return '';
      if (bytes < 1024) return bytes + 'B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
      if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
    },

    // 파일 확장자 추출
    getFileExtension(filename) {
      if (!filename) return '';
      const parts = filename.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    },

    // 브레드크럼 업데이트
    updateBreadcrumbs(folderId, data, rootType) {
      console.log('updateBreadcrumbs - rootType:', rootType, 'currentRootType:', this.currentRootType);
      const rootName = rootType === 'WORKSPACE' ? '내 드라이브' : 
                       rootType === 'PROJECT' ? '프로젝트 문서함' : 
                       rootType === 'STONE' ? '스톤 문서함' : '내 드라이브';
      
      if (!folderId || folderId === 'root') {
        // 루트로 돌아왔을 때 경로 초기화
        this.folderPath = [];
        this.breadcrumbs = [
          { text: rootName, icon: 'mdi-home', disabled: false, folderId: null },
        ];
        this.currentFolderName = rootName;
      } else {
        // 폴더 경로를 사용해서 브레드크럼 생성
        this.breadcrumbs = [
          { text: rootName, icon: 'mdi-home', disabled: false, folderId: null },
        ];
        
        // 폴더 경로의 각 폴더를 브레드크럼에 추가
        this.folderPath.forEach((folder, index) => {
          this.breadcrumbs.push({
            text: folder.name,
            disabled: index === this.folderPath.length - 1,  // 마지막 폴더는 비활성화
            folderId: folder.id,
          });
        });
        
        // 현재 폴더 이름 설정
        if (this.folderPath.length > 0) {
          this.currentFolderName = this.folderPath[this.folderPath.length - 1].name;
        } else {
          this.currentFolderName = folderId;
        }
      }
    },

    // 브레드크럼 네비게이션
    navigateToBreadcrumb(item) {
      if (item.disabled) return;
      
      if (!item.folderId) {
        // 루트로 이동
        if (this.currentRootType && this.currentRootId) {
          this.$router.push({ 
            name: 'driveRoot',
            params: { 
              rootType: this.currentRootType,
              rootId: this.currentRootId
            }
          });
        } else {
          this.$router.push({ name: 'drive' });
        }
      } else {
        // 폴더로 이동 (백엔드에서 ancestors 제공)
        this.$router.push({
          name: 'driveFolder',
          params: { 
            rootType: this.currentRootType || 'WORKSPACE',
            rootId: this.currentRootId || localStorage.getItem('selectedWorkspaceId'),
            folderId: item.folderId 
          }
        });
      }
    },

    // 아이템 아이콘
    getItemIcon(item) {
      if (item.type === 'folder') return 'mdi-folder';
      if (item.type === 'document') return 'mdi-file-document-edit';
      if (item.type === 'STONE') return 'mdi-link-variant';  // 바로가기 아이콘
      if (item.type === 'PROJECT') return 'mdi-link-variant';  // 바로가기 아이콘
      
      const iconMap = {
        pdf: 'mdi-file-pdf-box',
        docx: 'mdi-file-word-box',
        xlsx: 'mdi-file-excel-box',
        txt: 'mdi-file-document-outline',
        jpg: 'mdi-file-image',
        png: 'mdi-file-image',
      };
      
      return iconMap[item.extension] || 'mdi-file-outline';
    },

    // 아이템 아이콘 색상
    getItemIconColor(item) {
      if (item.type === 'folder') return 'amber darken-2';
      if (item.type === 'document') return 'blue darken-1';
      if (item.type === 'STONE') return 'purple darken-1';  // 스톤 바로가기
      if (item.type === 'PROJECT') return 'green darken-1';  // 프로젝트 바로가기
      
      const colorMap = {
        pdf: 'red darken-1',
        docx: 'blue darken-1',
        xlsx: 'green darken-1',
      };
      
      return colorMap[item.extension] || 'grey';
    },

    // 아이템 클릭
    handleItemClick(item) {
      console.log('Item clicked:', item);
      
      // folder: 계층 구조로 폴더 탐색
      if (item.type === 'folder') {
        console.log('Navigating to folder:', item.id);
        
        // 폴더 경로에 추가 (폴더 이름 정보가 있으므로)
        // 백엔드에서 ancestors 오면 덮어쓰기
        this.folderPath.push({
          id: item.id,
          name: item.name
        });
        
        this.$router.push({
          name: 'driveFolder',
          params: { 
            rootType: this.currentRootType || 'WORKSPACE',
            rootId: this.currentRootId || localStorage.getItem('selectedWorkspaceId'),
            folderId: item.id 
          }
        });
      }
      // STONE: 스톤 문서함으로 바로가기
      else if (item.type === 'STONE') {
        console.log('Navigating to STONE drive:', item.id);
        this.$router.push({
          name: 'driveRoot',
          params: { rootType: 'STONE', rootId: item.id }
        });
      }
      // PROJECT: 프로젝트 문서함으로 바로가기
      else if (item.type === 'PROJECT') {
        console.log('Navigating to PROJECT drive:', item.id);
        this.$router.push({
          name: 'driveRoot',
          params: { rootType: 'PROJECT', rootId: item.id }
        });
      }
      // document: 문서 편집
      else if (item.type === 'document') {
        console.log('Navigating to document:', item.id);
        // 독립적인 뷰어로 새 탭에서 열기
        const routeData = this.$router.resolve(`/viewer/${item.id}`);
        window.open(routeData.href, '_blank');
      }
    },

    // 새 폴더 다이얼로그 열기
    openCreateFolderDialog() {
      this.newFolderName = '';
      this.createFolderDialog = true;
    },

    // 새 문서 다이얼로그 열기
    openCreateDocumentDialog() {
      this.newDocumentTitle = '';
      this.createDocumentDialog = true;
    },

    // 파일 업로드 다이얼로그 열기
    openUploadDialog() {
      this.uploadDialog = true;
    },

    // 폴더 생성
    async createFolder() {
      if (!this.newFolderName.trim()) {
        showSnackbar('폴더 이름을 입력해주세요.', 'warning');
        return;
      }

      try {
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        const userId = localStorage.getItem('id');
        
        // rootId와 rootType은 현재 루트에 따라 결정
        // WORKSPACE: rootId = workspaceId, rootType = "WORKSPACE"
        // PROJECT: rootId = projectId, rootType = "PROJECT"
        // STONE: rootId = stoneId, rootType = "STONE"
        const folderData = {
          name: this.newFolderName,
          workspaceId: workspaceId,
          rootId: this.currentRootId || workspaceId,
          rootType: this.currentRootType || 'WORKSPACE',
          parentId: this.currentFolderId || null,
          createdBy: userId,
        };
        
        const response = await driveService.createFolder(folderData);
        
        showSnackbar(response.statusMessage || '폴더가 생성되었습니다.', 'success');
        this.createFolderDialog = false;
        this.newFolderName = '';
        
        // 현재 루트 정보를 유지하면서 새로고침
        await Promise.all([
          this.currentRootType && this.currentRootId 
            ? this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId)
            : this.loadFolderContents(this.currentFolderId),
          this.refreshFolderTree()
        ]);
      } catch (error) {
        console.error('폴더 생성 실패:', error);
        showSnackbar('폴더 생성에 실패했습니다.', 'error');
      }
    },

    // 이름 변경 다이얼로그 열기
    openRenameDialog(item) {
      this.renameItem = item;
      this.renameName = item.name;
      this.renameDialog = true;
    },

    // 이름 변경
    async confirmRename() {
      if (!this.renameName.trim()) {
        showSnackbar('이름을 입력해주세요.', 'warning');
        return;
      }

      try {
        const response = await driveService.updateFolderName(this.renameItem.id, {
          name: this.renameName,
        });
        
        showSnackbar(response.statusMessage || '이름이 변경되었습니다.', 'success');
        this.renameDialog = false;
        
        // 현재 루트 정보를 유지하면서 새로고침
        await Promise.all([
          this.currentRootType && this.currentRootId 
            ? this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId)
            : this.loadFolderContents(this.currentFolderId),
          this.refreshFolderTree()
        ]);
      } catch (error) {
        console.error('이름 변경 실패:', error);
        showSnackbar('이름 변경에 실패했습니다.', 'error');
      }
    },

    // 문서 생성
    async createDocument() {
      if (!this.newDocumentTitle.trim()) {
        showSnackbar('문서 제목을 입력해주세요.', 'warning');
        return;
      }

      try {
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        
        // 현재 폴더 ID 결정 (루트인 경우 workspaceId 사용)
        const folderId = this.currentFolderId || this.currentRootId || workspaceId;
        
        // DocumentSaveDto에 맞춰 데이터 구성
        // rootId와 rootType은 현재 루트에 따라 결정
        // WORKSPACE: rootId = workspaceId, rootType = "WORKSPACE"
        // PROJECT: rootId = projectId, rootType = "PROJECT"
        // STONE: rootId = stoneId, rootType = "STONE"
        const documentData = {
          name: this.newDocumentTitle,
          folderId: this.currentFolderId || null,
          rootId: this.currentRootId || workspaceId,
          rootType: this.currentRootType || 'WORKSPACE',
        };
        
        const response = await driveService.createDocument(folderId, documentData);
        
        showSnackbar(response.statusMessage || '문서가 생성되었습니다.', 'success');
        this.createDocumentDialog = false;
        this.newDocumentTitle = '';
        
        // 생성된 문서를 독립적인 뷰어로 새 탭에서 열기
        if (response.result && response.result.id) {
          const routeData = this.$router.resolve(`/viewer/${response.result.id}`);
          window.open(routeData.href, '_blank');
        } else if (response.result) {
          // id가 직접 반환되는 경우
          const routeData = this.$router.resolve(`/viewer/${response.result}`);
          window.open(routeData.href, '_blank');
        }
        
        // 폴더 내용 새로고침 (생성된 문서를 목록에 표시)
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('문서 생성 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || '문서 생성에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      }
    },

    // 삭제
    async deleteItem(item) {
      if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return;

      try {
        let response;
        if (item.type === 'folder') {
          response = await driveService.deleteFolder(item.id);
          await this.refreshFolderTree();
        } else if (item.type === 'document') {
          response = await driveService.deleteDocument(item.id);
        } else {
          response = await driveService.deleteFile(item.id);
        }
        
        showSnackbar(response.statusMessage || '삭제되었습니다.', 'success');
        
        // 현재 루트 정보를 유지하면서 새로고침
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('삭제 실패:', error);
        showSnackbar('삭제에 실패했습니다.', 'error');
      }
    },

    // 파일 업로드
    handleFileDrop(e) {
      const files = e.dataTransfer.files;
      this.uploadFiles(files);
    },

    handleFileSelect(e) {
      const files = e.target.files;
      this.uploadFiles(files);
    },

    async uploadFiles(files) {
      if (!files || files.length === 0) return;

      try {
        // 현재 폴더 ID 결정
        const folderId = this.currentFolderId || this.currentRootId || localStorage.getItem('selectedWorkspaceId');
        
        // rootId와 rootType 설정
        const rootId = this.currentRootId || localStorage.getItem('selectedWorkspaceId');
        const rootType = this.currentRootType || 'WORKSPACE';
        
        // 파일 배열로 변환
        const fileArray = Array.from(files);
        
        // 한 번에 모든 파일 업로드
        const response = await driveService.uploadFile(folderId, fileArray, rootId, rootType);
        
        showSnackbar(response.statusMessage || `${files.length}개 파일이 업로드되었습니다.`, 'success');
        this.uploadDialog = false;
        
        // 파일 입력 초기화
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
        
        // 현재 폴더 새로고침
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || '파일 업로드에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      }
    },

    // 드래그 앤 드롭 - 아이템 이동 (폴더, 문서, 파일)
    onDragStart(e, item) {
      // PROJECT, STONE 타입은 드래그 불가
      if (item.type === 'PROJECT' || item.type === 'STONE') return;
      
      this.draggingItem = item;
      e.dataTransfer.effectAllowed = 'move';
    },

    onDragEnd() {
      this.draggingItem = null;
      this.dragOverItem = null;
    },

    onDragOver(e, item) {
      if (!this.draggingItem || item.type !== 'folder') return; // 폴더에만 드롭 가능
      if (this.draggingItem.id === item.id) return; // 자기 자신에게는 드롭 불가
      
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.dragOverItem = item;
    },

    onDragLeave() {
      this.dragOverItem = null;
    },

    async onDrop(e, targetFolder) {
      e.preventDefault();
      
      if (!this.draggingItem || !targetFolder || targetFolder.type !== 'folder') return;
      if (this.draggingItem.id === targetFolder.id) return; // 자기 자신에게는 드롭 불가
      
      // 로컬 변수로 저장 (나중에 null이 되어도 사용 가능)
      const sourceItem = this.draggingItem;
      const destFolder = targetFolder;
      
      // 즉시 초기화
      this.draggingItem = null;
      this.dragOverItem = null;
      
      try {
        // 타입에 따라 적절한 API 호출
        if (sourceItem.type === 'folder') {
          await driveService.moveFolder(sourceItem.id, {
            parentId: destFolder.id
          });
        } else if (sourceItem.type === 'document' || sourceItem.type === 'file') {
          // 문서/파일은 통합 API 사용 (ElementMoveDto)
          await driveService.moveElement(sourceItem.id, {
            folderId: destFolder.id,
            type: sourceItem.type  // 'document' 또는 'file'
          });
        }
        
        showSnackbar(`"${sourceItem.name}"을(를) "${destFolder.name}"(으)로 이동했습니다.`, 'success');
        
        // 현재 루트 정보를 유지하면서 새로고침
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
        
        // 폴더 이동인 경우 트리도 새로고침
        if (sourceItem.type === 'folder') {
          await this.refreshFolderTree();
        }
      } catch (error) {
        console.error('이동 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || '이동에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      }
    },

    // 폴더 트리 새로고침
    async refreshFolderTree() {
      this.folderCache = {};
      await this.loadFolderTree();
    },
  },
};
</script>

<style scoped>
/* 신규 메뉴 스타일 */
.new-item-menu {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 160px;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item-icon {
  margin-right: 12px;
  color: #666;
}

.menu-item span {
  font-size: 14px;
  color: #333;
}

.drive-container {
  height: calc(100vh - 64px);
  background-color: #f5f5f5;
}

.sidebar-col {
  background-color: white;
  border-right: 1px solid #e0e0e0;
  max-height: calc(100vh - 64px);
  overflow-y: auto;
}

.main-content-col {
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  background-color: white;
}

.folder-tree-card,
.main-content-card {
  height: 100%;
}

.sidebar-header {
  border-bottom: 1px solid #f0f0f0;
}

.folder-tree :deep(.v-treeview-node__root) {
  min-height: 36px;
}

.folder-tree :deep(.v-treeview-node__label) {
  font-size: 14px;
}

.folder-label {
  cursor: pointer;
}

.folder-label:hover {
  color: #1976d2;
}

.drive-table :deep(tbody tr) {
  cursor: pointer;
}

.drive-table :deep(tbody tr:hover) {
  background-color: #f5f5f5 !important;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row[draggable="true"] {
  cursor: move;
}

.clickable-row.drag-over {
  background-color: #e3f2fd !important;
  border-left: 4px solid #1976d2;
}

.clickable-row:hover {
  background-color: #f5f5f5;
  border-radius: 4px;
}

.item-name {
  font-weight: 500;
}

.clickable-row:hover .item-name {
  color: #1976d2;
}

.breadcrumb-item {
  cursor: pointer;
}

.upload-zone {
  border: 2px dashed #1976d2;
  border-radius: 8px;
  padding: 48px;
  text-align: center;
  background-color: #f5f9ff;
}

.upload-zone:hover {
  background-color: #e3f2fd;
}

/* Responsive */
@media (max-width: 960px) {
  .sidebar-col {
    display: none;
  }
}

/* Scrollbar */
.sidebar-col::-webkit-scrollbar,
.main-content-col::-webkit-scrollbar {
  width: 8px;
}

.sidebar-col::-webkit-scrollbar-thumb,
.main-content-col::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
</style>
