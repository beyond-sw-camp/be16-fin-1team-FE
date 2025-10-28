import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const searchApi = axios.create({
  baseURL: `${API_BASE_URL}/search-service`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
searchApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('id');
    const workspaceId = localStorage.getItem('selectedWorkspaceId');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }
    if (workspaceId) {
      config.headers['X-Workspace-Id'] = workspaceId;
    }
    
    console.log('Search API Request:', {
      url: config.baseURL + config.url,
      params: config.params,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
searchApi.interceptors.response.use(
  (response) => {
    console.log('Search API Response:', response.data);
    return response.data;
  },
  (error) => {
    console.error('Search API Error:', error);
    console.error('Error response:', error.response);
    console.error('Error config:', error.config);
    return Promise.reject(error);
  }
);

export default {
  // 통합 검색
  search(keyword) {
    return searchApi.get('/search', {
      params: { keyword }
    });
  },

  // 자동완성 제안
  suggest(keyword) {
    return searchApi.get('/suggest', {
      params: { keyword }
    });
  },
};

