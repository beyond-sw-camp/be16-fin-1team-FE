import StompChatPage from "../views/Chat/StompChatPage.vue";

export const chatRouter = [
    {
        path: "/chat/page/:roomId",
        name: "StompChatPage",
        component: StompChatPage,
    },
]