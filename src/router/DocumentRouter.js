import DocumentDetail from "../views/Document/DocumentDetail.vue";

export const documentRouter = [
    {
        path: "/document/:documentId",
        name: "DocumentDetail",
        component: DocumentDetail,
        props: true
    }
]