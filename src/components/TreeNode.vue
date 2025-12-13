<template>
  <div 
    ref="nodeRef"
    class="bg-white border shadow rounded-xl p-4 w-44 text-center relative cursor-pointer hover:shadow-lg transition"
    @click="openEditor"
  >
    
    <!-- Photo -->
    <img 
      v-if="person.img"
      :src="person.img"
      class="w-20 h-20 rounded-full mx-auto object-cover"
    />
    <div v-else class="w-20 h-20 rounded-full bg-gray-300 mx-auto"></div>

    <!-- Name -->
    <div class="font-semibold text-lg mt-2">{{ person.name }}</div>

    <!-- Buttons -->
    <div class="flex justify-center gap-2 mt-3">
      <button 
        @click.stop="$emit('add-partner')"
        class="bg-blue-200 px-2 py-1 rounded text-sm"
      >+ Partner</button>

      <button 
        @click.stop="$emit('add-child')"
        class="bg-green-200 px-2 py-1 rounded text-sm"
      >+ Child</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const props = defineProps({
  person: Object,
});

const emit = defineEmits(["mounted", "edit-person"]);

const nodeRef = ref(null);

function openEditor() {
  emit("edit-person", props.person);
}

onMounted(() => {
  const el = nodeRef.value;
  const rect = el.getBoundingClientRect();

  emit("mounted", {
    id: props.person.id,
    x: rect.left,
    y: rect.top,
    w: rect.width,
    h: rect.height
  });
});
</script>
