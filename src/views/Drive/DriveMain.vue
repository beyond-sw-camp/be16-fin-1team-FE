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
            <v-btn text small @click="loadFolderContents(currentFolderId)">
              <v-icon small left>mdi-refresh</v-icon>
              새로고침
            </v-btn>
            <v-btn text small @click="createFolderDialog = true">
              <v-icon small left>mdi-folder-plus</v-icon>
              새 폴더
            </v-btn>
            <v-btn color="primary" depressed small @click="uploadDialog = true">
              <v-icon small left>mdi-upload</v-icon>
              업로드
            </v-btn>
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
              <div class="d-flex align-center py-2 clickable-row" @click="handleItemClick(item)">
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
                  <v-icon small>mdi-account-circle</v-icon>
                </v-avatar>
                {{ item.owner }}
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-menu offset-y @click.stop>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    icon
                    small
                    v-bind="attrs"
                    v-on="on"
                    @click.stop
                  >
                    <v-icon small>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list dense>
                  <v-list-item v-if="item.type === 'folder'" @click="openRenameDialog(item)">
                    <v-list-item-icon><v-icon small>mdi-pencil</v-icon></v-list-item-icon>
                    <v-list-item-title>이름 변경</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="deleteItem(item)" class="error--text">
                    <v-list-item-icon><v-icon small color="error">mdi-delete</v-icon></v-list-item-icon>
                    <v-list-item-title>삭제</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
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
      createFolderDialog: false,
      newFolderName: '',
      renameDialog: false,
      renameItem: null,
      renameName: '',
      uploadDialog: false,
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
    const folderId = this.$route.params.folderId;
    this.initializeDrive(folderId);
  },

  watch: {
    '$route.params.folderId'(newFolderId) {
      this.loadFolderContents(newFolderId);
    }
  },

  methods: {
    // 드라이브 초기화
    async initializeDrive(folderId) {
      await Promise.all([
        this.loadFolderTree(),
        this.loadFolderContents(folderId)
      ]);
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

        const response = await driveService.getFolderContents(folderId || 'root');
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
          this.$router.push({ name: 'drive' });
        } else {
          this.$router.push({
            name: 'driveFolder',
            params: { folderId: folderId }
          });
        }
      }
    },

    // 폴더 내용 로드 (폴더, 파일, 문서 모두)
    async loadFolderContents(folderId) {
      try {
        this.loading = true;
        const targetFolderId = folderId || 'root';
        
        const response = await driveService.getFolderContents(targetFolderId);
        
        if (response.result) {
          this.items = this.parseItems(response.result);
          this.currentFolderId = folderId;
          this.updateBreadcrumbs(folderId, response.result);
        } else {
          this.items = [];
        }
      } catch (error) {
        console.error('폴더 내용 로드 실패:', error);
        showSnackbar('폴더 내용을 불러오는데 실패했습니다.', 'error');
        this.items = [];
      } finally {
        this.loading = false;
      }
    },

    // API 응답 파싱
    parseItems(data) {
      const items = [];
      const dataArray = Array.isArray(data) ? data : [];
      
      dataArray.forEach(item => {
        const type = item.type || 'file';
        const name = item.name || 'Unnamed';
        const owner = item.createBy || '알 수 없음';
        const modified = this.formatDate(item.updateAt);
        
        items.push({
          id: item.id,
          name: name,
          owner: owner,
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
    updateBreadcrumbs(folderId, data) {
      if (!folderId || folderId === 'root') {
        this.breadcrumbs = [
          { text: '내 드라이브', icon: 'mdi-home', disabled: false, folderId: null },
        ];
        this.currentFolderName = '내 드라이브';
      } else {
        // 간단한 브레드크럼 (현재 폴더만)
        this.breadcrumbs = [
          { text: '내 드라이브', icon: 'mdi-home', disabled: false, folderId: null },
          { text: folderId, disabled: true, folderId: folderId },
        ];
        this.currentFolderName = folderId;
      }
    },

    // 브레드크럼 네비게이션
    navigateToBreadcrumb(item) {
      if (item.disabled) return;
      
      if (!item.folderId) {
        this.$router.push({ name: 'drive' });
      } else {
        this.$router.push({
          name: 'driveFolder',
          params: { folderId: item.folderId }
        });
      }
    },

    // 아이템 아이콘
    getItemIcon(item) {
      if (item.type === 'folder') return 'mdi-folder';
      if (item.type === 'document') return 'mdi-file-document-edit';
      
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
      if (item.type === 'folder') {
        console.log('Navigating to folder:', item.id);
        this.$router.push({
          name: 'driveFolder',
          params: { folderId: item.id }
        });
      } else if (item.type === 'document') {
        console.log('Navigating to document:', item.id);
        this.$router.push(`/document/${item.id}`);
      }
    },

    // 폴더 생성
    async createFolder() {
      if (!this.newFolderName.trim()) {
        showSnackbar('폴더 이름을 입력해주세요.', 'warning');
        return;
      }

      try {
        await driveService.createFolder({
          name: this.newFolderName,
          parentFolderId: this.currentFolderId || null,
        });
        
        showSnackbar('폴더가 생성되었습니다.', 'success');
        this.createFolderDialog = false;
        this.newFolderName = '';
        
        await Promise.all([
          this.loadFolderContents(this.currentFolderId),
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
        await driveService.updateFolderName(this.renameItem.id, {
          name: this.renameName,
        });
        
        showSnackbar('이름이 변경되었습니다.', 'success');
        this.renameDialog = false;
        
        await Promise.all([
          this.loadFolderContents(this.currentFolderId),
          this.refreshFolderTree()
        ]);
      } catch (error) {
        console.error('이름 변경 실패:', error);
        showSnackbar('이름 변경에 실패했습니다.', 'error');
      }
    },

    // 삭제
    async deleteItem(item) {
      if (!confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return;

      try {
        if (item.type === 'folder') {
          await driveService.deleteFolder(item.id);
          await this.refreshFolderTree();
        } else if (item.type === 'document') {
          await driveService.deleteDocument(item.id);
        } else {
          await driveService.deleteFile(item.id);
        }
        
        showSnackbar('삭제되었습니다.', 'success');
        await this.loadFolderContents(this.currentFolderId);
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
        const uploadPromises = Array.from(files).map(file => 
          driveService.uploadFile(this.currentFolderId || 'root', file)
        );

        await Promise.all(uploadPromises);
        showSnackbar(`${files.length}개 파일이 업로드되었습니다.`, 'success');
        this.uploadDialog = false;
        await this.loadFolderContents(this.currentFolderId);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        showSnackbar('파일 업로드에 실패했습니다.', 'error');
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

.folder-tree >>> .v-treeview-node__root {
  min-height: 36px;
}

.folder-tree >>> .v-treeview-node__label {
  font-size: 14px;
}

.folder-label {
  cursor: pointer;
}

.folder-label:hover {
  color: #1976d2;
}

.drive-table >>> tbody tr {
  cursor: pointer;
}

.drive-table >>> tbody tr:hover {
  background-color: #f5f5f5 !important;
}

.clickable-row {
  cursor: pointer;
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
