import http from '@/utils/http.js';

// 나의 태스크 목록 조회 API
export const getMyTasks = async () => {
  try {
    const userId = localStorage.getItem("id");
    const workspaceId = localStorage.getItem("selectedWorkspaceId");

    const response = await http.get(
      `/workspace-service/workspace/${workspaceId}/my-tasks`,
      {
        headers: { "X-User-Id": userId },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ 나의 Task 조회 실패:", error);
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
