<template>
    <div class="flex gap-4">
      <router-link to="/dashboard" class="hover:underline">Dashboard</router-link>
      <router-link to="/profile" class="hover:underline">Profile</router-link>
      <router-link to="/uploads" class="hover:underline">Uploads</router-link>
      <button @click="logout" class="text-red-500 hover:underline">Logout</button>
    </div>
</template>

<script setup>
import {supabase} from '../supabase'
async function logout() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}
</script>
