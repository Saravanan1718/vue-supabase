<template>
  <div class="h-screen w-screen overflow-hidden flex flex-col">

    <!-- Toolbar -->
    <div class="flex justify-between items-center p-4 bg-white shadow">
      <input 
        v-model="treeName"
        @change="renameTree"
        class="text-xl font-semibold px-3 py-1 border rounded-lg"
      />

      <div class="flex gap-3">
        <button @click="save" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          {{ saving ? "Saving..." : "Save" }}
        </button>
        <button @click="exportPNG" class="px-4 py-2 bg-gray-200 rounded-lg">PNG</button>
        <button @click="exportPDF" class="px-4 py-2 bg-gray-200 rounded-lg">PDF</button>
        <button @click="goBack" class="px-4 py-2 bg-gray-100 rounded-lg">Back</button>
      </div>
    </div>

    <div id="tree" class="flex-1 w-full"></div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import OrgChart from "@balkangraph/orgchart.js";
import { supabase } from "../supabase";

const route = useRoute();
const router = useRouter();
const treeId = route.params.tree_id;

const treeName = ref("");
const chart = ref(null);
const saving = ref(false);

onMounted(async () => {
  await loadTree();
});

async function loadTree() {
  // meta
  let { data: meta } = await supabase
    .from("family_tree_meta")
    .select("*")
    .eq("tree_id", treeId)
    .single();

  treeName.value = meta.name;

  // nodes
  let { data: nodes } = await supabase
    .from("family_tree_nodes")
    .select("*")
    .eq("tree_id", treeId);

  let formatted = nodes?.length
    ? nodes.map(n => ({
        id: n.id,
        pid: n.pid,
        name: n.name,
        title: n.title
      }))
    : [{ id: 1, name: "Root Person", title: "Start editing" }];

  chart.value = new OrgChart(document.getElementById("tree"), {
    nodes: formatted,
    template: "olivia",
    nodeBinding: {
      field_0: "name",
      field_1: "title",
    }
  });
}

async function save() {
  saving.value = true;

  const nodes = chart.value.config.nodes.map(n => ({
    tree_id: treeId,
    id: n.id,
    pid: n.pid || null,
    name: n.name,
    title: n.title
  }));

  // reset all nodes
  await supabase.from("family_tree_nodes").delete().eq("tree_id", treeId);

  // insert again
  await supabase.from("family_tree_nodes").insert(nodes);

  // update meta timestamp
  await supabase
    .from("family_tree_meta")
    .update({ updated_at: new Date() })
    .eq("tree_id", treeId);

  saving.value = false;
}

async function renameTree() {
  await supabase
    .from("family_tree_meta")
    .update({ name: treeName.value })
    .eq("tree_id", treeId);
}

function exportPNG() {
  chart.value.exportPNG();
}

function exportPDF() {
  chart.value.exportPDF();
}

function goBack() {
  router.push("/dashboard");
}
</script>

<style>
#tree {
  width: 100%;
  height: 100%;
}
</style>
