import { createApp } from 'vue'
import 'virtual:uno.css'
import './style.css'
import App from './App.vue'
import { refreshAll } from './composables/useDevice'

void refreshAll()

createApp(App).mount('#app')
