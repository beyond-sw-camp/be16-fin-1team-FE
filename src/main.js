import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './styles/tokens.css'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import router from './router';
import vuetify from './plugins/vuetify';
import axios from 'axios';

const app = createApp(App);
const pinia = createPinia();

axios.interceptors.request.use(
    config => {
        const accessToken = localStorage.getItem("accessToken");
        if(accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
)

app.use(pinia);
app.use(router);
app.use(vuetify)
app.mount('#app')
