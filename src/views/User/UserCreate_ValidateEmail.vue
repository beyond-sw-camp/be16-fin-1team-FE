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

                  <div class="helper helper-title">코드를 이메일로 보냈습니다</div>
                  <div class="helper helper-sub">계정 설정을 완료하려면 다음 주소로 보내드린 코드를 입력하세요</div>
                  <div class="helper helper-email">{{ email }}</div>

                  <div class="controls-group">
                    <div class="code-inputs">
                      <input
                        v-for="(digit, idx) in codeDigits"
                        :key="idx"
                        class="code-input"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        maxlength="1"
                        v-model="codeDigits[idx]"
                        @input="onCodeInput(idx, $event)"
                        @keydown="onCodeKeydown(idx, $event)"
                        @paste.prevent="onCodePaste(idx, $event)"
                        :ref="el => (inputRefs[idx] = el)"
                      />
                    </div>

                    <div v-if="!isExpired" class="timer">{{ timerText }}</div>
                    <div v-else class="timer-expired">
                      <div class="expired-text">인증시간이 만료되었습니다.</div>
                      <div class="expired-actions">
                        <v-btn class="resend-inline-btn" size="small" variant="text" @click="resendEmail">다시 보내기</v-btn>
                      </div>
                    </div>

                  <div class="btn-wrap">
                    <v-btn class="login-btn" height="45" rounded="lg" :loading="isLoading" @click="handleLogin">확인</v-btn>
                  </div>

                  <div class="signup">
                    <a href="#" class="text-link" @click.prevent="resendEmail">이메일을 받지 못하셨습니까? 이메일 다시 보내기</a>
                  </div>
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
import { showSnackbar } from '../../services/snackbar.js';

