<template>
  <v-app>
    <SideBarComponent />
    <HeaderComponent />
    <v-main>
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
  data() {
    return {
      
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
</style>
