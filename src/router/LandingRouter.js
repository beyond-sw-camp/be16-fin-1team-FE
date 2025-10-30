import LandingPage from "../components/LandingPage.vue";

export const landingRouter = [
  {
    path: "/landing",
    name: "Landing",
    component: LandingPage,
    meta: { hideLayout: true, hideChatbot: true },
  },
];


