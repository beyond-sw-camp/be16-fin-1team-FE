<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">태스크 취소 처리</h3>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10" stroke="#F4CE53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="#F4CE53" stroke-width="2"/>
          </svg>
        </div>
        
        <div class="modal-content">
          <p class="confirm-message">
            <strong>'{{ taskName }}'</strong> 태스크를 취소 처리하시겠습니까?
          </p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-btn" @click="closeModal">취소</button>
        <button class="complete-btn" @click="confirmCancel" :disabled="loading">
          <span v-if="loading">처리 중...</span>
          <span v-else>취소 처리</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskCancelConfirmModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    taskName: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    confirmCancel() {
      this.$emit('confirm');
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-container {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 400px;
  max-width: 90vw;
  animation: slideInUp 0.3s ease-out;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 12px 12px 0 0;
}

.modal-title {
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

.modal-body {
  padding: 24px;
  text-align: center;
}

.success-icon {
  margin-bottom: 16px;
}

.modal-content {
  margin-bottom: 8px;
}

.confirm-message {
  font-family: 'Pretendard', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #1C0F0F;
  margin: 0 0 8px 0;
}

.info-text {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #666666;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB;
  border-radius: 0 0 12px 12px;
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
  color: #6B7280;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.complete-btn {
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
  transition: all 0.2s;
}

.complete-btn:hover:not(:disabled) {
  background: #E6B800;
  transform: translateY(-1px);
}

.complete-btn:active:not(:disabled) {
  transform: translateY(0);
}

.complete-btn:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
  transform: none;
}
</style>



