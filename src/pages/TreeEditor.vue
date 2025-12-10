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
    ? nodes.map((n) => ({
        id: n.id,
        pid: n.pid,
        name: n.name,
        title: n.title,
        img: n.img_url,
        gender: n.extra?.gender,
        description: n.extra?.description,
        email: n.extra?.email,
        phone: n.extra?.phone,
        website: n.extra?.website,
        address: n.extra?.address,
        pids: n.extra?.pids || [],
        mid: n.extra?.mid,
        fid: n.extra?.fid,
      }))
    : [{ id: 1, name: "Root Person", title: "Start editing" }];

  OrgChart.templates.diva.field_0 =
    '<text width="230" style="font-size: 18px;" fill="#039BE5" x="60" y="85" text-anchor="middle">{val}</text>';
  OrgChart.templates.diva.field_1 =
    '<text width="230" style="font-size: 14px;" fill="#AEAEAE" x="60" y="105" text-anchor="middle">{val}</text>';

  chart.value = new OrgChart(document.getElementById("tree"), {
    nodes: formatted,
    template: "diva",
    enableSearch: true,
    nodeBinding: {
      field_0: "name",
      field_1: "title",
      img_0: "img",
    },
    nodeMenu: {
      details: { text: "Details" },
      edit: { text: "Edit" },
      add: { text: "Add" },
      addPartner: { text: "Add Partner", icon: OrgChart.icon.add(24, 24, "#ccc"), onClick: addPartner },
      addParent: { text: "Add Parent", icon: OrgChart.icon.add(24, 24, "#ccc"), onClick: addParent },
      addChild: { text: "Add Child", icon: OrgChart.icon.add(24, 24, "#ccc"), onClick: addChild },
      remove: { text: "Remove" },
    },
    editForm: {
      buttons: {
        edit: null,
        share: null,
        pdf: null,
        remove: {
          icon: OrgChart.icon.remove(24, 24, "#fff"),
          text: "Remove",
        },
      },
      elements: [
        { type: "textbox", label: "Full Name", binding: "name" },
        { type: "textbox", label: "Job Title", binding: "title" },
        { type: "textbox", label: "Photo / Image URL", binding: "img", btn: "Upload" },
        {
          type: "select",
          options: [
            { value: "male", text: "Male" },
            { value: "female", text: "Female" },
          ],
          label: "Gender",
          binding: "gender",
        },
        { type: "textbox", label: "Description", binding: "description" },
        { type: "textbox", label: "Email", binding: "email" },
        { type: "textbox", label: "Phone", binding: "phone" },
        { type: "textbox", label: "Website", binding: "website" },
        { type: "textbox", label: "Address", binding: "address" },
      ],
    },
  });

  chart.value.on("field", function (sender, args) {
    if (args.name == "img") {
      if (!args.value) {
        var str = ""; // default placeholder logic can go here
        return;
      }
    }
  });

  // Handle custom upload button in edit form
  chart.value.editUI.on("element-btn-click", function (sender, args) {
    OrgChart.fileUploadDialog(async (file) => {
      if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          alert("File too big (max 2MB)");
          return;
        }
        
        try {
          const publicUrl = await uploadImage(file);
          if (publicUrl) {
            args.input.value = publicUrl;
            
            // update ONLY img via updateNode to merge
            const node = chart.value.get(args.nodeId);
            chart.value.updateNode({
              ...node,
              img: args.input.value
            });
          }
        } catch (e) {
          console.error("Upload failed", e);
          alert("Upload failed: " + e.message);
        }
      }
    });
  });
}

function addPartner(nodeId) {
  const node = chart.value.get(nodeId);
  const newId = Date.now();
  
  // 1. Update the original node to include the new partner ID
  let pids = node.pids ? [...node.pids] : [];
  pids.push(newId);
  
  // We need to update the original node FIRST or concurrently? 
  // Actually, standard way: add new node with pids pointing to original, then update original.
  
  const newNode = {
    id: newId,
    name: "Partner Name",
    title: "Partner",
    pids: [nodeId], // Mutual link
    gender: node.gender === 'male' ? 'female' : 'male' // Intelligent guess
  };
  
  chart.value.addNode(newNode);
  chart.value.updateNode({ ...node, pids: pids });
}

function addParent(nodeId) {
  const node = chart.value.get(nodeId);
  const newId = Date.now();
  const newNode = {
    id: newId,
    name: "Parent Name",
    title: "Parent",
    gender: 'male' // Default
  };
  chart.value.addNode(newNode);
  
  // Link child to parent
  chart.value.updateNode({ ...node, pid: newId });
}

function addChild(nodeId) {
  const node = chart.value.get(nodeId);
  const newId = Date.now();
  
  // If the node has partners, the child is usually common.
  // We just link to the clicked node as 'pid'. 
  // OrgChartJS draws it on the line if 'pid' points to one of the partners 
  // AND the partners are mutually linked via 'pids'.
  
  const newNode = {
    id: newId,
    pid: nodeId,
    name: "Child Name",
    title: "Child"
  };
  
  chart.value.addNode(newNode);
}

async function uploadImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${treeId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  let { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return data.publicUrl;
}

async function save() {
  saving.value = true;

  const nodes = chart.value.config.nodes.map((n) => ({
    tree_id: treeId,
    id: n.id,
    pid: n.pid || null,
    name: n.name,
    title: n.title,
    img_url: n.img,
    extra: {
      gender: n.gender,
      description: n.description,
      email: n.email,
      phone: n.phone,
      website: n.website,
      address: n.address,
      pids: n.pids,
      mid: n.mid,
      fid: n.fid,
    },
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
