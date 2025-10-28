const DriveRouter = [
    {
        path: '/drive',
        name: 'drive',
        component: () => import('@/views/Drive/DriveMain.vue'),
    },
    {
        path: '/drive/:folderId',
        name: 'driveFolder',
        component: () => import('@/views/Drive/DriveMain.vue'),
    }
];

export default DriveRouter;
