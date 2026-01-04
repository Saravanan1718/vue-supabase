<template>
<div
  ref="nodeRef"
  :class="[
    'group border shadow rounded-xl p-4 w-44 text-center relative cursor-default transition',
    bgColor,
    highlight ? 'ring-4 ring-indigo-400' : 'hover:shadow-lg'
  ]"
>
    <!-- Edit Button (Top Right) -->
    <button 
      v-if="!exporting"
      @click.stop="openEditor"
      class="absolute top-2 right-2 p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition opacity-0 group-hover:opacity-100"
      title="Edit"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
      </svg>
    </button>
    
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
    <!-- <div v-if="!exporting" class="flex justify-center gap-2 mt-3">
      <button 
        @click.stop="$emit('add-partner')"
        class="bg-blue-200 px-2 py-1 rounded text-sm"
      >+ Partner</button>

      <button 
        @click.stop="$emit('add-child')"
        class="bg-green-200 px-2 py-1 rounded text-sm"
      >+ Child</button>
      <button
        @click.stop="$emit('connect-partner', person.id)"
        class="bg-purple-200 px-2 py-1 rounded text-sm"
      >Link Partner</button>

      <button
        @click.stop="$emit('delete-person', person.id)"
        class="bg-red-200 px-2 py-1 rounded text-sm"
      >Delete</button>
    </div> -->
    <!-- Hover Actions -->
<div
  v-if="!exporting"
  class="absolute -bottom-3 left-1/2 -translate-x-1/2
         flex gap-1 opacity-0 group-hover:opacity-100 transition"
>
  <button
    @click.stop="$emit('add-partner')"
    class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
  >
    Partner
  </button>

  <button
    @click.stop="$emit('connect-partner')"
    class="bg-purple-500 text-white text-xs px-2 py-1 rounded-full"
  >
    Link
  </button>

  <button
    @click.stop="$emit('add-child')"
    class="bg-green-500 text-white text-xs px-2 py-1 rounded-full"
  >
    Child
  </button>

<button
  @click.stop="$emit('confirm-delete', person.id)"
  class="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
>
  ✕
</button>

</div>

  </div>
</template>

<script setup>
import { onMounted, ref , computed} from "vue";

const props = defineProps({
  person: Object,
  exporting: Boolean,
  highlightId: Number
});

const highlight = computed(() => props.person.id === props.highlightId);

const bgColor = computed(() => {
  if (props.person.gender === 'male') return 'bg-blue-50 border-blue-200';
  if (props.person.gender === 'female') return 'bg-pink-50 border-pink-200';
  return 'bg-white';
});


const emit = defineEmits([
  "mounted",
  "edit-person",
  "add-partner",
  "add-child",
  "connect-partner",
  "confirm-delete"
]);



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
