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
      <!-- Autocomplete input -->
      <div v-if="autocomplete">
        <input
          v-model="model"
          type="text"
          class="w-full border rounded-lg px-3 py-2 mb-2"
          :placeholder="placeholder"
        />

        <div
          v-if="suggestions.length"
          class="border rounded-lg max-h-40 overflow-auto"
        >
          <div
            v-for="item in suggestions"
            :key="item.id"
            class="px-3 py-2 cursor-pointer hover:bg-indigo-100"
            @click="$emit('select', item)"
          >
            {{ item.name }}
          </div>
        </div>
      </div>


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
  autocomplete: Boolean,
  placeholder: String,
  suggestions: Array,
  modelValue: String
});


const model = ref(props.modelValue || "");

watch(() => props.modelValue, v => model.value = v);
watch(model, v => emit("update:modelValue", v));
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(.95); }
  to   { opacity: 1; transform: scale(1); }
}
.animate-fadeIn { animation: fadeIn .15s ease-out; }
</style>
