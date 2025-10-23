import { createRouter, createWebHistory } from 'vue-router'
import { homeRouter } from "./HomeRouter";
import { mainRouter } from './MainRouter';
import { userRouter } from './UserRouter';
import { chatRouter } from './ChatRouter';
import { documentRouter } from './DocumentRouter';
import { chatBotRouter } from './ChatBotRouter';

const routes = [
    ...homeRouter,
    ...mainRouter,
    ...userRouter,
    ...chatRouter,
    ...documentRouter,
    ...chatBotRouter,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;