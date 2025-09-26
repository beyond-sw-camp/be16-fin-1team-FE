<template>
  <v-navigation-drawer class="app-sidebar" permanent>
    <v-list density="comfortable">
      <v-list-item title="Menu 1" />
      <v-list-item title="Menu 2" />
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: "SideBarComponent",
};
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 240px;
  z-index: 900;
  background-color: #2A2828;
  color: #FFFFFF;
}
</style>
