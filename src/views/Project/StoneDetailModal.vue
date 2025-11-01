<template>
  <div v-if="isVisible" class="stone-detail-modal" :class="{ 'expanded': isExpandedToCenter }" @click="closeModal" @mounted="console.log('스톤 상세 모달 표시됨')">
    <div class="modal-content" :class="{ 'expanded': isExpandedToCenter }" @click.stop>
      <!-- 모달 헤더 -->
      <div class="modal-header" @mounted="console.log('모달 헤더 렌더링됨')">
        <div class="header-left">
          <button class="close-modal-btn" @click.stop="closeModal" title="모달 닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#666666" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.08,4.08L20,12L12.08,19.92L10.67,18.5L16.17,13H2V11H16.17L10.67,5.5L12.08,4.08M20,12V22H22V2H20V12Z" />
            </svg>
          </button>
          <button class="expand-center-btn" @click.stop="toggleExpandToCenter" title="중앙 확장">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#666666" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z" />
            </svg>
          </button>
        </div>
        <div class="header-right">
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
            <div class="stone-status" :class="getStoneStatusClass(currentStoneData?.stoneStatus)">
              {{ getStoneStatusText(currentStoneData?.stoneStatus) }}
            </div>
          </div>
          <div class="action-buttons">
            <button 
              v-if="currentStoneData?.stoneStatus === 'PROGRESS'" 
              class="complete-stone-btn" 
              @click="completeStone" 
              title="스톤 완료"
            >
              완료
            </button>
            <button 
              v-if="!currentStoneData?.isProject" 
              class="edit-stone-btn" 
              @click="editStone" 
              title="스톤 수정"
            >
              수정
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 13H8M16 17H8M10 9H8" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>설명</span>
            </div>
            <div class="info-value">{{ currentStoneData?.projectDescription || '설명 없음' }}</div>
          </div>
          
          <!-- 스톤 개수 -->
          <div class="info-section">
            <div class="info-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 13H12.01M12 17H12.01M16 13H16.01M16 17H16.01M8 13H8.01M8 17H8.01" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>기간</span>
          </div>
          <div class="info-value">{{ formatDateRange(currentStoneData?.startTime, currentStoneData?.endTime) }}</div>
        </div>

        <!-- 스톤 정보 (일반 스톤인 경우에만 표시) -->
        <div v-if="!currentStoneData?.isProject">
          <!-- 담당자 정보 -->
          <div class="info-section">
            <div class="info-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>담당자</span>
            </div>
            <div class="info-value-with-action">
              <span class="info-value" :class="{ 'empty-value': !currentStoneData?.manager || currentStoneData?.manager === '김올빗' }">{{ currentStoneData?.manager || '김올빗' }}</span>
              <button class="edit-user-btn" @click="editManager" title="담당자 수정">
                <div class="icon-with-plus">
                  <!-- 담당자 아이콘 -->
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" :stroke="currentStoneData?.manager && currentStoneData?.manager !== '김올빗' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" :stroke="currentStoneData?.manager && currentStoneData?.manager !== '김올빗' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <!-- + 기호 (오른쪽에 별도 위치) -->
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" :stroke="currentStoneData?.manager && currentStoneData?.manager !== '김올빗' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- 참여자 정보 -->
          <div class="info-section">
            <div class="info-label" :class="{ 'empty-label': !currentStoneData?.participants || currentStoneData?.participants === '비어 있음' }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? 'rgba(244, 206, 83, 0.4)' : 'rgba(102, 102, 102, 0.4)'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="9" cy="7" r="4" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? 'rgba(244, 206, 83, 0.4)' : 'rgba(102, 102, 102, 0.4)'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M23 21V19C23 17.9391 22.5786 16.9217 21.8284 16.1716C21.0783 15.4214 20.0609 15 19 15H16" stroke="rgba(102, 102, 102, 0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="rgba(102, 102, 102, 0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>참여자</span>
            </div>
            <div class="info-value-with-action">
              <span class="info-value" :class="{ 'empty-value': !currentStoneData?.participants || currentStoneData?.participants === '비어 있음' }">{{ currentStoneData?.participants || '비어 있음' }}</span>
              <button class="edit-user-btn" @click="editParticipants" title="참여자 수정">
                <div class="icon-with-plus">
                  <!-- 참여자 아이콘 -->
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="9" cy="7" r="4" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M23 21V19C23 17.9391 22.5786 16.9217 21.8284 16.1716C21.0783 15.4214 20.0609 15 19 15H16" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="19" cy="7" r="3" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <!-- + 기호 (오른쪽에 별도 위치) -->
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" :stroke="currentStoneData?.participants && currentStoneData?.participants !== '비어 있음' ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- 채팅방 -->
          <div class="info-section">
            <div class="info-label" :class="{ 'empty-label': !currentStoneData?.chatCreation }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" :stroke="currentStoneData?.chatCreation ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 8H13.01M9 8H9.01M17 8H17.01" :stroke="currentStoneData?.chatCreation ? '#F4CE53' : '#999999'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>채팅방</span>
            </div>
            <div class="info-value">
              <div class="chat-link" :class="{ 'disabled': !currentStoneData?.chatCreation }">
                <span :class="{ 'empty-value': !currentStoneData?.chatCreation }">{{ currentStoneData?.chatCreation ? '바로가기' : '채팅방 없음' }}</span>
                <svg v-if="currentStoneData?.chatCreation" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="#F6D365" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 3H21V9" stroke="#F6D365" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 14L21 3" stroke="#F6D365" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 문서함 -->
          <div class="info-section">
            <div class="info-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 13H8M16 17H8M10 9H8" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>문서함</span>
            </div>
            <div class="info-value">
              <div class="document-link">
                <span>{{ currentStoneData?.documentLink || '바로가기' }}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="#F6D365" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15 3H21V9" stroke="#F6D365" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 14L21 3" stroke="#F6D365" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
            <div class="section-title">태스크</div>
            <div class="task-list">
              <!-- 태스크 로딩 상태 -->
              <div v-if="isLoadingTasks" class="task-loading">
                <div class="loading-spinner"></div>
                <p class="loading-text">태스크 목록을 불러오는 중...</p>
              </div>
              
              <!-- 태스크 목록 -->
              <div v-else-if="taskList.length > 0">
                <div v-for="task in taskList" :key="task.id" class="task-item">
                <div class="task-checkbox" :class="{ 'completed': task.completed }" @click="toggleTaskComplete(task)">
                  <svg v-if="task.completed" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="task-content">
                  <div class="task-name" :class="{ 'completed': task.completed }">{{ task.name }}</div>
                  <div class="task-period">{{ formatDateRange(task.startTime, task.endTime) }}</div>
                </div>
                  <div class="task-assignee">
                    <div class="assignee-info">
                      <div class="assignee-name">{{ task.assigneeName || '담당자 없음' }}</div>
                    </div>
                    <div class="assignee-icons">
                      <div class="icon-button" @click="openTaskAssigneeEditModal(task)" title="담당자 변경">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="user-icon">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
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
                  <path d="M12 5V19M5 12H19" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ isStoneCompleted ? '완료된 스톤' : '태스크 추가' }}</span>
              </button>
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
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">종료일</label>
            <input 
              type="date" 
              class="form-input" 
              v-model="editForm.endDate"
            />
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
                v-model="editForm.createChat"
                id="editCreateChat"
                :disabled="isChatCreationDisabled"
              />
              <label for="editCreateChat" class="checkbox-label" :class="{ 'disabled': isChatCreationDisabled }"></label>
            </div>
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
              <div class="assignee-display" @click="openTaskAssigneeModal">
                <div class="assignee-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="assignee-name" :class="{ 'empty': !taskForm.assigneeName }">
                    {{ taskForm.assigneeName || '담당자를 선택하세요' }}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
