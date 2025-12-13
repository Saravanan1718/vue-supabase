<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-xl shadow-xl w-80 animate-fadeIn">
      <h2 class="text-lg font-semibold mb-4">{{ title }}</h2>

      <!-- Text input -->
      <input 
        v-if="input"
        v-model="model"
        type="text"
        class="w-full border rounded-lg px-3 py-2 mb-4"
        :placeholder="placeholder"
      />

      <div class="flex justify-end gap-3">
        <button 
          class="px-4 py-2 rounded-lg bg-gray-200"
          @click="$emit('cancel')">
          Cancel
        </button>

        <button 
          class="px-4 py-2 rounded-lg bg-indigo-600 text-white"
          @click="$emit('confirm', model)">
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  title: String,
  input: Boolean,
  placeholder: String,
  modelValue: String
});

const model = ref(props.modelValue || "");

watch(() => props.modelValue, v => model.value = v);
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(.95); }
  to   { opacity: 1; transform: scale(1); }
}
.animate-fadeIn { animation: fadeIn .15s ease-out; }
</style>
