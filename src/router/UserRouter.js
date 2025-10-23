import GoogleRedirect from "../views/User/GoogleRedirect.vue";
import KakaoRedirect from "../views/User/KakaoRedirect.vue";
import UserLogin from "../views/User/UserLogin.vue";
import UserCreate_InputEmail from "../views/User/UserCreate_InputEmail.vue";
import UserCreate_ValidateEmail from "../views/User/UserCreate_ValidateEmail.vue";
import UserCreate_InputInfo from "../views/User/UserCreate_InputInfo.vue";
import ForgotPassword_InputEmail from "../views/User/ForgotPassword_InputEmail.vue";
import ForgotPassword_ValidateEmail from "../views/User/ForgotPassword_ValidateEmail.vue";
import ForgotPassword_InputInfo from "../views/User/ForgotPassword_InputInfo.vue";


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
    {
        path: "/new-user/validate-email",
        name: "UserCreate_ValidateEmail",
        component: UserCreate_ValidateEmail,
        meta: { hideLayout: true }
    },
    {
        path: "/new-user/input-info",
        name: "UserCreate_InputInfo",
        component: UserCreate_InputInfo,
        meta: { hideLayout: true }
    },
    {
        path: "/forgot-password/input-email",
        name: "ForgotPassword_InputEmail",
        component: ForgotPassword_InputEmail,
        meta: { hideLayout: true }
    },
    {
        path: "/forgot-password/validate-email",
        name: "ForgotPassword_ValidateEmail",
        component: ForgotPassword_ValidateEmail,
        meta: { hideLayout: true }
    },
    {
        path: "/forgot-password/input-info",
        name: "ForgotPassword_InputInfo",
        component: ForgotPassword_InputInfo,
        meta: { hideLayout: true }
    },
]