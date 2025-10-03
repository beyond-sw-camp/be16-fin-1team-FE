<template>
  <v-app>
    <SideBarComponent v-if="!hideLayout" />
    <HeaderComponent v-if="!hideLayout" />
    <v-main :class="hideLayout ? 'no-offset' : 'with-offset'">
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue';
import SideBarComponent from './components/SideBarComponent.vue';

export default {
  name: "App",
  components: {
    SideBarComponent,
    HeaderComponent,
  },
  computed: {
    hideLayout() {
      return this.$route.meta?.hideLayout === true;
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
</style>
