<script setup lang="ts">
import { projectsNetworkQuery } from '~/assets/groq/projectsNetworkQuery'
const { data, error } =
  await useSanityQuery<ProjectsNetworkQueryResult>(projectsNetworkQuery)

if (error.value) {
  console.error(error.value)
}

provide('projectsNetwork', data)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
