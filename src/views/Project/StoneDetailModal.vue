<template>
  <div v-if="isVisible" class="stone-detail-modal" :class="{ 'expanded': isExpandedToCenter }" @click="closeModal" @mounted="console.log('스톤 상세 모달 표시됨')">
    <div class="modal-content" :class="{ 'expanded': isExpandedToCenter }" @click.stop="handleModalContentClick">
      <!-- 모달 헤더 -->
      <div class="modal-header" @mounted="console.log('모달 헤더 렌더링됨')">
        <div class="header-left">
          <button class="close-modal-btn" @click.stop="closeModal" title="모달 닫기">
            <svg v-if="!isExpandedToCenter" width="20" height="20" viewBox="0 0 24 24" fill="#666666" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.08,4.08L20,12L12.08,19.92L10.67,18.5L16.17,13H2V11H16.17L10.67,5.5L12.08,4.08M20,12V22H22V2H20V12Z" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="#666666" xmlns="http://www.w3.org/2000/svg">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
          <button class="expand-center-btn" @click.stop="toggleExpandToCenter" :title="isExpandedToCenter ? '사이드 축소' : '중앙 확장'">
            <svg v-if="!isExpandedToCenter" width="20" height="20" viewBox="0 0 24 24" fill="#666666" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="#666666" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z" />
            </svg>
          </button>
        </div>
        <div class="header-right">
          <button v-if="!currentStoneData?.isProject" class="edit-header-btn" @click.stop="editStone" title="스톤 수정">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 1.5L12.5 3.5L11 5L9 3L10.5 1.5Z" stroke="#666666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 3L11 5L4.5 11.5L1 13L2.5 9.5L9 3Z" stroke="#666666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="trash-btn" @click.stop="deleteStone" title="삭제">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#666666" xmlns="http://www.w3.org/2000/svg">
              <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z" />
            </svg>
          </button>
        </div>
      </div>

        <!-- 모달 본문 -->
        <div class="modal-body">
          <!-- 로딩 상태 -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">스톤 정보를 불러오는 중...</p>
          </div>
          
          <!-- 스톤 정보 -->
          <div v-else>
        <!-- 스톤/프로젝트 제목 -->
        <div class="stone-title-container">
          <div class="stone-title-section">
            <div class="stone-title">{{ currentStoneData?.isProject ? (currentStoneData?.projectName || currentStoneData?.stoneName) : currentStoneData?.stoneName }}</div>
          </div>
          <div class="action-buttons">
            <button 
              v-if="currentStoneData?.stoneStatus === 'PROGRESS'" 
              class="complete-stone-btn" 
              @click="completeStone" 
              title="스톤 완료"
            >
              완료 처리
            </button>
          </div>
        </div>
        
        <!-- 프로젝트 전용 정보 -->
        <div v-if="currentStoneData?.isProject" class="project-info">
          <!-- 디버깅용 콘솔 로그 -->
          {{ console.log('모달에서 받은 프로젝트 데이터:', stoneData) }}
          <!-- 프로젝트 목표 -->
          <div class="info-section">
            <div class="info-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>목표</span>
            </div>
            <div class="info-value">{{ currentStoneData?.projectObjective || '목표 미설정' }}</div>
          </div>
          
          <!-- 프로젝트 설명 -->
          <div class="info-section">
            <div class="info-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#F4CE53" xmlns="http://www.w3.org/2000/svg">
                <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" />
              </svg>
              <span>설명</span>
            </div>
            <div class="info-value">{{ currentStoneData?.projectDescription || '설명 없음' }}</div>
          </div>
          
          <!-- 스톤 개수 -->
          <div class="info-section">
            <div class="info-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 12H16M12 8V16" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>스톤 개수</span>
            </div>
            <div class="info-value">{{ currentStoneData?.stoneCount || 0 }}개</div>
          </div>
        </div>
        
        <!-- 기간 정보 -->
        <div class="info-section">
          <div class="info-label">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#F4CE53" xmlns="http://www.w3.org/2000/svg">
              <path d="M9,10V12H7V10H9M13,10V12H11V10H13M17,10V12H15V10H17M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M9,14V16H7V14H9M13,14V16H11V14H13M17,14V16H15V14H17Z" />
            </svg>
            <span>기간</span>
          </div>
          <div class="info-value">{{ formatDateRange(currentStoneData?.startTime, currentStoneData?.endTime) }}</div>
        </div>

        <!-- 진행도 정보 -->
        <div class="info-section">
          <div class="info-label">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="#F4CE53" xmlns="http://www.w3.org/2000/svg">
              <path d="M16,2A14,14,0,1,0,30,16,14.0158,14.0158,0,0,0,16,2Zm0,26A12,12,0,0,1,16,4V16l8.4812,8.4814A11.9625,11.9625,0,0,1,16,28Z"/>
            </svg>
            <span>진행도</span>
          </div>
          <div class="info-value-with-status">
            <span class="progress-percent">{{ currentStoneData?.milestone || 0 }}%</span>
            <div class="stone-status" :class="getStoneStatusClass(currentStoneData?.stoneStatus)">
              {{ getStoneStatusText(currentStoneData?.stoneStatus) }}
            </div>
          </div>
        </div>

        <!-- 스톤 정보 (일반 스톤인 경우에만 표시) -->
        <div v-if="!currentStoneData?.isProject">
          <!-- 담당자 정보 -->
          <div class="info-section">
            <div class="info-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#F4CE53" xmlns="http://www.w3.org/2000/svg">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
              </svg>
              <span>담당자</span>
            </div>
            <div class="info-value-with-action">
              <span class="info-value" :class="{ 'empty-value': !currentStoneData?.manager || currentStoneData?.manager === '김올빗' }">{{ currentStoneData?.manager || '김올빗' }}</span>
              <button v-if="!isPersonalWorkspace" class="edit-user-btn" @click="editManager" title="담당자 수정">
                <div class="icon-with-plus">
                  <!-- 담당자 아이콘 -->
                  <svg width="16" height="16" viewBox="0 0 24 24" :fill="currentStoneData?.manager && currentStoneData?.manager !== '김올빗' ? '#F4CE53' : '#666666'" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                  </svg>
                  <!-- + 기호 (오른쪽에 별도 위치) -->
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" :stroke="currentStoneData?.manager && currentStoneData?.manager !== '김올빗' ? '#F4CE53' : '#666666'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- 참여자 정보 -->
          <div class="info-section">
            <div class="info-label" :class="{ 'empty-label': !currentStoneData?.participants || currentStoneData?.participants === '비어 있음' }">
              <svg width="24" height="24" viewBox="0 0 24 24" :fill="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#999999'" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5,12A2.5,2.5 0 0,0 19,9.5A2.5,2.5 0 0,0 16.5,7A2.5,2.5 0 0,0 14,9.5A2.5,2.5 0 0,0 16.5,12M9,11A3,3 0 0,0 12,8A3,3 0 0,0 9,5A3,3 0 0,0 6,8A3,3 0 0,0 9,11M16.5,14C14.67,14 11,14.92 11,16.75V19H22V16.75C22,14.92 18.33,14 16.5,14M9,13C6.67,13 2,14.17 2,16.5V19H9V16.75C9,15.9 9.33,14.41 11.37,13.28C10.5,13.1 9.66,13 9,13Z" />
              </svg>
              <span>참여자</span>
            </div>
            <div class="info-value-with-action">
              <span class="info-value" :class="{ 'empty-value': !currentStoneData?.participants || currentStoneData?.participants === '비어 있음' }">{{ currentStoneData?.participants || '비어 있음' }}</span>
              <button v-if="!isPersonalWorkspace" class="edit-user-btn" @click="editParticipants" title="참여자 수정">
                <div class="icon-with-plus">
                  <!-- 참여자 아이콘 -->
                  <svg width="16" height="16" viewBox="0 0 24 24" :fill="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#666666'" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.5,12A2.5,2.5 0 0,0 19,9.5A2.5,2.5 0 0,0 16.5,7A2.5,2.5 0 0,0 14,9.5A2.5,2.5 0 0,0 16.5,12M9,11A3,3 0 0,0 12,8A3,3 0 0,0 9,5A3,3 0 0,0 6,8A3,3 0 0,0 9,11M16.5,14C14.67,14 11,14.92 11,16.75V19H22V16.75C22,14.92 18.33,14 16.5,14M9,13C6.67,13 2,14.17 2,16.5V19H9V16.75C9,15.9 9.33,14.41 11.37,13.28C10.5,13.1 9.66,13 9,13Z" />
                  </svg>
                  <!-- + 기호 (오른쪽에 별도 위치) -->
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#666666'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- 스톤 설명 -->
          <div class="info-section">
            <div class="info-label" :class="{ 'empty-label': !currentStoneData?.stoneDescribe }">
              <svg width="24" height="24" viewBox="0 0 24 24" :fill="currentStoneData?.stoneDescribe ? '#F4CE53' : '#999999'" xmlns="http://www.w3.org/2000/svg">
                <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" />
              </svg>
              <span>설명</span>
            </div>
            <div class="info-value">
              <span :class="{ 'empty-value': !currentStoneData?.stoneDescribe }">{{ currentStoneData?.stoneDescribe || '설명 없음' }}</span>
            </div>
          </div>

          <!-- 채팅방 -->
          <div class="info-section">
            <div class="info-label" :class="{ 'empty-label': !currentStoneData?.chatCreation }">
              <svg width="24" height="24" viewBox="0 0 24 24" :fill="currentStoneData?.chatCreation ? '#F4CE53' : '#999999'" xmlns="http://www.w3.org/2000/svg">
                <path d="M12,3C17.5,3 22,6.58 22,11C22,15.42 17.5,19 12,19C10.76,19 9.57,18.82 8.47,18.5C5.55,21 2,21 2,21C4.33,18.67 4.7,17.1 4.75,16.5C3.05,15.07 2,13.13 2,11C2,6.58 6.5,3 12,3M17,12V10H15V12H17M13,12V10H11V12H13M9,12V10H7V12H9Z" />
              </svg>
              <span>채팅방</span>
            </div>
            <div class="info-value">
              <div class="chat-link" :class="{ 'disabled': !currentStoneData?.chatCreation }" @click="goToChatRoom">
                <span :class="{ 'empty-value': !currentStoneData?.chatCreation }">{{ currentStoneData?.chatCreation ? '바로가기' : '채팅방 없음' }}</span>
                <svg v-if="currentStoneData?.chatCreation" width="18" height="18" viewBox="0 0 24 24" fill="#F6D365" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        <!-- 태스크 섹션 (일반 스톤인 경우에만 표시) -->
        <div v-if="!currentStoneData?.isProject">
          <!-- 구분선 -->
          <div class="divider"></div>

          <!-- 태스크 섹션 -->
          <div class="tasks-section">
            <div class="section-title">
              <div class="section-title-left">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 6L21 6.00072M11 12L21 12.0007M11 18L21 18.0007M3 11.9444L4.53846 13.5L8 10M3 5.94444L4.53846 7.5L8 4M4.5 18H4.51M5 18C5 18.2761 4.77614 18.5 4.5 18.5C4.22386 18.5 4 18.2761 4 18C4 17.7239 4.22386 17.5 4.5 17.5C4.77614 17.5 5 17.7239 5 18Z" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>태스크</span>
              </div>
              <div class="task-sort-dropdown" ref="sortDropdown">
                <button class="sort-btn" @click.stop="toggleSortDropdown">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H21M7 12H17M11 18H13" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <div v-if="showSortDropdown" class="sort-dropdown-menu" @click.stop>
                  <div class="sort-option" @click="setSortOption('incomplete-first')">
                    <span>미완료된 태스크 순</span>
                    <svg v-if="taskSortOption === 'incomplete-first'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" fill="#F4CE53" stroke="#F4CE53" stroke-width="1"/>
                    </svg>
                  </div>
                  <div class="sort-option" @click="setSortOption('completed-first')">
                    <span>완료된 태스크 순</span>
                    <svg v-if="taskSortOption === 'completed-first'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" fill="#F4CE53" stroke="#F4CE53" stroke-width="1"/>
                    </svg>
                  </div>
                  <div class="sort-option" @click="setSortOption('dday-asc')">
                    <span>D-day 임박 순</span>
                    <svg v-if="taskSortOption === 'dday-asc'" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" fill="#F4CE53" stroke="#F4CE53" stroke-width="1"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div class="task-list">
              <!-- 태스크 로딩 상태 -->
              <div v-if="isLoadingTasks" class="task-loading">
                <div class="loading-spinner"></div>
                <p class="loading-text">태스크 목록을 불러오는 중...</p>
              </div>
              
              <!-- 태스크 목록 -->
              <div v-else-if="taskList.length > 0">
                <div v-for="task in sortedTaskList" :key="task.id" class="task-item">
                <div class="task-checkbox" :class="{ 'completed': task.completed }" @click="toggleTaskComplete(task)">
                  <svg v-if="task.completed" width="28" height="28" viewBox="0 0 24 24" fill="#F4CE53" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,5V19H5V5H19M10,17L6,13L7.41,11.58L10,14.17L16.59,7.58L18,9" />
                  </svg>
                  <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="#F4CE53" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z" />
                  </svg>
                </div>
                <div class="task-content">
                  <div class="task-name" :class="{ 'completed': task.completed }">{{ task.name }}</div>
                  <div class="task-period">{{ formatDateRange(task.startTime, task.endTime) }}</div>
                </div>
                  <div class="task-assignee">
                    <div 
                      class="assignee-info" 
                      :class="{ 'disabled': isPersonalWorkspace }"
                      @click="isPersonalWorkspace ? null : openTaskAssigneeEditModal(task)" 
                      title="담당자 변경"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#F4CE53" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                      </svg>
                      <span class="assignee-name">{{ task.assigneeName || '담당자 없음' }}</span>
                    </div>
                    <div class="assignee-icons">
                      <div class="icon-button" @click="deleteTask(task)" title="태스크 삭제">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="trash-icon">
                          <path d="M3 6H5H21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M10 11V17" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M14 11V17" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 태스크가 없는 경우 -->
              <div v-else class="no-tasks">
                <p>등록된 태스크가 없습니다.</p>
              </div>
            </div>
            
            <!-- 태스크 추가 버튼 -->
            <div class="add-task-section">
              <button 
                class="add-task-btn" 
                :class="{ 'disabled': isStoneCompleted }"
                :disabled="isStoneCompleted"
                @click="addTask"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ isStoneCompleted ? '완료된 스톤' : '태스크 추가' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 문서함 섹션 (일반 스톤인 경우에만 표시) -->
        <div v-if="!currentStoneData?.isProject">
          <!-- 구분선 -->
          <div class="divider"></div>

          <!-- 문서함 섹션 -->
          <div class="documents-section">
            <div class="section-title">
              <div class="section-title-left">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22,4H14L12,2H6A2,2 0 0,0 4,4V16A2,2 0 0,0 6,18H22A2,2 0 0,0 24,16V6A2,2 0 0,0 22,4M2,6H0V11H0V20A2,2 0 0,0 2,22H20V20H2V6Z" fill="#F4CE53"/>
                </svg>
                <span>문서함</span>
              </div>
            </div>
            
            <!-- 문서함 컨테이너 -->
            <div class="stone-drive-wrapper">
              <div class="stone-drive-container">
                <DriveMain v-if="currentStoneData?.stoneId || currentStoneData?.id" :stone-id="currentStoneData?.stoneId || currentStoneData?.id" :disable-routing="true" />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- 담당자 선택 모달 -->
    <div v-if="showManagerSelectModal" class="manager-select-overlay" @click="closeManagerSelectModal">
      <div class="manager-select-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">담당자 선택</h2>
          <button class="close-btn" @click="closeManagerSelectModal">
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
                v-model="managerSearchKeyword"
                placeholder="담당자 검색..."
                @keyup.enter="filterManagers"
              />
              <button class="search-btn" @click="filterManagers" :disabled="isSearching">
                <span v-if="!isSearching">검색</span>
                <div v-else class="search-spinner"></div>
              </button>
            </div>
          </div>
          
          <div class="manager-list">
            <div v-if="filteredManagers.length === 0" class="no-managers">
              <p>선택 가능한 담당자가 없습니다.</p>
            </div>
            <div 
              v-else
              v-for="manager in filteredManagers" 
              :key="manager.id" 
              class="manager-item"
              @click="selectManager(manager)"
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
                <svg v-if="selectedManagerId === manager.id" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="#F4CE53" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeManagerSelectModal">취소</button>
          <button class="confirm-btn" @click="confirmManagerChange" :disabled="!selectedManagerId || isUpdating">
            <span v-if="isUpdating">변경 중...</span>
            <span v-else>담당자 변경</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 스톤 수정 모달 -->
    <div v-if="showEditModal" class="edit-stone-overlay" @click="closeEditModal">
      <div class="edit-stone-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">스톤 수정</h2>
          <button class="close-btn" @click="closeEditModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">스톤명</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="editForm.stoneName"
              placeholder="스톤명을 입력하세요"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">시작일</label>
            <input 
              type="date" 
              class="form-input" 
              v-model="editForm.startDate"
              :min="getProjectStartDate()"
              :max="getProjectEndDate()"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">종료일</label>
            <input 
              type="date" 
              class="form-input" 
              v-model="editForm.endDate"
              :min="editForm.startDate || getProjectStartDate()"
              :max="getProjectEndDate()"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">스톤 설명</label>
            <textarea 
              class="form-textarea" 
              v-model="editForm.stoneDescribe"
              placeholder="스톤 설명을 입력하세요"
              rows="4"
            ></textarea>
          </div>
          
          <div class="form-group form-group-inline">
            <label class="form-label form-label-inline">
              채팅방 생성
              <span v-if="isChatCreationDisabled" class="disabled-text">(이미 채팅방이 생성되어 있습니다)</span>
              <div class="checkbox-wrapper">
                <input 
                  type="checkbox" 
                  class="form-checkbox" 
                  v-model="editForm.createChat"
                  id="editCreateChat"
                  :disabled="isChatCreationDisabled"
                />
                <label for="editCreateChat" class="checkbox-label" :class="{ 'disabled': isChatCreationDisabled }"></label>
              </div>
            </label>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditModal">취소</button>
          <button class="btn-primary" @click="saveStoneEdit" :disabled="isUpdating">
            <span v-if="isUpdating">수정 중...</span>
            <span v-else>스톤 수정</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 태스크 추가 모달 -->
    <div v-if="showTaskAddModal" class="task-add-overlay" @click="closeTaskAddModal">
      <div class="task-add-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">태스크 추가</h2>
          <button class="close-btn" @click="closeTaskAddModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">제목</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="taskForm.title"
              placeholder="태스크 제목을 입력하세요"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">기간</label>
            <div class="date-range-container">
              <input 
                type="date" 
                class="form-input date-input" 
                v-model="taskForm.startDate"
              />
              <span class="date-separator">~</span>
              <input 
                type="date" 
                class="form-input date-input" 
                v-model="taskForm.endDate"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">담당자</label>
            <div class="assignee-section">
              <div 
                class="assignee-display" 
                :class="{ 'disabled': isPersonalWorkspace }"
                @click="handleAssigneeClick"
              >
                <div class="assignee-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="assignee-name" :class="{ 'empty': !taskForm.assigneeName }">
                    {{ taskForm.assigneeName || '스톤 참여자 목록에서 담당자를 선택하세요' }}
                  </span>
                </div>
                <svg v-if="!isPersonalWorkspace" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeTaskAddModal">취소</button>
          <button class="btn-primary" @click="createTask" :disabled="isCreatingTask">
            <span v-if="isCreatingTask">생성 중...</span>
            <span v-else>생성</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 태스크 담당자 선택 모달 -->
    <div v-if="showTaskAssigneeModal" class="task-assignee-overlay" @click="closeTaskAssigneeModal">
      <div class="task-assignee-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">태스크 담당자 선택</h2>
          <button class="close-btn" @click="closeTaskAssigneeModal">
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
                v-model="taskAssigneeSearchKeyword"
                placeholder="담당자 검색..."
                @keyup.enter="filterTaskAssignees"
              />
              <button class="search-btn" @click="filterTaskAssignees" :disabled="isTaskAssigneeSearching">
                <span v-if="!isTaskAssigneeSearching">검색</span>
                <div v-else class="search-spinner"></div>
              </button>
            </div>
          </div>
          
          <div class="assignee-list">
            <div v-if="filteredTaskAssignees.length === 0" class="no-assignees">
              <p>선택 가능한 담당자가 없습니다.</p>
            </div>
            <div 
              v-else
              v-for="assignee in filteredTaskAssignees" 
              :key="assignee.id" 
              class="assignee-item"
              @click="selectTaskAssignee(assignee)"
            >
              <div class="assignee-info">
                <div class="assignee-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="assignee-details">
                  <div class="assignee-name">{{ assignee.name }}</div>
                  <div class="assignee-email">{{ assignee.email }}</div>
                </div>
              </div>
              <div class="select-indicator">
                <svg v-if="selectedTaskAssigneeId === assignee.id" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="#F4CE53" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeTaskAssigneeModal">취소</button>
          <button class="confirm-btn" @click="confirmTaskAssigneeChange" :disabled="!selectedTaskAssigneeId || isUpdating">
            <span v-if="isUpdating">변경 중...</span>
            <span v-else>담당자 선택</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteConfirm" class="delete-confirm-overlay" @click="cancelDelete">
      <div class="delete-confirm-modal" @click.stop>
        <h2 class="delete-modal-title">스톤 삭제</h2>
        <div class="delete-modal-content">
          <div class="delete-modal-body">
            <div class="stone-name-container">
              <strong class="stone-name">{{ currentStoneData?.stoneName }}</strong>
            </div>
            <p class="delete-modal-message">스톤을 삭제하시겠습니까?</p>
          </div>
          <div class="delete-modal-actions">
            <button class="cancel-btn" @click="cancelDelete" :disabled="isDeleting">취소</button>
            <button class="delete-btn" @click="confirmDelete" :disabled="isDeleting">
              <span v-if="isDeleting">삭제 중...</span>
              <span v-else>스톤 삭제</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 태스크 담당자 변경 모달 -->
    <div v-if="showTaskAssigneeEditModal" class="task-assignee-edit-overlay" @click="closeTaskAssigneeEditModal">
      <div class="task-assignee-edit-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">태스크 담당자 변경</h2>
          <button class="close-btn" @click="closeTaskAssigneeEditModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="task-info">
            <p class="task-name-label">태스크: <strong>{{ editingTaskName }}</strong></p>
          </div>
          
          <div class="search-section">
            <div class="search-input-container">
              <input 
                type="text" 
                class="search-input" 
                v-model="taskAssigneeEditSearchKeyword"
                placeholder="담당자 검색..."
                @keyup.enter="filterTaskAssigneeEdits"
              />
              <button class="search-btn" @click="filterTaskAssigneeEdits" :disabled="isTaskAssigneeEditSearching">
                <span v-if="!isTaskAssigneeEditSearching">검색</span>
                <div v-else class="search-spinner"></div>
              </button>
            </div>
          </div>
          
          <div class="assignee-list">
            <div v-if="filteredTaskAssigneeEdits.length === 0" class="no-assignees">
              <p>선택 가능한 담당자가 없습니다.</p>
            </div>
            <div 
              v-else
              v-for="assignee in filteredTaskAssigneeEdits" 
              :key="assignee.id" 
              class="assignee-item"
              @click="selectTaskAssigneeEdit(assignee)"
            >
              <div class="assignee-info">
                <div class="assignee-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="assignee-details">
                  <div class="assignee-name">{{ assignee.name }}</div>
                  <div class="assignee-email">{{ assignee.email }}</div>
                </div>
              </div>
              <div class="select-indicator">
                <svg v-if="selectedTaskAssigneeEditId === assignee.id" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10" stroke="#F4CE53" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeTaskAssigneeEditModal">취소</button>
          <button class="confirm-btn" @click="confirmTaskAssigneeEdit" :disabled="!selectedTaskAssigneeEditId || isUpdating">
            <span v-if="isUpdating">변경 중...</span>
            <span v-else>담당자 변경</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 태스크 삭제 확인 모달 -->
    <TaskDeleteConfirmModal
      :show="showDeleteConfirmModal"
      :task-name="taskToDelete?.name || ''"
      :loading="deleteLoading"
      @close="closeDeleteConfirmModal"
      @confirm="confirmDeleteTask"
    />
    
    <!-- 태스크 완료 확인 모달 -->
    <TaskCompleteConfirmModal
      :show="showCompleteConfirmModal"
      :task-name="taskToComplete?.name || ''"
      :loading="completeLoading"
      @close="closeCompleteConfirmModal"
      @confirm="confirmCompleteTask"
    />
    
    <!-- 태스크 취소 확인 모달 -->
    <TaskCancelConfirmModal
      :show="showCancelConfirmModal"
      :task-name="taskToCancel?.name || ''"
      :loading="cancelLoading"
      @close="closeCancelConfirmModal"
      @confirm="confirmCancelTask"
    />
    
    <!-- 스톤 완료 확인 모달 -->
    <StoneCompleteConfirmModal
      :show="showStoneCompleteConfirmModal"
      :stone-name="stoneData?.stoneName || ''"
      :loading="stoneCompleteLoading"
      @close="closeStoneCompleteConfirmModal"
      @confirm="confirmStoneComplete"
    />
  </div>
