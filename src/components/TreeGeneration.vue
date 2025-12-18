<template>
  <div v-if="!primary" class="text-gray-500">Loading...</div>

  <div v-else class="flex flex-col items-center gap-12">
    <!-- PARTNER ROW -->
    <div class="flex items-center gap-8">
<TreeNode
  :person="primary"
  :exporting="exporting"
  @add-partner="$emit('add-partner', primary.id)"
  @add-child="$emit('add-child', primary.id)"
  @connect-partner="$emit('connect-partner', primary.id)"
  @confirm-delete="$emit('confirm-delete', $event)"
  @mounted="updateNodePos(primary.id, $event)"
  @edit-person="$emit('edit-person', $event)"
/>


      <span v-if="partner" class="text-2xl">❤️</span>

<TreeNode
  v-if="partner"
  :person="partner"
  :exporting="exporting"
  @add-partner="$emit('add-partner', partner.id)"
  @add-child="$emit('add-child', partner.id)"
  @connect-partner="$emit('connect-partner', partner.id)"
  @confirm-delete="$emit('confirm-delete', $event)"
  @mounted="updateNodePos(partner.id, $event)"
  @edit-person="$emit('edit-person', $event)"
/>

    </div>

    <!-- CHILDREN -->
    <div v-if="children.length" class="flex flex-wrap justify-center gap-12">
<TreeGeneration
  v-for="child in children"
  :key="child"
  :tree="tree"
  :rootId="child"
  :exporting="exporting"
  :highlightId="highlightId"
  @add-partner="$emit('add-partner', $event)"
  @add-child="$emit('add-child', $event)"
  @connect-partner="$emit('connect-partner', $event)"
  @confirm-delete="$emit('confirm-delete', $event)"
  @update-node-pos="$emit('update-node-pos', $event)"
  @edit-person="$emit('edit-person', $event)"
/>

    </div>
  </div>


</template>

<script setup>
import { computed,ref } from "vue";
import TreeNode from "./TreeNode.vue";


const props = defineProps({
  tree: Object,
  rootId: [Number, String],
  highlightId: [Number, null]
});

const emit = defineEmits([
  "add-partner",
  "add-child",
  "connect-partner",
  "confirm-delete",
  "update-node-pos",
  "edit-person"
]);



const primary = computed(() => props.tree[props.rootId] || null);

const partner = computed(() => {
  const p = primary.value?.partners?.[0];
  return p ? props.tree[p] : null;
});

const children = computed(() => primary.value?.children || []);

function updateNodePos(id, rect) {
  emit("update-node-pos", { id, rect });
}




</script>
