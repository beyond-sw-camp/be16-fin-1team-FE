import { createRouter, createWebHistory } from 'vue-router'
import { homeRouter } from "./HomeRouter";
import { mainRouter } from './MainRouter';
import { userRouter } from './UserRouter';
import { chatRouter } from './ChatRouter';
import { workspaceRouter } from './WorkspaceRouter';
import { adminRouter } from './AdminRouter';

const routes = [
    ...homeRouter,
    ...mainRouter,
    ...userRouter,
    ...chatRouter,
    ...workspaceRouter,
    ...adminRouter,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 라우터 가드 - 권한 체크
router.beforeEach((to, from, next) => {
  // 관리자 권한이 필요한 라우트인지 확인
  if (to.meta.isAdmin) {
    const role = localStorage.getItem('selectedWorkspaceRole');
    
    if (role !== 'ADMIN') {
      // 관리자 권한이 없으면 홈으로 리다이렉트
      console.log('관리자 권한이 없어서 홈으로 리다이렉트');
      next('/');
      return;
    }
  }
  
  next();
});

export default router;