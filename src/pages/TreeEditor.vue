<template>
  <div class="h-screen w-full">
    <FamilyTree :treeId="treeId" />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import FamilyTree from "../components/FamilyTree.vue";

const route = useRoute();
const treeId = route.params.tree_id;   // keep as string (UUID)
</script>
