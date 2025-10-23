import GoogleRedirect from "../views/User/GoogleRedirect.vue";
import KakaoRedirect from "../views/User/KakaoRedirect.vue";
import UserLogin from "../views/User/UserLogin.vue";

import UserCreate_InputEmail from "../views/User/UserCreate_InputEmail.vue";

export const userRouter = [
    {
        path: "/login",
        name: "UserLogin",
        component: UserLogin,
        meta: { hideLayout: true }
    },
    {
        path: "/oauth/kakao/redirect",
        name: "KakaoRedirect",
        component: KakaoRedirect,
        meta: { hideLayout: true }
    },
    {
        path: "/oauth/google/redirect",
        name: "GoogleRedirect",
        component: GoogleRedirect
    },
    {
        path: "/new-user/input-email",
        name: "UserCreate_InputEmail",
        component: UserCreate_InputEmail,
        meta: { hideLayout: true }
    },
]