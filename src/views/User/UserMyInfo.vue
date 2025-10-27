<template>
  <div class="login-full">
    <v-container class="fill-container" fluid>
      <v-row class="h-100" align="center" justify="center">
        <v-col cols="12" sm="10" md="10" lg="8">
          <div class="page-head">
            <div class="head-title">내 정보</div>
            <div class="head-subtitle">원하는 정보를 조회 및 수정할 수 있습니다.</div>
          </div>
          <v-card class="login-card" rounded="lg" elevation="8">
            <v-card-text class="card-body">
              <div class="content">
                <div>
                
                <div class="stack">
                  <div class="section-card section-profile">
                    <div class="section-inner section-profile-inner">
                      <div class="section-label">프로필 사진</div>
                      <div class="avatar-wrap">
                        <div class="avatar placeholder clickable" @click="editMode && onAvatarClick()">
                          <template v-if="displayedAvatarUrl">
                            <img class="avatar" :src="displayedAvatarUrl" alt="avatar" />
                          </template>
                          <template v-else>
                            <span class="avatar-default-icon"></span>
                          </template>
                          <input ref="avatarInput" class="avatar-input" type="file" accept="image/*" @change="onAvatarChange" />
                        </div>
                        <div v-if="editMode" class="avatar-action" @click.stop="onAvatarAction">
                          <span :class="['avatar-action-icon', hasAnyAvatar ? 'icon-close' : 'icon-plus']"></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="section-card">
                    <div class="section-inner">
                      <div class="section-label">이메일 주소</div>
                      <div class="section-value">{{ user.email || '-' }}</div>
                    </div>
                  </div>

                  <div class="section-card">
                    <div class="section-inner">
                      <div class="section-label">이름</div>
                      <div class="section-value" v-if="!editMode">{{ user.name || '-' }}</div>
                      <div class="field text-bg edit-field" v-else>
                        <v-text-field v-model="editName" variant="outlined" hide-details density="comfortable" />
                      </div>
                    </div>
                  </div>

                  <div class="section-card">
                    <div class="section-inner">
                      <div class="section-label">전화번호</div>
                      <div class="section-value" v-if="!editMode">{{ user.phoneNumber || '-' }}</div>
                      <div class="field text-bg edit-field" v-else>
                        <v-text-field v-model="editPhone" variant="outlined" hide-details density="comfortable" />
                      </div>
                    </div>
                  </div>

                  <div class="btn-wide-wrap">
                    <v-btn class="login-btn" height="52" rounded="lg" :loading="isLoading" @click="handleEditSave">{{ editMode ? '저장' : '수정' }}</v-btn>
                  </div>
                </div>

                </div>

              </div>
              <UserTermsModal v-model="showTerms" />
              <UserPrivacyModal v-model="showPrivacy" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import axios from 'axios';
import UserTermsModal from './UserTermsModal.vue';
import UserPrivacyModal from './UserPrivacyModal.vue';
import { showSnackbar } from '../../services/snackbar.js';

