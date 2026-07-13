<script setup lang="ts">
const data = inject<Ref<ProjectsNetworkQueryResult | null>>('projectsNetwork')
if (!data) {
  throw new Error('projectsNetwork not provided')
}

const currentCategory = computed(() => {
  return data?.value?.categories.find(
    (category) => category.slug === useRoute().query.category,
  )
})

const currentProject = computed(() => {
  return data?.value?.projects.find(
    (project) => project.slug === useRoute().query.project,
  )
})

const currentProjects = computed(() => {
  return currentCategory?.value
    ? data?.value?.projects.filter((project) =>
        project.category?.some(
          (category) => category.slug === currentCategory?.value?.slug,
        ),
      )
    : currentWorkForm.value
      ? data?.value?.projects.filter((project) =>
          project.workForm?.some(
            (form) => form.slug === useRoute().query.workForm,
          ),
        )
      : []
})

const currentWorks = computed(() => {
  return currentProject?.value
    ? currentProject.value.works?.filter(
        (work) => work.slug === currentProject?.value?.slug,
      )
    : currentWorkForm.value
      ? data?.value?.projects
          .filter((project) =>
            project.works?.some((work) =>
              work.workForm?.some(
                (form) => form.slug === useRoute().query.workForm,
              ),
            ),
          )
          .flatMap((project) => project.works ?? [])
      : []
})

const currentWork = computed(() => {
  return data?.value?.projects
    .filter((project) =>
      project.works?.some((work) => work.slug === useRoute().query.work),
    )
    .flatMap((project) => project.works ?? [])
    .find((work) => work.slug === useRoute().query.work)
})

const currentRelatedWorks = computed(() => {
  return currentProject?.value
    ? (currentProject.value.related ?? [])
    : currentWork?.value
      ? (currentWork.value.related ?? [])
      : []
})

const currentWorkForm = computed(() => {
  return data?.value?.projects
    .filter(
      (project) =>
        project.workForm?.some(
          (form) => form.slug === useRoute().query.workForm,
        ) ||
        project.works?.some((work) =>
          work.workForm?.some(
            (form) => form.slug === useRoute().query.workForm,
          ),
        ),
    )
    .find((project) =>
      project.workForm?.some((form) => form.slug === useRoute().query.workForm),
    )
    ?.workForm?.find((form) => form.slug === useRoute().query.workForm)
})
</script>

<template>
  <div class="projects-sidebar">
    <div v-if="currentCategory">
      <div class="node-selected">
        <BaseNode
          :link="{ to: `?category=${currentCategory?.slug}` }"
          :node-type="currentCategory?._type"
        >
          {{ currentCategory?.name }}
        </BaseNode>
      </div>
      <div
        v-if="currentCategory?.description"
        class="projects-sidebar__category-description"
      >
        <SanityContent :value="currentCategory.description" />
      </div>
    </div>
    <div v-if="currentWorkForm">
      <div class="node-selected">
        <BaseNode
          :link="{ to: `?workForm=${currentWorkForm?.slug}` }"
          :node-type="currentWorkForm._type"
        >
          {{ currentWorkForm?.name }}
        </BaseNode>
      </div>
    </div>
    <div v-if="currentProject">
      <WorkCard :work="currentProject" />
    </div>
    <div v-if="currentProjects?.length">
      <!-- <h3>Projects</h3> -->
      <ul>
        <li v-for="project in currentProjects" :key="project._id">
          <!-- <h3>{{ project.title }}</h3> -->
          <WorkCard :work="project" />
          <!-- <p v-if="project.description">
            <SanityContent :value="project.description" />
          </p> -->
        </li>
      </ul>
    </div>
    <div v-if="currentWorks?.length">
      <!-- <h3>Works</h3> -->
      <ul>
        <li v-for="work in currentWorks" :key="work._id">
          <!-- <h3>{{ work.title }}</h3> -->
          <WorkCard :work="work" />
          <!-- <p v-if="work.description">
            <SanityContent :value="work.description" />
          </p> -->
        </li>
      </ul>
    </div>
    <div v-if="currentWork">
      <!-- <h3>Current Work</h3> -->
      <WorkCard :work="currentWork" />
    </div>
    <div v-if="currentRelatedWorks?.length">
      <!-- <h3>Related Works</h3> -->
      <ul>
        <li v-for="work in currentRelatedWorks" :key="work._id">
          <!-- <h3>{{ work.title }}</h3> -->
          <WorkCard :work="work" />
          <!-- <p v-if="work.description">
            <SanityContent :value="work.description" />
          </p> -->
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.projects-sidebar__category-description {
  margin: 0.25rem;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  border-top: 1px solid;
  padding: 1rem 0;
}
</style>
