import ScheduleHome from "@/views/schedule/ScheduleHome.vue";
import ProjectCalendar from "@/views/schedule/ProjectCalendar.vue";

export const scheduleRouter = [
  {
    path: "/schedule",
    name: "MySchedule",
    component: ScheduleHome,
    meta: { title: "내 일정" },
  },
  { 
    path: "/schedule/project", 
    name: "ProjectCalendar", 
    component: ProjectCalendar,
  },
];