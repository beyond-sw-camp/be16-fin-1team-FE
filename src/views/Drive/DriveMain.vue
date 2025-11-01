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

            <!-- Type Filter -->
            <v-menu offset-y :close-on-content-click="true" content-class="filter-menu-content" scroll-strategy="block">
              <template #activator="{ props }">
                <v-btn
                  small
                  depressed
                  v-bind="props"
                  :class="{ 'filter-btn-active': typeFilter !== 'all' }"
                  class="filter-btn mr-3"
                >
                  <v-icon small left>{{ getFilterIcon(typeFilter) }}</v-icon>
                  {{ getFilterLabel(typeFilter) }}
                  <v-icon small right>mdi-chevron-down</v-icon>
                </v-btn>
              </template>
              <v-list dense class="filter-menu">
                <v-list-item
                  @click="typeFilter = 'all'"
                  :class="{ 'filter-menu-item-active': typeFilter === 'all' }"
                  class="filter-menu-item"
                >
                  <v-list-item-icon class="mr-3">
                    <v-icon small>mdi-filter-variant</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>전체</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  @click="typeFilter = 'folder'"
                  :class="{ 'filter-menu-item-active': typeFilter === 'folder' }"
                  class="filter-menu-item"
                >
                  <v-list-item-icon class="mr-3">
                    <v-icon small>mdi-folder</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>폴더</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  @click="typeFilter = 'document'"
                  :class="{ 'filter-menu-item-active': typeFilter === 'document' }"
                  class="filter-menu-item"
                >
                  <v-list-item-icon class="mr-3">
                    <v-icon small>mdi-file-document</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>문서</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  @click="typeFilter = 'file'"
                  :class="{ 'filter-menu-item-active': typeFilter === 'file' }"
                  class="filter-menu-item"
                >
                  <v-list-item-icon class="mr-3">
                    <v-icon small>mdi-file</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>파일</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>

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

          <!-- Loading -->
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <div class="mt-4 text-body-1">로딩 중...</div>
          </div>

          <!-- Table Wrapper -->
          <div 
            v-else 
            class="table-wrapper"
            @dragover="onTableDragOver"
            @dragleave="onTableDragLeave"
          >
            <div class="table-container" ref="tableContainer">
              <v-data-table
                ref="dataTable"
                :headers="headers"
                :items="sortedItems"
                class="elevation-0 drive-table"
                :items-per-page="-1"
                :hide-default-header="false"
                :hide-default-footer="true"
                fixed-header
                :height="tableHeight"
              >
            <template v-slot:header.name>
              <div class="d-flex align-center clickable-header" @click="handleSort('name')">
                <span class="table-header-text">이름</span>
                <v-icon v-if="sortBy === 'name'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>
            <template v-slot:header.owner>
              <span class="table-header-text">생성자</span>
            </template>
            <template v-slot:header.modified>
              <div class="d-flex align-center clickable-header" @click="handleSort('modified')">
                <span class="table-header-text">수정일</span>
                <v-icon v-if="sortBy === 'modified'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>
            <template v-slot:header.size>
              <div class="d-flex align-center clickable-header" @click="handleSort('size')">
                <span class="table-header-text">크기</span>
                <v-icon v-if="sortBy === 'size'" x-small class="ml-1">
                  {{ sortOrder === 'asc' ? 'mdi-menu-up' : 'mdi-menu-down' }}
                </v-icon>
              </div>
            </template>

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
                <v-avatar v-if="item.type !== 'STONE' && item.type !== 'PROJECT'" size="24" class="mr-2">
                  <v-img v-if="item.ownerImage" :src="item.ownerImage" />
                  <v-icon v-else small>mdi-account-circle</v-icon>
                </v-avatar>
                {{ item.owner }}
              </div>
            </template>

            <template v-slot:item.modified="{ item }">
              <span>{{ item.modified || '-' }}</span>
            </template>

            <template v-slot:item.size="{ item }">
              <span>{{ item.size || '-' }}</span>
            </template>

            <template v-slot:item.actions="{ item }">
              <div v-if="item.type === 'folder' || item.type === 'document' || item.type === 'file'" @click.stop>
                <v-menu
                  offset-y
                  location="bottom start"
                  :close-on-content-click="true"
                  transition="fade-transition"
                  content-class="action-menu-content"
                  scroll-strategy="block"
                >
                  <template #activator="{ props }">
                    <v-btn
                      icon
                      x-small
                      class="action-icon-btn"
                      v-bind="props"
                      variant="text"
                      :ripple="false"
                      @click.stop="actionTarget = item"
                      title="동작"
                    >
                      <v-icon small>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <div class="new-item-menu action-menu-list">
                    <button v-if="canRename(actionTarget)" class="menu-item" @click="openRenameFromMenu">
                      <v-icon small class="menu-item-icon">mdi-pencil</v-icon>
                      <span>이름 변경</span>
                    </button>
                    <button class="menu-item danger" @click="deleteFromMenu" :disabled="!canDelete(actionTarget)">
                      <v-icon small class="menu-item-icon">mdi-delete</v-icon>
                      <span>삭제</span>
                    </button>
                  </div>
                </v-menu>
              </div>
            </template>

            <template v-slot:no-data>
              <div class="text-center py-8">
                <v-icon size="64" color="grey lighten-1">mdi-folder-open-outline</v-icon>
                <div class="text-h6 mt-4 grey--text">폴더가 비어있습니다</div>
              </div>
            </template>
              </v-data-table>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Folder Dialog -->
    <v-dialog v-model="createFolderDialog" max-width="500" scroll-strategy="block">
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
    <v-dialog v-model="renameDialog" max-width="520" scroll-strategy="block">
      <v-card class="rename-dialog-card">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" :color="getItemIconColor(renameItem || {})">{{ getItemIcon(renameItem || {}) }}</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-600">이름 변경</div>
            <div class="text-caption grey--text text--darken-1 text-truncate" style="max-width: 360px;">
              {{ renameItem?.name || '' }}
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pt-2">
          <v-text-field
            v-model="renameName"
            label="새 이름"
            outlined
            dense
            clearable
            counter="80"
            :maxlength="80"
            hide-details="auto"
            autofocus
            :prepend-inner-icon="'mdi-rename-box'"
            hint="공백과 특수문자 사용을 최소화해주세요."
            persistent-hint
            @keyup.enter="confirmRename"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn text @click="renameDialog = false">취소</v-btn>
          <v-btn color="primary" depressed @click="confirmRename">
            <v-icon small left>mdi-check</v-icon>변경
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Document Dialog -->
    <v-dialog v-model="createDocumentDialog" max-width="500" scroll-strategy="block">
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
    <v-dialog v-model="uploadDialog" max-width="600" scroll-strategy="block">
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
      dragScrollInterval: null,
      scrollSpeed: 0,
      
      // 정렬
      sortBy: 'modified',
      sortOrder: 'desc', // 'asc' or 'desc'
      
      // 페이지네이션
      itemsPerPage: 15,
      currentPage: 1,
      
      // 테이블 높이
      tableHeight: 600, // 기본값, mounted에서 계산

      // 타입 필터
      typeFilter: 'all', // 'all', 'folder', 'document', 'file'
      typeFilterItems: [
        { text: '모든 타입', value: 'all' },
        { text: '폴더', value: 'folder' },
        { text: '문서', value: 'document' },
        { text: '파일', value: 'file' },
      ],

      // 아이템 동작 메뉴
      actionTarget: null,
    };
  },

  computed: {
    folderCount() {
      return this.items.filter(item => item.type === 'folder').length;
    },
    fileCount() {
      return this.items.filter(item => item.type === 'file' || item.type === 'document').length;
    },
    filteredItems() {
      if (this.typeFilter === 'all') return this.items;
      return this.items.filter(item => item.type === this.typeFilter);
    },
    sortedItems() {
      // PROJECT/STONE은 정렬에서 제외하고 원래 순서를 유지
      const pinned = this.filteredItems.filter(item => item.type === 'PROJECT' || item.type === 'STONE');
      const rest = this.filteredItems.filter(item => item.type !== 'PROJECT' && item.type !== 'STONE');

      if (!this.sortBy) {
        return [...pinned, ...rest];
      }
      
      const sortedRest = [...rest];
      
      sortedRest.sort((a, b) => {
        let aVal, bVal;
        
        switch (this.sortBy) {
          case 'name':
            aVal = a.name || '';
            bVal = b.name || '';
            return this.sortOrder === 'asc' 
              ? aVal.localeCompare(bVal, 'ko-KR')
              : bVal.localeCompare(aVal, 'ko-KR');
            
          case 'modified':
            // 수정일은 날짜 문자열을 Date 객체로 변환하여 비교
            aVal = this.parseDateString(a.modified) || new Date(0);
            bVal = this.parseDateString(b.modified) || new Date(0);
            return this.sortOrder === 'asc'
              ? aVal - bVal
              : bVal - aVal;
            
          case 'size':
            // 크기는 바이트 단위로 변환하여 비교
            aVal = this.parseSizeString(a.size) || 0;
            bVal = this.parseSizeString(b.size) || 0;
            return this.sortOrder === 'asc'
              ? aVal - bVal
              : bVal - aVal;
            
          default:
            return 0;
        }
      });
      
      return [...pinned, ...sortedRest];
    },
    paginatedItems() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.sortedItems.slice(start, end);
    },
    paginationInfo() {
      const itemsLength = this.sortedItems.length;
      const start = itemsLength === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
      const end = Math.min(this.currentPage * this.itemsPerPage, itemsLength);
      return `${start}-${end} / ${itemsLength}`;
    },
    totalPages() {
      return Math.ceil(this.sortedItems.length / this.itemsPerPage);
    },
    visiblePages() {
      const currentPage = this.currentPage;
      const totalPages = this.totalPages;
      const pages = [];
      
      if (totalPages <= 7) {
        // 페이지가 7개 이하면 모두 표시
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 첫 페이지
        pages.push(1);
        
        if (currentPage > 3) {
          pages.push('...');
        }
        
        // 현재 페이지 주변 페이지들
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        if (currentPage < totalPages - 2) {
          pages.push('...');
        }
        
        // 마지막 페이지
        pages.push(totalPages);
      }
      
      return pages;
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
    
    // 테이블 높이 계산
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
  },

  beforeDestroy() {
    // 컴포넌트 언마운트 시 자동 스크롤 정리
    this.stopAutoScroll();
    // resize 이벤트 리스너 제거
    window.removeEventListener('resize', this.updateTableHeight);
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
    },
    itemsPerPage() {
      this.currentPage = 1;
    },
    sortedItems() {
      // 정렬이 변경되면 첫 페이지로 이동
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages;
      } else if (this.totalPages === 0) {
        this.currentPage = 1;
      }
    },
    loading(newVal) {
      // 로딩이 완료되면 테이블 높이 재계산
      if (!newVal) {
        this.$nextTick(() => {
          this.updateTableHeight();
        });
      }
    }
  },

  methods: {
    // 테이블 높이 업데이트
    updateTableHeight() {
      this.$nextTick(() => {
        if (this.$refs.tableContainer) {
          this.tableHeight = this.$refs.tableContainer.clientHeight;
        }
      });
    },
    
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
          // 파일 전용 URL 매핑 (DTO에 포함된 경우만)
          url: type === 'file' ? (item.url || item.previewUrl || item.downloadUrl || item.link) : undefined,
          downloadUrl: type === 'file' ? (item.downloadUrl || item.url) : undefined,
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

    // 필터 아이콘
    getFilterIcon(filterType) {
      const iconMap = {
        all: 'mdi-filter-variant',
        folder: 'mdi-folder',
        document: 'mdi-file-document',
        file: 'mdi-file'
      };
      return iconMap[filterType] || 'mdi-filter-variant';
    },

    // 필터 라벨
    getFilterLabel(filterType) {
      const labelMap = {
        all: '전체',
        folder: '폴더',
        document: '문서',
        file: '파일'
      };
      return labelMap[filterType] || '전체';
    },

    // 아이템 아이콘
    getItemIcon(item) {
      if (item.type === 'folder') return 'mdi-folder';
      if (item.type === 'document') return 'mdi-file-document-edit';
      if (item.type === 'STONE') return 'mdi-link-variant';  // 바로가기 아이콘
      if (item.type === 'PROJECT') return 'mdi-link-variant';  // 바로가기 아이콘
      
      const ext = (item.extension || this.getFileExtension(item.name)).toLowerCase();

      // 확장자별 아이콘 매핑
      const iconMap = {
        // 문서
        pdf: 'mdi-file-pdf-box',
        doc: 'mdi-file-word-box',
        docx: 'mdi-file-word-box',
        xls: 'mdi-file-excel-box',
        xlsx: 'mdi-file-excel-box',
        csv: 'mdi-file-delimited',
        ppt: 'mdi-file-powerpoint-box',
        pptx: 'mdi-file-powerpoint-box',
        txt: 'mdi-file-document-outline',
        rtf: 'mdi-file-document',
        md: 'mdi-language-markdown',
        // 코드/데이터
        html: 'mdi-language-html5',
        css: 'mdi-language-css3',
        js: 'mdi-nodejs',
        ts: 'mdi-language-typescript',
        json: 'mdi-code-json',
        yaml: 'mdi-code-json',
        yml: 'mdi-code-json',
        xml: 'mdi-xml',
        // 이미지
        jpg: 'mdi-file-image',
        jpeg: 'mdi-file-image',
        png: 'mdi-file-image',
        gif: 'mdi-file-image',
        svg: 'mdi-svg',
        webp: 'mdi-file-image',
        heic: 'mdi-file-image',
        // 오디오/비디오
        mp3: 'mdi-file-music',
        wav: 'mdi-file-music',
        flac: 'mdi-file-music',
        ogg: 'mdi-file-music',
        mp4: 'mdi-file-video',
        mov: 'mdi-file-video',
        avi: 'mdi-file-video',
        mkv: 'mdi-file-video',
        webm: 'mdi-file-video',
        // 압축
        zip: 'mdi-folder-zip',
        rar: 'mdi-folder-zip',
        '7z': 'mdi-folder-zip',
        tar: 'mdi-folder-zip',
        gz: 'mdi-folder-zip',
      };
      
      return iconMap[ext] || 'mdi-file-outline';
    },

    // 아이템 아이콘 색상
    getItemIconColor(item) {
      if (item.type === 'folder') return 'amber darken-2';
      if (item.type === 'document') return 'blue darken-1';
      if (item.type === 'STONE') return 'purple darken-1';  // 스톤 바로가기
      if (item.type === 'PROJECT') return 'green darken-1';  // 프로젝트 바로가기
      
      const ext = (item.extension || this.getFileExtension(item.name)).toLowerCase();

      // 확장자 그룹별 색상 매핑
      const colorByGroup = (
        () => {
          const documents = ['pdf', 'doc', 'docx', 'rtf', 'txt', 'md'];
          const sheets = ['xls', 'xlsx', 'csv'];
          const slides = ['ppt', 'pptx'];
          const code = ['html', 'css', 'js', 'ts', 'json', 'yaml', 'yml', 'xml'];
          const images = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'heic'];
          const audio = ['mp3', 'wav', 'flac', 'ogg'];
          const video = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
          const archives = ['zip', 'rar', '7z', 'tar', 'gz'];

          if (documents.includes(ext)) return 'red darken-1';
          if (sheets.includes(ext)) return 'green darken-1';
          if (slides.includes(ext)) return 'orange darken-2';
          if (code.includes(ext)) return 'indigo darken-1';
          if (images.includes(ext)) return 'deep-purple lighten-1';
          if (audio.includes(ext)) return 'teal darken-1';
          if (video.includes(ext)) return 'blue darken-2';
          if (archives.includes(ext)) return 'brown darken-1';
          return 'grey darken-1';
        }
      )();

      return colorByGroup;
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
      // file: DTO에 포함된 url로 이동
      else if (item.type === 'file') {
        if (item.url) {
          window.open(item.url, '_blank');
        } else if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank');
        } else {
          console.warn('File item clicked but no url provided:', item);
        }
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
        
        showSnackbar('폴더가 생성되었습니다.', 'success');
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
        // 실패 시 응답값을 스낵바에 표시
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.statusMessage 
          || error.response?.data?.error 
          || JSON.stringify(error.response?.data)
          || '폴더 생성에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
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
        let response;
        if (this.renameItem.type === 'document') {
          response = await driveService.updateDocumentTitle(this.renameItem.id, { title: this.renameName });
        } else {
          response = await driveService.updateFolderName(this.renameItem.id, { name: this.renameName });
        }
        
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
        const errorMessage = error.response?.data?.message || error.response?.data?.statusMessage || error.response?.data?.error || '이름 변경에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
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
      this.stopAutoScroll();
    },
    
    // 테이블 드래그 오버 - 자동 스크롤 트리거
    onTableDragOver(e) {
      if (!this.draggingItem) return;
      
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const scrollThreshold = 100; // 스크롤 시작 거리 (픽셀)
      const maxSpeed = 15; // 최대 스크롤 속도
      
      // 상단 경계 근처
      if (y < scrollThreshold) {
        const distance = y;
        this.scrollSpeed = -maxSpeed * (1 - distance / scrollThreshold);
        this.startAutoScroll(container);
      }
      // 하단 경계 근처
      else if (y > rect.height - scrollThreshold) {
        const distance = rect.height - y;
        this.scrollSpeed = maxSpeed * (1 - distance / scrollThreshold);
        this.startAutoScroll(container);
      }
      // 중간 영역
      else {
        this.stopAutoScroll();
      }
    },
    
    // 테이블 드래그 리브 - 스크롤 멈춤
    onTableDragLeave(e) {
      // 테이블 컨테이너를 벗어났을 때만 멈춤
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        this.stopAutoScroll();
      }
    },
    
    // 자동 스크롤 시작
    startAutoScroll(container) {
      if (this.dragScrollInterval) return;
      
      this.dragScrollInterval = setInterval(() => {
        // v-data-table__wrapper가 스크롤 컨테이너
        const wrapper = container.querySelector('.v-data-table__wrapper');
        if (wrapper && this.scrollSpeed !== 0) {
          wrapper.scrollTop += this.scrollSpeed;
          
          // 스크롤이 끝에 도달하면 멈춤
          if (wrapper.scrollTop <= 0 && this.scrollSpeed < 0) {
            this.stopAutoScroll();
          } else if (wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight && this.scrollSpeed > 0) {
            this.stopAutoScroll();
          }
        }
      }, 16); // 약 60fps
    },
    
    // 자동 스크롤 멈춤
    stopAutoScroll() {
      if (this.dragScrollInterval) {
        clearInterval(this.dragScrollInterval);
        this.dragScrollInterval = null;
        this.scrollSpeed = 0;
      }
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
    
    // 정렬 처리
    handleSort(column) {
      if (this.sortBy === column) {
        // 같은 컬럼을 클릭하면 정렬 방향 토글
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        // 다른 컬럼을 클릭하면 새로 정렬
        this.sortBy = column;
        this.sortOrder = 'asc';
      }
    },
    
    // 날짜 문자열 파싱 (예: "2024.1.15" -> Date 객체)
    parseDateString(dateString) {
      if (!dateString || dateString === '-') return null;
      
      // "2024.1.15" 형식을 Date로 변환
      const parts = dateString.split('.');
      if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 월은 0부터 시작
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      
      // ISO 형식이나 다른 형식도 시도
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    },
    
    // 크기 문자열 파싱 (예: "1.5MB" -> 바이트)
    parseSizeString(sizeString) {
      if (!sizeString || sizeString === '-') return 0;
      
      const trimmed = sizeString.trim().toUpperCase();
      const match = trimmed.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/);
      
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = match[2] || 'B';
      
      switch (unit) {
        case 'KB':
          return value * 1024;
        case 'MB':
          return value * 1024 * 1024;
        case 'GB':
          return value * 1024 * 1024 * 1024;
        default:
          return value;
      }
    },

    // 메뉴 액션들 (per-row menu가 열려 있을 때 호출)
    canRename(item) {
      if (!item) return false;
      // 파일은 이름 변경 불가
      return item.type === 'folder' || item.type === 'document';
    },

    canDelete(item) {
      if (!item) return false;
      return item.type === 'folder' || item.type === 'document' || item.type === 'file';
    },

    openRenameFromMenu() {
      if (!this.canRename(this.actionTarget)) return;
      this.openRenameDialog(this.actionTarget);
    },

    deleteFromMenu() {
      if (!this.canDelete(this.actionTarget)) return;
      const target = this.actionTarget;
      this.deleteItem(target);
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
  background-color: white;
  display: flex;
  flex-direction: column;
}

