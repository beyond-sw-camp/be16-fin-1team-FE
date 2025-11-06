<template>
  <div class="create-permission-page">
    <!-- 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
            <path d="M19.5 8L12 15.5L19.5 23" stroke="#2A2828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="header-title">권한 그룹</div>
        <div class="header-spacer"></div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="page-content">
      <div class="content-container">
        <!-- 제목 섹션 -->
        <div class="title-section">
          <h1 class="main-title">권한 그룹</h1>
          <p class="sub-title">커스터마이징한 권한 그룹을 생성하세요</p>
        </div>

        <!-- 권한명 입력 -->
        <div class="input-section">
          <div class="input-container">
            <input 
              type="text" 
              v-model="permissionName"
              placeholder="권한명을 입력해주세요"
              class="permission-input"
            />
          </div>
        </div>

        <!-- 권한 옵션들 -->
        <div class="permissions-section">
          <div class="permission-option" v-for="permission in permissions" :key="permission.id">
            <div class="permission-card">
              <div class="permission-content">
                <!-- 아이콘 -->
                <div class="permission-icon">
                  <div class="icon-circle"></div>
                </div>
                
                <!-- 텍스트 영역 -->
                <div class="permission-text">
                  <div class="permission-title">{{ permission.title }}</div>
                  <div class="permission-description">{{ permission.description }}</div>
                </div>
                
                <!-- 토글 스위치 -->
                <div class="permission-toggle">
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      v-model="permission.enabled"
                      @change="updatePermission(permission.id, permission.enabled)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 버튼 섹션 -->
        <div class="button-section">
          <button class="cancel-btn" @click="goBack">취소</button>
          <button class="create-btn" @click="createPermissionGroup">권한 생성</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';
import { showSnackbar } from '@/services/snackbar.js';

export default {
  name: "CreatePermissionGroup",
  data() {
    return {
      permissionName: '',
      permissions: [
        {
          id: 'project_create',
          title: '프로젝트 생성',
          description: '새로운 프로젝트를 생성할 수 있는 권한을 허용합니다.',
          enabled: false
        },
        {
          id: 'stone_create',
          title: '스톤 생성',
          description: '새로운 스톤을 생성할 수 있는 권한을 허용합니다.',
          enabled: false
        },
        {
          id: 'project_file_view',
          title: '프로젝트별 파일 조회',
          description: '프로젝트별로 파일을 조회할 수 있는 권한을 허용합니다.',
          enabled: false
        },
        {
          id: 'stone_file_view',
          title: '스톤별 파일 조회',
          description: '스톤별로 파일을 조회할 수 있는 권한을 허용합니다.',
          enabled: false
        },
        {
          id: 'workspace_file_view',
          title: '워크스페이스별 파일 조회',
          description: '워크스페이스별로 파일을 조회할 수 있는 권한을 허용합니다.',
          enabled: false
        }
      ]
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    
    updatePermission(permissionId, enabled) {
      console.log(`권한 ${permissionId} ${enabled ? '활성화' : '비활성화'}`);
    },
    
    async createPermissionGroup() {
      if (!this.permissionName.trim()) {
        alert('권한명을 입력해주세요.');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId') || 'user123';
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || 'ws_1';
        
        // 5개 권한으로 변경된 순서에 맞춰 권한 배열 생성
        // 순서: PROJECT_CREATE, STONE_CREATE, PROJECT_FILE_VIEW, STONE_FILE_VIEW, WORKSPACE_FILE_VIEW
        const accessList = [
          this.permissions.find(p => p.id === 'project_create')?.enabled || false,
          this.permissions.find(p => p.id === 'stone_create')?.enabled || false,
          this.permissions.find(p => p.id === 'project_file_view')?.enabled || false,
          this.permissions.find(p => p.id === 'stone_file_view')?.enabled || false,
          this.permissions.find(p => p.id === 'workspace_file_view')?.enabled || false
        ];
        
        const requestData = {
          workspaceId: workspaceId,
          accessGroupName: this.permissionName,
          accessList: accessList
        };

        console.log('요청 데이터:', requestData);

        const response = await axios.post(
          'http://localhost:8080/workspace-service/access/custom',
          requestData,
          {
            headers: {
              'X-User-Id': userId,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.statusCode === 201) {
          showSnackbar('권한 그룹이 성공적으로 생성되었습니다.');
          this.goBack();
        }
      } catch (error) {
        console.error('권한 그룹 생성 실패:', error);
        if (error.response && error.response.data) {
          alert(`권한 그룹 생성에 실패했습니다: ${error.response.data.statusMessage || '알 수 없는 오류'}`);
        } else {
          alert('권한 그룹 생성에 실패했습니다. 다시 시도해주세요.');
        }
      }
    }
  }
};
</script>

<style scoped>
.create-permission-page {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

.page-header {
  background: #F5F5F5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  flex-shrink: 0;
  z-index: 200;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  width: 31px;
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.header-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
}

.header-spacer {
  flex: 1;
}

.page-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: #F5F5F5;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
}

.title-section {
  margin-bottom: 40px;
}

.main-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  margin: 0 0 15px 0;
}

.sub-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  margin: 0;
}

.input-section {
  margin-bottom: 40px;
}

.input-container {
  max-width: 400px;
}

.permission-input {
  width: 100%;
  height: 42px;
  padding: 0 17px;
  background: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-radius: 25px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
  box-sizing: border-box;
}

.permission-input::placeholder {
  color: #757575;
}

.permission-input:focus {
  outline: none;
  border-color: #FFDD44;
}

.permissions-section {
  margin-bottom: 60px;
}

.permission-option {
  margin-bottom: 16px;
}

.permission-card {
  background: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s ease;
}

.permission-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.permission-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.permission-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle {
  width: 8px;
  height: 8px;
  background: #2A2828;
  border-radius: 50%;
}

.permission-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.permission-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  margin: 0;
}

.permission-description {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
  margin: 0;
}

.permission-toggle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #CCCCCC;
  transition: 0.2s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #FFE364;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.permission-description {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}

.button-section {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid #DDDDDD;
}

.cancel-btn {
  width: 120px;
  height: 45px;
  background: #F5F5F5;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #E9E9E9;
}

.create-btn {
  width: 120px;
  height: 45px;
  background: #FFE364;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 17px;
  color: #1C0F0F;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-btn:hover {
  background: #FFDD44;
  transform: translateY(-1px);
}

@media (max-width: 1200px) {
  .create-permission-page {
    left: 240px;
    width: calc(100vw - 240px);
  }
}

@media (max-width: 768px) {
  .create-permission-page {
    left: 0;
    top: 83px;
    width: 100vw;
    height: calc(100vh - 83px);
  }
  
  .page-content {
    padding: 20px;
  }
  
  .content-container {
    max-width: 100%;
  }
  
  .button-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .cancel-btn,
  .create-btn {
    width: 100%;
  }
}
</style>
