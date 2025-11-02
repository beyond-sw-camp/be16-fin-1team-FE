import axios from "axios";

const userId = localStorage.getItem("id");

export const getMySchedules = async (workspaceId) => {
  const res = await axios.get(`/user-service/shared-calendars/${workspaceId}`, {
    headers: { "X-User-Id": userId },
  });
  return res.data;
};

export const getSubscriptions = async (workspaceId) => {
  const res = await axios.get(`/user-service/subscriptions/${workspaceId}`, {
    headers: { "X-User-Id": userId },
  });
  return res.data;
};
