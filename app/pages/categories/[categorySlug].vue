<script setup lang="ts">
const route = useRoute()
const categorySlug = route.params.categorySlug as string
const projectsNetwork =
  inject<Ref<ProjectsNetworkQueryResult | null>>('projectsNetwork')
const title = computed(
  () =>
    projectsNetwork?.value?.categories?.find(
      (category) => category.slug === categorySlug,
    )?.name || '',
)
</script>

<template>
  <div>{{ title }}</div>
</template>
