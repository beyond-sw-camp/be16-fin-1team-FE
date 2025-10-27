// Simple event-bus based snackbar service for Vue 3 Options API
import { reactive } from 'vue';

export const snackbarState = reactive({
  open: false,
  text: '',
  color: 'success',
  timeout: 3000,
});

export function showSnackbar(text, options = {}) {
  snackbarState.text = text || '';
  snackbarState.color = options.color || 'success';
  snackbarState.timeout = options.timeout ?? 3000;
  snackbarState.open = true;
}

export function closeSnackbar() {
  snackbarState.open = false;
}

export default { showSnackbar, closeSnackbar, snackbarState };


