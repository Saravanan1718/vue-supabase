<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Main Content -->
    <main class="flex-1 p-0 overflow-hidden flex flex-col h-screen">
      <div class="w-full h-full relative">
        <FamilyTree />
      </div>
    </main>
  </div>
</template>

<script setup>
import FamilyTree from '../components/FamilyTree.vue';
import '../index.css'
</script>
