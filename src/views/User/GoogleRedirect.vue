<!-- GoogleRedirect.vue -->
<template>
  <v-container class="oauth-redirect pa-0" fluid>
    <div class="center-wrap">
      <div class="status-text">{{ statusText }}</div>
    </div>
    
    <!-- 로딩 오버레이 (검증 중에만 표시) -->
    <v-overlay
      :model-value="loading"
      class="align-center justify-center"
      scrim="rgba(0,0,0,0.08)"
      persistent
    >
      <v-progress-circular indeterminate :size="56" :width="5" color="#FFE364" />
    </v-overlay>
  </v-container>
</template>

<script>
import axios from "axios";
import { jwtDecode } from 'jwt-decode';

export default {
  name: "GoogleRedirect",
  data() {
    return {
      loading: true,
      statusText: "구글 로그인 중…",
    };
  },
  created() {
    this.googleLoginRequest();
  },
  methods: {
    async googleLoginRequest() {
      const urlObj = new URL(window.location.href);
      const code = urlObj.searchParams.get("code");
      const remember = urlObj.searchParams.get("remember") === "true";
      
      if (!code) {
        this.loading = false;
        this.statusText = "인가 코드를 찾을 수 없습니다.";
        return;
      }
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
        const endpoint = `${baseURL}/user-service/user/google/login`;
        const payload = { code, rememberMe: remember };
        const { data } = await axios.post(
          endpoint,
          payload,
          { headers: { "Content-Type": "application/json" } }
        );
        const accessToken = data?.result?.accessToken;
        const refreshToken = data?.result?.refreshToken;
        const id = jwtDecode(accessToken).sub;
        if (!accessToken) throw new Error("토큰 없음");
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        if (id) localStorage.setItem("id", id);

        this.statusText = "로그인 성공! 이동 중…";
        this.$router.replace("/");
      } catch (e) {
        this.statusText = "로그인에 실패했어요. 다시 시도해주세요.";
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.oauth-redirect {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #fafbfc;
}
.center-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.status-text {
  color: #333;
  font-size: 0.98rem;
}
</style>
