<template>
  <div class="project-container">
    <!-- 프로젝트 헤더 (바디 안의 헤더) -->
    <div class="project-header">
      <div class="title-wrapper">
        <h1 class="project-title">{{ projectName }}</h1>
        <div class="action-icons">
          <svg class="edit-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" @click="openEditModal">
            <path d="M10.5 1.5L12.5 3.5L11 5L9 3L10.5 1.5Z" stroke="#666666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 3L11 5L4.5 11.5L1 13L2.5 9.5L9 3Z" stroke="#666666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg class="delete-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" @click="openDeleteModal">
            <path d="M11.6667 3.5H2.33333M5.83333 6.41667V9.33333M8.16667 6.41667V9.33333M2.33333 3.5V11.6667C2.33333 12.1269 2.70643 12.5 3.16667 12.5H10.8333C11.2936 12.5 11.6667 12.1269 11.6667 11.6667V3.5M4.66667 3.5V2.33333C4.66667 1.8731 5.03976 1.5 5.5 1.5H8.5C8.96024 1.5 9.33333 1.8731 9.33333 2.33333V3.5" stroke="#FF3E41" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <!-- 프로젝트 정보 (제목 오른쪽) -->
      <div class="project-info">
        <div class="date-info">
          <svg class="calendar-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z" stroke="#666666" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10.6667 1.33333V4" stroke="#666666" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 1.33333V4" stroke="#666666" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667H14" stroke="#666666" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="date-range">{{ formatDateRange(projectDetail.startTime, projectDetail.endTime) }}</span>
        </div>
        <div class="project-owner">
          <svg class="user-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="#666666"/>
            <path d="M8 10C3.58172 10 0 13.5817 0 18H16C16 13.5817 12.4183 10 8 10Z" fill="#666666"/>
          </svg>
          <span class="owner-name">{{ projectDetail.manager }}</span>
        </div>
      </div>
    </div>
    
    <!-- 프로젝트 설명 -->
    <div class="project-description-section">
      <p class="project-description-text">{{ projectDescrinpption }}</p>
    </div>
    
    <!-- 탭 메뉴 -->
    <div class="tab-section">
      <div class="tab-menu">
        <div class="tab-item" :class="{ active: activeTab === 'milestone' }" @click="activeTab = 'milestone'">
          마일스톤
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
          대시보드
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'gantt' }" @click="activeTab = 'gantt'">
          간트차트
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'documents' }" @click="activeTab = 'documents'">
          문서함
        </div>
      </div>
    </div>
    
    <!-- 마일스톤 탭 -->
    <div v-if="activeTab === 'milestone'">
      <!-- 마일스톤 캔버스 -->
      <div 
        class="milestone-canvas" 
        :class="{ 
          panning: isPanning,
          'pan-mode': interactionMode === 'pan',
          'click-mode': interactionMode === 'click'
        }"
        ref="milestoneCanvas"
      >
        <div v-if="loading" class="loading-container">
          <p class="loading-text">스톤 목록을 불러오는 중...</p>
        </div>
        <template v-else>
        <!-- SVG 캔버스 -->
        <svg 
          class="milestone-svg" 
          :width="canvasWidth" 
          :height="canvasHeight"
          @wheel="onWheel"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
        >
          <!-- 확대/축소 그룹 -->
          <g :transform="`translate(${translate.x}, ${translate.y}) scale(${scale})`">
        <!-- 연결선들 -->
          <g v-for="connection in connections" :key="connection.id" class="connection-line">
            <line 
              :x1="connection.x1" 
              :y1="connection.y1" 
              :x2="connection.x2" 
              :y2="connection.y2"
              stroke="#8EA8A0"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :class="connection.isFromRoot ? 'root-connection-line' : 'milestone-line'"
            />
          </g>
        
        <!-- 스톤 노드들 -->
            <g v-for="stone in stoneNodes" :key="stone.id" class="stone-group">
              <!-- 도넛형 진척도 스톤 -->
              <g class="donut-stone" :class="{ 
                'root-stone': stone.isRoot,
                'completed-stone': stone.stoneStatus === 'COMPLETED' || stone.milestone === 100
              }" @click="onStoneClick(stone, $event)">
                <!-- 루트 스톤 배경 그라데이션 -->
                <defs v-if="stone.isRoot">
                  <radialGradient id="rootStoneGradient" cx="40%" cy="40%">
                    <stop offset="0%" style="stop-color:#5F9EA0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#4C6B7C;stop-opacity:1" />
                  </radialGradient>
                  <!-- 하이라이트 그라데이션 -->
                  <radialGradient id="rootStoneHighlight" cx="25%" cy="25%">
                    <stop offset="0%" style="stop-color:#E8EEED;stop-opacity:0.2" />
                    <stop offset="100%" style="stop-color:#E8EEED;stop-opacity:0" />
                  </radialGradient>
                </defs>
                
                <!-- 루트 스톤 배경 원 -->
                <circle
                  v-if="stone.isRoot"
                  :cx="stone.x + 90"
                  :cy="stone.y + 90"
                  :r="90"
                  fill="url(#rootStoneGradient)"
                  class="root-stone-bg"
                />
                
                <!-- 루트 스톤 하이라이트 -->
                <circle
                  v-if="stone.isRoot"
                  :cx="stone.x + 90"
                  :cy="stone.y + 90"
                  :r="60"
                  fill="url(#rootStoneHighlight)"
                  class="root-stone-highlight"
                />
                
                <!-- 하위 스톤 배경 (루트가 아닌 경우) -->
                <circle
                  v-if="!stone.isRoot"
                  :cx="stone.x + 75"
                  :cy="stone.y + 75"
                  :r="75"
                  fill="#E8EEED"
                  class="child-stone-bg"
                />
                
                <!-- 하위 스톤 내부 그라데이션 -->
                <defs v-if="!stone.isRoot">
                  <radialGradient id="childStoneGradient" cx="30%" cy="30%">
                    <stop offset="0%" style="stop-color:#E8EEED;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#D5E1DD;stop-opacity:1" />
                  </radialGradient>
                </defs>
                <circle
                  v-if="!stone.isRoot"
                  :cx="stone.x + 75"
                  :cy="stone.y + 75"
                  :r="65"
                  fill="url(#childStoneGradient)"
                  class="child-stone-inner"
                />
                
                <!-- 외곽 원형 테두리 -->
                <circle
                  :cx="stone.x + (stone.isRoot ? 90 : 75)"
                  :cy="stone.y + (stone.isRoot ? 90 : 75)"
                  :r="stone.isRoot ? 90 : 75"
                  fill="none"
                  :stroke="stone.isRoot ? '#AEC3B0' : '#B6A28E'"
                  :stroke-width="stone.isRoot ? 16 : 4"
                  class="donut-background"
                />
                
                <!-- 진척도 progress ring -->
                <circle
                  :cx="stone.x + (stone.isRoot ? 90 : 75)"
                  :cy="stone.y + (stone.isRoot ? 90 : 75)"
                  :r="stone.isRoot ? 90 : 75"
                  fill="none"
                  stroke="url(#progressGradient)"
                  :stroke-width="stone.isRoot ? 16 : 12"
                  stroke-linecap="round"
                  :stroke-dasharray="2 * Math.PI * (stone.isRoot ? 90 : 75)"
                  :stroke-dashoffset="2 * Math.PI * (stone.isRoot ? 90 : 75) * (1 - (stone.milestone || 0) / 100)"
                  class="donut-progress"
                  transform="rotate(-90)"
                  :transform-origin="`${stone.x + (stone.isRoot ? 90 : 75)}px ${stone.y + (stone.isRoot ? 90 : 75)}px`"
                />
                
                <!-- 스톤명 텍스트 -->
                <text
                  :x="stone.x + (stone.isRoot ? 90 : 75)"
                  :y="stone.y + (stone.isRoot ? 90 : 75) - 5"
                  text-anchor="middle"
                  :class="stone.isRoot ? 'root-stone-name' : 'stone-name'"
                >
                  {{ stone.name }}
                </text>
                
                <!-- 마일스톤 진행률 텍스트 -->
                <text
                  :x="stone.x + (stone.isRoot ? 90 : 75)"
                  :y="stone.y + (stone.isRoot ? 90 : 75) + 15"
                  text-anchor="middle"
                  :class="stone.isRoot ? 'root-stone-milestone' : 'stone-milestone'"
                >
                  {{ (stone.milestone || 0) }}%
                </text>
                
                <!-- D-Day 텍스트 -->
                <text
                  v-if="stone.dDay"
                  :x="stone.x + (stone.isRoot ? 90 : 75)"
                  :y="stone.y + (stone.isRoot ? 90 : 75) + 30"
                  text-anchor="middle"
                  :class="stone.isRoot ? 'root-stone-dday' : 'stone-dday'"
                >
                  {{ stone.dDay }}
                </text>
              </g>
              
              <!-- 스톤 생성 텍스트 버튼 -->
              <g 
                class="create-stone-text stone-add-text" 
                :class="{ 'disabled': isStoneCompleted(stone) }"
                @click="openCreateStoneModal(stone, $event)"
              >
                <!-- 클릭 영역을 넓히기 위한 투명한 원 -->
                <circle
                  :cx="calculateTextPosition(stone).x"
                  :cy="calculateTextPosition(stone).y"
                  r="40"
                  fill="transparent"
                  class="create-stone-click-area"
                />
                <text
                  :x="calculateTextPosition(stone).x"
                  :y="calculateTextPosition(stone).y"
                  class="create-stone-text-content stone-add-text"
                  @click="openCreateStoneModal(stone, $event)"
                >
                  ＋ 스톤 추가
                </text>
              </g>
            </g>
          </g>
          
          <!-- 그라데이션 정의 -->
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#F9A825;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#FFB300;stop-opacity:1" />
            </linearGradient>
            <!-- 연결선 그라데이션 -->
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#C9D6CF;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#8EA8A0;stop-opacity:1" />
            </linearGradient>
            <!-- 루트 연결선 그라데이션 -->
            <linearGradient id="rootConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#C9D6CF;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#8EA8A0;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
        </template>
      </div>
    </div>
    
    <!-- 다른 탭들 -->
    <div v-else class="other-tabs">
      <p v-if="activeTab === 'dashboard'" class="placeholder-text">대시보드 컨텐츠</p>
      <p v-if="activeTab === 'gantt'" class="placeholder-text">간트차트 컨텐츠</p>
      <p v-if="activeTab === 'documents'" class="placeholder-text">문서함 컨텐츠</p>
    </div>
    
    <!-- 확대/축소 컨트롤 (ProjectList에 직접 추가) -->
    <div class="zoom-controls">
      <button class="zoom-btn zoom-in" @click="zoomIn" :disabled="zoomLevel >= zoomMax">+</button>
      <button class="zoom-btn zoom-out" @click="zoomOut" :disabled="zoomLevel <= zoomMin">-</button>
    </div>
    
    <!-- 모드 전환 버튼 -->
    <div class="mode-controls">
      <button 
        class="mode-btn" 
        :class="{ active: interactionMode === 'click' }"
        @click="toggleInteractionMode"
        :title="interactionMode === 'click' ? '클릭 모드' : '팬 모드'"
      >
        <span v-if="interactionMode === 'click'" class="mode-icon">🔘</span>
        <span v-else class="mode-icon">🖐️</span>
      </button>
    </div>
    
    <!-- 스톤 생성 모달 -->
    <div v-if="showCreateStoneModal" class="modal-overlay" @click="closeCreateStoneModal">
      <div class="create-stone-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">스톤 생성</h2>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              상위스톤 <span class="required">*</span>
            </label>
            <div class="form-input-wrapper">
              <input 
                type="text" 
                class="form-input" 
                v-model="newStone.parentStoneName"
                readonly
                placeholder="상위 스톤"
              />
              <span class="dropdown-arrow">▼</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              스톤명 <span class="required">*</span>
            </label>
            <input 
              type="text" 
              class="form-input" 
              v-model="newStone.stoneName"
              placeholder="스톤명을 입력하세요"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">
              기간 <span class="required">*</span>
            </label>
            <div class="form-input-wrapper">
              <input 
                type="date" 
                class="form-input" 
                v-model="newStone.startTime"
                placeholder="시작일"
              />
              <span class="date-separator">~</span>
              <input 
                type="date" 
                class="form-input" 
                v-model="newStone.endTime"
                placeholder="종료일"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              담당자 <span class="required">*</span>
            </label>
            <input 
              type="text" 
              class="form-input" 
              v-model="newStone.assignee"
              placeholder="담당자"
              readonly
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">
              참여자
            </label>
            <div class="form-input-wrapper">
              <input 
                type="text" 
                class="form-input" 
                v-model="newStone.participants"
                placeholder="참여자를 선택하세요"
                readonly
              />
              <button 
                type="button"
                class="btn-select-user"
                @click="openUserSelectModal('participants')"
              >
                참여자 선택
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">
              채팅방 생성
              <span v-if="isChatCreationDisabled" class="disabled-text">(이미 채팅방이 생성되어 있습니다)</span>
            </label>
            <div class="checkbox-wrapper">
              <input 
                type="checkbox" 
                class="form-checkbox" 
                v-model="newStone.createChat"
                id="createChat"
                :disabled="isChatCreationDisabled"
              />
              <label for="createChat" class="checkbox-label" :class="{ 'disabled': isChatCreationDisabled }"></label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeCreateStoneModal">
            취소
          </button>
          <button class="btn-create" @click="createStone">
            스톤 추가
          </button>
        </div>
      </div>
    </div>
    
    <!-- 사용자 선택 모달 -->
    <div v-if="showUserSelectModal" class="modal-overlay" @click="closeUserSelectModal">
      <div class="user-select-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">
            {{ userSelectType === 'assignee' ? '담당자 선택' : userSelectType === 'project-manager' ? '프로젝트 담당자 선택' : '참여자 선택' }}
          </h2>
        </div>
        
        <div class="modal-body">
          <!-- 1. 사용자 그룹 섹션 -->
          <div class="search-section">
            <h3 class="section-title">사용자 그룹</h3>
            <div class="group-list">
              <div 
                v-for="group in userGroupList" 
                :key="group.groupId"
                class="group-item"
                @click="selectGroup(group.groupName)"
              >
                <span class="group-name">{{ group.groupName }}</span>
                <span class="group-count">{{ group.participantCount }}명</span>
                <button 
                  class="btn-add-group"
                  @click.stop="addGroupToSelected(group.groupName)"
                >
                  추가
                </button>
              </div>
              <div v-if="userGroupList.length === 0" class="no-groups">
                그룹이 없습니다.
              </div>
            </div>
          </div>
          
          <!-- 2. 이메일 검색 섹션 -->
          <div class="search-section">
            <h3 class="section-title">이메일 검색</h3>
            <div class="search-group">
              <input 
                type="text" 
                class="search-input"
                v-model="userSearchKeyword"
                @keyup.enter="searchUsers"
                placeholder="이메일로 검색..."
              />
              <button class="btn-search" @click="searchUsers">
                검색
              </button>
            </div>
          </div>
          
          <!-- 3. 이메일 검색 결과 섹션 -->
          <div class="search-section">
            <h3 class="section-title">이메일 검색 결과</h3>
            <div class="user-list">
              <div 
                v-for="user in emailSearchResults" 
                :key="user.id"
                class="user-item search-result-item"
              >
                <div class="user-info search-result-info" @click="selectUser(user)">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                <button class="btn-add-user" @click="selectUser(user)">
                  추가
                </button>
              </div>
              <div v-if="emailSearchResults.length === 0" class="no-results">
                검색 결과가 없습니다.
              </div>
            </div>
          </div>
          
          <!-- 4. 선택된 사용자 섹션 -->
          <div class="search-section">
            <h3 class="section-title">선택된 사용자</h3>
            <div v-if="allSelectedUsers.length > 0" class="selected-group-members">
              <div 
                v-for="member in allSelectedUsers" 
                :key="member.id"
                class="selected-member-item"
              >
                <div class="user-info">
                  <div class="user-name">{{ member.name }}</div>
                  <div class="user-email">{{ member.email }}</div>
                </div>
                <button 
                  class="btn-remove-member" 
                  @click="removeMember(member.id)"
                >
                  ×
                </button>
              </div>
              <button class="btn-clear-all" @click="clearAllMembers">
                전체 해제
              </button>
            </div>
            <div v-else-if="selectedUser" class="selected-user-item">
              <div class="user-info">
                <div class="user-name">{{ selectedUser.name }}</div>
                <div class="user-email">{{ selectedUser.email }}</div>
              </div>
              <button class="btn-remove-selection" @click="removeSelectedUser">
                선택 해제
              </button>
            </div>
            <div v-else class="no-selection">
              사용자를 선택해주세요.
            </div>
          </div>
        </div>
        
          <div class="modal-footer">
            <button class="btn-confirm" @click="confirmUserSelection">
              확인
            </button>
            <button class="btn-cancel" @click="closeUserSelectModal">
              취소
            </button>
          </div>
      </div>
    </div>

    <!-- 스톤 상세 모달 -->
    <StoneDetailModal
      :is-visible="showStoneDetailModal"
      :stone-data="selectedStoneData"
      :is-loading="isLoadingStoneDetail"
      :workspace-id="currentWorkspaceId"
      @close="closeStoneDetailModal"
      @expand="expandStoneDetailModal"
      @stone-updated="onStoneUpdatedFromModal"
      @delete="deleteStoneFromModal"
      @stone-deleted="handleStoneDeleted"
      @stone-completed="handleStoneCompleted"
      @add-task="addTaskToStone"
      @edit-manager="editStoneManager"
      @edit-participants="editStoneParticipants"
      @manager-changed="handleManagerChanged"
      @task-created="handleTaskCreated"
      @task-completed="handleTaskCompleted"
    />

    <!-- 프로젝트 수정 모달 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">프로젝트 수정</h2>
        </div>
        
        <div class="modal-content">
          <div class="form-group">
            <label class="form-label">프로젝트명</label>
            <input 
              v-model="editForm.projectName" 
              type="text" 
              class="form-input"
              placeholder="프로젝트명을 입력하세요"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">기간</label>
            <div class="date-range-container">
              <div class="date-input-group">
                <label class="date-label">시작일</label>
                <input 
                  v-model="editForm.startDate" 
                  type="date" 
                  class="form-input date-input"
                />
              </div>
              <div class="date-separator">~</div>
              <div class="date-input-group">
                <label class="date-label">종료일</label>
                <input 
                  v-model="editForm.endDate" 
                  type="date" 
                  class="form-input date-input"
                />
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">담당자</label>
            <div class="manager-select-container">
              <input 
                v-model="editForm.manager" 
                type="text" 
                class="form-input manager-input"
                placeholder="담당자를 선택하세요"
                readonly
              />
              <button type="button" class="btn-select-manager" @click="openProjectManagerSelectModal">
                선택
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">상태</label>
            <div class="select-wrapper">
              <select v-model="editForm.status" class="form-select">
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
                <option value="보관">보관</option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">설명</label>
            <textarea 
              v-model="editForm.description" 
              class="form-textarea"
              placeholder="프로젝트 설명을 입력하세요"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="closeEditModal">취소</button>
          <button class="btn btn-primary" @click="saveProject">프로젝트 수정</button>
        </div>
      </div>
    </div>

    <!-- 프로젝트 담당자 선택 모달 -->
    <div v-if="showProjectManagerSelectModal" class="manager-select-overlay" @click="closeProjectManagerSelectModal">
      <div class="manager-select-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">프로젝트 담당자 선택</h2>
          <button class="close-btn" @click="closeProjectManagerSelectModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="search-section">
            <div class="search-input-container">
              <input 
                type="text" 
                class="search-input" 
                v-model="projectManagerSearchKeyword"
                placeholder="담당자 검색..."
                @keyup.enter="filterProjectManagers"
              />
              <button class="search-btn" @click="filterProjectManagers" :disabled="isProjectManagerSearching">
                <span v-if="!isProjectManagerSearching">검색</span>
                <div v-else class="search-spinner"></div>
              </button>
            </div>
          </div>
          
          <div class="manager-list">
            <div v-if="filteredProjectManagers.length === 0" class="no-managers">
              <p>선택 가능한 담당자가 없습니다.</p>
            </div>
            <div 
              v-else
              v-for="manager in filteredProjectManagers" 
              :key="manager.id" 
              class="manager-item"
              @click="selectProjectManager(manager)"
            >
              <div class="manager-info">
                <div class="manager-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="manager-details">
                  <div class="manager-name">{{ manager.name }}</div>
                  <div class="manager-email">{{ manager.email }}</div>
                </div>
              </div>
              <div class="select-indicator">
                <svg v-if="selectedProjectManagerId === manager.id" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="#F4CE53" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeProjectManagerSelectModal">취소</button>
          <button class="confirm-btn" @click="confirmProjectManagerChange" :disabled="!selectedProjectManagerId || isProjectManagerUpdating">
            <span v-if="isProjectManagerUpdating">변경 중...</span>
            <span v-else>담당자 선택</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 프로젝트 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="delete-modal-overlay" @click="closeDeleteModal">
      <div class="delete-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">프로젝트 삭제</h2>
        </div>
        
        <div class="modal-content">
          <div class="delete-content">
            <div class="project-info-section">
              <h3 class="project-name">{{ projectName }}</h3>
            </div>
            
            <div class="warning-section">
              <div class="warning-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#FF3E41" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="warning-text">
                <p class="warning-title">정말로 이 프로젝트를 삭제하시겠습니까?</p>
                <p class="warning-description">삭제된 프로젝트는 복구할 수 없습니다. 프로젝트와 관련된 모든 데이터가 영구적으로 삭제됩니다.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="closeDeleteModal">취소</button>
          <button class="btn btn-delete" @click="confirmDeleteProject">프로젝트 삭제</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import * as d3 from 'd3';
