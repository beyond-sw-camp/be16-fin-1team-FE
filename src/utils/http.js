// src/utils/http.js
import axios from "axios";

const normalizedBaseURL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const http = axios.create({
  baseURL: normalizedBaseURL, // 환경변수 기반
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 (JWT 토큰과 User ID 자동 포함)
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const userId = localStorage.getItem("userId");
  if (userId) {
    config.headers["X-User-Id"] = userId;
  }
  
  return config;
});

export default http;
