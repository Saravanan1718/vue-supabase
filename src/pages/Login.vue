<template>
  <div class="max-w-md mx-auto mt-20 bg-white p-6 rounded-xl shadow">
    <h2 class="text-2xl font-bold mb-4 text-center">Login / Sign Up</h2>

    <input v-model="email" class="input" type="email" placeholder="Email" />
    <input v-model="password" class="input" type="password" placeholder="Password" />

    <button @click="login" class="btn-primary w-full">Continue</button>

    <p class="text-red-500 mt-3 text-center">{{ msg }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { supabase } from "../supabase";

const email = ref("");
const password = ref("");
const msg = ref("");

async function login() {
  msg.value = "";

  let { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });

  if (error) {
    let { error: signUpErr } = await supabase.auth.signUp({ email: email.value, password: password.value });
    if (signUpErr) return msg.value = signUpErr.message;

    msg.value = "Check your email to confirm sign-up.";
  } else {
    window.location.href = "/dashboard";
  }
}
</script>

<style scoped>
.input { @apply w-full p-3 border rounded-lg mb-3; }
.btn-primary { @apply bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700; }
</style>