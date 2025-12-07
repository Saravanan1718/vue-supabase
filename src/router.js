import { createRouter, createWebHistory } from "vue-router";
import Login from "./pages/Login.vue";
import Dashboard from "./pages/Dashboard.vue";
import Profile from "./pages/Profile.vue";
import TreeEditor from "./pages/TreeEditor.vue"; // <-- Add this

import { supabase } from "./supabase"; // <-- Needed for auth guard

const routes = [
  { path: "/", redirect: "/dashboard" },

  { path: "/login", component: Login },

  {
    path: "/dashboard",
    component: Dashboard,
    meta: { requiresAuth: true }
  },

    // NEW EDITOR ROUTE
  {
    path: "/tree/:tree_id",
    component: TreeEditor,
    meta: { requiresAuth: true }
  },

  { path: "/profile", component: Profile, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔐 AUTH GUARD – protect dashboard + editor + profile
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return "/login";

  return true;
});

export default router;