.folder-tree-card,
.main-content-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

/* 필터 버튼 스타일 */
.filter-btn {
  min-width: auto !important;
  padding: 4px 16px !important;
  height: 32px !important;
  border-radius: 6px !important;
  text-transform: none !important;
  font-size: 13px !important;
  font-weight: 500;
  transition: all 0.2s ease !important;
  box-shadow: none !important;
  background-color: #f5f5f5 !important;
  color: #5f6368 !important;
}

.filter-btn:hover {
  background-color: #e8e8e8 !important;
}

.filter-btn-active {
  background-color: white !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
  color: #1976d2 !important;
  font-weight: 600;
}

/* 필터 메뉴 컨테이너 (v-menu content) */
.filter-menu-content {
  border-radius: 10px !important;
  overflow: hidden !important;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #e6e6e6;
}

/* 필터 메뉴 스타일 */
.filter-menu {
  padding: 2px 0 !important;
  min-width: 100px; /* narrower */
}

.filter-menu-item {
  min-height: 32px !important; /* tighter */
  padding: 6px 12px !important;
  transition: background-color 0.18s ease !important;
  font-size: 13px;
}

.filter-menu-item:hover {
  background-color: #f4f6f8 !important;
}

.filter-menu-item-active {
  background-color: #e8f0fe !important;
  color: #1967d2 !important;
}

