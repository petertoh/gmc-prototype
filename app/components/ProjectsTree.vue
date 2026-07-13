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
        <div
          :class="{ 'node-selected': $route.query.category === category.slug }"
        >
          <BaseNode
            :link="{ to: `?category=${category.slug}` }"
            :node-type="category._type"
            >{{ category.name }}</BaseNode
          >
        </div>
        <ul v-if="category.projects?.length">
          <li v-for="project in category.projects" :key="project._id">
            <WorkCard :work="project" :inline="true" />

            <ul v-if="project.works?.length">
              <li v-for="work in project.works" :key="work._id">
                <WorkCard :work="work" :inline="true" />

                <ul v-if="work.related?.length">
                  <li
                    v-for="relatedWork in work.related"
                    :key="relatedWork._id"
                  >
                    <WorkCard :work="relatedWork" :inline="true" />
                  </li>
                </ul>
              </li>
            </ul>
            <ul v-if="project.related?.length">
              <li v-for="relatedWork in project.related" :key="relatedWork._id">
                <WorkCard :work="relatedWork" :inline="true" />
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  li & {
    padding-left: 4rem;
  }
}
li {
  padding: 0;
}
</style>
