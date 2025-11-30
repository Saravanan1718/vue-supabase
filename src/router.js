import { createRouter, createWebHistory } from 'vue-router'
import Login from './pages/Login.vue'
import Dashboard from './pages/Dashboard.vue'
import Profile from './pages/Profile.vue'

const routes = [
    {path: '/', redirect: '/dashboard'},
    {path: '/login', component: Login},
    {path: '/dashboard', component: Dashboard},
    {path: '/profile', component: Profile},
]

const router = createRouter ({
    history: createWebHistory(),
    routes
})

export default router