<template>
  <div class="create-group-page">
    <!-- 메인 컨텐츠 -->
    <div class="main-content">
      <!-- 헤더 섹션 -->
      <div class="header-section">
        <h1 class="page-title">사용자 그룹</h1>
        <p class="page-subtitle">새로운 사용자 그룹을 생성하고 멤버를 추가하세요.</p>
      </div>

      <!-- 그룹명 입력 및 사용자 검색 섹션 -->
      <div class="form-section">
        <div class="form-container-left">
          <label class="section-label">사용자 그룹명</label>
          <input 
            type="text" 
            class="group-name-input" 
            placeholder="그룹명을 입력하세요"
            v-model="newGroupName"
          />
          
          <label class="section-label">사용자 검색</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              class="user-search-input" 
              placeholder="사용자 이메일로 검색"
              v-model="userSearchQuery"
              @keyup.enter="searchUsers"
            />
            <button class="search-btn" @click="searchUsers">검색</button>
          </div>
        </div>
      </div>

      <!-- 사용자 목록과 선택된 멤버 섹션 -->
      <div class="user-selection-section">
        <div class="user-lists-container">
          <!-- 사용자 목록 -->
          <div class="user-list-section">
            <div class="form-container">
              <label class="section-label">사용자 목록</label>
              <div class="user-list-container">
                <div 
                  v-for="user in availableUsers" 
                  :key="user.userId" 
                  class="user-item"
                >
                  <div class="user-avatar"></div>
                  <div class="user-info">
                    <div class="user-name">{{ user.userName }}</div>
                    <div class="user-email">{{ user.userEmail }}</div>
                  </div>
                  <button 
                    class="add-user-btn" 
                    @click="addUser(user)"
                    :disabled="selectedUsers.find(u => u.userId === user.userId)"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <!-- 페이지네이션 -->
              <div class="pagination">
                <button class="page-btn prev-btn">← 이전</button>
                <button class="page-btn active">1</button>
                <button class="page-btn">2</button>
                <button class="page-btn">3</button>
                <span class="page-ellipsis">...</span>
                <button class="page-btn">10</button>
                <button class="page-btn next-btn">다음 →</button>
              </div>
              
              <!-- 더보기 버튼 -->
              <button class="more-btn">더보기</button>
            </div>
          </div>
          
          <!-- 화살표 -->
          <div class="arrow-container">
            <div class="arrow">→</div>
          </div>
          
          <!-- 선택된 멤버 -->
          <div class="selected-members-section">
            <div class="form-container">
              <label class="section-label">선택된 멤버</label>
              <div class="selected-members-container">
                <div 
                  v-for="user in selectedUsers" 
                  :key="user.userId" 
                  class="selected-user-item"
                >
                  <div class="user-avatar"></div>
                  <div class="user-info">
                    <div class="user-name">{{ user.userName }}</div>
                    <div class="user-email">{{ user.userEmail }}</div>
                  </div>
                  <button class="remove-user-btn" @click="removeUser(user.userId)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 액션 버튼들 -->
      <div class="action-section">
        <div class="action-buttons">
          <button class="cancel-btn" @click="goBack">취소</button>
          <button class="create-btn" @click="createGroup">그룹 생성</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: 'CreateUserGroup',
  data() {
    return {
      newGroupName: '',
      userSearchQuery: '',
      availableUsers: [],
      selectedUsers: []
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  mounted() {
    // 초기 로드 시에는 사용자 목록을 자동으로 로드하지 않음
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    
    // 사용 가능한 사용자 목록 로드 (그룹에 속하지 않은 참여자 조회)
    async loadAvailableUsers() {
      try {
        const response = await axios.post('http://localhost:8080/workspace-service/workspace/participants/not-in-groups/search', {
          workspaceId: this.workspaceStore.getCurrentWorkspaceId,
          searchKeyword: ""
        }, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.statusCode === 200) {
          this.availableUsers = response.data.result.userInfoList || [];
          console.log('그룹에 속하지 않은 참여자 목록:', this.availableUsers);
        }
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        this.availableUsers = [];
      }
    },
    
    // 사용자 검색 (POST 방식)
    async searchUsers() {
      if (!this.userSearchQuery.trim()) {
        this.loadAvailableUsers();
        return;
      }
      
      try {
        const response = await axios.post('http://localhost:8080/workspace-service/workspace/participants/not-in-groups/search', {
          workspaceId: this.workspaceStore.getCurrentWorkspaceId,
          searchKeyword: this.userSearchQuery.trim()
        }, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.statusCode === 200) {
          this.availableUsers = response.data.result.userInfoList || [];
          console.log('검색 결과:', this.availableUsers);
        }
      } catch (error) {
        console.error('사용자 검색 실패:', error);
        alert('사용자 검색에 실패했습니다.');
      }
    },
    
    // 사용자 추가
    addUser(user) {
      if (!this.selectedUsers.find(u => u.userId === user.userId)) {
        this.selectedUsers.push(user);
      }
    },
    
    // 사용자 제거
    removeUser(userId) {
      this.selectedUsers = this.selectedUsers.filter(user => user.userId !== userId);
    },
    
    // 그룹 생성
    async createGroup() {
      if (!this.newGroupName.trim()) {
        alert('그룹명을 입력해주세요.');
        return;
      }
      
      if (this.selectedUsers.length === 0) {
        alert('최소 1명의 멤버를 선택해주세요.');
        return;
      }
      
      try {
        const response = await axios.post('http://localhost:8080/workspace-service/groups', {
          workspaceId: this.workspaceStore.getCurrentWorkspaceId,
          userGroupName: this.newGroupName,
          userIdList: this.selectedUsers.map(user => user.userId)
        }, {
          headers: {
            'X-User-Id': localStorage.getItem('userId'),
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.data.statusCode === 201) {
          alert('그룹이 성공적으로 생성되었습니다.');
          this.$router.push('/admin');
        }
      } catch (error) {
        console.error('그룹 생성 실패:', error);
        if (error.response && error.response.data && error.response.data.statusMessage) {
          alert(error.response.data.statusMessage);
        } else {
          alert('그룹 생성에 실패했습니다.');
        }
      }
    }
  }
};
</script>

<style scoped>
.create-group-page {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  background: #F5F5F5 !important;
  font-family: 'Pretendard', sans-serif;
  overflow-y: auto;
  z-index: 100;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

/* 메인 컨텐츠 */
.main-content {
  padding: 20px;
  width: 100%;
  max-width: none;
  margin: 0;
}

/* 헤더 섹션 */
.header-section {
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0 0 8px 0;
  text-align: left;
}

.page-subtitle {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin: 0;
  text-align: left;
}

/* 폼 섹션 */
.form-section {
  margin-bottom: 24px;
}

.form-container {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: 100%;
}

.form-container .section-label:not(:first-child) {
  margin-top: 20px;
}

.form-container-left {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: fit-content;
  max-width: 600px;
  text-align: left;
}

.form-container-left .section-label:not(:first-child) {
  margin-top: 20px;
}

.section-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #1C0F0F;
  margin-bottom: 12px;
  text-align: left;
}

.group-name-input {
  width: 400px;
  height: 42px;
  padding: 0 17px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #F5F5F5;
  font-size: 14px;
  color: #757575;
  box-sizing: border-box;
}

.group-name-input:focus {
  outline: none;
  border-color: #FFDD44;
  background: #FFFFFF;
}

/* 검색 섹션 */
/* 검색 입력 래퍼 */
.search-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-search-input {
  width: 300px;
  height: 42px;
  padding: 0 17px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: #F5F5F5;
  font-size: 14px;
  color: #757575;
  box-sizing: border-box;
  text-align: left;
}

.search-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover {
  background: #FFDD44;
}

.user-search-input:focus {
  outline: none;
  border-color: #FFDD44;
  background: #FFFFFF;
}

/* search-icon-btn 스타일 제거 - 더 이상 사용하지 않음 */

/* 사용자 선택 섹션 */
.user-selection-section {
  margin-bottom: 24px;
}

/* 사용자 목록과 선택된 멤버 컨테이너 */
.user-lists-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
  margin: 0;
}

.user-list-section {
  flex: 1;
  min-width: 0;
}

.user-list-section .form-container {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: 100%;
}

.selected-members-section {
  flex: 1;
  min-width: 0;
}

.selected-members-section .form-container {
  background: #FFFFFF;
  border: 1px solid #E9ECEF;
  border-radius: 2px;
  padding: 20px;
  margin-bottom: 0;
  width: 100%;
}

.arrow-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 60px;
  padding: 0 20px;
}

.arrow {
  font-size: 24px;
  font-weight: bold;
  color: #2A2828;
}

/* 사용자 목록 */
.user-list-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  min-height: 400px;
  padding: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #E9ECEF;
  background: #FFFFFF;
  gap: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 24px;
  height: 24px;
  background: #2A2828;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  margin-left: 12px;
  text-align: left;
}

