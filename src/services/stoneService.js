import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

/**
 * 스톤 삭제 API
 * @param {string} stoneId - 삭제할 스톤 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const deleteStone = async (stoneId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    const response = await axios.delete(`${baseURL}/workspace-service/stone/${stoneId}`, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('스톤 삭제 API 호출 실패:', error);
    
    // 에러 메시지 처리
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '스톤 삭제에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('스톤 삭제 권한이 없습니다.');
        case 404:
          throw new Error('스톤을 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '스톤 삭제 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 스톤 상세 정보 조회 API
 * @param {string} stoneId - 조회할 스톤 ID
 * @returns {Promise<Object>} 스톤 상세 정보
 */
export const getStoneDetail = async (stoneId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    const response = await axios.get(`${baseURL}/workspace-service/stone/${stoneId}`, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('스톤 상세 조회 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '스톤 정보를 불러올 수 없습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('스톤 조회 권한이 없습니다.');
        case 404:
          throw new Error('스톤을 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '스톤 정보 조회 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 스톤 담당자 수정 API
 * @param {string} stoneId - 수정할 스톤 ID
 * @param {string} newManagerId - 새로운 담당자 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const modifyStoneManager = async (stoneId, newManagerId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    if (!newManagerId) {
      throw new Error('새 담당자 ID가 필요합니다.');
    }
    
    const requestData = {
      stoneId: stoneId,
      newManagerUserId: newManagerId
    };
    
    const response = await axios.patch(`${baseURL}/workspace-service/stone/manager`, requestData, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('스톤 담당자 수정 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '스톤 담당자 수정에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('스톤 담당자 수정 권한이 없습니다.');
        case 404:
          throw new Error('스톤 또는 담당자를 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '스톤 담당자 수정 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 스톤 정보 수정 API
 * @param {Object} stoneData - 수정할 스톤 데이터
 * @param {string} stoneData.stoneId - 스톤 ID
 * @param {string} stoneData.stoneName - 스톤명
 * @param {string} stoneData.startTime - 시작일 (YYYY-MM-DDTHH:mm:ss 형식)
 * @param {string} stoneData.endTime - 종료일 (YYYY-MM-DDTHH:mm:ss 형식)
 * @param {boolean} stoneData.chatCreation - 채팅방 생성 여부
 * @returns {Promise<Object>} API 응답 데이터
 */
export const modifyStone = async (stoneData) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!stoneData.stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    if (!stoneData.stoneName) {
      throw new Error('스톤명이 필요합니다.');
    }
    
    if (!stoneData.startTime || !stoneData.endTime) {
      throw new Error('시작일과 종료일이 필요합니다.');
    }
    
    const requestData = {
      stoneId: stoneData.stoneId,
      stoneName: stoneData.stoneName,
      startTime: stoneData.startTime,
      endTime: stoneData.endTime
    };
    
    // chatCreation이 있는 경우에만 추가
    if (stoneData.chatCreation !== undefined) {
      requestData.chatCreation = stoneData.chatCreation;
    }
    
    // stoneDescribe가 있는 경우 추가 (nullable)
    if (stoneData.stoneDescribe !== undefined) {
      requestData.stoneDescribe = stoneData.stoneDescribe;
    }
    
    console.log('스톤 수정 API 요청 데이터:', requestData);
    
    const response = await axios.patch(`${baseURL}/workspace-service/stone`, requestData, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('스톤 수정 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '스톤 수정에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('스톤 수정 권한이 없습니다.');
        case 404:
          throw new Error('스톤을 찾을 수 없습니다.');
        case 409:
          throw new Error('이미 생성된 채팅방은 비활성화할 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '스톤 수정 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 워크스페이스 참여자 검색 API
 * @param {string} workspaceId - 워크스페이스 ID
 * @param {string} searchKeyword - 검색 키워드 (선택사항)
 * @returns {Promise<Object>} 참여자 목록
 */
export const searchWorkspaceParticipants = async (workspaceId, searchKeyword = '') => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!workspaceId) {
      throw new Error('워크스페이스 ID가 필요합니다.');
    }
    
    const requestData = {
      workspaceId: workspaceId,
      searchKeyword: searchKeyword
    };
    
    const response = await axios.post(`${baseURL}/workspace-service/workspace/participants/search`, requestData, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('워크스페이스 참여자 검색 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '참여자 검색에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('참여자 검색 권한이 없습니다.');
        case 404:
          throw new Error('워크스페이스를 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '참여자 검색 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 태스크 목록 조회 API
 * @param {string} stoneId - 스톤 ID
 * @returns {Promise<Object>} 태스크 목록
 */
export const getTaskList = async (stoneId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    const response = await axios.get(`${baseURL}/workspace-service/task/${stoneId}`, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('태스크 목록 조회 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '태스크 목록을 불러올 수 없습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('태스크 조회 권한이 없습니다.');
        case 404:
          throw new Error('스톤을 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '태스크 목록 조회 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 태스크 생성 API
 * @param {Object} taskData - 생성할 태스크 데이터
 * @param {string} taskData.stoneId - 스톤 ID
 * @param {string} taskData.managerId - 담당자 ID (workspace_participant ID)
 * @param {string} taskData.taskName - 태스크명
 * @param {string} taskData.startTime - 시작일 (YYYY-MM-DDTHH:mm:ss 형식)
 * @param {string} taskData.endTime - 종료일 (YYYY-MM-DDTHH:mm:ss 형식)
 * @returns {Promise<Object>} API 응답 데이터
 */
export const createTask = async (taskData) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!taskData.stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    if (!taskData.managerId) {
      throw new Error('담당자 ID가 필요합니다.');
    }
    
    if (!taskData.taskName) {
      throw new Error('태스크명이 필요합니다.');
    }
    
    if (!taskData.startTime || !taskData.endTime) {
      throw new Error('시작일과 종료일이 필요합니다.');
    }
    
    const requestData = {
      stoneId: taskData.stoneId,
      managerId: taskData.managerId,
      taskName: taskData.taskName,
      startTime: taskData.startTime,
      endTime: taskData.endTime
    };
    
    console.log('태스크 생성 API 요청 데이터:', requestData);
    
    const response = await axios.post(`${baseURL}/workspace-service/task`, requestData, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('태스크 생성 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '태스크 생성에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('태스크 생성 권한이 없습니다.');
        case 404:
          throw new Error('스톤 또는 담당자를 찾을 수 없습니다.');
        case 409:
          throw new Error('최상위 스톤은 태스크 생성이 불가합니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '태스크 생성 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 스톤 참여자 목록 조회 API
 * @param {string} stoneId - 스톤 ID
 * @returns {Promise<Object>} 스톤 참여자 목록
 */
export const getStoneParticipantList = async (stoneId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    const response = await axios.get(`${baseURL}/workspace-service/stone/participant/${stoneId}`, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('스톤 참여자 목록 조회 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '스톤 참여자 목록을 불러올 수 없습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('스톤 참여자 조회 권한이 없습니다.');
        case 404:
          throw new Error('스톤을 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '스톤 참여자 목록 조회 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 태스크 수정 API
 * @param {Object} taskData - 수정할 태스크 데이터
 * @param {string} taskData.taskId - 태스크 ID
 * @param {string} taskData.taskName - 태스크명
 * @param {string} taskData.startTime - 시작일 (YYYY-MM-DDTHH:mm:ss 형식)
 * @param {string} taskData.endTime - 종료일 (YYYY-MM-DDTHH:mm:ss 형식)
 * @param {string} taskData.NewManagerUserId - 새로운 담당자 UUID (선택사항)
 * @returns {Promise<Object>} API 응답 데이터
 */
export const modifyTask = async (taskData) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!taskData.taskId) {
      throw new Error('태스크 ID가 필요합니다.');
    }
    
    if (!taskData.taskName) {
      throw new Error('태스크명이 필요합니다.');
    }
    
    if (!taskData.startTime || !taskData.endTime) {
      throw new Error('시작일과 종료일이 필요합니다.');
    }
    
    const requestData = {
      taskId: taskData.taskId,
      taskName: taskData.taskName,
      startTime: taskData.startTime,
      endTime: taskData.endTime
    };
    
    // 새로운 담당자가 있는 경우에만 추가
    if (taskData.NewManagerUserId) {
      requestData.NewManagerUserId = taskData.NewManagerUserId;
    }
    
    console.log('태스크 수정 API 요청 데이터:', requestData);
    
    const response = await axios.patch(`${baseURL}/workspace-service/task`, requestData, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('태스크 수정 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '태스크 수정에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('태스크 수정 권한이 없습니다.');
        case 404:
          throw new Error('태스크 또는 담당자를 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '태스크 수정 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 태스크 삭제 API
 * @param {string} taskId - 삭제할 태스크 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const deleteTask = async (taskId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!taskId) {
      throw new Error('태스크 ID가 필요합니다.');
    }
    
    const response = await axios.delete(`${baseURL}/workspace-service/task/${taskId}`, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('태스크 삭제 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '태스크 삭제에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('태스크 삭제 권한이 없습니다.');
        case 404:
          throw new Error('태스크를 찾을 수 없습니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '태스크 삭제 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 태스크 완료 처리 API
 * @param {string} taskId - 완료 처리할 태스크 ID
 * @returns {Promise<Object>} API 응답 데이터 (마일스톤 정보 포함)
 */
export const completeTask = async (taskId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!taskId) {
      throw new Error('태스크 ID가 필요합니다.');
    }
    
    const response = await axios.patch(`${baseURL}/workspace-service/task/done/${taskId}`, {}, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('태스크 완료 처리 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '태스크 완료 처리에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('태스크 완료 처리 권한이 없습니다.');
        case 404:
          throw new Error('태스크를 찾을 수 없습니다.');
        case 409:
          throw new Error('이미 완료된 태스크입니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '태스크 완료 처리 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 태스크 취소 처리 API
 * @param {string} taskId - 취소 처리할 태스크 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const cancelTask = async (taskId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!taskId) {
      throw new Error('태스크 ID가 필요합니다.');
    }
    
    const response = await axios.patch(`${baseURL}/workspace-service/task/cancel/${taskId}`, {}, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('태스크 취소 처리 API 호출 실패:', error);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '태스크 취소 처리에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('태스크 취소 권한이 없습니다.');
        case 404:
          throw new Error('태스크를 찾을 수 없습니다.');
        case 409:
          throw new Error('이미 미완료 상태의 태스크입니다.');
        case 500:
          throw new Error(message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '태스크 취소 처리 중 오류가 발생했습니다.');
    }
  }
};

/**
 * 스톤 완료 처리 API
 * @param {string} stoneId - 완료 처리할 스톤 ID
 * @returns {Promise<Object>} API 응답 데이터
 */
export const completeStone = async (stoneId) => {
  try {
    const userId = localStorage.getItem('id');
    
    if (!userId) {
      throw new Error('사용자 ID가 없습니다. 로그인을 확인해주세요.');
    }
    
    if (!stoneId) {
      throw new Error('스톤 ID가 필요합니다.');
    }
    
    const response = await axios.patch(`${baseURL}/workspace-service/stone/done/${stoneId}`, {}, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('스톤 완료 처리 API 호출 실패:', error);
    console.error('에러 응답 데이터:', error.response?.data);
    console.error('에러 상태 코드:', error.response?.status);
    
    if (error.response) {
      const statusCode = error.response.status;
      const message = error.response.data?.statusMessage || error.response.data?.message || '스톤 완료 처리에 실패했습니다.';
      
      switch (statusCode) {
        case 400:
          throw new Error(message);
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        case 403:
          throw new Error('스톤 완료 처리 권한이 없습니다.');
        case 404:
          throw new Error('스톤을 찾을 수 없습니다.');
        case 409:
          throw new Error('이미 완료된 스톤이거나 모든 태스크가 완료되지 않았습니다.');
        case 500:
          // 500 에러의 경우 더 자세한 정보 표시
          const detailedMessage = error.response.data?.message || message;
          throw new Error(`서버 오류가 발생했습니다: ${detailedMessage}`);
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.');
    } else {
      throw new Error(error.message || '스톤 완료 처리 중 오류가 발생했습니다.');
    }
  }
};