import { deleteStone, modifyStoneManager, searchWorkspaceParticipants, modifyStone, getTaskList, createTask, getStoneParticipantList, modifyTask, deleteTask, completeTask, completeStone } from '@/services/stoneService.js';
import { showSnackbar } from '@/services/snackbar.js';
import TaskDeleteConfirmModal from '@/components/modal/TaskDeleteConfirmModal.vue';
import TaskCompleteConfirmModal from '@/components/modal/TaskCompleteConfirmModal.vue';
import StoneCompleteConfirmModal from '@/components/modal/StoneCompleteConfirmModal.vue';

export default {
  name: 'StoneDetailModal',
  components: {
    TaskDeleteConfirmModal,
    TaskCompleteConfirmModal,
    StoneCompleteConfirmModal
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    },
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
        createChat: false
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
      showStoneCompleteConfirmModal: false,
      stoneCompleteLoading: false,
      loadedStoneData: null
    }
  },
  computed: {
    // 현재 사용할 스톤 데이터 (stoneData가 있으면 사용, 없으면 stoneId로 로드)
    currentStoneData() {
      return this.stoneData || this.loadedStoneData;
    },
    
    // 채팅방 생성 체크박스 비활성화 여부
    isChatCreationDisabled() {
      // 스톤에 이미 채팅방이 생성되어 있으면 비활성화
      return this.currentStoneData?.chatCreation === true;
    },
    
    // 스톤이 완료되었는지 확인
    isStoneCompleted() {
      return this.currentStoneData?.stoneStatus === 'COMPLETED' || this.currentStoneData?.milestone === 100;
    }
  },
  methods: {
    // stoneId로 스톤 데이터 로드
    async loadStoneData(stoneId) {
      try {
        this.isLoading = true;
        
        // 스톤 상세 정보 조회 API 호출
        const response = await fetch(`/api/stones/${stoneId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('스톤 데이터를 불러올 수 없습니다.');
        }
        
        const stoneData = await response.json();
        this.loadedStoneData = stoneData;
        
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
    
    openEditModal() {
      console.log('=== 스톤 수정 모달 열기 ===');
      console.log('현재 stoneData:', this.stoneData);
      
      // 현재 스톤 데이터로 폼 초기화
      this.editForm = {
        stoneName: this.currentStoneData?.stoneName || '',
        startDate: this.formatDateForInput(this.currentStoneData?.startTime),
        endDate: this.formatDateForInput(this.currentStoneData?.endTime),
        createChat: this.currentStoneData?.chatCreation || false
      };
      
      console.log('초기화된 editForm:', this.editForm);
      this.showEditModal = true;
    },
    
    closeEditModal() {
      this.showEditModal = false;
      this.editForm = {
        stoneName: '',
        startDate: '',
        endDate: '',
        createChat: false
      };
    },
    
    formatDateForInput(dateStr) {
      if (!dateStr) return '';
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    },
    
    async saveStoneEdit() {
      console.log('=== 스톤 수정 저장 시작 ===');
      console.log('현재 editForm:', this.editForm);
      
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
      
      try {
        this.isUpdating = true;
        console.log('스톤 수정 API 호출 시작...');
        
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
          chatCreation: this.editForm.createChat
        });
        
        console.log('=== 스톤 수정 API 응답 ===');
        console.log('API 응답:', response);
        
        // 백엔드에서 리턴된 수정된 스톤 ID 사용
        const updatedStoneId = response.result || stoneId;
        console.log('수정된 스톤 ID:', updatedStoneId);
        
        showSnackbar('스톤이 성공적으로 수정되었습니다.', { color: 'success' });
        
        // 부모 컴포넌트에 수정 완료 알림
        this.$emit('stone-updated', {
          stoneId: updatedStoneId,
          stoneName: this.editForm.stoneName,
          startTime: this.editForm.startDate,
          endTime: this.editForm.endDate,
          chatCreation: this.editForm.createChat
        });
        
        // 전역 이벤트 발생으로 다른 컴포넌트들에 알림
        const eventData = {
          stoneId: updatedStoneId,
          stoneName: this.editForm.stoneName,
          startTime: this.editForm.startDate,
          endTime: this.editForm.endDate,
          chatCreation: this.editForm.createChat
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
    
    openTaskAddModal() {
      console.log('=== 태스크 추가 모달 열기 ===');
      console.log('현재 stoneData:', this.stoneData);
      
      // 현재 스톤의 기간으로 기본값 설정
      this.taskForm = {
        title: '',
        startDate: this.formatDateForInput(this.currentStoneData?.startTime),
        endDate: this.formatDateForInput(this.currentStoneData?.endTime)
      };
      
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
    
    // 태스크 완료 처리
    toggleTaskComplete(task) {
      // 이미 완료된 태스크는 처리하지 않음
      if (task.completed) {
        return;
      }
      
      this.taskToComplete = task;
      this.showCompleteConfirmModal = true;
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
        
        // 실제 태스크 수정 API 호출 (담당자만 변경)
        const response = await modifyTask({
          taskId: this.editingTaskId,
          taskName: currentTask.name,
          startTime: currentTask.startTime,
          endTime: currentTask.endTime,
          NewManagerUserId: selectedAssignee.userId
        });
        
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
      console.log('참여자 수정 클릭:', this.stoneData)
      // TODO: 참여자 수정 API 연동
      this.$emit('edit-participants', this.stoneData)
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
        }).replace(/\./g, '.').replace(/\s/g, '')
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
      handler(newStoneId) {
        if (newStoneId && !this.stoneData) {
          this.loadStoneData(newStoneId);
        }
      },
      immediate: true
    },
    
    // 스톤 데이터가 변경될 때 태스크 목록 다시 로드
    stoneData: {
      handler(newStoneData) {
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
  border-bottom: 1px solid #E0E0E0;
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
.trash-btn {
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
.trash-btn:focus {
  outline: none !important;
  box-shadow: none !important;
}

.close-modal-btn svg,
.expand-center-btn svg,
.collapse-btn svg,
.expand-btn svg,
.trash-btn svg {
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
.trash-btn:active {
  transform: scale(0.95);
}

.edit-stone-btn,
.delete-stone-btn,
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
}

.edit-stone-btn {
  background: #F9FAFB;
  color: #374151;
  border-color: #D1D5DB;
}

.edit-stone-btn:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
  transform: translateY(-1px);
}

.edit-stone-btn:active {
  transform: translateY(0);
  background: #E5E7EB;
}

.delete-stone-btn {
  background: #FEF2F2;
  color: #DC2626;
  border-color: #FECACA;
}

.delete-stone-btn:hover {
  background: #FEE2E2;
  border-color: #FCA5A5;
  transform: translateY(-1px);
}

.delete-stone-btn:active {
  transform: translateY(0);
  background: #FECACA;
}

.complete-stone-btn {
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
  padding: 30px;
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
  margin-bottom: 30px;
}

.stone-title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  flex: 1;
  text-align: left;
}

.info-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 12px 0;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #666666;
  white-space: nowrap;
  flex-shrink: 0;
}

.info-label svg {
  flex-shrink: 0;
}

.info-value {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 22px;
  color: #1C0F0F;
  text-align: right;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  max-width: 100%;
}

.info-value-with-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
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
  opacity: 0.7;
}

.edit-user-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  opacity: 1;
  transform: scale(1.1);
}

.edit-user-btn:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.1);
}

.icon-with-plus {
  display: flex;
  align-items: center;
  gap: 1px;
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
  margin: 30px 0;
}

.tasks-section {
  margin-top: 20px;
}

.section-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #666666;
  margin-bottom: 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid rgba(42, 40, 40, 0.1);
}

.task-item:last-child {
  border-bottom: none;
}

.task-checkbox {
  width: 24px;
  height: 24px;
  border: 3px solid #F4CE53;
  border-radius: 2px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.task-checkbox.completed {
  background: #F4CE53;
  border-color: #F4CE53;
  cursor: not-allowed;
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #666666;
}

.task-name.completed {
  color: rgba(102, 102, 102, 0.5);
  text-decoration: line-through;
}

.task-period {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #666666;
}

.task-assignee {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
}

.task-assignee .assignee-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.task-assignee .assignee-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  color: #374151;
  background: #F3F4F6;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #E5E7EB;
}

.assignee-icons {
  display: flex;
  align-items: center;
  gap: 8px;
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
  margin-top: 20px;
  padding-top: 20px;
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

.add-task-btn:hover {
  background: #F4CE53;
  color: #FFFFFF;
  border-color: #F4CE53;
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
    font-size: 24px;
    line-height: 28px;
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

.edit-stone-modal .form-label {
  display: block;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #374151;
  margin-bottom: 8px;
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

.delete-btn {
  padding: 10px 20px;
  background: #EF4444;
  border: none;
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 14px;
  line-height: 20px;
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.delete-btn:hover:not(:disabled) {
  background: #DC2626;
  transform: translateY(-1px);
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.15);
}

.delete-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
}

.delete-btn:disabled {
  background: #9CA3AF;
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

.task-assignee:hover {
  background: rgba(244, 206, 83, 0.1);
  transform: scale(1.1);
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
  
  .cancel-btn,
  .delete-btn {
    width: 100%;
  }
}
</style>