import StoneDetailModal from '@Project/StoneDetailModal.vue';
import { searchWorkspaceParticipants } from '@/services/stoneService.js';

export default {
  name: 'ProjectList',
  components: {
    StoneDetailModal
  },
  data() {
    return {
      activeTab: 'milestone',
      projectName: '오르빗 출시',
      projectDescription: '프로젝트 협업을 위한 일정 관리 서비스',
      stones: [],
      loading: false,
      currentWorkspaceId: '', // 현재 워크스페이스 ID
      scale: 1,
      minScale: 0.5,
      maxScale: 2,
      zoomStep: 0.1,
      translate: { x: 0, y: 0 },
      // 줌 관련 속성 추가
      zoomLevel: 1,
      zoomMax: 2,
      zoomMin: 0.5,
      isPanning: false,
      // 프로젝트 상세 정보
      projectDetail: {
        projectName: '오르빗 출시',
        projectDescription: '프로젝트 협업을 위한 일정 관리 서비스',
        startTime: '2025-09-12',
        endTime: '2025-11-12',
        manager: '김을빗'
      },
      startPt: { x: 0, y: 0 },
      startTranslate: { x: 0, y: 0 },
      panMode: false,
      interactionMode: 'click', // 'click' or 'pan'
      isPotentialClick: false,
      canvasWidth: 1000,
      canvasHeight: 600,
      stoneNodes: [],
      connections: [],
      showCreateStoneModal: false,
      selectedParentStone: null,
      showStoneDetailModal: false,
      selectedStoneData: {},
      isLoadingStoneDetail: false,
      // 프로젝트 수정 모달 관련
      showEditModal: false,
      editForm: {
        projectName: '',
        startDate: '',
        endDate: '',
        manager: '',
        managerId: '', // 담당자 ID 저장
        status: '진행중',
        description: ''
      },
      // 프로젝트 담당자 선택 모달 관련
      showProjectManagerSelectModal: false,
      projectManagerSearchKeyword: '',
      availableProjectManagers: [],
      filteredProjectManagers: [],
      selectedProjectManagerId: null,
      isProjectManagerSearching: false,
      isProjectManagerUpdating: false,
      // 프로젝트 삭제 모달 관련
      showDeleteModal: false,
      newStone: {
        parentStoneName: '',
        stoneName: '',
        startTime: '',
        endTime: '',
        assignee: '', // loadCurrentUserInfo에서 설정됨
        participants: '',
        createChat: false
      },
      showUserSelectModal: false,
      userSelectType: '', // 'assignee' or 'participants'
      userSearchKeyword: '',
      selectedGroup: '',
      userGroupList: [], // 사용자 그룹 목록
      emailSearchResults: [], // 이메일 검색 결과
      selectedUser: null, // 선택된 사용자
      selectedGroupMembers: [], // 선택된 그룹의 멤버들
      allSelectedUsers: [], // 모든 선택된 사용자들 (누적)
      confirmedParticipants: [], // 확정된 참여자 ID 리스트
      selectedStoneForParticipants: null, // 참여자 수정을 위한 선택된 스톤
      currentUser: {
        id: '',
        name: '',
        email: ''
      },
      userList: [
        { id: 1, name: '김을빗', email: 'eulbit@orbit.com', group: '개발팀' },
        { id: 2, name: '박프론트', email: 'front@orbit.com', group: '개발팀' },
        { id: 3, name: '이백엔드', email: 'backend@orbit.com', group: '개발팀' },
        { id: 4, name: '최디자인', email: 'design@orbit.com', group: '디자인팀' },
        { id: 5, name: '정기획', email: 'plan@orbit.com', group: '기획팀' }
      ],
      filteredUserList: []
    };
  },
  computed: {
    // 채팅방 생성 체크박스 비활성화 여부
    isChatCreationDisabled() {
      // 프로젝트에 이미 채팅방이 생성되어 있으면 비활성화
      if (this.projectDetail?.isChatCreation === true) {
        return true;
      }
      
      // 선택된 부모 스톤이 있고, 그 스톤에 이미 채팅방이 생성되어 있으면 비활성화
      if (this.selectedParentStone?.isChatCreation === true) {
        return true;
      }
      
      return false;
    }
  },
  async mounted() {
    // 현재 사용자 정보 로드
    await this.loadCurrentUserInfo();
    
    // 워크스페이스 ID 초기화
    this.currentWorkspaceId = localStorage.getItem('selectedWorkspaceId') || '';
    
    const projectId = this.$route.query.id;
    if (projectId) {
      await this.loadProjectData(projectId);
      await this.loadProjectDetail(projectId);
    }
    
    // 캔버스 크기 업데이트
    this.$nextTick(() => {
      this.updateCanvasSize();
    });
    
    // 윈도우 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', this.updateCanvasSize);
    
    // 스톤 수정 이벤트 리스너 추가
    window.addEventListener('stoneUpdated', this.onStoneUpdated);
    console.log('=== ProjectList 이벤트 리스너 등록 완료 ===');
    console.log('stoneUpdated 이벤트 리스너 등록됨');
    
    // 키보드 이벤트 리스너 추가 (Space 키로 팬 모드 토글)
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateCanvasSize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('stoneUpdated', this.onStoneUpdated);
  },
  watch: {
    stones: {
      handler(newStones) {
        console.log('stones watch 트리거됨:', newStones);
        if (newStones && newStones.length > 0) {
          console.log('스톤 데이터가 있음, stoneNodes 변환 시작');
          this.stoneNodes = this.convertStonesToNodes(newStones);
          console.log('변환된 stoneNodes:', this.stoneNodes);
          this.$nextTick(() => {
            this.updateStonePositions();
            this.updateConnections();
          });
        } else {
          console.log('스톤 데이터가 없거나 비어있음');
          this.stoneNodes = [];
        }
      },
      immediate: true,
      deep: true
    },
    '$route.query.id': {
      handler(newProjectId, oldProjectId) {
        if (newProjectId && newProjectId !== oldProjectId) {
          console.log('프로젝트 ID 변경됨:', oldProjectId, '->', newProjectId);
          this.loadProjectData(newProjectId);
        }
      },
      immediate: true
    }
  },
  methods: {
    // 날짜 범위 포맷팅 메서드
    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) return '날짜 미설정'
      const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\./g, '.').replace(/\s/g, '')
      }
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    },
    
    // 현재 사용자 정보 로드
    async loadCurrentUserInfo() {
      const userId = localStorage.getItem('id');
      
      if (!userId) {
        console.log('사용자 ID가 없습니다.');
        return;
      }
      
      try {
        // user-service에서 사용자 정보 가져오기
        const response = await axios.get(
          `http://localhost:8080/user-service/user/${userId}`
        );
        
        if (response.data.statusCode === 200) {
          const userInfo = response.data.result;
          
          this.currentUser = {
            id: userId,
            name: userInfo.name,
            email: userInfo.email
          };
          
          // 담당자 필드에 현재 사용자 이름 설정
          this.newStone.assignee = userInfo.name;
          
          // 사용자 목록에 현재 사용자가 없으면 추가
          const existingUser = this.userList.find(user => user.name === userInfo.name);
          if (!existingUser) {
            this.userList.unshift({
              id: userId,
              name: userInfo.name,
              email: userInfo.email,
              group: '개발팀' // 기본 그룹
            });
          }
          
          console.log('현재 사용자 정보:', this.currentUser);
        } else {
          console.error('사용자 정보 조회 실패:', response.data);
          this.setDefaultUser();
        }
      } catch (error) {
        console.error('사용자 정보 API 호출 실패:', error);
        this.setDefaultUser();
      }
    },
    
    // 기본 사용자 정보 설정
    setDefaultUser() {
      this.currentUser = {
        id: localStorage.getItem('id') || '',
        name: '김을빗',
        email: 'eulbit@orbit.com'
      };
      this.newStone.assignee = '김을빗';
    },
    
    // 프로젝트 데이터 로드 (공통 메서드)
    async loadProjectData(projectId) {
      if (!projectId) return;
      
      console.log('loadProjectData 시작, projectId:', projectId);
      this.loading = true;
      
      try {
        // 스톤 목록을 먼저 로드 (중요한 데이터)
        console.log('스톤 목록 로드 시작');
        await this.loadStones(projectId);
        
        // 프로젝트 상세 정보는 선택적으로 로드 (실패해도 계속 진행)
        try {
          console.log('프로젝트 상세 정보 로드 시작');
          await this.loadProjectDetail(projectId);
        } catch (error) {
          console.log('프로젝트 상세 정보 로드 실패, 기본값 사용:', error);
        }
      } catch (error) {
        console.error('프로젝트 데이터 로드 중 오류:', error);
      } finally {
        this.loading = false;
        console.log('loadProjectData 완료');
      }
    },
    
    async loadProjectDetail(projectId) {
      try {
        const userId = localStorage.getItem('id');
        const response = await axios.get(
          `http://localhost:8080/workspace-service/project/detail/${projectId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const projectData = response.data.result;
          this.projectName = projectData.projectName || '프로젝트';
          this.projectDescription = projectData.projectDescription || '프로젝트 협업을 위한 일정 관리 서비스';
          
          // 프로젝트 상세 정보 업데이트
          this.projectDetail = {
            projectName: projectData.projectName || '프로젝트',
            projectDescription: projectData.projectDescription || '프로젝트 협업을 위한 일정 관리 서비스',
            startTime: projectData.startTime || '2025-09-12',
            endTime: projectData.endTime || '2025-11-12',
            manager: projectData.projectManagerName || projectData.managerName || projectData.manager || projectData.projectManager || '김을빗',
            managerId: projectData.projectManagerId || projectData.managerId || '',
            projectStatus: projectData.projectStatus || 'PROGRESS',
            isChatCreation: projectData.isChatCreation || false
          };
        }
      } catch (error) {
        console.error('프로젝트 상세 정보 로드 실패:', error);
      }
    },
    async loadStones(projectId) {
      try {
        console.log('loadStones 시작, projectId:', projectId);
        this.loading = true;
        const userId = localStorage.getItem('id');
        console.log('사용자 ID:', userId);
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/project/stones/${projectId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        console.log('스톤 API 응답:', response.data);
        
        if (response.data.statusCode === 200) {
          this.stones = response.data.result || [];
          console.log('스톤 목록 로드 성공, stones 배열:', this.stones);
          console.log('stones 길이:', this.stones.length);
          console.log('첫 번째 스톤의 childStone:', this.stones[0]?.childStone);
        } else {
          console.log('스톤 목록 응답 상태 코드:', response.data.statusCode);
          console.log('응답 메시지:', response.data.statusMessage);
          this.stones = [];
        }
      } catch (error) {
        console.error('스톤 목록 로드 실패:', error);
        // API 실패 시 테스트용 더미 데이터 사용
        this.stones = [
          {
            stoneId: "pjt_s_1",
            stoneName: "3번째 프로젝트",
            startTime: "2025-10-15T09:00:00",
            endTime: "2025-11-15T18:00:00",
            parentStoneId: null,
            childStone: [
              {
                stoneId: "pjt_s_2",
                stoneName: "백엔드5 수정 스톤",
                startTime: "2025-10-16T09:00:00",
                endTime: "2025-10-20T18:00:00",
                parentStoneId: "pjt_s_1",
                childStone: [],
                milestone: null
              }
            ],
            milestone: null
          }
        ];
        console.log('테스트용 스톤 데이터 사용:', this.stones);
      } finally {
        this.loading = false;
      }
    },
    handleEditStone(stone) {
      console.log('스톤 수정:', stone);
      // TODO: 스톤 수정 모달 열기
    },
    handleDeleteStone(stone) {
      console.log('스톤 삭제:', stone);
      // TODO: 스톤 삭제 확인 후 API 호출
    },
    handleAddStone(stone) {
      console.log('스톤 추가:', stone);
      // TODO: 스톤 추가 API 호출
    },
    // ERD Cloud 스타일 팬/줌 메서드들
    
    // 휠 이벤트 핸들러
    onWheel(e) {
      e.preventDefault();
      
      if (e.ctrlKey) {
        // Ctrl + 휠: 줌
        const k = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = this.clamp(this.scale * k, this.minScale, this.maxScale);
        this.applyZoom(newScale, { x: e.offsetX, y: e.offsetY });
      } else {
        // 일반 휠: 팬 (수평/수직 이동)
        this.translate.x -= e.deltaX;
        this.translate.y -= e.deltaY;
      }
    },
    
    // 모드 전환 메서드
    toggleInteractionMode() {
      this.interactionMode = this.interactionMode === 'click' ? 'pan' : 'click';
      this.panMode = this.interactionMode === 'pan';
    },
    
    // 마우스 다운 이벤트 핸들러
    onMouseDown(e) {
      // 스톤 추가 텍스트 클릭은 팬 모드에서도 허용
      if (e.target.classList.contains('create-stone-text') || 
          e.target.classList.contains('create-stone-text-content') ||
          e.target.classList.contains('create-stone-click-area') ||
          e.target.classList.contains('stone-add-text')) {
        return;
      }
      
      if (e.button === 0 && (this.panMode || e.target.classList.contains('milestone-svg'))) { // 좌클릭 + Space 키 또는 SVG 배경 클릭
        this.startPt = { x: e.clientX, y: e.clientY };
        this.startTranslate = { ...this.translate };
        this.isPotentialClick = true;
        e.preventDefault();
      }
    },
    
    // 마우스 이동 이벤트 핸들러
    onMouseMove(e) {
      if (this.isPotentialClick && (Math.abs(e.clientX - this.startPt.x) > 5 || Math.abs(e.clientY - this.startPt.y) > 5)) {
        this.isPanning = true;
        this.isPotentialClick = false;
      }
      if (this.isPanning) {
        this.translate.x = this.startTranslate.x + (e.clientX - this.startPt.x);
        this.translate.y = this.startTranslate.y + (e.clientY - this.startPt.y);
        e.preventDefault();
      }
    },
    
    // 마우스 업 이벤트 핸들러
    onMouseUp(e) {
      if (this.isPanning) {
        this.isPanning = false;
      }
      this.isPotentialClick = false;
    },
    
    // 키보드 이벤트 핸들러들
    onKeyDown(e) {
      if (e.code === 'Space' && !this.panMode) {
        this.panMode = true;
        e.preventDefault();
      }
    },
    
    onKeyUp(e) {
      if (e.code === 'Space' && this.panMode) {
        this.panMode = false;
        this.isPanning = false; // Space 키를 놓으면 팬 중단
        e.preventDefault();
      }
    },
    
    // 줌 적용 (중심점 기준)
    applyZoom(newScale, center) {
      const ratio = newScale / this.scale;
      this.translate.x = center.x - ratio * (center.x - this.translate.x);
      this.translate.y = center.y - ratio * (center.y - this.translate.y);
      this.scale = newScale;
      this.zoomLevel = newScale;
    },
    
    // 값 제한 유틸리티
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    
    // + / - 버튼용 줌 메서드들
    zoomIn() {
      if (this.zoomLevel < this.zoomMax) {
        const newScale = this.clamp(this.scale + this.zoomStep, this.minScale, this.maxScale);
        const center = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
        this.applyZoom(newScale, center);
        this.zoomLevel = newScale;
      }
    },
    
    zoomOut() {
      if (this.zoomLevel > this.zoomMin) {
        const newScale = this.clamp(this.scale - this.zoomStep, this.minScale, this.maxScale);
        const center = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
        this.applyZoom(newScale, center);
        this.zoomLevel = newScale;
      }
    },
    
    // 실제 그래프의 bounding box 중심 계산
    calculateGraphCenter() {
      this.$nextTick(() => {
        const svgElement = this.$refs.milestoneCanvas?.querySelector('.milestone-svg');
        if (!svgElement) return;
        
        const gElement = svgElement.querySelector('g');
        if (!gElement) return;
        
        try {
          // D3를 사용하여 bounding box 계산
          const bbox = d3.select(gElement).node().getBBox();
          
          // 그래프의 실제 중심점 계산
          const graphCenterX = bbox.x + bbox.width / 2;
          const graphCenterY = bbox.y + bbox.height / 2;
          
          // SVG 중심점
          const svgCenterX = this.canvasWidth / 2;
          const svgCenterY = this.canvasHeight / 2;
          
          // 그래프를 SVG 중앙에 위치시키기 위한 translate 계산
          this.translate.x = svgCenterX - graphCenterX;
          this.translate.y = svgCenterY - graphCenterY;
          
          console.log('그래프 중심점 계산:', {
            bbox: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
            graphCenter: { x: graphCenterX, y: graphCenterY },
            svgCenter: { x: svgCenterX, y: svgCenterY },
            translate: { x: this.translate.x, y: this.translate.y }
          });
        } catch (error) {
          console.warn('Bounding box 계산 실패, 기본 중심점 사용:', error);
          // fallback: SVG 중심점 사용
          this.translate.x = this.canvasWidth / 2;
          this.translate.y = this.canvasHeight / 2;
        }
      });
    },
    // 스톤 관련 메서드들
    async onStoneClick(stone, event) {
      if (this.interactionMode === 'pan') {
        event.stopPropagation();
        return;
      }
      console.log('스톤 클릭:', stone);
      
      try {
        this.isLoadingStoneDetail = true;
        
        // 루트 스톤인 경우 프로젝트 상세 정보 API 호출
        if (stone.isRoot) {
          try {
            // 루트 스톤의 경우 프로젝트 ID를 사용
            // 현재 프로젝트의 ID를 사용하거나 stone.id를 프로젝트 ID로 사용
            const projectId = this.$route.params.projectId || 'pjt_1';
            console.log('프로젝트 ID:', projectId);
            console.log('스톤 ID:', stone.id);
            
            const response = await axios.get(
              `http://localhost:8080/workspace-service/project/detail/${projectId}`,
              {
                headers: {
                  'X-User-Id': this.currentUser.id || 'test-user-id' // 실제 사용자 ID로 교체 필요
                }
              }
            );
            
            if (response.data.statusCode === 200) {
              const projectDetail = response.data.result;
              console.log('프로젝트 상세 데이터:', projectDetail);
              
              // 프로젝트 상세 데이터를 모달에 맞는 형태로 변환
              this.selectedStoneData = {
                stoneId: stone.id,
                stoneName: projectDetail.projectName,
                startTime: projectDetail.startTime,
                endTime: projectDetail.endTime,
                manager: '프로젝트 담당자', // API에 담당자 정보가 없으므로 기본값
                participants: '비어 있음',
                documentLink: '바로가기',
                chatCreation: false,
                tasks: [],
                // 프로젝트 전용 데이터
                projectObjective: projectDetail.projectObjective,
                projectDescription: projectDetail.projectDescription,
                stoneCount: projectDetail.stoneCount,
                completedCount: projectDetail.completedCount,
                projectStatus: projectDetail.projectStatus,
                isProject: true // 프로젝트 모달임을 표시
              };
              
              console.log('프로젝트 모달 표시 설정:', this.selectedStoneData);
              this.showStoneDetailModal = true;
              console.log('showStoneDetailModal 상태:', this.showStoneDetailModal);
              return;
            } else {
              console.error('프로젝트 상세 조회 실패:', response.data.statusMessage);
              alert('프로젝트 정보를 불러오는데 실패했습니다.');
              return;
            }
          } catch (projectError) {
            console.error('프로젝트 상세 조회 API 호출 실패:', projectError);
            alert('프로젝트 정보를 불러오는데 실패했습니다.');
            return;
          }
        }
        
        // 일반 스톤인 경우 스톤 상세 정보 API 호출
        const response = await axios.get(
          `http://localhost:8080/workspace-service/stone/${stone.id}`,
          {
            headers: {
              'X-User-Id': this.currentUser.id || 'test-user-id' // 실제 사용자 ID로 교체 필요
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const stoneDetail = response.data.result;
          
          // 참여자 목록 처리
          const participants = stoneDetail.stoneParticipantDtoList || [];
          const participantNames = participants.map(p => p.participantName);
          const participantsText = participantNames.length > 0 ? participantNames.join(', ') : '비어 있음';
          
          // API 응답 데이터를 모달에 맞는 형태로 변환
          this.selectedStoneData = {
            stoneId: stone.id,
            stoneName: stoneDetail.stoneName,
            startTime: stoneDetail.startTime,
            endTime: stoneDetail.endTime,
            manager: stoneDetail.stoneManagerName,
            participants: participantsText,
            documentLink: '바로가기', // API에 문서 링크가 없으므로 기본값
            chatCreation: stoneDetail.chatCreation,
            stoneStatus: stoneDetail.stoneStatus,
            tasks: (stoneDetail.taskResDtoList || []).map((task, index) => ({
              id: task.taskId || index + 1,
              name: task.taskName || '태스크',
              completed: task.taskStatus === 'COMPLETED' || false,
              startTime: task.startTime || stoneDetail.startTime,
              endTime: task.endTime || stoneDetail.endTime
            })),
            isProject: false // 일반 스톤 모달임을 표시
          };
          
          console.log('일반 스톤 모달 표시 설정:', this.selectedStoneData);
          this.showStoneDetailModal = true;
          console.log('showStoneDetailModal 상태:', this.showStoneDetailModal);
        } else {
          console.error('스톤 상세 조회 실패:', response.data.statusMessage);
          alert('스톤 정보를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('스톤 상세 조회 API 호출 실패:', error);
        alert('스톤 정보를 불러오는데 실패했습니다.');
        
        // 에러 발생 시 기본 데이터로 모달 표시
        this.selectedStoneData = {
          stoneId: stone.id,
          stoneName: stone.name,
          startTime: stone.startTime || '2025-09-12',
          endTime: stone.endTime || '2025-09-17',
          manager: '김올빗',
          participants: '비어 있음',
          documentLink: '바로가기',
          chatCreation: false,
          tasks: [],
          isProject: stone.isRoot || false
        };
        console.log('에러 처리 후 모달 표시 설정:', this.selectedStoneData);
        this.showStoneDetailModal = true;
        console.log('showStoneDetailModal 상태:', this.showStoneDetailModal);
      } finally {
        this.isLoadingStoneDetail = false;
      }
    },
    calculateDDay(endTime) {
      if (!endTime) return null;
      const endDate = new Date(endTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `D-${diffDays}`;
      } else if (diffDays === 0) {
        return 'D-Day';
      } else {
        return `D+${Math.abs(diffDays)}`;
      }
    },
    convertStonesToNodes(stones) {
      const nodes = [];
      console.log('convertStonesToNodes 호출됨, 입력 stones:', stones);
      
      // 재귀적으로 스톤을 노드로 변환하는 함수
      const convertStoneToNode = (stone) => {
        console.log('convertStoneToNode 처리 중:', stone.stoneName, 'childStone:', stone.childStone);
        
        const node = {
          id: stone.stoneId,
          name: stone.stoneName,
          milestone: stone.milestone,
          startTime: stone.startTime,
          endTime: stone.endTime,
          isRoot: stone.parentStoneId === null,
          parentId: stone.parentStoneId,
          dDay: this.calculateDDay(stone.endTime),
          createdAt: stone.createdAt,
          x: 0,
          y: 0
        };
        nodes.push(node);
        console.log('스톤 노드 추가:', node.name, '부모:', node.parentId, '루트:', node.isRoot);
        
        // 하위 스톤들도 재귀적으로 처리
        if (stone.childStone && stone.childStone.length > 0) {
          console.log('하위 스톤 발견:', stone.childStone.length, '개', stone.childStone);
          stone.childStone.forEach((childStone, index) => {
            console.log(`하위 스톤 ${index + 1} 처리:`, childStone.stoneName);
            convertStoneToNode(childStone);
          });
        } else {
          console.log('하위 스톤 없음:', stone.stoneName);
        }
      };
      
      // 모든 최상위 스톤들을 처리
      stones.forEach((stone, index) => {
        console.log(`최상위 스톤 ${index + 1} 처리:`, stone.stoneName);
        convertStoneToNode(stone);
      });
      
      console.log('총 스톤 노드 개수:', nodes.length, '노드들:', nodes);
      return nodes;
    },
    // D3.js 기반 트리 배치
    updateStonePositionsWithD3() {
      if (this.stoneNodes.length === 0) return;
      
      console.log('D3.js 트리 배치 시작');
      
      // 스톤 데이터를 D3.js 계층 구조로 변환
      const rootStone = this.stoneNodes.find(stone => stone.isRoot);
      if (!rootStone) return;
      
      const d3Data = this.convertToD3Hierarchy(rootStone);
      console.log('D3 데이터:', d3Data);
      
      // D3.js 트리 레이아웃 설정
      const width = this.canvasWidth;
      const height = this.canvasHeight;
      
      const tree = d3.tree()
        .size([width - 200, height - 200])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
      
      const root = d3.hierarchy(d3Data, d => d.children);
      tree(root);
      
      // D3.js 계산된 위치를 stoneNodes에 적용
      root.descendants().forEach((node, index) => {
        const stone = this.stoneNodes.find(s => s.id === node.data.id);
        if (stone) {
          stone.x = node.x + 100;
          stone.y = node.y + 100;
          console.log(`${stone.name} D3 위치: (${stone.x}, ${stone.y})`);
        }
      });
      
      // 연결선 업데이트
      this.updateConnections();
      
      // 캔버스 크기 조정 및 중심점 재계산
      this.$nextTick(() => {
        this.adjustCanvasSizeForStones();
        // 스톤 위치가 변경된 후 그래프 중심점 재계산
        this.calculateGraphCenter();
      });
    },
    
    // 스톤 데이터를 D3.js 계층 구조로 변환
    convertToD3Hierarchy(rootStone) {
      const convertStone = (stone) => {
        const children = this.stoneNodes
          .filter(s => s.parentId === stone.id)
          .map(child => convertStone(child));
        
        return {
          id: stone.id,
          name: stone.name,
          children: children.length > 0 ? children : undefined
        };
      };
      
      return convertStone(rootStone);
    },
    updateStonePositions() {
      // D3.js 기반 트리 배치 사용
      this.updateStonePositionsWithD3();
    },
    
    // D3.js가 자동으로 겹침을 방지하므로 별도 겹침 방지 로직 불필요
    
    // D3.js가 자동으로 레벨을 계산하므로 별도 레벨 계산 로직 불필요
    updateConnections() {
      this.connections = [];
      this.stoneNodes.forEach(node => {
        const childNodes = this.stoneNodes.filter(n => n.parentId === node.id);
        childNodes.forEach(child => {
          const parentCenterX = node.x + (node.isRoot ? 90 : 75);
          const parentCenterY = node.y + (node.isRoot ? 90 : 75);
          const childCenterX = child.x + 75;
          const childCenterY = child.y + 75;
          
          // 부모 노드 반지름 (도넛 외곽에서 5px 안쪽)
          const parentRadius = (node.isRoot ? 90 : 75) - 5;
          const childRadius = 75 - 5;
          
          // 방향 벡터 계산
          const dx = childCenterX - parentCenterX;
          const dy = childCenterY - parentCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 정규화된 방향 벡터
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          // 부모 노드에서 시작점 (도넛 외곽)
          const startX = parentCenterX + unitX * parentRadius;
          const startY = parentCenterY + unitY * parentRadius;
          
          // 자식 노드에서 끝점 (도넛 외곽)
          const endX = childCenterX - unitX * childRadius;
          const endY = childCenterY - unitY * childRadius;
          
          const connection = {
            id: `conn-${node.id}-${child.id}`,
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY,
            isFromRoot: node.isRoot,
            angle: Math.atan2(dy, dx) // 연결선 각도 저장
          };
          this.connections.push(connection);
        });
      });
    },
    
    // 스톤 추가 텍스트 위치 계산
    calculateTextPosition(stone) {
      const centerX = stone.x + (stone.isRoot ? 90 : 75);
      const centerY = stone.y + (stone.isRoot ? 90 : 75);
      const radius = stone.isRoot ? 90 : 75;
      
      // 오른쪽 하단에 충분히 떨어뜨려 배치
      const offsetX = radius * 1.1; // x축 오프셋
      const offsetY = radius * 1.0; // y축 오프셋
      
      return {
        x: centerX + offsetX,
        y: centerY + offsetY
      };
    },
    updateCanvasSize() {
      if (this.$refs.milestoneCanvas) {
        const rect = this.$refs.milestoneCanvas.getBoundingClientRect();
        this.canvasWidth = Math.max(rect.width || 1000, 800);
        this.canvasHeight = Math.max(rect.height || 600, 500);
        console.log('캔버스 크기 업데이트:', this.canvasWidth, 'x', this.canvasHeight);
        
        this.$nextTick(() => {
          this.updateStonePositions();
          this.updateConnections();
          this.adjustCanvasSizeForStones();
          // 캔버스 크기 변경 후 그래프 중심점 재계산
          this.calculateGraphCenter();
        });
      }
    },
    
    adjustCanvasSizeForStones() {
      if (this.stoneNodes.length === 0) return;
      
      // 모든 스톤의 위치를 확인하여 필요한 캔버스 크기 계산
      let maxX = 0;
      let maxY = 0;
      
      this.stoneNodes.forEach(stone => {
        const stoneWidth = stone.isRoot ? 180 : 150;
        const stoneHeight = stone.isRoot ? 180 : 150;
        maxX = Math.max(maxX, stone.x + stoneWidth);
        maxY = Math.max(maxY, stone.y + stoneHeight);
      });
      
      // 여유 공간 추가 (패딩)
      const padding = 100;
      const requiredWidth = Math.max(maxX + padding, this.canvasWidth);
      const requiredHeight = Math.max(maxY + padding, this.canvasHeight);
      
      // 캔버스 크기 업데이트
      this.canvasWidth = requiredWidth;
      this.canvasHeight = requiredHeight;
      
      console.log('스톤에 맞춘 캔버스 크기:', this.canvasWidth, 'x', this.canvasHeight);
    },
    
    // 스톤이 완료되었는지 확인
    isStoneCompleted(stone) {
      return stone.stoneStatus === 'COMPLETED' || stone.milestone === 100;
    },
    
    // 스톤 생성 모달 관련 메서드들
    openCreateStoneModal(parentStone, event) {
      console.log('스톤 생성 모달 열기 시도:', parentStone.name);
      
      // 완료된 스톤인지 확인
      if (this.isStoneCompleted(parentStone)) {
        alert('완료된 스톤에는 하위 스톤을 생성할 수 없습니다.');
        return;
      }
      
      // 팬 모드에서도 스톤 추가 텍스트 클릭은 허용
      event.stopPropagation(); // 팬 모드 드래그 방지
      this.selectedParentStone = parentStone;
      this.newStone.parentStoneName = parentStone.name;
      this.showCreateStoneModal = true;
      console.log('모달 상태:', this.showCreateStoneModal);
    },
    
    closeCreateStoneModal() {
      this.showCreateStoneModal = false;
      this.selectedParentStone = null;
      this.resetNewStoneForm();
    },
    
    // 스톤 수정 이벤트 처리
    onStoneUpdated(event) {
      console.log('=== ProjectList에서 스톤 수정 이벤트 수신 ===');
      console.log('전체 이벤트 객체:', event);
      console.log('이벤트 detail:', event.detail);
      
      const updatedStone = event.detail;
      if (!updatedStone) {
        console.error('이벤트 detail이 없습니다!');
        return;
      }
      
      console.log('현재 stones 배열:', this.stones);
      console.log('찾을 stoneId:', updatedStone.stoneId);
      
      // stones 배열의 첫 번째 요소 구조 확인
      if (this.stones.length > 0) {
        console.log('첫 번째 스톤 객체 구조:', this.stones[0]);
        console.log('첫 번째 스톤의 모든 키들:', Object.keys(this.stones[0]));
        console.log('모든 스톤의 stoneId들:', this.stones.map(s => s.stoneId));
      }
      
      console.log('현재 프로젝트 ID:', this.$route.query.id);
      console.log('수정하려는 스톤이 현재 프로젝트에 속해있는지 확인 필요');
      
      // stones 배열에서 해당 스톤 찾아서 업데이트 (최상위 스톤과 하위 스톤 모두 확인)
      let stoneIndex = -1;
      let foundStone = null;
      let parentStoneIndex = -1;
      
      // 1. 최상위 스톤에서 찾기
      stoneIndex = this.stones.findIndex(stone => 
        stone.id === updatedStone.stoneId || 
        stone.stoneId === updatedStone.stoneId ||
        stone.stone_id === updatedStone.stoneId
      );
      
      if (stoneIndex !== -1) {
        foundStone = this.stones[stoneIndex];
        console.log('최상위 스톤에서 찾음:', foundStone);
      } else {
        // 2. 하위 스톤에서 찾기
        for (let i = 0; i < this.stones.length; i++) {
          const parentStone = this.stones[i];
          if (parentStone.childStone && Array.isArray(parentStone.childStone)) {
            const childIndex = parentStone.childStone.findIndex(child => 
              child.id === updatedStone.stoneId || 
              child.stoneId === updatedStone.stoneId ||
              child.stone_id === updatedStone.stoneId
            );
            
            if (childIndex !== -1) {
              foundStone = parentStone.childStone[childIndex];
              parentStoneIndex = i;
              stoneIndex = childIndex;
              console.log('하위 스톤에서 찾음:', foundStone);
              console.log('부모 스톤 인덱스:', parentStoneIndex);
              console.log('하위 스톤 인덱스:', stoneIndex);
              break;
            }
          }
        }
      }
      
      if (foundStone) {
        console.log('수정 전 스톤 정보:', foundStone);
        
        if (parentStoneIndex !== -1) {
          // 하위 스톤 업데이트
          this.stones[parentStoneIndex].childStone[stoneIndex] = {
            ...this.stones[parentStoneIndex].childStone[stoneIndex],
            stoneName: updatedStone.stoneName,
            startTime: updatedStone.startTime,
            endTime: updatedStone.endTime,
            chatCreation: updatedStone.chatCreation
          };
          console.log('하위 스톤 업데이트 완료');
        } else {
          // 최상위 스톤 업데이트
          this.stones[stoneIndex] = {
            ...this.stones[stoneIndex],
            stoneName: updatedStone.stoneName,
            startTime: updatedStone.startTime,
            endTime: updatedStone.endTime,
            chatCreation: updatedStone.chatCreation
          };
          console.log('최상위 스톤 업데이트 완료');
        }
        
        // Vue 반응성을 위해 강제로 업데이트 트리거
        this.$forceUpdate();
        
        console.log('수정 후 스톤 정보:', foundStone);
        console.log('stones 배열 업데이트 완료');
      } else {
        console.warn('해당 stoneId를 가진 스톤을 찾을 수 없습니다:', updatedStone.stoneId);
        console.log('현재 stones 배열의 ID들:', this.stones.map(s => s.stoneId));
        
        // 백엔드에서 리턴된 스톤 ID가 다를 수 있으므로, 스톤 목록을 다시 로드
        console.log('스톤 목록을 다시 로드합니다...');
        this.loadProjectData(this.$route.query.id);
      }
      
      // 현재 선택된 스톤이 수정된 스톤이라면 상세 정보도 업데이트
      if (this.selectedStone && (
        this.selectedStone.id === updatedStone.stoneId ||
        this.selectedStone.stoneId === updatedStone.stoneId ||
        this.selectedStone.stone_id === updatedStone.stoneId
      )) {
        console.log('선택된 스톤도 업데이트 중...');
        console.log('수정 전 selectedStone:', this.selectedStone);
        
        this.selectedStone = {
          ...this.selectedStone,
          stoneName: updatedStone.stoneName,
          startTime: updatedStone.startTime,
          endTime: updatedStone.endTime,
          chatCreation: updatedStone.chatCreation
        };
        
        console.log('수정 후 selectedStone:', this.selectedStone);
        console.log('selectedStone 업데이트 완료');
      } else {
        console.log('선택된 스톤이 없거나 다른 스톤입니다.');
        console.log('현재 selectedStone:', this.selectedStone);
      }
      
      // selectedStoneData도 업데이트 (스톤 상세 모달에서 보여지는 데이터)
      console.log('=== selectedStoneData 업데이트 확인 ===');
      console.log('현재 selectedStoneData:', this.selectedStoneData);
      console.log('찾을 stoneId:', updatedStone.stoneId);
      
      if (this.selectedStoneData && (
        this.selectedStoneData.id === updatedStone.stoneId ||
        this.selectedStoneData.stoneId === updatedStone.stoneId ||
        this.selectedStoneData.stone_id === updatedStone.stoneId
      )) {
        console.log('selectedStoneData도 업데이트 중...');
        console.log('수정 전 selectedStoneData:', this.selectedStoneData);
        
        // Vue 반응성을 위해 전체 객체를 새로 할당
        this.selectedStoneData = Object.assign({}, this.selectedStoneData, {
          stoneName: updatedStone.stoneName,
          startTime: updatedStone.startTime,
          endTime: updatedStone.endTime,
          chatCreation: updatedStone.chatCreation
        });
        
        console.log('수정 후 selectedStoneData:', this.selectedStoneData);
        console.log('selectedStoneData 업데이트 완료');
        
        // Vue 반응성을 위해 강제로 업데이트 트리거
        this.$forceUpdate();
      } else {
        console.log('selectedStoneData가 없거나 다른 스톤입니다.');
        console.log('현재 selectedStoneData:', this.selectedStoneData);
      }
    },
    
    // 스톤 상세 모달에서 스톤 수정 이벤트 처리
    onStoneUpdatedFromModal(updatedStone) {
      console.log('=== ProjectList에서 모달 이벤트 수신 ===');
      console.log('모달에서 받은 데이터:', updatedStone);
      this.onStoneUpdated({ detail: updatedStone });
    },
    
    // 스톤 상세 모달 관련 메서드들
    closeStoneDetailModal() {
      this.showStoneDetailModal = false;
      this.selectedStoneData = {};
    },
    
    expandStoneDetailModal() {
      // 전체 화면으로 확장하는 로직 (필요시 구현)
      console.log('스톤 상세 모달 확장');
    },
    
    deleteStoneFromModal(stoneData) {
      console.log('스톤 삭제:', stoneData);
      // 스톤 삭제 로직
      this.closeStoneDetailModal();
    },
    
    // 스톤 삭제 완료 처리 (API 삭제 후 호출)
    async handleStoneDeleted(deletedStone) {
      console.log('스톤 삭제 완료:', deletedStone);
      
      try {
        // 스톤 목록 새로고침
        const projectId = this.$route.query.id;
        if (projectId) {
          await this.loadStones(projectId);
          console.log('스톤 목록이 새로고침되었습니다.');
        }
      } catch (error) {
        console.error('스톤 목록 새로고침 실패:', error);
      }
    },
    
    // 스톤 완료 처리
    async handleStoneCompleted(completedStone) {
      console.log('스톤 완료:', completedStone);
      
      try {
        // 완료된 스톤의 상태를 즉시 업데이트
        this.updateStoneStatus(completedStone.stoneId, {
          milestone: 100,
          stoneStatus: 'COMPLETED'
        });
        
        // 스톤 목록 새로고침 (백그라운드에서)
        const projectId = this.$route.query.id;
        if (projectId) {
          await this.loadStones(projectId);
          console.log('스톤 목록이 새로고침되었습니다.');
        }
      } catch (error) {
        console.error('스톤 목록 새로고침 실패:', error);
      }
    },
    
    // 스톤 상태 업데이트 (즉시 반영)
    updateStoneStatus(stoneId, updates) {
      // 최상위 스톤에서 찾기
      const stoneIndex = this.stones.findIndex(stone => 
        stone.id === stoneId || stone.stoneId === stoneId
      );
      
      if (stoneIndex !== -1) {
        // 최상위 스톤 업데이트
        this.stones[stoneIndex] = {
          ...this.stones[stoneIndex],
          ...updates
        };
        console.log('최상위 스톤 상태 업데이트:', this.stones[stoneIndex].stoneName);
      } else {
        // 하위 스톤에서 찾기
        for (let i = 0; i < this.stones.length; i++) {
          const parentStone = this.stones[i];
          if (parentStone.childStone && parentStone.childStone.length > 0) {
            const childIndex = parentStone.childStone.findIndex(child => 
              child.id === stoneId || child.stoneId === stoneId
            );
            
            if (childIndex !== -1) {
              // 하위 스톤 업데이트
              this.stones[i].childStone[childIndex] = {
                ...this.stones[i].childStone[childIndex],
                ...updates
              };
              console.log('하위 스톤 상태 업데이트:', this.stones[i].childStone[childIndex].stoneName);
              break;
            }
          }
        }
      }
      
      // 스톤 노드 데이터도 업데이트 (시각적 반영을 위해)
      this.updateStoneNodeData(stoneId, updates);
      
      // Vue 반응성을 위해 강제로 업데이트 트리거
      this.$forceUpdate();
    },
    
    // 스톤 노드 데이터 업데이트 (시각적 반영)
    updateStoneNodeData(stoneId, updates) {
      // stoneNodes 배열에서 해당 스톤 찾아서 업데이트
      const nodeIndex = this.stoneNodes.findIndex(node => 
        node.id === stoneId || node.stoneId === stoneId
      );
      
      if (nodeIndex !== -1) {
        this.stoneNodes[nodeIndex] = {
          ...this.stoneNodes[nodeIndex],
          ...updates
        };
        console.log('스톤 노드 데이터 업데이트:', this.stoneNodes[nodeIndex].name);
      }
    },
    
    addTaskToStone(stoneData) {
      console.log('태스크 추가:', stoneData);
      // 태스크 추가 로직 (향후 구현)
      alert('태스크 추가 기능은 곧 구현될 예정입니다.');
    },
    
    // 태스크 생성 완료 처리
    async handleTaskCreated(taskData) {
      console.log('태스크 생성 완료:', taskData);
      
      try {
        // 해당 스톤의 마일스톤 재계산
        await this.recalculateStoneMilestone(taskData.stoneId);
        
        // 스톤 목록 새로고침 (백그라운드에서)
        const projectId = this.$route.query.id;
        if (projectId) {
          await this.loadStones(projectId);
        }
      } catch (error) {
        console.error('태스크 생성 후 마일스톤 재계산 실패:', error);
      }
    },
    
    // 태스크 완료 처리
    async handleTaskCompleted(taskData) {
      console.log('태스크 완료:', taskData);
      
      try {
        // 해당 스톤의 마일스톤 재계산
        await this.recalculateStoneMilestone(taskData.stoneId);
        
        // 스톤 목록 새로고침 (백그라운드에서)
        const projectId = this.$route.query.id;
        if (projectId) {
          await this.loadStones(projectId);
        }
      } catch (error) {
        console.error('태스크 완료 후 마일스톤 재계산 실패:', error);
      }
    },
    
    // 스톤 마일스톤 재계산
    async recalculateStoneMilestone(stoneId) {
      try {
        // 스톤의 마일스톤 정보를 다시 가져와서 업데이트
        const response = await axios.get(
          `http://localhost:8080/workspace-service/stone/${stoneId}`,
          {
            headers: {
              'X-User-Id': localStorage.getItem('id'),
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const stoneData = response.data.result;
          const newMilestone = stoneData.milestone || 0;
          
          // 스톤 상태 즉시 업데이트
          this.updateStoneStatus(stoneId, {
            milestone: newMilestone
          });
          
          console.log(`스톤 ${stoneId} 마일스톤 업데이트: ${newMilestone}%`);
        }
      } catch (error) {
        console.error('마일스톤 재계산 실패:', error);
      }
    },
    
    editStoneManager(stoneData) {
      console.log('스톤 담당자 수정:', stoneData);
      // 담당자 수정은 StoneDetailModal에서 처리됨
    },
    
    // 담당자 변경 완료 처리
    handleManagerChanged(data) {
      console.log('담당자 변경 완료:', data);
      
      // 선택된 스톤 데이터의 담당자 정보 업데이트
      if (this.selectedStoneData && this.selectedStoneData.stoneId === data.stoneId) {
        this.selectedStoneData.manager = data.newManagerName;
      }
      
      // 스톤 목록에서도 해당 스톤의 담당자 정보 업데이트
      this.updateStoneManagerInList(data.stoneId, data.newManagerName);
      
      // 성공 메시지는 StoneDetailModal에서 이미 표시됨
    },
    
    // 스톤 목록에서 담당자 정보 업데이트
    updateStoneManagerInList(stoneId, newManagerName) {
      // 프로젝트 스톤 목록에서 업데이트
      if (this.projectStones) {
        const stone = this.projectStones.find(s => s.stoneId === stoneId || s.id === stoneId);
        if (stone) {
          stone.manager = newManagerName;
        }
      }
      
      // 전체 스톤 목록에서도 업데이트 (필요한 경우)
      if (this.stones) {
        const stone = this.stones.find(s => s.stoneId === stoneId || s.id === stoneId);
        if (stone) {
          stone.manager = newManagerName;
        }
      }
    },
    
    async editStoneParticipants(stoneData) {
      console.log('스톤 참여자 수정:', stoneData);
      // 참여자 선택 모달 열기
      this.selectedStoneForParticipants = stoneData;
      
      // 기존 참여자 정보를 미리 로드
      await this.loadExistingParticipants(stoneData.stoneId);
      
      this.openUserSelectModal('participants');
    },
    
    resetNewStoneForm() {
      this.newStone = {
        parentStoneName: '',
        stoneName: '',
        startTime: '',
        endTime: '',
        assignee: this.currentUser.name || '김을빗', // 현재 사용자 이름으로 설정
        participants: '',
        createChat: false
      };
    },
    
    async createStone() {
      if (!this.validateStoneForm()) {
        return;
      }
      
      // 채팅방 생성이 비활성화된 경우 createChat을 false로 강제 설정
      if (this.isChatCreationDisabled) {
        this.newStone.createChat = false;
      }
      
      try {
        const projectId = this.$route.query.id;
        const userId = localStorage.getItem('id');
        
        // 참여자 ID 리스트 생성 (API 전송용) - Proxy 문제 해결을 위해 명시적으로 배열 복제
        const participantIds = this.confirmedParticipants 
          ? Array.from(this.confirmedParticipants) 
          : [];
        
        const stoneData = {
          parentStoneId: this.selectedParentStone.id,
          stoneName: this.newStone.stoneName,
          startTime: this.newStone.startTime + 'T09:00:00',
          endTime: this.newStone.endTime + 'T18:00:00',
          chatCreation: this.newStone.createChat,
          participantIds: participantIds
        };
        
        const response = await axios.post(
          `http://localhost:8080/workspace-service/stone`,
          stoneData,
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 201) {
          alert('스톤이 성공적으로 생성되었습니다.');
          this.closeCreateStoneModal();
          // 스톤 목록 새로고침
          await this.loadStones(projectId);
        } else {
          alert(`스톤 생성에 실패했습니다. (${response.data.statusCode}: ${response.data.statusMessage})`);
        }
      } catch (error) {
        if (error.response) {
          alert(`서버 오류: ${error.response.status} - ${error.response.data?.statusMessage || error.message}`);
        } else if (error.request) {
          alert('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
        } else {
          alert(`요청 오류: ${error.message}`);
        }
      }
    },
    
    validateStoneForm() {
      if (!this.newStone.stoneName.trim()) {
        alert('스톤명을 입력해주세요.');
        return false;
      }
      
      if (!this.newStone.startTime) {
        alert('시작일을 선택해주세요.');
        return false;
      }
      
      if (!this.newStone.endTime) {
        alert('종료일을 선택해주세요.');
        return false;
      }
      
      if (new Date(this.newStone.startTime) >= new Date(this.newStone.endTime)) {
        alert('종료일은 시작일보다 늦어야 합니다.');
        return false;
      }
      
      // 과거 날짜 입력 방지
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (new Date(this.newStone.startTime) < today) {
        alert('시작일은 오늘 날짜 이후여야 합니다.');
        return false;
      }
      
      if (new Date(this.newStone.endTime) < today) {
        alert('종료일은 오늘 날짜 이후여야 합니다.');
        return false;
      }
      
      if (!this.newStone.assignee.trim()) {
        alert('담당자를 입력해주세요.');
        return false;
      }
      
      return true;
    },
    
    // 사용자 선택 모달 열기 (참여자만)
    async openUserSelectModal(type) {
      if (type === 'assignee') return; // 담당자는 선택 불가
      this.userSelectType = type;
      this.showUserSelectModal = true;
      this.userSearchKeyword = '';
      this.selectedGroup = '';
      this.filteredUserList = [...this.userList];
      
      // 스톤 생성 시에는 기존 참여자 초기화
      if (!this.selectedStoneForParticipants) {
        this.allSelectedUsers = [];
      }
      
      // 사용자 그룹 목록 로드
      await this.loadUserGroupList();
    },
    
    // 사용자 선택 모달 닫기
    closeUserSelectModal() {
      this.showUserSelectModal = false;
      this.userSelectType = '';
      this.userSearchKeyword = '';
      this.selectedGroup = '';
      this.filteredUserList = [];
      this.emailSearchResults = [];
      this.selectedUser = null;
      this.selectedGroupMembers = [];
      this.allSelectedUsers = [];
      this.selectedStoneForParticipants = null;
    },
    
    // 사용자 선택 확인
    async confirmUserSelection() {
      if (this.userSelectType === 'participants') {
        if (this.selectedStoneForParticipants) {
          // 스톤 참여자 수정인 경우
          await this.updateStoneParticipants();
        } else {
          // 스톤 생성 시 참여자 선택인 경우
          const participantNames = this.allSelectedUsers.map(user => user.name);
          this.newStone.participants = participantNames.join(', ');
          
          // userId만 사용 (UUID 타입)
          this.confirmedParticipants = this.allSelectedUsers.map(user => {
            return user.id;
          });
          
          console.log('선택된 참여자 이름들:', participantNames);
          console.log('선택된 참여자 객체:', this.allSelectedUsers);
          console.log('확정된 참여자 ID들 (participantId 우선):', this.confirmedParticipants);
        }
      }
      this.closeUserSelectModal();
    },
    
    // 그룹 선택
    async selectGroup(groupName) {
      this.selectedGroup = groupName;
      await this.loadGroupMembers();
    },
    
    // 그룹을 선택된 사용자에 추가
    async addGroupToSelected(groupName) {
      this.selectedGroup = groupName;
      await this.loadGroupMembersForSelection();
    },
    
    // 사용자 검색 API 호출
    async searchUsers() {
      if (!this.userSearchKeyword.trim()) {
        this.emailSearchResults = [];
        return;
      }
      
      try {
        const userId = localStorage.getItem('id');
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        
        const response = await axios.post(
          `http://localhost:8080/workspace-service/workspace/participants/search`,
          {
            workspaceId: workspaceId,
            searchKeyword: this.userSearchKeyword.trim()
          },
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const users = response.data.result.userInfoList || [];
          
          // API 응답을 사용자 목록 형식으로 변환
          this.emailSearchResults = users.map(user => ({
            id: user.userId,
            name: user.userName,
            email: user.userEmail,
            group: '검색결과'
          }));
          
          console.log('검색 결과:', this.emailSearchResults);
        } else {
          console.error('사용자 검색 실패:', response.data);
          this.emailSearchResults = [];
        }
      } catch (error) {
        console.error('사용자 검색 API 호출 실패:', error);
        this.emailSearchResults = [];
      }
    },
    
    // 사용자 필터링 (기존 로직 유지)
    async filterUsers() {
      // 그룹이 선택되었을 때 해당 그룹의 멤버들을 API로 가져오기
      if (this.selectedGroup) {
        await this.loadGroupMembers();
      } else {
        // 검색어가 있으면 검색 API 호출
        if (this.userSearchKeyword.trim()) {
          await this.searchUsers();
        } else {
          this.emailSearchResults = [];
        }
      }
    },
    
    // 사용자 선택 (참여자만)
    selectUser(user) {
      this.selectedUser = user;
      
      // 프로젝트 담당자 선택인 경우
      if (this.userSelectType === 'project-manager') {
        this.editForm.manager = user.name;
        this.closeUserSelectModal();
        return;
      }
      
      // 기존 선택된 사용자들과 중복 제거하면서 추가
      const existingIndex = this.allSelectedUsers.findIndex(selectedUser => selectedUser.id === user.id);
      if (existingIndex === -1) {
        this.allSelectedUsers.push(user);
      }
      
      if (this.userSelectType === 'participants') {
        const memberNames = this.allSelectedUsers.map(member => member.name);
        this.newStone.participants = memberNames.join(', ');
      }
    },
    
    // 선택된 사용자 해제
    removeSelectedUser() {
      this.selectedUser = null;
      if (this.userSelectType === 'participants') {
        this.newStone.participants = '';
      }
    },
    
    // 개별 멤버 제거
    removeMember(memberId) {
      this.allSelectedUsers = this.allSelectedUsers.filter(member => member.id !== memberId);
      
      // 참여자 필드 업데이트
      if (this.userSelectType === 'participants') {
        if (this.allSelectedUsers.length > 0) {
          const memberNames = this.allSelectedUsers.map(member => member.name);
          this.newStone.participants = memberNames.join(', ');
        } else {
          this.newStone.participants = '';
        }
      }
    },
    
    // 모든 멤버 해제
    clearAllMembers() {
      this.allSelectedUsers = [];
      if (this.userSelectType === 'participants') {
        this.newStone.participants = '';
      }
    },
    
    // 사용자 그룹 목록 조회
    async loadUserGroupList() {
      try {
        const userId = localStorage.getItem('id');
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/groups?workspaceId=${workspaceId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          this.userGroupList = response.data.result.content || [];
          console.log('사용자 그룹 목록:', this.userGroupList);
        } else {
          console.error('사용자 그룹 목록 조회 실패:', response.data);
          this.userGroupList = [];
        }
      } catch (error) {
        console.error('사용자 그룹 목록 API 호출 실패:', error);
        this.userGroupList = [];
      }
    },
    
    // 선택된 그룹의 멤버 조회
    async loadGroupMembers() {
      try {
        const userId = localStorage.getItem('id');
        const selectedGroup = this.userGroupList.find(group => group.groupName === this.selectedGroup);
        
        if (!selectedGroup) {
          console.error('선택된 그룹을 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/groups/${selectedGroup.groupId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const members = response.data.result.members.content || [];
          
          // API 응답을 사용자 목록 형식으로 변환
          const groupMembers = members.map(member => ({
            id: member.userId,
            name: member.userName,
            email: member.userEmail,
            group: this.selectedGroup
          }));
          
          // 이메일 검색 결과는 비우고, 선택된 사용자 섹션에 그룹 멤버들 표시
          this.emailSearchResults = [];
          this.selectedUser = groupMembers[0] || null; // 첫 번째 멤버를 선택된 사용자로 설정
          
          if (this.selectedUser && this.userSelectType === 'participants') {
            this.newStone.participants = this.selectedUser.name;
          }
          
          console.log('그룹 멤버 목록:', groupMembers);
        } else {
          console.error('그룹 멤버 조회 실패:', response.data);
          this.emailSearchResults = [];
          this.selectedUser = null;
        }
      } catch (error) {
        console.error('그룹 멤버 API 호출 실패:', error);
        this.emailSearchResults = [];
        this.selectedUser = null;
      }
    },
    
    // 그룹 멤버들을 선택된 사용자에 추가
    async loadGroupMembersForSelection() {
      try {
        const userId = localStorage.getItem('id');
        const selectedGroup = this.userGroupList.find(group => group.groupName === this.selectedGroup);
        
        if (!selectedGroup) {
          console.error('선택된 그룹을 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/groups/${selectedGroup.groupId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const members = response.data.result.members.content || [];
          
          // API 응답을 사용자 목록 형식으로 변환
          const newMembers = members.map(member => ({
            id: member.userId,
            name: member.userName,
            email: member.userEmail,
            group: this.selectedGroup
          }));
          
          // 기존 선택된 사용자들과 중복 제거하면서 추가
          newMembers.forEach(member => {
            const existingIndex = this.allSelectedUsers.findIndex(user => user.id === member.id);
            if (existingIndex === -1) {
              this.allSelectedUsers.push(member);
            }
          });
          
          // 참여자 필드에 모든 선택된 사용자 이름을 쉼표로 구분하여 추가
          if (this.userSelectType === 'participants') {
            const memberNames = this.allSelectedUsers.map(member => member.name);
            this.newStone.participants = memberNames.join(', ');
          }
          
          console.log('전체 선택된 사용자들:', this.allSelectedUsers);
        } else {
          console.error('그룹 멤버 조회 실패:', response.data);
        }
      } catch (error) {
        console.error('그룹 멤버 API 호출 실패:', error);
      }
    },
    
    // 그룹 추가 모달 표시
    showAddGroupModal() {
      // 간단한 프롬프트로 그룹명 입력 받기
      const groupName = prompt('새 그룹명을 입력하세요:');
      if (groupName && groupName.trim()) {
        this.addNewGroup(groupName.trim());
      }
    },
    
    // 새 그룹 추가
    async addNewGroup(groupName) {
      try {
        const userId = localStorage.getItem('id');
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        
        const response = await axios.post(
          `http://localhost:8080/workspace-service/groups`,
          {
            groupName: groupName,
            workspaceId: workspaceId
          },
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          console.log('그룹 생성 성공:', response.data);
          // 그룹 목록 새로고침
          await this.loadUserGroupList();
          // 새로 생성된 그룹 선택
          this.selectedGroup = groupName;
          await this.loadGroupMembers();
        } else {
          console.error('그룹 생성 실패:', response.data);
          alert('그룹 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('그룹 생성 API 호출 실패:', error);
        alert('그룹 생성 중 오류가 발생했습니다.');
      }
    },
    
    // 기존 참여자 정보 로드
    async loadExistingParticipants(stoneId) {
      try {
        const userId = localStorage.getItem('id');
        
        const response = await axios.get(
          `http://localhost:8080/workspace-service/stone/${stoneId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          const stoneDetail = response.data.result;
          const participants = stoneDetail.stoneParticipantDtoList || [];
          
          // 기존 참여자들을 allSelectedUsers에 추가
          this.allSelectedUsers = participants.map(participant => ({
            id: participant.userId,
            name: participant.participantName,
            email: participant.participantEmail || participant.userEmail || '', // 이메일 정보 추가
            participantId: participant.participantId,
            group: '기존 참여자'
          }));
          
          // 이메일이 없는 경우 사용자 정보를 별도로 조회
          await this.loadParticipantEmails();
          
          console.log('기존 참여자 로드 완료:', this.allSelectedUsers);
        } else {
          console.error('기존 참여자 로드 실패:', response.data);
          this.allSelectedUsers = [];
        }
      } catch (error) {
        console.error('기존 참여자 로드 API 호출 실패:', error);
        this.allSelectedUsers = [];
      }
    },
    
    // 참여자 이메일 정보 조회
    async loadParticipantEmails() {
      const usersWithoutEmail = this.allSelectedUsers.filter(user => !user.email);
      
      if (usersWithoutEmail.length === 0) return;
      
      try {
        const userId = localStorage.getItem('id');
        
        // 각 사용자에 대해 이메일 정보 조회
        for (const user of usersWithoutEmail) {
          try {
            const response = await axios.get(
              `http://localhost:8080/user-service/user/${user.id}`,
              {
                headers: {
                  'X-User-Id': userId
                }
              }
            );
            
            if (response.data.statusCode === 200) {
              const userInfo = response.data.result;
              user.email = userInfo.email || '';
            }
          } catch (error) {
            console.warn(`사용자 ${user.id}의 이메일 조회 실패:`, error);
            user.email = '';
          }
        }
      } catch (error) {
        console.error('참여자 이메일 조회 중 오류:', error);
      }
    },
    
    // 스톤 참여자 변경
    async updateStoneParticipants() {
      if (!this.selectedStoneForParticipants || this.allSelectedUsers.length === 0) {
        alert('선택된 스톤이나 참여자가 없습니다.');
        return;
      }
      
      try {
        const userId = localStorage.getItem('id');
        const participantIds = this.allSelectedUsers.map(user => user.id); // userId만 사용
        
        console.log('스톤 참여자 변경 요청 데이터:', {
          stoneId: this.selectedStoneForParticipants.stoneId,
          stoneParticipantList: participantIds
        });
        
        const response = await axios.patch(
          `http://localhost:8080/workspace-service/stone/participant/join`,
          {
            stoneId: this.selectedStoneForParticipants.stoneId,
            stoneParticipantList: participantIds
          },
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.statusCode === 200) {
          console.log('스톤 참여자 변경 성공:', response.data);
          alert('참여자가 성공적으로 변경되었습니다.');
          
          // 스톤 상세 모달 닫기
          this.closeStoneDetailModal();
          
          // 스톤 목록 새로고침
          const projectId = this.$route.query.id;
          if (projectId) {
            await this.loadStones(projectId);
          }
        } else {
          console.error('스톤 참여자 변경 실패:', response.data);
          alert('참여자 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('스톤 참여자 변경 API 호출 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || error.message || '참여자 변경 중 오류가 발생했습니다.';
        alert(errorMessage);
      }
    },

    // 프로젝트 수정 모달 관련 메서드들
    openEditModal() {
      // 현재 프로젝트 정보로 폼 초기화
      this.editForm = {
        projectName: this.projectName,
        startDate: this.formatDateForInput(this.projectDetail.startTime),
        endDate: this.formatDateForInput(this.projectDetail.endTime),
        manager: this.projectDetail.manager,
        managerId: this.projectDetail.managerId || '', // 기존 담당자 ID 설정
        status: this.mapStatusFromAPI(this.projectDetail.projectStatus) || '진행중',
        description: this.projectDescription
      };
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.editForm = {
        projectName: '',
        startDate: '',
        endDate: '',
        manager: '',
        managerId: '',
        status: '진행중',
        description: ''
      };
    },

    async saveProject() {
      try {
        // 프로젝트 수정 API 호출
        const userId = localStorage.getItem('id');
        const projectId = this.$route.query.id;
        const workspaceId = this.currentWorkspaceId;
        
        if (!projectId) {
          alert('프로젝트 ID가 없습니다.');
          return;
        }

        if (!workspaceId) {
          alert('워크스페이스 ID가 없습니다.');
          return;
        }

        // 날짜 형식 변환 (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
        const startTime = this.formatDateTimeForAPI(this.editForm.startDate);
        const endTime = this.formatDateTimeForAPI(this.editForm.endDate);
        
        // 상태 매핑
        const statusMapping = {
          '진행중': 'PROGRESS',
          '완료': 'COMPLETED',
          '보관': 'STORAGE'
        };
        
        const requestBody = {
          projectId: projectId,
          workspaceId: workspaceId,
          projectName: this.editForm.projectName,
          startTime: startTime,
          endTime: endTime,
          projectObjective: this.editForm.description, // description을 objective로 매핑
          projectDescription: this.editForm.description,
          projectStatus: statusMapping[this.editForm.status] || 'PROGRESS'
        };

        // 담당자가 변경된 경우에만 projectManagerId 추가
        if (this.editForm.managerId) {
          requestBody.projectManagerId = this.editForm.managerId;
        }
        
        // 요청 객체 로그 출력
        console.log('프로젝트 수정 API 요청 객체:', requestBody);
        console.log('요청 헤더:', {
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        });
        
        const response = await axios.patch(
          'http://localhost:8080/workspace-service/project',
          requestBody,
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.statusCode === 200) {
          console.log('프로젝트 수정 성공:', response.data);
          alert('프로젝트가 성공적으로 수정되었습니다.');
          
          // 프로젝트 정보 업데이트
          this.projectName = this.editForm.projectName;
          this.projectDescription = this.editForm.description;
          this.projectDetail.projectName = this.editForm.projectName;
          this.projectDetail.manager = this.editForm.manager;
          this.projectDetail.startTime = startTime;
          this.projectDetail.endTime = endTime;
          this.projectDetail.managerId = this.editForm.managerId;
          
          // 사이드바 프로젝트 목록 업데이트를 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('projectUpdated', {
            detail: {
              projectId: this.$route.query.id,
              projectName: this.editForm.projectName,
              manager: this.editForm.manager,
              status: statusMapping[this.editForm.status] || 'PROGRESS'
            }
          }));
          
          this.closeEditModal();
        } else {
          console.error('프로젝트 수정 실패:', response.data);
          alert('프로젝트 수정에 실패했습니다.');
        }
      } catch (error) {
        console.error('프로젝트 수정 API 호출 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || error.message || '프로젝트 수정 중 오류가 발생했습니다.';
        alert(errorMessage);
      }
    },

    formatDateForInput(dateStr) {
      if (!dateStr) return '';
      // YYYY-MM-DDTHH:mm:ss 또는 YYYY-MM-DD 형식을 input[type="date"]에 맞게 변환
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0]; // T 이전 부분만 추출
      }
      return dateStr;
    },

    formatDateForAPI(dateStr) {
      if (!dateStr) return '';
      // input[type="date"] 형식을 API에 맞게 변환
      return dateStr;
    },

    formatDateTimeForAPI(dateStr) {
      if (!dateStr) return '';
      // YYYY-MM-DD 형식을 YYYY-MM-DDTHH:mm:ss 형식으로 변환
      return `${dateStr}T09:00:00`; // 기본적으로 오전 9시로 설정
    },

    // API 상태를 한국어 상태로 변환
    mapStatusFromAPI(apiStatus) {
      const statusMapping = {
        'PROGRESS': '진행중',
        'COMPLETED': '완료',
        'STORAGE': '보관'
      };
      return statusMapping[apiStatus] || '진행중';
    },

    async openProjectManagerSelectModal() {
      try {
        // 워크스페이스 참여자 목록을 가져와서 담당자 선택 모달에 표시
        await this.loadAvailableProjectManagers();
        this.showProjectManagerSelectModal = true;
        this.projectManagerSearchKeyword = '';
        this.selectedProjectManagerId = null;
      } catch (error) {
        console.error('담당자 목록 로드 실패:', error);
        alert('담당자 목록을 불러올 수 없습니다.');
      }
    },

    closeProjectManagerSelectModal() {
      this.showProjectManagerSelectModal = false;
      this.projectManagerSearchKeyword = '';
      this.selectedProjectManagerId = null;
      this.isProjectManagerSearching = false;
    },

    // 프로젝트 담당자 목록 로드 (실제 API 호출)
    async loadAvailableProjectManagers() {
      try {
        if (!this.currentWorkspaceId) {
          throw new Error('워크스페이스 ID가 없습니다.');
        }
        
        // 워크스페이스 참여자 검색 API 호출
        const response = await searchWorkspaceParticipants(this.currentWorkspaceId, '');
        
        if (response && response.result && response.result.userInfoList) {
          // API 응답을 담당자 목록 형태로 변환
          this.availableProjectManagers = response.result.userInfoList.map(user => ({
            id: user.userId, // UUID 형태의 사용자 ID
            name: user.userName,
            email: user.userEmail,
            profileImageUrl: user.profileImageUrl
          }));
        } else {
          this.availableProjectManagers = [];
        }
        
        this.filteredProjectManagers = [...this.availableProjectManagers];
        
      } catch (error) {
        console.error('담당자 목록 로드 실패:', error);
        alert(error.message || '담당자 목록을 불러올 수 없습니다.');
        this.availableProjectManagers = [];
        this.filteredProjectManagers = [];
      }
    },
    
    // 프로젝트 담당자 검색 필터링 (실제 API 호출)
    async filterProjectManagers() {
      try {
        this.isProjectManagerSearching = true;
        
        if (!this.currentWorkspaceId) {
          this.filteredProjectManagers = [...this.availableProjectManagers];
          return;
        }
        
        const keyword = this.projectManagerSearchKeyword.trim();
        
        if (keyword === '') {
          // 빈 검색어인 경우 전체 목록 표시
          this.filteredProjectManagers = [...this.availableProjectManagers];
        } else {
          // API 호출로 검색
          const response = await searchWorkspaceParticipants(this.currentWorkspaceId, keyword);
          
          if (response && response.result && response.result.userInfoList) {
            this.filteredProjectManagers = response.result.userInfoList.map(user => ({
              id: user.userId, // UUID 형태의 사용자 ID
              name: user.userName,
              email: user.userEmail,
              profileImageUrl: user.profileImageUrl
            }));
          } else {
            this.filteredProjectManagers = [];
          }
        }
        
      } catch (error) {
        console.error('담당자 검색 실패:', error);
        // 검색 실패 시 클라이언트 사이드 필터링으로 폴백
        const keyword = this.projectManagerSearchKeyword.toLowerCase();
        this.filteredProjectManagers = this.availableProjectManagers.filter(manager => 
          manager.name.toLowerCase().includes(keyword) || 
          manager.email.toLowerCase().includes(keyword)
        );
      } finally {
        this.isProjectManagerSearching = false;
      }
    },
    
    // 프로젝트 담당자 선택
    selectProjectManager(manager) {
      this.selectedProjectManagerId = manager.id;
    },
    
    // 프로젝트 담당자 선택 확인
    confirmProjectManagerChange() {
      if (!this.selectedProjectManagerId) {
        alert('담당자를 선택해주세요.');
        return;
      }
      
      const selectedManager = this.availableProjectManagers.find(m => m.id === this.selectedProjectManagerId);
      if (selectedManager) {
        this.editForm.manager = selectedManager.name;
        this.editForm.managerId = selectedManager.id;
        this.closeProjectManagerSelectModal();
      }
    },

    // 프로젝트 삭제 모달 관련 메서드들
    openDeleteModal() {
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
    },

    async confirmDeleteProject() {
      try {
        const userId = localStorage.getItem('id');
        const projectId = this.$route.query.id;
        const workspaceId = this.currentWorkspaceId;
        
        if (!projectId) {
          alert('프로젝트 ID가 없습니다.');
          return;
        }

        if (!workspaceId) {
          alert('워크스페이스 ID가 없습니다.');
          return;
        }

        // 프로젝트 삭제 API 호출
        const response = await axios.delete(
          `http://localhost:8080/workspace-service/project/${projectId}`,
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json'
            },
            data: {
              workspaceId: workspaceId
            }
          }
        );

        if (response.data.statusCode === 200) {
          console.log('프로젝트 삭제 성공:', response.data);
          alert('프로젝트가 성공적으로 삭제되었습니다.');
          
          // 사이드바 프로젝트 목록에서 제거를 위한 이벤트 발생
          window.dispatchEvent(new CustomEvent('projectDeleted', {
            detail: {
              projectId: this.$route.query.id
            }
          }));
          
          // 홈화면으로 이동
          this.$router.push('/');
        } else {
          console.error('프로젝트 삭제 실패:', response.data);
          alert('프로젝트 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('프로젝트 삭제 오류:', error);
        if (error.response && error.response.data) {
          alert(`프로젝트 삭제 실패: ${error.response.data.statusMessage || '알 수 없는 오류가 발생했습니다.'}`);
        } else {
          alert('프로젝트 삭제 중 오류가 발생했습니다.');
        }
      } finally {
        this.closeDeleteModal();
      }
    }
  }
};
</script>

<style scoped>
.project-container {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  overflow: hidden;
  background: #F5F5F5;
}

/* 프로젝트 헤더 (바디 안의 헤더) */
.project-header {
  background: #F5F5F5;
  padding: 20px 50px 10px 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-icon {
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-icon:hover {
  transform: scale(1.1);
  opacity: 0.8;
}

.delete-icon {
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-icon:hover {
  transform: scale(1.1);
  opacity: 0.8;
}

.project-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  margin: 0;
}

.edit-icon {
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.2s;
}

.edit-icon:hover {
  opacity: 1;
}

/* 프로젝트 설명 섹션 */
.project-description-section {
  background: #F5F5F5;
  padding: 0 50px 20px 50px;
}

.project-description-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin: 0;
}

/* 탭 섹션 */
.tab-section {
  background: #F5F5F5;
  padding: 0 50px;
  border-bottom: 1px solid rgba(42, 40, 40, 0.5);
}

.tab-menu {
  display: flex;
  gap: 0;
  padding-bottom: 6px;
  width: 100%;
  border-bottom: 1px solid rgba(42, 40, 40, 0.2);
}

.tab-item {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  cursor: pointer;
  transition: color 0.2s;
  flex: 1;
  text-align: center;
  padding-bottom: 4px;
  position: relative;
}

.tab-item.active {
  color: #FFDD44;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 0;
  right: 0;
  height: 4px;
  background: #FFDD44;
  border-radius: 2px 2px 0 0;
}


/* 스톤 생성 버튼 래퍼 */
.create-stone-button-wrapper {
  position: absolute;
  top: 20px;
  right: 45px;
  z-index: 10;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #2A2828;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-button:hover {
  background: #1a1818;
}

.create-button span {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  color: #FFFFFF;
}

.tab-content {
  width: 100%;
  padding: 20px 45px;
  background-image: radial-gradient(circle, rgba(217, 217, 217, 0.5) 1px, transparent 1px);
  background-size: 20px 20px;
  background-repeat: repeat;
}

.placeholder-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #999999;
  text-align: center;
  padding: 50px 0;
}

.loading-container {
  text-align: center;
  padding: 50px 0;
}

.loading-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #666666;
}

/* 확대/축소 컨트롤 */
.zoom-controls {
  position: fixed;
  bottom: 20px;
  left: 320px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 1000;
}

/* 모드 전환 컨트롤 */
.mode-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1001;
}

.mode-btn {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 247, 204, 0.8);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 20px;
}

