import http from "@/utils/http";

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const getMySchedules = async (workspaceId) => {
  const userId = localStorage.getItem("id");
  const res = await http.get(`/user-service/shared-calendars/${workspaceId}`, {
    baseURL,
    headers: { "X-User-Id": userId },
  });
  return res.data;
};

export const getSubscriptions = async (workspaceId) => {
  const userId = localStorage.getItem("id");
  const res = await http.get(`/user-service/subscriptions/${workspaceId}`, {
    baseURL,
    headers: { "X-User-Id": userId },
  });
  return res.data;
};
