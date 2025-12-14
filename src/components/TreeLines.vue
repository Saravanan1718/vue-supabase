<template>
  <g>
    <!-- Partner lines -->
    <line
      v-for="(l, i) in partnerLines"
      :key="'p'+i"
      :x1="l.x1" :y1="l.y1" 
      :x2="l.x2" :y2="l.y2"
      stroke="black" stroke-width="2"
    />

    <!-- Parent-to-child vertical lines -->
    <line
      v-for="(l, i) in parentVerticalLines"
      :key="'v'+i"
      :x1="l.x" :y1="l.y1"
      :x2="l.x" :y2="l.y2"
      stroke="black" stroke-width="2"
    />

    <!-- Parent-to-child horizontal branches -->
    <line
      v-for="(l, i) in parentHorizontalLines"
      :key="'h'+i"
      :x1="l.x1" :y1="l.y"
      :x2="l.x2" :y2="l.y"
      stroke="black" stroke-width="2"
    />
    <line
  v-for="(l,i) in parentChildLines"
  :key="'pc'+i"
  :x1="l.x1"
  :y1="l.y1"
  :x2="l.x2"
  :y2="l.y2"
  stroke="#444"
  stroke-width="2"
/>

  </g>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  nodes: Object,   // coordinates of each node
  tree: Object,    // full tree data
});

/* 
Example nodes = {
   1: { x: 300, y: 120, w: 150, h: 100 },
   2: { x: 460, y: 120, w: 150, h: 100 }
}
*/

function center(node) {
  return {
    cx: node.x + node.w / 2,
    cy: node.y + node.h / 2,
    top: node.y,
    bottom: node.y + node.h,
  };
}

/* -------------------------
   1. Partner-to-Partner Lines
---------------------------- */
const partnerLines = computed(() => {
  const lines = [];

  for (const id in props.tree) {
    const person = props.tree[id];
    if (!person.partners || !person.partners.length) continue;

    const p2 = person.partners[0];
    if (!props.nodes[id] || !props.nodes[p2]) continue;

    const A = center(props.nodes[id]);
    const B = center(props.nodes[p2]);

    lines.push({
      x1: A.cx,
      y1: A.cy,
      x2: B.cx,
      y2: B.cy,
    });
  }
  return lines;
});

/* -------------------------
   2. Parent → Child Lines (Style A)
---------------------------- */

const parentVerticalLines = computed(() => {
  const lines = [];

  for (const id in props.tree) {
    const parent = props.tree[id];
    if (!parent.children || !parent.children.length) continue;

    const pNode = props.nodes[id];
    if (!pNode) continue;

    const P = center(pNode);

    parent.children.forEach(childId => {
      const cNode = props.nodes[childId];
      if (!cNode) return;

      const C = center(cNode);

      // vertical line from parent bottom to midway toward child top
      lines.push({
        x: P.cx,
        y1: P.bottom,
        y2: C.top,
      });
    });
  }
  return lines;
});

const parentHorizontalLines = computed(() => {
  const lines = [];

  for (const id in props.tree) {
    const parent = props.tree[id];
    if (!parent.children || parent.children.length < 2) continue;

    const pNode = props.nodes[id];
    if (!pNode) continue;

    const childCenters = parent.children
      .map(cid => props.nodes[cid])
      .filter(Boolean)
      .map(center);

    if (childCenters.length < 2) continue;

    const min = Math.min(...childCenters.map(c => c.cx));
    const max = Math.max(...childCenters.map(c => c.cx));

    const parentCenter = center(pNode);

    // branch horizontal line
    lines.push({
      x1: min,
      x2: max,
      y: childCenters[0].top, // all children aligned
    });
  }

  return lines;
});

const parentChildLines = computed(() => {
  const lines = [];

  for (const id in props.tree) {
    const parent = props.tree[id];
    if (!parent.children?.length) continue;

    const p = props.nodes[id];
    if (!p) continue;

    const parentBottomX = p.x + p.w / 2;
    const parentBottomY = p.y + p.h;

    // midpoint Y
    const midY = parentBottomY + 20;

    // vertical down from parent
    lines.push({
      x1: parentBottomX,
      y1: parentBottomY,
      x2: parentBottomX,
      y2: midY
    });

    const childXs = parent.children
      .map(cid => props.nodes[cid])
      .filter(Boolean)
      .map(c => c.x + c.w / 2);

    if (childXs.length > 1) {
      // horizontal T bar
      lines.push({
        x1: Math.min(...childXs),
        y1: midY,
        x2: Math.max(...childXs),
        y2: midY
      });
    }

    // vertical down to each child
    parent.children.forEach(cid => {
      const c = props.nodes[cid];
      if (!c) return;

      lines.push({
        x1: c.x + c.w / 2,
        y1: midY,
        x2: c.x + c.w / 2,
        y2: c.y
      });
    });
  }

  return lines;
});

</script>
