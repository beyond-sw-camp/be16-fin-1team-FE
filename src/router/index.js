import { createRouter, createWebHistory } from 'vue-router'
import { homeRouter } from "./HomeRouter";
import { mainRouter } from './MainRouter';
import { userRouter } from './UserRouter';
import { chatRouter } from './ChatRouter';

const routes = [
    ...homeRouter,
    ...mainRouter,
    ...userRouter,
    ...chatRouter,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;