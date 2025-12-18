<template>
  <!-- FULL PAGE LAYOUT -->
  <div
    class="w-full h-full relative bg-gray-100 overflow-hidden"
    @mousedown="startPan"
    @mousemove="doPan"
    @mouseup="endPan"
  >
    <!-- TOP RIGHT CONTROLS -->
    <div class="fixed top-4 right-4 z-50 flex gap-3">
      <button @click="goBack" class="bg-white shadow px-4 py-2 rounded-lg">
        ⬅ Back
      </button>
      <button
        @click="addRoot"
        class="bg-green-600 text-white shadow px-4 py-2 rounded-lg"
      >
        + Add Family
      </button>

      <button
        @click="saveToSupabase"
        class="bg-indigo-600 text-white shadow px-4 py-2 rounded-lg"
      >
        Save All
      </button>

      <button
        @click="exportPNG"
        class="bg-white shadow px-4 py-2 rounded-lg"
      >
        Export PNG
      </button>
    </div>

    <!-- ZOOM CONTROLS -->
    <div class="fixed top-4 left-4 z-50 flex gap-3">
      <button @click="zoomIn" class="bg-white shadow px-3 py-2 rounded">+</button>
      <button @click="zoomOut" class="bg-white shadow px-3 py-2 rounded">−</button>
    </div>

    <!-- RIGHT EDIT PANEL -->
    <RightPanel
      :person="selectedPerson"
      @save="savePerson"
      @close="selectedPerson = null"
      class="fixed right-0 top-0 z-50"
    />

    <!-- SCROLL AREA -->
    <div ref="scrollArea" class="w-full h-full overflow-auto">
      <div
        ref="treeWrapper"
        class="relative min-w-max min-h-max p-40"
        :style="{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center top'
        }"
      >
        <div v-if="!loaded" class="text-center text-gray-600 text-xl">
          Loading Tree...
        </div>

        <div v-else class="flex gap-40 justify-center">
          <!-- MULTI ROOT RENDER -->
          <TreeGeneration
            v-for="r in roots"
            :key="r.id"
            :tree="tree"
            :rootId="r.id"
            :exporting="exporting"
            @add-partner="addPartner"
            @add-child="addChild"
            @update-node-pos="updateNodePos"
            @edit-person="openEditor"
            @delete-person="deletePerson"
            :highlightId="highlightId"
            @connect-partner="openLinkPartnerPopup"
            @confirm-delete="confirmDelete"

          />

          <!-- CONNECTOR LINES -->
          <svg class="absolute inset-0 pointer-events-none">
            <TreeLines :nodes="nodePositions" :tree="tree" />
          </svg>
        </div>
      </div>
    </div>

    <!-- POPUP -->
<Popup
  v-if="popup.show && popup.type === 'link-partner'"
  title="Link existing partner"
  autocomplete
  placeholder="Type name..."
  :model-value="searchText"
  :suggestions="partnerSuggestions"
  @update:modelValue="v => searchText = v"
  @select="selectPartner"
  @cancel="popup.show = false"
/>

<Popup
  v-if="popup.show && popup.type === 'delete'"
  title="Delete this person?"
  @confirm="handleDeleteConfirm"
  @cancel="popup.show = false"
/>



  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from "vue";
import { supabase } from "../supabase";
import { useRouter } from "vue-router";
import TreeGeneration from "./TreeGeneration.vue";
import TreeLines from "./TreeLines.vue";
import RightPanel from "./RightPanel.vue";
import Popup from "./Popup.vue";
import html2canvas from "html2canvas";

const router = useRouter();
const props = defineProps({ treeId: String });

/* STATE */
const tree = reactive({});
const nodePositions = reactive({});
const selectedPerson = ref(null);
const loaded = ref(false);
const exporting = ref(false);
const searchName = ref("");

const popup = ref({ show: false, type: null, sourceId: null });
const searchText = ref("");
const highlightId = ref(null);

const partnerSuggestions = computed(() => {
  if (!searchText.value) return [];
  return Object.values(tree).filter(
    p =>
      p.name &&
      p.id !== popup.value.sourceId &&
      p.name.toLowerCase().includes(searchText.value.toLowerCase())
  );
});

// function openLinkPartnerPopup(id) {
//   popup.value = { show: true, type: "link-partner", sourceId: id };
//   searchText.value = "";
// }

// function selectPartner(person) {
//   const src = popup.value.sourceId;
//   if (!tree[src] || !tree[person.id]) return;

//   if (!tree[src].partners.includes(person.id))
//     tree[src].partners.push(person.id);

//   if (!tree[person.id].partners.includes(src))
//     tree[person.id].partners.push(src);

//   highlightId.value = person.id;
//   popup.value.show = false;
//   saveToSupabase();
// }



/* MULTI ROOTS */
const roots = computed(() =>
  Object.values(tree).filter(n => n.isRoot === true)
);


/* PAN + ZOOM */
const scale = ref(1);
const pan = reactive({ x: 0, y: 0 });
let isPanning = false;
let last = { x: 0, y: 0 };

const treeWrapper = ref(null);
const scrollArea = ref(null);

/* CONTROLS */
function zoomIn() { scale.value += 0.1; }
function zoomOut() { if (scale.value > 0.3) scale.value -= 0.1; }

function startPan(e) {
  isPanning = true;
  last = { x: e.clientX, y: e.clientY };
}
function doPan(e) {
  if (!isPanning) return;
  pan.x += e.clientX - last.x;
  pan.y += e.clientY - last.y;
  last = { x: e.clientX, y: e.clientY };
}
function endPan() { isPanning = false; }

function goBack() {
  router.push("/dashboard");
}

