<!-- <template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <main class="flex-1 p-0 overflow-hidden flex flex-col h-screen">
      <div class="w-full h-full relative">
        <div class="absolute top-4 left-4 z-20">
             <button @click="handleLogout" class="bg-gray-800 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 transition">
                Logout
             </button>
        </div>
        <FamilyTree />
      </div>
    </main>
  </div>
</template> -->

<!-- <script setup> -->
// import { useRouter } from 'vue-router';
// import { supabase } from '../supabase';
// import FamilyTree from '../components/FamilyTree.vue';
// import '../index.css'

// const router = useRouter();

// async function handleLogout() {
//     const { error } = await supabase.auth.signOut();
//     if (error) {
//         console.error('Error logging out:', error);
//         alert('Error logging out');
//     } else {
//         router.push('/login');
//     }
// }
<!-- </script> -->
<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <div class="max-w-4xl mx-auto">

      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Your Family Trees</h1>
        <button @click="createTree"
          class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + New Tree
        </button>
      </div>

      <!-- Grid of cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div 
          v-for="tree in trees"
          :key="tree.tree_id"
          class="bg-white shadow rounded-xl p-5 cursor-pointer hover:shadow-lg transition"
          @click="openTree(tree.tree_id)"
        >
          <h2 class="text-xl font-semibold">{{ tree.name }}</h2>
          <p class="text-gray-500 text-sm mt-1">
            Updated: {{ new Date(tree.updated_at).toLocaleDateString() }}
          </p>

          <div class="mt-4 flex gap-2">
            <button 
              class="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm"
              @click.stop="openTree(tree.tree_id)"
            >
              Edit
            </button>
            <button 
              class="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm"
              @click.stop="deleteTree(tree.tree_id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <button 
        @click="logout"
        class="mt-10 bg-gray-800 text-white px-4 py-2 rounded-lg">
        Logout
      </button>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../supabase";
import { useRouter } from "vue-router";

const router = useRouter();
const trees = ref([]);

onMounted(loadTrees);

async function loadTrees() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("family_tree_meta")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  trees.value = data || [];
}

async function createTree() {
  const { data: { user } } = await supabase.auth.getUser();
  const name = prompt("Tree name?");
  if (!name) return;

  const { data: tree } = await supabase
    .from("family_tree_meta")
    .insert([{ user_id: user.id, name }])
    .select()
    .single();

  router.push(`/tree/${tree.tree_id}`);
}

function openTree(id) {
  router.push(`/tree/${id}`);
}

async function deleteTree(id) {
  if (!confirm("Delete this tree?")) return;

  await supabase.from("family_tree_meta").delete().eq("tree_id", id);
  loadTrees();
}

async function logout() {
  await supabase.auth.signOut();
  router.push("/login");
}
</script>