</template>

<script>
import { deleteStone, modifyStoneManager, searchWorkspaceParticipants, modifyStone, getTaskList, createTask, getStoneParticipantList, modifyTask, deleteTask, completeTask, cancelTask, completeStone } from '@/services/stoneService.js';
import axios from 'axios';
import { showSnackbar } from '@/services/snackbar.js';
import { useWorkspaceStore } from '@/stores/workspace';
import TaskDeleteConfirmModal from '@/components/modal/TaskDeleteConfirmModal.vue';
import TaskCompleteConfirmModal from '@/components/modal/TaskCompleteConfirmModal.vue';
import TaskCancelConfirmModal from '@/components/modal/TaskCancelConfirmModal.vue';
import StoneCompleteConfirmModal from '@/components/modal/StoneCompleteConfirmModal.vue';
import DriveMain from '@/views/Drive/DriveMain.vue';

export default {
  name: 'StoneDetailModal',
  components: {
    TaskDeleteConfirmModal,
    TaskCompleteConfirmModal,
    TaskCancelConfirmModal,
    StoneCompleteConfirmModal,
    DriveMain
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    // isLoading: {
    //   type: Boolean,
    //   default: false
    // },
    stoneId: {
      type: [String, Number],
      default: null
    },
    stoneData: {
      type: Object,
      default: null
    },
    workspaceId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isLoading: false,
      isCollapsed: false,
      isExpandedToCenter: false,
      showDeleteConfirm: false,
      isDeleting: false,
      showManagerSelectModal: false,
      managerSearchKeyword: '',
      availableManagers: [],
      filteredManagers: [],
      selectedManagerId: null,
      isUpdating: false,
      isSearching: false,
      showEditModal: false,
      editForm: {
        stoneName: '',
        startDate: '',
        endDate: '',
        createChat: false,
        stoneDescribe: '' // 스톤 설명 (nullable)
      },
      showTaskAddModal: false,
      isCreatingTask: false,
      taskForm: {
        title: '',
        startDate: '',
        endDate: '',
        assigneeId: null,
        assigneeUserId: null,
        assigneeName: ''
      },
      showTaskAssigneeModal: false,
      taskAssigneeSearchKeyword: '',
      availableTaskAssignees: [],
      filteredTaskAssignees: [],
      selectedTaskAssigneeId: null,
      isTaskAssigneeSearching: false,
      taskList: [],
      isLoadingTasks: false,
      showSortDropdown: false,
      taskSortOption: 'incomplete-first',
      showTaskAssigneeEditModal: false,
      editingTaskId: null,
      editingTaskName: '',
      taskAssigneeEditSearchKeyword: '',
      availableTaskAssigneeEdits: [],
      filteredTaskAssigneeEdits: [],
      selectedTaskAssigneeEditId: null,
      isTaskAssigneeEditSearching: false,
      showDeleteConfirmModal: false,
      taskToDelete: null,
      deleteLoading: false,
      showCompleteConfirmModal: false,
      taskToComplete: null,
      completeLoading: false,
      showCancelConfirmModal: false,
      taskToCancel: null,
      cancelLoading: false,
      showStoneCompleteConfirmModal: false,
      stoneCompleteLoading: false,
      loadedStoneData: null,
      projectDetail: null // 프로젝트 상세 정보 (기간 제한용)
    }
  },
  computed: {
    workspaceStore() {
      return useWorkspaceStore();
    },
    isPersonalWorkspace() {
      return this.workspaceStore.isPersonalWorkspace;
    },
    // 현재 사용할 스톤 데이터 (stoneData가 있으면 사용, 없으면 stoneId로 로드)
    currentStoneData() {
      const data = this.stoneData || this.loadedStoneData;
      return data;
    },
    
    // 채팅방 생성 체크박스 비활성화 여부
    isChatCreationDisabled() {
      // 스톤에 이미 채팅방이 생성되어 있으면 비활성화
      return this.currentStoneData?.chatCreation === true;
    },
    
    // 스톤이 완료되었는지 확인
    isStoneCompleted() {
      // 실제 완료 상태만 체크 (마일스톤 100%는 완료 상태가 아님)
      return this.currentStoneData?.stoneStatus === 'COMPLETED';
    },
    
    // 정렬된 태스크 리스트
    sortedTaskList() {
      if (!this.taskList || this.taskList.length === 0) return [];
      
      const tasks = [...this.taskList];
      
      switch (this.taskSortOption) {
        case 'completed-first':
          // 완료된 것 먼저
          return tasks.sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? -1 : 1;
          });
          
        case 'incomplete-first':
          // 미완료 먼저
          return tasks.sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
          });
          
        case 'dday-asc':
          // D-day 임박 순 (종료일이 가까운 순)
          return tasks.sort((a, b) => {
            const dateA = new Date(a.endTime);
            const dateB = new Date(b.endTime);
            return dateA - dateB;
          });
          
        default:
          return tasks;
      }
    }
  },
  methods: {
    // stoneId로 스톤 데이터 로드
    async loadStoneData(stoneId) {
      console.log('🚀 [프로젝트 캘린더] loadStoneData 메서드 호출됨');
      console.log('   - 입력된 stoneId:', stoneId);
      console.log('   - 현재 isLoading:', this.isLoading);
      
      try {
        this.isLoading = true;
        console.log('   - isLoading을 true로 설정');
        console.log('   - API 호출 시작: /workspace-service/stone/' + stoneId);
        
        // 스톤 상세 정보 조회 API 호출
        // const response = await fetch(`/api/stone/${stoneId}`, {
        //   method: 'GET',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        //   }
        // });
        const response = await fetch(`/workspace-service/stone/${stoneId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('스톤 데이터를 불러올 수 없습니다.');
        }
        
        // const stoneData = await response.json();
        // this.loadedStoneData = stoneData;

        // Postman 결과 구조와 동일하게 result로 래핑되어 있음
        const json = await response.json();
        this.loadedStoneData = json.result;

        // 📊 프로젝트 캘린더에서 모달 열 때 데이터 로그 출력
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📅 [프로젝트 캘린더] 스톤 상세 모달 데이터 로드');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 전체 API 응답:', json);
        console.log('📦 로드된 스톤 데이터:', this.loadedStoneData);
        
        // 진행률 정보
        const milestone = this.loadedStoneData?.milestone || this.loadedStoneData?.projectMilestone || 0;
        console.log('📈 진행률 (milestone):', milestone, '%');
        
        // 담당자 정보
        const manager = this.loadedStoneData?.stoneManagerName || this.loadedStoneData?.manager || '담당자 없음';
        console.log('👤 담당자 (manager):', manager);
        
        // 참여자 목록
        const participants = this.loadedStoneData?.stoneParticipantDtoList || [];
        console.log('👥 참여자 목록 (stoneParticipantDtoList):', participants);
        console.log('   - 참여자 수:', participants.length);
        if (participants.length > 0) {
          participants.forEach((p, index) => {
            console.log(`   - 참여자 ${index + 1}:`, {
              userId: p.userId,
              participantName: p.participantName,
              userEmail: p.userEmail
            });
          });
        } else {
          console.log('   - 참여자가 없습니다.');
        }
        
        // 스톤 상태
        console.log('📊 스톤 상태 (stoneStatus):', this.loadedStoneData?.stoneStatus);
        
        // 채팅방 생성 여부
        console.log('💬 채팅방 생성 (chatCreation):', this.loadedStoneData?.chatCreation);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // taskList도 세팅
        if (json.result?.taskResDtoList?.length) {
          this.taskList = json.result.taskResDtoList.map(t => ({
            id: t.taskId,
            name: t.taskName,
            completed: t.isDone,
            startTime: t.startTime,
            endTime: t.endTime,
            assigneeName: t.taskManagerName,
          }));
        }
        
      } catch (error) {
        console.error('스톤 데이터 로드 실패:', error);
        showSnackbar(error.message || '스톤 데이터를 불러올 수 없습니다.', { color: 'error' });
        this.$emit('close');
      } finally {
        this.isLoading = false;
      }
    },
    
    closeModal() {
      this.$emit('close')
    },
    goToChatRoom() {
      if (!this.currentStoneData?.chatCreation) {
        return;
      }
      // 스톤메신저로 이동
      this.$router.push('/chat/main');
      // 모달 닫기
      this.$emit('close');
    },
    toggleSortDropdown() {
      this.showSortDropdown = !this.showSortDropdown;
    },
    setSortOption(option) {
      this.taskSortOption = option;
      this.showSortDropdown = false;
    },
    handleModalContentClick(event) {
      // 모달 콘텐츠 내부 클릭 시 정렬 드롭다운 외부 클릭 체크
      if (this.showSortDropdown && this.$refs.sortDropdown && !this.$refs.sortDropdown.contains(event.target)) {
        this.showSortDropdown = false;
      }
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed
    },
    toggleExpand() {
      this.$emit('expand')
    },
    toggleExpandToCenter() {
      this.isExpandedToCenter = !this.isExpandedToCenter
    },
    editStone() {
      console.log('수정 버튼 클릭됨!', this.stoneData)
      this.openEditModal()
    },
    
    // 스톤 완료 처리 (확인 모달 열기)
    completeStone() {
      // 태스크 완료 상태 확인
      const incompleteTasks = this.taskList.filter(task => !task.completed);
      if (incompleteTasks.length > 0) {
        const taskNames = incompleteTasks.map(task => task.name).join(', ');
        showSnackbar(`모든 태스크가 완료되어야 스톤을 완료할 수 있습니다. 미완료 태스크: ${taskNames}`, { color: 'warning' });
        return;
      }
      
      // 스톤 완료 확인 모달 열기
      this.showStoneCompleteConfirmModal = true;
    },
    
    // 스톤 완료 확인 처리
    async confirmStoneComplete() {
      try {
        this.stoneCompleteLoading = true;
        
        const stoneId = this.currentStoneData?.stoneId || this.currentStoneData?.id;
        if (!stoneId) {
          showSnackbar('스톤 ID를 찾을 수 없습니다.', { color: 'error' });
          return;
        }
        
        // 스톤 완료 API 호출
        await completeStone(stoneId);
        
        showSnackbar('스톤이 완료되었습니다.', { color: 'success' });
        
        // 부모 컴포넌트에 스톤 완료 이벤트 전달
        this.$emit('stone-completed', {
          stoneId: stoneId,
          stoneName: this.currentStoneData?.stoneName
        });
        
        // 모달 닫기
        this.closeStoneCompleteConfirmModal();
        this.closeModal();
        
      } catch (error) {
        console.error('스톤 완료 처리 실패:', error);
        
        // 500 에러인 경우 특별한 메시지 표시
        if (error.message.includes('서버 오류가 발생했습니다')) {
          showSnackbar('모든 태스크가 완료되어야 스톤을 완료할 수 있습니다.', { color: 'warning' });
        } else {
          showSnackbar(error.message || '스톤 완료 처리에 실패했습니다.', { color: 'error' });
        }
      } finally {
        this.stoneCompleteLoading = false;
      }
    },
    
    // 스톤 완료 확인 모달 닫기
    closeStoneCompleteConfirmModal() {
      this.showStoneCompleteConfirmModal = false;
    },
    
    async openEditModal() {
      // 프로젝트 정보가 없으면 로드
      if (!this.projectDetail) {
        // projectId를 여러 방법으로 시도
        const projectId = this.currentStoneData?.projectId 
          || this.stoneData?.projectId 
          || this.loadedStoneData?.projectId
          || this.$route?.query?.id
          || this.$route?.params?.id;
        
        if (projectId) {
          await this.loadProjectDetail(projectId);
        }
      }
      
      // 현재 스톤 데이터로 폼 초기화
      this.editForm = {
        stoneName: this.currentStoneData?.stoneName || '',
        startDate: this.formatDateForInput(this.currentStoneData?.startTime),
        endDate: this.formatDateForInput(this.currentStoneData?.endTime),
        createChat: this.currentStoneData?.chatCreation || false,
        stoneDescribe: this.currentStoneData?.stoneDescribe || '' // 스톤 설명 초기화
      };
      
      this.showEditModal = true;
    },
    
    closeEditModal() {
      this.showEditModal = false;
      this.editForm = {
        stoneName: '',
        startDate: '',
        endDate: '',
        createChat: false,
        stoneDescribe: '' // 스톤 설명 초기화
      };
    },
    
    formatDateForInput(dateStr) {
      if (!dateStr) return '';
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    },
    
    // 프로젝트 시작일 반환 (YYYY-MM-DD 형식)
    getProjectStartDate() {
      if (!this.projectDetail?.startTime) return '';
      return this.formatDateForInput(this.projectDetail.startTime);
    },
    
    // 프로젝트 종료일 반환 (YYYY-MM-DD 형식)
    getProjectEndDate() {
      if (!this.projectDetail?.endTime) return '';
      return this.formatDateForInput(this.projectDetail.endTime);
    },
    
    // 프로젝트 상세 정보 로드
    async loadProjectDetail(projectId) {
      if (!projectId) {
        return false;
      }
      
      try {
        const userId = localStorage.getItem('id');
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        // axios를 사용하여 ProjectList와 동일한 방식으로 호출
        const response = await axios.get(
          `${baseURL}/workspace-service/project/detail/${projectId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200 && response.data.result) {
          const projectData = response.data.result;
          // ProjectList와 동일한 구조로 저장
          this.projectDetail = {
            projectName: projectData.projectName || '',
            projectDescription: projectData.projectDescription || '',
            startTime: projectData.startTime || '',
            endTime: projectData.endTime || '',
            manager: projectData.projectManagerName || projectData.managerName || projectData.manager || '',
            managerId: projectData.projectManagerId || projectData.managerId || '',
            projectStatus: projectData.projectStatus || 'PROGRESS',
            isChatCreation: projectData.isChatCreation || false
          };
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    },
    
    async saveStoneEdit() {
      if (!this.editForm.stoneName.trim()) {
        showSnackbar('스톤명을 입력해주세요.', { color: 'error' });
        return;
      }
      
      if (!this.editForm.startDate || !this.editForm.endDate) {
        showSnackbar('시작일과 종료일을 모두 입력해주세요.', { color: 'error' });
        return;
      }
      
      if (new Date(this.editForm.startDate) > new Date(this.editForm.endDate)) {
        showSnackbar('시작일은 종료일보다 이전이어야 합니다.', { color: 'error' });
        return;
      }
      
      // 프로젝트 기간 검증
      if (this.projectDetail) {
        const projectStartDate = this.formatDateForInput(this.projectDetail.startTime);
        const projectEndDate = this.formatDateForInput(this.projectDetail.endTime);
        
        if (projectStartDate && this.editForm.startDate < projectStartDate) {
          showSnackbar(`시작일은 프로젝트 시작일(${projectStartDate}) 이후여야 합니다.`, { color: 'error' });
          return;
        }
        
        if (projectEndDate && this.editForm.endDate > projectEndDate) {
          showSnackbar(`종료일은 프로젝트 종료일(${projectEndDate}) 이전이어야 합니다.`, { color: 'error' });
          return;
        }
      }
      
      try {
        this.isUpdating = true;
        
        // 채팅방 생성이 비활성화된 경우 createChat을 false로 강제 설정
        if (this.isChatCreationDisabled) {
          this.editForm.createChat = false;
        }
        
        const stoneId = this.currentStoneData?.stoneId || this.currentStoneData?.id;
        if (!stoneId) {
          throw new Error('스톤 ID를 찾을 수 없습니다.');
        }
        
        // 스톤 수정 API 호출
        const response = await modifyStone({
          stoneId: stoneId,
          stoneName: this.editForm.stoneName,
          startTime: this.editForm.startDate + 'T09:00:00',
          endTime: this.editForm.endDate + 'T18:00:00',
          chatCreation: this.editForm.createChat,
          stoneDescribe: this.editForm.stoneDescribe?.trim() || null // nullable
        });
        
        // 백엔드에서 리턴된 수정된 스톤 ID 사용
        const updatedStoneId = response.result || stoneId;
        
        showSnackbar('스톤이 성공적으로 수정되었습니다.', { color: 'success' });
        
        // 부모 컴포넌트에 수정 완료 알림
        this.$emit('stone-updated', {
          stoneId: updatedStoneId,
          stoneName: this.editForm.stoneName,
          startTime: this.editForm.startDate,
          endTime: this.editForm.endDate,
          chatCreation: this.editForm.createChat,
          stoneDescribe: this.editForm.stoneDescribe?.trim() || null
        });
        
        // 전역 이벤트 발생으로 다른 컴포넌트들에 알림
        const eventData = {
          stoneId: updatedStoneId,
          stoneName: this.editForm.stoneName,
          startTime: this.editForm.startDate,
          endTime: this.editForm.endDate,
          chatCreation: this.editForm.createChat,
          stoneDescribe: this.editForm.stoneDescribe?.trim() || null
        };
        
        console.log('=== 스톤 수정 완료 - 전역 이벤트 발생 ===');
        console.log('이벤트 데이터:', eventData);
        
        window.dispatchEvent(new CustomEvent('stoneUpdated', {
          detail: eventData
        }));
        
        console.log('전역 이벤트 발생 완료');
        
        this.closeEditModal();
        
      } catch (error) {
        console.error('스톤 수정 실패:', error);
        showSnackbar(error.message || '스톤 수정에 실패했습니다.', { color: 'error' });
      } finally {
        this.isUpdating = false;
      }
    },
    deleteStone() {
      console.log('삭제 버튼 클릭됨!', this.stoneData)
      this.showDeleteConfirm = true
    },
    async confirmDelete() {
      if (this.isDeleting) return;
      
      try {
        this.isDeleting = true;
        
        // 스톤 ID 확인
        const stoneId = this.currentStoneData?.stoneId || this.currentStoneData?.id;
        if (!stoneId) {
          showSnackbar('스톤 ID를 찾을 수 없습니다.', { color: 'error' });
          return;
        }
        
        // 하위 스톤 존재 여부 확인
        const hasChildStones = this.currentStoneData?.hasChildStones || false;
        const childStoneCount = this.currentStoneData?.childStoneCount || 0;
        
        if (hasChildStones && childStoneCount > 0) {
          showSnackbar(`하위 스톤이 ${childStoneCount}개 존재합니다. 모든 하위 스톤을 삭제한 후 부모 스톤을 삭제할 수 있습니다.`, { color: 'error' });
          this.isDeleting = false;
          this.showDeleteConfirm = false;
          return;
        }
        
        // API 호출
        await deleteStone(stoneId);
        
        // 성공 메시지
        showSnackbar('스톤이 성공적으로 삭제되었습니다.', { color: 'success' });
        
        // 부모 컴포넌트에 삭제 완료 알림
        this.$emit('stone-deleted', {
          stoneId: stoneId,
          stoneName: this.currentStoneData?.stoneName
        });
        
        // 모달 닫기
        this.showDeleteConfirm = false;
        this.closeModal();
        
      } catch (error) {
        console.error('스톤 삭제 실패:', error);
        showSnackbar(error.message || '스톤 삭제에 실패했습니다.', { color: 'error' });
      } finally {
        this.isDeleting = false;
      }
    },
    cancelDelete() {
      this.showDeleteConfirm = false
    },
    addTask() {
      console.log('태스크 추가 버튼 클릭됨!', this.stoneData)
      
      // 완료된 스톤인지 확인
      if (this.isStoneCompleted) {
        alert('완료된 스톤에는 태스크를 추가할 수 없습니다.');
        return;
      }
      
      this.openTaskAddModal()
    },
    
    async openTaskAddModal() {
      console.log('=== 태스크 추가 모달 열기 ===');
      console.log('현재 stoneData:', this.stoneData);
      
      // 현재 스톤의 기간으로 기본값 설정
      this.taskForm = {
        title: '',
        startDate: this.formatDateForInput(this.currentStoneData?.startTime),
        endDate: this.formatDateForInput(this.currentStoneData?.endTime),
        assigneeId: null,
        assigneeUserId: null,
        assigneeName: ''
      };
      
      // 개인 워크스페이스일 때 본인을 담당자로 자동 설정
      if (this.isPersonalWorkspace) {
        try {
          // 스톤 참여자 목록 조회 (개인 워크스페이스이므로 본인만 있을 것)
          await this.loadAvailableTaskAssignees();
          
          // 본인을 담당자로 자동 선택
          const currentUserId = localStorage.getItem('id');
          const currentAssignee = this.availableTaskAssignees.find(
            assignee => assignee.userId === currentUserId
          );
          
          if (currentAssignee) {
            this.taskForm.assigneeId = currentAssignee.id;
            this.taskForm.assigneeUserId = currentAssignee.userId;
            this.taskForm.assigneeName = currentAssignee.name;
          }
        } catch (error) {
          console.error('개인 워크스페이스 담당자 자동 설정 실패:', error);
        }
      }
      
      console.log('초기화된 taskForm:', this.taskForm);
      this.showTaskAddModal = true;
    },
    
    closeTaskAddModal() {
      this.showTaskAddModal = false;
      this.taskForm = {
        title: '',
        startDate: '',
        endDate: '',
        assigneeId: null,
        assigneeUserId: null,
        assigneeName: ''
      };
    },
    
    handleAssigneeClick() {
      if (!this.isPersonalWorkspace) {
        this.openTaskAssigneeModal();
      }
    },
    
    async openTaskAssigneeModal() {
      console.log('태스크 담당자 선택 모달 열기');
      try {
        // 워크스페이스 참여자 목록을 가져와서 담당자 선택 모달에 표시
        await this.loadAvailableTaskAssignees();
        this.showTaskAssigneeModal = true;
        this.taskAssigneeSearchKeyword = '';
        this.selectedTaskAssigneeId = null;
      } catch (error) {
        console.error('담당자 목록 로드 실패:', error);
        showSnackbar('담당자 목록을 불러올 수 없습니다.', { color: 'error' });
      }
    },
    
    closeTaskAssigneeModal() {
      this.showTaskAssigneeModal = false;
      this.taskAssigneeSearchKeyword = '';
      this.selectedTaskAssigneeId = null;
      this.isTaskAssigneeSearching = false;
    },
    
    // 태스크 담당자 목록 로드 (스톤 참여자 목록 사용)
    async loadAvailableTaskAssignees() {
      try {
        const stoneId = this.currentStoneData?.stoneId || this.currentStoneData?.id;
        if (!stoneId) {
          throw new Error('스톤 ID가 없습니다.');
        }
        
        // 스톤 참여자 목록 조회 API 호출
        const response = await getStoneParticipantList(stoneId);
        
        if (response && response.result) {
          // API 응답을 담당자 목록 형태로 변환
          this.availableTaskAssignees = response.result.map(participant => ({
            id: participant.userId, // UUID 형태의 사용자 ID (참조용)
            userId: participant.userId, // UUID 형태의 사용자 ID (API 전송용)
            name: participant.participantName,
            email: participant.userEmail,
            profileImageUrl: null // 스톤 참여자 API에서는 프로필 이미지 정보가 없음
          }));
        } else {
          this.availableTaskAssignees = [];
        }
        
        this.filteredTaskAssignees = [...this.availableTaskAssignees];
        
      } catch (error) {
        console.error('태스크 담당자 목록 로드 실패:', error);
        showSnackbar(error.message || '담당자 목록을 불러올 수 없습니다.', { color: 'error' });
        this.availableTaskAssignees = [];
        this.filteredTaskAssignees = [];
      }
    },
    
    // 태스크 담당자 검색 필터링 (클라이언트 사이드 필터링)
    filterTaskAssignees() {
      try {
        this.isTaskAssigneeSearching = true;
        
        const keyword = this.taskAssigneeSearchKeyword.trim().toLowerCase();
        
        // 검색 키워드가 없으면 전체 목록 표시
        if (!keyword) {
          this.filteredTaskAssignees = [...this.availableTaskAssignees];
          return;
        }
        
        // 클라이언트 사이드 필터링
        this.filteredTaskAssignees = this.availableTaskAssignees.filter(assignee => 
          assignee.name.toLowerCase().includes(keyword) || 
          assignee.email.toLowerCase().includes(keyword)
        );
        
      } catch (error) {
        console.error('태스크 담당자 검색 실패:', error);
        this.filteredTaskAssignees = [...this.availableTaskAssignees];
      } finally {
        this.isTaskAssigneeSearching = false;
      }
    },
    
    // 태스크 담당자 선택
    selectTaskAssignee(assignee) {
      this.selectedTaskAssigneeId = assignee.id;
    },
    
    // 태스크 담당자 선택 확인
    confirmTaskAssigneeChange() {
      if (!this.selectedTaskAssigneeId) {
        showSnackbar('담당자를 선택해주세요.', { color: 'error' });
        return;
      }
      
      const selectedAssignee = this.availableTaskAssignees.find(a => a.id === this.selectedTaskAssigneeId);
      if (selectedAssignee) {
        this.taskForm.assigneeId = selectedAssignee.id;
        this.taskForm.assigneeUserId = selectedAssignee.userId; // UUID 형태의 사용자 ID
        this.taskForm.assigneeName = selectedAssignee.name;
        console.log('선택된 태스크 담당자:', selectedAssignee);
      }
      
      this.closeTaskAssigneeModal();
    },
    
    // 태스크 삭제
    deleteTask(task) {
      this.taskToDelete = task;
      this.showDeleteConfirmModal = true;
    },
    
    // 태스크 삭제 확인
    async confirmDeleteTask() {
      if (!this.taskToDelete) return;
      
      try {
        this.deleteLoading = true;
        console.log('태스크 삭제:', this.taskToDelete);
        
        // 태스크 삭제 API 호출
        await deleteTask(this.taskToDelete.id);
        
        showSnackbar('태스크가 삭제되었습니다.', { color: 'success' });
        
        // 태스크 목록 새로고침
        await this.loadTaskList();
        
        this.closeDeleteConfirmModal();
      } catch (error) {
        console.error('태스크 삭제 실패:', error);
        showSnackbar(error.message || '태스크 삭제에 실패했습니다.', { color: 'error' });
      } finally {
        this.deleteLoading = false;
      }
    },
    
    // 삭제 확인 모달 닫기
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false;
      this.taskToDelete = null;
      this.deleteLoading = false;
    },
    
    // 태스크 완료/취소 처리
    toggleTaskComplete(task) {
      // 이미 완료된 태스크는 취소 확인 모달 표시
      if (task.completed) {
        this.taskToCancel = task;
        this.showCancelConfirmModal = true;
        return;
      }
      
      // 미완료 태스크는 완료 확인 모달 표시
      this.taskToComplete = task;
      this.showCompleteConfirmModal = true;
    },
    
    // 태스크 취소 확인
    async confirmCancelTask() {
      if (!this.taskToCancel) return;
      
      try {
        this.cancelLoading = true;
        console.log('태스크 취소 처리:', this.taskToCancel);
        
        // 태스크 취소 API 호출
        const response = await cancelTask(this.taskToCancel.id);
        
        // 성공 메시지 표시
        const result = response.result || '태스크 상태가 취소되었습니다.';
        showSnackbar(result, { color: 'success' });
        
        // 태스크 목록 새로고침
        await this.loadTaskList();
        
        // 부모 컴포넌트에 태스크 취소 이벤트 전달
        this.$emit('task-cancelled', {
          stoneId: this.currentStoneData?.stoneId || this.currentStoneData?.id,
          taskId: this.taskToCancel.id,
          taskName: this.taskToCancel.name
        });
        
        this.closeCancelConfirmModal();
      } catch (error) {
        console.error('태스크 취소 처리 실패:', error);
        showSnackbar(error.message || '태스크 취소 처리에 실패했습니다.', { color: 'error' });
      } finally {
        this.cancelLoading = false;
      }
    },
    
    // 취소 확인 모달 닫기
    closeCancelConfirmModal() {
      this.showCancelConfirmModal = false;
      this.taskToCancel = null;
      this.cancelLoading = false;
    },
    
    // 태스크 완료 확인
    async confirmCompleteTask() {
      if (!this.taskToComplete) return;
      
      try {
        this.completeLoading = true;
        console.log('태스크 완료 처리:', this.taskToComplete);
        
        // 태스크 완료 API 호출
        const response = await completeTask(this.taskToComplete.id);
        
        // 마일스톤 정보 표시
        const milestone = response.result || '마일스톤 정보 없음';
        showSnackbar(`태스크가 완료되었습니다. ${milestone}`, { color: 'success' });
        
        // 태스크 목록 새로고침
        await this.loadTaskList();
        
        // 부모 컴포넌트에 태스크 완료 이벤트 전달
        this.$emit('task-completed', {
          stoneId: this.currentStoneData?.stoneId || this.currentStoneData?.id,
          taskId: this.taskToComplete.id,
          taskName: this.taskToComplete.name
        });
        
        this.closeCompleteConfirmModal();
      } catch (error) {
        console.error('태스크 완료 처리 실패:', error);
        showSnackbar(error.message || '태스크 완료 처리에 실패했습니다.', { color: 'error' });
      } finally {
        this.completeLoading = false;
      }
    },
    
    // 완료 확인 모달 닫기
    closeCompleteConfirmModal() {
      this.showCompleteConfirmModal = false;
      this.taskToComplete = null;
      this.completeLoading = false;
    },
    
    // 스톤 상태 텍스트 반환
    getStoneStatusText(status) {
      switch (status) {
        case 'PROGRESS':
          return '진행중';
        case 'COMPLETED':
          return '완료';
        default:
          return '알 수 없음';
      }
    },
    
    // 스톤 상태 CSS 클래스 반환
    getStoneStatusClass(status) {
      switch (status) {
        case 'PROGRESS':
          return 'status-progress';
        case 'COMPLETED':
          return 'status-completed';
        default:
          return 'status-unknown';
      }
    },
    
    // 태스크 담당자 변경 모달 열기
    async openTaskAssigneeEditModal(task) {
      console.log('태스크 담당자 변경 모달 열기:', task);
      try {
        this.editingTaskId = task.id;
        this.editingTaskName = task.name;
        
        // 워크스페이스 참여자 목록을 가져와서 담당자 변경 모달에 표시
        await this.loadAvailableTaskAssigneeEdits();
        this.showTaskAssigneeEditModal = true;
        this.taskAssigneeEditSearchKeyword = '';
        this.selectedTaskAssigneeEditId = null;
      } catch (error) {
        console.error('담당자 목록 로드 실패:', error);
        showSnackbar('담당자 목록을 불러올 수 없습니다.', { color: 'error' });
      }
    },
    
    closeTaskAssigneeEditModal() {
      this.showTaskAssigneeEditModal = false;
      this.editingTaskId = null;
      this.editingTaskName = '';
      this.taskAssigneeEditSearchKeyword = '';
      this.selectedTaskAssigneeEditId = null;
      this.isTaskAssigneeEditSearching = false;
    },
    
    // 태스크 담당자 변경용 목록 로드 (스톤 참여자 목록 사용)
    async loadAvailableTaskAssigneeEdits() {
      try {
        const stoneId = this.currentStoneData?.stoneId || this.currentStoneData?.id;
        if (!stoneId) {
          throw new Error('스톤 ID가 없습니다.');
        }
        
        // 스톤 참여자 목록 조회 API 호출
        const response = await getStoneParticipantList(stoneId);
        
        if (response && response.result) {
          // API 응답을 담당자 목록 형태로 변환
          this.availableTaskAssigneeEdits = response.result.map(participant => ({
            id: participant.userId, // UUID 형태의 사용자 ID (참조용)
            userId: participant.userId, // UUID 형태의 사용자 ID (API 전송용)
            name: participant.participantName,
            email: participant.userEmail,
            profileImageUrl: null // 스톤 참여자 API에서는 프로필 이미지 정보가 없음
          }));
        } else {
          this.availableTaskAssigneeEdits = [];
        }
        
        this.filteredTaskAssigneeEdits = [...this.availableTaskAssigneeEdits];
        
      } catch (error) {
        console.error('태스크 담당자 변경용 목록 로드 실패:', error);
        showSnackbar(error.message || '담당자 목록을 불러올 수 없습니다.', { color: 'error' });
        this.availableTaskAssigneeEdits = [];
        this.filteredTaskAssigneeEdits = [];
      }
    },
    
    // 태스크 담당자 변경용 검색 필터링 (클라이언트 사이드 필터링)
    filterTaskAssigneeEdits() {
      try {
        this.isTaskAssigneeEditSearching = true;
        
        const keyword = this.taskAssigneeEditSearchKeyword.trim().toLowerCase();
        
        // 검색 키워드가 없으면 전체 목록 표시
        if (!keyword) {
          this.filteredTaskAssigneeEdits = [...this.availableTaskAssigneeEdits];
          return;
        }
        
        // 클라이언트 사이드 필터링
        this.filteredTaskAssigneeEdits = this.availableTaskAssigneeEdits.filter(assignee => 
          assignee.name.toLowerCase().includes(keyword) || 
          assignee.email.toLowerCase().includes(keyword)
        );
        
      } catch (error) {
        console.error('태스크 담당자 변경용 검색 실패:', error);
        this.filteredTaskAssigneeEdits = [...this.availableTaskAssigneeEdits];
      } finally {
        this.isTaskAssigneeEditSearching = false;
      }
    },
    
    // 태스크 담당자 변경용 선택
    selectTaskAssigneeEdit(assignee) {
      this.selectedTaskAssigneeEditId = assignee.id;
    },
    
    // 태스크 담당자 변경 확인
    async confirmTaskAssigneeEdit() {
      if (!this.selectedTaskAssigneeEditId) {
        showSnackbar('담당자를 선택해주세요.', { color: 'error' });
        return;
      }
      
      try {
        this.isUpdating = true;
        
        const selectedAssignee = this.availableTaskAssigneeEdits.find(a => a.id === this.selectedTaskAssigneeEditId);
        if (!selectedAssignee) {
          showSnackbar('선택된 담당자를 찾을 수 없습니다.', { color: 'error' });
          return;
        }
        
        console.log('=== 태스크 담당자 변경 시작 ===');
        console.log('태스크 ID:', this.editingTaskId);
        console.log('새 담당자:', selectedAssignee);
        
        // 현재 태스크 정보 가져오기
        const currentTask = this.taskList.find(task => task.id === this.editingTaskId);
        if (!currentTask) {
          showSnackbar('태스크 정보를 찾을 수 없습니다.', { color: 'error' });
          return;
        }
        
        const requestPayload = {
          taskId: this.editingTaskId,
          taskName: currentTask.name,
          startTime: currentTask.startTime,
          endTime: currentTask.endTime,
          newManagerUserId: selectedAssignee.userId
        };

        console.log('태스크 담당자 변경 요청 데이터(서비스 호출 직전):', requestPayload);

        // 실제 태스크 수정 API 호출 (담당자만 변경)
        const response = await modifyTask(requestPayload);
        
        console.log('=== 태스크 담당자 변경 API 응답 ===');
        console.log('API 응답:', response);
        
        showSnackbar('태스크 담당자가 성공적으로 변경되었습니다.', { color: 'success' });
        
        // 태스크 목록 새로고침
        await this.loadTaskList();
        
        this.closeTaskAssigneeEditModal();
        
      } catch (error) {
        console.error('태스크 담당자 변경 실패:', error);
        showSnackbar(error.message || '태스크 담당자 변경에 실패했습니다.', { color: 'error' });
      } finally {
        this.isUpdating = false;
      }
    },
    
    // 태스크 목록 로드
    async loadTaskList() {
      try {
        this.isLoadingTasks = true;
        console.log('=== 태스크 목록 로드 시작 ===');
        
        const stoneId = this.currentStoneData?.stoneId || this.currentStoneData?.id;
        if (!stoneId) {
          console.warn('스톤 ID가 없어서 태스크 목록을 로드할 수 없습니다.');
          this.taskList = [];
          return;
        }
        
        console.log('태스크 목록 API 호출 - stoneId:', stoneId);
        const response = await getTaskList(stoneId);
        
        console.log('=== 태스크 목록 API 응답 ===');
        console.log('API 응답:', response);
        
        if (response && response.result) {
          // API 응답을 태스크 목록 형태로 변환
          this.taskList = response.result.map(task => ({
            id: task.taskId,
            name: task.taskName,
            completed: task.isDone || false,
            startTime: task.startTime,
            endTime: task.endTime,
            assigneeId: task.taskManagerId,
            assigneeUserId: task.taskManagerUserId,
            assigneeName: task.taskManagerName || '담당자 없음'
          }));
          
          console.log('변환된 태스크 목록:', this.taskList);
        } else {
          this.taskList = [];
        }
        
      } catch (error) {
        console.error('태스크 목록 로드 실패:', error);
        showSnackbar(error.message || '태스크 목록을 불러올 수 없습니다.', { color: 'error' });
        this.taskList = [];
      } finally {
        this.isLoadingTasks = false;
      }
    },
    
    async createTask() {
      console.log('=== 태스크 생성 시작 ===');
      console.log('현재 taskForm:', this.taskForm);
      
      if (!this.taskForm.title.trim()) {
        showSnackbar('태스크 제목을 입력해주세요.', { color: 'error' });
        return;
      }
      
      if (!this.taskForm.startDate || !this.taskForm.endDate) {
        showSnackbar('시작일과 종료일을 모두 입력해주세요.', { color: 'error' });
        return;
      }
      
      if (new Date(this.taskForm.startDate) > new Date(this.taskForm.endDate)) {
        showSnackbar('시작일은 종료일보다 이전이어야 합니다.', { color: 'error' });
        return;
      }
      
      try {
        this.isCreatingTask = true;
        console.log('태스크 생성 API 호출 시작...');
        
        // 담당자 ID가 없으면 에러
        if (!this.taskForm.assigneeUserId) {
          showSnackbar('태스크 담당자를 선택해주세요.', { color: 'error' });
          return;
        }
        
        // 실제 태스크 생성 API 호출
        const response = await createTask({
          stoneId: this.currentStoneData?.stoneId || this.currentStoneData?.id,
          managerId: this.taskForm.assigneeUserId, // UUID 형태의 사용자 ID
          taskName: this.taskForm.title,
          startTime: this.taskForm.startDate + 'T09:00:00',
          endTime: this.taskForm.endDate + 'T18:00:00'
        });
        
        console.log('=== 태스크 생성 API 응답 ===');
        console.log('API 응답:', response);
        
        showSnackbar('태스크가 성공적으로 생성되었습니다.', { color: 'success' });
        
        // 태스크 목록 새로고침
        await this.loadTaskList();
        
        // 부모 컴포넌트에 태스크 생성 완료 알림
        this.$emit('task-created', {
          stoneId: this.currentStoneData?.stoneId || this.currentStoneData?.id,
          title: this.taskForm.title,
          startTime: this.taskForm.startDate,
          endTime: this.taskForm.endDate,
          assigneeId: this.taskForm.assigneeId,
          assigneeName: this.taskForm.assigneeName
        });
        
        this.closeTaskAddModal();
        
      } catch (error) {
        console.error('태스크 생성 실패:', error);
        showSnackbar(error.message || '태스크 생성에 실패했습니다.', { color: 'error' });
      } finally {
        this.isCreatingTask = false;
      }
    },
    async editManager() {
      console.log('담당자 수정 클릭:', this.stoneData)
      try {
        // 워크스페이스 참여자 목록을 가져와서 담당자 선택 모달에 표시
        await this.loadAvailableManagers();
        this.showManagerSelectModal = true;
        this.managerSearchKeyword = '';
        this.selectedManagerId = null;
      } catch (error) {
        console.error('담당자 목록 로드 실패:', error);
        showSnackbar('담당자 목록을 불러올 수 없습니다.', { color: 'error' });
      }
    },
    editParticipants() {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👥 [참여자 수정] 버튼 클릭됨');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 현재 stoneData:', this.stoneData);
      console.log('📦 현재 currentStoneData:', this.currentStoneData);
      console.log('📦 현재 loadedStoneData:', this.loadedStoneData);
      console.log('🆔 스톤 ID:', this.currentStoneData?.stoneId || this.currentStoneData?.id);
      console.log('📋 스톤 이름:', this.currentStoneData?.stoneName);
      console.log('👥 현재 참여자:', this.currentStoneData?.participants);
      console.log('📋 참여자 원본 데이터:', this.currentStoneData?.stoneParticipantDtoList);
      console.log('🌐 workspaceId:', this.workspaceId);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const stoneDataToEmit = this.stoneData || this.currentStoneData || this.loadedStoneData;
      console.log('📤 emit할 데이터:', stoneDataToEmit);
      console.log('📤 이벤트 이름: edit-participants');
      
      // TODO: 참여자 수정 API 연동
      this.$emit('edit-participants', stoneDataToEmit);
      
      console.log('✅ edit-participants 이벤트 emit 완료');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    },
    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) return '날짜 미설정'
      
      // API 응답이 ISO 8601 형식인 경우 처리
      const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\s/g, '').slice(0, -1)
      }
      
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    },
    
    // 담당자 목록 로드 (실제 API 호출)
    async loadAvailableManagers() {
      try {
        if (!this.workspaceId) {
          throw new Error('워크스페이스 ID가 없습니다.');
        }
        
        // 워크스페이스 참여자 검색 API 호출
        const response = await searchWorkspaceParticipants(this.workspaceId, '');
        
        if (response && response.result && response.result.userInfoList) {
          // API 응답을 담당자 목록 형태로 변환
          this.availableManagers = response.result.userInfoList.map(user => ({
            id: user.userId, // UUID 형태의 사용자 ID
            name: user.userName,
            email: user.userEmail,
            profileImageUrl: user.profileImageUrl
          }));
        } else {
          this.availableManagers = [];
        }
        
        this.filteredManagers = [...this.availableManagers];
        
      } catch (error) {
        console.error('담당자 목록 로드 실패:', error);
        showSnackbar(error.message || '담당자 목록을 불러올 수 없습니다.', { color: 'error' });
        this.availableManagers = [];
        this.filteredManagers = [];
      }
    },
    
    
    // 담당자 검색 필터링 (실제 API 호출)
    async filterManagers() {
      try {
        this.isSearching = true;
        
        if (!this.workspaceId) {
          this.filteredManagers = [...this.availableManagers];
          return;
        }
        
        const keyword = this.managerSearchKeyword.trim();
        
        // 검색 키워드가 없으면 전체 목록 표시
        if (!keyword) {
          this.filteredManagers = [...this.availableManagers];
          return;
        }
        
        // API 호출로 검색
        const response = await searchWorkspaceParticipants(this.workspaceId, keyword);
        
        if (response && response.result && response.result.userInfoList) {
          this.filteredManagers = response.result.userInfoList.map(user => ({
            id: user.userId, // UUID 형태의 사용자 ID
            name: user.userName,
            email: user.userEmail,
            profileImageUrl: user.profileImageUrl
          }));
        } else {
          this.filteredManagers = [];
        }
        
      } catch (error) {
        console.error('담당자 검색 실패:', error);
        // 검색 실패 시 클라이언트 사이드 필터링으로 폴백
        const keyword = this.managerSearchKeyword.toLowerCase();
        this.filteredManagers = this.availableManagers.filter(manager => 
          manager.name.toLowerCase().includes(keyword) || 
          manager.email.toLowerCase().includes(keyword)
        );
      } finally {
        this.isSearching = false;
      }
    },
    
    // 담당자 선택
    selectManager(manager) {
      this.selectedManagerId = manager.id;
    },
    
    // 담당자 선택 모달 닫기
    closeManagerSelectModal() {
      this.showManagerSelectModal = false;
      this.managerSearchKeyword = '';
      this.selectedManagerId = null;
      this.isSearching = false;
    },
    
    // 담당자 변경 확인
    async confirmManagerChange() {
      if (!this.selectedManagerId) {
        showSnackbar('담당자를 선택해주세요.', { color: 'error' });
        return;
      }
      
      try {
        this.isUpdating = true;
        
        const stoneId = this.currentStoneData?.stoneId || this.currentStoneData?.id;
        if (!stoneId) {
          throw new Error('스톤 ID를 찾을 수 없습니다.');
        }
        
        // API 호출 (selectedManagerId는 UUID 형태)
        await modifyStoneManager(stoneId, this.selectedManagerId);
        
        // 성공 메시지
        const selectedManager = this.availableManagers.find(m => m.id === this.selectedManagerId);
        showSnackbar(`담당자가 ${selectedManager?.name}으로 변경되었습니다.`, { color: 'success' });
        
        // 부모 컴포넌트에 담당자 변경 완료 알림
        this.$emit('manager-changed', {
          stoneId: stoneId,
          newManagerId: this.selectedManagerId,
          newManagerName: selectedManager?.name
        });
        
        // 모달 닫기
        this.closeManagerSelectModal();
        
      } catch (error) {
        console.error('담당자 변경 실패:', error);
        showSnackbar(error.message || '담당자 변경에 실패했습니다.', { color: 'error' });
      } finally {
        this.isUpdating = false;
      }
    }
  },
  watch: {
    // stoneId가 변경될 때 스톤 데이터 로드
    stoneId: {
      handler(newStoneId, oldStoneId) {
        console.log('🔄 [프로젝트 캘린더] stoneId watch 핸들러 호출');
        console.log('   - newStoneId:', newStoneId);
        console.log('   - oldStoneId:', oldStoneId);
        console.log('   - stoneData 존재 여부:', !!this.stoneData);
        console.log('   - loadedStoneData 존재 여부:', !!this.loadedStoneData);
        console.log('   - isVisible:', this.isVisible);
        
        // stoneId가 있고, stoneData나 loadedStoneData가 없고, 모달이 열려있을 때 데이터 로드
        if (newStoneId && !this.stoneData && !this.loadedStoneData && this.isVisible) {
          console.log('✅ [프로젝트 캘린더] stoneId가 설정되고 모달이 열려있음. loadStoneData 호출');
          this.loadStoneData(newStoneId);
        } else if (newStoneId && !this.stoneData && !this.loadedStoneData && !this.isVisible) {
          console.log('ℹ️ [프로젝트 캘린더] stoneId가 설정되었지만 모달이 아직 열리지 않음. isVisible이 true가 될 때 로드될 예정');
        } else if (newStoneId && (this.stoneData || this.loadedStoneData)) {
          console.log('ℹ️ [프로젝트 캘린더] stoneData 또는 loadedStoneData가 이미 존재하므로 loadStoneData 호출하지 않음');
        } else {
          console.log('⚠️ [프로젝트 캘린더] stoneId가 없거나 조건 불충족');
        }
      },
      immediate: true
    },
    
    // isVisible이 변경될 때 로그 출력 및 데이터 로드
    isVisible: {
      handler(newValue, oldValue) {
        console.log('🔄 [프로젝트 캘린더] isVisible 변경:', oldValue, '→', newValue);
        console.log('   - stoneId:', this.stoneId);
        console.log('   - stoneData:', this.stoneData);
        console.log('   - loadedStoneData:', this.loadedStoneData);
        console.log('   - currentStoneData:', this.currentStoneData);
        
        // 모달이 열릴 때 (isVisible이 true가 되고 stoneId가 있고 stoneData가 없을 때) 데이터 로드
        if (newValue && this.stoneId && !this.stoneData && !this.loadedStoneData) {
          console.log('✅ [프로젝트 캘린더] isVisible이 true가 되었고 stoneId가 있지만 데이터가 없음. loadStoneData 호출');
          this.loadStoneData(this.stoneId);
        }
        
        if (newValue && this.currentStoneData) {
          console.log('📊 [프로젝트 캘린더] 모달이 열렸을 때 currentStoneData 확인:');
          console.log('   - 진행률:', this.currentStoneData.milestone || this.currentStoneData.projectMilestone || 0, '%');
          console.log('   - 담당자:', this.currentStoneData.manager || this.currentStoneData.stoneManagerName || '담당자 없음');
          console.log('   - 참여자 목록:', this.currentStoneData.stoneParticipantDtoList || this.currentStoneData.participants || []);
        } else if (newValue && !this.currentStoneData) {
          console.log('⚠️ [프로젝트 캘린더] 모달이 열렸지만 currentStoneData가 없음');
          console.log('   - stoneId:', this.stoneId);
          console.log('   - stoneData:', this.stoneData);
          console.log('   - loadedStoneData:', this.loadedStoneData);
        }
      }
    },
    
    // 스톤 데이터가 변경될 때 프로젝트 정보 로드 및 태스크 목록 다시 로드
    stoneData: {
      handler(newStoneData) {
        // 프로젝트 정보 로드 (즉시 로드하여 모달이 열릴 때 준비되도록)
        if (newStoneData && !this.projectDetail) {
          const projectId = newStoneData.projectId 
            || this.loadedStoneData?.projectId
            || this.$route?.query?.id
            || this.$route?.params?.id;
          if (projectId) {
            this.loadProjectDetail(projectId);
          }
        }
        
        // 태스크 목록 로드
        if (newStoneData && (newStoneData.stoneId || newStoneData.id)) {
          this.loadTaskList();
        }
      },
      immediate: true,
      deep: true
    },
    
    // 로드된 스톤 데이터가 변경될 때 태스크 목록 다시 로드
    loadedStoneData: {
      handler(newStoneData) {
        if (newStoneData && (newStoneData.stoneId || newStoneData.id)) {
          console.log('🔄 [프로젝트 캘린더] loadedStoneData 변경 감지');
          console.log('   - 스톤 ID:', newStoneData.stoneId || newStoneData.id);
          console.log('   - 진행률:', newStoneData.milestone || newStoneData.projectMilestone || 0, '%');
          console.log('   - 담당자:', newStoneData.stoneManagerName || newStoneData.manager || '담당자 없음');
          console.log('   - 참여자 목록:', newStoneData.stoneParticipantDtoList || []);
          this.loadTaskList();
        }
      },
      immediate: true,
      deep: true
    }
  },
  beforeUnmount() {
    // 컴포넌트 파괴 시 정리 작업
  }
}
</script>

