<template>
  <v-container class="kakao-redirect pa-0" fluid>
    <!-- 안내 텍스트만 배경에 (스피너 없음) -->
    <div class="center-wrap">
      <div class="status-text">{{ statusText }}</div>
    </div>

    <!-- 오버레이 스피너: 로딩 중에만 표시 -->
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
  name: "KakaoRedirect",
  data() {
    return {
      loading: true,
      statusText: "카카오 로그인 중…",
    };
  },
  async created() {
    const code = new URL(window.location.href).searchParams.get("code");
    const remember = new URL(window.location.href).searchParams.get("remember") === "true";
    
    if (!code) {
      this.loading = false;
      this.statusText = "인가 코드를 찾을 수 없습니다.";
      return;
    }
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const { data } = await axios.post(
        `${baseURL}/user-service/user/kakao/login`,
        { code, rememberMe: remember },
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
      console.log(e);
      this.statusText = "로그인에 실패했어요. 다시 시도해주세요.";
    } finally {
      // 성공 시엔 곧바로 redirect하므로 overlay 계속 유지해도 OK
      // 에러 시엔 오버레이를 내려서 메시지 보이게
      if (this.statusText.includes("실패")) this.loading = false;
    }
  },
};
</script>

<style scoped>
.kakao-redirect {
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
