import { createRouter, createWebHistory } from 'vue-router'
import { homeRouter } from "./HomeRouter";
import { mainRouter } from './MainRouter';
import { userRouter } from './UserRouter';

const routes = [
    ...homeRouter,
    ...mainRouter,
    ...userRouter,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;