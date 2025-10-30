<template>
  <div class="login-full">
    <v-container class="fill-container" fluid>
      <v-row class="h-100" align="center" justify="center">
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="login-card" rounded="lg" elevation="8">
            <v-card-text class="card-body">
              <div class="content">
                <div>
                  <div class="title-row">
                    <img class="orbit-logo" src="/src/assets/icons/orbit_logo.svg" alt="Orbit" />
                    <span class="orbit-title">ORBIT</span>
                  </div>

                  <div class="helper helper-title title-with-icon">
                    이메일 주소 확인
                    <img src="/src/assets/icons/user/check-circle 1.svg" alt="ok" class="title-check" />
                  </div>
                  <div class="helper helper-sub">Finish setting up your account</div>

                  <div class="avatar-wrap">
                    <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" class="avatar" @click="onAvatarClick" />
                    <div v-else class="avatar placeholder" @click="onAvatarClick">
                      <span class="avatar-default-icon"></span>
                    </div>
                    <div class="avatar-action" @click="onAvatarAction">
                      <img :src="avatarUrl ? '/src/assets/icons/user/close.svg' : '/src/assets/icons/user/plus.svg'" :alt="avatarUrl ? 'remove' : 'add'" class="avatar-action-icon" />
                    </div>
                    <input ref="avatarInput" type="file" accept="image/*" class="avatar-input" @change="onAvatarChange" />
                  </div>

                  <div class="email-block">
                    <div class="label">이메일 주소</div>
                    <div class="email-text">{{ email }}</div>
                  </div>

                  <div class="controls-group">
                    <div class="field">
                      <div class="label">이름</div>
                      <v-text-field v-model="name" variant="outlined" density="comfortable" hide-details class="text-bg" placeholder="성명 입력" />
                    </div>

                    <div class="field">
                      <div class="label">전화번호</div>
                      <v-text-field v-model="phone" variant="outlined" density="comfortable" hide-details class="text-bg" placeholder="전화번호 입력" />
                    </div>

                    <div class="field">
                      <div class="label">비밀번호</div>
                      <v-text-field
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        variant="outlined"
                        density="comfortable"
                        hide-details
                        class="text-bg"
                        placeholder="비밀번호 입력"
                        @input="onPasswordInput"
                      >
                        <template #append-inner>
                          <span :class="['eye-icon', showPassword ? 'eye-off' : 'eye-on']" @click.stop="showPassword = !showPassword"></span>
                        </template>
                      </v-text-field>
                      <div class="pw-bars">
                        <div v-for="i in 5" :key="i" class="pw-bar" :class="{ ok: satisfiedCount >= i }"></div>
                      </div>
                      <div class="pw-hint" v-if="nextUnmetMessage">{{ nextUnmetMessage }}</div>
                    </div>

                    <div class="row-between marketing-row">
                      <label class="keep-login-label">
                        <input type="checkbox" class="keep-login-checkbox" v-model="marketingOptIn" />
                        <span>Orbit의 제품, 이벤트 등에 대한 소식과 프로모션을 보내주세요.</span>
                      </label>
                    </div>

                    <div class="tos">
                      가입 시 Orbit <a href="#" class="text-link" @click.prevent="showTerms = true">이용 약관</a>과 <a href="#" class="text-link" @click.prevent="showPrivacy = true">개인 정보 보호 정책</a>에 동의한 것으로 간주됩니다.
                    </div>

                    <div class="btn-wrap">
                      <v-btn class="login-btn" height="45" rounded="lg" :loading="isLoading" @click="handleSubmit">계속</v-btn>
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
    };
  },
  created() {
    const qEmail = this.$route?.query?.email || localStorage.getItem('signupEmail');
    if (qEmail) this.email = qEmail;
  },
  computed: {
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
  }
};
</script>

<style scoped>
.login-full {
  position: fixed;
  inset: 0;
  background-color: #F5F5F5;
  overflow-y: auto;
}
.fill-container {
  height: 100%;
}
.login-card {
  background: #2A2828;
  border-radius: 15px;
  color: #FFFFFF;
  min-height: 620px;
  max-width: 420px;
  margin: 0 auto;
}
.content { display: flex; flex-direction: column; height: 100%; }
.content > :first-child { flex: 1 0 auto; }
.bottom-group { margin-top: 8px; }
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
.avatar-wrap { position: relative; width: 100px; height: 100px; margin: 0 auto 12px; cursor: pointer; }
.avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; background: #D9D9D9; }
.avatar.placeholder { width: 100px; height: 100px; border-radius: 50%; background: #FFFFFF; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.avatar-default { width: 70px; height: 70px; display: block; margin: 15px auto; }
.avatar-default-icon { width: 100%; height: 100%; display: block; margin: 0; background: #9E9E9E; 
  -webkit-mask-image: url('/src/assets/icons/user/account-circle.svg');
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: cover;
  mask-image: url('/src/assets/icons/user/account-circle.svg');
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: cover;
  transform: scale(1.25);
  transform-origin: center;
}
.avatar-action { position: absolute; right: -2px; bottom: -2px; width: 30px; height: 30px; background: #FFFFFF; color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; cursor: pointer; }
.avatar-action-icon { width: 18px; height: 18px; }
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