<style scoped>
.stone-detail-modal {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  padding-left: 280px;
  animation: fadeIn 0.3s ease-out;
}

.stone-detail-modal.expanded {
  justify-content: center;
  align-items: center;
  padding-left: 280px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  width: 50vw;
  max-width: 600px;
  min-width: 400px;
  height: calc(100vh - 64px);
  background: #FFFFFF;
  overflow: visible;
  border-left: 1px solid rgba(42, 40, 40, 0.5);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: slideIn 0.3s ease-out;
}

.modal-content.expanded {
  width: 85vw;
  max-width: 1400px;
  height: calc(90vh - 64px);
  border-left: none;
  border: 1px solid rgba(42, 40, 40, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: expandToCenter 0.3s ease-out;
}

@keyframes expandToCenter {
  from {
    transform: scale(0.9);
    opacity: 0.8;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.modal-header {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px !important;
  border-bottom: none;
  background: #FFFFFF !important;
  min-height: 50px !important;
  height: auto !important;
  visibility: visible !important;
  opacity: 1 !important;
  overflow: visible !important;
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  box-sizing: border-box;
}

.modal-content.expanded .modal-header {
  border-radius: 12px 12px 0 0;
}

.header-left {
  display: flex !important;
  align-items: center;
  gap: 12px;
  visibility: visible !important;
  opacity: 1 !important;
}

.header-right {
  display: flex !important;
  align-items: center;
  gap: 12px;
  visibility: visible !important;
  opacity: 1 !important;
}

.close-modal-btn,
.expand-center-btn,
.collapse-btn,
.expand-btn,
.delete-btn,
.trash-btn,
.edit-header-btn {
  background: none !important;
  border: none !important;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
  visibility: visible !important;
  opacity: 1 !important;
  outline: none !important;
}

.close-modal-btn:focus,
.expand-center-btn:focus,
.collapse-btn:focus,
.expand-btn:focus,
.delete-btn:focus,
.trash-btn:focus,
.edit-header-btn:focus {
  outline: none !important;
  box-shadow: none !important;
}

.close-modal-btn svg,
.expand-center-btn svg,
.collapse-btn svg,
.expand-btn svg,
.trash-btn svg,
.edit-header-btn svg {
  display: block !important;
  pointer-events: none;
  transition: all 0.2s;
}

.close-modal-btn:hover,
.expand-center-btn:hover,
.collapse-btn:hover,
.expand-btn:hover {
  background: rgba(244, 206, 83, 0.1) !important;
}

.close-modal-btn:hover svg,
.expand-center-btn:hover svg {
  fill: #F4CE53;
}

.edit-header-btn:hover {
  background: rgba(244, 206, 83, 0.1) !important;
}

.edit-header-btn:hover svg path {
  stroke: #F4CE53;
}

.trash-btn:hover {
  background: rgba(239, 68, 68, 0.1) !important;
}

.trash-btn:hover svg {
  fill: #EF4444;
}

.collapse-btn:hover svg path,
.expand-btn:hover svg path {
  stroke: #F4CE53;
}

.close-modal-btn:active,
.expand-center-btn:active,
.collapse-btn:active,
.expand-btn:active,
.trash-btn:active,
.edit-header-btn:active {
  transform: scale(0.95);
}

.complete-stone-btn {
  padding: 6px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  min-width: 50px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F0FDF4;
  color: #16A34A;
  border-color: #BBF7D0;
}

.complete-stone-btn:hover {
  background: #DCFCE7;
  border-color: #86EFAC;
  transform: translateY(-1px);
}

.complete-stone-btn:active {
  transform: translateY(0);
  background: #BBF7D0;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #FFFFFF;
}

.modal-content.expanded .modal-body {
  border-radius: 0 0 12px 12px;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.stone-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stone-title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stone-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  width: fit-content;
}

.status-progress {
  background: #E3F2FD;
  color: #1976D2;
  border: 1px solid #BBDEFB;
}

.status-completed {
  background: #E8F5E8;
  color: #2E7D32;
  border: 1px solid #C8E6C9;
}

.status-unknown {
  background: #F5F5F5;
  color: #757575;
  border: 1px solid #E0E0E0;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stone-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 710;
  font-size: 24px;
  line-height: 26px;
  color: #1C0F0F;
  flex: 1;
  text-align: left;
}

.info-section {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 9px;
  padding: 6px 0;
  gap: 40px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  color: #666666;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 100px;
}

.info-label svg {
  flex-shrink: 0;
}

.info-value {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 15px;
  line-height: 20px;
  color: #1C0F0F;
  text-align: left;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  max-width: 100%;
}

.info-value-with-action {
  display: flex !important;
  align-items: center;
  justify-content: flex-start !important;
  gap: 8px;
  text-align: left !important;
}

.info-value-with-status {
  display: flex !important;
  align-items: center;
  justify-content: flex-start !important;
  gap: 12px;
  text-align: left !important;
}

.progress-percent {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 15px;
  line-height: 20px;
  color: #1C0F0F;
}

.edit-user-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.edit-user-btn:hover {
  background: rgba(244, 206, 83, 0.1);
  opacity: 1;
  transform: scale(1.1);
}

.edit-user-btn:hover svg path,
.edit-user-btn:hover svg circle {
  stroke: #F4CE53 !important;
}

.edit-user-btn:active {
  transform: scale(0.95);
  background: rgba(244, 206, 83, 0.15);
}

.icon-with-plus {
  display: flex;
  align-items: center;
  gap: 1px;
}

.icon-with-plus svg path,
.icon-with-plus svg circle {
  stroke-width: 2.5;
}

/* 빈 값일 때 회색 스타일 */
.empty-value {
  color: #999999 !important;
}

.empty-label {
  color: #999999 !important;
}

.empty-label svg {
  opacity: 0.5;
}



.document-link,
.chat-link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  cursor: pointer;
  transition: color 0.2s;
}

.document-link:hover,
.chat-link:hover {
  color: #F6D365;
}

.chat-link.disabled {
  cursor: default;
}

.chat-link.disabled:hover {
  color: #999999;
}

.divider {
  width: 100%;
  height: 1px;
  background: rgba(42, 40, 40, 0.5);
  margin: 16px 0;
}

.tasks-section {
  margin-top: 8px;
}

.documents-section {
  margin-top: 8px;
}

.stone-drive-wrapper {
  width: 100%;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(42, 40, 40, 0.1);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.stone-drive-wrapper:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(244, 206, 83, 0.3);
}

.stone-drive-container {
  width: 100%;
  height: 600px;
  overflow: hidden;
  background: #FFFFFF;
}

.stone-drive-container :deep(.drive-container) {
  height: 100%;
  padding: 0;
  background: #FFFFFF;
}

.stone-drive-container :deep(.drive-layout) {
  height: 100%;
}

.stone-drive-container :deep(.drive-sidebar) {
  background: #FAFAFA;
  border-right: 1px solid rgba(42, 40, 40, 0.1);
}

.stone-drive-container :deep(.drive-content) {
  background: #FFFFFF;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  color: #666666;
  margin-bottom: 12px;
}

.section-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title svg {
  flex-shrink: 0;
}

.task-sort-dropdown {
  position: relative;
}

.sort-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
  outline: none !important;
}

.sort-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.sort-btn:focus {
  outline: none !important;
  box-shadow: none !important;
}

.sort-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
}

.sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.sort-option:hover {
  background: rgba(244, 206, 83, 0.1);
}

.sort-option span {
  flex: 1;
}

.sort-option svg {
  flex-shrink: 0;
  margin-left: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid rgba(42, 40, 40, 0.1);
}

.task-item:last-child {
  border-bottom: none;
}

.task-checkbox {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.task-checkbox svg {
  transition: all 0.2s;
}

.task-checkbox:hover:not(.completed) {
  transform: scale(1.1);
}

.task-checkbox.completed {
  cursor: pointer;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.task-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 15px;
  line-height: 20px;
  color: #666666;
}

.task-name.completed {
  color: rgba(102, 102, 102, 0.5);
  text-decoration: line-through;
}

.task-period {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 24px;
  color: #666666;
}

.task-assignee {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 0px;
}

.task-assignee .assignee-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 0.2s;
}

.task-assignee .assignee-info:hover {
  background: rgba(244, 206, 83, 0.15);
}

.task-assignee .assignee-info.disabled {
  cursor: default;
  opacity: 0.7;
}

.task-assignee .assignee-info.disabled:hover {
  background: transparent;
}

.task-assignee .assignee-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: #000000;
}

.assignee-icons {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: -8px;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.icon-button:hover {
  background-color: rgba(244, 206, 83, 0.1);
}

.icon-button:active {
  background-color: rgba(244, 206, 83, 0.2);
}

.user-icon {
  margin: 0;
}

.trash-icon {
  margin: 0;
}

/* 태스크 추가 버튼 스타일 */
.add-task-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(42, 40, 40, 0.1);
}

