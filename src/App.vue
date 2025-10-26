<template>
  <v-app>
    <SideBarComponent v-if="!hideLayout" />
    <HeaderComponent v-if="!hideLayout" />
    <v-main :class="hideLayout ? 'no-offset' : 'with-offset'">
      <router-view />
      <GlobalSnackbar />
    </v-main>

    <!-- 전역 챗봇 버튼 및 오버레이 -->
    <v-btn v-if="!hideLayout && !hideChatbot" class="chatbot-fab" icon @click="isChatBotOpen = true">
      <v-icon>mdi-robot-outline</v-icon>
    </v-btn>
    <v-overlay v-if="!hideLayout && !hideChatbot" :model-value="isChatBotOpen" scrim="rgba(0,0,0,0.25)" @click:outside="isChatBotOpen = false" class="align-end justify-end" persistent>
      <ChatBotPage @close="isChatBotOpen = false" />
    </v-overlay>
  </v-app>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue';
import SideBarComponent from './components/SideBarComponent.vue';
import GlobalSnackbar from './components/GlobalSnackbar.vue';
import ChatBotPage from './views/ChatBot/ChatBotPage.vue';

export default {
  name: "App",
  components: {
    SideBarComponent,
    HeaderComponent,
    GlobalSnackbar,
    ChatBotPage,
  },
  data() {
    return {
      isChatBotOpen: false,
    };
  },
  computed: {
    hideLayout() {
      return this.$route.meta?.hideLayout === true;
    },
    hideChatbot() {
      return this.$route.meta?.hideChatbot === true;
    }
  }
}
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
.with-offset { padding-top: 64px; padding-left: 240px; }
.no-offset { padding: 0; }

.chatbot-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  background: #FFE364;
  color: #2A2828;
}
.chatbot-fab:focus, .chatbot-fab:focus-visible { outline: none !important; box-shadow: none !important; }
.chatbot-fab { -webkit-tap-highlight-color: transparent; }
</style>