export default {
  name: "UserCreate_ValidateEmail",
  data() {
    return {
      email: "email@example.com",
      isLoading: false,
      codeDigits: Array(6).fill(''),
      inputRefs: [],
      timerSeconds: 180,
      timerId: null,
    };
  },
  created() {
    const qEmail = this.$route?.query?.email;
    if (qEmail) {
      this.email = qEmail;
      try {
        localStorage.setItem('signupEmail', qEmail);
      } catch (_) {}
    }
  },
  mounted() {
    this.startTimer();
  },
  beforeUnmount() {
    if (this.timerId) clearInterval(this.timerId);
  },
  computed: {
    timerText() {
      const m = Math.floor(this.timerSeconds / 60).toString().padStart(1, '0');
      const s = (this.timerSeconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    },
    isExpired() {
      return this.timerSeconds <= 0;
    }
  },
  methods: {
    startTimer() {
      if (this.timerId) clearInterval(this.timerId);
      this.timerSeconds = 180;
      this.timerId = setInterval(() => {
        if (this.timerSeconds > 0) {
          this.timerSeconds -= 1;
        } else {
          clearInterval(this.timerId);
          this.timerId = null;
        }
      }, 1000);
    },
    onCodeInput(idx, event) {
      const value = (event.target.value || '').replace(/\D/g, '');
      if (value === '') {
        this.codeDigits[idx] = '';
        return;
      }
      // take only first digit
      this.codeDigits[idx] = value.charAt(0);
      // move focus to next
      const next = idx + 1;
      if (next < this.inputRefs.length && this.inputRefs[next]) {
        this.$nextTick(() => this.inputRefs[next].focus());
      }
    },
    onCodeKeydown(idx, event) {
      if (event.key === 'Backspace') {
        if (this.codeDigits[idx]) {
          // clear current
          this.codeDigits[idx] = '';
          return;
        }
        // move to previous if empty
        const prev = idx - 1;
        if (prev >= 0 && this.inputRefs[prev]) {
          event.preventDefault();
          this.$nextTick(() => this.inputRefs[prev].focus());
        }
      }
    },
    onCodePaste(idx, event) {
      const text = (event.clipboardData?.getData('text') || '').replace(/\D/g, '');
      if (!text) return;
      let cursor = idx;
      for (let i = 0; i < text.length && cursor < this.codeDigits.length; i += 1, cursor += 1) {
        this.codeDigits[cursor] = text.charAt(i);
      }
      const next = Math.min(cursor, this.inputRefs.length - 1);
      if (this.inputRefs[next]) {
        this.$nextTick(() => this.inputRefs[next].focus());
      }
    },
    async handleLogin() {
      if (!this.email) {
        showSnackbar('이메일을 확인하세요.', { color: 'error' });
        return;
      }
      const code = (this.codeDigits || []).join('');
      if (!code || code.length !== 6 || /\D/.test(code)) {
        showSnackbar('6자리 인증 코드를 정확히 입력하세요.', { color: 'error' });
        return;
      }
      try {
        this.isLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const payload = { email: this.email, authCode: code };
        const response = await axios.post(`${baseURL}/user-service/user/authcode`, payload, { headers: { 'Content-Type': 'application/json' } });
        console.log('인증 코드 검증 결과:', response.data);
        showSnackbar('인증 코드가 확인되었습니다.', { color: 'success' });
        this.$router.push({ path: '/new-user/input-info', query: { email: this.email } });
      } catch (error) {
        const data = error?.response?.data;
        const message = data?.statusMessage || data?.message || error?.message || '요청 처리 중 오류가 발생했습니다.';
        console.error('인증 코드 검증 실패:', error);
        showSnackbar(message, { color: 'error' });
      } finally {
        this.isLoading = false;
      }
    },
    async resendEmail() {
      if (!this.email) {
        showSnackbar('이메일을 확인하세요.', { color: 'error' });
        return;
      }
      try {
        this.isLoading = true;
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const payload = { email: this.email };
        const response = await axios.post(`${baseURL}/user-service/user/email`, payload, { headers: { 'Content-Type': 'application/json' } });
        console.log('이메일 재전송 결과:', response.data);
        showSnackbar('이메일을 다시 보냈습니다.', { color: 'success' });
        this.startTimer();
      } catch (error) {
        const data = error?.response?.data;
        const message = data?.statusMessage || data?.message || error?.message || '요청 처리 중 오류가 발생했습니다.';
        console.error('이메일 재전송 실패:', error);
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
.helper { color: #DEDEDE; font-weight: 700; font-size: 16px; text-align: center; margin-bottom: 16px; }
.helper-title { font-size: 21px; font-weight: 800; margin-bottom: 6px; }
.helper-sub { font-size: 13px; font-weight: 400; color: #CFCFCF; margin-bottom: 24px; }
.helper-email { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.field { margin-bottom: 8px; }
.label { color: #979797; font-weight: 500; font-size: 14px; margin-bottom: 6px; }
.text-bg :deep(.v-field) { background: #FFFFFF; border-radius: 15px; }
.controls-group { margin-top: 12px; }
.code-inputs { display: flex; gap: 10px; justify-content: center; margin-top: 16px; }
.code-input {
  width: 44px;
  height: 48px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #2A2828;
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 12px;
}
.code-input:focus { outline: none; border-color: #FFE364; box-shadow: 0 0 0 3px rgba(255, 227, 100, 0.35); }
.timer { margin-top: 10px; color: #ff6b6b; text-align: center; font-weight: 700; font-size: 14px; }
.timer-expired { margin-top: 10px; text-align: center; }
.timer-expired .expired-text { color: #ff6b6b; font-weight: 700; font-size: 14px; }
.timer-expired .expired-actions { margin-top: 6px; }
.resend-inline-btn { color: #ff6b6b; min-width: auto; padding: 0 8px; text-transform: none; }
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
.signup { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 1px; }
.signup .text { color: #FFFFFF; font-size: 12px; }
.card-body { padding: 48px 20px 28px; }
/* narrower widths for inputs and buttons */
.controls-group .field { max-width: 350px; width: 100%; margin-left: auto; margin-right: auto; }
.btn-wrap { max-width: 350px; margin: 0 auto 12px; display: flex; justify-content: center; }
.btn-wrap :deep(.v-btn) { width: 100%; }
.controls-group .btn-wrap { margin-top: 200px; margin-bottom: 6px; }
.bottom-group .divider + .btn-wrap { margin-top: 24px; }
/* remove focus ring on buttons within login view */
:deep(.v-btn:focus),
:deep(.v-btn:focus-visible),
:deep(button:focus),
:deep(button:focus-visible) { outline: none !important; box-shadow: none !important; }
</style>