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
        @delete-person="$emit('delete-person', $event)"
        @mounted="updateNodePos(primary.id, $event)"
        @edit-person="$emit('edit-person', $event)"
        @connect-partner="$emit('connect-partner', $event)"
        

      />

      <span v-if="partner" class="text-2xl">❤️</span>

      <TreeNode
        v-if="partner"
        :person="partner"
        @add-partner="$emit('add-partner', partner.id)"
        @add-child="$emit('add-child', partner.id)"
        @delete-person="$emit('delete-person', $event)"
        @mounted="updateNodePos(partner.id, $event)"
        @edit-person="$emit('edit-person', $event)"
        @connect-partner="$emit('connect-partner', $event)"

      />
    </div>

    <!-- CHILDREN -->
    <div v-if="children.length" class="flex flex-wrap justify-center gap-12">
      <TreeGeneration
        v-for="child in children"
        :key="child"
        :tree="tree"
        :rootId="child"
        @add-partner="$emit('add-partner', $event)"
        @add-child="$emit('add-child', $event)"
        @delete-person="$emit('delete-person', $event)"
        @update-node-pos="$emit('update-node-pos', $event)"
        @edit-person="$emit('edit-person', $event)"
        @connect-partner="$emit('connect-partner', $event)"

      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import TreeNode from "./TreeNode.vue";

const props = defineProps({
  tree: Object,
  rootId: [Number, String]
});

const emit = defineEmits([
  "add-partner",
  "add-child",
  "delete-person",
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