function selectPartner(person) {
  const sourceId = popup.value.sourceId;

  if (!tree[sourceId] || !tree[person.id]) return;

  if (!tree[sourceId].partners.includes(person.id))
    tree[sourceId].partners.push(person.id);

  if (!tree[person.id].partners.includes(sourceId))
    tree[person.id].partners.push(sourceId);

  highlightId.value = person.id;

  popup.value.show = false;
  saveToSupabase();
}


/* EDIT */
function openEditor(person) {
  selectedPerson.value = { ...person };
}

function savePerson(p) {
  Object.assign(tree[p.id], p);
  selectedPerson.value = null;
  saveToSupabase();
}

/* POSITION TRACK */
// function updateNodePos({ id, rect }) {
//   nodePositions[id] = rect;
// }
function updateNodePos({ id, rect }) {
  const wrapperRect = treeWrapper.value.getBoundingClientRect();

  nodePositions[id] = {
    x: rect.x - wrapperRect.x,
    y: rect.y - wrapperRect.y,
    w: rect.w,
    h: rect.h
  };
}


/* ADD PARTNER */
function addPartner(id) {
  const newId = Date.now();
  tree[newId] = {
    id: newId,
    name: "Partner",
    img: "",
    partners: [id],
    children: [],
    parents: [],
    isRoot: false
  };
  tree[id].partners.push(newId);
  saveToSupabase();
}

/* ADD CHILD */
function addChild(id) {
  const partner = tree[id].partners?.[0];
  const newId = Date.now();

  tree[newId] = {
    id: newId,
    name: "Child",
    img: "",
    partners: [],
    children: [],
    parents: partner ? [id, partner] : [id],
    isRoot: false
  };

  tree[id].children.push(newId);
  if (partner) tree[partner].children.push(newId);

  saveToSupabase();
}

/* DELETE PERSON */
function deletePerson(id) {
  if (!tree[id]) return;

  tree[id].partners?.forEach(p => {
    tree[p].partners = tree[p].partners.filter(x => x !== id);
  });

  tree[id].parents?.forEach(p => {
    tree[p].children = tree[p].children.filter(c => c !== id);
  });

  tree[id].children?.forEach(c => {
    tree[c].parents = tree[c].parents.filter(p => p !== id);
  });

  delete tree[id];
  saveToSupabase();
}

/* LOAD */
async function loadFromSupabase() {
  const { data } = await supabase
    .from("family_tree_nodes")
    .select("*")
    .eq("tree_id", props.treeId);

  if (!data || data.length === 0) {
    const id = Date.now();
tree[id] = {
  id,
  name: "Root Person",
  img: "",
  partners: [],
  children: [],
  parents: [],
  isRoot: true   // 👈 only one default root
};

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
      parents: row.extra?.parents || [],
      gender: row.extra?.gender || "",
      isRoot: row.extra?.isRoot || false,
      description: row.extra?.description || ""
    };
  }

  loaded.value = true;
}

/* SAVE */
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
      parents: n.parents,
      isRoot: n.isRoot || false,   // 👈 ADD
      gender: n.gender || "",
      description: n.description || ""
    }
  }));

  await supabase.from("family_tree_nodes").delete().eq("tree_id", props.treeId);
  await supabase.from("family_tree_nodes").insert(rows);
}

/* CENTER */
async function centerTree() {
  await nextTick();
  const c = scrollArea.value;
  const t = treeWrapper.value;
  c.scrollTo({
    left: t.clientWidth / 2 - c.clientWidth / 2,
    top: 50,
    behavior: "smooth"
  });
}

function addRoot() {
  const id = Date.now();
  tree[id] = {
    id,
    name: "New Family Root",
    img: "",
    partners: [],
    children: [],
    parents: [],
    isRoot: true
  };
  saveToSupabase();
}

function openLinkPartnerPopup(id) {
  popup.value = {
    show: true,
    type: "link-partner",
    sourceId: id
  };
  searchName.value = "";
  highlightId.value = null;

}

function handlePopupConfirm(value) {
  if (popup.value.type === "link-partner") {
    const sourceId = popup.value.sourceId;

    const person = Object.values(tree).find(
      p => p.name?.toLowerCase() === value.toLowerCase()
    );

    if (!person) {
      alert("No person found with that name");
      return;
    }

    // prevent self-link
    if (person.id === sourceId) return;

    // link both ways
    if (!tree[sourceId].partners.includes(person.id))
      tree[sourceId].partners.push(person.id);

    if (!tree[person.id].partners.includes(sourceId))
      tree[person.id].partners.push(sourceId);

    saveToSupabase();
  }

  popup.value.show = false;
}

function confirmDelete(id) {
  popup.value = { show: true, type: "delete", sourceId: id };
}

function handleDeleteConfirm() {
  if (popup.value.sourceId) {
    deletePerson(popup.value.sourceId);
  }
  popup.value.show = false;
}

function closePopup() {
  popup.value.show = false;
}



/* EXPORT */
// async function exportPNG() {
//   const canvas = await html2canvas(treeWrapper.value, { scale: 2, useCORS: true });
//   const link = document.createElement("a");
//   link.download = "family-tree.png";
//   link.href = canvas.toDataURL();
//   link.click();
// }
async function exportPNG() {
  exporting.value = true;
  await nextTick();

  const canvas = await html2canvas(treeWrapper.value, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#fff7ed" // light gray background
  });

  exporting.value = false;

  const link = document.createElement("a");
  link.download = "family-tree.png";
  link.href = canvas.toDataURL();
  link.click();
}


onMounted(async () => {
  await loadFromSupabase();
  await nextTick();
  centerTree();
});
</script>
