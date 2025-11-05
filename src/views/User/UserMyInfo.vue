<template>
  <div class="my-info-page">
    <!-- 섹션 헤더 -->
    <SectionHeader />
    
    <div class="myinfo-shell">
      <!-- ① 왼쪽: 프로필 카드 -->
      <section class="col col-left">
        <SectionCard title="사용자 정보">
          <ProfileCard 
            :profile="profileData" 
            :edit-mode="editMode"
            :is-loading="isLoading"
            @avatar-change="handleAvatarChange"
            @name-change="handleNameChange"
            @phone-change="handlePhoneChange"
            @edit-save="handleEditSave"
          />
        </SectionCard>
      </section>

      <!-- ② 오른쪽: 워크스페이스 권한 카드 -->
      <section class="col col-right">
        <SectionCard 
          v-if="myAccess"
          title="워크스페이스 권한"
        >
          <PermissionList :items="myAccess" />
        </SectionCard>
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { showSnackbar } from '../../services/snackbar.js';
import SectionHeader from '../../components/common/SectionHeader.vue';
import ProfileCard from '../../components/profile/ProfileCard.vue';
import SectionCard from '../../components/common/SectionCard.vue';
import PermissionList from '../../components/profile/PermissionList.vue';

export default {
  name: "UserMyInfo",
  components: { 
    SectionHeader,
    ProfileCard, 
    SectionCard, 
    PermissionList 
  },
  data() {
    return {
      isLoading: false,
      editMode: false,
      user: { 
        name: '', 
        email: '', 
        phoneNumber: '', 
        profileImageUrl: null 
      },
      editName: '',
      editPhone: '',
      avatarUrl: "",
      avatarFile: null,
      avatarRemoved: false,
      myAccess: null,
      myUserGroup: null,
    };
  },
  computed: {
    profileData() {
      return {
        name: this.editName || this.user.name || '',
        email: this.user.email || '',
        phone: this.editPhone || this.user.phoneNumber || '',
        avatarUrl: this.displayedAvatarUrl,
        userGroupName: this.myUserGroup?.userGroupName || ''
      };
    },
    displayedAvatarUrl() {
      if (this.avatarUrl) return this.avatarUrl;
      const url = this.user?.profileImageUrl;
      if (this.avatarRemoved) return '';
      return (url && typeof url === 'string' && url.length > 0) ? url : '';
    },
  },
  created() {
    this.fetchUser();
    this.fetchMyAccess();
    this.fetchMyGroups();
  },
  methods: {
    async fetchUser() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const id = localStorage.getItem('id');
        if (!id) return;
        const { data } = await axios.get(`${baseURL}/user-service/user/${id}`);
        this.user = data?.result || this.user;
        this.editName = this.user.name || '';
        this.editPhone = this.user.phoneNumber || '';
      } catch (e) {
        const msg = e?.response?.data?.statusMessage || e?.response?.data?.message || '회원 정보를 불러오지 못했습니다.';
        showSnackbar(msg, { color: 'error' });
      }
    },
    async fetchMyAccess() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const userId = localStorage.getItem('id');
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        
        if (!userId || !workspaceId) {
          return;
        }
        
        const { data } = await axios.get(`${baseURL}/workspace-service/access/my-access/${workspaceId}`, {
          headers: {
            'X-User-Id': userId
          }
        });
        
        if (data?.statusCode === 200 && data?.result) {
          this.myAccess = data.result;
        }
      } catch (e) {
        console.log('권한 정보 조회 실패:', e?.response?.data?.statusMessage || e?.message);
      }
    },
    async fetchMyGroups() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const userId = localStorage.getItem('id');
        const workspaceId = localStorage.getItem('selectedWorkspaceId');
        
        if (!userId || !workspaceId) {
          return;
        }
        
        const { data } = await axios.get(`${baseURL}/workspace-service/groups/my-groups/${workspaceId}`, {
          headers: {
            'X-User-Id': userId
          }
        });
        
        if (data?.statusCode === 200 && data?.result) {
          this.myUserGroup = data.result;
        }
      } catch (e) {
        console.log('사용자 그룹 정보 조회 실패:', e?.response?.data?.statusMessage || e?.message);
      }
    },
    handleAvatarChange(file) {
      this.avatarFile = file;
      this.avatarRemoved = false;
      const reader = new FileReader();
      reader.onload = () => { 
        this.avatarUrl = reader.result; 
      };
      reader.readAsDataURL(file);
    },
    handleNameChange(value) {
      this.editName = value;
    },
    handlePhoneChange(value) {
      this.editPhone = value;
    },
    async handleEditSave() {
      if (!this.editMode) {
        this.editMode = true;
        return;
      }
      
      try {
        this.isLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const formData = new FormData();
        formData.append('name', this.editName || '');
        formData.append('phoneNumber', this.editPhone || '');
        
        if (this.avatarFile) {
          formData.append('profileImage', this.avatarFile);
        } else if (this.avatarRemoved) {
          formData.append('removeProfileImage', 'true');
        }
        
        const { data } = await axios.put(
          `${baseURL}/user-service/user/auth`, 
          formData, 
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        this.user.name = this.editName;
        this.user.phoneNumber = this.editPhone;
        if (this.avatarUrl) this.user.profileImageUrl = this.avatarUrl;
        if (this.avatarRemoved && !this.avatarFile) this.user.profileImageUrl = null;
        
        showSnackbar('수정이 완료되었습니다.', { color: 'success' });
        this.editMode = false;
        this.avatarFile = null;
        await this.fetchUser();
      } catch (error) {
        const resp = error?.response?.data;
        const message = resp?.statusMessage || resp?.message || error?.message || '정보 수정 중 오류가 발생했습니다.';
        showSnackbar(message, { color: 'error' });
      } finally {
        this.isLoading = false;
      }
    },
  }
};
</script>

<style scoped>
.my-info-page {
  position: fixed;
  top: 64px;
  left: 240px;
  right: 0;
  bottom: 0;
  background: var(--bg);
  overflow-y: auto;
  padding-top: 12px;
}

@media (max-width: 960px) {
  .my-info-page {
    left: 0;
    top: 64px;
  }
}

.myinfo-shell {
  max-width: 1600px;
  margin: 20px auto 0;
  padding: 0 24px 24px 48px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: stretch;
}

@media (max-width: 1199px) {
  .myinfo-shell {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 899px) {
  .myinfo-shell {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.col {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.col :deep(.section-card) {
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.col :deep(.section-card:hover) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.col :deep(.profile-card) {
  border: none;
  box-shadow: none;
  padding: 0;
  background: transparent;
  flex: 1;
}

.col :deep(.profile-card:hover) {
  transform: none;
  box-shadow: none;
}

.col-right {
  gap: var(--gap-xl, 24px);
}
</style>