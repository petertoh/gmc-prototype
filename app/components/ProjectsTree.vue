<script setup lang="ts">
const data = inject<Ref<ProjectsNetworkQueryResult | null>>('projectsNetwork')
const tree = computed(() => {
  return data?.value?.categories?.map((category) => {
    return {
      ...category,
      projects: data?.value?.projects?.filter((project) =>
        project.category?.some((cat) => cat.slug === category.slug),
      ),
    }
  })
})
</script>

<template>
  <nav v-if="data && tree?.length">
    <ul>
      <li v-for="category in tree" :key="category.slug">
        <BaseNode
          :link="{ to: `?category=${category.slug}` }"
          :node-type="category._type"
          >{{ category.name }}</BaseNode
        >
        <ul v-if="category.projects?.length">
          <li v-for="project in category.projects" :key="project._id">
            <WorkCard :work="project" sub-path="projects" />

            <ul v-if="project.works?.length">
              <li v-for="work in project.works" :key="work._id">
                <WorkCard :work="work" sub-path="work" />

                <ul v-if="work.related?.length">
                  <li
                    v-for="relatedWork in work.related"
                    :key="relatedWork._id"
                  >
                    <WorkCard :work="relatedWork" sub-path="related" />
                  </li>
                </ul>
              </li>
            </ul>
            <ul v-if="project.related?.length">
              <li v-for="relatedWork in project.related" :key="relatedWork._id">
                <WorkCard :work="relatedWork" sub-path="related" />
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
