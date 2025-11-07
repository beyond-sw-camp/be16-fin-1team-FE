import http from "@/utils/http";

const baseURL = import.meta.env.VITE_API_BASE_URL;

// 나의 태스크 목록 조회 API
export const getMyTasks = async () => {
  try {
    const userId = localStorage.getItem("id");
    const workspaceId = localStorage.getItem("selectedWorkspaceId");

    const response = await http.get(`/workspace-service/workspace/${workspaceId}/my-tasks`, {
      baseURL,
      headers: { "X-User-Id": userId },
    });

    return response.data;
  } catch (error) {
    console.error("❌ 나의 Task 조회 실패:", error);
    throw error;
  }
};

// 나의 프로젝트 목록 조회
export const getMyProjects = async (workspaceId) => {
  try {
    const response = await http.get(`/workspace-service/workspace/${workspaceId}/my-projects`, {
      baseURL,
    });
    return response.data;
  } catch (error) {
    console.error('나의 프로젝트 조회 실패:', error);
    throw error;
  }
};

// 나의 스톤 목록 조회 (워크스페이스 내)
export const getMyStones = async (workspaceId) => {
  try {
    const userId = localStorage.getItem("id");
    const response = await http.get(`/workspace-service/workspace/${workspaceId}/my-stones`, {
      baseURL,
      headers: { "X-User-Id": userId },
    });
    return response.data;
  } catch (error) {
    console.error("❌ 나의 스톤 조회 실패:", error);
    throw error;
  }
};