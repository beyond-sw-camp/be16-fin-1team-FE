import WorkspaceTest from "../views/Workspace/WorkspaceTest.vue";
import ProjectDashboardTemp from "../views/Project/ProjectDashboardTemp.vue";

export const workspaceRouter = [
    {
        path: "/workspace/test",
        name: "WorkspaceTest",
        component: WorkspaceTest
    },
    {
        path: "/project/dashboardTemp",
        name: "ProjectDashboardTemp",
        component: ProjectDashboardTemp
    }
];