export default {
  name: "UserCreate_InputInfo",
  components: { UserTermsModal, UserPrivacyModal },
  data() {
    return {
      email: "",
      name: "",
      phone: "",
      password: "",
      showPassword: false,
      marketingOptIn: false,
      isLoading: false,
      avatarUrl: "",
      avatarFile: null,
      showTerms: false,
      showPrivacy: false,
      user: { name: '', email: '', phoneNumber: '', profileImageUrl: null },
      editMode: false,
      editName: '',
      editPhone: '',
      avatarRemoved: false,
    };
  },
  created() {
    const qEmail = this.$route?.query?.email || localStorage.getItem('signupEmail');
    if (qEmail) this.email = qEmail;
    this.fetchUser();
  },
  computed: {
    displayedAvatarUrl() {
      // 우선순위: 편집 중 업로드 미리보기 > 서버에서 온 프로필 이미지 URL
      if (this.avatarUrl) return this.avatarUrl;
      const url = this.user?.profileImageUrl;
      if (this.avatarRemoved) return '';
      return (url && typeof url === 'string' && url.length > 0) ? url : '';
    },
    hasAnyAvatar() {
      const hasPreview = !!this.avatarUrl || !!this.avatarFile;
      const hasServer = !!this.user?.profileImageUrl && !this.avatarRemoved;
      return hasPreview || hasServer;
    },
    userInfoReady() {
      return (this.name || '').trim().length > 0 && (this.phone || '').trim().length > 0;
    },
    ruleResults() {
      const pw = this.password || "";
      const notEmpty = pw.length > 0;
      const hasDigit = /\d/.test(pw);
      const longEnough = pw.length >= 8;
      const hasSpecial = /[^A-Za-z0-9]/.test(pw);
      const noSpaces = !/\s/.test(pw);
      return { notEmpty, hasDigit, longEnough, hasSpecial, noSpaces };
    },
    satisfiedCount() {
      if (!this.userInfoReady) return 0;
      return Object.values(this.ruleResults).filter(Boolean).length;
    },
    unmetMessages() {
      const messages = [];
      if (!this.ruleResults.notEmpty) messages.push('비밀번호를 입력해 주세요');
      if (!this.ruleResults.hasDigit) messages.push('숫자를 포함해 주세요');
      if (!this.ruleResults.longEnough) messages.push('8자 이상으로 입력해 주세요');
      if (!this.ruleResults.hasSpecial) messages.push('특수문자를 1개 이상 포함해 주세요');
      if (!this.ruleResults.noSpaces) messages.push('공백은 포함될 수 없습니다');
      return messages;
    },
    nextUnmetMessage() {
      if (!this.userInfoReady) return '이름과 전화번호를 입력해 주세요';
      return this.unmetMessages[0] || '';
    },
  },
  methods: {
    async fetchUser() {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const id = localStorage.getItem('id');
        if (!id) return;
        const { data } = await axios.get(`${baseURL}/user-service/user/${id}`);
        this.user = data?.result || this.user;
        // initialize edit fields
        this.editName = this.user.name || '';
        this.editPhone = this.user.phoneNumber || '';
      } catch (e) {
        const msg = e?.response?.data?.statusMessage || e?.response?.data?.message || '회원 정보를 불러오지 못했습니다.';
        showSnackbar(msg, { color: 'error' });
      }
    },
    onAvatarClick() {
      this.$refs.avatarInput?.click();
    },
    onAvatarAction() {
      if (this.avatarUrl) {
        // remove selected image
        this.avatarUrl = "";
        this.avatarFile = null;
        if (this.$refs.avatarInput) this.$refs.avatarInput.value = '';
      } else {
        this.onAvatarClick();
      }
    },
    onAvatarChange(e) {
      const file = e?.target?.files?.[0];
      if (!file) return;
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = () => { this.avatarUrl = reader.result; };
      reader.readAsDataURL(file);
    },
    onAvatarAction() {
      if (this.hasAnyAvatar) {
        // remove current avatar (preview or existing)
        this.avatarUrl = '';
        this.avatarFile = null;
        this.avatarRemoved = true;
        this.user.profileImageUrl = null;
        if (this.$refs.avatarInput) this.$refs.avatarInput.value = '';
      } else {
        this.onAvatarClick();
      }
    },
    onPasswordInput() {
      // reactive computed handles validation
    },
    async handleSubmit() {
      if (!this.name || !this.phone || !this.password) {
        showSnackbar('이름, 전화번호, 비밀번호를 입력하세요.', { color: 'error' });
        return;
      }
      if (this.satisfiedCount < 5) {
        showSnackbar('비밀번호 조건을 모두 충족해 주세요.', { color: 'error' });
        return;
      }
      try {
        this.isLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const formData = new FormData();
        formData.append('name', this.name);
        formData.append('email', this.email);
        formData.append('password', this.password);
        formData.append('phoneNumber', this.phone);
        if (this.avatarFile) {
          formData.append('profileImageUrl', this.avatarFile);
        }
        const { data } = await axios.post(`${baseURL}/user-service/user/new-user`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        console.log('회원가입 완료 결과:', data);
        showSnackbar('가입이 완료되었습니다.', { color: 'success' });
        this.$router.push('/login');
      } catch (error) {
        const resp = error?.response?.data;
        const message = resp?.statusMessage || resp?.message || error?.message || '요청 처리 중 오류가 발생했습니다.';
        showSnackbar(message, { color: 'error' });
      } finally {
        this.isLoading = false;
      }
    },
    async handleEditSave() {
      if (!this.editMode) {
        this.editMode = true;
        return;
      }
      // save mode
      try {
        this.isLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const formData = new FormData();
        formData.append('name', this.editName || '');
        formData.append('phoneNumber', this.editPhone || '');
        if (this.avatarFile) {
          // 새 이미지로 변경된 경우에만 profileImage 키 포함
          formData.append('profileImage', this.avatarFile);
        } else if (this.avatarRemoved) {
          // 삭제만 한 경우: profileImage 키는 보내지 않고 제거 플래그만 전송
          formData.append('removeProfileImage', 'true');
        }
        const { data } = await axios.put(`${baseURL}/user-service/user/auth`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        console.log('회원 정보 수정 결과:', data);
        // reflect changes locally
        this.user.name = this.editName;
        this.user.phoneNumber = this.editPhone;
        if (this.avatarUrl) this.user.profileImageUrl = this.avatarUrl;
        if (this.avatarRemoved && !this.avatarFile) this.user.profileImageUrl = null;
        showSnackbar('수정이 완료되었습니다.', { color: 'success' });
        this.editMode = false;
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
.login-full { position: fixed; top: 64px; left: 240px; right: 0; bottom: 0; background-color: #F5F5F5; }
.fill-container {
  height: 100%;
}
.login-card {
  background: #2A2828;
  border-radius: 15px;
  color: #FFFFFF;
  min-height: 220px;
  max-width: 1120px;
  margin: 0 auto;
}
@media (max-width: 960px) {
  .login-full { left: 0; top: 64px; }
}
.content { display: flex; flex-direction: column; height: 100%; }
.content > :first-child { flex: 1 0 auto; }
.bottom-group { margin-top: 8px; }
.stack { display: flex; flex-direction: column; gap: 16px; padding: 8px 8px 0; align-items: center; }
.section-card { background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 15px; width: 554px; max-width: calc(100% - 32px); }
.section-inner { padding: 24px; display: flex; align-items: center; justify-content: space-between; }
.section-profile .section-inner { justify-content: space-between; gap: 24px; }
.section-label { font-weight: 600; font-size: 16px; color: #1C0F0F; }
.section-value { font-weight: 400; font-size: 18px; color: #000000; }
.btn-wide-wrap { margin-top: 8px; width: 554px; max-width: calc(100% - 32px); }
.btn-wide-wrap :deep(.v-btn) { width: 100%; }
.edit-field { flex: 0 0 30%; max-width: 30%; margin-left: auto; }
.edit-field :deep(.v-field) { text-align: right; }
.edit-field :deep(input) { text-align: right; }
.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}
.orbit-logo { width: 36px; height: 36px; }
.orbit-title { font-weight: 800; font-size: 32px; color: #FFFFFF; }
.helper { color: #DEDEDE; font-weight: 700; font-size: 16px; text-align: center; margin-bottom: 8px; }
.helper-title { font-size: 20px; font-weight: 800; }
.title-with-icon { display: inline-flex; align-items: center; gap: 6px; }
.title-check { width: 20px; height: 20px; vertical-align: middle; }
.helper-sub { font-size: 14px; font-weight: 700; color: #DEDEDE; margin-bottom: 16px; }
.page-head { position: relative; padding: 24px 0 8px; text-align: left; max-width: 1120px; margin: 0 auto; }
.head-title { font-weight: 800; font-size: 28px; line-height: 33px; color: #1C0F0F; }
.head-subtitle { margin-top: 8px; font-weight: 700; font-size: 16px; line-height: 19px; color: #1C0F0F; }
.profile-row { display: flex; gap: 16px; align-items: center; padding: 8px 28px 16px; }
.info-col { display: flex; flex-direction: column; gap: 6px; }
.info-item { display: flex; gap: 10px; align-items: center; }
.info-label { width: 72px; color: #CFCFCF; font-size: 12px; }
.info-value { color: #FFFFFF; font-size: 14px; font-weight: 700; }
.field { margin-bottom: 8px; }
.label { color: #979797; font-weight: 500; font-size: 14px; margin-bottom: 6px; }
.text-bg :deep(.v-field) { background: #FFFFFF; border-radius: 15px; overflow: hidden; }
/* match Vuetify outlined field outline radius */
.text-bg :deep(.v-field--variant-outlined) { --v-field-border-radius: 15px; }
.text-bg :deep(.v-field--variant-outlined .v-field__outline) { border-radius: 15px; }
.text-bg :deep(.v-field--variant-outlined .v-field__outline__start),
.text-bg :deep(.v-field--variant-outlined .v-field__outline__end) { border-radius: 15px; }
.controls-group { margin-top: 16px; }
.label { text-align: left; }
.text-bg :deep(input) { color: #2A2828; text-align: left; }
.text-bg :deep(input::placeholder) { color: #9E9E9E; opacity: 1; }
.row-between { display: flex; justify-content: space-between; align-items: center; margin: 12px 0 16px; }
/* limit checkbox row to same width as inputs/buttons */
.controls-group .row-between { max-width: 350px; margin-left: auto; margin-right: auto; margin-top: 6px; margin-bottom: 6px; }
.controls-group .login-btn { margin-top: 8px; }
.keep-login-label { display: inline-flex; align-items: center; gap: 8px; color: #FFFFFF; font-size: 12px; }
.keep-login-checkbox { width: 16px; height: 16px; appearance: none; background: #FFFFFF; border: 1px solid #5F5F5F; border-radius: 4px; display: inline-block; position: relative; }
.keep-login-checkbox:checked { background: #FFE364; border-color: #FFE364; }
.keep-login-checkbox:checked::after { content: ""; position: absolute; left: 4px; top: 1px; width: 5px; height: 9px; border: solid #2A2828; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.link { color: #2276FF; text-transform: none; padding: 0; min-width: auto; }
.text-link { color: #2276FF; text-decoration: none; font-size: 11px; }
.text-link:hover { text-decoration: underline; }
.login-btn { background: #FFE364; color: #2A2828; border-radius: 15px; margin: 16px 0; font-weight: 700; }
.avatar-wrap { position: relative; width: 120px; height: 120px; }
.avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: #D9D9D9; }
.avatar.placeholder { width: 120px; height: 120px; border-radius: 50%; background: #FFFFFF; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
.avatar.placeholder.clickable { cursor: pointer; }
.avatar-default { width: 100%; height: 100%; display: block; margin: 15px auto; }
.avatar-default-icon { width: 100%; height: 100%; display: block; margin: 0; background: #9E9E9E; 
  -webkit-mask-image: url('/src/assets/icons/user/account-circle.svg');
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: cover;
  mask-image: url('/src/assets/icons/user/account-circle.svg');
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: cover;
  transform: scale(1.15);
  transform-origin: center;
}
.avatar-action { position: absolute; right: 3px; bottom: 3px; width: 30px; height: 30px; background: #FFFFFF; color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; cursor: pointer; z-index: 1000; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.avatar-action-icon { width: 18px; height: 18px; display: inline-block; background: #2A2828; }
.avatar-action-icon.icon-plus { 
  -webkit-mask: url('/src/assets/icons/user/plus.svg') no-repeat center / contain; 
  mask: url('/src/assets/icons/user/plus.svg') no-repeat center / contain; }
.avatar-action-icon.icon-close { 
  -webkit-mask: url('/src/assets/icons/user/close.svg') no-repeat center / contain; 
  mask: url('/src/assets/icons/user/close.svg') no-repeat center / contain; }
.avatar-input { display: none; }
.email-block { margin-top: 8px; max-width: 350px; width: 100%; margin-left: auto; margin-right: auto; text-align: left; }
.email-block .email-text { color: #DEDEDE; font-weight: 700; font-size: 16px; text-align: left; }
.marketing-row { margin-top: 8px; }
.pw-bars { display: flex; align-items: center; gap: 8px; margin: 8px auto 6px; max-width: 350px; }
.pw-bar { flex: 1; height: 2px; background: #9E9E9E; border-radius: 1px; }
.pw-bar.ok { background: #39B337; }
.pw-hint { color: #9E9E9E; font-size: 10px; text-align: center; }
.eye-icon { width: 20px; height: 20px; cursor: pointer; display: inline-block; }
.eye-icon.eye-on { -webkit-mask: url('/src/assets/icons/user/eye.svg') no-repeat center / contain; mask: url('/src/assets/icons/user/eye.svg') no-repeat center / contain; background: #9E9E9E; }
.eye-icon.eye-off { -webkit-mask: url('/src/assets/icons/user/eye-off.svg') no-repeat center / contain; mask: url('/src/assets/icons/user/eye-off.svg') no-repeat center / contain; background: #9E9E9E; }
.tos { color: #FFFFFF; font-size: 11px; text-align: center; margin-top: 20px; }
.card-body { padding: 48px 20px 28px; }
/* narrower widths for inputs and buttons */
.controls-group .field { max-width: 350px; width: 100%; margin-left: auto; margin-right: auto; }
.btn-wrap { max-width: 350px; margin: 0 auto 12px; display: flex; justify-content: center; }
.btn-wrap :deep(.v-btn) { width: 100%; }
.bottom-group .divider + .btn-wrap { margin-top: 24px; }
/* remove focus ring on buttons within this view */
:deep(.v-btn:focus),
:deep(.v-btn:focus-visible),
:deep(button:focus),
:deep(button:focus-visible),
.login-btn:focus,
.login-btn:focus-visible { outline: none !important; box-shadow: none !important; }
</style>