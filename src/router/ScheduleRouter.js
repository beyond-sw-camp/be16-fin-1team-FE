import ProjectCalendar from '../views/schedule/ProjectCalendar.vue';
import ScheduleHome from '../views/schedule/ScheduleHome.vue';
import ScheduleLayout from '../views/schedule/ScheduleLayout.vue';
// import SharedCalendarView from '../views/schedule/SharedCalendarView.vue';


export const scheduleRouter = [
    {
        path: '/schedule',
        component : ScheduleLayout,
        children: [
            {
                path: 'home',
                name: 'ScheduleHome',
                component: ScheduleHome,
            },
            {
                path: 'project',
                name: 'ScheduleProject',
                component: ProjectCalendar,
            },
            {
                path: 'shared',
                name: 'ScheduleShared',
                component: () => import("@/views/schedule/SharedCalendarView.vue"),
            },
            {
                path: '',
                redirect: '/schedule/home',
            },
        ],
    }
];