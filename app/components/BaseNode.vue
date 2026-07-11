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
  &:hover {
    background-color: blue;
    color: white;
    border-color: blue;
  }
}
.node--category {
  background-color: black;
  color: white;
}
.node--project {
  background-color: rgb(82, 82, 82);
  color: white;
  border-color: black;
}
.node--work {
  background-color: rgb(210, 210, 210);
}
.node--relatedProject {
  background-color: white;
}
.node--year {
  background-color: rgb(232, 232, 232);
}

.node--workForm {
  background-color: rgb(236, 236, 236);
  border-color: rgb(201, 201, 201);
}
.node--workMedium {
  color: rgb(119, 119, 119);
  border-color: rgb(199, 199, 199);
}
</style>
