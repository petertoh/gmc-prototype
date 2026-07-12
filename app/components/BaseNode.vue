<template>
  <NuxtLink
    :to="link.to"
    class="node"
    :class="[
      `node--${nodeType}`,
      {
        't-label': !['category', 'project', 'work', 'relatedProject'].includes(
          nodeType,
        ),
      },
    ]"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  link: any
  nodeType: string
}>()
</script>

<style scoped>
.node {
  display: inline-block;
  color: black;
  white-space: nowrap;
  &:hover,
  .node-selected & {
    background-color: blue;
    color: white;
    border-color: blue;
  }
}
.node--category {
  background-color: black;
  border-color: black;
  color: white;
}
.node--project {
  background-color: #525252;
  color: white;
  border-color: black;
}
.node--work {
  background-color: #d2d2d2;
}
.node--relatedProject {
  background-color: white;
}
.node--year {
  background-color: #e8e8e8;
}

.node--workForm {
  background-color: #ececec;
  border-color: rgb(201, 201, 201);
}
.node--workMedium {
  color: rgb(119, 119, 119);
  border-color: rgb(199, 199, 199);
}
</style>
