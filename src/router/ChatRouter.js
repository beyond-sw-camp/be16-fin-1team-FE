import StompChatPage from "../views/Chat/StompChatPage.vue";
import ChatMain from "../views/Chat/ChatMain.vue";
import ChatRoomList from "../views/Chat/ChatRoomList.vue";

export const chatRouter = [
    {
        path: "/chat/page/:roomId",
        name: "StompChatPage",
        component: StompChatPage,
    },
    {
        path: "/chat/main",
        name: "ChatMain",
        component: ChatMain,
    },
    {
        path: "/chat/list",
        name: "ChatRoomList",
        component: ChatRoomList,
    },
]