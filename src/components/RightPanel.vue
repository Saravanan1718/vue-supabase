<template>
  <div v-if="person" ref="panelRef" class="fixed right-0 top-0 w-80 h-full bg-white shadow-xl p-6 overflow-y-auto">
    <h2 class="text-xl font-bold mb-4">Edit Person</h2>
    
    <div class="w-full flex justify-center mb-4">
  <img 
    v-if="edit.img"
    :src="edit.img"
    class="w-28 h-28 rounded-full object-cover border shadow"
  />
  <div v-else class="w-28 h-28 rounded-full bg-gray-300"></div>
</div>


    <label class="block mb-2">Full Name</label>
    <input v-model="edit.name" class="border p-2 rounded w-full mb-4"/>

    <label class="block mb-2">Photo</label>

    <div class="flex items-center gap-2 mb-4">
    <input 
        v-model="edit.img" 
        placeholder="Photo URL…" 
        class="border p-2 rounded w-full"
    />

    <button 
        @click="selectFile"
        class="bg-indigo-600 text-white px-3 py-2 rounded"
    >
        Upload
    </button>
    </div>

    <input 
    ref="fileInput" 
    type="file" 
    accept="image/*" 
    class="hidden" 
    @change="upload"
    />


    <label class="block mb-2">Description</label>
    <textarea v-model="edit.description" class="border p-2 rounded w-full mb-4"></textarea>

    <label class="block mb-2">Gender</label>
    <select v-model="edit.gender" class="border rounded p-2 w-full mb-4">
      <option value="">Unknown</option>
      <option value="male">Male</option>
      <option value="female">Female</option>
    </select>

    <button 
      @click="save"
      class="bg-indigo-600 text-white w-full py-2 rounded mt-4">
      Save
    </button>

    <button 
      @click="$emit('close')"
      class="bg-gray-300 text-black w-full py-2 rounded mt-2">
      Close
    </button>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from "vue";
import { supabase } from "../supabase";

const fileInput = ref(null);

function selectFile() {
  fileInput.value.click();
}

async function upload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop();
  const filePath = `avatars/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file);

  if (error) {
    alert("Upload failed");
    return;
  }

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  edit.img = data.publicUrl;
}


const props = defineProps({
  person: Object,
});

const emit = defineEmits(["save", "close"]);

const edit = reactive({
  name: "",
  img: "",
  description: "",
  gender: "",
});

const panelRef = ref(null);

function handleClickOutside(e) {
  if (panelRef.value && !panelRef.value.contains(e.target)) {
    emit("close");
  }
}

watch(
  () => props.person,
  (val) => {
    if (val) {
      Object.assign(edit, val);
      setTimeout(() => {
        window.addEventListener("click", handleClickOutside);
      }, 0);
    } else {
      window.removeEventListener("click", handleClickOutside);
    }
  },
  { immediate: true }
);

import { onBeforeUnmount } from "vue";
onBeforeUnmount(() => {
  window.removeEventListener("click", handleClickOutside);
});

function save() {
  emit("save", { ...edit });
}
</script>
