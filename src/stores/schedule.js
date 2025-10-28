// src/stores/schedule.js
import { defineStore } from "pinia";
import scheduleApi from "@/api/schedule";

export const useScheduleStore = defineStore("schedule", {
  state: () => ({
    loading: false,
    workspaceId: null,
    milestones: [],
    tasks: [],
    todos: [],
    error: null,
  }),

  getters: {
    todayStr: () => new Date().toISOString().slice(0, 10),
  },

  actions: {
    setWorkspace(id) {
      this.workspaceId = id;
    },

    async loadAll() {
      if (!this.workspaceId) return;
      this.loading = true;
      this.error = null;

      try {
        const [ms, tasks, todos] = await Promise.all([
          scheduleApi.fetchMyMilestones(this.workspaceId),
          scheduleApi.fetchMyTasks(this.workspaceId),
          scheduleApi.fetchPersonalTodos(this.workspaceId),
        ]);
        this.milestones = ms;
        this.tasks = tasks;
        this.todos = todos;
      } catch (e) {
        this.error = e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    async toggleTodo(id, done) {
      await scheduleApi.toggleTodo(id, done);
      const t = this.todos.find((x) => x.id === id);
      if (t) t.done = done;
    },

    async toggleTask(id, done) {
      await scheduleApi.toggleTask(id, done);
      const t = this.tasks.find((x) => x.id === id);
      if (t) t.done = done;
    },
  },
});
