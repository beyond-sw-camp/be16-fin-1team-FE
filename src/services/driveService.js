import axios from 'axios';

// Vite 환경에서는 import.meta.env 사용
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const driveApi = axios.create({
  baseURL: `${API_BASE_URL}/drive-service/drive`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 및 헤더 추가
driveApi.interceptors.request.use(
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
    
    console.log('Drive API Request:', {
      method: config.method.toUpperCase(),
      url: config.baseURL + config.url,
      headers: {
        Authorization: config.headers.Authorization ? 'Bearer ***' : 'None',
        'X-User-Id': config.headers['X-User-Id'],
        'X-Workspace-Id': config.headers['X-Workspace-Id']
      }
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
driveApi.interceptors.response.use(
  (response) => {
    console.log('Drive API Response:', {
      status: response.status,
      statusCode: response.data?.statusCode,
      statusMessage: response.data?.statusMessage
    });
    return response.data;
  },
  (error) => {
    console.error('Drive API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default {
  // 폴더 생성
  createFolder(folderData) {
    return driveApi.post('/folder', folderData);
  },

  // 폴더명 수정
  updateFolderName(folderId, folderData) {
    return driveApi.put(`/folder/${folderId}`, folderData);
  },

  // 폴더 삭제
  deleteFolder(folderId) {
    return driveApi.delete(`/folder/${folderId}`);
  },

  // 폴더 이동
  moveFolder(folderId, data) {
    return driveApi.put(`/folder/${folderId}/move`, data);
  },

  // 폴더 하위 요소들 조회
  getFolderContents(folderId) {
    return driveApi.get(`/folder/${folderId}/contents`);
  },

  // 폴더 정보 조회 (ancestors 포함)
  getFolderInfo(folderId) {
    return driveApi.get(`/folder/${folderId}`);
  },

  // 파일 업로드 (여러 파일 지원)
  uploadFile(folderId, files, rootId, rootType) {
    const formData = new FormData();
    
    // 여러 파일 추가
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('file', file);
      });
    } else {
      formData.append('file', files);
    }
    
    // rootId, rootType, workspaceId 추가
    const workspaceId = localStorage.getItem('selectedWorkspaceId');
    if (rootId) formData.append('rootId', rootId);
    if (rootType) formData.append('rootType', rootType);
    if (workspaceId) formData.append('workspaceId', workspaceId);
    
    return driveApi.post(`/folder/${folderId}/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 파일 삭제
  deleteFile(fileId) {
    return driveApi.delete(`/file/${fileId}`);
  },

  // 파일/문서 이동 (통합)
  moveElement(elementId, data) {
    return driveApi.put(`/element/${elementId}/move`, data);
  },

  // 문서 생성
  createDocument(folderId, documentData) {
    return driveApi.post(`/folder/${folderId}/document`, documentData);
  },

  // 문서 삭제
  deleteDocument(documentId) {
    return driveApi.delete(`/document/${documentId}`);
  },

  // 문서 조회
  getDocument(documentId) {
    return driveApi.get(`/document/${documentId}`);
  },

  // 문서 제목 수정
  updateDocumentTitle(documentId, data) {
    const payload = typeof data === 'string' ? { title: data } : (data?.title ? data : { title: data?.name });
    return driveApi.put(`/document/${documentId}`, payload);
  },

  // 스토리지 사용량 조회
  getStorageUsage() {
    // workspaceId는 헤더(X-Workspace-Id)로 자동 전송됨
    return driveApi.get('/files/storage');
  },

  // 루트별 상위 항목들 가져오기
  getContentsByRoot(rootType, rootId) {
    return driveApi.get(`/${rootType}/${rootId}`);
  },
};

