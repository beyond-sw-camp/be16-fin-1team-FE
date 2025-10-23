<template>
  <v-snackbar v-model="state.open" :color="state.color" :timeout="state.timeout" location="top" rounded="lg">
    {{ state.text }}
    <template #actions>
      <v-btn variant="text" @click="state.open = false">닫기</v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { snackbarState } from '../services/snackbar.js';

export default {
  name: 'GlobalSnackbar',
  data() {
    return { state: snackbarState };
  }
}
</script>

<style scoped>
</style>


