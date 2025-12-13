<template>
  <!-- FULL PAGE LAYOUT -->
  <div 
    class="w-full h-full relative bg-gray-100 overflow-hidden"
    @mousedown="startPan"
    @mousemove="doPan"
    @mouseup="endPan"
  >

    <!-- FIXED TOP-RIGHT CONTROL BAR -->
    <div class="fixed top-4 right-4 z-50 flex gap-3">

      <!-- Back -->
      <button 
        @click="goBack" 
        class="bg-white shadow px-4 py-2 rounded-lg">
        ⬅ Back
      </button>

      <!-- Save -->
      <button 
        @click="saveToSupabase"
        class="bg-indigo-600 text-white shadow px-4 py-2 rounded-lg">
        Save All
      </button>

      <!-- Export -->
      <button 
        @click="exportPNG"
        class="bg-white shadow px-4 py-2 rounded-lg">
        Export PNG
      </button>

    </div>

    <!-- FIXED TOP-LEFT ZOOM CONTROLS -->
    <div class="fixed top-4 left-4 z-50 flex gap-3">
      <button @click="zoomIn" class="bg-white shadow px-3 py-2 rounded">+</button>
      <button @click="zoomOut" class="bg-white shadow px-3 py-2 rounded">−</button>
    </div>

    <!-- FIXED RIGHT PANEL FOR EDITING -->
    <RightPanel 
      :person="selectedPerson"
      @save="savePerson"
      @close="selectedPerson = null"
      class="fixed right-0 top-0 z-50"
    />

    <!-- MAIN SCROLL AREA FOR TREE -->
    <div 
      ref="scrollArea"
      class="w-full h-full overflow-auto"
    >
      <!-- ZOOM + PAN WRAPPER -->
      <div 
        ref="treeWrapper"
        class="relative min-w-max min-h-max p-40"
        :style="{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center top'
        }"
      >

        <!-- WAIT FOR TREE LOADING -->
        <div v-if="!loaded" class="text-center text-gray-600 text-xl">
          Loading Tree...
        </div>

        <!-- TREE RENDER -->
        <div v-else class="relative min-w-max">
          
          <TreeGeneration
            :tree="tree"
            :rootId="rootId"
            @add-partner="addPartner"
            @add-child="addChild"
            @update-node-pos="updateNodePos"
            @edit-person="openEditor"
          />

          <!-- CONNECTOR LINES -->
          <svg class="absolute inset-0 pointer-events-none">
            <TreeLines :nodes="nodePositions" :tree="tree" />
          </svg>

        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, ref, onMounted, nextTick } from "vue";
import { supabase } from "../supabase";
import { useRouter } from "vue-router";
import TreeGeneration from "./TreeGeneration.vue";
import TreeLines from "./TreeLines.vue";
import RightPanel from "./RightPanel.vue";
import html2canvas from "html2canvas";

const router = useRouter();
const props = defineProps({ treeId: String });

/* ---------------- STATE ---------------- */
const tree = reactive({});
const nodePositions = reactive({});
const selectedPerson = ref(null);
const rootId = ref(null);
const loaded = ref(false);

/* ---------------- PAN + ZOOM ---------------- */
const scale = ref(1);
const pan = reactive({ x: 0, y: 0 });
const isPanning = ref(false);
let last = { x: 0, y: 0 };

const treeWrapper = ref(null);
const scrollArea = ref(null);

/* ---------------- ZOOM ---------------- */
function zoomIn() { scale.value += 0.1; }
function zoomOut() { if (scale.value > 0.3) scale.value -= 0.1; }

/* ---------------- PAN ---------------- */
function startPan(e) {
  isPanning.value = true;
  last = { x: e.clientX, y: e.clientY };
}
function doPan(e) {
  if (!isPanning.value) return;
  pan.x += e.clientX - last.x;
  pan.y += e.clientY - last.y;
  last = { x: e.clientX, y: e.clientY };
}
function endPan() { isPanning.value = false; }

/* ---------------- BACK ---------------- */
function goBack() {
  router.push("/dashboard");
}

/* ---------------- EDIT PANEL ---------------- */
function openEditor(person) { selectedPerson.value = { ...person }; }

function savePerson(p) {
  Object.assign(tree[p.id], p);
  selectedPerson.value = null;
  saveToSupabase();
}

/* ---------------- NODE POSITION TRACKING ---------------- */
function updateNodePos({ id, rect }) {
  nodePositions[id] = rect;
}

/* ---------------- ADD PARTNER ---------------- */
function addPartner(id) {
  const newId = Date.now();
  tree[newId] = { id: newId, name: "Partner", img: "", partners: [id], children: [] };
  tree[id].partners.push(newId);
  saveToSupabase();
}

/* ---------------- ADD CHILD ---------------- */
function addChild(id) {
  const partner = tree[id].partners[0];
  const newId = Date.now();

  tree[newId] = { id: newId, name: "Child", img: "", partners: [], children: [] };
  tree[id].children.push(newId);
  if (partner) tree[partner].children.push(newId);

  saveToSupabase();
}

/* ---------------- SAVE TO SUPABASE ---------------- */
async function saveToSupabase() {
  const rows = Object.values(tree).map(n => ({
    tree_id: props.treeId,
    id: n.id,
    pid: null,
    name: n.name,
    title: null,
    img_url: n.img,
    extra: {
      partners: n.partners,
      children: n.children,
      gender: n.gender || "",
      description: n.description || ""
    }
  }));

  await supabase.from("family_tree_nodes").delete().eq("tree_id", props.treeId);
  await supabase.from("family_tree_nodes").insert(rows);
  await supabase.from("family_tree_meta").update({ updated_at: new Date() }).eq("tree_id", props.treeId);
}

/* ---------------- LOAD FROM SUPABASE ---------------- */
async function loadFromSupabase() {
  const { data } = await supabase
    .from("family_tree_nodes")
    .select("*")
    .eq("tree_id", props.treeId);

  if (!data || data.length === 0) {
    const id = Date.now();
    tree[id] = { id, name: "Root Person", img: "", partners: [], children: [] };
    rootId.value = id;
    loaded.value = true;
    return;
  }

  for (const row of data) {
    tree[row.id] = {
      id: row.id,
      name: row.name,
      img: row.img_url,
      partners: row.extra?.partners || [],
      children: row.extra?.children || [],
      gender: row.extra?.gender || "",
      description: row.extra?.description || ""
    };
  }

  rootId.value = data[0].id;
  loaded.value = true;
}

/* ---------------- AUTO CENTER ---------------- */
async function centerTree() {
  await nextTick();
  const container = scrollArea.value;
  const content = treeWrapper.value;
  container.scrollTo({
    left: content.clientWidth / 2 - container.clientWidth / 2,
    top: 50,
    behavior: "smooth"
  });
}

/* ---------------- EXPORT PNG ---------------- */
async function exportPNG() {
  const canvas = await html2canvas(treeWrapper.value, {
    useCORS: true,
    scale: 2
  });
  const link = document.createElement("a");
  link.download = "family-tree.png";
  link.href = canvas.toDataURL();
  link.click();
}

/* ---------------- INIT ---------------- */
onMounted(async () => {
  await loadFromSupabase();
  await nextTick();
  centerTree();
});
</script>
