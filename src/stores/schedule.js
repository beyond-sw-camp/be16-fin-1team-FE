import { defineStore } from "pinia";
import axios from "axios";
import scheduleApi from "@/api/schedule";
import { completeTask, deleteTask } from "../services/stoneService";
import { getMyTasks } from "@/api/task";

export const useScheduleStore = defineStore("schedule", {
  state: () => ({
    loading: false,
    workspaceId: "",
    milestones: [],
    tasks: [],
    todos: [],
    myTasks: [],
    personalSchedules: [],
    error: null,
  }),

  getters: {
    todayStr: () => new Date().toISOString().slice(0, 10),
  },

  actions: {
    setWorkspace(id) {
      this.workspaceId = id;
    },

    /** 내 태스크 불러오기 */
    async loadMyTasks() {
      try {
        this.loading = true;
        const res = await getMyTasks(); // workspaceId 내부에서 가져옴
        const rawTasks = res.result || [];

        // API 필드 이름 매핑
        this.myTasks = rawTasks.map((t) => ({
          ...t,
          isDone: t.done,
        }));
      } catch (error) {
        console.error("내 태스크 불러오기 실패:", error);
        this.error = error;
      } finally {
        this.loading = false;
      }
    },

    /** 태스크 완료 처리 */
    async completeTask(id) {
      try {
        await completeTask(id);
        const target = this.tasks.find((t) => t.id === id);
        if (target) target.done = true;
      } catch (err) {
        console.error("❌ 태스크 완료 실패:", err);
      }
    },

    /** 태스크 삭제 */
    async removeTask(id) {
      try {
        await deleteTask(id);
        this.tasks = this.tasks.filter((t) => t.id !== id);
      } catch (err) {
        console.error("❌ 태스크 삭제 실패:", err);
      }
    },

    /** 마일스톤 로드 */
    async loadMilestones() {
      try {
        const userId = localStorage.getItem("id");
        const workspaceId = localStorage.getItem("selectedWorkspaceId");
        const workspaceType = localStorage.getItem("selectedWorkspaceType");

        if (!userId || !workspaceId) {
          console.warn("⚠️ workspaceId 또는 userId 없음");
          return;
        }

        if (workspaceType === "PERSONAL") {
          console.info("ℹ️ 개인 워크스페이스에서는 마일스톤 표시 안 함");
          this.milestones = [];
          return;
        }

        const res = await axios.get(`/workspace-service/stone/milestone/${workspaceId}`, {
          headers: { "X-User-Id": userId },
        });

        console.log("✅ milestone response:", res.data);

        // 안전하게 데이터 추출
        const data = res.data?.result ?? res.data?.data?.result ?? [];
        const result = Array.isArray(data) ? data : [];

        const allStones = result.flatMap((p) => p.milestoneResDtoList || []);

        const calcDday = (endTime) => {
          const end = new Date(endTime);
          const now = new Date();
          const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
          return diff >= 0 ? diff : 0;
        };

        this.milestones = allStones.map((stone) => ({
          name: stone.stoneName,
          dday: calcDday(stone.endTime),
          progress: Math.round(stone.milestone),
        }));

        console.log("✅ parsed milestones:", this.milestones);
      } catch (err) {
        console.error("❌ 마일스톤 조회 실패:", err);
      }
    },


    /** 태스크 토글 */
    async toggleTask(id, done) {
      await scheduleApi.toggleTask(id, done);
      const t = this.tasks.find((x) => x.id === id);
      if (t) t.done = done;
    },

    /** 개인 일정 로드 */
    async loadPersonalSchedules() {
      try {
        const workspaceId = localStorage.getItem("selectedWorkspaceId");
        const userId = localStorage.getItem("id");

        if (!workspaceId || !userId) {
          console.warn("⚠️ 개인 일정 조회에 필요한 정보 부족");
          return;
        }

        const schedules = await scheduleApi.fetchPersonalSchedules(workspaceId, userId);

        // ✅ 오늘 날짜 포함된 일정만 필터링
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 시각 초기화

        this.personalSchedules = schedules.filter((s) => {
          const start = new Date(s.startAt);
          const end = new Date(s.endAt);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          return start <= today && today <= end;
        });

        console.log("✅ 오늘 포함 개인 일정:", this.personalSchedules);
      } catch (err) {
        console.error("❌ 개인 일정 로드 실패:", err);
        this.error = err;
      }
    },
  },
});
