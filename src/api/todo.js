import http from "@/utils/http";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const todoApi = {
  /** todo 조회 */
  fetchTodos(workspaceId) {
    const userId = localStorage.getItem("id");
    return http.get(`/user-service/todo/${workspaceId}`, {
      baseURL,
      headers: { "X-User-Id": userId },
    });
  },

  /** todo 등록 */
  createTodo(data) {
    const userId = localStorage.getItem("id");
    return http.post(`/user-service/todo`, data, {
      baseURL,
      headers: { "X-User-Id": userId },
    });
  },

  /** todo 완료/미완료 토글 */
  toggleComplete(todoId, done) {
    const userId = localStorage.getItem("id");
    const endpoint = done ? "completion" : "incompletion";
    return http.put(
      `/user-service/todo/${endpoint}/${todoId}`,
      {},
      {
        baseURL,
        headers: { "X-User-Id": userId },
      }
    );
  },
};

export default todoApi;
