<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
    <div class="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden p-8 transform transition-all hover:scale-[1.01]">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-gray-800 tracking-tight">Welcome Back</h2>
        <p class="text-gray-500 mt-2 text-sm">Sign in to manage your family tree</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            v-model="email" 
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
            type="email" 
            placeholder="you@example.com" 
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            v-model="password" 
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
            type="password" 
            placeholder="••••••••" 
          />
        </div>

        <button 
          @click="login" 
          :disabled="loading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          <span v-if="!loading">Continue</span>
          <span v-else class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
        </button>

        <p v-if="msg" :class="{'text-red-500': isError, 'text-green-500': !isError}" class="text-center text-sm font-medium mt-4 bg-gray-50 p-2 rounded-lg">
          {{ msg }}
        </p>
      </div>
      
      <div class="mt-8 text-center text-xs text-gray-400">
        <p>&copy; 2024 Family Tree App. Secure & Private.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { supabase } from "../supabase";
import '../index.css'

const email = ref("");
const password = ref("");
const msg = ref("");
const loading = ref(false);
const isError = ref(false);

async function login() {
  if (!email.value || !password.value) {
    msg.value = "Please fill in all fields";
    isError.value = true;
    return;
  }

  loading.value = true;
  msg.value = "";
  isError.value = false;

  try {
    let { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });

    if (error) {
      // Try sign up if login fails
      let { error: signUpErr } = await supabase.auth.signUp({ email: email.value, password: password.value });
      if (signUpErr) {
        msg.value = signUpErr.message;
        isError.value = true;
      } else {
        msg.value = "Account created! Check your email to confirm.";
        isError.value = false;
      }
    } else {
      window.location.href = "/dashboard";
    }
  } catch (e) {
    msg.value = "An unexpected error occurred";
    isError.value = true;
  } finally {
    loading.value = false;
  }
}
</script>