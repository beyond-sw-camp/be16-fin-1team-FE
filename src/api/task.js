import http from '@/utils/http.js';

// 나의 Task 목록 조회
export const getMyTasks = async (workspaceId) => {
  try {
    const response = await http.get(`/workspace-service/workspace/${workspaceId}/my-tasks`);
    return response.data;
  } catch (error) {
    console.error('나의 Task 조회 실패:', error);
    throw error;
  }
};

// 나의 프로젝트 목록 조회
export const getMyProjects = async (workspaceId) => {
  try {
    const response = await http.get(`/workspace-service/workspace/${workspaceId}/my-projects`);
    return response.data;
  } catch (error) {
    console.error('나의 프로젝트 조회 실패:', error);
    throw error;
  }
};
