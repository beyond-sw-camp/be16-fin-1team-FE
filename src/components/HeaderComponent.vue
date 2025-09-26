<template>
  <v-app-bar class="app-header" flat density="comfortable">
    <v-toolbar-title>Header</v-toolbar-title>
  </v-app-bar>
  
  
</template>

<script>
export default {
  name: "HeaderComponent",
};
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  z-index: 1000;
  background-color: #F5F5F5;
  color: #000000;
  border-bottom: 2px solid #000000;
}
</style>