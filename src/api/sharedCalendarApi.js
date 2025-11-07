import http from "@/utils/http";

export const getMySchedules = async (workspaceId) => {
  const userId = localStorage.getItem("id");
  const res = await http.get(`user-service/shared-calendars/${workspaceId}`, {
    headers: { "X-User-Id": userId },
  });
  return res.data;
};

export const getSubscriptions = async (workspaceId) => {
  const userId = localStorage.getItem("id");
  const res = await http.get(`user-service/subscriptions/${workspaceId}`, {
    headers: { "X-User-Id": userId },
  });
  return res.data;
};
