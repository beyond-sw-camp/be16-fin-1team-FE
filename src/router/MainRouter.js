import Main from "../views/Main/Main.vue";
import SearchResults from "../views/Search/SearchResults.vue";


export const mainRouter = [
    {
        path: "/main",
        name: "Main",
        component: Main
    },
    {
        path: "/search",
        name: "SearchResults",
        component: SearchResults
    }
]