.mode-btn:hover {
  background: rgba(255, 245, 157, 0.9);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.mode-btn.active {
  background: rgba(255, 212, 79, 0.9);
  box-shadow: 0 0 0 2px rgba(255, 179, 0, 0.3);
}

.mode-icon {
  font-size: 18px;
  line-height: 1;
}

.zoom-btn {
  width: 44px;
  height: 44px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  background: rgba(255, 247, 204, 0.8);
  color: #A67600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(166, 118, 0, 0.15);
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.zoom-btn:hover {
  background: rgba(255, 247, 204, 0.95);
  color: #8B5A00;
  border-color: #D4AF37;
  box-shadow: 0 4px 12px rgba(166, 118, 0, 0.2);
  transform: translateY(-1px);
}

.zoom-btn:active {
  transform: translateY(0px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #F5F5F5;
  color: #999999;
  border-color: #E5E5E5;
}

/* 프로젝트 정보 (제목 오른쪽) */
.project-info {
  display: flex;
  align-items: center;
  gap: 24px;
}


.date-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #666666;
}

.project-owner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.owner-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #666666;
}

.calendar-icon,
.user-icon {
  opacity: 0.6;
}

/* 마일스톤 캔버스 스타일 */
.milestone-canvas {
  position: fixed;
  top: 300px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  background-color: #F7F8F8;
  background-image:
    radial-gradient(rgba(120, 130, 130, 0.1) 1.5px, transparent 1.5px),
    radial-gradient(rgba(120, 130, 130, 0.1) 1.5px, transparent 1.5px);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
  overflow: auto; /* 스크롤 허용 */
}

/* SVG 캔버스 */
.milestone-canvas {
  user-select: none;
  cursor: default;
}

.milestone-canvas.panning {
  cursor: grabbing;
}

.milestone-canvas.pan-mode {
  cursor: grab;
}

.milestone-canvas.click-mode {
  cursor: default;
}

.milestone-svg {
  cursor: inherit;
}

/* SVG 스톤 그룹 */
.stone-group {
  cursor: pointer;
}

/* 연결선 스타일 */
.connection-line {
  cursor: pointer;
  animation: fadeInLine 0.5s cubic-bezier(0.45, 0, 0.55, 1);
}

@keyframes fadeInLine {
  0% {
    opacity: 0;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  100% {
    opacity: 1;
    stroke-dasharray: none;
    stroke-dashoffset: 0;
  }
}

.milestone-line {
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.2s ease;
}

.milestone-line:hover {
  stroke-width: 2.5;
}

/* 루트 연결선 스타일 */
.root-connection-line {
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all 0.2s ease;
}

.root-connection-line:hover {
  stroke-width: 2.5;
}

/* 도넛형 스톤 스타일 */
.donut-stone {
  cursor: pointer;
  transition: transform 0.25s ease-out;
  animation: fadeInScale 0.5s cubic-bezier(0.45, 0, 0.55, 1);
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.click-mode .donut-stone {
  cursor: pointer;
}

.pan-mode .donut-stone {
  cursor: grab;
}

/* 루트 스톤 특별 스타일 */
.root-stone {
  filter: drop-shadow(0 0 10px rgba(78, 110, 129, 0.25)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
  transition: all 0.3s ease;
}

.root-stone:hover {
  filter: drop-shadow(0 0 15px rgba(78, 110, 129, 0.4)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  transform: scale(1.02);
}

.root-stone-bg {
  transition: all 0.3s ease;
}

.root-stone-highlight {
  transition: all 0.3s ease;
}

/* 하위 스톤 스타일 */
.child-stone-bg {
  transition: all 0.2s ease;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

.child-stone-inner {
  transition: all 0.2s ease;
}

.donut-background {
  stroke: #8EA8A0;
  stroke-width: 2;
  transition: all 0.2s ease;
}

.root-stone .donut-background {
  stroke: #8EA8A0;
  stroke-width: 2;
}

/* 하위 스톤 테두리 */
.child-stone-bg + .child-stone-inner + .donut-background {
  stroke: #8EA8A0;
  stroke-width: 2;
}

/* 완료된 스톤 스타일 */
.completed-stone {
  opacity: 0.8;
  filter: grayscale(0.3) drop-shadow(0 0 8px rgba(34, 197, 94, 0.3));
}

.completed-stone .root-stone-bg,
.completed-stone .child-stone-bg {
  fill: #DCFCE7;
}

.completed-stone .root-stone-highlight,
.completed-stone .child-stone-inner {
  fill: #BBF7D0;
}

.completed-stone .donut-background {
  stroke: #22C55E;
  stroke-width: 3;
}

.completed-stone .donut-progress {
  stroke: #16A34A;
}

.completed-stone .stone-name,
.completed-stone .root-stone-name {
  color: #15803D;
  font-weight: 800;
}

.completed-stone .stone-milestone,
.completed-stone .root-stone-milestone {
  color: #16A34A;
  font-weight: 800;
}


.donut-progress {
  transition: stroke-dashoffset 0.8s ease-in-out;
  animation: progressFill 1s ease-out;
}

@keyframes progressFill {
  from {
    stroke-dashoffset: 2 * 3.14159 * 90; /* 초기값: 완전히 비어있는 상태 */
  }
  to {
    stroke-dashoffset: 2 * 3.14159 * 90 * (1 - var(--progress, 0) / 100);
  }
}

/* 스톤 생성 텍스트 버튼 스타일 */
.create-stone-text {
  cursor: pointer !important;
  transition: none !important;
  transform: none !important;
}

.create-stone-text:hover {
  cursor: pointer !important;
}

.create-stone-text:active {
  transform: none !important;
}

.click-mode .create-stone-text {
  cursor: pointer !important;
}

.pan-mode .create-stone-text {
  cursor: pointer !important;
}

.create-stone-click-area {
  cursor: pointer !important;
  pointer-events: all;
}

.create-stone-text-content {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 11px;
  fill: #6B8E89;
  text-anchor: middle;
  pointer-events: all;
  letter-spacing: 0.5px;
  transition: none !important;
  cursor: pointer !important;
}

.create-stone-text:hover .create-stone-text-content {
  fill: #6B8E89;
}

/* 완료된 스톤의 스톤 생성 텍스트 비활성화 */
.create-stone-text.disabled {
  cursor: not-allowed !important;
  opacity: 0.3;
}

.create-stone-text.disabled .create-stone-text-content {
  fill: #9CA3AF !important;
  cursor: not-allowed !important;
}

.create-stone-text.disabled:hover .create-stone-text-content {
  fill: #9CA3AF !important;
}

/* SVG 텍스트 스타일 */
.stone-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  fill: #1A1A1A;
  pointer-events: none;
  text-anchor: middle;
  line-height: 1.2;
}

.stone-dday {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 12px;
  fill: #666666;
  pointer-events: none;
  text-anchor: middle;
}

.stone-milestone {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  fill: #4A90E2;
  pointer-events: none;
  text-anchor: middle;
}

/* 루트 스톤 텍스트 스타일 */
.root-stone-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  fill: #F8F8F2;
  pointer-events: none;
  text-anchor: middle;
  line-height: 1.2;
}

.root-stone-dday {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 13px;
  fill: #F8F8F2;
  pointer-events: none;
  text-anchor: middle;
}

.root-stone-milestone {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 13px;
  fill: #4A90E2;
  pointer-events: none;
  text-anchor: middle;
}


/* 다른 탭들 */
.other-tabs {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 기존 스타일들은 새로운 SVG 기반 디자인으로 대체됨 */

/* 스톤 생성 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.create-stone-modal {
  width: 600px;
  min-height: 600px;
  max-height: 85vh;
  background: #F5F5F5;
  border: 1px solid #000000;
  box-shadow: 4px 4px 32px rgba(0, 0, 0, 0.25), -4px -4px 32px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 40px 10px 40px;
  text-align: center;
  flex-shrink: 0;
}

.modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  margin: 0;
}

.modal-body {
  flex: 1;
  padding: 15px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.form-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  color: #7C7C7C;
  display: flex;
  align-items: center;
  gap: 4px;
}

.required {
  color: #F4CE53;
  font-weight: 700;
  font-size: 20px;
  line-height: 24px;
}

.form-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-input {
  width: 100%;
  height: 56px;
  background: #FFFFFF;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25);
  border-radius: 15px;
  border: none;
  padding: 0 20px;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  color: #1C0F0F;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25), 0 0 0 2px #F4CE53;
}

.form-input::placeholder {
  color: #CCCCCC;
}

.dropdown-arrow {
  position: absolute;
  right: 20px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #F4CE53;
  pointer-events: none;
}

.date-separator {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #7C7C7C;
  margin: 0 8px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-checkbox {
  width: 24px;
  height: 24px;
  background: #FFFFFF;
  border: 2px solid #F4CE53;
  border-radius: 4px;
  appearance: none;
  cursor: pointer;
  position: relative;
}

.form-checkbox:checked {
  background: #F4CE53;
}

.form-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
}

.form-checkbox:disabled {
  background: #F5F5F5;
  border-color: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-checkbox:disabled:checked {
  background: #CCCCCC;
}

.checkbox-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  color: #7C7C7C;
  cursor: pointer;
}

.checkbox-label.disabled {
  color: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.6;
}

.disabled-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #999999;
  margin-left: 8px;
}

.modal-footer {
  padding: 15px 40px 20px 40px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-confirm {
  width: 100px;
  height: 42px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm:hover {
  background: #E6B800;
}

.btn-confirm:active {
  transform: translateY(1px);
}

.btn-cancel {
  width: 100px;
  height: 42px;
  background: #FFFFFF;
  border: 2px solid #DDDDDD;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #F8F8F8;
  border-color: #CCCCCC;
  color: #333333;
}

.btn-cancel:active {
  transform: translateY(1px);
}

.btn-create {
  width: 120px;
  height: 42px;
  background: #2A2828;
  border-radius: 8px;
  border: none;
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 16px;
  line-height: 19px;
  color: #F5F5F5;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-create:hover {
  background: #1a1818;
}

.btn-create:active {
  transform: translateY(1px);
}

/* 사용자 선택 버튼 스타일 */
.btn-select-user {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  height: 32px;
  padding: 0 12px;
  background: #F4CE53;
  border: none;
  border-radius: 6px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-select-user:hover {
  background: #E6B800;
}

/* 사용자 선택 모달 스타일 */
.user-select-modal {
  width: 500px;
  min-height: 400px;
  max-height: 80vh;
  background: #F5F5F5;
  border: 1px solid #000000;
  box-shadow: 4px 4px 32px rgba(0, 0, 0, 0.25), -4px -4px 32px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.search-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.search-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #7C7C7C;
}

.search-select {
  height: 40px;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  padding: 0 12px;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  background: #FFFFFF;
  cursor: pointer;
}

.search-select:focus {
  outline: none;
  border-color: #F4CE53;
}

/* 그룹 목록 스타일 */
.group-list {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  background: #FFFFFF;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid #F5F5F5;
  transition: background-color 0.2s ease;
}

.group-item:hover {
  background-color: #F8F8F8;
}

.group-item:last-child {
  border-bottom: none;
}

.group-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #1C0F0F;
  flex: 1;
}

.group-count {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #666666;
  margin-right: auto;
}

.btn-add-group {
  height: 24px;
  padding: 0 10px;
  background: #F4CE53;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 11px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-add-group:hover {
  background: #E6B800;
}

.no-groups {
  padding: 20px;
  text-align: center;
  color: #999999;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
}

.search-input {
  height: 48px;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  padding: 0 16px;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  flex: 1;
}

.search-input:focus {
  outline: none;
  border-color: #F4CE53;
}

.btn-search {
  height: 40px;
  padding: 0 12px;
  background: #F4CE53;
  border: none;
  border-radius: 6px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-left: 8px;
  min-width: 50px;
  flex-shrink: 0;
}

.btn-search:hover {
  background: #E6B800;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  background: #FFFFFF;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}

/* 이메일 검색 결과 섹션의 user-list */
.search-section .user-list {
  display: block;
  padding: 8px;
  gap: 0;
}

.user-item {
  padding: 6px 8px;
  cursor: pointer;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #FFFFFF;
  transition: all 0.2s ease;
  min-width: 100px;
  flex: 0 0 auto;
}

/* 이메일 검색 결과 전용 스타일 */
.search-result-item {
  width: 100%;
  padding: 3px 8px;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F5F5F5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
}

.search-result-info .user-name {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
}

.search-result-info .user-email {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  font-weight: 400;
  font-size: 10px;
  color: #666666;
}

.btn-add-user {
  height: 24px;
  padding: 0 8px;
  background: #F4CE53;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 11px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.btn-add-user:hover {
  background: #E6B800;
}

.user-item:hover {
  background-color: #F8F8F8;
  border-color: #F4CE53;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #1C0F0F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  color: #666666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-group {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #F4CE53;
  background: rgba(244, 206, 83, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

/* 섹션 제목 스타일 */
.section-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #1C0F0F;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #F4CE53;
}

/* 검색 결과 없음 메시지 */
.no-results {
  padding: 20px;
  text-align: center;
  color: #999999;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
}

/* 선택된 사용자 없음 메시지 */
.no-selection {
  padding: 20px;
  text-align: center;
  color: #999999;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  background: #F8F8F8;
  border: 1px dashed #DDDDDD;
  border-radius: 8px;
}

.selected-user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F8F8F8;
  border: 2px solid #F4CE53;
  border-radius: 8px;
}

.btn-remove-selection {
  height: 32px;
  padding: 0 12px;
  background: #FF6B6B;
  border: none;
  border-radius: 6px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #FFFFFF;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-remove-selection:hover {
  background: #FF5252;
}

/* 선택된 그룹 멤버들 스타일 */
.selected-group-members {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  background: #FFFFFF;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.selected-member-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: #F8F8F8;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  flex: 0 0 auto;
  min-width: 120px;
}

.selected-member-item:last-child {
  margin-bottom: 0;
}

.btn-remove-member {
  position: absolute;
  top: 2px;
  right: 2px;
  background: none;
  border: none;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #FF6B6B;
  cursor: pointer;
  padding: 0;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 1;
}

.btn-remove-member:hover {
  color: #FF5252;
}

.btn-clear-all {
  width: 100%;
  height: 28px;
  margin-top: 8px;
  background: #FF6B6B;
  border: none;
  border-radius: 4px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #FFFFFF;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex: 1 1 100%;
}

.btn-clear-all:hover {
  background: #FF5252;
}

/* 프로젝트 수정 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.edit-modal {
  width: 764px;
  max-height: 80vh;
  background: #F5F5F5;
  border: 1px solid #000000;
  box-shadow: 4px 4px 32px rgba(0, 0, 0, 0.25), -4px -4px 32px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(42, 40, 40, 0.1);
}

.modal-title {
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 800;
  font-size: 24px;
  line-height: 28px;
  color: #1C0F0F;
  margin: 0;
  text-align: center;
}

.modal-content {
  flex: 1;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  min-height: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #374151;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 48px;
  background: #FFFFFF;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  padding: 0 16px;
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #1C0F0F;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #F4CE53;
  box-shadow: 0 0 0 3px rgba(244, 206, 83, 0.1);
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  background: #FFFFFF;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  padding: 12px 16px;
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #1C0F0F;
  box-sizing: border-box;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #F4CE53;
  box-shadow: 0 0 0 3px rgba(244, 206, 83, 0.1);
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.form-select {
  width: 100%;
  height: 48px;
  background: #FFFFFF;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  padding: 0 16px;
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: #1C0F0F;
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #F4CE53;
  box-shadow: 0 0 0 3px rgba(244, 206, 83, 0.1);
}

.select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #6B7280;
  pointer-events: none;
}

.modal-footer {
  padding: 20px 30px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  border-top: 1px solid rgba(42, 40, 40, 0.1);
  background: #F5F5F5;
}

.btn {
  height: 44px;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 0 20px;
}

.btn-cancel {
  background: #F3F4F6;
  color: #374151;
  border: 1px solid #D1D5DB;
}

.btn-cancel:hover {
  background: #E5E7EB;
  transform: translateY(-1px);
}

.btn-primary {
  background: #F4CE53;
  color: #1C0F0F;
  border: 1px solid #E6B800;
}

.btn-primary:hover {
  background: #E6B800;
  transform: translateY(-1px);
}

/* 연필 아이콘 스타일 */
.edit-icon {
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-icon:hover {
  transform: scale(1.1);
}

.edit-icon:hover path {
  stroke: #FFDD44;
}

/* 날짜 범위 컨테이너 */
.date-range-container {
  display: flex;
  align-items: end;
  gap: 15px;
}

.date-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-label {
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}

.date-input {
  height: 48px;
  font-size: 16px;
  padding: 0 15px;
  width: 100%;
}

.date-separator {
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  color: #666666;
  margin-bottom: 5px;
}

/* 담당자 선택 컨테이너 */
.manager-select-container {
  display: flex;
  gap: 10px;
  align-items: end;
}

.manager-input {
  flex: 1;
}

.btn-select-manager {
  height: 48px;
  padding: 0 16px;
  background: #2A2828;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.btn-select-manager:hover {
  background: #1A1818;
}

/* 프로젝트 담당자 선택 모달 스타일 */
.manager-select-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease-out;
}

.manager-select-modal {
  width: 500px;
  max-height: 600px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.3s ease-out;
}

.manager-select-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 12px 12px 0 0;
}

.manager-select-modal .modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #E5E7EB;
}

.manager-select-modal .modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.search-section {
  margin-bottom: 20px;
}

.search-input-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  color: #1C0F0F;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #F4CE53;
  box-shadow: 0 0 0 3px rgba(244, 206, 83, 0.1);
}

.search-btn {
  height: 44px;
  min-width: 80px;
  padding: 0 20px;
  background: #F4CE53;
  color: #1C0F0F;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.search-btn:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
}

.search-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #1C0F0F;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.manager-list {
  max-height: 300px;
  overflow-y: auto;
}

.no-managers {
  text-align: center;
  padding: 40px 20px;
  color: #6B7280;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
}

.manager-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #FFFFFF;
}

.manager-item:hover {
  border-color: #F4CE53;
  background: #FFFBEB;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 206, 83, 0.15);
}

.manager-item:last-child {
  margin-bottom: 0;
}

.manager-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.manager-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  border-radius: 50%;
  flex-shrink: 0;
}

