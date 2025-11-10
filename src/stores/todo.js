import { defineStore } from "pinia";
import http from "@/utils/http";

export const useTodoStore = defineStore("todo", {
  state: () => ({
    todos: [],           // 날짜별 목록 (화면에서 보여줄)
    allTodos: [],        // 전체 목록 (북마크용)
    loading: false,
    error: null,
  }),

  actions: {
    /** 특정 날짜의 Todo 목록 조회 */
    async loadTodosByDate(workspaceId, date) {
        try {
            this.loading = true;
            this.error = null;
            const userId = localStorage.getItem("id");

            const res = await http.get(`/user-service/todo/${workspaceId}`, {
            headers: { "X-User-Id": userId },
            params: { date },
            });

            // 백엔드에서 배열이 바로 반환될 경우
            console.log("📅 선택 날짜 ToDo 목록:", res.data);
            this.todos = Array.isArray(res.data) ? res.data : res.data.result || [];
        } catch (err) {
            console.error("❌ Todo 조회 실패:", err);
            this.error = err;
        } finally {
            this.loading = false;
        }
    },

    /** 모든 To-Do 조회 (북마크 전용) */
    async loadAllTodos(workspaceId) {
        // try {
        //     this.loading = true;
        //     this.error = null;
        //     const userId = localStorage.getItem("id");

        //     const res = await axios.get(`/user-service/todo/${workspaceId}/all`, {
        //     headers: { "X-User-Id": userId },
        //     });

        //     console.log("📋 전체 ToDo 목록:", res.data);
        //     this.todos = Array.isArray(res.data) ? res.data : res.data.result || [];
        // } catch (err) {
        //     console.error("❌ 전체 Todo 조회 실패:", err);
        //     this.error = err;
        // } finally {
        //     this.loading = false;
        // }
        try {
            const userId = localStorage.getItem("id");
            const res = await http.get(`/user-service/todo/${workspaceId}/all`, {
            headers: { "X-User-Id": userId },
            });

            console.log("📋 전체 ToDo 목록:", res.data);
            this.allTodos = Array.isArray(res.data) ? res.data : res.data.result || [];
        } catch (err) {
            console.error("❌ 전체 Todo 조회 실패:", err);
            this.error = err;
        }
    },

    /** 완료 처리 */
    async completeTodo(todoId) {
      try {
        await http.put(`/user-service/todo/completion/${todoId}`);
        console.log("✅ 완료 처리됨:", todoId);
      } catch (err) {
        console.error("❌ 완료 처리 실패:", err);
      }
    },

    /** 미완료 처리 */
    async uncompleteTodo(todoId) {
      try {
        await http.put(`/user-service/todo/incompletion/${todoId}`);
        console.log("↩️ 미완료 처리됨:", todoId);
      } catch (err) {
        console.error("❌ 미완료 처리 실패:", err);
      }
    },

    /** Todo 등록 */
    async addTodo({ workspaceId, name, bookmark, date }) {
        try {
            const userId = localStorage.getItem("id");

            if (!workspaceId) throw new Error("워크스페이스 ID가 존재하지 않습니다.");
            if (!date || typeof date !== "string") throw new Error("날짜 형식이 잘못되었습니다.");

            const res = await http.post(
            `/user-service/todo`,
            {
                workspaceId,
                calendarName: name,
                calendarType: "TODO",
                date,
                bookmark,
            },
            { headers: { "X-User-Id": userId } }
            );

            console.log("✅ Todo 등록 성공:", res.data);
            await this.loadTodosByDate(workspaceId, date);
        } catch (err) {
            console.error("❌ Todo 등록 실패:", err);
            this.error = err;
        }
    },


    /** Todo 완료 토글 */
    async toggleTodo(todoId, done) {
      try {
        const userId = localStorage.getItem("id");

            const res = await http.patch(
          `/user-service/todo/${todoId}`,
          { done },
          { headers: { "X-User-Id": userId } }
        );

        console.log("✅ Todo 완료 상태 변경:", res.data);

        // 로컬에서도 즉시 반영
        const t = this.todos.find((x) => x.id === todoId);
        if (t) t.done = done;
      } catch (err) {
        console.error("❌ Todo 상태 변경 실패:", err);
        this.error = err;
      }
    },

    /** Todo 삭제 (옵션) */
    async deleteTodo(todoId, workspaceId) {
      try {
        const userId = localStorage.getItem("id");
        await http.delete(`/user-service/todo/${todoId}`, {
          headers: { "X-User-Id": userId },
        });
        console.log("🗑️ Todo 삭제 완료:", todoId);
        await this.loadTodos(workspaceId);
      } catch (err) {
        console.error("❌ Todo 삭제 실패:", err);
        this.error = err;
      }
    },
  },
});
