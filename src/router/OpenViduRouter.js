import OpenViduCall from "../views/OpenVidu/OpenViduCall.vue";


export const openViduRouter = [
    {
        path:'/callpage/:roomId',
        name: 'OpenViduCall',
        component: OpenViduCall
    }
]