.manager-details {
  flex: 1;
  min-width: 0;
}

.manager-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.manager-email {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-indicator {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.manager-select-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 0 0 12px 12px;
}

.cancel-btn {
  height: 44px;
  padding: 0 20px;
  background: #F3F4F6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #E5E7EB;
  transform: translateY(-1px);
}

.confirm-btn {
  height: 44px;
  padding: 0 20px;
  background: #F4CE53;
  color: #1C0F0F;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 프로젝트 삭제 모달 스타일 */
.delete-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.delete-modal {
  background: #F5F5F5;
  border: 1px solid #000000;
  box-shadow: 4px 4px 32px rgba(0, 0, 0, 0.25), -4px -4px 32px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  width: 764px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

.delete-modal .modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(42, 40, 40, 0.1);
  background: #F5F5F5;
  flex-shrink: 0;
}

.delete-modal .modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  margin: 0;
  text-align: center;
  color: #1C0F0F;
}

.delete-modal .modal-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 30px;
}

.delete-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.project-info-section {
  text-align: center;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);
}

.project-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 24px;
  line-height: 29px;
  margin: 0 0 8px 0;
  color: #1C0F0F;
}


.warning-section {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #FFF5F5;
  border: 1px solid #FECACA;
  border-radius: 12px;
}

.warning-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-text {
  flex: 1;
}

.warning-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  margin: 0 0 8px 0;
  color: #DC2626;
}

.warning-description {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  margin: 0;
  color: #7F1D1D;
}

.delete-modal .modal-footer {
  padding: 20px 30px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  border-top: 1px solid rgba(42, 40, 40, 0.1);
  background: #F5F5F5;
}

.btn-delete {
  background: #FF3E41;
  color: #F5F5F5;
  border: none;
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
  line-height: 20px;
  min-width: 120px;
  padding: 0 20px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}

.btn-delete:hover {
  background: #DC2626;
  transform: translateY(-1px);
  box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.3);
}

.btn-delete:active {
  transform: translateY(0);
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

</style>
