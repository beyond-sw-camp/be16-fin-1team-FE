import http from "@/utils/http";

const todoApi = {
  /** todo 조회 */
  fetchTodos(workspaceId) {
    const userId = localStorage.getItem("id");
    return http.get(`/user-service/todo/${workspaceId}`, {
      headers: { "X-User-Id": userId },
    });
  },

  /** todo 등록 */
  createTodo(data) {
    const userId = localStorage.getItem("id");
    return http.post(`/user-service/todo`, data, {
      headers: { "X-User-Id": userId },
    });
  },

  /** todo 완료/미완료 토글 */
  toggleComplete(todoId, done) {
    const userId = localStorage.getItem("id");
    const endpoint = done ? "completion" : "incompletion";
    return http.put(`/user-service/todo/${endpoint}/${todoId}`, {}, {
      headers: { "X-User-Id": userId },
    });
  },
};

export default todoApi;
