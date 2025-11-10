// src/api/schedule.js
import http from "@/utils/http";

const baseURL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// 내 마일스톤 (진행 중 / 삭제 제외는 서버에서 처리한다고 가정)
async function fetchMyMilestones(workspaceId) {
  const { data } = await http.get(`project/milestones/me`, {
    params: { workspaceId, excludeDeleted: true, excludeStatus: "Completed" },
  });

  // [{id, name, dueDate, progressPercent}] -> 화면용으로 가공
  return (data?.result ?? data ?? []).map((m) => {
    const dday = daysFromToday(m.dueDate);
    return {
      id: m.id,
      name: m.name || m.title,
      dday,
      progress: Math.round(m.progressPercent ?? m.progress ?? 0),
    };
  });
}

// 내 태스크
async function fetchMyTasks(workspaceId) {
  const { data } = await http.get(`project/tasks/me`, {
    params: { workspaceId },
  });
  return (data?.result ?? data ?? []).map((t) => ({
    id: t.id,
    title: t.title || t.name,
    startAt: t.startAt,
    endAt: t.endAt,
    done: !!t.completed || !!t.done,
  }));
}

// 개인 To-Do
async function fetchPersonalTodos(workspaceId) {
  const { data } = await http.get(`calendar/todos`, {
    params: { workspaceId, type: "PERSONAL" },
  });
  return (data?.result ?? data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    done: !!t.completed || !!t.done,
  }));
}

// 토글들
async function toggleTodo(todoId, done) {
  await http.patch(`calendar/todos/${todoId}`, { done });
}
async function toggleTask(taskId, done) {
  await http.patch(`project/tasks/${taskId}`, { done });
}

// utils
function daysFromToday(dateIso) {
  if (!dateIso) return 0;
  const d = new Date(dateIso);
  const now = new Date();
  const millis = d.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(millis / (1000 * 60 * 60 * 24));
}

// 개인 일정 (SharedCalendar)
async function fetchPersonalSchedules(workspaceId, userId) {
  const token = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
    "X-User-Id": userId,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${baseURL}/user-service/shared-calendars/${workspaceId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch personal schedules: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const list = data?.result ?? data ?? [];
  return list
    .filter((s) => s.userId === userId) // 본인 일정만
    .map((s) => ({
      id: s.id,
      title: s.calendarName,
      startAt: s.startedAt,
      endAt: s.endedAt,
      isShared: s.isShared,
      userName: s.userName,
    }));
}

export default {
  fetchMyMilestones,
  fetchMyTasks,
  fetchPersonalTodos,
  fetchPersonalSchedules,
  toggleTodo,
  toggleTask,
};
