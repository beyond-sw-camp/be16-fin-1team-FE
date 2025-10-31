import DocumentDetail from "../views/Document/DocumentDetail.vue";
import DocumentViewer from "../views/Document/DocumentViewer.vue";

export const documentRouter = [
    {
        path: "/document/:documentId",
        name: "DocumentDetail",
        component: DocumentDetail,
        props: true
    },
    {
        path: "/viewer/:documentId",
        name: "DocumentViewer",
        component: DocumentViewer,
        props: true,
        meta: {
            hideLayout: true,
            hideChatbot: true
        }
    }
]