.filter-menu .v-list-item__title {
  font-size: 13px !important;
}

.filter-menu .v-icon {
  font-size: 16px !important;
}

.filter-menu-item .v-list-item__icon {
  margin-right: 12px !important;
  min-width: 24px !important;
}

/* 테이블 헤더 스타일 */
.table-header-text {
  font-size: 13px;
  font-weight: 600;
  color: #5f6368;
  letter-spacing: 0.3px;
}

.clickable-header {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}

.clickable-header:hover {
  opacity: 0.7;
}

.drive-table :deep(thead) {
  background: linear-gradient(to bottom, #ffffff, #f5f5f5);
  border-bottom: 2px solid #d3d3d3;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.drive-table :deep(thead th) {
  font-weight: 600;
  color: #3c4043;
  padding: 14px 16px;
  border-bottom: 2px solid #d3d3d3;
  text-transform: none;
  background-color: transparent;
  position: relative;
  font-size: 13px;
}

.drive-table :deep(thead th:first-child) {
  padding-left: 24px;
}

.drive-table :deep(tbody td) {
  padding: 12px 16px;
  color: #202124;
  font-size: 14px;
}

/* 테이블 래퍼 및 컨테이너 */
.table-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}


.table-container {
  flex: 1;
  position: relative;
  min-height: 0;
}

