<script setup lang="ts">
const route = useRoute()
const view = computed(() => route.query.view as string)
</script>

<template>
  <div>
    <header>
      <!-- <h1>GMC Prototype</h1> -->
      <nav>
        <NuxtLink to="?view=tree">Tree</NuxtLink>
        <NuxtLink to="?view=constellation">Constellation</NuxtLink>
      </nav>
    </header>
    <slot />
    <ProjectsTree v-show="view === 'tree'" />
    <ProjectsConstellation v-show="view === 'constellation' || !view" />
  </div>
</template>

<style scoped>
header {
  display: flex;
  justify-content: center;
  align-items: center;
}
nav {
  display: flex;
  gap: 1rem;
}
a {
  text-decoration: none;
}
</style>
