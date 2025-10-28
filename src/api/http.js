import axios from "axios";

// .env에서 기본 API 주소를 읽어옵니다.
// 예: VITE_API_BASE=https://api.example.com
const baseURL = import.meta.env.VITE_API_BASE || "/api";

const http = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: 10000,
});

// 요청 인터셉터: 토큰과 유저 ID를 자동으로 헤더에 포함
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const userId = localStorage.getItem("userId");
  if (userId) {
    config.headers = config.headers || {};
    config.headers["X-User-Id"] = userId;
  }

  return config;
});

export default http;
