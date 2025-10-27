<template>
  <div v-if="isOpen" class="project-modal-container">
      <div class="project-modal-content">
        <h2 class="modal-title">프로젝트 생성</h2>
        
        <div class="form-section">
          <div class="form-field">
            <label class="form-label">프로젝트명 <span class="required">*</span></label>
            <input 
              v-model="formData.name" 
              type="text" 
              class="form-input"
              placeholder="프로젝트명을 입력하세요"
            />
          </div>
          
          <div class="form-field">
            <label class="form-label">시작일 <span class="required">*</span></label>
            <input 
              v-model="formData.startDate" 
              type="date" 
              class="form-input"
            />
          </div>

          <div class="form-field">
            <label class="form-label">종료일 <span class="required">*</span></label>
            <input 
              v-model="formData.endDate" 
              type="date" 
              class="form-input"
            />
          </div>

          <div class="form-field">
            <label class="form-label">프로젝트 목표</label>
            <textarea 
              v-model="formData.objective" 
              class="form-textarea"
              placeholder="프로젝트 목표를 입력하세요"
              rows="2"
            ></textarea>
          </div>
          
          <div class="form-field">
            <label class="form-label">프로젝트 설명</label>
            <textarea 
              v-model="formData.description" 
              class="form-textarea"
              placeholder="프로젝트 설명을 입력하세요"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-field">
            <label class="form-label">담당자 <span class="required">*</span></label>
            <select 
              v-model="formData.managerId" 
              class="form-input"
            >
              <option value="">담당자를 선택하세요</option>
              <option 
                v-for="participant in participants" 
                :key="participant.workspaceParticipantId"
                :value="participant.workspaceParticipantId"
                :disabled="participant.deleted"
              >
                {{ participant.userName }}
              </option>
            </select>
          </div>
          
          <div class="form-field">
            <label class="form-label">채팅방 생성</label>
            <div class="checkbox-group">
              <input 
                v-model="formData.createChat" 
                type="checkbox" 
                class="checkbox-input"
                id="createChat"
              />
              <label for="createChat" class="checkbox-label">프로젝트와 함께 채팅방 생성</label>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeModal">
            취소
          </button>
          <button class="btn-create" @click="handleCreate" :disabled="isLoading">
            {{ isLoading ? '생성 중...' : '프로젝트 추가' }}
          </button>
        </div>
        
        <div class="modal-close" @click="closeModal">✕</div>
      </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: 'CreateProjectModal',
  props: {
    modelValue: Boolean
  },
  data() {
    return {
      formData: {
        name: '',
        startDate: '',
        endDate: '',
        objective: '',
        description: '',
        managerId: '',
        createChat: false
      },
      participants: [],
      isLoading: false
    };
  },
  computed: {
    isOpen: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    workspaceStore() {
      return useWorkspaceStore();
    }
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.loadParticipants();
      }
    }
  },
  mounted() {
    window.addEventListener('openCreateProjectModal', this.openModal);
  },
  beforeUnmount() {
    window.removeEventListener('openCreateProjectModal', this.openModal);
  },
  methods: {
    openModal() {
      this.isOpen = true;
      this.loadParticipants();
    },
    closeModal() {
      this.isOpen = false;
      this.resetForm();
    },
    resetForm() {
      this.formData = {
        name: '',
        startDate: '',
        endDate: '',
        objective: '',
        description: '',
        managerId: '',
        createChat: false
      };
    },
    async loadParticipants() {
      const workspaceId = this.workspaceStore.getCurrentWorkspaceId;
      if (!workspaceId) {
        console.error('워크스페이스 ID가 없습니다.');
        return;
      }

      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const userId = localStorage.getItem('id');
        
        const response = await axios.get(
          `${baseURL}/workspace-service/workspace/${workspaceId}/participants`,
          {
            headers: {
              'X-User-Id': userId
            },
            params: {
              page: 0,
              size: 100 // 충분히 큰 크기로 모든 참여자 가져오기
            }
          }
        );

        if (response.data.statusCode === 200) {
          const result = response.data.result;
          // API 응답이 페이지네이션을 사용하는 경우
          this.participants = result.content || result || [];
          
          // 기본적으로 자신을 담당자로 선택
          const currentUserId = localStorage.getItem('id');
          const currentParticipant = this.participants.find(
            p => p.userId === currentUserId && !p.deleted
          );
          if (currentParticipant) {
            this.formData.managerId = currentParticipant.workspaceParticipantId;
          }
        }
      } catch (error) {
        console.error('참여자 목록 로드 실패:', error);
        alert('참여자 목록을 불러오는데 실패했습니다.');
      }
    },
    async handleCreate() {
      // 유효성 검사
      if (!this.formData.name.trim()) {
        alert('프로젝트명을 입력해주세요.');
        return;
      }
      if (!this.formData.startDate) {
        alert('시작일을 선택해주세요.');
        return;
      }
      if (!this.formData.endDate) {
        alert('종료일을 선택해주세요.');
        return;
      }
      if (!this.formData.managerId) {
        alert('담당자를 선택해주세요.');
        return;
      }

      // 날짜 유효성 검사
      if (new Date(this.formData.endDate) < new Date(this.formData.startDate)) {
        alert('종료일이 시작일보다 이전일 수 없습니다.');
        return;
      }

      this.isLoading = true;
      
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const userId = localStorage.getItem('id');
        const workspaceId = this.workspaceStore.getCurrentWorkspaceId;

        const requestBody = {
          workspaceId: workspaceId,
          projectName: this.formData.name,
          startTime: `${this.formData.startDate}T09:00:00`,
          endTime: `${this.formData.endDate}T18:00:00`,
          projectObjective: this.formData.objective || '',
          projectDescription: this.formData.description || '',
          projectManagerId: this.formData.managerId,
          chatCreation: this.formData.createChat
        };

        const response = await axios.post(
          `${baseURL}/workspace-service/project`,
          requestBody,
          {
            headers: {
              'X-User-Id': userId,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.statusCode === 201) {
          const projectId = response.data.result;
          
          // 이벤트 발생하여 프로젝트 목록 새로고침
          window.dispatchEvent(new CustomEvent('projectCreated', { detail: { projectId } }));
          
          this.closeModal();
          
          // 생성된 프로젝트 페이지로 라우팅
          this.$router.push({ path: '/project', query: { id: projectId } });
        } else {
          alert('프로젝트 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('프로젝트 생성 실패:', error);
        const errorMessage = error.response?.data?.statusMessage || '프로젝트 생성에 실패했습니다.';
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.project-modal-container {
  background: rgba(0, 0, 0, 0.8);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.project-modal-content {
  background: #F5F5F5;
  border: 1px solid #000000;
  box-shadow: 4px 4px 32px rgba(0, 0, 0, 0.25), -4px -4px 32px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  padding: 40px 50px;
  width: 764px;
  max-height: 718px;
  overflow-y: auto;
  position: relative;
}

.modal-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  margin-bottom: 30px;
  text-align: center;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 24px;
  line-height: 29px;
  color: #7C7C7C;
}

.required {
  color: #F4CE53;
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
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 96px;
  background: #FFFFFF;
  box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.25);
  border-radius: 15px;
  border: none;
  padding: 20px;
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  resize: vertical;
  box-sizing: border-box;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  color: #7C7C7C;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
}

.btn-cancel {
  width: 120px;
  height: 42px;
  background: #FFFFFF;
  border: 1px solid #2A2828;
  border-radius: 8px;
  color: #2A2828;
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background: #F5F5F5;
}

.btn-create {
  width: 142px;
  height: 42px;
  background: #2A2828;
  border-radius: 8px;
  border: none;
  color: #F5F5F5;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  padding: 0 20px;
  box-sizing: border-box;
}

.btn-create:hover {
  background: #1a1818;
}

.btn-create:disabled {
  background: #CCCCCC;
  cursor: not-allowed;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #000;
}
</style>
