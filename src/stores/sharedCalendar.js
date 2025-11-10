import { defineStore } from "pinia";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const useSharedCalendarStore = defineStore("sharedCalendar", {
  state: () => ({
    schedules: [],      // 내 일정 + 구독 일정
    subscriptions: [],  // 구독 리스트
    loading: false,
    error: null,
  }),

  actions: {
    /** ✅ 내 일정 + 구독 일정 조회 */
    async loadAllSchedules(workspaceId) {
      this.loading = true;
      const userId = localStorage.getItem("id");
      try {
        // 내 일정 조회
        const myRes = await axios.get(`${baseURL}/user-service/shared-calendars/${workspaceId}`, {
          headers: { "X-User-Id": userId },
        });
        let all = [...myRes.data];

        // 구독자 리스트 조회
        const subRes = await axios.get(`${baseURL}/user-service/subscriptions/${workspaceId}`, {
          headers: { "X-User-Id": userId },
        });
        this.subscriptions = subRes.data;

        // 각 구독자의 일정 추가
        subRes.data.forEach((sub) => {
          if (sub.sharedCalendars?.length) {
            all.push(...sub.sharedCalendars.map(sc => ({
              ...sc,
              targetUserId: sub.targetUserId,
            })));
          }
        });

        this.schedules = all;
      } catch (err) {
        console.error("❌ 일정 로드 실패:", err);
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    /** ✅ 일정 등록 */
    async createSchedule(payload) {
      const userId = localStorage.getItem("id");
      const res = await axios.post(`${baseURL}/user-service/shared-calendars`, payload, {
        headers: { "X-User-Id": userId },
      });
      await this.loadAllSchedules(payload.workspaceId);
      return res.data;
    },

    /** ✅ 일정 수정 */
    async updateSchedule(calendarId, payload) {
      const userId = localStorage.getItem("id");
      const res = await axios.put(`${baseURL}/user-service/shared-calendars/${calendarId}`, payload, {
        headers: { "X-User-Id": userId },
      });
      await this.loadAllSchedules(payload.workspaceId);
      return res.data;
    },

    /** ✅ 일정 삭제 */
    async deleteSchedule(calendarId, workspaceId) {
      const userId = localStorage.getItem("id");
      await axios.delete(`${baseURL}/user-service/shared-calendars/${calendarId}`, {
        headers: { "X-User-Id": userId },
      });
      await this.loadAllSchedules(workspaceId);
    },

    /** ✅ 구독자 삭제 */
    async deleteSubscription(subIds, workspaceId) {
      const userId = localStorage.getItem("id");
      await axios.delete(`${baseURL}/user-service/subscriptions`, {
        headers: { "X-User-Id": userId },
        data: { subscriptionIdList: subIds },
      });
      await this.loadAllSchedules(workspaceId);
    },

    /** ✅ 구독 추가 */
    async addSubscription(workspaceId, targetUserIdList) {
      const userId = localStorage.getItem("id");
      await axios.post(`${baseURL}/user-service/subscriptions`, {
        workspaceId,
        targetUserIdList,
      }, {
        headers: { "X-User-Id": userId },
      });
      await this.loadAllSchedules(workspaceId);
    },
  },
});