.add-task-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #F5F5F5;
  border: 2px dashed #F4CE53;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #666666;
  width: 100%;
  justify-content: center;
}

.add-task-btn:active {
  transform: translateY(1px);
}

.add-task-btn.disabled {
  background: #F3F4F6;
  color: #9CA3AF;
  border-color: #E5E7EB;
  cursor: not-allowed;
}

.add-task-btn.disabled:hover {
  background: #F3F4F6;
  color: #9CA3AF;
  border-color: #E5E7EB;
  transform: none;
}

.add-task-btn.disabled:active {
  transform: none;
}

/* 로딩 상태 스타일 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #F4CE53;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #666666;
  margin: 0;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .modal-content {
    width: 100%;
    max-width: 600px;
  }
}

@media (max-width: 1200px) {
  .modal-content {
    width: 60vw;
    max-width: 500px;
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 80vw;
    max-width: none;
    min-width: 300px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .stone-title {
    font-size: 22px;
    line-height: 24px;
  }
  
  .info-label,
  .info-value,
  .task-name,
  .task-period {
    font-size: 18px;
    line-height: 22px;
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .task-content {
    width: 100%;
  }
  
  .task-assignee {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .modal-body {
    padding: 15px;
  }
  
  .stone-title {
    font-size: 20px;
    line-height: 24px;
  }
  
  .info-label,
  .info-value,
  .task-name,
  .task-period {
    font-size: 16px;
    line-height: 20px;
  }
  
  .modal-header {
    padding: 15px 20px;
  }
}

/* 스톤 수정 모달 스타일 */
.edit-stone-overlay {
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

.edit-stone-modal {
  width: 500px;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.3s ease-out;
}

.edit-stone-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 12px 12px 0 0;
}

