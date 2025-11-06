import AdminDashboard from '@/views/Admin/AdminDashboard.vue';
import CreatePermissionGroup from '@/views/Admin/CreatePermissionGroup.vue';
import EditPermissionGroup from '@/views/Admin/EditPermissionGroup.vue';
import MemberManagement from '@/views/Admin/MemberManagement.vue';
import InviteMember from '@/views/Admin/InviteMember.vue';
import CreateUserGroup from '@/views/Admin/CreateUserGroup.vue';
import EditUserGroup from '@/views/Admin/EditUserGroup.vue';
import AddPermissionGroupUsers from '@/views/Admin/AddPermissionGroupUsers.vue';
import PermissionGroupDetail from '@/views/Admin/PermissionGroupDetail.vue';
import UserGroupDetail from '@/views/Admin/UserGroupDetail.vue';

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
    },
    {
        path: '/admin/edit-permission-group/:groupId',
        name: 'EditPermissionGroup',
        component: EditPermissionGroup,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/member-management',
        name: 'MemberManagement',
        component: MemberManagement,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/invite-member',
        name: 'InviteMember',
        component: InviteMember,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/create-group',
        name: 'CreateUserGroup',
        component: CreateUserGroup,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/edit-group/:groupId',
        name: 'EditUserGroup',
        component: EditUserGroup,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/permission-group/:groupId/add-users',
        name: 'AddPermissionGroupUsers',
        component: AddPermissionGroupUsers,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/permission-group/:groupId/detail',
        name: 'PermissionGroupDetail',
        component: PermissionGroupDetail,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    },
    {
        path: '/admin/user-group/:groupId/detail',
        name: 'UserGroupDetail',
        component: UserGroupDetail,
        meta: {
            requiresAuth: true,
            isAdmin: true
        }
    }
];
