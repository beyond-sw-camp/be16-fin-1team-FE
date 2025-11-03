import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * 프로젝트 사람 중심 개요 조회 API
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} API 응답 데이터의 result 객체
 */
export const getProjectPeopleOverview = async (projectId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!projectId) {
      throw new Error('프로젝트 ID가 필요합니다.');
    }
    
    const response = await axios.get(
      `${baseURL}/workspace-service/project/${projectId}/people-overview`,
      {
        headers: {
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.statusCode === 200) {
      return response.data.result;
    } else {
      throw new Error(response.data.statusMessage || '프로젝트 사람 중심 개요 조회에 실패했습니다.');
    }
  } catch (error) {
    console.error('프로젝트 사람 중심 개요 조회 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '프로젝트 사람 중심 개요 조회에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('프로젝트 조회 권한이 없습니다.');
        case 404:
          throw new Error('프로젝트를 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '프로젝트 사람 중심 개요 조회 중 오류가 발생했습니다.');
    }
  }
};

