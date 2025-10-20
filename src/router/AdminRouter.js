import AdminDashboard from '@/views/Admin/AdminDashboard.vue';
import CreatePermissionGroup from '@/views/Admin/CreatePermissionGroup.vue';

export const adminRouter = [
    {
        path: '/admin',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/create-permission-group',
        name: 'CreatePermissionGroup',
        component: CreatePermissionGroup,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    }
];
