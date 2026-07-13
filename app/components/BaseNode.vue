<template>
  <NuxtLink
    :to="link.to"
    class="node"
    :class="[
      `node--${nodeType}`,
      {
        't-label': !['category', 'project', 'work', 'year'].includes(nodeType),
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
  background-color: #4c4c4c;
  color: white;
  border-color: #4c4c4c;
}
.node--work {
  background-color: rgb(247, 247, 255);
}
.node--relatedProject {
  background-color: #ffe7e7;
  border-color: #ffe7e7;
}
.node--year {
  background-color: #e8e8e8;
  border-color: #e8e8e8;
  /* border-radius: 0.5em; */
}

.node--workForm {
  background-color: #ececec;
  border-color: #ececec;
  /* border-radius: 0.5em; */
}
.node--workMedium {
  color: rgb(119, 119, 119);
  border-color: rgb(119, 119, 119);
  /* border-radius: 0.5em; */
}
.node--artist {
  background-color: #ffffff;
  border-color: #ffffff;
}
</style>
