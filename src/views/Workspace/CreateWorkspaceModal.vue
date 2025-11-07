<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <div class="modal-title">워크스페이스 생성</div>
        <button class="close-button" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- 모달 콘텐츠 -->
      <div class="modal-content">
        <!-- 워크스페이스 이름 입력 -->
        <div class="input-section">
          <label class="input-label">워크스페이스 이름</label>
          <input
            v-model="workspaceName"
            type="text"
            class="text-input"
            placeholder="워크스페이스 이름을 입력하세요"
            maxlength="50"
          />
        </div>

        <!-- 템플릿 선택 -->
        <div class="input-section">
          <label class="input-label">워크스페이스 템플릿</label>
          <div class="template-options">
            <div 
              v-for="template in templates" 
              :key="template.value"
              class="template-option"
              :class="{ 'selected': selectedTemplate === template.value }"
              @click="selectTemplate(template.value)"
            >
              <div class="template-icon">
                <img :src="template.icon" :alt="template.name" :class="['template-icon-img', template.value === 'PRO' ? 'icon-pro' : 'icon-enterprise']" />
              </div>
              <div class="template-info">
                <div class="template-name">{{ template.name }}</div>
                <div class="template-description">{{ template.description }}</div>
              </div>
              <div class="template-radio">
                <div class="radio-dot" :class="{ 'active': selectedTemplate === template.value }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button class="ghost-btn" @click="closeModal">취소</button>
        <button 
          class="primary-btn" 
          @click="createWorkspace"
          :disabled="!workspaceName.trim() || !selectedTemplate || creating"
        >
          {{ creating ? '생성 중...' : '워크스페이스 생성' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: "CreateWorkspaceModal",
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      workspaceName: '',
      selectedTemplate: 'PRO',
      creating: false,
      templates: [
        {
          value: 'PRO',
          name: 'PRO',
          description: '개인 및 소규모 팀을 위한 기본 플랜',
          icon: '/src/assets/icons/chat/account-supervisor.svg'
        },
        {
          value: 'ENTERPRISE',
          name: 'ENTERPRISE',
          description: '대규모 조직을 위한 고급 플랜',
          icon: '/src/assets/icons/sidebar/company-svgrepo-com.svg'
        }
      ]
    };
  },
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  methods: {
    closeModal() {
      this.$emit('close');
      this.resetForm();
    },
    
    resetForm() {
      this.workspaceName = '';
      this.selectedTemplate = 'PRO';
      this.creating = false;
    },
    
    selectTemplate(template) {
      this.selectedTemplate = template;
    },
    
    async createWorkspace() {
      if (!this.workspaceName.trim() || !this.selectedTemplate) {
        return;
      }

      try {
        this.creating = true;
        const userId = localStorage.getItem('id') || 'user123';
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        
        const requestData = {
          workspaceTemplates: this.selectedTemplate,
          workspaceName: this.workspaceName.trim()
        };

        console.log('워크스페이스 생성 요청:', requestData);

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/workspace-service/workspace`,
          requestData,
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }
        );

        if (response.data.statusCode === 201) {
          console.log('워크스페이스 생성 성공:', response.data);
          // alert('워크스페이스가 성공적으로 생성되었습니다.');
          showSnackbar('워크스페이스가 성공적으로 생성되었습니다.', { color: 'success', timeout: 5000 });

          
          // 워크스페이스 목록 새로고침
          await this.workspaceStore.loadWorkspaces();
          
          // 새로 생성된 워크스페이스 선택
          const newWorkspaceId = response.data.result;
          const workspaces = this.workspaceStore.getWorkspaces;
          const newWorkspace = workspaces.find(w => w.workspaceId === newWorkspaceId);
          if (newWorkspace) {
            this.workspaceStore.setCurrentWorkspace(newWorkspace);
            
            // 새 워크스페이스 ID를 localStorage에 저장하여 새로고침 후에도 유지
            localStorage.setItem('selectedWorkspaceId', newWorkspaceId);
            localStorage.setItem('selectedWorkspaceName', newWorkspace.workspaceName);
            localStorage.setItem('selectedWorkspaceRole', newWorkspace.role);
            
            // 새 워크스페이스 홈으로 라우팅 (새로고침 없이 바로 이동)
            console.log('라우팅 시도:', this.$router);
            this.$router.push('/');
            console.log('라우팅 완료');
            
            // 라우팅이 안 되면 강제로 페이지 이동
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }
          
          this.closeModal();
        } else {
          // alert(response.data.statusMessage || '워크스페이스 생성에 실패했습니다.');
          showSnackbar(response.data.statusMessage || '워크스페이스 생성에 실패했습니다.', { color: 'error', timeout: 5000 });

        }
      } catch (error) {
        console.error('워크스페이스 생성 실패:', error);
        // alert(error.response?.data?.statusMessage || '워크스페이스 생성 중 오류가 발생했습니다.');
        showSnackbar(error.response?.data?.statusMessage || '워크스페이스 생성 중 오류가 발생했습니다.', { color: 'error', timeout: 5000 });

      } finally {
        this.creating = false;
      }
    }
  }
};
</script>

<style scoped>
/* 모달 오버레이 */
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
  backdrop-filter: blur(8px);
}

/* 모달 컨테이너 */
.modal-container {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 모달 헤더 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 30px;
  border-bottom: 1px solid #E0E0E0;
  background: #FFFFFF;
}

.modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 24px;
  line-height: 28px;
  color: #1C0F0F;
}

.close-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* 모달 콘텐츠 */
.modal-content {
  padding: 40px;
  flex: 1;
  overflow-y: auto;
}

/* 입력 섹션 */
.input-section {
  margin-bottom: 24px;
}

.input-section:last-child {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 21px;
  color: #1C0F0F;
  margin-bottom: 16px;
}

.text-input {
  width: 100%;
  height: 56px;
  padding: 0 20px;
  background: #FFFFFF;
  border: 2px solid #DDDDDD;
  border-radius: 12px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.text-input:focus {
  outline: none;
  border-color: #FFDD44;
}

.text-input::placeholder {
  color: #757575;
}

/* 템플릿 옵션 */
.template-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-option {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #FFFFFF;
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 16px;
}

.template-option:hover {
  border-color: #FFDD44;
  background: rgba(255, 221, 68, 0.05);
}

.template-option.selected {
  border-color: #FFDD44;
  background: rgba(255, 221, 68, 0.1);
}

.template-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  border-radius: 12px;
  flex-shrink: 0;
}

.template-icon-img {
  filter: brightness(0) saturate(100%) invert(27%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(95%) contrast(88%);
}

.icon-pro {
  width: 32px;
  height: 32px;
}

.icon-enterprise {
  width: 28px;
  height: 28px;
}

.template-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 21px;
  color: #1C0F0F;
}

.template-description {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #666666;
}

.template-radio {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-dot {
  width: 12px;
  height: 12px;
  border: 2px solid #DDDDDD;
  border-radius: 50%;
  transition: all 0.2s;
}

.radio-dot.active {
  border-color: #FFDD44;
  background: #FFDD44;
}

/* 모달 푸터 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding: 32px 40px;
  border-top: 1px solid #E0E0E0;
  background: #FFFFFF;
}

.ghost-btn {
  height: 48px;
  padding: 0 24px;
  background: #E0E0E0;
  border: none;
  border-radius: 12px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #666666;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ghost-btn:hover {
  background: #D0D0D0;
}

.primary-btn {
  height: 48px;
  padding: 0 24px;
  background: #FFDD44;
  border: none;
  border-radius: 12px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 19px;
  color: #1C0F0F;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-btn:hover:not(:disabled) {
  background: #FFD700;
}

.primary-btn:disabled {
  background: #CCCCCC;
  color: #999999;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 20px;
  }
}
</style>
