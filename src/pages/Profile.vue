<template>
  <div class="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow">
    <h2 class="text-xl font-bold mb-4">Profile</h2>

    <input v-model="name" class="input" placeholder="Full Name" />
    <textarea v-model="bio" class="input" placeholder="Bio"></textarea>

    <button @click="saveProfile" class="btn-primary w-full">Save</button>

    <p class="text-green-600 mt-2">{{ msg }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const user = ref(null)
const name = ref('')
const bio = ref('')
const msg = ref('')

onMounted(async () => {
  const { data: { user: u }} = await supabase.auth.getUser()
  user.value = u

  const { data } = await supabase.from('profiles')
    .select('*')
    .eq('id', u.id)
    .single()

  name.value = data?.full_name || ""
  bio.value = data?.bio || ""
})

async function saveProfile() {
  const { error } = await supabase.from('profiles').upsert({
    id: user.value.id,
    full_name: name.value,
    bio: bio.value
  })

  msg.value = error ? error.message : 'Profile updated!'
}
</script>

<style scoped>
.input { @apply w-full p-3 border rounded-lg mb-3; }
.btn-primary { @apply bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700; }
</style>
