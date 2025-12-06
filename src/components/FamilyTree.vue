<template>
  <div class="relative w-full h-full">
    <div id="tree" class="w-full h-full"></div>
    
    <!-- Floating Controls -->
    <div class="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <button 
        @click="saveToDb" 
        :disabled="isSaving"
        class="bg-white/90 backdrop-blur text-indigo-600 hover:text-indigo-700 hover:bg-white shadow-lg rounded-lg px-4 py-2 font-semibold transition-all flex items-center gap-2 border border-indigo-100 disabled:opacity-50"
      >
        <span v-if="isSaving">Saving...</span>
        <span v-else>Save Changes</span>
      </button>
      <span v-if="lastSaved" class="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded text-right">
        Saved: {{ lastSaved }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { supabase, getTree, saveTree } from '../supabase';

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const treeData = await getTree(user.id);
  
  // FamilyTree is now loaded from CDN
  const family = new FamilyTree(document.getElementById("tree"), {
    mode: 'dark',
    template: 'hugo',
    roots: treeData.length > 0 ? null : [1], // If empty, start with one node? Or logic to add.
    nodeBinding: {
      field_0: "name",
      field_1: "title",
      img_0: "img"
    },
    nodeMenu: {
      details: { text: "Details" },
      edit: { text: "Edit" },
      add: { text: "Add" },
      remove: { text: "Remove" }
    },
    editForm: {
      buttons: {
        edit: null,
        share: null,
        pdf: null,
        remove: {
            icon: FamilyTree.icon.remove(24, 24, '#fff'),
            text: 'Remove'
        }
      }
    }
  });

  // Initial Load
  family.load(treeData.length ? treeData : [
    { id: 1, pids: [2], name: "Father", title: "CEO", img: "https://cdn.balkan.app/shared/2.jpg" },
    { id: 2, pids: [1], name: "Mother", title: "CEO", img: "https://cdn.balkan.app/shared/3.jpg" }
  ]);
  
  // Assign to ref if needed, or just keep local if only used inside setup
  window.family = family; // For debugging
});

const isSaving = ref(false);
const lastSaved = ref(null);

async function saveToDb() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  isSaving.value = true;
  
  // Extract data from the tree instance
  // @balkan/familytree stores nodes in an object structure for internal use
  // API typically supports JSON export, but let's iterate to be sure we get our data model
  // Note: family.nodes is an object { id: Node }. Node.data contains our fields.
  const family = window.family; 
  if (!family) return;

  const nodes = Object.values(family.nodes)
    .map(n => n.data)
    .filter(n => n && n.id); // Filter valid nodes
    
  try {
      await saveTree(user.id, nodes);
      lastSaved.value = new Date().toLocaleTimeString();
  } catch(e) {
      console.error(e);
      alert("Failed to save changes!");
  } finally {
      isSaving.value = false;
  }
}
</script>

<style scoped>
#tree {
  width: 100%;
  height: 100%;
}
</style>
