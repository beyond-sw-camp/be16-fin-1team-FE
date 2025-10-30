import { defineStore } from "pinia";
import axios from "axios";
import scheduleApi from "@/api/schedule";
import { completeTask, deleteTask } from "../services/stoneService";

export const useScheduleStore = defineStore("schedule", {
  state: () => ({
    loading: false,
    workspaceId: "",
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

    /** ✅ 내 담당 태스크 불러오기 */
    async loadMyTasks() {
      try {
        this.loading = true;
        const userId = localStorage.getItem("id");
        const userName = localStorage.getItem("name");
        const workspaceId = localStorage.getItem("selectedWorkspaceId");

        // 1️⃣ 마일스톤 목록 조회
        // const res = await axios.get(`/workspace-service/stone/milestone/${workspaceId}`, {
        //   headers: { "X-User-Id": userId },
        // });

        const res = await axios.get(`/workspace-service/stone/list/${workspaceId}`, {
          headers: { "X-User-Id": userId },
        });

        // const result = res.data.result || [];

        // // 2️⃣ 스톤 ID 추출
        // const stones = result.flatMap((p) =>
        //   p.milestoneResDtoList?.map((s) => s.stoneId) || []
        // );
        const stones = res.data?.result?.map((s) => s.stoneId)
                      || res.data?.data?.result?.map((s) => s.stoneId)
                      || [];

        console.log("📦 스톤 목록 (list API):", stones);  

        console.log("📦 스톤 목록:", stones);
        console.log("✅ workspaceId:", workspaceId, "✅ userId:", userId);
        console.log("📦 res.data:", res.data);
        console.log("📦 res.data.result:", res.data.result);



        // 3️⃣ 각 스톤별 태스크 호출
        const allTasks = [];
        for (const id of stones) {
          const tRes = await axios.get(`/workspace-service/stone/${id}`, {
            headers: { "X-User-Id": userId },
          });

          console.log("🧩 스톤 ID:", id, "태스크 응답:", tRes.data.result);


          const tasks = tRes.data.result?.taskResDtoList || [];
          const myTasks = tasks
            .filter((t) => String(t.taskManagerUserId).trim() === String(userId).trim())
            .map((t) => ({
              id: t.taskId,
              title: t.taskName,
              startAt: t.startTime,
              endAt: t.endTime,
              done: t.isDone,
            }));

          allTasks.push(...myTasks);
        }

        this.tasks = allTasks;
      } catch (err) {
        console.error("❌ 태스크 목록 로드 실패:", err);
      } finally {
        this.loading = false;
      }
    },

    /** ✅ 태스크 완료 처리 */
    async completeTask(id) {
      try {
        await completeTask(id);
        const target = this.tasks.find((t) => t.id === id);
        if (target) target.done = true;
      } catch (err) {
        console.error("❌ 태스크 완료 실패:", err);
      }
    },

    /** ✅ 태스크 삭제 */
    async removeTask(id) {
      try {
        await deleteTask(id);
        this.tasks = this.tasks.filter((t) => t.id !== id);
      } catch (err) {
        console.error("❌ 태스크 삭제 실패:", err);
      }
    },

    /** ✅ 마일스톤 로드 */
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


    /** ✅ 태스크 토글 */
    async toggleTask(id, done) {
      await scheduleApi.toggleTask(id, done);
      const t = this.tasks.find((x) => x.id === id);
      if (t) t.done = done;
    },
  },
});
