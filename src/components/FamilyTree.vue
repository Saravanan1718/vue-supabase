<template>
  <div class="relative w-full h-full bg-white">
    <!-- Chart Container -->
    <div id="tree" class="w-full h-full"></div>

    <!-- Floating Save Button -->
    <div class="flex flex-col gap-2 absolute top-4 right-4 z-20">
      <button 
        @click="saveToDb"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
        :disabled="isSaving"
      >
        {{ isSaving ? "Saving..." : "Save Changes" }}
      </button>

      <span v-if="lastSaved" class="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
        Saved: {{ lastSaved }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
// import "@balkangraph/orgchart.js";
import OrgChart from "@balkangraph/orgchart.js";
// import "@balkangraph/orgchart.js/dist/OrgChart.css";

import { supabase, getTree, saveTree } from "../supabase";

// state
let chart = null;
const isSaving = ref(false);
const lastSaved = ref(null);

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Load saved tree
  const treeData = await getTree(user.id);

  let data = treeData && treeData.length > 0
  ? treeData
  : [
      { id: 1, name: "Root Person", title: "Family Head" },
      { id: 2, pid: 1, name: "Child 1", title: "" },
      { id: 3, pid: 1, name: "Child 2", title: "" }
    ];


  chart = new OrgChart(document.getElementById("tree"), {
    template: "olivia",
    layout: OrgChart.mixed,
    mouseScroll: OrgChart.action.zoom,
    enableSearch: false,
    nodeBinding: {
      field_0: "name",
      field_1: "title"
    },
    menu: {
      pdf: { text: "Export PDF" },
      png: { text: "Export PNG" },
      svg: { text: "Export SVG" }
    }
  });

  chart.load(data);

  // expose chart for debugging
  window.chart = chart;
});

async function saveToDb() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  isSaving.value = true;

  try {
    // const hierarchy = chart.get(); // returns the complete JSON tree
    // await saveTree(user.id, hierarchy);
    const nodes = chart.getNodes(); // returns a flat array
    await saveTree(user.id, nodes);
    lastSaved.value = new Date().toLocaleTimeString();
  } catch (err) {
    console.error(err);
    alert("Failed to save!");
  }

  isSaving.value = false;
}
</script>

<style scoped>
#tree {
  width: 100%;
  height: calc(100vh - 0px);
  overflow: hidden;
}
</style>
