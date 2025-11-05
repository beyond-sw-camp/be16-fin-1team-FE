<template>
  <div class="profile-card">
    <div class="profile-card-avatar">
      <div class="avatar-container">
        <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="avatar" class="avatar-image" />
        <span v-else class="avatar-placeholder"></span>
      </div>
      <button class="avatar-upload-btn" @click="handleAvatarClick">
        <img src="@/assets/icons/user/camera.svg" alt="카메라" class="avatar-upload-icon" />
        <span>프로필 사진</span>
      </button>
      <input ref="avatarInput" type="file" accept="image/*" class="avatar-input" @change="handleAvatarChange" />
    </div>
    
    <div class="profile-card-info">
      <div class="profile-field">
        <span class="profile-label">이름</span>
        <input 
          type="text" 
          class="profile-value profile-input" 
          :value="profile.name || ''" 
          @input="handleNameChange"
          placeholder="이름을 입력하세요"
        />
      </div>
      <div class="profile-field">
        <span class="profile-label">이메일</span>
        <div class="profile-value profile-readonly email-field">
          <span>{{ profile.email || '-' }}</span>
          <span class="readonly-badge">수정 불가</span>
        </div>
      </div>
      <div class="profile-field">
        <span class="profile-label">전화번호</span>
        <input 
          type="text" 
          class="profile-value profile-input" 
          :value="profile.phone || ''" 
          @input="handlePhoneChange"
          placeholder="전화번호를 입력하세요"
        />
      </div>
      <div class="profile-field" v-if="profile.userGroupName">
        <span class="profile-label">사용자 그룹</span>
        <span class="profile-value profile-readonly">{{ profile.userGroupName }}</span>
      </div>
      
      <!-- 수정 버튼 -->
      <div class="profile-actions">
        <button 
          class="edit-btn" 
          @click="$emit('edit-save')"
          :disabled="isLoading"
        >
          {{ editMode ? '저장' : '수정' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileCard',
  props: {
    profile: {
      type: Object,
      default: () => ({
        name: '',
        email: '',
        phone: '',
        avatarUrl: null
      })
    },
    editMode: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['avatar-change', 'name-change', 'phone-change', 'edit-save'],
  methods: {
    handleAvatarClick() {
      this.$refs.avatarInput?.click();
    },
    handleAvatarChange(e) {
      const file = e?.target?.files?.[0];
      if (file) {
        this.$emit('avatar-change', file);
      }
    },
    handleNameChange(e) {
      this.$emit('name-change', e.target.value);
    },
    handlePhoneChange(e) {
      this.$emit('phone-change', e.target.value);
    }
  }
}
</script>

<style scoped>
.profile-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  padding: 32px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
}

.profile-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.profile-card-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--gap-m);
  margin-bottom: var(--gap-xl);
}

.avatar-container {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--chip);
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('@/assets/icons/user/account-circle.svg');
  background-size: 110% 110%;
  background-position: center;
  background-repeat: no-repeat;
}

.avatar-upload-btn {
  display: flex;
  align-items: center;
  gap: var(--gap-xxs);
  padding: var(--gap-xs) var(--gap-s);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.avatar-upload-btn:hover {
  background: var(--chip);
  border-color: var(--brand);
}

.avatar-upload-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
}

.avatar-input {
  display: none;
}

.profile-card-info {
  display: flex;
  flex-direction: column;
  gap: var(--gap-l);
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.profile-label {
  font-size: 14px;
  color: var(--text-weak);
  font-weight: 500;
}

.profile-value {
  font-size: 18px;
  color: var(--text);
  font-weight: 500;
  padding: 12px 16px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  width: 100%;
  box-sizing: border-box;
}

.profile-readonly {
  display: inline-block;
  min-height: 52px;
  line-height: 28px;
}

.profile-input {
  font-family: inherit;
  font-size: 18px;
  font-weight: 500;
  color: var(--text);
  outline: none;
  transition: all 0.2s ease;
}

.profile-input:focus {
  border-color: var(--brand);
  background: var(--surface);
}

.profile-input::placeholder {
  color: var(--text-weak);
  opacity: 0.6;
}

.email-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-s);
}

.readonly-badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-weak);
  padding: 4px 8px;
  background: var(--chip);
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.profile-actions {
  margin-top: var(--gap-l);
  display: flex;
  justify-content: flex-end;
}

.edit-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 12px;
  border: 1px solid #F2C94C;
  background: var(--brand);
  color: #3A2E00;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.2px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.edit-btn:hover:not(:disabled) {
  background: #FFD633;
  transform: translateY(-1px);
}

.edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-btn:focus,
.edit-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 204, 51, 0.3);
}
</style>