.edit-stone-modal .modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0;
}

.edit-stone-modal .close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.edit-stone-modal .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.edit-stone-modal .modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.edit-stone-modal .form-group {
  margin-bottom: 20px;
}

.edit-stone-modal .form-group-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-stone-modal .form-group-inline .form-label {
  margin-bottom: 0;
  flex: 0 0 auto;
}

.edit-stone-modal .form-label {
  display: block;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #374151;
  margin-bottom: 8px;
}

.edit-stone-modal .form-label.form-label-inline {
  display: flex !important;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
}

.edit-stone-modal .form-label-inline .disabled-text {
  margin-right: 0;
}

.edit-stone-modal .form-label-inline .checkbox-wrapper {
  margin-left: 0;
}

.edit-stone-modal .form-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #1C0F0F;
  background: #FFFFFF;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.edit-stone-modal .form-input:focus {
  outline: none;
  border-color: #F4CE53;
  box-shadow: 0 0 0 3px rgba(244, 206, 83, 0.1);
}

.edit-stone-modal .form-input::placeholder {
  color: #9CA3AF;
}

.edit-stone-modal .form-textarea {
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

.edit-stone-modal .form-textarea:focus {
  outline: none;
  border-color: #F4CE53;
  box-shadow: 0 0 0 3px rgba(244, 206, 83, 0.1);
}

.edit-stone-modal .form-textarea::placeholder {
  color: #9CA3AF;
}

.edit-stone-modal .checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-stone-modal .form-checkbox {
  width: 20px;
  height: 20px;
  background: #FFFFFF;
  border: 2px solid #F4CE53;
  border-radius: 4px;
  appearance: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.edit-stone-modal .form-checkbox:checked {
  background: #F4CE53;
}

.edit-stone-modal .form-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
}

.edit-stone-modal .form-checkbox:disabled {
  background: #F5F5F5;
  border-color: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.6;
}

.edit-stone-modal .form-checkbox:disabled:checked {
  background: #CCCCCC;
}

.edit-stone-modal .checkbox-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #374151;
  cursor: pointer;
}