.user-name {
  font-size: 10px;
  font-weight: 700;
  color: #1C0F0F;
  line-height: 12px;
  margin-bottom: 2px;
  text-align: left;
}

.user-email {
  font-size: 10px;
  color: #666666;
  line-height: 12px;
  text-align: left;
}

.add-user-btn {
  width: 24px;
  height: 24px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-user-btn:disabled {
  background: #DDDDDD;
  cursor: not-allowed;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 15px 0;
  padding: 10px;
  background: #F8F9FA;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
}

.page-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #666666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.page-btn.active {
  color: #1C0F0F;
  font-weight: 700;
}

.page-btn:hover {
  background: #DDDDDD;
}

.page-ellipsis {
  font-size: 12px;
  color: #666666;
  padding: 4px;
}

/* 더보기 버튼 */
.more-btn {
  width: 100%;
  height: 42px;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 10px;
}

.more-btn:hover {
  background: #DDDDDD;
}

/* 선택된 멤버 */
.selected-members-container {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #E9ECEF;
  border-radius: 4px;
  background: #F8F9FA;
  min-height: 400px;
  padding: 8px;
}

.selected-user-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #E9ECEF;
  background: #FFFFFF;
  gap: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

.selected-user-item:last-child {
  border-bottom: none;
}

.remove-user-btn {
  width: 20px;
  height: 20px;
  background: #FF0000;
  border: none;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(180deg);
}

/* 안내 메시지 */
.info-section {
  margin: 30px 0;
  width: 100%;
}

.info-text {
  font-size: 12px;
  color: #999999;
  margin: 5px 0;
  line-height: 14px;
}

/* 액션 섹션 */
.action-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.cancel-btn {
  height: 42px;
  padding: 0 20px;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  color: #666666;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #DDDDDD;
}

.create-btn {
  height: 42px;
  padding: 0 20px;
  background: #FFE364;
  border: none;
  border-radius: 4px;
  color: #1C0F0F;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}
</style>