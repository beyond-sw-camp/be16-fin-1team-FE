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

                  <div class="helper">비밀번호를 재설정할 이메일을 입력하세요</div>

                  <div class="controls-group">
                    <div class="field">
                      <div class="label">이메일 주소</div>
                      <v-text-field v-model="email" variant="outlined" density="comfortable" hide-details class="text-bg" placeholder="이메일을 입력하세요" />
                    </div>

                    

                  <div class="btn-wrap">
                    <v-btn class="login-btn" height="45" rounded="lg" :loading="isLoading" @click="handleLogin">다음</v-btn>
                  </div>

                  <div class="signup">
                    <span class="text">이미 계정이 있으신가요?</span>
                    <router-link to="/login" class="text-link">로그인</router-link>
                  </div>
                  </div>
                </div>

                <div class="bottom-group">
                  <div class="divider">
                    <div class="line"></div>
                    <div class="or">또는</div>
                    <div class="line"></div>
                  </div>

                  <div class="btn-wrap">
                    <v-btn class="oauth-btn" @click="googleLogin" height="44" rounded="lg" variant="flat">
                      <img src="/src/assets/icons/user/login_google.svg" alt="Google" width="20" height="20" />
                      <span>Google</span>
                    </v-btn>
                  </div>
                  <div class="btn-wrap">
                    <v-btn class="oauth-btn" @click="kakaoLogin" height="44" rounded="lg" variant="flat">
                      <img src="/src/assets/icons/user/login_kakao.svg" alt="Kakao" width="26" height="26" />
                      <span>Kakao</span>
                    </v-btn>
                  </div>
                </div>
              </div>
              
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { showSnackbar } from '../../services/snackbar.js';

export default {
  name: "UserCreate_InputEmail",
  data() {
    return {
      email: "",
      isLoading: false,
      kakaoUrl: "https://kauth.kakao.com/oauth/authorize",
      kakaoClientId: "f04e0b2f9773e2e421e24a448dc478a0",
      kakaoRedirectUrl: "http://localhost:5173/oauth/kakao/redirect",
      googleUrl: "https://accounts.google.com/o/oauth2/auth",
      googleClientId:
        "184039275121-3v895hcqj0imbjne3pfs9ceg6h8gld30.apps.googleusercontent.com",
      googleRedirectUrl: "http://localhost:5173/oauth/google/redirect",
      googleScope: "openid email profile",
    };
  },
  methods: {
    async handleLogin() {
      if (!this.email) {
        showSnackbar('이메일을 입력하세요.', { color: 'error' });
        return;
      }
      try {
        this.isLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const response = await axios.post(`${baseURL}/user-service/user/password/email`, { email: this.email }, { headers: { 'Content-Type': 'application/json' } });
        console.log('비밀번호 재설정 이메일 전송 결과:', response.data);
        this.$router.push({ path: '/forgot-password/validate-email', query: { email: this.email } });
      } catch (error) {
        const data = error?.response?.data;
        const message = data?.statusMessage || data?.message || error?.message || '요청 처리 중 오류가 발생했습니다.';
        console.error('비밀번호 재설정 이메일 전송 실패:', error);
        showSnackbar(message, { color: 'error' });
      } finally {
        this.isLoading = false;
      }
    },
    kakaoLogin() {
      const auth_uri = `${this.kakaoUrl}?client_id=${this.kakaoClientId}&redirect_uri=${this.kakaoRedirectUrl}&response_type=code&remember=${this.remember}`;
      window.location.href = auth_uri;
    },
    googleLogin() {
      const auth_uri = `${this.googleUrl}?client_id=${this.googleClientId}&redirect_uri=${this.googleRedirectUrl}&response_type=code&scope=${this.googleScope}&remember=${this.remember}`;
      console.log(auth_uri);
      window.location.href = auth_uri;
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
.helper { color: #DEDEDE; font-weight: 700; font-size: 16px; text-align: center; margin-bottom: 16px; }
.field { margin-bottom: 8px; }
.label { color: #979797; font-weight: 500; font-size: 14px; margin-bottom: 6px; }
.text-bg :deep(.v-field) { background: #FFFFFF; border-radius: 15px; overflow: hidden; }
.text-bg :deep(.v-field--variant-outlined) { --v-field-border-radius: 15px; }
.text-bg :deep(.v-field--variant-outlined .v-field__outline) { border-radius: 15px; }
.text-bg :deep(.v-field--variant-outlined .v-field__outline__start),
.text-bg :deep(.v-field--variant-outlined .v-field__outline__end) { border-radius: 15px; }
.controls-group { margin-top: 40px; }
.label { text-align: left; }
.text-bg :deep(input) { color: #2A2828; text-align: left; }
.text-bg :deep(input::placeholder) { color: #9E9E9E; opacity: 1; }
.row-between { display: flex; justify-content: space-between; align-items: center; margin: 12px 0 16px; }
/* limit checkbox row to same width as inputs/buttons */
.controls-group .row-between { max-width: 350px; margin-left: auto; margin-right: auto; margin-top: 6px; margin-bottom: 6px; }
.controls-group .field + .row-between { margin-top: 20px; }
.controls-group .login-btn { margin-top: 8px; }
.keep-login-label { display: inline-flex; align-items: center; gap: 8px; color: #FFFFFF; font-size: 12px; }
.keep-login-checkbox { width: 16px; height: 16px; appearance: none; background: #FFFFFF; border: 1px solid #5F5F5F; border-radius: 4px; display: inline-block; position: relative; }
.keep-login-checkbox:checked { background: #FFE364; border-color: #FFE364; }
.keep-login-checkbox:checked::after { content: ""; position: absolute; left: 4px; top: 1px; width: 5px; height: 9px; border: solid #2A2828; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.link { color: #2276FF; text-transform: none; padding: 0; min-width: auto; }
.text-link { color: #2276FF; text-decoration: none; font-size: 12px; }
.text-link:hover { text-decoration: underline; }
.login-btn { background: #FFE364; color: #2A2828; border-radius: 15px; margin: 16px 0; font-weight: 700; }
.divider { display: flex; align-items: center; gap: 12px; color: #9E9E9E; margin: 8px auto; max-width: 350px; }
.divider .line { flex: 1; border-top: 1px solid #E0E0E0; }
.divider .or { font-size: 12px; }
.oauth-btn { background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 15px; color: #000000; justify-content: center; gap: 12px; margin-bottom: 12px; text-transform: none; }
.oauth-btn :deep(.v-btn__content) { gap: 12px; }
.signup { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 12px; }
.signup .text { color: #FFFFFF; font-size: 12px; }
.card-body { padding: 48px 20px 28px; }
/* narrower widths for inputs and buttons */
.controls-group .field { max-width: 350px; width: 100%; margin-left: auto; margin-right: auto; }
.btn-wrap { max-width: 350px; margin: 0 auto 12px; display: flex; justify-content: center; }
.btn-wrap :deep(.v-btn) { width: 100%; }
.controls-group .btn-wrap { margin-top: 80px; }
.bottom-group .divider + .btn-wrap { margin-top: 24px; }
/* remove focus ring on buttons within login view */
:deep(.v-btn:focus),
:deep(.v-btn:focus-visible),
:deep(button:focus),
:deep(button:focus-visible) { outline: none !important; box-shadow: none !important; }
</style>