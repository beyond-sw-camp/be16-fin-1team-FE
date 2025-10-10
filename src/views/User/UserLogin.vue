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

                  <div class="helper">계정으로 로그인해 주세요</div>

                  <div class="controls-group">
                    <div class="field">
                      <div class="label">이메일</div>
                      <v-text-field v-model="email" variant="outlined" density="comfortable" hide-details class="text-bg" placeholder="이메일을 입력하세요" />
                    </div>

                    <div class="field">
                      <div class="label">비밀번호</div>
                      <v-text-field v-model="password" type="password" variant="outlined" density="comfortable" hide-details class="text-bg" placeholder="비밀번호를 입력하세요" />
                    </div>

                    <div class="row-between">
                      <label class="keep-login-label">
                        <input type="checkbox" class="keep-login-checkbox" />
                        <span>로그인 상태 유지</span>
                      </label>
                      <router-link to="/forgot-password" class="text-link">비밀번호 찾기</router-link>
                    </div>

                  <div class="btn-wrap">
                    <v-btn class="login-btn" height="45" rounded="lg" :loading="isLoading" @click="handleLogin">로그인</v-btn>
                  </div>

                  <div class="signup">
                    <span class="text">계정이 없으신가요?</span>
                    <router-link to="/signup" class="text-link">회원가입</router-link>
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

export default {
  name: "UserLogin",
  data() {
    return {
      email: "",
      password: "",
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
      if (!this.email || !this.password) {
        alert('이메일과 비밀번호를 입력하세요.');
        return;
      }
      try {
        this.isLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const { data } = await axios.post(`${baseURL}/user-service/user/auth/login`, {
          email: this.email,
          password: this.password,
        }, { headers: { 'Content-Type': 'application/json' }});
        const accessToken = data?.result?.accessToken;
        const refreshToken = data?.result?.refreshToken;
        const email = jwtDecode(accessToken).sub;
        if (accessToken && refreshToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('email', email);
          alert('로그인 성공');
        } else {
          throw new Error('토큰 없음');
        }
      } catch (e) {
        alert('로그인에 실패했습니다.');
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
}
.fill-container {
  height: 100%;
}
.login-card {
  background: #2A2828;
  border-radius: 15px;
  color: #FFFFFF;
  min-height: 720px;
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
.field { margin-bottom: 16px; }
.label { color: #979797; font-weight: 500; font-size: 14px; margin-bottom: 6px; }
.text-bg :deep(.v-field) { background: #FFFFFF; border-radius: 15px; }
.controls-group { margin-top: 40px; }
.label { text-align: left; }
.text-bg :deep(input) { color: #2A2828; text-align: left; }
.text-bg :deep(input::placeholder) { color: #9E9E9E; opacity: 1; }
.row-between { display: flex; justify-content: space-between; align-items: center; margin: 12px 0 16px; }
/* limit checkbox row to same width as inputs/buttons */
.controls-group .row-between { max-width: 350px; margin-left: auto; margin-right: auto; margin-top: 32px; margin-bottom: 8px; }
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
.bottom-group .divider + .btn-wrap { margin-top: 24px; }
/* remove focus ring on buttons within login view */
:deep(.v-btn:focus),
:deep(.v-btn:focus-visible),
:deep(button:focus),
:deep(button:focus-visible) { outline: none !important; box-shadow: none !important; }
</style>