/* v-data-table 전체 높이 설정 */
.table-container :deep(.v-data-table) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Vuetify fixed-header가 스크롤을 자동으로 처리 */

/* Vuetify fixed-header가 자동으로 처리하므로 추가 CSS 불필요 */

/* 테이블 스크롤바 스타일 - v-data-table__wrapper에 적용 */
.table-container :deep(.v-data-table__wrapper)::-webkit-scrollbar {
  width: 8px;
}

.table-container :deep(.v-data-table__wrapper)::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.table-container :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.table-container :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 페이지네이션 푸터 */
.pagination-footer {
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
  flex-shrink: 0;
}

.items-per-page-select {
  max-width: 80px;
}

.items-per-page-select :deep(.v-input__control) {
  min-height: 32px !important;
}

.items-per-page-select :deep(.v-select__selection) {
  font-size: 13px;
  color: #5f6368;
}

.pagination-info {
  font-size: 13px;
  color: #5f6368;
  font-weight: 500;
  min-width: 80px;
}

.pagination-controls {
  gap: 4px;
}

.pagination-btn {
  color: #5f6368 !important;
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
}

.pagination-btn:hover:not(.v-btn--disabled) {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.pagination-btn.v-btn--disabled {
  opacity: 0.3;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 4px;
}

.page-btn {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  color: #5f6368 !important;
  font-size: 13px !important;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s;
}

.page-btn:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.page-btn-active {
  background-color: #1976d2 !important;
  color: white !important;
}

.page-btn-active:hover {
  background-color: #1565c0 !important;
}

.page-ellipsis {
  padding: 0 8px;
  color: #9aa0a6;
  font-size: 13px;
  line-height: 32px;
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

/* Item Actions Menu (match +신규 menu) */
.action-menu-content {
  /* Stronger, layered shadow for better visibility */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12) !important;
  border: none !important;
  background: #ffffff !important;
  border-radius: 4px !important;
}

/* Remove shadow/border only for the inner list container */
.action-menu-list {
  box-shadow: none !important;
  border: none !important;
}

.new-item-menu .menu-item.danger {
  color: #e53935;
}

/* Hover emphasis for delete */
.new-item-menu .menu-item.danger:hover {
  background-color: rgba(229, 57, 53, 0.08);
  color: #d32f2f;
}

/* Action icon button - no border/background */
.action-icon-btn {
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
}
.action-icon-btn:hover {
  background: rgba(0,0,0,0.06) !important;
}
.action-icon-btn:focus,
.action-icon-btn:active {
  box-shadow: none !important;
  outline: none !important;
}
.action-icon-btn .v-btn__overlay { opacity: 0 !important; }
</style>

<style>
/* Global styles for overlay content appended to body */
.action-menu-content {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12) !important;
  border: none !important;
  background: #ffffff !important;
  border-radius: 4px !important;
}
</style>