.edit-stone-modal .checkbox-label.disabled {
  color: #CCCCCC;
  cursor: not-allowed;
  opacity: 0.6;
}

.edit-stone-modal .disabled-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #999999;
  margin-left: 8px;
}

.edit-stone-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 0 0 12px 12px;
}

.edit-stone-modal .btn-cancel {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px solid #D1D5DB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.edit-stone-modal .btn-cancel:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.edit-stone-modal .btn-primary {
  padding: 10px 20px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.edit-stone-modal .btn-primary:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.edit-stone-modal .btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.edit-stone-modal .btn-primary:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
}

/* 삭제 확인 모달 스타일 */
.delete-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease-out;
}

.delete-confirm-modal {
  position: relative;
  width: 560px;
  height: 240px;
  background: #F5F5F5;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 20px 0;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.delete-modal-content {
  width: 480px;
  height: 140px;
  background: #FFFFFF;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0;
  position: relative;
  margin-top: 10px;
}

.delete-modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  margin: 0;
  text-align: center;
}

.delete-modal-body {
  flex: 1;
  padding: 2px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.stone-name-container {
  margin-bottom: 0px;
  text-align: center;
}

.delete-modal-message {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 1.4;
  color: #666666;
  margin: 0;
  text-align: center;
}

.stone-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 16px;
  line-height: 1.4;
  color: #1C0F0F;
  margin: 0;
}

