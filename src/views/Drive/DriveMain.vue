<template>
  <v-container fluid class="drive-container" :class="{ 'pa-0': !projectId, 'project-drive-container': projectId }">
    <div class="drive-layout">
      <!-- Left Sidebar - Folder Tree -->
      <div 
        v-if="!isSimplified"
        class="sidebar-col"
        :style="{ width: sidebarWidth + 'px', minWidth: '200px', maxWidth: '50%' }"
      >
        <v-card class="folder-tree-card" elevation="0" tile>
          <div class="sidebar-header pa-4">
            <h3 class="drive-root-title">{{ driveRootName }}</h3>
          </div>
          <v-divider></v-divider>
          
          <!-- 폴더 트리뷰 -->
          <v-treeview
            :items="folderTree"
            :open.sync="openFolders"
            :active.sync="activeFolder"
            :activatable="false"
            dense
            :open-on-click="false"
            transition
            class="folder-tree pa-2"
            item-key="id"
            item-text="name"
            item-title="name"
            item-children="children"
            :load-children="loadChildren"
            @update:active="onFolderSelect"
            @update:open="onTreeOpenUpdate"
          >
            <template v-slot:prepend="{ item }">
              <img 
                v-if="isTreeItemImage(item)" 
                :src="getTreeItemIconImage(item)" 
                class="tree-item-icon-image"
                alt=""
              />
              <v-icon 
                v-else 
                :color="getTreeItemIconColor(item)"
              >
                {{ getTreeItemIcon(item) }}
              </v-icon>
            </template>
            <!-- Vuetify 2: label slot / Vuetify 3: title slot -->
            <template v-slot:label="{ item }">
              <span 
                class="folder-label" 
                :class="{ 'drag-over-tree': dragOverTreeFolder && isSameTreeItem(dragOverTreeFolder, item) }"
                @click.stop.prevent="onTreeItemClick(item)"
                @dragover.prevent="onTreeDragOver($event, item)"
                @dragleave="onTreeDragLeave"
                @drop.prevent="onTreeDrop($event, item)"
              >{{ item.name }}</span>
            </template>
            <template v-slot:title="{ item }">
              <span 
                class="folder-label"
                :class="{ 'drag-over-tree': dragOverTreeFolder && isSameTreeItem(dragOverTreeFolder, item) }"
                @click.stop.prevent="onTreeItemClick(item)"
                @dragover.prevent="onTreeDragOver($event, item)"
                @dragleave="onTreeDragLeave"
                @drop.prevent="onTreeDrop($event, item)"
              >{{ item.name }}</span>
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
      </div>

      <!-- Resizer -->
      <div 
        v-if="!isSimplified"
        class="resizer"
        @mousedown="onResizerMouseDown"
        @touchstart="onResizerMouseDown"
      ></div>

      <!-- Main Content Area -->
      <div class="main-content-col">
        <v-card class="main-content-card" elevation="0" tile>
          <!-- Toolbar -->
          <v-toolbar flat color="white" class="px-4">
            <!-- 뒤로가기 버튼 (간소화 모드에서만) -->
            <v-btn
              v-if="isSimplified && currentFolderId"
              icon
              small
              @click="goBackToParent"
              class="mr-3"
            >
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            
            <v-toolbar-title class="text-h6">{{ currentFolderName }}</v-toolbar-title>
            <v-spacer></v-spacer>

            <!-- Type Filter -->
            <v-menu 
              v-if="!isSimplified"
              offset-y 
              :close-on-content-click="true" 
              content-class="filter-menu-content" 
              scroll-strategy="block"
            >
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
                  <template #prepend>
                    <v-icon small class="mr-3">mdi-filter-variant</v-icon>
                  </template>
                  전체
                </v-list-item>
                <v-list-item
                  @click="typeFilter = 'folder'"
                  :class="{ 'filter-menu-item-active': typeFilter === 'folder' }"
                  class="filter-menu-item"
                >
                  <template #prepend>
                    <v-icon small class="mr-3">mdi-folder</v-icon>
                  </template>
                  폴더
                </v-list-item>
                <v-list-item
                  @click="typeFilter = 'document'"
                  :class="{ 'filter-menu-item-active': typeFilter === 'document' }"
                  class="filter-menu-item"
                >
                  <template #prepend>
                    <v-icon small class="mr-3">mdi-file-document</v-icon>
                  </template>
                  문서
                </v-list-item>
                <v-list-item
                  @click="typeFilter = 'file'"
                  :class="{ 'filter-menu-item-active': typeFilter === 'file' }"
                  class="filter-menu-item"
                >
                  <template #prepend>
                    <v-icon small class="mr-3">mdi-file</v-icon>
                  </template>
                  파일
                </v-list-item>
              </v-list>
            </v-menu>

            <v-btn 
              outlined
              small 
              class="refresh-btn"
              @click="loadFolderContents(currentFolderId, currentRootType, currentRootId)"
            >
              <v-icon small left>mdi-refresh</v-icon>
              새로고침
            </v-btn>
            
            <!-- 신규 메뉴 -->
            <v-menu v-model="isNewItemMenuOpen" :close-on-content-click="true" offset-y>
              <template #activator="{ props }">
                <v-btn 
                  color="primary" 
                  elevation="0"
                  small 
                  class="new-btn"
                  v-bind="props"
                >
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
          <div v-if="!isSimplified" class="px-4 py-2">
            <v-breadcrumbs :items="breadcrumbs" class="pa-0" dense>
              <template v-slot:item="{ item }">
                <v-breadcrumbs-item
                  :disabled="item.disabled"
                  @click="navigateToBreadcrumb(item)"
                  class="breadcrumb-item"
                >
                  <v-icon v-if="item.icon" small class="mr-1">{{ item.icon }}</v-icon>
                  <span class="breadcrumb-text">{{ item.text }}</span>
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
            @dragover.prevent="onTableFileDragOver"
            @dragleave="onTableFileDragLeave"
            @drop.prevent="onTableFileDrop"
          >
            <!-- 파일 드래그 오버레이 (테이블 본문에만) -->
            <div v-if="isDraggingFiles" class="file-drag-overlay">
              <div class="file-drag-message">
                <v-icon size="64" color="#1976d2">mdi-cloud-upload</v-icon>
                <div class="file-drag-text">파일을 여기에 드롭하세요</div>
              </div>
            </div>
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
                :row-class="getRowClass"
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
                :class="{ 
                  'drag-over': dragOverItem && dragOverItem.id === item.id,
                  'highlighted-item': highlightItemId && (item.id === highlightItemId || item.documentId === highlightItemId || item.fileId === highlightItemId)
                }"
                :draggable="item.type !== 'PROJECT' && item.type !== 'STONE'"
                @click="handleItemClick(item)"
                @dragstart="onDragStart($event, item)"
                @dragend="onDragEnd"
                @dragover="onDragOver($event, item)"
                @dragleave="onDragLeave"
                @drop="onDrop($event, item)"
              >
                <img 
                  v-if="isItemImage(item)" 
                  :src="getItemIconImage(item)" 
                  class="item-icon-image mr-3"
                  alt=""
                />
                <v-icon 
                  v-else 
                  :color="getItemIconColor(item)" 
                  class="mr-3"
                >
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
                    <button class="menu-item" @click="openInfoFromMenu">
                      <v-icon small class="menu-item-icon">mdi-information-outline</v-icon>
                      <span>상세 정보</span>
                    </button>
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
              <div class="empty-folder-container">
                <div class="empty-folder-content">
                  <img 
                    src="@/assets/images/empty-folder.svg" 
                    alt="빈 폴더" 
                    class="empty-folder-image"
                  />
                  <div class="empty-folder-title">폴더가 비어있습니다</div>
                  <div class="empty-folder-subtitle">파일을 여기에 드래그 인 드롭하거나 <br>'신규' 버튼을 사용하세요</div>
                </div>
              </div>
            </template>
              </v-data-table>
            </div>
          </div>
        </v-card>
      </div>
    </div>

    <!-- Create Folder Dialog -->
    <v-dialog v-model="createFolderDialog" max-width="520" scroll-strategy="block" content-class="modern-dialog">
      <v-card class="create-dialog-card modern-modal-card">
        <v-card-title class="modern-modal-header">
          <div class="d-flex align-center">
            <div class="modern-icon-wrapper">
              <v-icon color="#1a73e8" size="24">mdi-folder-plus</v-icon>
            </div>
            <div class="ml-3">
              <div class="modern-modal-title">새 폴더 만들기</div>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="modern-modal-content">
          <v-text-field
            v-model="newFolderName"
            label="폴더 이름"
            filled
            rounded
            dense
            clearable
            counter="80"
            :maxlength="80"
            hide-details="auto"
            autofocus
            class="modern-text-field"
            hint="공백과 특수문자 사용을 최소화해주세요."
            persistent-hint
            @keyup.enter="createFolder"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="modern-modal-actions">
          <v-spacer></v-spacer>
          <v-btn 
            text 
            @click="createFolderDialog = false" 
            class="modern-cancel-btn" 
            :disabled="isCreatingFolder"
          >
            취소
          </v-btn>
          <v-btn 
            color="primary" 
            depressed 
            @click="createFolder" 
            :disabled="isCreatingFolder" 
            :loading="isCreatingFolder"
            class="modern-primary-btn"
          >
            만들기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rename Dialog -->
    <v-dialog v-model="renameDialog" max-width="520" scroll-strategy="block" content-class="modern-dialog">
      <v-card class="rename-dialog-card modern-modal-card">
        <v-card-title class="modern-modal-header">
          <div class="d-flex align-center">
            <div class="modern-icon-wrapper">
              <img 
                v-if="isItemImage(renameItem || {})" 
                :src="getItemIconImage(renameItem || {})" 
                class="item-icon-image"
                style="width: 24px; height: 24px;"
                alt=""
              />
              <v-icon 
                v-else 
                :color="getItemIconColor(renameItem || {})"
                size="24"
              >
                {{ getItemIcon(renameItem || {}) }}
              </v-icon>
            </div>
            <div class="ml-3">
              <div class="modern-modal-title text-truncate" style="max-width: 360px;">{{ renameItem?.name || '' }}</div>
              <div class="modern-modal-subtitle">이름 변경</div>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="modern-modal-content">
          <v-text-field
            v-model="renameName"
            label="새 이름"
            filled
            rounded
            dense
            clearable
            counter="80"
            :maxlength="80"
            hide-details="auto"
            autofocus
            class="modern-text-field"
            hint="공백과 특수문자 사용을 최소화해주세요."
            persistent-hint
            @keyup.enter="confirmRename"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="modern-modal-actions">
          <v-spacer></v-spacer>
          <v-btn 
            text 
            @click="renameDialog = false" 
            class="modern-cancel-btn" 
            :disabled="isRenaming"
          >
            취소
          </v-btn>
          <v-btn 
            color="primary" 
            depressed 
            @click="confirmRename" 
            :disabled="isRenaming" 
            :loading="isRenaming"
            class="modern-primary-btn"
          >
            변경
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="520" scroll-strategy="block" content-class="modern-dialog">
      <v-card class="delete-dialog-card modern-modal-card">
        <v-card-title class="modern-modal-header">
          <div class="d-flex align-center">
            <div class="modern-icon-wrapper delete-icon-wrapper">
              <img 
                v-if="isItemImage(deleteItem || {})" 
                :src="getItemIconImage(deleteItem || {})" 
                class="item-icon-image"
                style="width: 24px; height: 24px;"
                alt=""
              />
              <v-icon 
                v-else 
                color="#ea4335"
                size="24"
              >
                {{ getItemIcon(deleteItem || {}) }}
              </v-icon>
            </div>
            <div class="ml-3">
              <div class="modern-modal-title text-truncate" style="max-width: 360px;">{{ deleteItem?.name || '' }}</div>
              <div class="modern-modal-subtitle">삭제 확인</div>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="modern-modal-content">
          <v-alert type="warning" border="left" colored-border density="compact" class="mb-3 modern-alert">
            <div class="text-body-2">
              삭제하면 돌이킬 수 없습니다. 정말 <strong>"{{ deleteItem?.name }}"</strong>을(를) 삭제하시겠습니까?
            </div>
          </v-alert>
        </v-card-text>
        <v-card-actions class="modern-modal-actions">
          <v-spacer></v-spacer>
          <v-btn 
            text 
            @click="deleteDialog = false" 
            class="modern-cancel-btn" 
            :disabled="isDeleting"
          >
            취소
          </v-btn>
          <v-btn 
            color="error" 
            depressed 
            @click="confirmDelete" 
            :disabled="isDeleting" 
            :loading="isDeleting"
            class="modern-error-btn"
          >
            삭제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Document Dialog -->
    <v-dialog v-model="createDocumentDialog" max-width="520" scroll-strategy="block" content-class="modern-dialog">
      <v-card class="create-dialog-card modern-modal-card">
        <v-card-title class="modern-modal-header">
          <div class="d-flex align-center">
            <div class="modern-icon-wrapper">
              <v-icon color="#1a73e8" size="24">mdi-file-document-plus</v-icon>
            </div>
            <div class="ml-3">
              <div class="modern-modal-title">새 문서 만들기</div>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="modern-modal-content">
          <v-text-field
            v-model="newDocumentTitle"
            label="문서 제목"
            filled
            rounded
            dense
            clearable
            counter="80"
            :maxlength="80"
            hide-details="auto"
            autofocus
            class="modern-text-field"
            hint="공백과 특수문자 사용을 최소화해주세요."
            persistent-hint
            @keyup.enter="createDocument"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="modern-modal-actions">
          <v-spacer></v-spacer>
          <v-btn 
            text 
            @click="createDocumentDialog = false" 
            class="modern-cancel-btn" 
            :disabled="isCreatingDocument"
          >
            취소
          </v-btn>
          <v-btn 
            color="primary" 
            depressed 
            @click="createDocument" 
            :disabled="isCreatingDocument" 
            :loading="isCreatingDocument"
            class="modern-primary-btn"
          >
            만들기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Item Info Side Panel -->
    <v-navigation-drawer
      v-model="infoDialog"
      location="right"
      temporary
      width="400"
      class="info-side-panel"
    >
      <div class="info-panel-content">
        <div class="info-panel-header">
          <div class="d-flex align-center flex-grow-1">
            <div class="modern-icon-wrapper">
              <img 
                v-if="isItemImage(infoItem || {})" 
                :src="getItemIconImage(infoItem || {})" 
                class="item-icon-image"
                style="width: 24px; height: 24px;"
                alt=""
              />
              <v-icon 
                v-else 
                :color="getItemIconColor(infoItem || {})" 
                size="24"
              >
                {{ getItemIcon(infoItem || {}) }}
              </v-icon>
            </div>
            <div class="ml-3 flex-grow-1">
              <div class="modern-modal-title text-truncate">{{ infoItem?.name || '' }}</div>
              <div class="modern-modal-subtitle">상세 정보</div>
            </div>
          </div>
          <v-btn 
            icon 
            @click="infoDialog = false" 
            size="small"
            class="modern-close-btn"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="info-panel-body">
          <div v-if="isLoadingInfo" class="info-loading">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          </div>
          <div v-else-if="itemInfo" class="info-list-container">
            <div v-if="itemInfo.name" class="info-list-item">
              <div class="info-label">이름</div>
              <div class="info-value">{{ itemInfo.name }}</div>
            </div>
            
            <div 
              v-if="itemInfo.folderName || itemInfo.parentFolderName"
              class="info-list-item"
            >
              <div class="info-label">{{ infoItem?.type === 'folder' ? '상위 폴더' : '폴더' }}</div>
              <div class="info-value">{{ itemInfo.folderName || itemInfo.parentFolderName || '루트' }}</div>
            </div>
            
            <div 
              v-if="itemInfo.fileSize"
              class="info-list-item"
            >
              <div class="info-label">크기</div>
              <div class="info-value">{{ formatFileSize(itemInfo.fileSize) }}</div>
            </div>
            
            <div 
              v-if="itemInfo.creatorName"
              class="info-list-item"
            >
              <div class="info-label">생성자</div>
              <div class="info-value">{{ itemInfo.creatorName }}</div>
            </div>
            
            <div 
              v-if="itemInfo.createdAt"
              class="info-list-item"
            >
              <div class="info-label">생성일</div>
              <div class="info-value">{{ formatDateTime(itemInfo.createdAt) }}</div>
            </div>
            
            <div 
              v-if="itemInfo.updatedAt"
              class="info-list-item"
            >
              <div class="info-label">수정일</div>
              <div class="info-value">{{ formatDateTime(itemInfo.updatedAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- Upload Dialog -->
    <v-dialog v-model="uploadDialog" max-width="760" scroll-strategy="block" content-class="modern-dialog">
      <v-card class="modern-modal-card upload-dialog-card">
        <v-card-title class="modern-modal-header">
          <div class="d-flex align-center">
            <div class="modern-icon-wrapper">
              <v-icon color="#1a73e8" size="24">mdi-cloud-upload</v-icon>
            </div>
            <div class="ml-3">
              <div class="modern-modal-title">파일 업로드</div>
            </div>
          </div>
          <div class="d-flex align-center">
            <v-btn 
              text 
              class="modern-cancel-btn mr-2" 
              @click="clearSelectedFiles" 
              :disabled="selectedFiles.length === 0 || isUploading"
            >
              비우기
            </v-btn>
            <v-btn 
              color="primary" 
              depressed 
              @click="uploadSelectedFiles" 
              :disabled="selectedFiles.length === 0 || isUploading || uploadStatus.hasErrors" 
              :loading="isUploading"
              class="modern-primary-btn"
            >
              업로드
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="modern-modal-content">
          <!-- Upload Progress -->
          <div v-if="isUploading" class="upload-progress mb-4">
            <v-progress-linear
              indeterminate
              color="primary"
              height="4"
            ></v-progress-linear>
            <div class="text-center mt-2 text-body-2 grey--text">
              {{ selectedFiles.length }}개 파일 업로드 중...
            </div>
          </div>

          <!-- Upload Limits Info -->
          <div class="upload-limits-info mb-3">
            <div class="text-caption grey--text text--darken-1">
              <v-icon x-small class="mr-1">mdi-information-outline</v-icon>
              업로드 제한: 파일당 최대 50MB, 총 용량 최대 200MB, 최대 10개 파일
            </div>
          </div>

          <div
            class="upload-zone modern-upload-zone"
            :class="{ 'upload-zone-disabled': isUploading }"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <div class="upload-icon-wrapper">
              <v-icon size="56" color="#1a73e8">mdi-cloud-upload</v-icon>
            </div>
            <div class="upload-text-primary">파일을 여기에 드래그하거나</div>
            <v-btn 
              color="primary" 
              depressed
              class="mt-3 modern-primary-btn" 
              @click="$refs.fileInput.click()" 
              :disabled="isUploading"
            >
              파일 선택
            </v-btn>
            <input
              ref="fileInput"
              type="file"
              multiple
              style="display: none"
              @change="handleFileSelect"
              :disabled="isUploading"
            >
          </div>

          <!-- Upload Status/Warnings -->
          <div v-if="selectedFiles.length > 0" class="mt-3" :class="uploadStatus.hasErrors ? 'upload-status upload-status-error' : 'upload-status'">
            <div class="d-flex justify-space-between align-center">
              <div class="text-body-2">
                <span class="font-weight-600">{{ selectedFiles.length }}</span>개 파일 
                <span class="grey--text">({{ formatFileSize(totalSelectedSize) }})</span>
              </div>
              <div v-if="uploadStatus.hasErrors" class="text-caption error--text">
                <v-icon x-small class="mr-1">mdi-alert-circle</v-icon>
                {{ uploadStatus.message }}
              </div>
            </div>
          </div>

          <!-- Preview List -->
          <div v-if="selectedFiles.length && !isUploading" class="mt-4">
            <v-row dense>
              <v-col
                v-for="(f, idx) in selectedFiles"
                :key="f.key"
                cols="12" sm="6" md="4"
              >
                <v-card class="preview-card position-relative" outlined>
                  <v-card-text class="py-3 d-flex align-center">
                    <div class="preview-thumb mr-3 flex-shrink-0">
                      <v-img v-if="f.previewUrl" :src="f.previewUrl" cover width="56" height="56" class="rounded"></v-img>
                      <v-icon v-else size="56">{{ getPreviewIcon(f) }}</v-icon>
                    </div>
                    <div class="preview-text-content">
                      <div class="text-truncate font-weight-500">{{ f.file.name }}</div>
                      <div class="text-caption grey--text text--darken-1">{{ formatFileSize(f.file.size) }}</div>
                    </div>
                    <v-btn icon size="small" color="grey" variant="text" class="remove-btn-abs" @click="removeSelectedFile(idx)">
                      <v-icon small>mdi-close</v-icon>
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
          <div v-else-if="isUploading" class="mt-4 text-center py-4">
            <v-progress-circular
              indeterminate
              color="primary"
              size="48"
            ></v-progress-circular>
            <div class="mt-3 text-body-1 grey--text">업로드 중...</div>
          </div>
        </v-card-text>
        <v-card-actions class="modern-modal-actions">
          <v-spacer></v-spacer>
          <v-btn 
            text 
            @click="uploadDialog = false" 
            :disabled="isUploading"
            class="modern-cancel-btn"
          >
            닫기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 중복 파일 확인 다이얼로그 -->
    <v-dialog v-model="duplicateConfirmDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          <span>중복 파일 발견</span>
        </v-card-title>
        <v-card-text>
          <div class="mb-3">
            <strong>"{{ duplicateFileName }}"</strong> 파일이 이미 폴더에 존재합니다.
          </div>
          <div class="text-body-2 grey--text">
            이 파일을 건너뛰고 나머지 파일 업로드를 계속하시겠습니까?
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancelUpload">업로드 취소</v-btn>
          <v-btn color="primary" depressed @click="skipAndContinue">건너뛰고 계속</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import driveService from '@/services/driveService';
import { showSnackbar } from '@/services/snackbar';
import workspaceLogo from '@/assets/icons/logo/1_2.svg';
import projectIcon from '@/assets/icons/sidebar/project.svg';

export default {
  name: "DriveMain",
  props: {
    projectId: {
      type: String,
      default: null
    },
    stoneId: {
      type: [String, Number],
      default: null
    },
    disableRouting: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      loadingTree: false,
      currentFolderId: null,
      currentFolderName: '내 드라이브',
      currentRootType: null,
      currentRootId: null,
      rootName: null,  // 문서함 이름
      folderPath: [],  // 폴더 경로 [{ id, name }, ...]
      
      // 멱등성 보장을 위한 로딩 상태
      isCreatingFolder: false,
      isCreatingDocument: false,
      isRenaming: false,
      isUploading: false,
      
      // 폴더 트리
      folderTree: [],
      // 최초엔 트리 닫힘 상태. 첫 토글 시 API로 하위 폴더 로드
      openFolders: [],
      activeFolder: [],
      prevOpenFolders: [],
      treeInitializedForKey: '',
      folderCache: {},
      
      // 테이블 데이터
      headersBase: [
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
      deleteDialog: false,
      deleteItem: null,
      isDeleting: false,
      uploadDialog: false,
      selectedFiles: [], // { key, file, previewUrl }
      isUploading: false,
      
      // 상세 정보 모달
      infoDialog: false,
      infoItem: null,
      itemInfo: null,
      isLoadingInfo: false,
      
      // 드래그 앤 드롭
      draggingItem: null,
      dragOverItem: null,
      dragOverTreeFolder: null, // 트리뷰 드래그 오버 폴더
      dragScrollInterval: null,
      scrollSpeed: 0,
      isDraggingFiles: false, // 파일 드래그 중인지 여부
      
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

      // 보기 모드
      viewMode: 'list', // 'list' | 'grid'

      // 사이드바 너비 (픽셀)
      sidebarWidth: parseInt(localStorage.getItem('driveSidebarWidth') || '250', 10),
      isResizing: false,
      resizeStartX: 0,
      resizeStartWidth: 0,

      // 하이라이트할 아이템 ID (검색 결과에서 문서함 이동 시)
      highlightItemId: null,

      // 중복 파일 확인 다이얼로그
      duplicateConfirmDialog: false,
      duplicateFileName: '',
      duplicateFileIndex: -1,
      uploadCancelled: false,

    };
  },

  computed: {
    isSimplified() {
      // stoneId가 있으면 간소화 모드 (트리뷰, 브레드크럼, 정렬, 필터 숨김)
      return !!this.stoneId;
    },
    headers() {
      if (this.isSimplified) {
        // 간소화 모드: 크기 컬럼 제외
        return this.headersBase.filter(header => header.value !== 'size');
      }
      // 일반 모드: 모든 컬럼 표시
      return this.headersBase;
    },
    driveRootName() {
      // 사이드바 헤더는 type별로 고정
      const rt = this.currentRootType;
      if (rt === 'WORKSPACE') return '워크스페이스 문서함';
      if (rt === 'PROJECT') return '프로젝트 문서함';
      if (rt === 'STONE') return '스톤 문서함';
      return '문서함';
    },
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
    // 선택된 파일들의 총 크기
    totalSelectedSize() {
      return this.selectedFiles.reduce((sum, item) => sum + (item.file?.size || 0), 0);
    },
    // 업로드 상태 검증
    uploadStatus() {
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB
      const MAX_FILE_COUNT = 10;

      if (this.selectedFiles.length === 0) {
        return { hasErrors: false, message: '' };
      }

      // 파일 개수 체크
      if (this.selectedFiles.length > MAX_FILE_COUNT) {
        return {
          hasErrors: true,
          message: `최대 ${MAX_FILE_COUNT}개 파일까지 업로드 가능합니다.`
        };
      }

      // 총 용량 체크
      if (this.totalSelectedSize > MAX_TOTAL_SIZE) {
        return {
          hasErrors: true,
          message: `총 용량이 200MB를 초과합니다. (${this.formatFileSize(this.totalSelectedSize)})`
        };
      }

      // 개별 파일 크기 체크
      const oversizedFiles = this.selectedFiles.filter(item => (item.file?.size || 0) > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        return {
          hasErrors: true,
          message: `${oversizedFiles.length}개 파일이 50MB를 초과합니다.`
        };
      }

      return { hasErrors: false, message: '' };
    },
  },

  mounted() {
    console.log('[DriveMain] mounted. projectId:', this.projectId, 'stoneId:', this.stoneId);
    
    // 하이라이트할 아이템 ID 확인 (query parameter)
    this.highlightItemId = this.$route.query.highlightItemId || null;
    console.log('[DriveMain] mounted - highlightItemId 설정:', this.highlightItemId, 'query:', this.$route.query);
    
    // 컴포넌트가 완전히 렌더링된 후에 초기화 (페이지 새로고침 시 스크롤이 작동하도록)
    this.$nextTick(() => {
      this.$nextTick(() => {
        console.log('[DriveMain] mounted - $nextTick 완료, initializeDrive 호출 시작');
        // stoneId prop이 있으면 스톤 문서함 초기화
        if (this.stoneId) {
          this.initializeDrive(null, 'STONE', String(this.stoneId));
        } else if (this.projectId) {
          // projectId prop이 있으면 프로젝트 문서함 초기화
          this.initializeDrive(null, 'PROJECT', this.projectId);
        } else {
          // 일반 모드: route 기반 초기화
          console.log('[DriveMain] mounted. rootType/rootId:', this.$route.params?.rootType, this.$route.params?.rootId);
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
        }
      });
    });
    
    // 테이블 높이 계산
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
    
    // 리사이저 이벤트 리스너
    window.addEventListener('mousemove', this.onResizerMouseMove);
    window.addEventListener('mouseup', this.onResizerMouseUp);
    window.addEventListener('touchmove', this.onResizerMouseMove);
    window.addEventListener('touchend', this.onResizerMouseUp);
  },

  beforeDestroy() {
    // 컴포넌트 언마운트 시 자동 스크롤 정리
    this.stopAutoScroll();
    // resize 이벤트 리스너 제거
    window.removeEventListener('resize', this.updateTableHeight);
    // 리사이저 이벤트 리스너 제거
    window.removeEventListener('mousemove', this.onResizerMouseMove);
    window.removeEventListener('mouseup', this.onResizerMouseUp);
    window.removeEventListener('touchmove', this.onResizerMouseMove);
    window.removeEventListener('touchend', this.onResizerMouseUp);
  },

  watch: {
    '$route.params': {
      handler(newParams) {
        // stoneId 또는 projectId prop이 있으면 route 변경 무시
        if (this.stoneId || this.projectId) return;
        
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
    '$route.query': {
      handler(newQuery) {
        // 하이라이트할 아이템 ID 업데이트
        this.highlightItemId = newQuery.highlightItemId || null;
        // 파일이 이미 로드된 경우 하이라이트 처리
        if (this.highlightItemId && this.items.length > 0) {
          this.$nextTick(() => {
            this.highlightAndScrollToItem(this.highlightItemId);
          });
        }
      },
      deep: true
    },
    // stoneId 변경 시 재초기화
    stoneId(newStoneId, oldStoneId) {
      if (newStoneId && newStoneId !== oldStoneId) {
        this.initializeDrive(null, 'STONE', String(newStoneId));
      }
    },
    // projectId 변경 시 재초기화
    projectId(newProjectId, oldProjectId) {
      if (newProjectId && newProjectId !== oldProjectId) {
        this.initializeDrive(null, 'PROJECT', newProjectId);
      }
    },
    // 폴더 트리 확장 상태 변화에 따른 하위 폴더 지연 로딩
    openFolders(newOpen, oldOpen) {
      try {
        const prev = Array.isArray(oldOpen) ? oldOpen : [];
        const curr = Array.isArray(newOpen) ? newOpen : [];
        const newlyOpened = curr.filter(id => !prev.includes(id));
        if (newlyOpened.length === 0) return;
        newlyOpened.forEach((id) => {
          // 'root' 또는 실제 폴더에 대해 하위 폴더 로드
          this.ensureChildrenLoaded(id);
        });
      } catch (e) {
        console.error('[DriveMain] openFolders watch error:', e);
      }
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
    // 특정 노드의 children이 비어있으면 동적으로 로드
    async ensureChildrenLoaded(folderId) {
      try {
        console.log('[DriveMain] ensureChildrenLoaded start:', folderId);
        const targetNode = this.findNodeById(this.folderTree, folderId);
        if (!targetNode) return;
        // 이미 children이 채워져 있으면 스킵
        if (Array.isArray(targetNode.children) && targetNode.children.length > 0) return;
        // targetNode를 전달하여 루트 항목인 경우 rootType/rootId 사용
        const children = await this.loadFolderChildren(folderId, targetNode);
        // Vue 반응성 유지를 위해 새 배열 할당
        targetNode.children = children;
        this.$forceUpdate?.();
        console.log('[DriveMain] ensureChildrenLoaded →', folderId, children);
      } catch (error) {
        console.error('[DriveMain] ensureChildrenLoaded failed:', folderId, error);
      }
    },

    // Vuetify v-treeview lazy loader (shows expander before children exist)
    async loadChildren(item) {
      try {
        if (!item) return Promise.resolve();
        console.log('[DriveMain] loadChildren invoked for item:', item?.id, item?.name, 'isRoot:', item?.isRoot);
        // root or any folder id
        const folderId = item.id;
        // 이미 존재하면 스킵
        if (Array.isArray(item.children) && item.children.length > 0) return Promise.resolve();
        
        // 루트 항목인 경우 rootType과 rootId로 API 호출
        const children = await this.loadFolderChildren(folderId, item);
        item.children = children;
        this.$forceUpdate?.();
        console.log('[DriveMain] loadChildren mapped →', folderId, children);
      } catch (e) {
        console.error('[DriveMain] loadChildren error:', e);
        const errorMessage = e?.response?.data?.statusMessage || e?.response?.data?.message || e?.message || '권한이 없거나 폴더를 불러올 수 없습니다.';
        showSnackbar(errorMessage, 'error');
        // 에러 발생 시 해당 토글 닫기
        if (item && item.id) {
          const filtered = (Array.isArray(this.openFolders) ? this.openFolders : []).filter(id => id !== item.id);
          this.openFolders = [...filtered];
          this.prevOpenFolders = [...filtered];
          // children 비우고 강제 갱신
          item.children = [];
          this.$forceUpdate?.();
        }
      }
    },

    // 폴더 트리에서 id로 노드 찾기 (DFS)
    findNodeById(nodes, id) {
      if (!Array.isArray(nodes)) return null;
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = this.findNodeById(node.children || [], id);
        if (found) return found;
      }
      return null;
    },

    // 루트 타입/ID로 트리의 루트 항목 노드 찾기 (DFS, 어디에 있어도 탐색)
    findRootNodeBy(rootType, rootId) {
      if (!this.folderTree || !this.folderTree.length) return null;
      const equals = (a, b) => String(a) === String(b);
      const stack = [...this.folderTree];
      while (stack.length) {
        const node = stack.pop();
        if (node && node.isRoot && equals(node.rootType, rootType) && equals(node.rootId, rootId)) {
          return node;
        }
        if (node && Array.isArray(node.children) && node.children.length) {
          for (const child of node.children) stack.push(child);
        }
      }
      return null;
    },

    // 트리 아이템이 같은 항목인지 정확하게 비교 (isRoot 항목의 중복 방지)
    isSameTreeItem(item1, item2) {
      if (!item1 || !item2) return false;
      // id가 같으면 기본적으로 같음
      if (item1.id === item2.id) {
        // isRoot인 경우 rootType과 rootId도 확인하여 정확히 같은 루트인지 체크
        if (item1.isRoot && item2.isRoot) {
          return item1.rootType === item2.rootType && item1.rootId === item2.rootId;
        }
        return true;
      }
      return false;
    },

    // 특정 폴더가 다른 폴더의 하위 폴더인지 확인 (순환 이동 방지)
    isDescendantOf(folderId, ancestorId) {
      if (!folderId || !ancestorId || folderId === ancestorId) return false;
      
      const ancestorNode = this.findNodeById(this.folderTree, ancestorId);
      if (!ancestorNode) return false;
      
      // DFS로 하위에 해당 폴더가 있는지 확인
      const checkNode = (node) => {
        if (node.id === folderId) return true;
        if (!node.children || !Array.isArray(node.children)) return false;
        return node.children.some(child => checkNode(child));
      };
      
      return checkNode(ancestorNode);
    },

    // 트리에 폴더 추가
    addFolderToTree(folderId, folderName, parentId) {
      console.log('[DriveMain] addFolderToTree 호출:', { folderId, folderName, parentId });
      
      // 이미 존재하는지 확인 (중복 방지)
      const existingNode = this.findNodeById(this.folderTree, folderId);
      if (existingNode) {
        // 이미 존재하면 추가하지 않음 (중복 방지)
        console.log('[DriveMain] addFolderToTree: 이미 존재하는 폴더:', folderId);
        return;
      }

      const newFolder = {
        id: folderId,
        name: folderName,
        children: [], // 빈 배열로 초기화 (토글 표시를 위해)
      };

      // parentId가 null이거나 'root'이면 루트 하위에 추가
      const normalizedParentId = !parentId || parentId === 'root' ? 'root' : parentId;
      
      if (normalizedParentId === 'root') {
        const rootNode = this.findNodeById(this.folderTree, 'root');
        if (rootNode) {
          if (!rootNode.children) {
            rootNode.children = [];
          }
          // 중복 체크
          if (!rootNode.children.find(f => f.id === folderId)) {
          rootNode.children.push(newFolder);
            // Vue 반응성을 위해 배열을 새로 할당
            rootNode.children = [...rootNode.children];
            
          // 캐시에도 추가
          if (!this.folderCache['root']) {
            this.folderCache['root'] = [];
          }
            // 캐시에도 중복 체크
            if (!this.folderCache['root'].find(f => f.id === folderId)) {
          this.folderCache['root'].push(newFolder);
            }
            console.log('[DriveMain] addFolderToTree: 루트 하위에 폴더 추가 성공:', folderId);
          } else {
            console.log('[DriveMain] addFolderToTree: 루트 하위에 이미 존재:', folderId);
          }
        } else {
          console.error('[DriveMain] addFolderToTree: 루트 노드를 찾을 수 없습니다');
        }
      } else {
        // 특정 폴더 하위에 추가
        const parentNode = this.findNodeById(this.folderTree, normalizedParentId);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          // 중복 체크
          if (!parentNode.children.find(f => f.id === folderId)) {
          parentNode.children.push(newFolder);
            // Vue 반응성을 위해 배열을 새로 할당
            parentNode.children = [...parentNode.children];
            
          // 캐시에도 추가
            if (!this.folderCache[normalizedParentId]) {
              this.folderCache[normalizedParentId] = [];
            }
            // 캐시에도 중복 체크
            if (!this.folderCache[normalizedParentId].find(f => f.id === folderId)) {
              this.folderCache[normalizedParentId].push(newFolder);
            }
            console.log('[DriveMain] addFolderToTree: 폴더 하위에 추가 성공:', folderId, 'parent:', normalizedParentId);
          } else {
            console.log('[DriveMain] addFolderToTree: 폴더 하위에 이미 존재:', folderId);
          }
        } else {
          console.warn('[DriveMain] addFolderToTree: 부모 노드를 찾을 수 없습니다:', normalizedParentId);
        }
      }

      // Vue 반응성 유지
      this.$forceUpdate?.();
    },

    // 트리에서 폴더 제거
    removeFolderFromTree(folderId) {
      console.log('[DriveMain] [removeFolderFromTree] 시작:', { folderId });
      let removed = false;
      let removedFromParentId = null;
      
      // 루트 하위에서 제거
      const rootNode = this.findNodeById(this.folderTree, 'root');
      if (rootNode && rootNode.children) {
        const index = rootNode.children.findIndex(f => f.id === folderId);
        if (index !== -1) {
          rootNode.children.splice(index, 1);
          removed = true;
          removedFromParentId = 'root';
          console.log('[DriveMain] [removeFolderFromTree] 루트 하위에서 제거됨');
          // 캐시에서도 제거
          if (this.folderCache['root']) {
            const cacheIndex = this.folderCache['root'].findIndex(f => f.id === folderId);
            if (cacheIndex !== -1) {
              this.folderCache['root'].splice(cacheIndex, 1);
              console.log('[DriveMain] [removeFolderFromTree] 루트 캐시에서도 제거됨');
            }
          }
          this.$forceUpdate?.();
          console.log('[DriveMain] [removeFolderFromTree] 완료:', { folderId, removedFromParentId });
          return;
        }
      }

      // 다른 폴더 하위에서 제거 (재귀적으로 찾기)
      const removeFromNode = (nodes) => {
        if (!Array.isArray(nodes)) return false;
        for (const node of nodes) {
          if (node.children) {
            const index = node.children.findIndex(f => f.id === folderId);
            if (index !== -1) {
              node.children.splice(index, 1);
              removed = true;
              removedFromParentId = node.id;
              console.log('[DriveMain] [removeFolderFromTree] 폴더 하위에서 제거됨:', {
                fromParentId: node.id,
                fromParentName: node.name
              });
              // 캐시에서도 제거
              if (this.folderCache[node.id]) {
                const cacheIndex = this.folderCache[node.id].findIndex(f => f.id === folderId);
                if (cacheIndex !== -1) {
                  this.folderCache[node.id].splice(cacheIndex, 1);
                  console.log('[DriveMain] [removeFolderFromTree] 캐시에서도 제거됨:', node.id);
                }
              }
              this.$forceUpdate?.();
              return true;
            }
            if (removeFromNode(node.children)) {
              return true;
            }
          }
        }
        return false;
      };

      removeFromNode(this.folderTree);
      
      if (!removed) {
        console.warn('[DriveMain] [removeFolderFromTree] 폴더를 찾을 수 없음:', folderId);
      } else {
        console.log('[DriveMain] [removeFolderFromTree] 완료:', { folderId, removedFromParentId });
      }
    },

    // 트리에서 폴더 이동 (기존 위치에서 제거 후 새 위치에 추가)
    moveFolderInTree(folderId, newParentId, newParentNodeParam = null) {
      console.log('[DriveMain] [moveFolderInTree] 시작:', { folderId, newParentId, hasParentNodeParam: !!newParentNodeParam });
      
      // 이동할 폴더 노드 찾기
      const folderNode = this.findNodeById(this.folderTree, folderId);
      if (!folderNode) {
        console.warn('[DriveMain] [moveFolderInTree] 폴더 노드를 찾을 수 없습니다:', folderId);
        console.log('[DriveMain] [moveFolderInTree] 현재 트리 구조:', JSON.stringify(this.folderTree, null, 2));
        return false;
      }
      console.log('[DriveMain] [moveFolderInTree] 이동할 폴더 노드 찾음:', {
        id: folderNode.id,
        name: folderNode.name,
        hasChildren: !!folderNode.children,
        childrenCount: folderNode.children?.length || 0
      });

      // 새 위치에 이미 존재하는지 확인
      // newParentNodeParam이 제공되면 그것을 사용 (루트 노드의 id가 없을 때)
      let newParentNode = newParentNodeParam;
      if (!newParentNode) {
        if (!newParentId || newParentId === 'root') {
          newParentNode = this.findNodeById(this.folderTree, 'root');
        } else if (newParentId.includes(':')) {
          // rootType:rootId 형식인 경우 findRootNodeBy 사용
          const [rootType, rootId] = newParentId.split(':');
          newParentNode = this.findRootNodeBy(rootType, rootId);
          console.log('[DriveMain] [moveFolderInTree] rootType:rootId 형식으로 루트 노드 찾기:', {
            rootType,
            rootId,
            found: !!newParentNode
          });
        } else {
          newParentNode = this.findNodeById(this.folderTree, newParentId);
        }
      }
      
      console.log('[DriveMain] [moveFolderInTree] 새 부모 노드 찾기:', {
        newParentId,
        found: !!newParentNode,
        parentId: newParentNode?.id,
        parentName: newParentNode?.name,
        parentChildrenCount: newParentNode?.children?.length || 0
      });
      
      if (newParentNode) {
        // 새 위치에 이미 해당 폴더가 있는지 확인
        const existingInNewLocation = newParentNode.children?.find(f => f.id === folderId);
        if (existingInNewLocation) {
          // 이미 새 위치에 있으면 아무것도 하지 않음
          console.log('[DriveMain] [moveFolderInTree] 이미 새 위치에 존재합니다:', folderId);
          return true;
        }
      }

      // 기존 위치에서 제거 (참조 제거)
      let removed = false;
      let removedFromParentId = null;
      
      const removeFromNode = (nodes, parentNode) => {
        if (!Array.isArray(nodes)) return false;
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === folderId) {
            // 노드 제거
            nodes.splice(i, 1);
            removed = true;
            removedFromParentId = parentNode?.id || 'root';
            console.log('[DriveMain] [moveFolderInTree] 기존 위치에서 제거됨:', {
              fromParentId: removedFromParentId,
              fromParentName: parentNode?.name,
              parentNodeId: parentNode?.id,
              parentNodeRootType: parentNode?.rootType
            });
            // 캐시에서도 제거
            // 루트 노드인 경우 rootType:rootId 형식의 캐시 키 사용
            let cacheKey = removedFromParentId;
            if (parentNode && parentNode.isRoot && parentNode.rootType && parentNode.rootId) {
              cacheKey = `${parentNode.rootType}:${parentNode.rootId}`;
            }
            if (cacheKey && this.folderCache[cacheKey]) {
              const cacheIndex = this.folderCache[cacheKey].findIndex(f => f.id === folderId);
              if (cacheIndex !== -1) {
                this.folderCache[cacheKey].splice(cacheIndex, 1);
                console.log('[DriveMain] [moveFolderInTree] 캐시에서도 제거됨:', cacheKey);
              }
            }
            return true;
          }
          if (nodes[i].children && removeFromNode(nodes[i].children, nodes[i])) {
            return true;
          }
        }
        return false;
      };

      // 전체 트리에서 제거 시도 (프로젝트 문서함의 경우 루트 노드가 'root'가 아닐 수 있음)
      // folderTree는 배열이므로 모든 루트 노드를 확인
      for (const rootNode of this.folderTree) {
        if (rootNode.id === folderId) {
          // 루트 노드 자체는 이동할 수 없음 (이 경우는 발생하지 않아야 함)
          console.warn('[DriveMain] [moveFolderInTree] 루트 노드 자체는 이동할 수 없습니다:', folderId);
          continue;
        }
        if (rootNode.children) {
          // 루트 노드의 직접 자식에서 찾기
          const rootIndex = rootNode.children.findIndex(f => f.id === folderId);
          if (rootIndex !== -1) {
            rootNode.children.splice(rootIndex, 1);
            removed = true;
            removedFromParentId = rootNode.id || 'root';
            console.log('[DriveMain] [moveFolderInTree] 루트 하위에서 제거됨:', {
              rootNodeId: rootNode.id,
              rootNodeName: rootNode.name,
              rootType: rootNode.rootType
            });
            // 캐시에서도 제거
            let cacheKey = rootNode.id || 'root';
            if (rootNode.isRoot && rootNode.rootType && rootNode.rootId) {
              cacheKey = `${rootNode.rootType}:${rootNode.rootId}`;
            }
            if (this.folderCache[cacheKey]) {
              const cacheIndex = this.folderCache[cacheKey].findIndex(f => f.id === folderId);
              if (cacheIndex !== -1) {
                this.folderCache[cacheKey].splice(cacheIndex, 1);
                console.log('[DriveMain] [moveFolderInTree] 캐시에서도 제거됨:', cacheKey);
              }
            }
            break;
          }
          // 재귀적으로 하위 폴더에서 찾기
          if (removeFromNode(rootNode.children, rootNode)) {
            break;
          }
        }
      }
      
      if (!removed) {
        console.warn('[DriveMain] [moveFolderInTree] 기존 위치에서 폴더를 찾을 수 없음:', folderId);
      }

      // 새 위치에 추가 (이미 존재하지 않으면)
      if (newParentNode) {
        if (!newParentNode.children) {
          newParentNode.children = [];
        }
        // 중복 체크 후 추가
        if (!newParentNode.children.find(f => f.id === folderId)) {
          // 기존 노드의 children을 유지하면서 새 위치에 추가
          const folderToMove = {
            id: folderNode.id,
            name: folderNode.name,
            children: folderNode.children || []
          };
          newParentNode.children.push(folderToMove);
          console.log('[DriveMain] [moveFolderInTree] 새 위치에 추가됨:', {
            toParentId: newParentNode.id,
            toParentName: newParentNode.name,
            folderId: folderToMove.id,
            folderName: folderToMove.name,
            childrenCount: folderToMove.children?.length || 0
          });
          
          // 캐시에도 추가
          // 루트 노드인 경우 rootType:rootId 형식의 캐시 키 사용
          let cacheKey = !newParentId || newParentId === 'root' ? 'root' : newParentId;
          if (newParentNode && newParentNode.isRoot && newParentNode.rootType && newParentNode.rootId) {
            cacheKey = `${newParentNode.rootType}:${newParentNode.rootId}`;
          }
          if (!this.folderCache[cacheKey]) {
            this.folderCache[cacheKey] = [];
          }
          if (!this.folderCache[cacheKey].find(f => f.id === folderId)) {
            this.folderCache[cacheKey].push(folderToMove);
            console.log('[DriveMain] [moveFolderInTree] 캐시에도 추가됨:', cacheKey);
          }
        } else {
          console.log('[DriveMain] [moveFolderInTree] 새 위치에 이미 존재함 (중복 방지)');
        }
      } else {
        console.warn('[DriveMain] [moveFolderInTree] 새 부모 노드를 찾을 수 없어 추가하지 못함:', newParentId);
      }

      // Vue 반응성 유지
      this.$forceUpdate?.();
      console.log('[DriveMain] [moveFolderInTree] 완료:', {
        folderId,
        fromParent: removedFromParentId,
        toParent: newParentId,
        success: !!newParentNode
      });
      return true;
    },

    // 트리에서 폴더 이름 업데이트
    updateFolderNameInTree(folderId, newName) {
      const folderNode = this.findNodeById(this.folderTree, folderId);
      if (folderNode) {
        folderNode.name = newName;
        // 캐시에서도 모든 위치 업데이트 (여러 위치에 있을 수 있음)
        for (const cacheKey in this.folderCache) {
          if (Array.isArray(this.folderCache[cacheKey])) {
            this.folderCache[cacheKey].forEach(folder => {
              if (folder.id === folderId) {
                folder.name = newName;
              }
            });
          }
        }
        // Vue 반응성 유지
        this.$forceUpdate?.();
      }
    },

    // v-treeview의 @update:open 이벤트 핸들러 (즉각 반응 로딩)
    onTreeOpenUpdate(newOpen) {
      try {
        console.log('[DriveMain] @update:open', newOpen);
        const prev = Array.isArray(this.prevOpenFolders) ? this.prevOpenFolders : [];
        const curr = Array.isArray(newOpen) ? newOpen : [];
        const newlyOpened = curr.filter(id => !prev.includes(id));
        this.openFolders = curr;
        this.prevOpenFolders = [...curr];
        newlyOpened.forEach((id) => this.ensureChildrenLoaded(id));
      } catch (e) {
        console.error('[DriveMain] onTreeOpenUpdate error:', e);
      }
    },
    // 테이블 높이 업데이트
    updateTableHeight() {
      this.$nextTick(() => {
        const tableContainer = this.$refs.tableContainer;
        if (tableContainer && tableContainer instanceof HTMLElement) {
          this.tableHeight = tableContainer.clientHeight;
        }
      });
    },
    
    // 드라이브 초기화
    async initializeDrive(folderId, rootType, rootId) {
      // 현재 루트 정보 저장
      if (rootType && rootId) {
        this.currentRootType = rootType;
        this.currentRootId = rootId;
        // 루트 이름 가져오기
        try {
          const nameResponse = await driveService.getRootName(rootType, rootId);
          this.rootName = nameResponse.result || nameResponse.name || null;
        } catch (error) {
          console.error('루트 이름 가져오기 실패:', error);
          this.rootName = null;
        }
      }
      
      // folderId가 있으면 폴더 내용 로드
      if (folderId && rootType && rootId) {
        console.log(`${rootType} 루트의 폴더 초기화:`, rootId, folderId);
        // initializeDrive에서도 highlightItemId 확인
        if (this.$route.query.highlightItemId) {
          this.highlightItemId = this.$route.query.highlightItemId;
          console.log('[DriveMain] initializeDrive - highlightItemId 설정:', this.highlightItemId);
        }
        const key = `${rootType}:${rootId}`;
        // 같은 루트 내 폴더 이동 시 트리 재로딩을 건너뛰어 토글 상태 유지
        if (this.treeInitializedForKey !== key || !this.folderTree?.length) {
          await this.loadFolderTree();
          this.treeInitializedForKey = key;
        }
        await this.loadFolderContents(folderId, rootType, rootId);
        return;
      }
      
      // rootType과 rootId가 있으면 루트 API 사용
      if (rootType && rootId) {
        console.log(`${rootType} 루트 초기화:`, rootId);
        // initializeDrive에서도 highlightItemId 확인
        if (this.$route.query.highlightItemId) {
          this.highlightItemId = this.$route.query.highlightItemId;
          console.log('[DriveMain] initializeDrive (루트) - highlightItemId 설정:', this.highlightItemId);
        }
        
        const key = `${rootType}:${rootId}`;
        // 트리뷰는 고정 - 로딩 표시는 트리가 없을 때만
        try {
          this.loading = true;
          // 트리가 없을 때만 트리 로딩 표시
          if (!this.folderTree?.length) {
            this.loadingTree = true;
          }
          
          const response = await driveService.getContentsByRoot(rootType, rootId);
          
          if (response.result) {
            // 메인 콘텐츠 업데이트
            this.items = this.parseItems(response.result);
            this.currentFolderId = null;
            this.updateBreadcrumbs(null, response.result, rootType || this.currentRootType);
            
            // 하이라이트 스크롤 처리 (loadFolderContents와 동일한 로직)
            if (this.highlightItemId) {
              console.log('[DriveMain] initializeDrive (루트) - 하이라이트 스크롤 시도 시작');
              const targetItem = this.items.find(item => 
                item.id === this.highlightItemId || 
                item.documentId === this.highlightItemId || 
                item.fileId === this.highlightItemId
              );
              
              if (targetItem) {
                this.$nextTick(() => {
                  this.$nextTick(() => {
                    setTimeout(() => {
                      this.highlightAndScrollToItem(this.highlightItemId);
                    }, 100);
                  });
                });
              } else {
                this.$nextTick(() => {
                  setTimeout(() => {
                    this.highlightAndScrollToItem(this.highlightItemId);
                  }, 300);
                });
              }
            }
            
            // 트리뷰는 projectId/stoneId가 있으면 해당 루트부터, 없으면 워크스페이스부터
            // 같은 루트 내 이동 시 트리 재로딩을 건너뛰어 토글 상태 유지
            if (this.treeInitializedForKey !== key || !this.folderTree?.length) {
              await this.loadFolderTree();
              this.treeInitializedForKey = key;
            }
            // 트리는 그대로 유지 (메인 콘텐츠만 업데이트)
          } else {
            this.items = [];
            // 트리뷰는 projectId/stoneId가 있으면 해당 루트부터, 없으면 워크스페이스부터
            const key = `${rootType}:${rootId}`;
            if (this.treeInitializedForKey !== key || !this.folderTree?.length) {
              await this.loadFolderTree();
              this.treeInitializedForKey = key;
            }
          }
        } catch (error) {
          console.error('드라이브 초기화 실패:', error);
          
          // 접근 권한 에러 등의 경우 이전 페이지로 이동
          const errorMessage = error.response?.data?.statusMessage || '접근 권한이 없거나 문서함을 불러올 수 없습니다.';
          showSnackbar(errorMessage, { color: 'error' });
          
          // 모달 내부에서 사용되는 경우 라우팅하지 않음
          if (!this.disableRouting) {
            // 워크스페이스 드라이브 루트로 리디렉션
            const workspaceId = localStorage.getItem('selectedWorkspaceId');
            this.$router.replace({ 
              name: 'driveRoot',
              params: { 
                rootType: 'WORKSPACE',
                rootId: workspaceId
              }
            });
          }
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
    // projectId가 있으면 프로젝트 루트부터, stoneId가 있으면 스톤 루트부터, 없으면 워크스페이스 루트부터
    async loadFolderTree() {
      try {
        this.loadingTree = true;
        
        let rootType, rootId, rootName, rootFolder, treeKey;
        
        // 프로젝트 문서함인 경우
        if (this.projectId) {
          rootType = 'PROJECT';
          rootId = this.projectId;
          const projectNameResponse = await driveService.getRootName('PROJECT', rootId);
          rootName = projectNameResponse.result || projectNameResponse.name || '프로젝트 문서함';
          treeKey = `PROJECT:${rootId}`;
          
          // 프로젝트 루트 노드 생성 (id는 없을 수 있으므로 rootType:rootId 형식 사용)
          const projectRootId = `${rootType}:${rootId}`;
          rootFolder = {
            id: projectRootId,
            name: rootName,
            rootType: rootType,
            rootName: rootName,
            rootId: rootId,
            isRoot: true,
            children: [],
          };
        }
        // 스톤 문서함인 경우
        else if (this.stoneId) {
          rootType = 'STONE';
          rootId = String(this.stoneId);
          const stoneNameResponse = await driveService.getRootName('STONE', rootId);
          rootName = stoneNameResponse.result || stoneNameResponse.name || '스톤 문서함';
          treeKey = `STONE:${rootId}`;
          
          // 스톤 루트 노드 생성
          const stoneRootId = `${rootType}:${rootId}`;
          rootFolder = {
            id: stoneRootId,
            name: rootName,
            rootType: rootType,
            rootName: rootName,
            rootId: rootId,
            isRoot: true,
            children: [],
          };
        }
        // 워크스페이스 문서함인 경우 (기본)
        else {
          const workspaceId = localStorage.getItem('selectedWorkspaceId');
          if (!workspaceId) {
            console.error('워크스페이스 ID가 없습니다.');
            return;
          }
          rootType = 'WORKSPACE';
          rootId = workspaceId;
          const workspaceNameResponse = await driveService.getRootName('WORKSPACE', workspaceId);
          rootName = workspaceNameResponse.result || workspaceNameResponse.name || '워크스페이스 문서함';
          treeKey = `WORKSPACE:${workspaceId}`;
          
          rootFolder = {
            id: 'root',
            name: rootName,
            rootType: rootType,
            rootName: rootName,
            rootId: rootId,
            children: [],
          };
        }

        console.log('[DriveMain] loadFolderTree → rootFolder:', rootFolder);
        // 트리뷰는 고정 - 트리가 없거나 비어있을 때만 생성
        if (!this.folderTree?.length) {
          this.folderTree = [rootFolder];
          this.treeInitializedForKey = treeKey;
        } else {
          // 트리가 있으면 루트 정보로 업데이트
          const rootNodeId = rootType === 'WORKSPACE' ? 'root' : `${rootType}:${rootId}`;
          const existingRoot = this.findNodeById(this.folderTree, rootNodeId) || 
                             (rootType !== 'WORKSPACE' ? this.findRootNodeBy(rootType, rootId) : null) ||
                             this.findNodeById(this.folderTree, 'root');
          
          if (existingRoot) {
            existingRoot.name = rootName;
            existingRoot.rootType = rootType;
            existingRoot.rootName = rootName;
            existingRoot.rootId = rootId;
            if (rootType !== 'WORKSPACE') {
              existingRoot.isRoot = true;
              if (existingRoot.id !== rootNodeId) {
                existingRoot.id = rootNodeId;
              }
            }
          } else {
            // 기존 루트를 찾을 수 없으면 새로 생성
            this.folderTree = [rootFolder];
            this.treeInitializedForKey = treeKey;
          }
        }
        // 트리 재로딩 시에도 열려있던 토글 유지
        if (Array.isArray(this.prevOpenFolders) && this.prevOpenFolders.length) {
          this.openFolders = [...this.prevOpenFolders];
        }
      } catch (error) {
        console.error('폴더 트리 로드 실패:', error);
      } finally {
        this.loadingTree = false;
      }
    },

    // 하위 폴더들 로드 (폴더만, 파일 제외)
    // item이 루트 항목이면 rootType과 rootId를 사용하여 API 호출
    async loadFolderChildren(folderId, item = null) {
      try {
        console.log('[DriveMain] loadFolderChildren called. folderId =', folderId, 'item:', item);
        
        // 캐시 키 생성: 루트 항목인 경우 rootType:rootId 사용, 일반 폴더는 folderId 사용
        let cacheKey = folderId;
        if (item && item.isRoot && item.rootType && item.rootId) {
          cacheKey = `${item.rootType}:${item.rootId}`;
        }
        
        if (this.folderCache[cacheKey]) {
          console.log('[DriveMain] loadFolderChildren cache hit for', cacheKey, '→', this.folderCache[cacheKey]);
          return this.folderCache[cacheKey];
        }

        let response;
        const folders = [];

        // 루트 항목인 경우 (folderName이 null인 항목의 토글)
        if (item && item.isRoot && item.rootType && item.rootId) {
          console.log('[DriveMain] fetching root child folders via getFoldersByRoot', { rootType: item.rootType, rootId: item.rootId });
          response = await driveService.getFoldersByRoot(item.rootType, item.rootId);
          console.log('[DriveMain] getFoldersByRoot response:', response);
          const items = Array.isArray(response?.result) ? response.result : [];
          for (const f of items) {
            // folderName이 null이면 rootName 사용 (루트 항목)
            const isRootItem = !f.folderName || f.folderName === null;
            const folderName = isRootItem && f.rootName ? f.rootName : (f.folderName || f.name);
            
            const folder = {
              id: f.folderId || f.id,
              name: folderName,
              children: [],
            };
            
            // folderName이 null이고 rootName이 있으면 루트 정보 추가
            if (isRootItem && f.rootName) {
              folder.rootType = f.rootType;
              folder.rootName = f.rootName;
              folder.rootId = f.rootId;
              folder.isRoot = true;
            }
            // 일반 폴더도 rootType과 rootId가 있으면 저장 (트리뷰 클릭 시 사용)
            else if (f.rootType && f.rootId) {
              folder.rootType = f.rootType;
              folder.rootId = f.rootId;
            }
            
            folders.push(folder);
          }
        }
        // 최상위 루트(워크스페이스) 또는 일반 폴더
        else if (!folderId || folderId === 'root' || this.isWorkspaceId(folderId)) {
          const workspaceId = localStorage.getItem('selectedWorkspaceId');
          if (!workspaceId) {
            console.error('워크스페이스 ID가 없습니다.');
            return [];
          }
          console.log('[DriveMain] fetching root child folders via getFoldersByRoot (WORKSPACE)', { rootType: 'WORKSPACE', rootId: workspaceId });
          response = await driveService.getFoldersByRoot('WORKSPACE', workspaceId);
          console.log('[DriveMain] getFoldersByRoot response:', response);
          const items = Array.isArray(response?.result) ? response.result : [];
          for (const f of items) {
            // folderName이 null이면 rootName 사용 (루트 항목)
            const isRootItem = !f.folderName || f.folderName === null;
            const folderName = isRootItem && f.rootName ? f.rootName : (f.folderName || f.name);
            
            const folder = {
              id: f.folderId || f.id,
              name: folderName,
              children: [],
            };
            
            // folderName이 null이고 rootName이 있으면 루트 정보 추가
            if (isRootItem && f.rootName) {
              folder.rootType = f.rootType;
              folder.rootName = f.rootName;
              folder.rootId = f.rootId;
              folder.isRoot = true;
            }
            // 일반 폴더도 rootType과 rootId가 있으면 저장 (트리뷰 클릭 시 사용)
            else if (f.rootType && f.rootId) {
              folder.rootType = f.rootType;
              folder.rootId = f.rootId;
            }
            
            folders.push(folder);
          }
        }
        // 그 이후 단계: 폴더 기준 하위 폴더 조회
        else {
          console.log('[DriveMain] fetching child folders via getChildFolders', { folderId });
          response = await driveService.getChildFolders(folderId);
          console.log('[DriveMain] getChildFolders response:', response);
          const items = Array.isArray(response?.result) ? response.result : [];
          for (const f of items) {
            // folderName이 null이면 rootName 사용 (루트 항목)
            const isRootItem = !f.folderName || f.folderName === null;
            const folderName = isRootItem && f.rootName ? f.rootName : (f.folderName || f.name);
            
            const folder = {
              id: f.folderId || f.id,
              name: folderName,
              children: [],
            };
            
            // folderName이 null이고 rootName이 있으면 루트 정보 추가
            if (isRootItem && f.rootName) {
              folder.rootType = f.rootType;
              folder.rootName = f.rootName;
              folder.rootId = f.rootId;
              folder.isRoot = true;
            }
            // 일반 폴더도 rootType과 rootId가 있으면 저장 (트리뷰 클릭 시 사용)
            else if (f.rootType && f.rootId) {
              folder.rootType = f.rootType;
              folder.rootId = f.rootId;
            }
            
            folders.push(folder);
          }
        }

        console.log('[DriveMain] mapped folders for', cacheKey, '→', folders);
        this.folderCache[cacheKey] = folders;
        return folders;
      } catch (error) {
        console.error(`폴더 로드 실패 ${folderId}:`, error);
        const errorMessage = error?.response?.data?.statusMessage || error?.response?.data?.message || error?.message || '권한이 없거나 폴더를 불러올 수 없습니다.';
        showSnackbar(errorMessage, 'error');
        // 호출자가 특정 토글(루트/폴더)이면 닫기 시도
        const targetId = (item && item.id) ? item.id : folderId;
        if (targetId) {
          const filtered = (Array.isArray(this.openFolders) ? this.openFolders : []).filter(id => id !== targetId);
          this.openFolders = [...filtered];
          this.prevOpenFolders = [...filtered];
          this.$forceUpdate?.();
        }
        return [];
      }
    },

    // 트리에서 폴더 선택 - 폴더 정보에서 rootType과 rootId 가져와서 사용
    async onFolderSelect(selectedIds) {
      if (selectedIds && selectedIds.length > 0) {
        const folderId = selectedIds[0];
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        
        if (!workspaceId) {
          console.error('워크스페이스 ID가 없습니다.');
          return;
        }
        
        if (folderId === 'root') {
          // 워크스페이스 루트로 이동
          this.$router.push({ 
            name: 'driveRoot',
            params: { 
              rootType: 'WORKSPACE',
              rootId: workspaceId
            }
          });
        } else {
          // 트리에서 폴더 노드 찾아서 rootType과 rootId 확인
          const folderNode = this.findNodeById(this.folderTree, folderId);
          if (folderNode && folderNode.rootType && folderNode.rootId) {
            // 트리 노드에 rootType과 rootId가 있으면 바로 사용
            this.$router.push({
              name: 'driveFolder',
              params: { 
                rootType: folderNode.rootType,
                rootId: folderNode.rootId,
                folderId: folderId 
              }
            });
          } else {
            // 없으면 폴더 정보 조회 (fallback)
            try {
              const folderInfo = await driveService.getFolderInfo(folderId);
              if (folderInfo.result && folderInfo.result.rootType && folderInfo.result.rootId) {
                this.$router.push({
                  name: 'driveFolder',
                  params: { 
                    rootType: folderInfo.result.rootType,
                    rootId: folderInfo.result.rootId,
                    folderId: folderId 
                  }
                });
              } else {
                // 없으면 워크스페이스로 기본 설정
                this.$router.push({
                  name: 'driveFolder',
                  params: { 
                    rootType: 'WORKSPACE',
                    rootId: workspaceId,
                    folderId: folderId 
                  }
                });
              }
            } catch (error) {
              console.error('폴더 정보 조회 실패:', error);
              // 에러 발생 시 워크스페이스로 기본 설정
              this.$router.push({
                name: 'driveFolder',
                params: { 
                  rootType: 'WORKSPACE',
                  rootId: workspaceId,
                  folderId: folderId 
                }
              });
            }
          }
        }
      }
    },

    // 폴더 내용 로드 (폴더, 파일, 문서 모두)
    async loadFolderContents(folderId, rootType, rootId) {
      try {
        this.loading = true;
        
        // 라우팅 시 highlightItemId가 query에 있으면 다시 설정
        if (this.$route.query.highlightItemId) {
          this.highlightItemId = this.$route.query.highlightItemId;
          console.log('[DriveMain] loadFolderContents - highlightItemId 설정:', this.highlightItemId);
        }
        
        let response;
        
        // rootType과 rootId 저장 (폴더 생성 시 필요)
        if (rootType && rootId) {
          // 루트 변경 여부 확인 (이전 루트와 다르면 이름도 새로 가져옴)
          const isRootChanged = (
            this.currentRootType !== rootType || this.currentRootId !== rootId
          );

          this.currentRootType = rootType;
          this.currentRootId = rootId;

          if (isRootChanged || !this.rootName) {
            try {
              const nameResponse = await driveService.getRootName(rootType, rootId);
              this.rootName = nameResponse.result || nameResponse.name || null;
            } catch (error) {
              console.error('루트 이름 가져오기 실패:', error);
              this.rootName = null;
            }
          }
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
            
            // 현재 폴더 정보도 가져와서 folderPath에 추가
            try {
              const folderInfo = await driveService.getFolderInfo(folderId);
              if (folderInfo.result) {
                // 현재 폴더가 이미 folderPath에 있는지 확인 (같은 ID인지 체크)
                const currentFolderExists = this.folderPath.some(f => f.id === folderInfo.result.folderId);
                if (!currentFolderExists) {
                  this.folderPath.push({
                    id: folderInfo.result.folderId,
                    name: folderInfo.result.folderName
                  });
                }
              }
            } catch (error) {
              console.error('현재 폴더 정보 조회 실패:', error);
            }
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
          
          // items에 ancestors가 없었지만 folderId가 있는 경우, 폴더 정보를 가져와서 folderPath 설정
          if (folderId && items.length > 0 && (!items[0].ancestors || this.folderPath.length === 0)) {
            try {
              const folderInfo = await driveService.getFolderInfo(folderId);
              if (folderInfo.result && folderInfo.result.ancestors) {
                const ancestorsArray = folderInfo.result.ancestors;
                this.folderPath = ancestorsArray.slice().reverse().map(ancestor => ({
                  id: ancestor.folderId,
                  name: ancestor.folderName
                }));
                // 현재 폴더도 추가
                this.folderPath.push({
                  id: folderInfo.result.folderId,
                  name: folderInfo.result.folderName
                });
              }
            } catch (error) {
              console.error('폴더 정보 조회 실패:', error);
            }
          }
          
          // 브레드크럼 업데이트
          if (folderId || items.length > 0) {
            this.updateBreadcrumbs(folderId, items, rootType || this.currentRootType);
          }
          
          // 하이라이트할 아이템이 있으면 하이라이트 및 스크롤 처리
          // items가 업데이트되고 DOM이 완전히 렌더링될 때까지 여러 번의 nextTick과 딜레이 사용
          console.log('[DriveMain] loadFolderContents 완료 - highlightItemId 체크:', this.highlightItemId, 'items 개수:', this.items.length);
          if (this.highlightItemId) {
            console.log('[DriveMain] 하이라이트 스크롤 시도 시작 - highlightItemId:', this.highlightItemId);
            // items에 하이라이트할 항목이 있는지 먼저 확인
            const targetItem = this.items.find(item => 
              item.id === this.highlightItemId || 
              item.documentId === this.highlightItemId || 
              item.fileId === this.highlightItemId
            );
            
            if (targetItem) {
              // 데이터가 있으면 DOM 렌더링을 기다린 후 스크롤
              this.$nextTick(() => {
                this.$nextTick(() => {
                  // v-data-table 렌더링을 위한 추가 딜레이
                  setTimeout(() => {
                    this.highlightAndScrollToItem(this.highlightItemId);
                  }, 100);
                });
              });
            } else {
              // 데이터가 없으면 재시도 로직에 맡김
              this.$nextTick(() => {
                setTimeout(() => {
                  this.highlightAndScrollToItem(this.highlightItemId);
                }, 300);
              });
            }
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
        // STONE/PROJECT 타입이거나 folderName이 없고 rootName이 있으면 루트 항목으로 처리
        const isRootItem = type === 'STONE' || type === 'PROJECT' || (!item.folderName && item.rootName);
        const name = isRootItem ? (item.rootName || item.name || 'Unnamed') : (item.name || 'Unnamed');
        // creatorName이 우선, 없으면 createBy(ID) 사용
        const owner = item.creatorName || item.createBy || '-';
        const modified = this.formatDate(item.updateAt || item.updatedAt);
        
        const parsedItem = {
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
        };
        
        // STONE/PROJECT 타입이거나 folderName이 없고 rootName이 있으면 루트 정보 추가
        if (isRootItem) {
          parsedItem.rootType = item.rootType;
          parsedItem.rootName = item.rootName;
          parsedItem.rootId = item.rootId;
          parsedItem.isRoot = true; // 루트 항목임을 표시
        }
        // 모든 아이템(폴더, 파일, 문서)에 rootType과 rootId가 있으면 저장 (백엔드에서 제공하는 경우)
        if (item.rootType && item.rootId) {
          parsedItem.rootType = item.rootType;
          parsedItem.rootId = item.rootId;
        }
        
        items.push(parsedItem);
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
      const rootName = this.rootName || this.driveRootName || "문서함";
      
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

    // 뒤로가기 (간소화 모드)
    goBackToParent() {
      if (!this.currentFolderId) return;
      
      // breadcrumbs에서 현재 폴더의 바로 위 항목 찾기
      if (this.breadcrumbs && this.breadcrumbs.length > 1) {
        // 마지막 항목은 현재 폴더이므로, 그 전 항목이 상위 폴더
        const parentItem = this.breadcrumbs[this.breadcrumbs.length - 2];
        if (parentItem) {
          this.navigateToBreadcrumb(parentItem);
          return;
        }
      }
      
      // breadcrumbs가 없으면 루트로 이동
      if (this.stoneId) {
        this.loadFolderContents(null, 'STONE', String(this.stoneId));
      } else if (this.projectId) {
        this.loadFolderContents(null, 'PROJECT', this.projectId);
      }
    },

    // 브레드크럼 네비게이션
    navigateToBreadcrumb(item) {
      if (item.disabled) return;
      
      // stoneId가 있으면 라우팅 대신 내부 상태만 업데이트
      if (this.stoneId) {
        if (!item.folderId) {
          this.loadFolderContents(null, 'STONE', String(this.stoneId));
        } else {
          this.loadFolderContents(item.folderId, 'STONE', String(this.stoneId));
        }
        return;
      }
      
      // projectId가 있으면 라우팅 대신 내부 상태만 업데이트
      if (this.projectId) {
        if (!item.folderId) {
          this.loadFolderContents(null, 'PROJECT', this.projectId);
        } else {
          this.loadFolderContents(item.folderId, 'PROJECT', this.projectId);
        }
        return;
      }
      
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

    // 폴더 트리 항목 클릭 시 해당 폴더로 이동
    // 트리뷰는 항상 워크스페이스로 고정되어 있으므로, 클릭 시 워크스페이스 폴더로 이동
    async onTreeItemClick(item) {
      if (!item) return;
      
      console.log('[DriveMain] [onTreeItemClick] 클릭된 아이템:', {
        id: item.id,
        name: item.name,
        rootType: item.rootType,
        rootId: item.rootId,
        isRoot: item.isRoot,
        projectId: this.projectId,
        stoneId: this.stoneId
      });
      
      // 트리뷰는 항상 워크스페이스로 고정되어 있음
      const workspaceId = localStorage.getItem('selectedWorkspaceId');
      if (!workspaceId) {
        console.error('워크스페이스 ID가 없습니다.');
        return;
      }
      
      // 루트 항목 클릭 처리
      if (item.id === 'root' || item.rootName || item.isRoot) {
        // 루트 항목이고 rootType/rootId가 있으면 처리
        if (item.isRoot && item.rootType && item.rootId) {
          // stoneId가 있으면 라우팅 대신 내부 상태만 업데이트
          if (this.stoneId) {
            // 현재 스톤 문서함이면 내부 상태만 업데이트
            if (item.rootType === 'STONE' && item.rootId === String(this.stoneId)) {
              this.loadFolderContents(null, 'STONE', String(this.stoneId));
              return;
            }
            // 다른 루트 항목이면 라우팅
            this.$router.push({ 
              name: 'driveRoot',
              params: { 
                rootType: item.rootType,
                rootId: item.rootId
              }
            });
            return;
          }
          
          // projectId가 있으면 라우팅 대신 내부 상태만 업데이트
          if (this.projectId) {
            // 프로젝트 문서함 안에서 STONE/PROJECT 루트 항목 클릭 시 내부 상태만 업데이트
            if (item.rootType === 'STONE' || item.rootType === 'PROJECT') {
              this.loadFolderContents(null, item.rootType, item.rootId);
              return;
            }
            // 현재 프로젝트 문서함이면 내부 상태만 업데이트
            if (item.rootType === 'PROJECT' && item.rootId === this.projectId) {
              this.loadFolderContents(null, 'PROJECT', this.projectId);
              return;
            }
            // 다른 루트 항목이면 라우팅
            this.$router.push({ 
              name: 'driveRoot',
              params: { 
                rootType: item.rootType,
                rootId: item.rootId
              }
            });
            return;
          }
          
          // projectId/stoneId가 없으면 라우팅
          this.$router.push({ 
            name: 'driveRoot',
            params: { 
              rootType: item.rootType,
              rootId: item.rootId
            }
          });
          return;
        }
        
        // stoneId가 있으면 라우팅 대신 내부 상태만 업데이트
        if (this.stoneId) {
          this.loadFolderContents(null, 'STONE', String(this.stoneId));
          return;
        }
        
        // projectId가 있으면 라우팅 대신 내부 상태만 업데이트
        if (this.projectId) {
          this.loadFolderContents(null, 'PROJECT', this.projectId);
          return;
        }
        
        // 워크스페이스 루트로 이동
        this.$router.push({ 
          name: 'driveRoot',
          params: { 
            rootType: 'WORKSPACE',
            rootId: workspaceId
          }
        });
        return;
      }
      
      // 일반 폴더 클릭 처리
      // stoneId가 있으면 라우팅 대신 내부 상태만 업데이트
      if (this.stoneId) {
        // 트리는 스톤이지만 현재 문서함이 STONE이므로 STONE으로 이동하지 않음
        // 대신 워크스페이스 폴더로 이동
        this.$router.push({
          name: 'driveFolder',
          params: {
            rootType: 'WORKSPACE',
            rootId: workspaceId,
            folderId: item.id
          }
        });
        return;
      }
      
      // projectId가 있으면 라우팅 대신 내부 상태만 업데이트
      if (this.projectId) {
        // 트리뷰의 폴더를 클릭했을 때 - item에 rootType과 rootId가 있으면 해당 루트로 이동
        // rootType이 없으면 currentRootType을 사용 (현재 열려있는 문서함)
        const folderRootType = item.rootType || this.currentRootType;
        const folderRootId = item.rootId || this.currentRootId;
        
        console.log('[DriveMain] [onTreeItemClick] 폴더 이동 결정:', {
          itemRootType: item.rootType,
          itemRootId: item.rootId,
          currentRootType: this.currentRootType,
          currentRootId: this.currentRootId,
          folderRootType,
          folderRootId
        });
        
        if (folderRootType && folderRootId) {
          // 프로젝트 루트의 하위 폴더면 프로젝트 문서함 안에서 이동
          if (folderRootType === 'PROJECT' && folderRootId === this.projectId) {
            this.loadFolderContents(item.id, 'PROJECT', this.projectId);
          } 
          // STONE 루트의 하위 폴더면 프로젝트 문서함 안에서 스톤 폴더로 이동 (내부 상태만 업데이트)
          else if (folderRootType === 'STONE') {
            this.loadFolderContents(item.id, 'STONE', folderRootId);
          } 
          // 다른 프로젝트나 워크스페이스 폴더면 해당 문서함으로 이동 (라우팅)
          else {
            this.$router.push({
              name: 'driveFolder',
              params: {
                rootType: folderRootType,
                rootId: folderRootId,
                folderId: item.id
              }
            });
          }
        } else {
          // rootType이 없으면 현재 프로젝트의 폴더로 가정하고 프로젝트 문서함 안에서 이동
          this.loadFolderContents(item.id, 'PROJECT', this.projectId);
        }
        return;
      }
      
      // 일반 폴더 - item에 rootType과 rootId가 있으면 바로 사용, 없으면 API 호출
      if (item.rootType && item.rootId) {
        // 트리뷰 아이템에 rootType과 rootId가 있으면 바로 사용
        this.$router.push({
          name: 'driveFolder',
          params: { 
            rootType: item.rootType,
            rootId: item.rootId,
            folderId: item.id 
          }
        });
      } else {
        // 없으면 폴더 정보 조회 (fallback)
        try {
          const folderInfo = await driveService.getFolderInfo(item.id);
          if (folderInfo.result && folderInfo.result.rootType && folderInfo.result.rootId) {
            this.$router.push({
              name: 'driveFolder',
              params: { 
                rootType: folderInfo.result.rootType,
                rootId: folderInfo.result.rootId,
                folderId: item.id 
              }
            });
          } else {
            // 없으면 워크스페이스로 기본 설정
            this.$router.push({
              name: 'driveFolder',
              params: { 
                rootType: 'WORKSPACE',
                rootId: workspaceId,
                folderId: item.id 
              }
            });
          }
        } catch (error) {
          console.error('폴더 정보 조회 실패:', error);
          // 에러 발생 시 워크스페이스로 기본 설정
          this.$router.push({
            name: 'driveFolder',
            params: { 
              rootType: 'WORKSPACE',
              rootId: workspaceId,
              folderId: item.id 
            }
          });
        }
      }
    },

    // 트리 아이템이 이미지를 사용하는지 확인
    isTreeItemImage(item) {
      if (item.rootName || item.id === 'root' || item.isRoot) {
        const rootType = item.rootType || this.currentRootType;
        return rootType === 'WORKSPACE' || rootType === 'PROJECT';
      }
      return false;
    },

    // 트리 아이템 이미지 경로
    getTreeItemIconImage(item) {
      if (item.rootName || item.id === 'root' || item.isRoot) {
        const rootType = item.rootType || this.currentRootType;
        if (rootType === 'WORKSPACE') {
          return workspaceLogo;
        } else if (rootType === 'PROJECT') {
          return projectIcon;
        }
      }
      return null;
    },

    // 트리 아이템 아이콘 (rootType에 따라 분리)
    getTreeItemIcon(item) {
      // rootName이 있거나 isRoot 플래그가 있으면 루트 경로
      if (item.rootName || item.id === 'root' || item.isRoot) {
        const rootType = item.rootType || this.currentRootType;
        // rootType에 따라 아이콘 분리 (STONE만 아이콘 사용)
        switch (rootType) {
          case 'STONE':
            return 'mdi-flag'; // 마일스톤 아이콘 (깃발)
          default:
            return 'mdi-folder'; // 이미지 사용하는 경우 기본값
        }
      }
      // 일반 폴더
      return 'mdi-folder';
    },

    // 트리 아이템 아이콘 색상
    getTreeItemIconColor(item) {
      // rootName이 있거나 isRoot 플래그가 있으면 루트 경로
      if (item.rootName || item.id === 'root' || item.isRoot) {
        const rootType = item.rootType || this.currentRootType;
        // 모든 루트 타입을 검정색으로 통일
        if (rootType === 'WORKSPACE' || rootType === 'PROJECT' || rootType === 'STONE') {
          return '#000000';
        }
        return '#000000';
      }
      // 일반 폴더
      return 'amber darken-2';
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

    // 아이템이 이미지를 사용하는지 확인
    isItemImage(item) {
      // 테이블에서 type이 STONE/PROJECT인 경우
      if (item.type === 'STONE' || item.type === 'PROJECT') {
        return item.type === 'PROJECT';
      }
      
      // folderName이 없고 rootName이 있는 루트 항목
      if (item.isRoot || (!item.folderName && item.rootName)) {
        const rootType = item.rootType;
        return rootType === 'WORKSPACE' || rootType === 'PROJECT';
      }
      
      return false;
    },

    // 아이템 이미지 경로
    getItemIconImage(item) {
      // 테이블에서 type이 STONE/PROJECT인 경우
      if (item.type === 'STONE' || item.type === 'PROJECT') {
        if (item.type === 'PROJECT') {
          return projectIcon;
        }
      }
      
      // folderName이 없고 rootName이 있는 루트 항목
      if (item.isRoot || (!item.folderName && item.rootName)) {
        const rootType = item.rootType;
        if (rootType === 'WORKSPACE') {
          return workspaceLogo;
        } else if (rootType === 'PROJECT') {
          return projectIcon;
        }
      }
      
      return null;
    },

    // 아이템 아이콘
    getItemIcon(item) {
      // 테이블에서 type이 STONE/PROJECT인 경우 (type이 rootType 역할)
      if (item.type === 'STONE' || item.type === 'PROJECT') {
        const rootType = item.type; // 테이블에서는 type이 rootType
        switch (rootType) {
          case 'STONE':
            return 'mdi-flag'; // 마일스톤 아이콘 (깃발)
          default:
            return 'mdi-folder'; // 이미지 사용하는 경우 기본값
        }
      }
      
      // folderName이 없고 rootName이 있는 루트 항목 (기존 로직)
      if (item.isRoot || (!item.folderName && item.rootName)) {
        const rootType = item.rootType;
        switch (rootType) {
          case 'STONE':
            return 'mdi-flag'; // 마일스톤 아이콘 (깃발)
          default:
            return 'mdi-folder'; // 이미지 사용하는 경우 기본값
        }
      }
      
      if (item.type === 'folder') return 'mdi-folder';
      if (item.type === 'document') return 'mdi-file-document-edit';
      
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
      // 테이블에서 type이 STONE/PROJECT인 경우 (type이 rootType 역할)
      if (item.type === 'STONE' || item.type === 'PROJECT') {
        // 모든 루트 타입을 검정색으로 통일
        return '#000000';
      }
      
      // folderName이 없고 rootName이 있는 루트 항목 (기존 로직)
      if (item.isRoot || (!item.folderName && item.rootName)) {
        const rootType = item.rootType;
        // 모든 루트 타입을 검정색으로 통일
        if (rootType === 'WORKSPACE' || rootType === 'PROJECT' || rootType === 'STONE') {
          return '#000000';
        }
        return '#000000';
      }
      
      if (item.type === 'folder') return 'amber darken-2';
      if (item.type === 'document') return 'blue darken-1';
      
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

    // 테이블 행 클래스 결정
    getRowClass(item) {
      if (!item || !this.highlightItemId) return '';
      if (item.id === this.highlightItemId || 
          item.documentId === this.highlightItemId || 
          item.fileId === this.highlightItemId) {
        return 'highlighted-row';
      }
      return '';
    },

    // 하이라이트 및 스크롤 처리
    highlightAndScrollToItem(itemId, retryCount = 0) {
      const maxRetries = 10; // 최대 10번 재시도
      const retryDelay = 300; // 300ms 간격
      
      console.log('[DriveMain] highlightAndScrollToItem 시작, itemId:', itemId, 'retryCount:', retryCount);
      
      if (!itemId) {
        console.log('[DriveMain] itemId가 없습니다.');
        return;
      }

      // 먼저 하이라이트할 항목이 items 배열에 있는지 확인
      const targetItem = this.items.find(item => 
        item.id === itemId || 
        item.documentId === itemId || 
        item.fileId === itemId
      );
      
      if (!targetItem && retryCount < maxRetries) {
        console.log(`[DriveMain] 하이라이트할 항목을 찾을 수 없습니다. 재시도 중... (${retryCount + 1}/${maxRetries})`);
        // 데이터가 아직 로드되지 않았을 수 있으므로 재시도
        setTimeout(() => {
          this.highlightAndScrollToItem(itemId, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      if (!targetItem) {
        console.error('[DriveMain] 하이라이트할 항목을 찾을 수 없습니다. 최대 재시도 횟수 초과.');
        return;
      }
      
      console.log('[DriveMain] 하이라이트할 항목 찾음:', targetItem);

      // DOM 렌더링 완료를 여러 단계로 기다림
      this.$nextTick(() => {
        console.log('[DriveMain] $nextTick 완료');
        
        setTimeout(() => {
          console.log('[DriveMain] setTimeout 실행, tableContainer ref 확인 중...');
          
          const container = this.$refs.tableContainer;
          console.log('[DriveMain] container:', container);
          
          if (!container) {
            console.error('[DriveMain] tableContainer ref를 찾을 수 없습니다.');
            console.log('[DriveMain] $refs:', this.$refs);
            if (retryCount < maxRetries) {
              setTimeout(() => {
                this.highlightAndScrollToItem(itemId, retryCount + 1);
              }, retryDelay);
            }
            return;
          }

          // 드래그 앤 드롭과 동일한 방식으로 스크롤 컨테이너 찾기
          // v-data-table__wrapper가 스크롤 컨테이너 (드래그 앤 드롭에서 사용하는 방식)
          let scrollWrapper = container.querySelector('.v-data-table__wrapper');
          
          // Vuetify 3의 경우
          if (!scrollWrapper) {
            scrollWrapper = container.querySelector('.v-table__wrapper');
          }
          
          if (!scrollWrapper) {
            console.error('[DriveMain] 스크롤 컨테이너를 찾을 수 없습니다.');
            if (retryCount < maxRetries) {
              console.log(`[DriveMain] 스크롤 컨테이너 찾기 재시도 (${retryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                this.highlightAndScrollToItem(itemId, retryCount + 1);
              }, retryDelay);
            }
            return;
          }

          console.log('[DriveMain] scrollWrapper 크기:', {
            scrollHeight: scrollWrapper.scrollHeight,
            clientHeight: scrollWrapper.clientHeight,
            scrollTop: scrollWrapper.scrollTop
          });

          // 하이라이트된 행 찾기 - 여러 방법 시도
          let targetRow = null;
          
          // 방법 1: highlighted-row 클래스를 가진 tr 찾기
          targetRow = scrollWrapper.querySelector('tr.highlighted-row');
          console.log('[DriveMain] 방법1 - tr.highlighted-row:', targetRow);
          
          // 방법 2: highlighted-item 클래스를 가진 div의 부모 tr 찾기
          if (!targetRow) {
            const highlightedDiv = scrollWrapper.querySelector('.highlighted-item');
            console.log('[DriveMain] highlighted-item div:', highlightedDiv);
            if (highlightedDiv) {
              // 부모 tr 찾기
              let parent = highlightedDiv.parentElement;
              while (parent && parent.tagName !== 'TR' && parent !== scrollWrapper) {
                parent = parent.parentElement;
              }
              if (parent && parent.tagName === 'TR') {
                targetRow = parent;
                console.log('[DriveMain] 방법2 - highlighted-item의 부모 tr:', targetRow);
              }
            }
          }
          
          // 방법 3: tbody 내에서 찾기
          if (!targetRow) {
            const tbody = scrollWrapper.querySelector('tbody');
            console.log('[DriveMain] tbody:', tbody);
            
            if (tbody) {
              targetRow = tbody.querySelector('tr.highlighted-row');
              if (!targetRow) {
                const highlightedDiv = tbody.querySelector('.highlighted-item');
                if (highlightedDiv) {
                  let parent = highlightedDiv.parentElement;
                  while (parent && parent.tagName !== 'TR' && parent !== tbody) {
                    parent = parent.parentElement;
                  }
                  if (parent && parent.tagName === 'TR') {
                    targetRow = parent;
                    console.log('[DriveMain] 방법3 - tbody에서 highlighted-item의 부모 tr:', targetRow);
                  }
                }
              }
            }
          }

          // 모든 행 확인 (디버깅용)
          const allRows = scrollWrapper.querySelectorAll('tr');
          const allHighlightedDivs = scrollWrapper.querySelectorAll('.highlighted-item');
          console.log('[DriveMain] 전체 행 개수:', allRows.length);
          console.log('[DriveMain] highlighted-item div 개수:', allHighlightedDivs.length);
          allRows.forEach((row, index) => {
            if (row.classList.contains('highlighted-row')) {
              console.log(`[DriveMain] 하이라이트된 행 발견 (인덱스 ${index}):`, row);
            }
          });
          
          if (!targetRow) {
            // 데이터는 있지만 DOM이 아직 렌더링되지 않았을 수 있음
            // items에는 있지만 DOM에 아직 없는 경우 재시도
            if (retryCount < maxRetries) {
              console.log(`[DriveMain] 하이라이트된 행을 찾을 수 없습니다. DOM 렌더링 대기 중... 재시도 (${retryCount + 1}/${maxRetries})`);
              console.log('[DriveMain] 현재 렌더링된 행 수:', allRows.length, 'items 수:', this.items.length);
              setTimeout(() => {
                this.highlightAndScrollToItem(itemId, retryCount + 1);
              }, retryDelay);
              return;
            }
            
            console.error('[DriveMain] 하이라이트된 행을 찾을 수 없습니다. 최대 재시도 횟수 초과. itemId:', itemId);
            console.log('[DriveMain] highlightItemId:', this.highlightItemId);
            console.log('[DriveMain] items:', this.items.map(item => ({
              id: item.id,
              documentId: item.documentId,
              fileId: item.fileId,
              name: item.name
            })));
            console.log('[DriveMain] scrollWrapper HTML 일부:', scrollWrapper.innerHTML.substring(0, 500));
            return;
          }

          console.log('[DriveMain] 타겟 행 찾음:', targetRow);
          console.log('[DriveMain] 타겟 행 위치:', {
            offsetTop: targetRow.offsetTop,
            offsetHeight: targetRow.offsetHeight,
            getBoundingClientRect: targetRow.getBoundingClientRect()
          });

          // 스크롤 위치 계산 및 실행 (드래그 앤 드롭과 동일한 방식)
          console.log('[DriveMain] 스크롤 계산 시작...');
          
          // 드래그 앤 드롭처럼 직접 scrollTop 설정
          // tbody를 기준으로 한 상대 위치 계산
          const tbody = targetRow.closest('tbody');
          let rowOffsetTop = 0;
          
          if (tbody) {
            // tbody 내에서의 상대 위치 계산
            let element = targetRow;
            while (element && element !== tbody) {
              rowOffsetTop += element.offsetTop;
              element = element.offsetParent;
            }
          } else {
            // tbody가 없으면 scrollWrapper를 기준으로 계산
            const wrapperRect = scrollWrapper.getBoundingClientRect();
            const rowRect = targetRow.getBoundingClientRect();
            rowOffsetTop = scrollWrapper.scrollTop + (rowRect.top - wrapperRect.top);
          }
          
          // 현재 스크롤 위치
          const currentScroll = scrollWrapper.scrollTop;
          
          // 중앙으로 배치하기 위한 목표 스크롤 위치
          const rowHeight = targetRow.offsetHeight;
          const wrapperHeight = scrollWrapper.clientHeight;
          const desiredScroll = Math.max(0, rowOffsetTop - (wrapperHeight / 2) + (rowHeight / 2));
          
          console.log('[DriveMain] 스크롤 계산:', {
            rowOffsetTop,
            currentScroll,
            rowHeight,
            wrapperHeight,
            desiredScroll
          });

          // 드래그 앤 드롭처럼 직접 scrollTop 설정 (부드러운 스크롤)
          try {
            scrollWrapper.scrollTo({ 
              top: desiredScroll, 
              behavior: 'smooth' 
            });
          } catch (e) {
            // Safari 등 일부 브라우저 호환
            scrollWrapper.scrollTop = desiredScroll;
          }
          
          console.log('[DriveMain] 스크롤 실행 완료');
        }, 300); // 테이블 렌더링 완료를 위한 딜레이
      });
    },

    // 아이템 클릭
    handleItemClick(item) {
      console.log('Item clicked:', item);
      
      // folderName이 없고 rootName이 있는 경우 (루트 항목)
      if (item.isRoot || (!item.folderName && item.rootName)) {
        console.log('Navigating to root drive:', item.rootType, item.rootId);
        if (item.rootType && item.rootId) {
          // stoneId가 있으면 라우팅 대신 내부 상태만 업데이트
          if (this.stoneId) {
            // 현재 스톤 문서함이면 내부 상태만 업데이트
            if (item.rootType === 'STONE' && item.rootId === String(this.stoneId)) {
              this.loadFolderContents(null, 'STONE', String(this.stoneId));
              return;
            }
            // 다른 루트 항목이면 라우팅
            this.$router.push({
              name: 'driveRoot',
              params: { 
                rootType: item.rootType, 
                rootId: item.rootId 
              }
            });
            return;
          }
          
          // projectId가 있으면 라우팅 대신 내부 상태만 업데이트
          if (this.projectId) {
            // 프로젝트 문서함 안에서 STONE/PROJECT 루트 항목 클릭 시 내부 상태만 업데이트
            if (item.rootType === 'STONE' || item.rootType === 'PROJECT') {
              this.loadFolderContents(null, item.rootType, item.rootId);
              return;
            }
            // 현재 프로젝트 문서함이면 내부 상태만 업데이트
            if (item.rootType === 'PROJECT' && item.rootId === this.projectId) {
              this.loadFolderContents(null, 'PROJECT', this.projectId);
              return;
            }
            // 다른 루트 항목이면 라우팅
            this.$router.push({
              name: 'driveRoot',
              params: { 
                rootType: item.rootType, 
                rootId: item.rootId 
              }
            });
            return;
          }
          
          // projectId/stoneId가 없으면 라우팅
          this.$router.push({
            name: 'driveRoot',
            params: { 
              rootType: item.rootType, 
              rootId: item.rootId 
            }
          });
          return;
        }
      }
      
      // folder: 계층 구조로 폴더 탐색
      if (item.type === 'folder') {
        console.log('[DriveMain] [handleItemClick] 폴더 클릭:', {
          id: item.id,
          name: item.name,
          rootType: item.rootType,
          rootId: item.rootId,
          projectId: this.projectId,
          stoneId: this.stoneId
        });
        
        // stoneId가 있으면 라우팅 대신 내부 상태만 업데이트
        if (this.stoneId) {
          this.loadFolderContents(item.id, 'STONE', String(this.stoneId));
          return;
        }
        
        // projectId가 있으면 라우팅 대신 내부 상태만 업데이트
        if (this.projectId) {
          // item에 rootType과 rootId가 있으면 해당 루트로 이동
          // rootType이 없으면 currentRootType을 사용 (현재 열려있는 문서함)
          const folderRootType = item.rootType || this.currentRootType;
          const folderRootId = item.rootId || this.currentRootId;
          
          console.log('[DriveMain] [handleItemClick] 폴더 이동 결정:', {
            itemRootType: item.rootType,
            itemRootId: item.rootId,
            currentRootType: this.currentRootType,
            currentRootId: this.currentRootId,
            folderRootType,
            folderRootId,
            projectId: this.projectId
          });
          
          if (folderRootType && folderRootId) {
            // 프로젝트 루트의 하위 폴더면 프로젝트 문서함 안에서 이동
            if (folderRootType === 'PROJECT' && folderRootId === this.projectId) {
              this.loadFolderContents(item.id, 'PROJECT', this.projectId);
            } 
            // STONE 루트의 하위 폴더면 프로젝트 문서함 안에서 스톤 폴더로 이동 (내부 상태만 업데이트)
            else if (folderRootType === 'STONE') {
              this.loadFolderContents(item.id, 'STONE', folderRootId);
            } 
            // 워크스페이스 폴더면 워크스페이스로 이동 (라우팅)
            else {
              const workspaceId = localStorage.getItem('selectedWorkspaceId');
              this.$router.push({
                name: 'driveFolder',
                params: {
                  rootType: 'WORKSPACE',
                  rootId: workspaceId,
                  folderId: item.id
                }
              });
            }
          } else {
            // rootType이 없으면 현재 프로젝트의 폴더로 가정하고 프로젝트 문서함 안에서 이동
            this.loadFolderContents(item.id, 'PROJECT', this.projectId);
          }
          return;
        }
        
        // 아이템에 rootType과 rootId가 있으면 사용 (백엔드에서 제공하는 경우)
        const rootType = item.rootType || this.currentRootType || 'WORKSPACE';
        const rootId = item.rootId || this.currentRootId || localStorage.getItem('selectedWorkspaceId');
        
        // 폴더 경로에 추가 (폴더 이름 정보가 있으므로)
        // 백엔드에서 ancestors 오면 덮어쓰기
        this.folderPath.push({
          id: item.id,
          name: item.name
        });
        
        this.$router.push({
          name: 'driveFolder',
          params: { 
            rootType: rootType,
            rootId: rootId,
            folderId: item.id 
          }
        });
      }
      // STONE: 스톤 문서함으로 바로가기
      else if (item.type === 'STONE') {
        console.log('Navigating to STONE drive:', item.id);
        // projectId가 있으면 프로젝트 문서함 안에서 내부 상태만 업데이트
        if (this.projectId) {
          this.loadFolderContents(null, 'STONE', item.id);
          return;
        }
        // stoneId가 있으면 내부 상태만 업데이트
        if (this.stoneId) {
          this.loadFolderContents(null, 'STONE', String(this.stoneId));
          return;
        }
        // 라우팅
        this.$router.push({
          name: 'driveRoot',
          params: { rootType: 'STONE', rootId: item.id }
        });
      }
      // PROJECT: 프로젝트 문서함으로 바로가기
      else if (item.type === 'PROJECT') {
        console.log('Navigating to PROJECT drive:', item.id);
        // projectId가 있으면 프로젝트 문서함 안에서 내부 상태만 업데이트
        if (this.projectId) {
          this.loadFolderContents(null, 'PROJECT', item.id);
          return;
        }
        // stoneId가 있으면 내부 상태만 업데이트
        if (this.stoneId) {
          this.loadFolderContents(null, 'STONE', String(this.stoneId));
          return;
        }
        // 라우팅
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
      this.clearSelectedFiles();
    },

    // 폴더 생성
    async createFolder() {
      if (!this.newFolderName.trim()) {
        showSnackbar('폴더 이름을 입력해주세요.', 'warning');
        return;
      }

      // 중복 요청 방지 (멱등성 보장)
      if (this.isCreatingFolder) {
        return;
      }

      try {
        this.isCreatingFolder = true;
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
        
        // 응답 구조: { result: '폴더ID', statusCode: 201, statusMessage: '...' }
        // result가 폴더 ID 문자열로 반환됨
        const newFolderId = response?.result; // result는 폴더 ID 문자열
        const newFolderName = this.newFolderName; // 요청 시 보낸 name 사용
        const parentId = this.currentFolderId || null;
        
        console.log('[DriveMain] 추출된 폴더 정보:', { newFolderId, newFolderName, parentId });
        
        // 트리에 직접 추가: WORKSPACE 또는 DTO의 rootType/rootId 기준 루트 노드 하위에 정확히 추가
        if (newFolderId && newFolderName) {
          console.log('[DriveMain] 폴더 생성 성공, 트리에 추가 시도:', { newFolderId, newFolderName, parentId, dtoRootType: folderData.rootType, dtoRootId: folderData.rootId });
          
          let normalizedParentId = null;
          let parentNode = null;
          
          if (parentId) {
            // 특정 폴더 하위에 생성된 경우 그대로 사용
            normalizedParentId = parentId === 'root' ? 'root' : parentId;
            parentNode = this.findNodeById(this.folderTree, normalizedParentId);
            console.log('[DriveMain] 트리 부모 확정 (기존 폴더 하위):', { normalizedParentId, parentNode });
          } else {
            // 루트 바로 아래에 생성된 경우: 현재 루트 기준으로 부모 결정
            if (!folderData.rootType || folderData.rootType === 'WORKSPACE') {
              normalizedParentId = 'root';
              parentNode = this.findNodeById(this.folderTree, 'root');
              console.log('[DriveMain] 트리 부모 확정 (WORKSPACE 루트):', { normalizedParentId, parentNode });
            } else {
              // PROJECT/STONE 루트 → 해당 루트 항목 노드 찾기
              parentNode = this.findRootNodeBy(folderData.rootType, folderData.rootId);
              console.log('[DriveMain] 루트 노드 탐색 결과(1차):', { rootType: folderData.rootType, rootId: folderData.rootId, parentNode });
              if (!parentNode) {
                // 루트 자식들을 로드하고 다시 시도 (동적 생성은 하지 않음)
                await this.ensureChildrenLoaded('root');
                parentNode = this.findRootNodeBy(folderData.rootType, folderData.rootId);
                console.log('[DriveMain] 루트 노드 탐색 결과(2차 after load):', { rootType: folderData.rootType, rootId: folderData.rootId, parentNode });
              }
              // 부모 노드를 찾았으면 부모 ID를 설정 (루트 노드 id 보정)
              if (parentNode) {
                if (parentNode.isRoot && !parentNode.id) {
                  parentNode.id = `${folderData.rootType}:${folderData.rootId}`;
                  console.log('[DriveMain] 루트 노드 id 보정:', parentNode.id);
                }
              }
              normalizedParentId = parentNode ? parentNode.id : null;
              console.log('[DriveMain] 트리 부모 확정 (PROJECT/STONE 루트):', { normalizedParentId });
            }
          }
          
          if (normalizedParentId) {
            // 부모 폴더가 트리에 없으면 경로 확장 시도
            if (!parentNode) {
              console.log('[DriveMain] 부모 노드를 찾을 수 없음, 경로 확장 시도:', normalizedParentId);
              await this.ensureChildrenLoaded('root');
              if (this.folderPath && this.folderPath.length > 0) {
                for (const pathFolder of this.folderPath) {
                  await this.ensureChildrenLoaded(pathFolder.id);
                }
              }
              if (this.currentFolderId && this.currentFolderId !== normalizedParentId) {
                await this.ensureChildrenLoaded(this.currentFolderId);
              }
            }
            
            // 최종 부모 노드 확인 후 추가
            const parentNodeAfterLoad = this.findNodeById(this.folderTree, normalizedParentId);
            if (!parentNodeAfterLoad) {
              console.warn('[DriveMain] 부모 노드를 여전히 찾을 수 없음:', normalizedParentId);
            }
            console.log('[DriveMain] addFolderToTree 직전 상태:', { newFolderId, newFolderName, normalizedParentId, parentNodeAfterLoad });
            this.addFolderToTree(newFolderId, newFolderName, normalizedParentId);
            await this.$nextTick();
          } else {
            console.warn('[DriveMain] 트리 추가를 위한 부모 ID를 결정할 수 없습니다. currentRootType/currentRootId 확인 필요.');
          }
        } else {
          console.warn('[DriveMain] 폴더 생성 응답에 id 또는 name이 없습니다:', response);
        }
        
        showSnackbar('폴더가 생성되었습니다.', 'success');
        this.createFolderDialog = false;
        this.newFolderName = '';
        
        // 메인 콘텐츠만 새로고침 (트리는 이미 추가됨)
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('폴더 생성 실패:', error);
        // 실패 시 응답값을 스낵바에 표시
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.statusMessage 
          || error.response?.data?.error 
          || JSON.stringify(error.response?.data)
          || '폴더 생성에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      } finally {
        this.isCreatingFolder = false;
      }
    },

    // 이름 변경 다이얼로그 열기
    openRenameDialog(item) {
      this.renameItem = item;
      this.renameName = item.name;
      this.renameDialog = true;
    },

    // 상세 정보 모달 열기
    async openInfoDialog(item) {
      if (!item) return;
      
      this.infoItem = item;
      this.infoDialog = true;
      this.itemInfo = null;
      this.isLoadingInfo = true;
      
      try {
        let response;
        if (item.type === 'document') {
          response = await driveService.getDocumentInfo(item.id);
        } else if (item.type === 'folder') {
          response = await driveService.getFolderInfoDetail(item.id);
        } else if (item.type === 'file') {
          response = await driveService.getFileInfo(item.id);
        }
        
        if (response?.result) {
          this.itemInfo = response.result;
        } else if (response) {
          this.itemInfo = response;
        }
      } catch (error) {
        console.error('상세 정보 로드 실패:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.statusMessage || '상세 정보를 불러올 수 없습니다.';
        showSnackbar(errorMessage, 'error');
        this.infoDialog = false;
      } finally {
        this.isLoadingInfo = false;
      }
    },

    // 날짜 시간 포맷팅
    formatDateTime(dateTime) {
      if (!dateTime) return '';
      
      try {
        const date = new Date(dateTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch (error) {
        return dateTime;
      }
    },

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // 이름 변경
    async confirmRename() {
      if (!this.renameName.trim()) {
        showSnackbar('이름을 입력해주세요.', 'warning');
        return;
      }

      // 중복 요청 방지 (멱등성 보장)
      if (this.isRenaming) {
        return;
      }

      try {
        this.isRenaming = true;
        let response;
        if (this.renameItem.type === 'document') {
          response = await driveService.updateDocumentTitle(this.renameItem.id, { title: this.renameName });
        } else {
          response = await driveService.updateFolderName(this.renameItem.id, { name: this.renameName });
          // 폴더 이름 변경 시 트리에서 직접 업데이트
          this.updateFolderNameInTree(this.renameItem.id, this.renameName);
        }
        
        showSnackbar(response.statusMessage || '이름이 변경되었습니다.', 'success');
        this.renameDialog = false;
        
        // 상세 정보 모달이 열려있고 같은 아이템이면 정보 새로고침
        if (this.infoDialog && this.infoItem && this.infoItem.id === this.renameItem.id) {
          this.infoItem.name = this.renameName;
          await this.openInfoDialog(this.infoItem);
        }
        
        // 메인 콘텐츠만 새로고침 (트리는 이미 업데이트됨)
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('이름 변경 실패:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.statusMessage || error.response?.data?.error || '이름 변경에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      } finally {
        this.isRenaming = false;
      }
    },

    // 문서 생성
    async createDocument() {
      if (!this.newDocumentTitle.trim()) {
        showSnackbar('문서 제목을 입력해주세요.', 'warning');
        return;
      }

      // 중복 요청 방지 (멱등성 보장)
      if (this.isCreatingDocument) {
        return;
      }

      try {
        this.isCreatingDocument = true;
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
      } finally {
        this.isCreatingDocument = false;
      }
    },

    // 삭제 확인 및 실행
    async confirmDelete() {
      if (!this.deleteItem) return;

      const item = this.deleteItem;
      this.isDeleting = true;

      try {
        let response;
        if (item.type === 'folder') {
          response = await driveService.deleteFolder(item.id);
          // 트리에서 직접 제거
          this.removeFolderFromTree(item.id);
          // Vue 반응성 보장
          await this.$nextTick();
        } else if (item.type === 'document') {
          response = await driveService.deleteDocument(item.id);
        } else {
          response = await driveService.deleteFile(item.id);
        }
        
        showSnackbar(response.statusMessage || '삭제되었습니다.', 'success');
        
        // 다이얼로그 닫기
        this.deleteDialog = false;
        this.deleteItem = null;
        
        // 상세 정보 모달이 열려있고 같은 아이템이면 모달 닫기
        if (this.infoDialog && this.infoItem && this.infoItem.id === item.id) {
          this.infoDialog = false;
          this.infoItem = null;
          this.itemInfo = null;
        }
        
        // 현재 루트 정보를 유지하면서 새로고침
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('삭제 실패:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.statusMessage || error.response?.data?.error || '삭제에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      } finally {
        this.isDeleting = false;
      }
    },

    // 파일 업로드
    handleFileDrop(e) {
      const files = e.dataTransfer.files;
      this.addSelectedFiles(files);
    },

    handleFileSelect(e) {
      const files = e.target.files;
      this.addSelectedFiles(files);
    },

    addSelectedFiles(files) {
      if (!files || files.length === 0) return;
      const array = Array.from(files);
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      const MAX_FILE_COUNT = 10;

      // 현재 선택된 파일 + 새로 추가할 파일의 총 개수 체크
      if (this.selectedFiles.length + array.length > MAX_FILE_COUNT) {
        const canAdd = MAX_FILE_COUNT - this.selectedFiles.length;
        if (canAdd <= 0) {
          showSnackbar(`최대 ${MAX_FILE_COUNT}개 파일까지 업로드 가능합니다.`, 'warning');
          return;
        }
        array.splice(canAdd); // 초과분 제거
        showSnackbar(`최대 ${MAX_FILE_COUNT}개 파일만 선택 가능합니다. ${canAdd}개 파일만 추가되었습니다.`, 'warning');
      }

      // 파일 크기 및 총 용량 체크
      const validFiles = [];
      const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB
      let currentTotal = this.totalSelectedSize;

      for (const file of array) {
        // 개별 파일 크기 체크
        if (file.size > MAX_FILE_SIZE) {
          showSnackbar(`"${file.name}" 파일이 50MB를 초과합니다.`, 'warning');
          continue;
        }

        // 총 용량 체크
        if (currentTotal + file.size > MAX_TOTAL_SIZE) {
          showSnackbar(`총 용량이 200MB를 초과합니다. 나머지 파일은 추가되지 않았습니다.`, 'warning');
          break;
        }

        validFiles.push(file);
        currentTotal += file.size;
      }

      // 유효한 파일들만 추가
      validFiles.forEach((file) => {
        const isImage = /^image\//.test(file.type);
        const previewUrl = isImage ? URL.createObjectURL(file) : null;
        this.selectedFiles.push({ key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}` , file, previewUrl });
      });

      // reset input so same file can be chosen again
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },

    removeSelectedFile(index) {
      const item = this.selectedFiles[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      this.selectedFiles.splice(index, 1);
    },

    clearSelectedFiles() {
      this.selectedFiles.forEach(it => { if (it.previewUrl) URL.revokeObjectURL(it.previewUrl); });
      this.selectedFiles = [];
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },

    getPreviewIcon(f) {
      const name = f?.file?.name || '';
      const ext = this.getFileExtension(name);
      const map = {
        pdf: 'mdi-file-pdf-box', doc: 'mdi-file-word-box', docx: 'mdi-file-word-box',
        xls: 'mdi-file-excel-box', xlsx: 'mdi-file-excel-box', csv: 'mdi-file-delimited',
        ppt: 'mdi-file-powerpoint-box', pptx: 'mdi-file-powerpoint-box', txt: 'mdi-file-document-outline',
        jpg: 'mdi-file-image', jpeg: 'mdi-file-image', png: 'mdi-file-image', gif: 'mdi-file-image', svg: 'mdi-svg', webp: 'mdi-file-image',
        mp3: 'mdi-file-music', wav: 'mdi-file-music', mp4: 'mdi-file-video', mov: 'mdi-file-video', zip: 'mdi-folder-zip', rar: 'mdi-folder-zip', '7z': 'mdi-folder-zip'
      };
      return map[ext] || 'mdi-file-outline';
    },

    // 현재 폴더 내에서 업로드 대상 파일들과 이름이 겹치는 파일명 목록
    getDuplicateFileNames(files) {
      try {
        const existingNames = new Set(
          (this.items || [])
            .filter(it => it && (it.type === 'file' || it.type === 'document') && typeof it.name === 'string')
            .map(it => it.name.trim().toLowerCase())
        );
        const duplicates = [];
        (files || []).forEach(f => {
          const name = (f && f.name ? String(f.name) : '').trim();
          if (!name) return;
          if (existingNames.has(name.toLowerCase()) && !duplicates.includes(name)) {
            duplicates.push(name);
          }
        });
        return duplicates;
      } catch (_) {
        return [];
      }
    },

    async uploadSelectedFiles() {
      if (this.selectedFiles.length === 0) return;

      // 최종 검증
      if (this.uploadStatus.hasErrors) {
        showSnackbar(this.uploadStatus.message, 'error');
        return;
      }

      this.uploadCancelled = false;
      this.isUploading = true;
      const files = this.selectedFiles.map(it => it.file);
      try {
        await this.uploadFilesSequentially(files);
        if (!this.uploadCancelled) {
          this.clearSelectedFiles();
        }
      } finally {
        this.isUploading = false;
      }
    },

    // 파일을 순차적으로 업로드 (중복 파일 발견 시 확인)
    async uploadFilesSequentially(files) {
      if (!files || files.length === 0) return;

      const fileArray = Array.isArray(files) ? files : Array.from(files);
      const folderId = this.currentFolderId || this.currentRootId || localStorage.getItem('selectedWorkspaceId');
      const rootId = this.currentRootId || localStorage.getItem('selectedWorkspaceId');
      const rootType = this.currentRootType || 'WORKSPACE';
      
      const uploadedFiles = [];
      const skippedFiles = [];
      
      // 현재 폴더의 파일명 목록 (업데이트를 위해)
      const existingNames = new Set(
        (this.items || [])
          .filter(it => it && (it.type === 'file' || it.type === 'document') && typeof it.name === 'string')
          .map(it => it.name.trim().toLowerCase())
      );

      for (let i = 0; i < fileArray.length; i++) {
        // 업로드 취소 확인
        if (this.uploadCancelled) {
          break;
        }

        const file = fileArray[i];
        const fileName = file.name.trim();
        const fileNameLower = fileName.toLowerCase();

        // 중복 체크
        if (existingNames.has(fileNameLower)) {
          // 중복 파일 발견 - 사용자 확인 대기
          this.duplicateFileName = fileName;
          this.duplicateFileIndex = i;
          this.duplicateConfirmDialog = true;
          
          // 사용자 응답 대기 (Promise를 사용하여 동기적으로 대기)
          await new Promise((resolve) => {
            const checkResponse = () => {
              if (!this.duplicateConfirmDialog) {
                // 다이얼로그가 닫혔으면 (사용자가 결정했으면)
                resolve();
              } else {
                setTimeout(checkResponse, 100);
              }
            };
            checkResponse();
          });

          // 업로드 취소 확인
          if (this.uploadCancelled) {
            break;
          }

          // 건너뛰기로 결정했으면 다음 파일로
          skippedFiles.push(fileName);
          continue;
        }

        // 파일 업로드
        try {
          const response = await driveService.uploadFile(folderId, [file], rootId, rootType);
          uploadedFiles.push(fileName);
          
          // 업로드된 파일명을 existingNames에 추가 (다음 파일 검사 시 반영)
          existingNames.add(fileNameLower);
          
          // 업로드 중 폴더 새로고침 (선택적 - 너무 자주 호출하면 성능 이슈 가능)
          // await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } catch (error) {
          console.error(`파일 업로드 실패: ${fileName}`, error);
          const errorData = error.response?.data || {};
          const errorMessage = errorData.statusMessage || '파일 업로드에 실패했습니다.';
          
          // 중복 파일명 추출
          let duplicateFiles = [];
          if (errorData.duplicateFiles && Array.isArray(errorData.duplicateFiles)) {
            duplicateFiles = errorData.duplicateFiles;
          } else if (errorData.conflictingFiles && Array.isArray(errorData.conflictingFiles)) {
            duplicateFiles = errorData.conflictingFiles;
          } else if (errorData.duplicateFileNames && Array.isArray(errorData.duplicateFileNames)) {
            duplicateFiles = errorData.duplicateFileNames;
          } else if (errorMessage.includes('중복') || errorMessage.includes('duplicate')) {
            const filePattern = /["']([^"']+\.[^"']+)["']/g;
            const matches = errorMessage.match(filePattern);
            if (matches) {
              duplicateFiles = matches.map(m => m.replace(/["']/g, ''));
            }
          }
          
          // 중복 파일이면 건너뛰기, 아니면 에러 표시
          if (duplicateFiles.length > 0 && duplicateFiles.includes(fileName)) {
            skippedFiles.push(fileName);
          } else {
            showSnackbar(`"${fileName}" 업로드 실패: ${errorMessage}`, { color: 'error' });
          }
        }
      }

      // 업로드 완료 메시지
      if (uploadedFiles.length > 0) {
        showSnackbar(`${uploadedFiles.length}개 파일이 업로드되었습니다.`, { color: 'success' });
      }
      
      if (skippedFiles.length > 0) {
        const list = skippedFiles.slice(0, 5).map(n => `"${n}"`).join(', ');
        const more = skippedFiles.length > 5 ? ` 외 ${skippedFiles.length - 5}개` : '';
        showSnackbar(`건너뛴 파일: ${list}${more}`, { color: 'warning' });
      }

      if (!this.uploadCancelled) {
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
      }
    },

    // 중복 파일 확인 다이얼로그 - 업로드 취소
    cancelUpload() {
      this.uploadCancelled = true;
      this.duplicateConfirmDialog = false;
      this.isUploading = false;
      showSnackbar('업로드가 취소되었습니다.', { color: 'warning' });
    },

    // 중복 파일 확인 다이얼로그 - 건너뛰고 계속
    skipAndContinue() {
      this.duplicateConfirmDialog = false;
      // uploadFilesSequentially의 루프가 계속 진행됨
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
      this.dragOverTreeFolder = null;
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

    // 파일 드래그 앤 드롭 - 테이블 영역에 파일 드롭
    onTableFileDragOver(e) {
      // 아이템 드래그인 경우 기존 로직 실행
      if (this.draggingItem) {
        // 기존 아이템 드래그 오버 로직 (자동 스크롤)
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const scrollThreshold = 100;
        const maxSpeed = 15;
        
        if (y < scrollThreshold) {
          const distance = y;
          this.scrollSpeed = -maxSpeed * (1 - distance / scrollThreshold);
          this.startAutoScroll(container);
        } else if (y > rect.height - scrollThreshold) {
          const distance = rect.height - y;
          this.scrollSpeed = maxSpeed * (1 - distance / scrollThreshold);
          this.startAutoScroll(container);
        } else {
          this.stopAutoScroll();
        }
        return;
      }
      
      // 파일 드래그인지 확인
      const dataTransfer = e.dataTransfer;
      if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
        this.isDraggingFiles = true;
        e.dataTransfer.dropEffect = 'copy';
      }
    },

    onTableFileDragLeave(e) {
      // 실제로 테이블 영역을 벗어났는지 확인
      const container = e.currentTarget;
      const rect = container.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      // 아이템 드래그인 경우 스크롤 멈춤
      if (this.draggingItem) {
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          this.stopAutoScroll();
        }
        return;
      }
      
      // 파일 드래그인 경우
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        this.isDraggingFiles = false;
      }
    },

    async onTableFileDrop(e) {
      this.isDraggingFiles = false;
      
      // 아이템 드래그 중이면 파일 드롭 처리하지 않음
      if (this.draggingItem) return;
      
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;
      
      // 파일들을 selectedFiles에 추가
      this.addSelectedFiles(files);
      
      // 업로드 다이얼로그 열기
      this.uploadDialog = true;
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
      if (!this.draggingItem || !item) return;
      const isRootTarget = item.type === 'STONE' || item.type === 'PROJECT';
      const isFolderTarget = item.type === 'folder';
      if (!isFolderTarget && !isRootTarget) return;
      if (isFolderTarget && this.draggingItem.id === item.id) return; // 자기 자신에게는 드롭 불가
      
      // 폴더인 경우 순환 이동 방지 (자기 자신의 하위 폴더로는 이동 불가)
      if (isFolderTarget && this.draggingItem.type === 'folder' && this.isDescendantOf(item.id, this.draggingItem.id)) {
        return; // 드롭 불가능한 상태
      }
      
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.dragOverItem = item;
      
      // 테이블이 드래그 오버되면 트리뷰의 드래그 오버 상태 초기화
      this.dragOverTreeFolder = null;
    },

    onDragLeave() {
      this.dragOverItem = null;
    },

    async onDrop(e, targetFolder) {
      e.preventDefault();
      
      if (!this.draggingItem || !targetFolder) return;
      const isRootTarget = targetFolder.type === 'STONE' || targetFolder.type === 'PROJECT';
      const isFolderTarget = targetFolder.type === 'folder';
      if (!isFolderTarget && !isRootTarget) return;
      if (this.draggingItem.id === targetFolder.id) return; // 자기 자신에게는 드롭 불가
      
      // 폴더인 경우 순환 이동 방지 (자기 자신의 하위 폴더로는 이동 불가)
      if (this.draggingItem.type === 'folder' && this.isDescendantOf(targetFolder.id, this.draggingItem.id)) {
        showSnackbar('자기 자신의 하위 폴더로는 이동할 수 없습니다.', 'warning');
        this.draggingItem = null;
        this.dragOverItem = null;
        this.dragOverTreeFolder = null;
        return;
      }
      
      // 로컬 변수로 저장 (나중에 null이 되어도 사용 가능)
      const sourceItem = this.draggingItem;
      const destFolder = targetFolder;
      
      // 즉시 초기화
      this.draggingItem = null;
      this.dragOverItem = null;
      this.dragOverTreeFolder = null;
      
      try {
        // 루트(STONE/PROJECT)로 드롭하는 경우 처리
        if (isRootTarget) {
          // isRoot일 경우 type과 id를 rootType과 rootId로 사용
          const targetRootType = destFolder.rootType || (destFolder.isRoot ? destFolder.type : null);
          const targetRootId = destFolder.rootId || (destFolder.isRoot ? destFolder.id : null);
          
          if (!targetRootType || !targetRootId) {
            console.error('[DriveMain] 루트 정보 없음 - destFolder:', JSON.stringify(destFolder, null, 2));
            showSnackbar('루트 정보를 확인할 수 없습니다.', 'error');
            return;
          }
          
          if (sourceItem.type === 'folder') {
            console.log('[DriveMain] [루트 이동] API 호출 시작:', {
              folderId: sourceItem.id,
              folderName: sourceItem.name,
              targetRootType,
              targetRootId,
              currentRootType: this.currentRootType,
              currentRootId: this.currentRootId
            });
            
            await driveService.moveFolder(sourceItem.id, {
              parentId: null,
              rootType: targetRootType,
              rootId: targetRootId
            });
            
            console.log('[DriveMain] [루트 이동] API 호출 완료, 트리 업데이트 시작:', {
              targetRootType,
              willUpdateTree: targetRootType === 'WORKSPACE'
            });
            
            // 트리뷰에 반영: 워크스페이스는 'root' 노드, STONE/PROJECT는 해당 루트 노드 찾기
            if (targetRootType === 'WORKSPACE') {
              console.log('[DriveMain] [루트 이동] WORKSPACE 루트로 이동 → moveFolderInTree 호출');
              const moved = this.moveFolderInTree(sourceItem.id, 'root');
              console.log('[DriveMain] [루트 이동] moveFolderInTree 결과:', moved);
            } else {
              // STONE 또는 PROJECT 루트 노드 찾기
              console.log('[DriveMain] [루트 이동] STONE/PROJECT 루트로 이동, 루트 노드 찾기:', {
                targetRootType,
                targetRootId
              });
              const rootNode = this.findRootNodeBy(targetRootType, targetRootId);
              if (rootNode) {
                console.log('[DriveMain] [루트 이동] 루트 노드 찾음:', {
                  rootNodeId: rootNode.id,
                  rootNodeName: rootNode.name,
                  rootType: rootNode.rootType,
                  rootId: rootNode.rootId,
                  hasId: !!rootNode.id
                });
                // 루트 노드의 id가 없으면 rootType:rootId 형식의 특별한 ID 사용
                const parentId = rootNode.id || `${targetRootType}:${targetRootId}`;
                console.log('[DriveMain] [루트 이동] 사용할 parentId:', parentId);
                const moved = this.moveFolderInTree(sourceItem.id, parentId, rootNode);
                console.log('[DriveMain] [루트 이동] moveFolderInTree 결과:', moved);
              } else {
                console.log('[DriveMain] [루트 이동] 루트 노드를 찾을 수 없음 → 트리에서 제거:', {
                  targetRootType,
                  targetRootId,
                  willRemove: true
                });
                this.removeFolderFromTree(sourceItem.id);
                console.log('[DriveMain] [루트 이동] 트리에서 제거 완료');
              }
            }
          } else if (sourceItem.type === 'document' || sourceItem.type === 'file') {
            await driveService.moveElement(sourceItem.id, {
              folderId: null,
              type: sourceItem.type,
              rootType: targetRootType,
              rootId: targetRootId
            });
          }
          showSnackbar(`"${sourceItem.name}"을(를) "${destFolder.name}"(으)로 이동했습니다.`, 'success');
        } else {
          // 대상이 일반 폴더인 경우 기존 로직
          if (sourceItem.type === 'folder') {
            await driveService.moveFolder(sourceItem.id, {
              parentId: destFolder.id,
              rootType: destFolder.rootType || this.currentRootType,
              rootId: destFolder.rootId || this.currentRootId
            });
            // 트리 직접 업데이트 (새로고침 없이)
            this.moveFolderInTree(sourceItem.id, destFolder.id);
          } else if (sourceItem.type === 'document' || sourceItem.type === 'file') {
            await driveService.moveElement(sourceItem.id, {
              folderId: destFolder.id,
              type: sourceItem.type,  // 'document' 또는 'file'
              rootType: destFolder.rootType || this.currentRootType,
              rootId: destFolder.rootId || this.currentRootId
            });
          }
          showSnackbar(`"${sourceItem.name}"을(를) "${destFolder.name}"(으)로 이동했습니다.`, 'success');
        }
        
        // 현재 루트 정보를 유지하면서 새로고침
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
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

    // 트리뷰 드래그 앤 드롭
    onTreeDragOver(e, treeItem) {
      if (!this.draggingItem) return;
      
      // 자기 자신에게는 드롭 불가
      if (this.draggingItem.id === treeItem.id) return;
      
      // 루트로 드롭하는 경우 허용 (워크스페이스 루트 또는 루트 항목 노드)
      if (treeItem.id === 'root' || treeItem.isRoot) {
        // 루트로 옮기기 허용
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        this.dragOverTreeFolder = treeItem;
        this.dragOverItem = null;
        return;
      }
      
      // 폴더인 경우 순환 이동 방지 (자기 자신의 하위 폴더로는 이동 불가)
      if (this.draggingItem.type === 'folder' && this.isDescendantOf(treeItem.id, this.draggingItem.id)) {
        return; // 드롭 불가능한 상태
      }
      
      e.preventDefault();
      e.stopPropagation(); // 이벤트 버블링 방지
      e.dataTransfer.dropEffect = 'move';
      this.dragOverTreeFolder = treeItem;
      
      // 트리뷰가 드래그 오버되면 테이블의 드래그 오버 상태 초기화
      this.dragOverItem = null;
    },

    onTreeDragLeave(e) {
      // 자식 요소로 이동하는 경우를 제외하기 위해 약간의 지연
      // 실제로 트리뷰 영역을 벗어났는지 확인
      const relatedTarget = e.relatedTarget;
      if (!relatedTarget || !this.$el.querySelector('.folder-tree')?.contains(relatedTarget)) {
        // 트리뷰 영역 밖으로 나갔을 때만 초기화
        setTimeout(() => {
          this.dragOverTreeFolder = null;
        }, 100);
      }
    },

    async onTreeDrop(e, targetFolder) {
      e.preventDefault();
      e.stopPropagation(); // 이벤트 버블링 방지 (테이블 드롭과 중복 방지)
      
      if (!this.draggingItem || !targetFolder) return;
      if (this.draggingItem.id === targetFolder.id) return; // 자기 자신에게는 드롭 불가
      
      // 루트로 이동하는 경우 처리 (워크스페이스 루트 또는 루트 항목 노드)
      if (targetFolder.id === 'root' || targetFolder.isRoot) {
        // 로컬 변수로 저장
        const sourceItem = this.draggingItem;
        
        // 즉시 초기화
        this.draggingItem = null;
        this.dragOverItem = null;
        this.dragOverTreeFolder = null;
        
        try {
          // 타입에 따라 적절한 API 호출
          if (sourceItem.type === 'folder') {
            // 루트로 이동: parentId를 null로 설정
            const targetRootType = targetFolder.rootType || this.currentRootType;
            const targetRootId = targetFolder.rootId || this.currentRootId;
            
            console.log('[DriveMain] [트리뷰 루트 이동] API 호출 시작:', {
              folderId: sourceItem.id,
              folderName: sourceItem.name,
              targetRootType,
              targetRootId,
              targetFolderId: targetFolder.id,
              targetFolderName: targetFolder.name
            });
            
            await driveService.moveFolder(sourceItem.id, {
              parentId: null,
              rootType: targetRootType,
              rootId: targetRootId
            });
            
            // 루트 타겟 판단: 'root' 노드이거나 isRoot 플래그가 있거나 rootType이 있으면 루트
            const isRootTarget = targetFolder.id === 'root' || targetFolder.isRoot || (targetRootType && targetRootId);
            
            console.log('[DriveMain] [트리뷰 루트 이동] API 호출 완료, 트리 업데이트 시작:', {
              targetRootType,
              targetRootId,
              targetFolderId: targetFolder.id,
              targetFolderIsRoot: targetFolder.isRoot,
              isRootTarget,
              willUpdateTree: targetRootType === 'WORKSPACE'
            });
            
            // 트리뷰에 반영: 워크스페이스는 'root' 노드, STONE/PROJECT는 해당 루트 노드 찾기
            if (targetRootType === 'WORKSPACE') {
              console.log('[DriveMain] [트리뷰 루트 이동] WORKSPACE 루트로 이동 → moveFolderInTree 호출');
              const moved = this.moveFolderInTree(sourceItem.id, 'root');
              console.log('[DriveMain] [트리뷰 루트 이동] moveFolderInTree 결과:', moved);
            } else {
              // STONE 또는 PROJECT 루트 노드 찾기
              console.log('[DriveMain] [트리뷰 루트 이동] STONE/PROJECT 루트로 이동, 루트 노드 찾기:', {
                targetRootType,
                targetRootId
              });
              const rootNode = this.findRootNodeBy(targetRootType, targetRootId);
              if (rootNode) {
                console.log('[DriveMain] [트리뷰 루트 이동] 루트 노드 찾음:', {
                  rootNodeId: rootNode.id,
                  rootNodeName: rootNode.name,
                  rootType: rootNode.rootType,
                  rootId: rootNode.rootId,
                  hasId: !!rootNode.id
                });
                // 루트 노드의 id가 없으면 rootType:rootId 형식의 특별한 ID 사용
                const parentId = rootNode.id || `${targetRootType}:${targetRootId}`;
                console.log('[DriveMain] [트리뷰 루트 이동] 사용할 parentId:', parentId);
                const moved = this.moveFolderInTree(sourceItem.id, parentId, rootNode);
                console.log('[DriveMain] [트리뷰 루트 이동] moveFolderInTree 결과:', moved);
              } else {
                console.log('[DriveMain] [트리뷰 루트 이동] 루트 노드를 찾을 수 없음 → 트리에서 제거:', {
                  targetRootType,
                  targetRootId,
                  willRemove: true
                });
                this.removeFolderFromTree(sourceItem.id);
                console.log('[DriveMain] [트리뷰 루트 이동] 트리에서 제거 완료');
              }
            }
          } else if (sourceItem.type === 'document' || sourceItem.type === 'file') {
            // 문서/파일도 루트로 이동 가능: folderId를 null로 설정
            await driveService.moveElement(sourceItem.id, {
              folderId: null,
              type: sourceItem.type,  // 'document' 또는 'file'
              rootType: targetFolder.rootType || this.currentRootType,
              rootId: targetFolder.rootId || this.currentRootId
            });
          }
          
          showSnackbar(`"${sourceItem.name}"을(를) "${targetFolder.name}"(으)로 이동했습니다.`, 'success');
          
          // 현재 루트 정보를 유지하면서 새로고침
          if (this.currentRootType && this.currentRootId) {
            await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
          } else {
            await this.loadFolderContents(this.currentFolderId);
          }
        } catch (error) {
          console.error('이동 실패:', error);
          const errorMessage = error.response?.data?.statusMessage || '이동에 실패했습니다.';
          showSnackbar(errorMessage, 'error');
        }
        return;
      }
      
      // 폴더인 경우 순환 이동 방지 (자기 자신의 하위 폴더로는 이동 불가)
      if (this.draggingItem.type === 'folder' && this.isDescendantOf(targetFolder.id, this.draggingItem.id)) {
        showSnackbar('자기 자신의 하위 폴더로는 이동할 수 없습니다.', 'warning');
        this.draggingItem = null;
        this.dragOverItem = null;
        this.dragOverTreeFolder = null;
        return;
      }
      
      // 로컬 변수로 저장 (나중에 null이 되어도 사용 가능)
      const sourceItem = this.draggingItem;
      const destFolder = {
        id: targetFolder.id,
        name: targetFolder.name,
        type: 'folder'
      };
      
      // 즉시 초기화
      this.draggingItem = null;
      this.dragOverItem = null;
      this.dragOverTreeFolder = null;
      
      try {
        // 타입에 따라 적절한 API 호출 (테이블의 onDrop과 동일한 로직)
        if (sourceItem.type === 'folder') {
          await driveService.moveFolder(sourceItem.id, {
            parentId: destFolder.id,
            rootType: destFolder.rootType || this.currentRootType,
            rootId: destFolder.rootId || this.currentRootId
          });
          
          // 트리 직접 업데이트 (새로고침 없이)
          this.moveFolderInTree(sourceItem.id, destFolder.id);
        } else if (sourceItem.type === 'document' || sourceItem.type === 'file') {
          // 문서/파일은 통합 API 사용 (ElementMoveDto)
          await driveService.moveElement(sourceItem.id, {
            folderId: destFolder.id,
            type: sourceItem.type,  // 'document' 또는 'file'
            rootType: destFolder.rootType || this.currentRootType,
            rootId: destFolder.rootId || this.currentRootId
          });
        }
        
        showSnackbar(`"${sourceItem.name}"을(를) "${destFolder.name}"(으)로 이동했습니다.`, 'success');
        
        // 현재 루트 정보를 유지하면서 새로고침
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('이동 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || '이동에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      }
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

    openInfoFromMenu() {
      if (!this.actionTarget) return;
      this.openInfoDialog(this.actionTarget);
    },

    openRenameFromMenu() {
      if (!this.canRename(this.actionTarget)) return;
      this.openRenameDialog(this.actionTarget);
    },

    deleteFromMenu() {
      if (!this.canDelete(this.actionTarget)) return;
      this.openDeleteDialog(this.actionTarget);
    },

    async moveToRootFromMenu() {
      if (!this.actionTarget) return;
      const sourceItem = this.actionTarget;
      try {
        if (!this.currentRootType || !this.currentRootId) {
          // 테이블 상단 루트 행이 있는 경우 그 값을 우선 사용
          const topRoot = this.items?.find?.(it => it.type === 'STONE' || it.type === 'PROJECT');
          if (topRoot?.rootType && topRoot?.rootId) {
            this.currentRootType = topRoot.rootType;
            this.currentRootId = topRoot.rootId;
          }
        }
        if (sourceItem.type === 'folder') {
          console.log('[DriveMain] [메뉴 루트 이동] API 호출 시작:', {
            folderId: sourceItem.id,
            folderName: sourceItem.name,
            currentRootType: this.currentRootType,
            currentRootId: this.currentRootId
          });
          
          await driveService.moveFolder(sourceItem.id, {
            parentId: null,
            rootType: this.currentRootType,
            rootId: this.currentRootId,
          });
          
          console.log('[DriveMain] [메뉴 루트 이동] API 호출 완료, 트리 업데이트 시작:', {
            currentRootType: this.currentRootType,
            currentRootId: this.currentRootId,
            willUpdateTree: true
          });
          
          // 트리뷰에 반영: 워크스페이스는 'root' 노드, STONE/PROJECT는 해당 루트 노드 찾기
          if (this.currentRootType === 'WORKSPACE') {
            console.log('[DriveMain] [메뉴 루트 이동] WORKSPACE 루트로 이동 → moveFolderInTree 호출');
            const moved = this.moveFolderInTree(sourceItem.id, 'root');
            console.log('[DriveMain] [메뉴 루트 이동] moveFolderInTree 결과:', moved);
          } else {
            // STONE 또는 PROJECT 루트 노드 찾기
            console.log('[DriveMain] [메뉴 루트 이동] STONE/PROJECT 루트로 이동, 루트 노드 찾기:', {
              currentRootType: this.currentRootType,
              currentRootId: this.currentRootId
            });
            const rootNode = this.findRootNodeBy(this.currentRootType, this.currentRootId);
            if (rootNode) {
              console.log('[DriveMain] [메뉴 루트 이동] 루트 노드 찾음:', {
                rootNodeId: rootNode.id,
                rootNodeName: rootNode.name,
                rootType: rootNode.rootType,
                rootId: rootNode.rootId,
                hasId: !!rootNode.id
              });
              // 루트 노드의 id가 없으면 rootType:rootId 형식의 특별한 ID 사용
              const parentId = rootNode.id || `${this.currentRootType}:${this.currentRootId}`;
              console.log('[DriveMain] [메뉴 루트 이동] 사용할 parentId:', parentId);
              const moved = this.moveFolderInTree(sourceItem.id, parentId, rootNode);
              console.log('[DriveMain] [메뉴 루트 이동] moveFolderInTree 결과:', moved);
            } else {
              console.log('[DriveMain] [메뉴 루트 이동] 루트 노드를 찾을 수 없음 → 트리에서 제거:', {
                currentRootType: this.currentRootType,
                currentRootId: this.currentRootId,
                willRemove: true
              });
              this.removeFolderFromTree(sourceItem.id);
              console.log('[DriveMain] [메뉴 루트 이동] 트리에서 제거 완료');
            }
          }
        } else if (sourceItem.type === 'document' || sourceItem.type === 'file') {
          await driveService.moveElement(sourceItem.id, {
            folderId: null,
            type: sourceItem.type,
            rootType: this.currentRootType,
            rootId: this.currentRootId,
          });
        } else {
          return;
        }

        // 목적지 이름 추출 (상단 루트 행 또는 현재 루트명)
        const destName = (this.items?.find?.(it => it.type === 'STONE' || it.type === 'PROJECT')?.name)
          || this.rootName || this.driveRootName || '루트';
        showSnackbar(`"${sourceItem.name}"을(를) "${destName}"(으)로 이동했습니다.`, 'success');
        // 새로고침
        if (this.currentRootType && this.currentRootId) {
          await this.loadFolderContents(this.currentFolderId, this.currentRootType, this.currentRootId);
        } else {
          await this.loadFolderContents(this.currentFolderId);
        }
      } catch (error) {
        console.error('루트로 이동 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || '루트로 이동에 실패했습니다.';
        showSnackbar(errorMessage, 'error');
      }
    },

    // 삭제 다이얼로그 열기
    openDeleteDialog(item) {
      this.deleteItem = item;
      this.deleteDialog = true;
    },

    // 리사이저 관련 메서드
    onResizerMouseDown(e) {
      e.preventDefault();
      this.isResizing = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      this.resizeStartX = clientX;
      this.resizeStartWidth = this.sidebarWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },

    onResizerMouseMove(e) {
      if (!this.isResizing) return;
      
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - this.resizeStartX;
      const newWidth = this.resizeStartWidth + deltaX;
      
      // 최소 너비와 최대 너비 제한
      const containerWidth = this.$el?.querySelector('.drive-layout')?.clientWidth || window.innerWidth;
      const minWidth = 200;
      const maxWidth = containerWidth * 0.5; // 최대 50%
      
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      this.sidebarWidth = clampedWidth;
      
      // 로컬스토리지에 저장
      localStorage.setItem('driveSidebarWidth', clampedWidth.toString());
    },

    onResizerMouseUp() {
      if (this.isResizing) {
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
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
  background-color: #F5F5F5;
}

/* 프로젝트 문서함 전용 컨테이너 스타일 - v-container 공간 활용 */
.drive-container.project-drive-container {
  padding: 20px 45px 30px 45px !important;
  background-color: #F5F5F5;
  max-width: 100%;
  box-sizing: border-box;
  min-height: calc(100vh - 64px);
}

/* 프로젝트 문서함일 때 v-container의 기본 패딩 제거하고 커스텀 패딩 적용 */
.drive-container.project-drive-container.v-container--fluid {
  padding-left: 45px !important;
  padding-right: 45px !important;
  padding-top: 20px !important;
  padding-bottom: 30px !important;
}

.drive-layout {
  display: flex;
  height: calc(100vh - 64px);
  width: 100%;
}

/* 프로젝트 문서함 전용 레이아웃 스타일 - 높이만 조정 (gap 없음) */
.drive-container.project-drive-container .drive-layout {
  height: calc(100vh - 64px - 50px); /* 상하 패딩 20px + 30px = 50px */
}

.sidebar-col {
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  flex-shrink: 0;
  transition: width 0.1s ease;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.02);
}

/* 프로젝트 문서함 전용 사이드바 스타일 - 카드 형태 */
.drive-container.project-drive-container .sidebar-col {
  border-radius: 8px 0 0 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  max-height: calc(100vh - 64px - 50px);
  border-right: none;
  background-color: #ffffff;
}

.resizer {
  width: 2px;
  background-color: #e8e8e8;
  cursor: col-resize;
  flex-shrink: 0;
  user-select: none;
  position: relative;
  transition: all 0.2s ease;
}

.resizer:hover {
  background-color: #1976d2;
  width: 3px;
}

.main-content-col {
  max-height: calc(100vh - 64px);
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  box-shadow: -1px 0 2px rgba(0, 0, 0, 0.02);
}

/* 프로젝트 문서함 전용 메인 컨텐츠 스타일 - 카드 형태 (트리뷰와 붙어있음) */
.drive-container.project-drive-container .main-content-col {
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  max-height: calc(100vh - 64px - 50px);
  overflow: hidden;
  background-color: #ffffff;
}

/* 프로젝트 문서함 전용 메인 컨텐츠 카드 - 바닥 부분 자연스럽게 */
.drive-container.project-drive-container .main-content-card {
  border-radius: 0 8px 8px 0;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 프로젝트 문서함 전용 테이블 래퍼 - 바닥까지 자연스럽게 */
.drive-container.project-drive-container .table-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0 0 8px 0;
}

/* 프로젝트 문서함 전용 테이블 컨테이너 - 바닥 처리 */
.drive-container.project-drive-container .table-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.drive-container.project-drive-container .table-container :deep(.v-data-table) {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0 0 8px 0;
}

.drive-container.project-drive-container .table-container :deep(.v-data-table__wrapper) {
  flex: 1;
  border-radius: 0 0 8px 0;
  overflow: hidden;
}

.drive-container.project-drive-container .table-container :deep(.v-data-table__wrapper table) {
  border-radius: 0 0 8px 0;
}

/* Ensure the toolbar height matches the sidebar header */
.main-content-col :deep(.v-toolbar) {
  min-height: 64px;
  height: 64px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to bottom, #ffffff, #fafafa);
}

/* 프로젝트 문서함 전용 툴바 스타일 */
.drive-container.project-drive-container .main-content-col :deep(.v-toolbar) {
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 20px;
}

/* 툴바 title Pretendard 폰트 */
.main-content-col :deep(.v-toolbar-title),
.main-content-col :deep(.v-toolbar .text-h6) {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', sans-serif !important;
  font-weight: 600 !important;
}

/* 스톤 문서함(간소화 모드) 툴바 타이틀 - 더 많은 이름 표시 */
.main-content-col :deep(.v-toolbar-title) {
  flex: 1 1 auto;
  min-width: 0;
  max-width: calc(100% - 200px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 16px;
}

/* 간소화 모드일 때 spacer 최소화하고 타이틀 공간 확대 */
.main-content-col :deep(.v-toolbar .v-spacer) {
  flex: 0 0 auto;
  min-width: 16px;
}

.folder-tree-card,
.main-content-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.sidebar-header {
  border-bottom: 1px solid #f0f0f0;
  height: 64px; /* match toolbar height */
  padding: 0 20px !important; /* override pa-4 vertical padding, keep px-4 */
  display: flex;
  align-items: center;
  background: linear-gradient(to bottom, #ffffff, #fafafa);
}

.drive-root-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif !important;
  font-size: 19px !important; /* override utility classes */
  font-weight: 500;
  letter-spacing: -0.3px;
  margin: 0;
  color: #1a1a1a;
  line-height: 1.4;
}

.folder-tree :deep(.v-treeview-node__root) {
  min-height: auto;
  background-color: transparent !important;
  margin: 0 !important;
  margin-bottom: 2px !important;
  padding: 0 !important;
}

/* 모든 노드 상태에서 배경색 및 테두리 제거 */
.folder-tree :deep(.v-treeview-node),
.folder-tree :deep(.v-treeview-node__root),
.folder-tree :deep(.v-treeview-node__content),
.folder-tree :deep(.v-treeview-node--active),
.folder-tree :deep(.v-treeview-node--active .v-treeview-node__content),
.folder-tree :deep(.v-treeview-node--active .v-treeview-node__root) {
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  border: none !important;
  margin: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.folder-tree :deep(.v-treeview-node) {
  margin-bottom: 2px !important;
}

.folder-tree :deep(.v-treeview-node__content) {
  cursor: default;
  /* 빈 공간 클릭 방지 */
  pointer-events: none;
  /* 활성화 배경색 제거 */
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  border: none !important;
  padding: 0 4px !important;
}

/* 호버 효과 제거 (모든 상태) */
.folder-tree :deep(.v-treeview-node:hover),
.folder-tree :deep(.v-treeview-node__root:hover),
.folder-tree :deep(.v-treeview-node__content:hover),
.folder-tree :deep(.v-treeview-node--active:hover),
.folder-tree :deep(.v-treeview-node--active:hover .v-treeview-node__content) {
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  border: none !important;
}

/* 포커스 효과 제거 (토글 클릭 시) */
.folder-tree :deep(.v-treeview-node__toggle:focus),
.folder-tree :deep(.v-treeview-node__toggle:focus-visible),
.folder-tree :deep(.v-treeview-node__toggle:active),
.folder-tree :deep(.v-treeview-node__content:focus),
.folder-tree :deep(.v-treeview-node__content:focus-visible),
.folder-tree :deep(.v-treeview-node__root:focus),
.folder-tree :deep(.v-treeview-node__root:focus-visible) {
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  border: none !important;
}

.folder-tree :deep(.v-treeview-node__toggle),
.folder-tree :deep(.v-treeview-node__toggle *),
.folder-tree :deep(.v-treeview-node__toggle button),
.folder-tree :deep(.v-treeview-node__toggle button *),
.folder-tree :deep(.v-treeview-node__toggle .v-btn),
.folder-tree :deep(.v-treeview-node__toggle .v-btn *),
.folder-tree :deep(.v-treeview-node__toggle .v-btn--icon),
.folder-tree :deep(.v-treeview-node__toggle .v-btn--variant-text),
.folder-tree :deep(.v-treeview-node__toggle::before),
.folder-tree :deep(.v-treeview-node__toggle::after) {
  cursor: pointer;
  pointer-events: auto;
  /* 모든 상태에서 테두리 완전 제거 */
  outline: none !important;
  border: none !important;
  border-width: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

.folder-tree :deep(.v-treeview-node__toggle:hover),
.folder-tree :deep(.v-treeview-node__toggle:focus),
.folder-tree :deep(.v-treeview-node__toggle:active),
.folder-tree :deep(.v-treeview-node__toggle:focus-visible),
.folder-tree :deep(.v-treeview-node__toggle:visited),
.folder-tree :deep(.v-treeview-node__toggle:hover *),
.folder-tree :deep(.v-treeview-node__toggle:focus *),
.folder-tree :deep(.v-treeview-node__toggle:active *),
.folder-tree :deep(.v-treeview-node__toggle:hover button),
.folder-tree :deep(.v-treeview-node__toggle:focus button),
.folder-tree :deep(.v-treeview-node__toggle:active button),
.folder-tree :deep(.v-treeview-node__toggle button:hover),
.folder-tree :deep(.v-treeview-node__toggle button:focus),
.folder-tree :deep(.v-treeview-node__toggle button:active),
.folder-tree :deep(.v-treeview-node__toggle .v-btn:hover),
.folder-tree :deep(.v-treeview-node__toggle .v-btn:focus),
.folder-tree :deep(.v-treeview-node__toggle .v-btn:active),
.folder-tree :deep(.v-treeview-node__toggle .v-btn--icon:hover),
.folder-tree :deep(.v-treeview-node__toggle .v-btn--icon:focus),
.folder-tree :deep(.v-treeview-node__toggle .v-btn--icon:active) {
  background-color: transparent !important;
  outline: none !important;
  border: none !important;
  border-width: 0 !important;
  box-shadow: none !important;
}

/* v-btn 관련 추가 스타일 */
.folder-tree :deep(.v-btn),
.folder-tree :deep(.v-btn--icon),
.folder-tree :deep(.v-btn--variant-text),
.folder-tree :deep(.v-treeview-node__toggle .v-btn),
.folder-tree :deep(.v-treeview-node__toggle .v-btn--icon),
.folder-tree :deep(.v-treeview-node__toggle .v-btn--variant-text) {
  outline: none !important;
  border: none !important;
  border-width: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

.folder-tree :deep(.v-btn:hover),
.folder-tree :deep(.v-btn:focus),
.folder-tree :deep(.v-btn:active),
.folder-tree :deep(.v-btn--icon:hover),
.folder-tree :deep(.v-btn--icon:focus),
.folder-tree :deep(.v-btn--icon:active),
.folder-tree :deep(.v-treeview-node__toggle .v-btn:hover),
.folder-tree :deep(.v-treeview-node__toggle .v-btn:focus),
.folder-tree :deep(.v-treeview-node__toggle .v-btn:active) {
  outline: none !important;
  border: none !important;
  border-width: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

.folder-tree :deep(.v-treeview-node__label) {
  font-size: 13px;
  cursor: pointer;
  pointer-events: auto;
}

.folder-tree :deep(.v-treeview-node__prepend) {
  pointer-events: auto;
}

.folder-tree {
  padding: 8px !important;
}

.folder-tree :deep(.v-list-item),
.folder-tree :deep(.v-list-item--link),
.folder-tree :deep(.v-list-group__header),
.folder-tree :deep(.v-treeview-item) {
  min-height: 36px !important;
  height: auto !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.folder-label {
  cursor: pointer;
  display: inline-block;
  padding: 0 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 13.5px;
}

.folder-label:hover {
  color: #1976d2;
  background-color: #f0f4ff;
  transform: translateX(2px);
}

.folder-label.drag-over-tree {
  background-color: #e3f2fd !important;
  color: #1976d2 !important;
  font-weight: 600;
  border: 2px solid #1976d2;
  border-radius: 4px;
}

.drive-table :deep(tbody tr) {
  cursor: pointer;
}

.drive-table :deep(tbody tr:hover) {
  background-color: #f8f9fa !important;
  transition: background-color 0.15s ease;
}

/* 빈 폴더 상태일 때 hover 효과 비활성화 */
.drive-table :deep(tbody tr:has(.empty-folder-container)),
.drive-table :deep(tbody tr:has(.empty-folder-container):hover) {
  background-color: transparent !important;
  cursor: default !important;
}

/* :has() 미지원 브라우저를 위한 대체 방법 */
.drive-table :deep(.empty-folder-container),
.drive-table :deep(.empty-folder-container:hover),
.drive-table :deep(.empty-folder-container *) {
  pointer-events: none;
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

.clickable-row.highlighted-item {
  background-color: #fff3cd !important;
  border-left: 3px solid #ffc107 !important;
  animation: highlightPulse 2s ease-in-out;
}

@keyframes highlightPulse {
  0%, 100% {
    background-color: #fff3cd;
  }
  50% {
    background-color: #ffe69c;
  }
}

/* 테이블 행 전체 하이라이트 */
.drive-table :deep(.highlighted-row) {
  background-color: #fff3cd !important;
}

.drive-table :deep(.highlighted-row:hover) {
  background-color: #ffe69c !important;
}

.clickable-row {
  min-width: 0;
  overflow: hidden;
}

.clickable-row .v-icon {
  flex-shrink: 0;
}

.clickable-row:hover {
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.item-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  letter-spacing: -0.2px;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.clickable-row:hover .item-name {
  color: #1976d2;
}

/* 이미지 아이콘 스타일 */
.tree-item-icon-image {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.item-icon-image {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
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
  outline: none !important;
  border: none !important;
}

.filter-btn:hover,
.filter-btn:focus,
.filter-btn:active,
.filter-btn:focus-visible {
  background-color: #e8e8e8 !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}

.filter-btn-active {
  background-color: white !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
  color: #1976d2 !important;
  font-weight: 600;
  outline: none !important;
  border: none !important;
}

.filter-btn-active:hover,
.filter-btn-active:focus,
.filter-btn-active:active,
.filter-btn-active:focus-visible {
  outline: none !important;
  border: none !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
}

/* 새로고침 버튼 스타일 */
.refresh-btn {
  border-radius: 8px !important;
  border: 1px solid #e0e0e0 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  font-weight: 500 !important;
  text-transform: none !important;
  padding: 6px 16px !important;
  color: #5f6368 !important;
  background-color: white !important;
}

.refresh-btn:hover {
  background-color: #f5f5f5 !important;
  border-color: #1976d2 !important;
  color: #1976d2 !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15) !important;
}

.refresh-btn :deep(.v-icon) {
  transition: transform 0.3s ease !important;
}

.refresh-btn:hover :deep(.v-icon) {
  transform: rotate(180deg);
}

/* 신규 버튼 스타일 */
.new-btn {
  border-radius: 6px !important;
  box-shadow: none !important;
  transition: all 0.2s ease !important;
  font-weight: 500 !important;
  text-transform: none !important;
  padding: 8px 16px !important;
  letter-spacing: 0 !important;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
  border: none !important;
}

.new-btn:hover {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%) !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3) !important;
  transform: translateY(-1px);
}

.new-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(25, 118, 210, 0.2) !important;
}

.new-btn :deep(.v-icon) {
  color: white !important;
  margin-right: 4px !important;
}

.new-btn :deep(.v-btn__content) {
  color: white !important;
  font-size: 14px !important;
}

/* 새로고침 버튼 및 신규 버튼 테두리 제거 */
.main-content-col :deep(.v-toolbar .v-btn),
.main-content-col :deep(.v-toolbar .v-btn--text),
.main-content-col :deep(.v-toolbar .v-btn--depressed),
.main-content-col :deep(.v-toolbar .v-btn--small) {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}

.main-content-col :deep(.v-toolbar .v-btn:hover),
.main-content-col :deep(.v-toolbar .v-btn:focus),
.main-content-col :deep(.v-toolbar .v-btn:active),
.main-content-col :deep(.v-toolbar .v-btn:focus-visible),
.main-content-col :deep(.v-toolbar .v-btn--text:hover),
.main-content-col :deep(.v-toolbar .v-btn--text:focus),
.main-content-col :deep(.v-toolbar .v-btn--text:active),
.main-content-col :deep(.v-toolbar .v-btn--depressed:hover),
.main-content-col :deep(.v-toolbar .v-btn--depressed:focus),
.main-content-col :deep(.v-toolbar .v-btn--depressed:active) {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
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
  font-size: 13.5px;
  font-weight: 600;
  color: #5f6368;
  letter-spacing: -0.1px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
}

.clickable-header {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
}

.clickable-header:hover {
  opacity: 0.8;
  color: #1976d2;
  transition: all 0.2s ease;
}

.drive-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.drive-table :deep(thead) {
  background: linear-gradient(to bottom, #ffffff, #fafafa);
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.drive-table :deep(thead th) {
  font-weight: 600;
  color: #3c4043;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  text-transform: none;
  background-color: transparent;
  position: relative;
  font-size: 13.5px;
  letter-spacing: -0.1px;
}

.drive-table :deep(thead th:first-child) {
  padding-left: 24px;
}

.drive-table :deep(tbody td) {
  padding: 14px 20px;
  color: #202124;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
}

/* 이름 셀 overflow 처리 */
.drive-table :deep(tbody td:first-child) {
  overflow: hidden;
}

.drive-table :deep(tbody td:first-child > div) {
  overflow: hidden;
  min-width: 0;
  width: 100%;
}

.drive-table :deep(tbody td:first-child .item-name) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* 테이블 래퍼 및 컨테이너 */
.table-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  transition: all 0.2s ease;
  position: relative;
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

/* 파일 드래그 오버레이 (테이블 본문에만) */
.file-drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.file-drag-message {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 32px 48px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border: 3px dashed #1976d2;
}

.file-drag-text {
  font-size: 20px;
  font-weight: 600;
  color: #1976d2;
  margin-top: 16px;
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
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}

.breadcrumb-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  display: inline-block;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', sans-serif !important;
  font-size: 13.5px;
  font-weight: 500;
  color: #5f6368;
  letter-spacing: -0.1px;
  transition: color 0.2s ease;
}

.breadcrumb-item:hover .breadcrumb-text {
  color: #1976d2;
}

/* 브레드크럼 컨테이너 overflow 처리 */
.px-4 :deep(.v-breadcrumbs) {
  overflow: hidden;
}

.px-4 :deep(.v-breadcrumbs__item) {
  min-width: 0;
  overflow: hidden;
  max-width: 200px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', sans-serif !important;
}

.upload-zone {
  border: 2px dashed #cfd8dc;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  background: #fafafa;
  transition: opacity 0.2s;
}

.upload-zone:hover {
  background-color: #e3f2fd;
}

.upload-zone-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 모던 업로드 영역은 위의 modern-upload-zone 스타일 사용 */
.modern-upload-zone.upload-zone-disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.upload-limits-info {
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 3px solid #2196f3;
}

.upload-status {
  padding: 8px 12px;
  background: #e8f5e9;
  border-radius: 6px;
  border-left: 3px solid #4caf50;
}

.upload-status-error {
  background: #fff3cd !important;
  border-left-color: #ffc107 !important;
}

.upload-status-error .error--text {
  color: #d32f2f !important;
}

.upload-progress {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.preview-card {
  transition: box-shadow .2s ease;
}
.preview-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,.08); }

.preview-thumb .rounded { border-radius: 6px; }

/* Ensure remove button is always visible on preview cards */
.position-relative { position: relative; }
.preview-text-content {
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 80px); /* 썸네일(56px) + 마진(24px) = 80px, X버튼 공간 확보 */
  padding-right: 36px; /* X 버튼 공간 확보 */
}

.remove-btn-abs {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  background: rgba(255,255,255,0.95) !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
  border-radius: 50% !important;
}

/* Responsive */
@media (max-width: 960px) {
  .sidebar-col {
    display: none;
  }
  .resizer {
    display: none;
  }
  .main-content-col {
    width: 100% !important;
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

/* 빈 폴더 UI */
.empty-folder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 48px 24px;
  pointer-events: none;
  user-select: none;
}

.empty-folder-content {
  text-align: center;
  max-width: 400px;
}

.empty-folder-icon {
  margin-bottom: 24px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.empty-folder-image {
  width: 280px;
  height: auto;
  max-width: 100%;
  margin-bottom: 24px;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.empty-folder-title {
  font-size: 18px;
  font-weight: 600;
  color: #3c4043;
  margin-bottom: 10px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  letter-spacing: -0.3px;
}

.empty-folder-subtitle {
  font-size: 14px;
  color: #80868b;
  line-height: 1.6;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
  letter-spacing: -0.1px;
}
</style>

<style>
/* Global styles for overlay content appended to body */
.action-menu-content {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12) !important;
  border: none !important;
  background: #ffffff !important;
  border-radius: 4px !important;
}

/* 모던 다이얼로그 스타일 - 구글 드라이브 스타일 */
.modern-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

.modern-modal-card {
  border-radius: 16px !important;
  box-shadow: 0 8px 10px 1px rgba(0, 0, 0, 0.14), 
              0 3px 14px 2px rgba(0, 0, 0, 0.12), 
              0 5px 5px -3px rgba(0, 0, 0, 0.2) !important;
  overflow: hidden;
}

.modern-modal-header {
  padding: 24px 24px 20px 24px !important;
  background: #ffffff !important;
  border-bottom: none !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modern-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f0fe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modern-modal-title {
  font-size: 20px;
  font-weight: 500;
  color: #202124;
  letter-spacing: 0;
  line-height: 1.4;
  font-family: 'Google Sans', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', sans-serif;
}

.modern-modal-subtitle {
  font-size: 13px;
  color: #5f6368;
  margin-top: 4px;
  font-weight: 400;
  line-height: 1.4;
}

.modern-modal-content {
  padding: 0 24px 8px 24px !important;
}

.modern-text-field {
  margin-top: 8px;
}

.modern-text-field :deep(.v-input__control) {
  min-height: 48px;
}

.modern-text-field :deep(.v-input__slot) {
  background-color: #f1f3f4 !important;
  border-radius: 8px !important;
  padding: 0 16px !important;
  transition: background-color 0.2s ease;
}

.modern-text-field :deep(.v-input__slot):hover {
  background-color: #e8eaed !important;
}

.modern-text-field :deep(.v-input__slot):focus-within {
  background-color: #ffffff !important;
  box-shadow: 0 0 0 2px #1a73e8 !important;
}

.modern-text-field :deep(.v-label) {
  color: #5f6368 !important;
  font-size: 14px;
  font-weight: 400;
}

.modern-text-field :deep(.v-input__control input) {
  color: #202124 !important;
  font-size: 14px;
}

.modern-modal-actions {
  padding: 16px 24px 24px 24px !important;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modern-cancel-btn {
  text-transform: none !important;
  font-weight: 500 !important;
  letter-spacing: 0.25px !important;
  padding: 0 24px !important;
  min-width: 88px !important;
  height: 36px !important;
  color: #5f6368 !important;
  border-radius: 4px !important;
  transition: background-color 0.2s ease !important;
}

.modern-cancel-btn:hover {
  background-color: rgba(95, 99, 104, 0.08) !important;
}

.modern-primary-btn {
  text-transform: none !important;
  font-weight: 500 !important;
  letter-spacing: 0.25px !important;
  padding: 0 24px !important;
  min-width: 88px !important;
  height: 36px !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  transition: background-color 0.2s ease !important;
}

.modern-primary-btn:hover {
  box-shadow: none !important;
}

.modern-error-btn {
  text-transform: none !important;
  font-weight: 500 !important;
  letter-spacing: 0.25px !important;
  padding: 0 24px !important;
  min-width: 88px !important;
  height: 36px !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  transition: background-color 0.2s ease !important;
}

.modern-error-btn:hover {
  box-shadow: none !important;
}

.delete-icon-wrapper {
  background: #fce8e6 !important;
}

.modern-alert {
  border-radius: 8px !important;
  background-color: #fef7e0 !important;
}

/* 상세 정보 사이드 패널 스타일 */
.info-side-panel {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1) !important;
}

.info-side-panel :deep(.v-navigation-drawer__content) {
  padding: 0 !important;
  overflow: hidden;
}

.info-panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.info-panel-header {
  padding: 24px;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.info-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.info-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

.modern-close-btn {
  color: #5f6368 !important;
  transition: background-color 0.2s ease !important;
}

.modern-close-btn:hover {
  background-color: rgba(95, 99, 104, 0.08) !important;
}

.modern-info-content {
  padding: 24px !important;
  max-height: 400px;
  overflow-y: auto;
}

.info-list-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-list-item {
  padding: 16px 0;
  border-bottom: 1px solid #f1f3f4;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-list-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: #202124;
  font-weight: 400;
  line-height: 1.5;
  word-break: break-word;
}

.modern-error-btn-text {
  text-transform: none !important;
  font-weight: 500 !important;
  letter-spacing: 0.25px !important;
  padding: 0 16px !important;
  min-width: auto !important;
  height: 36px !important;
  color: #ea4335 !important;
  transition: background-color 0.2s ease !important;
}

.modern-error-btn-text:hover {
  background-color: rgba(234, 67, 53, 0.08) !important;
}

.modern-error-btn-text:disabled {
  opacity: 0.38 !important;
}

/* 업로드 다이얼로그 특별 스타일 */
.upload-dialog-card .modern-modal-header {
  padding-bottom: 16px !important;
}

.modern-upload-zone {
  border: 2px dashed #dadce0;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: #f8f9fa;
  transition: all 0.2s ease;
  margin-top: 16px;
  cursor: pointer;
}

.modern-upload-zone:hover {
  border-color: #1a73e8;
  background: #e8f0fe;
}

.modern-upload-zone:active {
  border-color: #1557b0;
  background: #d2e3fc;
}

.upload-icon-wrapper {
  margin-bottom: 16px;
}

.upload-text-primary {
  font-size: 16px;
  font-weight: 400;
  color: #3c4043;
  margin-bottom: 8px;
  font-family: 'Google Sans', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Noto Sans KR', sans-serif;
}

/* 기존 다이얼로그 스타일 (하위 호환성) */
.create-dialog-card,
.rename-dialog-card {
  border-radius: 16px !important;
}

.create-dialog-card .v-card-title,
.rename-dialog-card .v-card-title {
  background: #ffffff !important;
  border-bottom: none !important;
}

/* 상세 정보 모달 스타일 (하위 호환성) */
.info-dialog-card {
  border-radius: 16px !important;
}

.info-dialog-card .v-card-title {
  background: #ffffff !important;
  border-bottom: none !important;
}
</style>