.delete-modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 6px 32px 16px 32px;
}

.cancel-btn {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px solid #D1D5DB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn:hover:not(:disabled) {
  background: #F5F5F5;
  border-color: #9CA3AF;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-modal-actions .delete-btn {
  padding: 10px 20px;
  background: #EF4444 !important;
  border: none !important;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 14px;
  line-height: 20px;
  color: #FFFFFF !important;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 120px;
  height: 40px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  opacity: 1 !important;
}

.delete-modal-actions .delete-btn:hover:not(:disabled) {
  background: #DC2626 !important;
  transform: translateY(-1px);
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.15);
}

.delete-modal-actions .delete-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
}

.delete-modal-actions .delete-btn:disabled {
  background: #9CA3AF !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 담당자 선택 모달 스타일 */
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
  background: rgba(0, 0, 0, 0.05);
}

.manager-select-modal .modal-body {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.search-section {
  margin-bottom: 20px;
}

.search-input-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  background: #FFFFFF;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #F4CE53;
}

.search-input::placeholder {
  color: #9CA3AF;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 48px;
  padding: 0 16px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
}

.search-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.search-btn:active:not(:disabled) {
  transform: translateY(0);
}

.search-btn:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
  transform: none;
}

.search-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #FFFFFF;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.manager-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.manager-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #FFFFFF;
}

.manager-item:hover {
  border-color: #F4CE53;
  background: #FFFBEB;
}

.manager-item:active {
  transform: scale(0.98);
}

.manager-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.manager-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #F3F4F6;
  border-radius: 50%;
  flex-shrink: 0;
}

.manager-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.manager-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #1C0F0F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.manager-email {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: rgba(244, 206, 83, 0.1);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.manager-item:hover .select-indicator {
  background: rgba(244, 206, 83, 0.2);
}

.no-managers {
  text-align: center;
  padding: 40px 20px;
  color: #6B7280;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
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

.manager-select-modal .cancel-btn {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px solid #D1D5DB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.manager-select-modal .cancel-btn:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.confirm-btn {
  padding: 10px 20px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.confirm-btn:active:not(:disabled) {
  transform: translateY(0);
}

.confirm-btn:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
}

/* 태스크 추가 모달 스타일 */
.task-add-overlay {
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

.task-add-modal {
  width: 500px;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.3s ease-out;
}

.task-add-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 12px 12px 0 0;
}

.task-add-modal .modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0;
}

.task-add-modal .modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.task-add-modal .form-group {
  margin-bottom: 20px;
}

.task-add-modal .form-label {
  display: block;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #374151;
  margin-bottom: 8px;
}

.task-add-modal .form-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #1C0F0F;
  background: #FFFFFF;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.task-add-modal .form-input:focus {
  outline: none;
  border-color: #F4CE53;
  box-shadow: 0 0 0 3px rgba(244, 206, 83, 0.1);
}

.task-add-modal .form-input::placeholder {
  color: #9CA3AF;
}

.date-range-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-input {
  flex: 1;
}

.date-separator {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #6B7280;
  flex-shrink: 0;
}

.participant-section {
  margin-top: 8px;
}

.participant-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.participant-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  color: #6B7280;
  min-width: 100px;
  justify-content: center;
}

.participant-btn:hover {
  border-color: #F4CE53;
  background: #FFFBEB;
  color: #F4CE53;
}

.participant-btn:active {
  transform: scale(0.98);
}

.participant-btn svg {
  flex-shrink: 0;
}

.task-add-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 0 0 12px 12px;
}

.task-add-modal .btn-cancel {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px solid #D1D5DB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.task-add-modal .btn-cancel:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.task-add-modal .btn-primary {
  padding: 10px 20px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.task-add-modal .btn-primary:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.task-add-modal .btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.task-add-modal .btn-primary:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
}

/* 태스크 담당자 선택 모달 스타일 */
.task-assignee-overlay {
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

.task-assignee-modal {
  width: 500px;
  max-height: 600px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.3s ease-out;
}

.task-assignee-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 12px 12px 0 0;
}

.task-assignee-modal .modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0;
}

.task-assignee-modal .modal-body {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.task-assignee-modal .search-section {
  margin-bottom: 20px;
}

.task-assignee-modal .search-input-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.task-assignee-modal .search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  background: #FFFFFF;
  transition: border-color 0.2s;
}

.task-assignee-modal .search-input:focus {
  outline: none;
  border-color: #F4CE53;
}

.task-assignee-modal .search-input::placeholder {
  color: #9CA3AF;
}

.task-assignee-modal .search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 48px;
  padding: 0 16px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
}

.task-assignee-modal .search-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.task-assignee-modal .search-btn:active:not(:disabled) {
  transform: translateY(0);
}

.task-assignee-modal .search-btn:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
  transform: none;
}

.task-assignee-modal .search-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #FFFFFF;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.assignee-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.assignee-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #FFFFFF;
}

.assignee-item:hover {
  border-color: #F4CE53;
  background: #FFFBEB;
}

.assignee-item:active {
  transform: scale(0.98);
}

.assignee-item .assignee-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.assignee-item .assignee-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #F3F4F6;
  border-radius: 50%;
  flex-shrink: 0;
}

.assignee-item .assignee-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.assignee-item .assignee-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #1C0F0F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assignee-item .assignee-email {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assignee-item .select-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: rgba(244, 206, 83, 0.1);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.assignee-item:hover .select-indicator {
  background: rgba(244, 206, 83, 0.2);
}

.no-assignees {
  text-align: center;
  padding: 40px 20px;
  color: #6B7280;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
}

.task-assignee-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 0 0 12px 12px;
}

.task-assignee-modal .cancel-btn {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px solid #D1D5DB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-assignee-modal .cancel-btn:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.task-assignee-modal .confirm-btn {
  padding: 10px 20px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-assignee-modal .confirm-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.task-assignee-modal .confirm-btn:active:not(:disabled) {
  transform: translateY(0);
}

.task-assignee-modal .confirm-btn:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
}

/* 태스크 담당자 선택 UI 스타일 */
.assignee-section {
  margin-top: 8px;
}

.assignee-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.assignee-display:hover {
  border-color: #F4CE53;
  background: #FFFBEB;
}

.assignee-display.disabled {
  cursor: default;
  opacity: 0.7;
}

.assignee-display.disabled:hover {
  background-color: #FFFFFF;
  border-color: #E5E7EB;
}

.assignee-display .assignee-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.assignee-display .assignee-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #1C0F0F;
}

.assignee-display .assignee-name.empty {
  color: #9CA3AF;
  font-weight: 400;
}

.assignee-display svg:last-child {
  flex-shrink: 0;
}

/* 태스크 담당자 변경 모달 스타일 */
.task-assignee-edit-overlay {
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

.task-assignee-edit-modal {
  width: 500px;
  max-height: 600px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.3s ease-out;
}

.task-assignee-edit-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 12px 12px 0 0;
}

.task-assignee-edit-modal .modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0;
}

.task-assignee-edit-modal .modal-body {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.task-assignee-edit-modal .task-info {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #F3F4F6;
  border-radius: 8px;
}

.task-assignee-edit-modal .task-name-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #374151;
  margin: 0;
}

.task-assignee-edit-modal .search-section {
  margin-bottom: 20px;
}

.task-assignee-edit-modal .search-input-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.task-assignee-edit-modal .search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  background: #FFFFFF;
  transition: border-color 0.2s;
}

.task-assignee-edit-modal .search-input:focus {
  outline: none;
  border-color: #F4CE53;
}

.task-assignee-edit-modal .search-input::placeholder {
  color: #9CA3AF;
}

.task-assignee-edit-modal .search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 48px;
  padding: 0 16px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
}

.task-assignee-edit-modal .search-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.task-assignee-edit-modal .search-btn:active:not(:disabled) {
  transform: translateY(0);
}

.task-assignee-edit-modal .search-btn:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
  transform: none;
}

.task-assignee-edit-modal .search-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #FFFFFF;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.task-assignee-edit-modal .assignee-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.task-assignee-edit-modal .assignee-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #FFFFFF;
}

.task-assignee-edit-modal .assignee-item:hover {
  border-color: #F4CE53;
  background: #FFFBEB;
}

.task-assignee-edit-modal .assignee-item:active {
  transform: scale(0.98);
}

.task-assignee-edit-modal .assignee-item .assignee-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.task-assignee-edit-modal .assignee-item .assignee-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #F3F4F6;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-assignee-edit-modal .assignee-item .assignee-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.task-assignee-edit-modal .assignee-item .assignee-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: #1C0F0F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-assignee-edit-modal .assignee-item .assignee-email {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-assignee-edit-modal .assignee-item .select-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: rgba(244, 206, 83, 0.1);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.task-assignee-edit-modal .assignee-item:hover .select-indicator {
  background: rgba(244, 206, 83, 0.2);
}

.task-assignee-edit-modal .no-assignees {
  text-align: center;
  padding: 40px 20px;
  color: #6B7280;
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
}

.task-assignee-edit-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 0 0 12px 12px;
}

.task-assignee-edit-modal .cancel-btn {
  padding: 10px 20px;
  background: #FFFFFF;
  border: 2px solid #D1D5DB;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-assignee-edit-modal .cancel-btn:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.task-assignee-edit-modal .confirm-btn {
  padding: 10px 20px;
  background: #F4CE53;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-assignee-edit-modal .confirm-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.task-assignee-edit-modal .confirm-btn:active:not(:disabled) {
  transform: translateY(0);
}

.task-assignee-edit-modal .confirm-btn:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
}

/* 태스크 담당자 아이콘 호버 효과 */
.task-assignee {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;
  padding: 4px;
}


.task-assignee:active {
  transform: scale(0.95);
}

/* 태스크 로딩 및 빈 상태 스타일 */
.task-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.task-loading .loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #F4CE53;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.task-loading .loading-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
  margin: 0;
}

.no-tasks {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-tasks p {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #999999;
  margin: 0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .task-add-modal {
    width: 90vw;
    max-width: 400px;
    max-height: 90vh;
  }
  
  .task-add-modal .modal-body {
    padding: 16px 20px;
  }
  
  .date-range-container {
    flex-direction: column;
    gap: 8px;
  }
  
  .date-separator {
    display: none;
  }
  
  .participant-buttons {
    flex-direction: column;
  }
  
  .participant-btn {
    width: 100%;
    min-width: auto;
  }
  
  .task-add-modal .modal-footer {
    padding: 16px 20px;
    flex-direction: column;
  }
  
  .task-add-modal .btn-cancel,
  .task-add-modal .btn-primary {
    width: 100%;
  }
  
  .task-assignee-modal {
    width: 90vw;
    max-width: 400px;
    max-height: 80vh;
  }
  
  .task-assignee-modal .modal-body {
    padding: 16px 20px;
  }
  
  .task-assignee-modal .search-input-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .task-assignee-modal .search-btn {
    width: 100%;
    height: 44px;
    min-width: auto;
  }
  
  .task-assignee-modal .modal-footer {
    padding: 16px 20px;
    flex-direction: column;
  }
  
  .task-assignee-modal .cancel-btn,
  .task-assignee-modal .confirm-btn {
    width: 100%;
  }
  
  .task-assignee-edit-modal {
    width: 90vw;
    max-width: 400px;
    max-height: 80vh;
  }
  
  .task-assignee-edit-modal .modal-body {
    padding: 16px 20px;
  }
  
  .task-assignee-edit-modal .search-input-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .task-assignee-edit-modal .search-btn {
    width: 100%;
    height: 44px;
    min-width: auto;
  }
  
  .task-assignee-edit-modal .modal-footer {
    padding: 16px 20px;
    flex-direction: column;
  }
  
  .task-assignee-edit-modal .cancel-btn,
  .task-assignee-edit-modal .confirm-btn {
    width: 100%;
  }
  
  .manager-select-modal {
    width: 90vw;
    max-width: 400px;
    max-height: 80vh;
  }
  
  .manager-select-modal .modal-body {
    padding: 16px 20px;
  }
  
  .search-input-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-btn {
    width: 100%;
    height: 44px;
    min-width: auto;
  }
  
  .manager-select-modal .modal-footer {
    padding: 16px 20px;
    flex-direction: column;
  }
  
  .manager-select-modal .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
  
  .delete-confirm-modal {
    width: 90vw;
    max-width: 500px;
    height: auto;
    min-height: 300px;
  }
  
  .delete-modal-content {
    width: 100%;
    height: auto;
    min-height: 200px;
  }
  
  .delete-modal-title {
    font-size: 24px;
    line-height: 28px;
  }
  
  .delete-modal-message {
    font-size: 24px;
    line-height: 32px;
  }
  
  .delete-modal-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .delete-modal-actions .cancel-btn,
  .delete-modal-actions .delete-btn {
    width: 100%;
  }
}
</style>
